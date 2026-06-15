import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "./ConnectButton";
import { AppBackground } from "./AppBackground";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/trade", label: "Mint / Redeem" },
];

export function Layout() {
  const location = useLocation();
  // Key the page transition on the top-level section only, so navigating between
  // sub-routes (e.g. /trade -> /trade/tNKL) does not re-mount and re-animate the page.
  const sectionKey = "/" + (location.pathname.split("/")[1] ?? "");

  return (
    <div className="relative min-h-screen">
      <AppBackground />

      <header className="sticky top-0 z-20 border-b border-forest-800/60 bg-forest-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NavLink to="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 font-serif text-lg font-bold text-forest-950 shadow-glow transition-transform duration-300 group-hover:scale-110">
              C
              <span className="absolute inset-0 rounded-xl bg-gold-300/40 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            </span>
            <span className="font-serif text-xl font-bold tracking-tight">
              Commodi<span className="text-gold-gradient">Fi</span>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "text-gold-300" : "text-cream/70 hover:text-cream"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-400"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={sectionKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-forest-800/60 py-6 text-center text-xs text-cream/40">
        CommodiFi - mock RWA protocol on Sepolia. Prices & reserves are simulated for demo
        purposes only.
      </footer>
    </div>
  );
}
