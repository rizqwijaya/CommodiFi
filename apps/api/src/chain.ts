import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { config } from "./config";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(config.rpcUrl || undefined),
});
