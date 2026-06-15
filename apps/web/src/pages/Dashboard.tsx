import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { usePortfolio } from "../hooks/usePortfolio";
import { useActivity, type ActivityItem } from "../hooks/useActivity";
import { formatPrice, formatToken, formatUsd, shortAddress } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";
import { AnimatedNumber, Reveal } from "../components/motion";
import { staggerContainer, staggerItem } from "../components/motion-variants";
import { Sparkline } from "../components/Sparkline";

const COLORS = ["#d9b945", "#4a9d6f", "#c9a227", "#2f6b4c"];

// Smoothly animated active slice: grows + glows, with eased transitions.
function ActiveSlice(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius = 0, startAngle, endAngle, fill } = props;
  return (
    <g style={{ transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
        style={{ filter: `drop-shadow(0 0 12px ${fill})` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={(outerRadius ?? 0) + 13}
        outerRadius={(outerRadius ?? 0) + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
        cornerRadius={6}
      />
    </g>
  );
}

export function Dashboard() {
  const { entries, totalUsd, isConnected } = usePortfolio();
  const { items: activity, isError: activityError } = useActivity();
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

  const held = entries.filter((e) => e.balance > 0n);
  const allocation = held.map((e) => ({ name: e.symbol, value: e.valueUsd }));
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0);
  const active = activeIndex !== null ? allocation[activeIndex] : null;
  const activeColor = activeIndex !== null ? COLORS[activeIndex % COLORS.length] : undefined;
  const topAsset = [...held].sort((a, b) => b.valueUsd - a.valueUsd)[0];

  return (
    <div className="space-y-6">
      {/* Hero: total + quick stats */}
      <Reveal>
        <div className="card accent-top relative overflow-hidden">
          {/* breathing glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold">Dashboard</h1>
              <p className="text-sm text-cream/60">Your tokenized commodity portfolio</p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xs uppercase tracking-wide text-cream/40">
                Total Portfolio Value
              </div>
              <div className="font-serif text-5xl text-gold-gradient">
                <AnimatedNumber value={totalUsd} format={(n) => formatUsd(n)} />
              </div>
            </div>
          </div>

          {/* quick stat strip */}
          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickStat label="Assets Held" value={`${held.length} / 4`} />
            <QuickStat
              label="Top Holding"
              value={topAsset ? topAsset.symbol : "-"}
              sub={topAsset ? formatUsd(topAsset.valueUsd) : undefined}
            />
            <QuickStat
              label="Largest Allocation"
              value={
                active
                  ? `${((active.value / allocTotal) * 100).toFixed(0)}%`
                  : topAsset && allocTotal > 0
                    ? `${((topAsset.valueUsd / allocTotal) * 100).toFixed(0)}%`
                    : "-"
              }
            />
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balances with sparklines */}
        <div className="space-y-6 lg:col-span-2">
          <Reveal className="card">
            <h2 className="mb-4 font-serif text-lg">Holdings</h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {entries.map((e, i) => (
                <motion.div
                  key={e.symbol}
                  variants={staggerItem}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="group flex items-center gap-4 rounded-xl border border-forest-800/60 bg-forest-950/30 px-4 py-3 transition-colors hover:border-gold-400/30 hover:bg-forest-800/40"
                >
                  <div className="min-w-[88px]">
                    <div className="font-semibold">{e.symbol}</div>
                    <div className="text-xs text-cream/50">
                      {e.price > 0n ? formatPrice(e.price) : "-"}
                    </div>
                  </div>

                  {/* mini sparkline */}
                  <div className="hidden flex-1 opacity-70 transition-opacity group-hover:opacity-100 sm:block">
                    <Sparkline seed={e.symbol} color={COLORS[i % COLORS.length]} />
                  </div>

                  <div className="ml-auto text-right">
                    <div className="font-medium tabular-nums">{formatToken(e.balance)}</div>
                    <div className="text-xs text-gold-300 tabular-nums">
                      {formatUsd(e.valueUsd)}
                    </div>
                  </div>
                  <Link
                    to={`/trade/${e.symbol}`}
                    className="btn-outline !py-1.5 !text-xs opacity-80 transition group-hover:opacity-100"
                  >
                    Trade
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>

          {/* Activity feed */}
          <Reveal delay={0.05} className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg">Recent Activity</h2>
              <span className="flex items-center gap-1.5 text-xs text-cream/40">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
                Live
              </span>
            </div>
            <ActivityFeed items={activity} error={activityError} />
          </Reveal>
        </div>

        {/* Allocation donut */}
        <Reveal delay={0.1} className="card h-fit">
          <h2 className="mb-2 font-serif text-lg">Allocation</h2>
          {allocation.length === 0 ? (
            <p className="py-12 text-center text-sm text-cream/50">
              No holdings yet. Mint some assets to see your allocation.
            </p>
          ) : (
            <>
              <div className="relative">
                {/* breathing glow behind donut */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 m-auto h-40 w-40 rounded-full bg-gold-500/10 blur-2xl"
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.9, 1.05, 0.9] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={92}
                      paddingAngle={3}
                      cornerRadius={6}
                      animationDuration={900}
                      animationEasing="ease-out"
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
                          className="cursor-pointer"
                          style={{
                            opacity: activeIndex === null || activeIndex === i ? 1 : 0.35,
                            transition: "opacity 0.35s cubic-bezier(0.22,1,0.36,1)",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* center overlay */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    {active ? (
                      <motion.div
                        key={active.name}
                        initial={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                          <span className="h-2 w-2 rounded-full" style={{ background: activeColor }} />
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
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-cream/40">Total</div>
                        <div className="font-serif text-lg text-cream">{formatUsd(allocTotal)}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* interactive legend */}
              <div className="mt-4 space-y-1.5">
                {allocation.map((a, i) => (
                  <button
                    key={a.name}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 ${
                      activeIndex === i ? "bg-forest-800/60" : "hover:bg-forest-800/30"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <motion.span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                        animate={{ scale: activeIndex === i ? 1.45 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
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

function QuickStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-forest-800/60 bg-forest-950/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-cream/40">{label}</div>
      <div className="mt-0.5 font-semibold text-cream">{value}</div>
      {sub && <div className="text-xs text-gold-300">{sub}</div>}
    </div>
  );
}

function ActivityFeed({ items, error }: { items: ActivityItem[]; error: boolean }) {
  if (error) {
    return (
      <p className="py-6 text-center text-sm text-cream/40">
        Activity feed offline — start the API to see recent deposits & redeems.
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-cream/40">
        No activity yet. Mint or redeem to see it here.
      </p>
    );
  }
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
      {items.map((it, i) => {
        const isMint = it.type === "Deposit";
        return (
          <motion.div
            key={`${it.txHash}-${i}`}
            variants={staggerItem}
            className="flex items-center gap-3 rounded-lg border border-forest-800/50 bg-forest-950/30 px-3 py-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                isMint ? "bg-emerald-500/15 text-emerald-300" : "bg-orange-500/15 text-orange-300"
              }`}
            >
              {isMint ? "↓" : "↑"}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {isMint ? "Minted" : "Redeemed"} {it.symbol}
              </div>
              <div className="text-xs text-cream/40">
                {it.time ? new Date(it.time * 1000).toLocaleString() : "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm tabular-nums text-cream/80">
                {it.amount ? formatToken(BigInt(it.amount)) : "—"}
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${it.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto text-[10px] text-gold-300/70 hover:text-gold-300"
              >
                {shortAddress(it.txHash)}
              </a>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
