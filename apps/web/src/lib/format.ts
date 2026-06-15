import { formatUnits } from "viem";
import { PRICE_DECIMALS } from "@commodifi/contracts-abi";

/** Format an 8-decimal oracle price string/bigint to a USD string. */
export function formatPrice(price: bigint | string, opts?: { compact?: boolean }): string {
  const v = Number(formatUnits(BigInt(price), PRICE_DECIMALS));
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(v);
}

/** Format an 18-decimal token amount to a trimmed decimal string. */
export function formatToken(amount: bigint | string, maxFrac = 4): string {
  const v = Number(formatUnits(BigInt(amount), 18));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(v);
}

/** USD value of a token amount given an 8-dec price. */
export function tokenValueUsd(amount: bigint, price: bigint): number {
  // amount(1e18) * price(1e8) / 1e18 -> 1e8 scaled; divide to float.
  return Number((amount * price) / 10n ** 18n) / 1e8;
}

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value);
}

export function shortAddress(addr?: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
