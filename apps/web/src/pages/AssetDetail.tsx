import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAsset } from "../hooks/useAssets";
import { fetchPriceHistory } from "../lib/api";
import { formatPrice, formatToken, formatUsd } from "../lib/format";
import { Reveal } from "../components/motion";
import { staggerContainer, staggerItem } from "../components/motion-variants";

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
      <Link
        to="/"
        className="group inline-flex items-center gap-1 text-sm text-cream/50 transition hover:text-gold-300"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span> All
        assets
      </Link>

      <Reveal className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold">{asset.assetName}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="pill">{asset.category}</span>
            <span className="text-sm text-cream/50">
              {asset.symbol} · ref {asset.referenceSymbol}
            </span>
          </div>
        </div>
        <Link to={`/trade/${asset.symbol}`} className="btn-gold px-5 py-2.5">
          Mint / Redeem
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <p className="max-w-3xl text-cream/70">{asset.description}</p>
      </Reveal>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Stat label="Current Price" value={formatPrice(asset.price)} accent />
        <Stat label="Total Reserve" value={`${formatToken(asset.reserve)} ${asset.unit}`} />
        <Stat label="Circulating Supply" value={`${formatToken(asset.totalSupply)} ${asset.symbol}`} />
      </motion.div>

      <Reveal delay={0.1} className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg">Price History</h2>
          <span className="text-xs text-cream/40">Mock series (demo)</span>
        </div>
        {isError ? (
          <p className="py-12 text-center text-sm text-cream/50">
            Price history unavailable. Is the API running on{" "}
            <code className="text-gold-300">/price-history</code>?
          </p>
        ) : !history || history.length === 0 ? (
          <p className="py-12 text-center text-sm text-cream/50">No price points yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d9b945" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d9b945" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1b3a2a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={(t: number) => new Date(t * 1000).toLocaleDateString()}
                stroke="#8aa394"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#8aa394"
                fontSize={11}
                tickFormatter={(v: number) => formatUsd(v, { compact: true })}
                domain={["auto", "auto"]}
                width={60}
                tickLine={false}
                axisLine={false}
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
              <Area
                type="monotone"
                dataKey="price"
                stroke="#d9b945"
                strokeWidth={2.5}
                fill="url(#priceFill)"
                dot={false}
                activeDot={{ r: 4, fill: "#e7cd73", stroke: "#08110d", strokeWidth: 2 }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Reveal>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      variants={staggerItem}
      className="card accent-top !p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/30"
    >
      <div className="text-xs uppercase tracking-wide text-cream/40">{label}</div>
      <div className={`mt-1 font-serif text-2xl ${accent ? "text-gold-gradient" : "text-cream"}`}>
        {value}
      </div>
    </motion.div>
  );
}
