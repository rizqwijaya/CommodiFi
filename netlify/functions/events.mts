import type { Context } from "@netlify/functions";
import { isAddress } from "viem";
import { scanRecent } from "../../apps/api/src/scan";
import { resolveToken } from "../../apps/api/src/token";

// Stateless replacement for the indexer-backed GET /events. Scans the most recent
// SCAN_LOOKBACK blocks on-chain per request (no DB), newest first, with the same
// ?token / ?address / ?limit filters the web app already sends.
const LOOKBACK = BigInt(Number(process.env.SCAN_LOOKBACK ?? 500));

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");
  const addressParam = url.searchParams.get("address");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

  const token = tokenParam ? resolveToken(tokenParam) : undefined;
  const address =
    addressParam && isAddress(addressParam) ? addressParam.toLowerCase() : undefined;

  try {
    let rows = await scanRecent(LOOKBACK);
    if (token) rows = rows.filter((r) => r.token === token);
    if (address)
      rows = rows.filter((r) => r.from_addr === address || r.to_addr === address);
    rows = rows.slice(0, limit);
    return Response.json({ events: rows });
  } catch (err) {
    return Response.json(
      { error: "failed to scan events", detail: (err as Error).message },
      { status: 502 },
    );
  }
};

export const config = { path: "/events" };
