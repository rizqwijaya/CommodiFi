import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ASSETS, addresses, commodiFiVaultAbi } from "@commodifi/contracts-abi";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatToken } from "../lib/format";
import { addTokenToWallet } from "../lib/watchAsset";
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

                  <AddToWalletButton
                    address={a.address}
                    symbol={a.symbol}
                    decimals={a.decimals}
                  />
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

/** Animated faucet tap (SVG) that drips gold droplets, faster while busy. */
function DrippingTap({ busy }: { busy: boolean }) {
  const dur = busy ? 0.7 : 1.7;
  return (
    <div className="relative mx-auto h-28 w-44">
      <svg
        viewBox="0 0 176 96"
        className="absolute inset-0 h-full w-full drop-shadow-[0_6px_16px_rgba(201,162,39,0.35)]"
        fill="none"
      >
        <defs>
          <linearGradient id="tapMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0dd9c" />
            <stop offset="55%" stopColor="#d9b945" />
            <stop offset="100%" stopColor="#b8941f" />
          </linearGradient>
        </defs>
        {/* wall mount */}
        <rect x="14" y="20" width="14" height="34" rx="4" fill="url(#tapMetal)" />
        {/* horizontal body */}
        <rect x="22" y="22" width="86" height="16" rx="8" fill="url(#tapMetal)" />
        {/* valve handle on top */}
        <rect x="58" y="8" width="10" height="16" rx="3" fill="url(#tapMetal)" />
        <circle cx="63" cy="8" r="8" fill="url(#tapMetal)" />
        {/* down spout */}
        <rect x="100" y="30" width="16" height="30" rx="7" fill="url(#tapMetal)" />
        <rect x="98" y="54" width="20" height="9" rx="4" fill="url(#tapMetal)" />
        {/* subtle highlight */}
        <rect x="26" y="25" width="78" height="3" rx="1.5" fill="#fff6d8" opacity="0.5" />
      </svg>

      {/* droplets fall from spout tip (~x 108, y 63) */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-2.5 w-2 rounded-full bg-gradient-to-b from-gold-200 to-gold-400"
          style={{ left: "61%", top: 62, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
          animate={{ y: [0, 30], opacity: [0, 1, 1, 0], scaleY: [0.7, 1.1, 1, 0.8] }}
          transition={{ duration: dur, repeat: Infinity, delay: i * (dur / 3), ease: "easeIn" }}
        />
      ))}

      {/* pool ripple */}
      <motion.span
        className="absolute left-[61%] h-1.5 w-14 -translate-x-1/2 rounded-full bg-gold-500/30 blur-[1px]"
        style={{ top: 92 }}
        animate={{ scaleX: [0.6, 1.15, 0.6], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: dur, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** "Add to wallet" button using EIP-747 wallet_watchAsset. */
function AddToWalletButton({
  address,
  symbol,
  decimals,
}: {
  address: string;
  symbol: string;
  decimals: number;
}) {
  const [state, setState] = useState<"idle" | "pending" | "added" | "error">("idle");

  async function add() {
    setState("pending");
    try {
      await addTokenToWallet({ address, symbol, decimals });
      setState("added");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={add}
      disabled={state === "pending"}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-forest-700 py-2 text-xs font-medium text-cream/70 transition hover:border-gold-400/50 hover:text-gold-300"
    >
      {state === "added" ? (
        <span className="text-emerald-300">✓ Added to wallet</span>
      ) : state === "error" ? (
        <span className="text-red-300">No wallet detected</span>
      ) : state === "pending" ? (
        "Opening wallet…"
      ) : (
        <>
          <WalletIcon /> Add {symbol} to wallet
        </>
      )}
    </button>
  );
}

function WalletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="opacity-70">
      <path
        d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="16.5" cy="12" r="1.3" fill="currentColor" />
    </svg>
  );
}
