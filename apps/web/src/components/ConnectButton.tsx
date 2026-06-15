import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { shortAddress } from "../lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button className="btn-outline" onClick={() => disconnect()} title={address}>
        <span className="h-2 w-2 rounded-full bg-gold-400" />
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <button className="btn-gold" disabled={isPending} onClick={() => connect({ connector: injected() })}>
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
