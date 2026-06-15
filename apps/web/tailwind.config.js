/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Earthy, institutional CommodiFi palette — deep green + gold.
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
    },
  },
  plugins: [],
};
