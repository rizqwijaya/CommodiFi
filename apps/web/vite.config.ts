import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Keep the error overlay so HMR failures show inline instead of silently
    // breaking the page / forcing a hard reload.
    hmr: { overlay: true },
  },
  // Pre-bundle the heavy wallet/animation deps up front. Without this, Vite can
  // discover a new dependency mid-session and trigger a full re-optimize + hard
  // page reload (which looked like the browser "force closing" tabs).
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "wagmi",
      "viem",
      "@rainbow-me/rainbowkit",
      "@tanstack/react-query",
      "framer-motion",
      "recharts",
    ],
  },
});
