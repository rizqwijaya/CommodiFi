import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Thin wrapper around RainbowKit's ConnectButton so the rest of the app keeps a single
 * import site. Shows balance hidden on small screens; full account modal on click.
 */
export function ConnectButton() {
  return (
    <RainbowConnectButton
      showBalance={{ smallScreen: false, largeScreen: true }}
      accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
      chainStatus="icon"
    />
  );
}
