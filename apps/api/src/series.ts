export interface SeriesPoint {
  time: number;
  price: number; // USD float
}

/**
 * Turn raw indexed/scanned PriceUpdate rows into a chart-friendly series. If only a
 * single point exists (e.g. just the seed), synthesize a gentle mock trail leading
 * up to it so the detail page chart has shape (explicitly mock, per GENERAL.md §8).
 */
export function buildSeries(rows: Array<{ price: string; time: number }>): SeriesPoint[] {
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
