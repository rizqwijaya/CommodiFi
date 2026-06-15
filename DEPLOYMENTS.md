# CommodiFi - Deployed Addresses

**Network:** Ethereum Sepolia (chain ID `11155111`)
**Deployed:** 2026-06-15
**Deployer / Owner:** `0x2A4e77E5c5C2CE833303F0eCB05355B0db224856`

All contracts verified on Etherscan.

| Contract       | Address                                      | Etherscan |
| -------------- | -------------------------------------------- | --------- |
| PriceOracle    | `0x07be0f81C78fA5c20B681c067dd903d8E3fA1709` | https://sepolia.etherscan.io/address/0x07be0f81C78fA5c20B681c067dd903d8E3fA1709 |
| CommodiFiVault | `0x2562c0B3bf5a0c36D7D113b18d9Ba4Cdf1AC904e` | https://sepolia.etherscan.io/address/0x2562c0B3bf5a0c36D7D113b18d9Ba4Cdf1AC904e |
| tGOLD          | `0x60228067f1E9b19f4cD8F576A0345B851Eba7f24` | https://sepolia.etherscan.io/address/0x60228067f1E9b19f4cD8F576A0345B851Eba7f24 |
| tNKL           | `0x6eA689Ae3Fc812F94D58b817054cB60b1c83f44A` | https://sepolia.etherscan.io/address/0x6eA689Ae3Fc812F94D58b817054cB60b1c83f44A |
| tCPO           | `0x9a80213376B6e6EF26E11d0F2f8514D1bAbE0A81` | https://sepolia.etherscan.io/address/0x9a80213376B6e6EF26E11d0F2f8514D1bAbE0A81 |
| tCOAL          | `0x0F5373Fb48902Bdb51738b722f6fe150cB655ffD` | https://sepolia.etherscan.io/address/0x0F5373Fb48902Bdb51738b722f6fe150cB655ffD |

## Seeded oracle prices (USD, 8 decimals)

| Token | Price        | Raw (8 dp)      |
| ----- | ------------ | --------------- |
| tGOLD | $2,400       | `240000000000`  |
| tNKL  | $15,800      | `1580000000000` |
| tCPO  | $900         | `90000000000`   |
| tCOAL | $130         | `13000000000`   |

## Wiring (verified on-chain)

- Each token's `vault()` points to CommodiFiVault.
- All 4 tokens registered in the vault (`registeredTokenCount() == 4`) with categories.
- Vault is the only authorized minter/burner per token.
