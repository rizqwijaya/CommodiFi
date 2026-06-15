import { Link } from "react-router-dom";
import { useAssets } from "../hooks/useAssets";
import { AssetCard } from "../components/AssetCard";

export function Landing() {
  const { assets, isLoading } = useAssets();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-8 text-center">
        <span className="pill">Tokenized Real-World Assets · Sepolia</span>
        <h1 className="mx-auto mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-6xl">
          Indonesia's Real-World Assets,{" "}
          <span className="text-gold-400">On-Chain.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-cream/70">
          CommodiFi tokenizes fractional ownership of Indonesia's key commodities (gold, nickel,
          crude palm oil, and coal), bridging traditional commodity markets and DeFi liquidity.
          Mint, hold, and redeem on-chain claims backed by a transparent price oracle.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/trade" className="btn-gold">
            Start Minting
          </Link>
          <Link to="/dashboard" className="btn-outline">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Explainer */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
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
        ].map((f) => (
          <div key={f.t} className="card">
            <h3 className="font-serif text-lg text-gold-300">{f.t}</h3>
            <p className="mt-2 text-sm text-cream/70">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Asset cards */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold">Tokenized Assets</h2>
          <span className="text-sm text-cream/50">Live prices from the oracle</span>
        </div>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-40 animate-pulse opacity-50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assets.map((a) => (
              <AssetCard key={a.symbol} asset={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
