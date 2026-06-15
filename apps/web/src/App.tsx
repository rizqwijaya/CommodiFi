import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Trade } from "./pages/Trade";
import { AssetDetail } from "./pages/AssetDetail";
import { Admin } from "./pages/Admin";
import { NotFound } from "./pages/NotFound";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trade" element={<Trade />} />
        <Route path="trade/:symbol" element={<Trade />} />
        <Route path="asset/:symbol" element={<AssetDetail />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
