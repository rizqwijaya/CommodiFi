// Shared asset metadata for the 4 CommodiFi RWA tokens.
// Mirrors the on-chain RWAToken metadata + deploy-time categories (GENERAL.md §2).

import { addresses } from "./addresses";

export type AssetSymbol = "tGOLD" | "tNKL" | "tCPO" | "tCOAL";

export interface AssetMeta {
  symbol: AssetSymbol;
  address: `0x${string}`;
  assetName: string; // human-readable underlying asset
  category: string; // matches vault registration
  unit: string; // physical unit the fraction tracks
  referenceSymbol: string; // market reference symbol
  decimals: number;
  /** Emoji icon used as a lightweight placeholder in the UI. */
  icon: string;
  /** One-line description for the asset detail page. */
  description: string;
}

export const ASSETS: AssetMeta[] = [
  {
    symbol: "tGOLD",
    address: addresses.tGOLD,
    assetName: "Emas Antam (Gold)",
    category: "Precious Metal",
    unit: "gram",
    referenceSymbol: "XAU",
    decimals: 18,
    icon: "🥇",
    description:
      "Tokenized fractional claim on Emas Antam, Indonesia's benchmark refined gold. A precious-metal store of value bridging TradFi reserves and DeFi liquidity.",
  },
  {
    symbol: "tNKL",
    address: addresses.tNKL,
    assetName: "Nikel (Nickel)",
    category: "Base Metal",
    unit: "ton",
    referenceSymbol: "NICKEL",
    decimals: 18,
    icon: "⚙️",
    description:
      "Tokenized nickel, the base metal at the core of Indonesia's downstream industrialization and the global EV battery supply chain.",
  },
  {
    symbol: "tCPO",
    address: addresses.tCPO,
    assetName: "Crude Palm Oil",
    category: "Agricultural",
    unit: "ton",
    referenceSymbol: "CPO",
    decimals: 18,
    icon: "🌴",
    description:
      "Tokenized Crude Palm Oil, Indonesia's flagship agricultural export commodity, fractionalized for on-chain exposure.",
  },
  {
    symbol: "tCOAL",
    address: addresses.tCOAL,
    assetName: "Batu Bara (Coal)",
    category: "Energy Commodity",
    unit: "ton",
    referenceSymbol: "COAL",
    decimals: 18,
    icon: "⚫",
    description:
      "Tokenized thermal coal (Batu Bara), a key Indonesian energy-commodity export, represented as a fractional on-chain claim.",
  },
];

export const ASSET_BY_SYMBOL: Record<AssetSymbol, AssetMeta> = Object.fromEntries(
  ASSETS.map((a) => [a.symbol, a]),
) as Record<AssetSymbol, AssetMeta>;

export const ASSET_BY_ADDRESS: Record<string, AssetMeta> = Object.fromEntries(
  ASSETS.map((a) => [a.address.toLowerCase(), a]),
);

/** Oracle price feed decimals (Chainlink-style). */
export const PRICE_DECIMALS = 8;
