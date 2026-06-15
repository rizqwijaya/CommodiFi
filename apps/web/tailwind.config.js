/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Earthy, institutional CommodiFi palette - deep green + gold.
        forest: {
          950: "#08110d",
          900: "#0d1b14",
          800: "#13281d",
          700: "#1b3a2a",
          600: "#235039",
          500: "#2f6b4c",
        },
        gold: {
          500: "#c9a227",
          400: "#d9b945",
          300: "#e7cd73",
          200: "#f0dd9c",
        },
        cream: "#f5f1e6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(201,162,39,0.25), 0 8px 40px -8px rgba(201,162,39,0.35)",
        "glow-lg": "0 0 0 1px rgba(201,162,39,0.35), 0 20px 60px -12px rgba(201,162,39,0.45)",
        inset: "inset 0 1px 0 0 rgba(245,241,230,0.06)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(110deg, transparent 25%, rgba(245,241,230,0.18) 50%, transparent 75%)",
        "radial-fade": "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(3%, -4%) scale(1.05)" },
          "66%": { transform: "translate(-3%, 3%) scale(0.97)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-4%, 4%) scale(1.08)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 18s ease-in-out infinite",
        "float-slow": "floatSlow 24s ease-in-out infinite",
        sheen: "sheen 1.1s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
