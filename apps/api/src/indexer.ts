import { parseAbiItem, type Log } from "viem";
import { addresses, ASSETS } from "@commodifi/contracts-abi";
import { publicClient } from "./chain";
import { config } from "./config";
import { getCursor, insertEvents, setCursor, type EventRow } from "./db";

// Event signatures we index (must match the deployed contracts).
const depositEvent = parseAbiItem(
  "event Deposit(address indexed user, address indexed token, uint256 amount, uint256 newReserve)",
);
const redeemEvent = parseAbiItem(
  "event Redeem(address indexed user, address indexed token, uint256 amount, uint256 newReserve)",
);
const priceUpdateEvent = parseAbiItem(
  "event PriceUpdated(address indexed token, uint256 price, uint256 updatedAt)",
);
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const TOKEN_ADDRESSES = ASSETS.map((a) => a.address);

const blockTimeCache = new Map<bigint, number>();

async function blockTime(blockNumber: bigint): Promise<number | null> {
  if (blockTimeCache.has(blockNumber)) return blockTimeCache.get(blockNumber)!;
  try {
    const block = await publicClient.getBlock({ blockNumber });
    const t = Number(block.timestamp);
    blockTimeCache.set(blockNumber, t);
    return t;
  } catch {
    return null;
  }
}

/**
 * Cheap fallback timestamp for non-PriceUpdate events: extrapolate from any cached
 * (block -> time) pair assuming ~12s Sepolia block time, else just use "now".
 */
function estimateBlockTime(blockNumber: number): number {
  const anchor = [...blockTimeCache.entries()][0];
  if (anchor) {
    const [anchorBlock, anchorTime] = anchor;
    return anchorTime + (blockNumber - Number(anchorBlock)) * 12;
  }
  return Math.floor(Date.now() / 1000);
}

type AnyLog = Log<bigint, number, false>;

function baseRow(log: AnyLog, type: EventRow["type"]): EventRow {
  return {
    type,
    token: null,
    from_addr: null,
    to_addr: null,
    amount: null,
    price: null,
    reserve: null,
    block_number: Number(log.blockNumber),
    block_time: null,
    tx_hash: log.transactionHash,
    log_index: log.logIndex,
  };
}

async function scanRange(fromBlock: bigint, toBlock: bigint): Promise<number> {
  const rows: EventRow[] = [];

  // Vault: Deposit + Redeem
  const deposits = await publicClient.getLogs({
    address: addresses.vault as `0x${string}`,
    event: depositEvent,
    fromBlock,
    toBlock,
  });
  for (const log of deposits) {
    const r = baseRow(log, "Deposit");
    r.from_addr = (log.args.user ?? "").toLowerCase() || null;
    r.token = (log.args.token ?? "").toLowerCase() || null;
    r.amount = log.args.amount?.toString() ?? null;
    r.reserve = log.args.newReserve?.toString() ?? null;
    rows.push(r);
  }

  const redeems = await publicClient.getLogs({
    address: addresses.vault as `0x${string}`,
    event: redeemEvent,
    fromBlock,
    toBlock,
  });
  for (const log of redeems) {
    const r = baseRow(log, "Redeem");
    r.from_addr = (log.args.user ?? "").toLowerCase() || null;
    r.token = (log.args.token ?? "").toLowerCase() || null;
    r.amount = log.args.amount?.toString() ?? null;
    r.reserve = log.args.newReserve?.toString() ?? null;
    rows.push(r);
  }

  // Oracle: PriceUpdated
  const priceUpdates = await publicClient.getLogs({
    address: addresses.priceOracle as `0x${string}`,
    event: priceUpdateEvent,
    fromBlock,
    toBlock,
  });
  for (const log of priceUpdates) {
    const r = baseRow(log, "PriceUpdate");
    r.token = (log.args.token ?? "").toLowerCase() || null;
    r.price = log.args.price?.toString() ?? null;
    rows.push(r);
  }

  // Tokens: Transfer (all 4 in one filtered call)
  const transfers = await publicClient.getLogs({
    address: TOKEN_ADDRESSES as `0x${string}`[],
    event: transferEvent,
    fromBlock,
    toBlock,
  });
  for (const log of transfers) {
    const r = baseRow(log, "Transfer");
    r.token = log.address.toLowerCase();
    r.from_addr = (log.args.from ?? "").toLowerCase() || null;
    r.to_addr = (log.args.to ?? "").toLowerCase() || null;
    r.amount = log.args.value?.toString() ?? null;
    rows.push(r);
  }

  // Only PriceUpdate rows need an accurate timestamp (for the price chart). Resolve
  // those block times; everything else gets a best-effort estimate. This keeps the
  // request volume low so free RPC tiers don't 429 us.
  const priceBlocks = [...new Set(rows.filter((r) => r.type === "PriceUpdate").map((r) => BigInt(r.block_number)))];
  for (const b of priceBlocks) {
    await blockTime(b); // sequential + cached; viem retries 429 with backoff
  }
  for (const r of rows) {
    r.block_time = blockTimeCache.get(BigInt(r.block_number)) ?? estimateBlockTime(r.block_number);
  }

  if (rows.length) insertEvents(rows);
  return rows.length;
}

async function resolveStartBlock(): Promise<bigint> {
  const cursor = getCursor();
  if (cursor !== null) return cursor + 1n;
  if (config.startBlock > 0n) return config.startBlock;
  const latest = await publicClient.getBlockNumber();
  const lookback = config.indexLookback;
  return latest > lookback ? latest - lookback : 0n;
}

let running = false;

export async function runIndexerTick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const latest = await publicClient.getBlockNumber();
    let from = await resolveStartBlock();
    if (from > latest) return;

    let total = 0;
    while (from <= latest) {
      const to = from + config.logChunkSize - 1n > latest ? latest : from + config.logChunkSize - 1n;
      total += await scanRange(from, to);
      setCursor(to);
      from = to + 1n;
    }
    if (total > 0) console.log(`[indexer] indexed ${total} event(s) up to block ${latest}`);
  } catch (err) {
    console.error("[indexer] tick failed:", (err as Error).message);
  } finally {
    running = false;
  }
}

export function startIndexer(): void {
  if (!config.rpcUrl) {
    console.warn("[indexer] no RPC URL, not starting.");
    return;
  }
  console.log("[indexer] starting; polling every", config.pollIntervalMs, "ms");
  void runIndexerTick();
  setInterval(() => void runIndexerTick(), config.pollIntervalMs);
}
