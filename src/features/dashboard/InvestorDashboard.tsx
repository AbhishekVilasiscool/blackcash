import { LineChart, PieChart, Star, TrendingUp } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
const percent = { style: "percent", maximumFractionDigits: 1 } as const;

const stats: readonly StatCardProps[] = [
  { label: "Portfolio Value", value: 1284000, formatOptions: usd, delta: 2.4, icon: PieChart },
  { label: "Portfolio IRR", value: 0.124, formatOptions: percent, delta: 0.8, icon: LineChart },
  { label: "Allocation Growth", value: 0.138, formatOptions: percent, icon: TrendingUp },
  { label: "Watchlist", value: 27, delta: 3, icon: Star },
];

export function InvestorDashboard() {
  return (
    <DashboardScaffold
      modeId="investor"
      greeting="Good day, investor."
      subtitle="Portfolio health, ratios and growth scenarios up front."
      stats={stats}
    />
  );
}

export default InvestorDashboard;