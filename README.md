# CommodiFi

> Indonesia's Real-World Assets, On-Chain.

Mock RWA tokenization protocol for four Indonesian commodity classes (gold, nickel, CPO, coal).
pnpm monorepo: Foundry smart contracts + React web app + Node indexer/REST API.

Deployed to **Sepolia** and verified - see [DEPLOYMENTS.md](DEPLOYMENTS.md).

## Monorepo layout

```
src/ test/ script/         Foundry contracts, tests, deploy script (root)
packages/contracts-abi/    Shared ABIs + deployed addresses + asset metadata (TS)
apps/api/                  Node + node:sqlite indexer & REST API (Express + viem)
apps/web/                  React + Vite + Tailwind + wagmi/viem + RainbowKit dApp
```

## Quick start (web + api)

```bash
pnpm install

# Backend
cp apps/api/.env.example apps/api/.env   # set SEPOLIA_RPC_URL
pnpm dev:api                              # http://localhost:4000

# Frontend (separate terminal)
cp apps/web/.env.example apps/web/.env    # set VITE_API_URL + VITE_SEPOLIA_RPC_URL
pnpm dev:web                              # http://localhost:5173
```

`pnpm dev` runs both in parallel. `pnpm build` builds all packages; `pnpm typecheck` typechecks all.

> **Free RPC tiers** (e.g. Alchemy free) cap `eth_getLogs` at 10 blocks - the indexer defaults to
> `LOG_CHUNK_SIZE=10`. Set `START_BLOCK` near the deploy block so the initial backfill is fast.

### REST API

| Endpoint                    | Returns                                              |
| --------------------------- | --------------------------------------------------- |
| `GET /assets`               | All 4 assets with live price + reserve + supply     |
| `GET /portfolio/:address`   | User balances across tokens + USD valuation         |
| `GET /price-history/:token` | Indexed PriceUpdate series (token address or symbol)|
| `GET /events`               | Recent indexed activity (`?token=` / `?address=`)   |

### Web pages

Landing (hero + 4 asset cards) · Dashboard (balances + portfolio value + allocation chart) ·
Mint/Redeem · Asset Detail (price chart + reserves) · Admin (owner-only oracle price control).

---

## Smart contracts

## Contracts

| Contract             | Role                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| `RWAToken.sol`       | ERC-20 per asset (tGOLD, tNKL, tCPO, tCOAL). Mint/burn vault-only. Stores asset metadata. |
| `PriceOracle.sol`    | Owner-updatable mock oracle. USD prices, 8 decimals (Chainlink-style). |
| `CommodiFiVault.sol` | Core: `deposit`→mint, `redeem`→burn, per-asset reserve tracking, `getAssetInfo`. |

### Tokenized assets

| Token   | Asset             | Category         | Unit | Seed price (USD, 8 dp) |
| ------- | ----------------- | ---------------- | ---- | ---------------------- |
| `tGOLD` | Emas Antam (Gold) | Precious Metal   | gram | $2,400                 |
| `tNKL`  | Nikel (Nickel)    | Base Metal       | ton  | $15,800                |
| `tCPO`  | Crude Palm Oil    | Agricultural     | ton  | $900                   |
| `tCOAL` | Batu Bara (Coal)  | Energy Commodity | ton  | $130                   |

All tokens use 18 decimals. Prices are mock/manual - no real feeds (see GENERAL.md §8).

## Architecture

- The **vault** is the only authorized minter/burner on each token (`RWAToken.setVault`).
- `deposit(token, amount)` simulates collateral in, mints `amount` RWA tokens, and increments
  the tracked reserve. `redeem(token, amount)` burns and decrements.
- Per-asset reserve mirrors the token's `totalSupply` (asserted in tests).
- `getAssetInfo(token)` returns `(price, reserve, category)`; reverts if unregistered or unpriced.
- `CommodiFiVault` and `PriceOracle` are `Ownable`; the vault is `ReentrancyGuard`-protected on
  `deposit`/`redeem`.

## Setup

```bash
forge install        # restore lib/ if cloning fresh
forge build
forge test           # 47 tests
forge test -vvv      # verbose
forge coverage       # optional
```

## Deploy to Sepolia

```bash
cp .env.example .env   # fill PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url sepolia --broadcast --verify -vvvv
```

The script deploys the oracle + vault + 4 tokens, authorizes the vault on each token, registers
each asset with its category, and seeds the oracle prices. Deployed addresses are printed to the
console.

## Layout

```
src/      RWAToken.sol, PriceOracle.sol, CommodiFiVault.sol
test/     Base.t.sol, RWAToken.t.sol, PriceOracle.t.sol, CommodiFiVault.t.sol
script/   Deploy.s.sol
```
