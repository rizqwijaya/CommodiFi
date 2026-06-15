// Deployed CommodiFi contracts on Ethereum Sepolia (chain ID 11155111).
// Source: DEPLOYMENTS.md (deployed 2026-06-15).

export const CHAIN_ID = 11155111 as const;

export const addresses = {
  priceOracle: "0x07be0f81C78fA5c20B681c067dd903d8E3fA1709",
  vault: "0x2562c0B3bf5a0c36D7D113b18d9Ba4Cdf1AC904e",
  tGOLD: "0x60228067f1E9b19f4cD8F576A0345B851Eba7f24",
  tNKL: "0x6eA689Ae3Fc812F94D58b817054cB60b1c83f44A",
  tCPO: "0x9a80213376B6e6EF26E11d0F2f8514D1bAbE0A81",
  tCOAL: "0x0F5373Fb48902Bdb51738b722f6fe150cB655ffD",
} as const;

export type ContractKey = keyof typeof addresses;
