import { Calculator, CalendarCheck2, Clock, Users } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const stats: readonly StatCardProps[] = [
  { label: "Clients", value: 142, unit: "count", delta: 2.5, icon: Users },
  { label: "Filings This Month", value: 18, unit: "count", icon: CalendarCheck2 },
  { label: "Upcoming Deadlines", value: 6, unit: "count", delta: -1, icon: Clock },
  { label: "Provisioned Tax", value: 52000, unit: "currency", icon: Calculator },
];

export function CpaDashboard() {
  return (
    <DashboardScaffold
      modeId="cpa"
      greeting="Good day, CPA."
      subtitle="Deadlines, client files and checklists — always one step ahead."
      stats={stats}
    />
  );
}

export default CpaDashboard;