import { useAccount, useReadContracts } from "wagmi";
import { ASSETS, rwaTokenAbi } from "@commodifi/contracts-abi";
import { useAssets } from "./useAssets";
import { tokenValueUsd } from "../lib/format";

export interface PortfolioEntry {
  symbol: string;
  address: `0x${string}`;
  icon: string;
  balance: bigint;
  price: bigint;
  valueUsd: number;
}

/** User's balance across all 4 tokens + USD valuation (prices from useAssets). */
export function usePortfolio() {
  const { address } = useAccount();
  const { assets } = useAssets();

  const balQuery = useReadContracts({
    contracts: ASSETS.map(
      (a) =>
        ({
          address: a.address,
          abi: rwaTokenAbi,
          functionName: "balanceOf",
          args: [address ?? "0x0000000000000000000000000000000000000000"],
        }) as const,
    ),
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const entries: PortfolioEntry[] = ASSETS.map((a, i) => {
    const balance = (balQuery.data?.[i]?.result as bigint | undefined) ?? 0n;
    const price = assets[i]?.price ?? 0n;
    return {
      symbol: a.symbol,
      address: a.address,
      icon: a.icon,
      balance,
      price,
      valueUsd: tokenValueUsd(balance, price),
    };
  });

  const totalUsd = entries.reduce((sum, e) => sum + e.valueUsd, 0);

  return {
    entries,
    totalUsd,
    isConnected: Boolean(address),
    isLoading: balQuery.isLoading,
    refetch: balQuery.refetch,
  };
}
