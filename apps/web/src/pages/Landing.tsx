import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAssets } from "../hooks/useAssets";
import { AssetCard } from "../components/AssetCard";
import { Reveal } from "../components/motion";
import { staggerContainer, staggerItem } from "../components/motion-variants";
import { formatPrice } from "../lib/format";

const features = [
  {
    t: "Fractional Ownership",
    d: "Each token is a fractional claim on a simulated reserve of the underlying commodity.",
  },
  {
    t: "Transparent Pricing",
    d: "A Chainlink-style oracle quotes USD prices (8 decimals) for every asset, updatable on-chain.",
  },
  {
    t: "TradFi × DeFi",
    d: "Institutional-grade RWA exposure with the composability and settlement of DeFi.",
  },
];

export function Landing() {
  const { assets, isLoading } = useAssets();

  // marquee ticker data (duplicated for seamless loop)
  const ticker = assets.filter((a) => a.price > 0n);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative pt-4 text-center">
        {/* hero glow halo */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-[30rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />

        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pill inline-flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-gold-400" />
          Tokenized Real-World Assets · Sepolia
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-bold leading-[1.1] sm:text-4xl md:text-5xl"
        >
          Indonesia's Real-World Assets,{" "}
          <span className="text-gold-gradient">On-Chain.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-4 max-w-xl text-sm text-cream/70 sm:text-base"
        >
          CommodiFi tokenizes fractional ownership of Indonesia's key commodities (gold, nickel,
          crude palm oil, and coal), bridging traditional commodity markets and DeFi liquidity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-7 flex justify-center gap-3"
        >
          <Link to="/faucet" className="btn-gold px-6 py-3 text-base">
            💧 Get Test Tokens
          </Link>
          <Link to="/trade" className="btn-outline px-6 py-3 text-base">
            Start Minting
          </Link>
        </motion.div>

        {/* live price ticker */}
        {ticker.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative mx-auto mt-12 max-w-3xl overflow-hidden rounded-full border border-forest-700/60 bg-forest-900/50 py-2.5 backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-forest-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-forest-950 to-transparent" />
            <motion.div
              className="flex w-max gap-10 whitespace-nowrap px-6 text-sm"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              {[...ticker, ...ticker].map((a, i) => (
                <span key={i} className="flex items-center gap-2 text-cream/70">
                  <span className="font-semibold text-cream">{a.symbol}</span>
                  <span className="text-gold-300">{formatPrice(a.price)}</span>
                  <span className="text-emerald-400/80">▲</span>
                </span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Explainer */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-3"
      >
        {features.map((f) => (
          <motion.div
            key={f.t}
            variants={staggerItem}
            className="card accent-top group transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40"
          >
            <h3 className="font-serif text-lg text-gold-300">{f.t}</h3>
            <p className="mt-2 text-sm text-cream/70">{f.d}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Asset cards */}
      <section>
        <Reveal className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-3xl font-bold">Tokenized Assets</h2>
          <span className="flex items-center gap-2 text-sm text-cream/50">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
            Live prices from the oracle
          </span>
        </Reveal>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-44" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2"
          >
            {assets.map((a) => (
              <motion.div key={a.symbol} variants={staggerItem}>
                <AssetCard asset={a} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
