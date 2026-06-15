import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAsset } from "../hooks/useAssets";
import { fetchPriceHistory } from "../lib/api";
import { formatPrice, formatToken, formatUsd } from "../lib/format";

export function AssetDetail() {
  const { symbol = "" } = useParams();
  const asset = useAsset(symbol);

  const { data: history, isError } = useQuery({
    queryKey: ["price-history", symbol],
    queryFn: () => fetchPriceHistory(symbol),
    enabled: Boolean(symbol),
    retry: 1,
  });

  if (!asset) {
    return <div className="card text-center text-cream/60">Unknown asset.</div>;
  }

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm text-cream/50 hover:text-gold-300">
        ← All assets
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{asset.icon}</span>
          <div>
            <h1 className="font-serif text-3xl font-bold">{asset.assetName}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span className="pill">{asset.category}</span>
              <span className="text-sm text-cream/50">
                {asset.symbol} · ref {asset.referenceSymbol}
              </span>
            </div>
          </div>
        </div>
        <Link to={`/trade/${asset.symbol}`} className="btn-gold">
          Mint / Redeem
        </Link>
      </div>

      <p className="max-w-3xl text-cream/70">{asset.description}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Current Price" value={formatPrice(asset.price)} accent />
        <Stat label="Total Reserve" value={`${formatToken(asset.reserve)} ${asset.unit}`} />
        <Stat label="Circulating Supply" value={`${formatToken(asset.totalSupply)} ${asset.symbol}`} />
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg">Price History</h2>
          <span className="text-xs text-cream/40">Mock series (demo)</span>
        </div>
        {isError ? (
          <p className="py-12 text-center text-sm text-cream/50">
            Price history unavailable — is the API running on{" "}
            <code className="text-gold-300">/price-history</code>?
          </p>
        ) : !history || history.length === 0 ? (
          <p className="py-12 text-center text-sm text-cream/50">No price points yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1b3a2a" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(t: number) => new Date(t * 1000).toLocaleDateString()}
                stroke="#8aa394"
                fontSize={11}
              />
              <YAxis
                stroke="#8aa394"
                fontSize={11}
                tickFormatter={(v: number) => formatUsd(v, { compact: true })}
                domain={["auto", "auto"]}
                width={60}
              />
              <Tooltip
                labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleString()}
                formatter={(v: number) => [formatUsd(v), "Price"]}
                contentStyle={{
                  background: "#0d1b14",
                  border: "1px solid #1b3a2a",
                  borderRadius: 8,
                  color: "#f5f1e6",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#d9b945"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card !p-5">
      <div className="text-xs uppercase tracking-wide text-cream/40">{label}</div>
      <div className={`mt-1 font-serif text-2xl ${accent ? "text-gold-300" : "text-cream"}`}>
        {value}
      </div>
    </div>
  );
}
