import "dotenv/config";

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  rpcUrl: process.env.SEPOLIA_RPC_URL ?? "",
  port: num("PORT", 4000),
  startBlock: BigInt(process.env.START_BLOCK ?? "0"),
  indexLookback: BigInt(num("INDEX_LOOKBACK", 50_000)),
  dbPath: process.env.DB_PATH ?? "./data/commodifi.sqlite",
  pollIntervalMs: num("POLL_INTERVAL_MS", 12_000),
  // Max block span per eth_getLogs request. Public/free RPC tiers (e.g. Alchemy free)
  // cap this at 10 blocks; paid tiers allow far more. Default to the safe 10.
  logChunkSize: BigInt(num("LOG_CHUNK_SIZE", 10)),
};

if (!config.rpcUrl) {
  console.warn(
    "[config] SEPOLIA_RPC_URL not set. Indexer disabled, live on-chain reads will fail. Copy apps/api/.env.example to apps/api/.env.",
  );
}
