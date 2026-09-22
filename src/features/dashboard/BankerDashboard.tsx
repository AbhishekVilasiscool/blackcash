import { Activity, Percent, TrendingUp, Workflow } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const stats: readonly StatCardProps[] = [
  { label: "Pipeline Value", value: 8400000, unit: "currency", delta: 2.4, icon: Activity },
  { label: "WACC", value: 0.085, unit: "percent", delta: -0.2, icon: Percent },
  { label: "LTM Revenue", value: 28900000, unit: "currency", delta: 6.1, icon: TrendingUp },
  { label: "Deals in Review", value: 12, unit: "count", icon: Workflow },
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