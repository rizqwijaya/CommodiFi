import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

/** Fade + slide-up on scroll into view. Stagger children with `delay`.
 *  Falls back to showing content shortly after mount so it can never get stuck
 *  invisible (e.g. when a page re-mounts during a route transition). */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [forceShow, setForceShow] = useState(false);

  // Safety net: if inView never fires (route swap, layout not settled), reveal anyway.
  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), 250);
    return () => clearTimeout(t);
  }, []);

  const show = inView || forceShow;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated count-up number. Springs from 0 (or previous value) to `value`,
 * formatted via `format`. Used for prices / portfolio totals.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 18, mass: 0.8 });
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(format(v)));
    return () => unsub();
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
