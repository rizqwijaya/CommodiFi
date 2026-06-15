import { useId, useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Tiny smooth sparkline used in balance/stat cards. Generates a gentle deterministic
 * wave seeded by `seed` so each asset has a stable, distinct shape (mock trend).
 */
export function Sparkline({
  seed,
  color = "#d9b945",
  width = 120,
  height = 36,
  points = 24,
}: {
  seed: string;
  color?: string;
  width?: number;
  height?: number;
  points?: number;
}) {
  const id = useId();

  const { line, area } = useMemo(() => {
    // simple deterministic hash from seed
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const rand = (n: number) => {
      const x = Math.sin(h + n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    const ys: number[] = [];
    let v = 0.5;
    for (let i = 0; i < points; i++) {
      v += (rand(i) - 0.45) * 0.18;
      v = Math.max(0.15, Math.min(0.85, v));
      ys.push(v);
    }
    // gentle upward bias at the end
    ys[ys.length - 1] = Math.min(0.9, ys[ys.length - 1] + 0.08);

    const stepX = width / (points - 1);
    const toXY = (y: number, i: number) => [i * stepX, height - y * height];

    // smooth path via Catmull-Rom -> bezier
    const pts = ys.map((y, i) => toXY(y, i));
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    const areaD = `${d} L ${width},${height} L 0,${height} Z`;
    return { line: d, area: areaD };
  }, [seed, width, height, points]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}
