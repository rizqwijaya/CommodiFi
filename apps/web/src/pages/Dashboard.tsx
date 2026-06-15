import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatPrice, formatToken, formatUsd } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";
import { AnimatedNumber, Reveal } from "../components/motion";
import { staggerContainer, staggerItem } from "../components/motion-variants";

const COLORS = ["#d9b945", "#2f6b4c", "#c9a227", "#235039"];

export function Dashboard() {
  const { entries, totalUsd, isConnected } = usePortfolio();

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card-hover accent-top mx-auto max-w-md text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10 text-2xl">
          🔐
        </div>
        <h2 className="font-serif text-2xl font-bold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-cream/70">
          Connect to view your CommodiFi balances and portfolio value.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </motion.div>
    );
  }

  const allocation = entries
    .filter((e) => e.valueUsd > 0)
    .map((e) => ({ name: e.symbol, value: e.valueUsd }));

  return (
    <div className="space-y-8">
      <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold">Dashboard</h1>
          <p className="text-sm text-cream/60">Your tokenized commodity portfolio</p>
        </div>
        <div className="card accent-top relative overflow-hidden !p-5 text-right">
          <div className="text-xs uppercase tracking-wide text-cream/40">Total Portfolio Value</div>
          <div className="font-serif text-4xl text-gold-gradient">
            <AnimatedNumber value={totalUsd} format={(n) => formatUsd(n)} />
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balances */}
        <div className="lg:col-span-2">
          <Reveal className="card">
            <h2 className="mb-4 font-serif text-lg">Balances</h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {entries.map((e) => (
                <motion.div
                  key={e.symbol}
                  variants={staggerItem}
                  className="flex items-center justify-between rounded-xl border border-forest-800/60 bg-forest-950/30 px-4 py-3 transition-all duration-200 hover:border-gold-400/30 hover:bg-forest-800/40"
                >
                  <div>
                    <div className="font-semibold">{e.symbol}</div>
                    <div className="text-xs text-cream/50">
                      {e.price > 0n ? formatPrice(e.price) : "-"} / unit
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatToken(e.balance)}</div>
                    <div className="text-xs text-gold-300">{formatUsd(e.valueUsd)}</div>
                  </div>
                  <Link to={`/trade/${e.symbol}`} className="btn-outline ml-4 !py-1.5 !text-xs">
                    Trade
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        </div>

        {/* Allocation chart */}
        <Reveal delay={0.1} className="card">
          <h2 className="mb-2 font-serif text-lg">Allocation</h2>
          {allocation.length === 0 ? (
            <p className="py-12 text-center text-sm text-cream/50">
              No holdings yet. Mint some assets to see your allocation.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  animationDuration={800}
                >
                  {allocation.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatUsd(v)}
                  contentStyle={{
                    background: "#0d1b14",
                    border: "1px solid #1b3a2a",
                    borderRadius: 8,
                    color: "#f5f1e6",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Reveal>
      </div>
    </div>
  );
}
