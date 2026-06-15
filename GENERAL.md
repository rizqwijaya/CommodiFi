# CommodiFi - General Specification

## 1. Overview

**Project Name:** CommodiFi
**Tagline:** "Indonesia's Real-World Assets, On-Chain."
**Category:** Tokenized Real-World Assets (RWA) Protocol
**Network:** Ethereum Sepolia (testnet)

CommodiFi is a mock RWA tokenization protocol representing fractionalized ownership of Indonesia's key commodity asset classes. Users can mint, trade, and redeem tokenized representations of real-world commodities, each backed by a simulated price oracle reflecting real market dynamics.

---

## 2. Tokenized Assets

| Token     | Asset                  | Category           | Decimals |
|-----------|------------------------|---------------------|----------|
| `tGOLD`   | Emas Antam (Gold)       | Precious Metal      | 18       |
| `tNKL`    | Nikel (Nickel)          | Base Metal          | 18       |
| `tCPO`    | Crude Palm Oil          | Agricultural        | 18       |
| `tCOAL`   | Batu Bara (Coal)        | Energy Commodity    | 18       |

Each token represents a fractional claim on a simulated reserve of the underlying commodity, priced via a mock oracle (manually updatable for demo purposes, with realistic IDR/USD reference values).

---

## 3. Tech Stack

- **Smart Contracts:** Solidity ^0.8.x, Foundry, OpenZeppelin
- **Frontend:** React + TypeScript + Vite + TailwindCSS + wagmi + viem
- **Backend:** Node.js + TypeScript (event indexer + REST API)
- **Package Management:** pnpm monorepo
- **Network:** Ethereum Sepolia

---

## 4. Smart Contract Architecture

### 4.1 `RWAToken.sol` (ERC-20)
- Deployed 4x, one per asset (tGOLD, tNKL, tCPO, tCOAL)
- Standard ERC-20 (OpenZeppelin) with mint/burn restricted to `CommodiFiVault` contract
- Each token stores metadata: asset name, unit (e.g., "gram", "ton", "barrel"), reference symbol

### 4.2 `PriceOracle.sol`
- Mock oracle, owner-updatable price feed per asset (price in USD, 8 decimals, Chainlink-style format)
- Function: `setPrice(address token, uint256 price)`
- Function: `getPrice(address token) returns (uint256)`
- Seed with realistic starting prices (e.g., gold ~$2,400/oz equivalent, nickel, CPO, coal at representative market rates)

### 4.3 `CommodiFiVault.sol` (Core Vault/Registry)
- Central contract managing deposit/mint and redeem/burn flows
- `deposit(address token, uint256 amount)`: simulates depositing collateral, mints corresponding RWA token
- `redeem(address token, uint256 amount)`: burns RWA token, simulates withdrawal
- Tracks total reserves per asset (`totalSupply` mirrors reserve for demo realism)
- `getAssetInfo(address token)` returns price, reserve, category

### 4.4 `CommodiFiVaultFactory.sol` (optional, if time permits)
- Deploys and registers new RWA token types dynamically
- Otherwise, hardcode the 4 tokens at deployment script level

---

## 5. Frontend Pages

### 5.1 Landing Page
- Hero section: "Indonesia's Real-World Assets, On-Chain"
- Brief explainer on RWA tokenization + TradFi-DeFi convergence
- Showcase 4 asset cards (name, current price, category)

### 5.2 Dashboard
- Wallet connection (wagmi)
- User's token balances across all 4 RWA tokens
- Total portfolio value (USD, calculated via oracle prices)
- Per-asset allocation chart

### 5.3 Mint/Redeem Page
- Select asset (tGOLD / tNKL / tCPO / tCOAL)
- Deposit (mint) flow: input amount, approve + deposit
- Redeem (burn) flow: input amount, redeem
- Display live price from oracle, estimated USD value

### 5.4 Asset Detail Page
- Per-asset info: description, category, current price, price history (mock chart)
- Total reserve / circulating supply
- Mint/redeem shortcut

---

## 6. Backend (Indexer + API)

- Listen to `Deposit`, `Redeem`, `Transfer`, `PriceUpdate` events
- Store in lightweight DB (SQLite or in-memory for demo)
- REST endpoints:
  - `GET /assets`: list all assets with current prices & reserves
  - `GET /portfolio/:address`: user balances across all tokens
  - `GET /price-history/:token`: mock historical price series

---

## 7. Branding & Identity

- **Name:** CommodiFi (Commodity + DeFi, direct descriptive branding for a commodity-backed RWA protocol)
- **Theme:** Earthy, institutional. Deep green/gold palette reflecting commodity & heritage
- **Tone:** Professional, TradFi-credible, institutional-grade RWA narrative

---

## 8. Out of Scope (Explicitly Mock/Simulated)

- No real banking, custody, or KYC integration
- No real Antam/commodity exchange price feeds (manual mock oracle only)
- No legal/regulatory compliance (OJK, Bappebti); portfolio demo only

---

## 9. Deliverables

1. Smart contracts deployed to Sepolia + verified on Etherscan
2. Frontend deployed to Vercel
3. README with architecture diagram, deployed addresses, demo walkthrough
4. (Optional) Demo video/GIF for portfolio presentation

---

## 10. Execution Notes

- Follow two-prompt execution approach (as used in EquinoxFi/ZenithDAO):
  - **Prompt 1:** Smart contracts + tests (Foundry)
  - **Prompt 2:** Frontend + backend integration
- This file is the single source of truth for Claude Code (intentionally named `GENERAL.md`, not `CLAUDE.md`, to avoid auto-read behavior)
