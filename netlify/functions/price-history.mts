import type { Context } from "@netlify/functions";
import { scanRecent } from "../../apps/api/src/scan";
import { resolveToken } from "../../apps/api/src/token";
import { buildSeries } from "../../apps/api/src/series";
import { readAssets } from "../../apps/api/src/reads";

// Stateless replacement for GET /price-history/:token. Scans recent PriceUpdated
// events on-chain and builds the chart series (mock trail if too few real points).
const LOOKBACK = BigInt(Number(process.env.SCAN_LOOKBACK ?? 500));

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  // path is /price-history/<tokenOrSymbol>
  const raw = decodeURIComponent(url.pathname.split("/").pop() ?? "");
  const token = resolveToken(raw);
  if (!token) {
    return Response.json(
      { error: "unknown token (use address or symbol)" },
      { status: 400 },
    );
  }
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200) || 200, 1000);

  try {
    const rows = await scanRecent(LOOKBACK);
    let priceRows = rows
      .filter((r) => r.type === "PriceUpdate" && r.token === token && r.price && r.block_time !== null)
      .map((r) => ({ price: r.price as string, time: r.block_time as number }))
      .sort((a, b) => a.time - b.time)
      .slice(-limit);

    // No PriceUpdate events in the scan window (price feeds update infrequently).
    // Anchor the chart on the current oracle price so buildSeries can synthesize a
    // trail, instead of returning an empty series.
    if (priceRows.length === 0) {
      const assets = await readAssets();
      const live = assets.find((a) => a.address.toLowerCase() === token);
      if (live && live.price !== "0") {
        priceRows = [{ price: live.price, time: Math.floor(Date.now() / 1000) }];
      }
    }

    const series = buildSeries(priceRows);
    return Response.json({ token, points: series });
  } catch (err) {
    return Response.json(
      { error: "failed to scan price history", detail: (err as Error).message },
      { status: 502 },
    );
  }
};

export const config = { path: "/price-history/*" };
