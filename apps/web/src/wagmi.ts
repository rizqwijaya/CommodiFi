import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined;

// WalletConnect project id. Required by RainbowKit's getDefaultConfig.
// Get one (free) at https://cloud.reown.com. A placeholder still allows injected
// wallets (MetaMask) to connect; WalletConnect-based wallets need a real id.
const projectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "commodifi-demo";

export const wagmiConfig = getDefaultConfig({
  appName: "CommodiFi",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl || undefined),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
