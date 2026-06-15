import { useReadContracts } from "wagmi";
import {
  ASSETS,
  addresses,
  commodiFiVaultAbi,
  priceOracleAbi,
  rwaTokenAbi,
  type AssetMeta,
} from "@commodifi/contracts-abi";

export interface AssetWithData extends AssetMeta {
  price: bigint; // 8-dec
  reserve: bigint; // 18-dec
  totalSupply: bigint; // 18-dec
}

/** Live price + reserve + totalSupply for all 4 assets, via a single multicall. */
export function useAssets() {
  const contracts = ASSETS.flatMap((a) => [
    {
      address: addresses.priceOracle as `0x${string}`,
      abi: priceOracleAbi,
      functionName: "getPrice",
      args: [a.address],
    } as const,
    {
      address: addresses.vault as `0x${string}`,
      abi: commodiFiVaultAbi,
      functionName: "reserveOf",
      args: [a.address],
    } as const,
    {
      address: a.address,
      abi: rwaTokenAbi,
      functionName: "totalSupply",
      args: [],
    } as const,
  ]);

  const query = useReadContracts({
    contracts,
    query: { refetchInterval: 15_000 },
  });

  const assets: AssetWithData[] = ASSETS.map((a, i) => {
    const price = query.data?.[i * 3]?.result as bigint | undefined;
    const reserve = query.data?.[i * 3 + 1]?.result as bigint | undefined;
    const supply = query.data?.[i * 3 + 2]?.result as bigint | undefined;
    return {
      ...a,
      price: price ?? 0n,
      reserve: reserve ?? 0n,
      totalSupply: supply ?? 0n,
    };
  });

  return { assets, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}

export function useAsset(symbol: string): AssetWithData | undefined {
  const { assets } = useAssets();
  return assets.find((a) => a.symbol === symbol);
}
