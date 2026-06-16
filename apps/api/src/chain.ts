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

// Non-batching client for the stateless on-chain scan (serverless API). viem's
// JSON-RPC request batching breaks multi-address eth_getLogs on Infura (the batched
// Transfer query comes back unmapped -> "Cannot read properties of undefined").
// The scan issues only a handful of getLogs per request, so batching buys nothing.
export const scanClient = createPublicClient({
  chain: sepolia,
  transport: http(config.rpcUrl || undefined, {
    retryCount: 5,
    retryDelay: 800,
    timeout: 20_000,
    batch: false,
  }),
});
