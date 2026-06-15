import { NavLink, Outlet } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/trade", label: "Mint / Redeem" },
  { to: "/admin", label: "Admin" },
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-forest-800/60 bg-forest-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-serif text-xl font-bold tracking-tight">
              Commodi<span className="text-gold-400">Fi</span>
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-forest-700/60 text-gold-300" : "text-cream/70 hover:text-cream"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <ConnectButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-forest-800/60 py-6 text-center text-xs text-cream/40">
        CommodiFi — mock RWA protocol on Sepolia. Prices & reserves are simulated for demo
        purposes only.
      </footer>
    </div>
  );
}
