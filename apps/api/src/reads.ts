import {
  ASSETS,
  addresses,
  commodiFiVaultAbi,
  priceOracleAbi,
  rwaTokenAbi,
  type AssetMeta,
} from "@commodifi/contracts-abi";
import { publicClient } from "./chain";

export interface AssetLive extends AssetMeta {
  price: string; // 8-dec USD
  reserve: string; // 18-dec
  totalSupply: string; // 18-dec
}

/** Read price (oracle), reserve (vault), and totalSupply (token) for all assets. */
export async function readAssets(): Promise<AssetLive[]> {
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

  const results = await publicClient.multicall({ contracts, allowFailure: true });

  return ASSETS.map((a, i) => {
    const price = results[i * 3];
    const reserve = results[i * 3 + 1];
    const supply = results[i * 3 + 2];
    return {
      ...a,
      price: price.status === "success" ? (price.result as bigint).toString() : "0",
      reserve: reserve.status === "success" ? (reserve.result as bigint).toString() : "0",
      totalSupply: supply.status === "success" ? (supply.result as bigint).toString() : "0",
    };
  });
}

export interface PortfolioEntry {
  symbol: string;
  address: string;
  balance: string; // 18-dec
  price: string; // 8-dec USD
  valueUsd: string; // human-readable USD (2dp)
}

/** Read a user's balance across all 4 tokens + USD valuation via oracle prices. */
export async function readPortfolio(
  user: `0x${string}`,
): Promise<{ entries: PortfolioEntry[]; totalUsd: string }> {
  const live = await readAssets();

  const balContracts = ASSETS.map(
    (a) =>
      ({
        address: a.address,
        abi: rwaTokenAbi,
        functionName: "balanceOf",
        args: [user],
      }) as const,
  );
  const balResults = await publicClient.multicall({ contracts: balContracts, allowFailure: true });

  let totalCents = 0n;
  const entries: PortfolioEntry[] = ASSETS.map((a, i) => {
    const balRes = balResults[i];
    const balance = balRes.status === "success" ? (balRes.result as bigint) : 0n;
    const price = BigInt(live[i].price); // 8-dec
    // value (cents) = balance(1e18) * price(1e8) / 1e18 / 1e6  -> keep 2 decimals
    const valueCents = (balance * price) / 10n ** 18n / 10n ** 6n;
    totalCents += valueCents;
    return {
      symbol: a.symbol,
      address: a.address,
      balance: balance.toString(),
      price: price.toString(),
      valueUsd: centsToUsd(valueCents),
    };
  });

  return { entries, totalUsd: centsToUsd(totalCents) };
}

function centsToUsd(cents: bigint): string {
  const whole = cents / 100n;
  const frac = cents % 100n;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}
