/**
 * Ask the connected wallet (MetaMask etc.) to track an ERC-20 so it shows up in
 * the user's asset list. Uses EIP-747 `wallet_watchAsset`.
 */
export async function addTokenToWallet(token: {
  address: string;
  symbol: string;
  decimals: number;
}): Promise<boolean> {
  const eth = (window as unknown as { ethereum?: { request: (a: unknown) => Promise<unknown> } })
    .ethereum;
  if (!eth) throw new Error("No injected wallet found");

  const result = await eth.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
      },
    },
  });
  return Boolean(result);
}
