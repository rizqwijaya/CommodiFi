import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ASSET_BY_ADDRESS } from "@commodifi/contracts-abi";
import { fetchEvents, type ApiEvent } from "../lib/api";

export interface ActivityItem {
  type: string;
  symbol: string;
  amount: string | null;
  time: number | null;
  txHash: string;
}

/**
 * Recent on-chain activity (Deposit / Redeem / Transfer) for the connected wallet,
 * pulled from the indexer API. Fails soft, returns [] if the API is unreachable.
 */
export function useActivity(limit = 6) {
  const { address } = useAccount();

  const query = useQuery({
    queryKey: ["activity", address],
    queryFn: () => fetchEvents({ address: address! }),
    enabled: Boolean(address),
    refetchInterval: 20_000,
    retry: 0,
  });

  const items: ActivityItem[] = (query.data ?? [])
    .filter((e: ApiEvent) => e.type === "Deposit" || e.type === "Redeem")
    .slice(0, limit)
    .map((e) => ({
      type: e.type,
      symbol: e.token ? (ASSET_BY_ADDRESS[e.token.toLowerCase()]?.symbol ?? "?") : "?",
      amount: e.amount,
      time: e.block_time,
      txHash: e.tx_hash,
    }));

  return { items, isLoading: query.isLoading, isError: query.isError };
}
