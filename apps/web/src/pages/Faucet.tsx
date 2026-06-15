import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ASSETS, addresses, commodiFiVaultAbi } from "@commodifi/contracts-abi";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatToken } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";
import { Reveal } from "../components/motion";
import { Confetti } from "../components/Confetti";

const COLORS: Record<string, string> = {
  tGOLD: "#d9b945",
  tNKL: "#9fb4ab",
  tCPO: "#4a9d6f",
  tCOAL: "#8a8f98",
};

// Preset faucet drip amounts per asset.
const CLAIM_AMOUNTS: Record<string, number> = {
  tGOLD: 10,
  tNKL: 5,
  tCPO: 25,
  tCOAL: 50,
};

export function Faucet() {
  const { isConnected } = useAccount();
  const { entries, refetch } = usePortfolio();

  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]); // for "Claim All"
  const [burstKey, setBurstKey] = useState(0);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const claimingRef = useRef<string | null>(null);

  function claim(symbol: string) {
    const asset = ASSETS.find((a) => a.symbol === symbol);
    if (!asset) return;
    claimingRef.current = symbol;
    setActiveSymbol(symbol);
    reset();
    writeContract({
      address: addresses.vault as `0x${string}`,
      abi: commodiFiVaultAbi,
      functionName: "deposit",
      args: [asset.address, parseUnits(String(CLAIM_AMOUNTS[symbol]), 18)],
    });
  }

  // on success: celebrate + refetch + advance queue
  useEffect(() => {
    if (!isSuccess) return;
    const claimed = claimingRef.current;
    setJustClaimed(claimed);
    setBurstKey((k) => k + 1);
    void refetch();
    const t = setTimeout(() => setJustClaimed(null), 1600);
    claimingRef.current = null;
    setActiveSymbol(null);
    setQueue((q) => {
      const [, ...rest] = q;
      if (rest.length) setTimeout(() => claim(rest[0]), 400);
      return rest;
    });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  function claimAll() {
    const all = ASSETS.map((a) => a.symbol);
    setQueue(all);
    claim(all[0]);
  }

  const busy = isPending || isConfirming;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero: animated dripping tap */}
      <Reveal className="text-center">
        <DrippingTap busy={busy} />
        <h1 className="mt-2 font-serif text-4xl font-bold">Token Faucet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream/60">
          Grab free test tokens to explore CommodiFi. Claim flows straight to your wallet — you
          only pay Sepolia gas. It's all simulated, so help yourself.
        </p>
      </Reveal>

      {!isConnected ? (
        <Reveal delay={0.1} className="card-hover accent-top mx-auto max-w-md text-center">
          <p className="text-sm text-cream/70">Connect your wallet to claim test tokens.</p>
          <div className="mt-5 flex justify-center">
            <ConnectButton />
          </div>
        </Reveal>
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {ASSETS.map((a) => {
              const holding = entries.find((e) => e.symbol === a.symbol);
              const color = COLORS[a.symbol];
              const isThis = activeSymbol === a.symbol;
              const celebrating = justClaimed === a.symbol;
              return (
                <motion.div
                  key={a.symbol}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className="card accent-top relative overflow-hidden"
                  style={{ boxShadow: celebrating ? `0 0 30px -6px ${color}` : undefined }}
                >
                  {celebrating && <Confetti key={burstKey} />}

                  {/* glow accent per asset */}
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                    style={{ background: `${color}22` }}
                  />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{a.symbol}</div>
                      <div className="text-xs text-cream/50">{a.assetName}</div>
                    </div>
                    <span className="pill">{a.category}</span>
                  </div>

                  <div className="relative mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-cream/40">
                        You receive
                      </div>
                      <div className="flex items-baseline gap-1">
                        <motion.span
                          key={celebrating ? "pop" : "idle"}
                          initial={celebrating ? { scale: 1.4 } : false}
                          animate={{ scale: 1 }}
                          className="font-serif text-3xl"
                          style={{ color }}
                        >
                          +{CLAIM_AMOUNTS[a.symbol]}
                        </motion.span>
                        <span className="text-xs text-cream/50">{a.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-cream/40">
                        Balance
                      </div>
                      <div className="text-sm tabular-nums text-cream/80">
                        {holding ? formatToken(holding.balance) : "0"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => claim(a.symbol)}
                    disabled={busy}
                    className="btn-gold relative mt-5 w-full"
                    style={{
                      background: color,
                      boxShadow: `0 8px 24px -8px ${color}99`,
                    }}
                  >
                    {isThis && isPending
                      ? "Confirm in wallet…"
                      : isThis && isConfirming
                        ? "Dripping…"
                        : celebrating
                          ? "✓ Claimed!"
                          : `Claim ${a.symbol}`}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Claim all */}
          <Reveal delay={0.1} className="text-center">
            <button onClick={claimAll} disabled={busy} className="btn-gold px-8 py-3 text-base">
              {queue.length > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-forest-950" />
                  Claiming {ASSETS.length - queue.length + 1}/{ASSETS.length}…
                </span>
              ) : (
                "💧 Claim All 4 Tokens"
              )}
            </button>
            <p className="mt-3 text-xs text-cream/40">
              Sends one transaction per token. Confirm each in your wallet.
            </p>
          </Reveal>
        </>
      )}
    </div>
  );
}

/** Animated faucet tap that drips gold droplets, faster while busy. */
function DrippingTap({ busy }: { busy: boolean }) {
  return (
    <div className="relative mx-auto h-24 w-40">
      {/* tap body */}
      <div className="absolute left-1/2 top-0 h-7 w-24 -translate-x-1/2 rounded-lg bg-gradient-to-b from-gold-400 to-gold-500 shadow-glow" />
      <div className="absolute left-1/2 top-6 h-5 w-5 -translate-x-1/2 rounded-b-lg bg-gold-500" />
      {/* droplets */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-11 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-300"
          animate={{ y: [0, 44], opacity: [0, 1, 0], scale: [0.6, 1, 0.4] }}
          transition={{
            duration: busy ? 0.7 : 1.6,
            repeat: Infinity,
            delay: i * (busy ? 0.23 : 0.55),
            ease: "easeIn",
          }}
        />
      ))}
      {/* pool ripple */}
      <motion.span
        className="absolute bottom-0 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-gold-500/30 blur-[1px]"
        animate={{ scaleX: [0.7, 1.1, 0.7], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: busy ? 0.7 : 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
