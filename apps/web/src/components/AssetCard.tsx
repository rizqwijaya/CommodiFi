import { Link } from "react-router-dom";
import type { AssetWithData } from "../hooks/useAssets";
import { formatPrice, formatToken } from "../lib/format";

export function AssetCard({ asset }: { asset: AssetWithData }) {
  return (
    <Link
      to={`/asset/${asset.symbol}`}
      className="card group transition hover:border-gold-400/60 hover:shadow-gold-500/10"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{asset.icon}</span>
          <div>
            <div className="font-semibold">{asset.symbol}</div>
            <div className="text-sm text-cream/60">{asset.assetName}</div>
          </div>
        </div>
        <span className="pill">{asset.category}</span>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-cream/40">Price</div>
          <div className="font-serif text-2xl text-gold-300">
            {asset.price > 0n ? formatPrice(asset.price) : "-"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-cream/40">Reserve</div>
          <div className="text-sm text-cream/80">
            {formatToken(asset.reserve)} {asset.unit}
          </div>
        </div>
      </div>
    </Link>
  );
}
