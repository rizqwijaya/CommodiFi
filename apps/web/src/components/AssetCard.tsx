import { Link } from "react-router-dom";
import type { AssetWithData } from "../hooks/useAssets";
import { formatPrice, formatToken } from "../lib/format";
import { AnimatedNumber } from "./motion";

export function AssetCard({ asset }: { asset: AssetWithData }) {
  const priceUsd = asset.price > 0n ? Number(asset.price) / 1e8 : 0;

  return (
    <Link to={`/asset/${asset.symbol}`} className="card-hover accent-top group block">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{asset.symbol}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-cream/30">
              {asset.referenceSymbol}
            </span>
          </div>
          <div className="text-sm text-cream/60">{asset.assetName}</div>
        </div>
        <span className="pill">{asset.category}</span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-cream/40">Price</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-gold-gradient">
              {asset.price > 0n ? (
                <AnimatedNumber value={priceUsd} format={(n) => formatPrice(BigInt(Math.round(n * 1e8)))} />
              ) : (
                "-"
              )}
            </span>
            {asset.price > 0n && <span className="text-xs font-medium text-emerald-400/90">▲</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-cream/40">Reserve</div>
          <div className="text-sm text-cream/80">
            {formatToken(asset.reserve)} {asset.unit}
          </div>
        </div>
      </div>

      {/* hover hint */}
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gold-300/0 transition-colors duration-300 group-hover:text-gold-300/90">
        View details
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </Link>
  );
}
