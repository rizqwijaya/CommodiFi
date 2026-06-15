import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { config } from "./config";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(config.rpcUrl || undefined, {
    // Free RPC tiers throttle aggressively. Let viem retry 429s with backoff
    // and batch eth_calls so the indexer doesn't hammer the endpoint.
    retryCount: 5,
    retryDelay: 800,
    timeout: 20_000,
    batch: true,
  }),
});
