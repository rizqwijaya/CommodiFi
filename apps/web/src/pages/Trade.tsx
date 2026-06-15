import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ASSETS, addresses, commodiFiVaultAbi } from "@commodifi/contracts-abi";
import { useAssets } from "../hooks/useAssets";
import { usePortfolio } from "../hooks/usePortfolio";
import { formatPrice, formatToken, formatUsd, tokenValueUsd } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";

type Mode = "mint" | "redeem";

export function Trade() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { assets, refetch: refetchAssets } = useAssets();
  const { entries, refetch: refetchPortfolio } = usePortfolio();

  const [selected, setSelected] = useState(symbol ?? "tGOLD");
  const [mode, setMode] = useState<Mode>("mint");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (symbol && ASSETS.some((a) => a.symbol === symbol)) setSelected(symbol);
  }, [symbol]);

  const asset = assets.find((a) => a.symbol === selected);
  const holding = entries.find((e) => e.symbol === selected);

  const { writeContract, data: txHash, isPending, reset, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      void refetchAssets();
      void refetchPortfolio();
    }
  }, [isSuccess, refetchAssets, refetchPortfolio]);

  const parsedAmount = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  }, [amount]);

  const estUsd = asset && parsedAmount > 0n ? tokenValueUsd(parsedAmount, asset.price) : 0;
  const insufficient =
    mode === "redeem" && holding ? parsedAmount > holding.balance : false;
  const canSubmit = isConnected && parsedAmount > 0n && !insufficient && !isPending && !isConfirming;

  function submit() {
    if (!asset) return;
    reset();
    writeContract({
      address: addresses.vault as `0x${string}`,
      abi: commodiFiVaultAbi,
      functionName: mode === "mint" ? "deposit" : "redeem",
      args: [asset.address, parsedAmount],
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Mint / Redeem</h1>
        <p className="text-sm text-cream/60">
          Mint tokenized commodities by depositing (simulated) collateral, or redeem to burn.
        </p>
      </div>

      <div className="card space-y-5">
        {/* Asset selector */}
        <div className="grid grid-cols-4 gap-2">
          {ASSETS.map((a) => (
            <button
              key={a.symbol}
              onClick={() => {
                setSelected(a.symbol);
                navigate(`/trade/${a.symbol}`, { replace: true });
              }}
              className={`rounded-lg border px-2 py-3 text-center transition ${
                selected === a.symbol
                  ? "border-gold-400 bg-gold-500/10"
                  : "border-forest-700 hover:border-forest-600"
              }`}
            >
              <div className="text-xl">{a.icon}</div>
              <div className="mt-1 text-xs font-medium">{a.symbol}</div>
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-forest-700 p-1">
          {(["mint", "redeem"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold capitalize transition ${
                mode === m ? "bg-forest-700 text-gold-300" : "text-cream/60"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Price + balance */}
        <div className="flex justify-between text-sm">
          <span className="text-cream/60">
            Price: <span className="text-gold-300">{asset ? formatPrice(asset.price) : "—"}</span>
          </span>
          <span className="text-cream/60">
            Balance: {holding ? formatToken(holding.balance) : "0"} {selected}
          </span>
        </div>

        {/* Amount input */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wide text-cream/40">Amount</label>
            {mode === "redeem" && holding && holding.balance > 0n && (
              <button
                className="text-xs text-gold-300 hover:underline"
                onClick={() => setAmount(formatToken(holding.balance, 18))}
              >
                Max
              </button>
            )}
          </div>
          <input
            className="input mt-1"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
          <div className="mt-2 text-xs text-cream/50">
            Estimated value: <span className="text-cream/80">{formatUsd(estUsd)}</span>
          </div>
          {insufficient && <div className="mt-1 text-xs text-red-400">Insufficient balance</div>}
        </div>

        {!isConnected ? (
          <ConnectButton />
        ) : (
          <button className="btn-gold w-full" disabled={!canSubmit} onClick={submit}>
            {isPending
              ? "Confirm in wallet…"
              : isConfirming
                ? "Processing…"
                : mode === "mint"
                  ? `Mint ${selected}`
                  : `Redeem ${selected}`}
          </button>
        )}

        {isSuccess && (
          <div className="rounded-lg border border-forest-600 bg-forest-800/40 p-3 text-sm text-gold-300">
            ✓ Transaction confirmed.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {error.message.split("\n")[0]}
          </div>
        )}

        <p className="text-xs text-cream/40">
          Note: deposits are simulated (mock RWA) — minting is a single transaction, no ERC-20
          approval required.
        </p>
      </div>
    </div>
  );
}
