import { motion } from "framer-motion";

const COLORS = ["#d9b945", "#e7cd73", "#4a9d6f", "#f0dd9c", "#c9a227"];

/**
 * Lightweight confetti burst (no dependency). Renders N particles that fly out
 * and fall, then unmount. Mount it conditionally with a unique key per burst.
 */
export function Confetti({ count = 28 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random();
        const dist = 60 + Math.random() * 90;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist - 40;
        const color = COLORS[i % COLORS.length];
        const size = 5 + Math.random() * 5;
        const rot = Math.random() * 360;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: size,
              height: size * 0.6,
              background: color,
              borderRadius: 1,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x, y: y + 140, opacity: 0, rotate: rot }}
            transition={{ duration: 1 + Math.random() * 0.6, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
