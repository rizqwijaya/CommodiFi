import { parseAbiItem, type Log } from "viem";
import { addresses, ASSETS } from "@commodifi/contracts-abi";
import { publicClient } from "./chain";
import type { EventRow } from "./types";

// Stateless on-chain scan: the same log decoding the indexer uses, but it returns
// rows instead of writing them to SQLite. Used by the serverless API (Netlify
// Functions) where there's no long-running process or persistent DB.

// Event signatures (must match the deployed contracts).
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

/**
 * Scan [fromBlock, toBlock] for all CommodiFi events and return decoded rows.
 * Unlike the indexer's scanRange, this writes nothing — the caller (a serverless
 * function) just serializes the result. Block times are resolved only for
 * PriceUpdate rows (the chart needs them); everything else is estimated to keep
 * the RPC call count low under free tiers + the 10s function timeout.
 */
export async function scanRows(fromBlock: bigint, toBlock: bigint): Promise<EventRow[]> {
  const rows: EventRow[] = [];

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

  // Resolve real timestamps for PriceUpdate blocks (chart needs them); estimate the
  // rest from any resolved (block -> time) anchor assuming ~12s Sepolia blocks.
  const priceBlocks = [
    ...new Set(rows.filter((r) => r.type === "PriceUpdate").map((r) => BigInt(r.block_number))),
  ];
  const blockTimes = new Map<number, number>();
  for (const b of priceBlocks) {
    try {
      const block = await publicClient.getBlock({ blockNumber: b });
      blockTimes.set(Number(b), Number(block.timestamp));
    } catch {
      // ignore; falls back to estimate below
    }
  }
  const anchor = [...blockTimes.entries()][0];
  for (const r of rows) {
    const exact = blockTimes.get(r.block_number);
    if (exact !== undefined) {
      r.block_time = exact;
    } else if (anchor) {
      r.block_time = anchor[1] + (r.block_number - anchor[0]) * 12;
    } else {
      r.block_time = Math.floor(Date.now() / 1000);
    }
  }

  return rows;
}

/**
 * Scan the most recent `lookback` blocks in chunks and return all rows, newest
 * first. chunkSize defaults high (free RPC tiers still allow wide ranges for
 * small windows); callers tune it for their endpoint.
 */
export async function scanRecent(
  lookback: bigint,
  chunkSize: bigint,
): Promise<EventRow[]> {
  const latest = await publicClient.getBlockNumber();
  const start = latest > lookback ? latest - lookback : 0n;
  const rows: EventRow[] = [];
  let from = start;
  while (from <= latest) {
    const to = from + chunkSize - 1n > latest ? latest : from + chunkSize - 1n;
    rows.push(...(await scanRows(from, to)));
    from = to + 1n;
  }
  rows.sort((a, b) =>
    b.block_number - a.block_number || b.log_index - a.log_index,
  );
  return rows;
}
