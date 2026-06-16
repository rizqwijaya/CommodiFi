import express from "express";
import cors from "cors";
import { isAddress } from "viem";
import { readAssets, readPortfolio } from "./reads";
import { getPriceHistory, getRecentEvents } from "./db";
import { buildSeries } from "./series";
import { resolveToken } from "./token";

export function createServer() {
  const app = express();
  // Lock CORS to a specific origin in production via CORS_ORIGIN (comma-separated),
  // or allow all when unset (handy for local dev / demos).
  const origins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim());
  app.use(cors(origins && origins.length ? { origin: origins } : undefined));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "commodifi-api", time: Date.now() });
  });

  // GET /assets: all assets with current prices & reserves (live on-chain reads).
  app.get("/assets", async (_req, res) => {
    try {
      const assets = await readAssets();
      res.json({ assets });
    } catch (err) {
      res.status(502).json({ error: "failed to read assets", detail: (err as Error).message });
    }
  });

  // GET /portfolio/:address: user balances + USD valuation across all tokens.
  app.get("/portfolio/:address", async (req, res) => {
    const { address } = req.params;
    if (!isAddress(address)) {
      res.status(400).json({ error: "invalid address" });
      return;
    }
    try {
      const portfolio = await readPortfolio(address as `0x${string}`);
      res.json(portfolio);
    } catch (err) {
      res.status(502).json({ error: "failed to read portfolio", detail: (err as Error).message });
    }
  });

  // GET /price-history/:token: indexed PriceUpdate series, padded into a mock chart series.
  // :token accepts a token address or a symbol (tGOLD/tNKL/tCPO/tCOAL).
  app.get("/price-history/:token", (req, res) => {
    const token = resolveToken(req.params.token);
    if (!token) {
      res.status(400).json({ error: "unknown token (use address or symbol)" });
      return;
    }
    const limit = Math.min(Number(req.query.limit ?? 200) || 200, 1000);
    const indexed = getPriceHistory(token, limit);
    const series = buildSeries(indexed);
    res.json({ token, points: series });
  });

  // GET /events: recent indexed activity (optional ?token= & ?address= filters).
  app.get("/events", (req, res) => {
    const tokenParam = typeof req.query.token === "string" ? resolveToken(req.query.token) : undefined;
    const address =
      typeof req.query.address === "string" && isAddress(req.query.address)
        ? req.query.address
        : undefined;
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 200);
    const events = getRecentEvents({ token: tokenParam ?? undefined, address, limit });
    res.json({ events });
  });

  return app;
}
