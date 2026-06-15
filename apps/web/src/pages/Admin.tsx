import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  ASSETS,
  PRICE_DECIMALS,
  addresses,
  priceOracleAbi,
} from "@commodifi/contracts-abi";
import { useAssets } from "../hooks/useAssets";
import { formatPrice, shortAddress } from "../lib/format";
import { ConnectButton } from "../components/ConnectButton";

export function Admin() {
  const { address, isConnected } = useAccount();
  const { assets, refetch } = useAssets();

  const { data: owner } = useReadContract({
    address: addresses.priceOracle as `0x${string}`,
    abi: priceOracleAbi,
    functionName: "owner",
  });

  const isOwner =
    isConnected && owner && address && owner.toString().toLowerCase() === address.toLowerCase();

  if (!isConnected) {
    return (
      <Gate title="Admin · Oracle Control">
        <p className="text-sm text-cream/70">Connect the owner wallet to manage oracle prices.</p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </Gate>
    );
  }

  if (!isOwner) {
    return (
      <Gate title="Admin · Oracle Control">
        <p className="text-sm text-cream/70">
          This page is owner-only. The oracle owner is{" "}
          <span className="text-gold-300">{shortAddress(owner?.toString())}</span>.
        </p>
        <p className="mt-2 text-xs text-cream/40">
          Connected as {shortAddress(address)} — not authorized.
        </p>
      </Gate>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">Admin · Oracle Control</h1>
        <p className="text-sm text-cream/60">
          Owner-only. Update mock USD prices ({PRICE_DECIMALS}-decimal) for demo purposes.
        </p>
      </div>

      <div className="space-y-4">
        {ASSETS.map((a) => {
          const live = assets.find((x) => x.symbol === a.symbol);
          return (
            <PriceRow
              key={a.symbol}
              symbol={a.symbol}
              icon={a.icon}
              tokenAddress={a.address}
              currentPrice={live?.price ?? 0n}
              onUpdated={() => void refetch()}
            />
          );
        })}
      </div>
    </div>
  );
}

function PriceRow({
  symbol,
  icon,
  tokenAddress,
  currentPrice,
  onUpdated,
}: {
  symbol: string;
  icon: string;
  tokenAddress: `0x${string}`;
  currentPrice: bigint;
  onUpdated: () => void;
}) {
  const [value, setValue] = useState("");
  const { writeContract, data: txHash, isPending, reset, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      setValue("");
      onUpdated();
    }
  }, [isSuccess, onUpdated]);

  function submit() {
    let priceScaled: bigint;
    try {
      priceScaled = parseUnits(value, PRICE_DECIMALS);
    } catch {
      return;
    }
    if (priceScaled <= 0n) return;
    reset();
    writeContract({
      address: addresses.priceOracle as `0x${string}`,
      abi: priceOracleAbi,
      functionName: "setPrice",
      args: [tokenAddress, priceScaled],
    });
  }

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-semibold">{symbol}</div>
          <div className="text-xs text-cream/50">
            Current: <span className="text-gold-300">{formatPrice(currentPrice)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream/40">
            $
          </span>
          <input
            className="input w-40 pl-6"
            inputMode="decimal"
            placeholder="New USD price"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
        <button
          className="btn-gold"
          disabled={!value || isPending || isConfirming}
          onClick={submit}
        >
          {isPending ? "Confirm…" : isConfirming ? "Saving…" : "Update"}
        </button>
      </div>
      {error && (
        <div className="text-xs text-red-300 sm:basis-full">{error.message.split("\n")[0]}</div>
      )}
    </div>
  );
}

function Gate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h2 className="font-serif text-2xl font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
