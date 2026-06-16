import express from "express";
import cors from "cors";
import { isAddress } from "viem";
import { ASSET_BY_ADDRESS, ASSET_BY_SYMBOL, type AssetSymbol } from "@commodifi/contracts-abi";
import { readAssets, readPortfolio } from "./reads";
import { getPriceHistory, getRecentEvents } from "./db";

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

function resolveToken(input: string): string | null {
  if (isAddress(input)) {
    return ASSET_BY_ADDRESS[input.toLowerCase()]?.address.toLowerCase() ?? input.toLowerCase();
  }
  const bySymbol = ASSET_BY_SYMBOL[input as AssetSymbol];
  return bySymbol ? bySymbol.address.toLowerCase() : null;
}

interface SeriesPoint {
  time: number;
  price: number; // USD float
}

/**
 * Turn the raw indexed PriceUpdate rows into a chart-friendly series. If only a single point
 * exists (e.g. just the seed), synthesize a gentle mock trail leading up to it so the detail
 * page chart has shape (explicitly mock, per GENERAL.md §8).
 */
function buildSeries(rows: Array<{ price: string; time: number }>): SeriesPoint[] {
  const real = rows.map((r) => ({ time: r.time, price: Number(r.price) / 1e8 }));
  if (real.length >= 2) return real;

  const anchorPrice = real[0]?.price ?? 0;
  const anchorTime = real[0]?.time ?? Math.floor(Date.now() / 1000);
  if (anchorPrice === 0) return real;

  const points: SeriesPoint[] = [];
  const day = 86_400;
  // 14 synthetic days of +-3% wobble ending at the real anchor.
  for (let i = 14; i >= 1; i--) {
    const wobble = Math.sin(i * 1.3) * 0.03;
    points.push({
      time: anchorTime - i * day,
      price: Number((anchorPrice * (1 + wobble)).toFixed(2)),
    });
  }
  points.push({ time: anchorTime, price: anchorPrice });
  return points;
}
