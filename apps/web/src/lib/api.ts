// In production the API is served by Netlify Functions at the site's own origin
// (/events, /price-history/*), so VITE_API_URL can be empty (same-origin). For
// local dev against the Express API, default to its port.
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export interface PricePoint {
  time: number;
  price: number;
}

export async function fetchPriceHistory(tokenOrSymbol: string): Promise<PricePoint[]> {
  const res = await fetch(`${API_URL}/price-history/${tokenOrSymbol}`);
  if (!res.ok) throw new Error(`price-history ${res.status}`);
  const data = (await res.json()) as { points: PricePoint[] };
  return data.points;
}

export interface ApiEvent {
  type: string;
  token: string | null;
  from_addr: string | null;
  to_addr: string | null;
  amount: string | null;
  block_number: number;
  block_time: number | null;
  tx_hash: string;
}

export async function fetchEvents(params: { token?: string; address?: string } = {}): Promise<
  ApiEvent[]
> {
  const q = new URLSearchParams();
  if (params.token) q.set("token", params.token);
  if (params.address) q.set("address", params.address);
  const res = await fetch(`${API_URL}/events?${q.toString()}`);
  if (!res.ok) throw new Error(`events ${res.status}`);
  const data = (await res.json()) as { events: ApiEvent[] };
  return data.events;
}
