import { isAddress } from "viem";
import { ASSET_BY_ADDRESS, ASSET_BY_SYMBOL, type AssetSymbol } from "@commodifi/contracts-abi";

/** Resolve a token address or symbol (tGOLD/tNKL/tCPO/tCOAL) to a lowercased address. */
export function resolveToken(input: string): string | null {
  if (isAddress(input)) {
    return ASSET_BY_ADDRESS[input.toLowerCase()]?.address.toLowerCase() ?? input.toLowerCase();
  }
  const bySymbol = ASSET_BY_SYMBOL[input as AssetSymbol];
  return bySymbol ? bySymbol.address.toLowerCase() : null;
}
