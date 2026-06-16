# CommodiFi — Deployment Guide

Three parts:

| Part            | Status                          | Where                        |
| --------------- | ------------------------------- | ---------------------------- |
| Smart contracts | ✅ Already live + verified       | Sepolia (see DEPLOYMENTS.md) |
| Backend API     | Deploy to **Render** (or Railway) | Node web service             |
| Frontend (web)  | Deploy to **Vercel**            | Static site                  |

Contracts are done. You only deploy the **API** and the **web** app. Deploy the API first so
you can point the web app at it.

---

## 1. Backend API → Render

The API runs the event indexer + REST endpoints. It uses Node's built-in `node:sqlite`
(needs Node ≥ 22.5). SQLite storage is ephemeral on free hosting — the indexer just
re-backfills on each boot, which is fine for a demo.

### Steps

1. Push the repo to GitHub (already done: `github.com/rizqwijaya/CommodiFi`).
2. Go to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect the repo. Render reads [`render.yaml`](render.yaml) and creates the `commodifi-api`
   web service automatically.
4. In the service's **Environment** tab, set the one secret:
   - `SEPOLIA_RPC_URL` = your Alchemy/Infura Sepolia URL
   - (optional, recommended) `CORS_ORIGIN` = your Vercel URL, e.g. `https://commodifi.vercel.app`
5. Deploy. When live, note the URL, e.g. `https://commodifi-api.onrender.com`.
6. Verify: open `https://commodifi-api.onrender.com/health` → should return `{"ok":true,...}`.

> **Railway alternative:** New Project → Deploy from GitHub → set Root Directory to repo root,
> Start Command `pnpm --filter @commodifi/api start`, and the same env vars. Railway auto-detects
> pnpm + Node 22.

> **Free-tier note:** Render free services sleep after inactivity; the first request after
> idle takes ~30s to wake. The first boot also backfills events (couple of minutes).

---

## 2. Frontend (web) → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the repo.
2. Vercel reads [`vercel.json`](vercel.json) (build = `pnpm --filter @commodifi/web build`,
   output = `apps/web/dist`, SPA rewrite). Leave the defaults.
3. Add **Environment Variables** (Project Settings → Environment Variables):
   | Name                            | Value                                        |
   | ------------------------------- | -------------------------------------------- |
   | `VITE_API_URL`                  | your Render API URL (from step 1)            |
   | `VITE_SEPOLIA_RPC_URL`          | your Alchemy/Infura Sepolia URL              |
   | `VITE_WALLETCONNECT_PROJECT_ID` | (optional) id from cloud.reown.com           |
4. Deploy. You get a URL like `https://commodifi.vercel.app`.
5. Go back to Render and set `CORS_ORIGIN` to this exact URL, then redeploy the API.

---

## 3. Verify the full stack

- Open the Vercel URL.
- Connect wallet (Sepolia). Balances, prices, mint/redeem, faucet → all read on-chain via RPC.
- Dashboard "Recent Activity" + Asset Detail "Price History" → served by the Render API.
- If activity/price-history show "offline", check `VITE_API_URL` and the API `/health`.

---

## Environment variable reference

**Web (Vercel)** — see [apps/web/.env.example](apps/web/.env.example)
- `VITE_API_URL`, `VITE_SEPOLIA_RPC_URL`, `VITE_WALLETCONNECT_PROJECT_ID`

**API (Render/Railway)** — see [apps/api/.env.example](apps/api/.env.example)
- `SEPOLIA_RPC_URL` (required), `CORS_ORIGIN`, `PORT`, `START_BLOCK=11062600`,
  `INDEX_LOOKBACK`, `LOG_CHUNK_SIZE=10`, `POLL_INTERVAL_MS=30000`, `DB_PATH`

> Never commit real `.env` files — only the `.env.example` templates are tracked.

---

## Local production preview (optional)

```bash
pnpm install
pnpm --filter @commodifi/web build       # outputs apps/web/dist
pnpm --filter @commodifi/web preview      # serve the built site locally
pnpm --filter @commodifi/api start        # run the API (needs apps/api/.env)
```
