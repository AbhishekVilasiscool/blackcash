import { Activity, Percent, TrendingUp, Workflow } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
const percent = { style: "percent", maximumFractionDigits: 1 } as const;

const stats: readonly StatCardProps[] = [
  { label: "Pipeline Value", value: 8400000, formatOptions: usd, delta: 2.4, icon: Activity },
  { label: "WACC", value: 0.085, formatOptions: percent, delta: -0.2, icon: Percent },
  { label: "LTM Revenue", value: 28900000, formatOptions: usd, delta: 6.1, icon: TrendingUp },
  { label: "Deals in Review", value: 12, icon: Workflow },
];

export function BankerDashboard() {
  return (
    <DashboardScaffold
      modeId="banker"
      greeting="Good day, banker."
      subtitle="Valuations, deal flow and pipeline at a glance."
      stats={stats}
    />
  );
}

export default BankerDashboard;