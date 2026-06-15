import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatPrice, formatToken, formatUsd } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";
import { AnimatedNumber, Reveal } from "../components/motion";
import { staggerContainer, staggerItem } from "../components/motion-variants";

const COLORS = ["#d9b945", "#2f6b4c", "#c9a227", "#235039"];

// Enlarged + glowing slice for the hovered segment.
function ActiveSlice(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius = 0, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 10px ${fill})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={(outerRadius ?? 0) + 11}
        outerRadius={(outerRadius ?? 0) + 13}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.5}
      />
    </g>
  );
}

export function Dashboard() {
  const { entries, totalUsd, isConnected } = usePortfolio();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0);
  const active = activeIndex !== null ? allocation[activeIndex] : null;
  const activeColor = activeIndex !== null ? COLORS[activeIndex % COLORS.length] : undefined;

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
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      cornerRadius={5}
                      animationDuration={800}
                      activeIndex={activeIndex ?? undefined}
                      activeShape={ActiveSlice}
                      onMouseEnter={(_, i) => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {allocation.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          stroke="none"
                          className="cursor-pointer transition-opacity"
                          opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center overlay: shows hovered slice, else total */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    {active ? (
                      <motion.div
                        key={active.name}
                        initial={{ opacity: 0, scale: 0.8, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: activeColor }}
                          />
                          {active.name}
                        </div>
                        <div className="font-serif text-lg text-gold-gradient">
                          {formatUsd(active.value)}
                        </div>
                        <div className="text-xs text-cream/50">
                          {((active.value / allocTotal) * 100).toFixed(1)}%
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="total"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="text-center"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-cream/40">
                          Total
                        </div>
                        <div className="font-serif text-lg text-cream">{formatUsd(allocTotal)}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Interactive legend */}
              <div className="mt-4 space-y-1.5">
                {allocation.map((a, i) => (
                  <button
                    key={a.name}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition ${
                      activeIndex === i ? "bg-forest-800/60" : "hover:bg-forest-800/30"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full transition-transform"
                        style={{
                          background: COLORS[i % COLORS.length],
                          transform: activeIndex === i ? "scale(1.4)" : "scale(1)",
                        }}
                      />
                      <span className={activeIndex === i ? "text-cream" : "text-cream/70"}>
                        {a.name}
                      </span>
                    </span>
                    <span className="tabular-nums text-cream/60">
                      {((a.value / allocTotal) * 100).toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Reveal>
      </div>
    </div>
  );
}
