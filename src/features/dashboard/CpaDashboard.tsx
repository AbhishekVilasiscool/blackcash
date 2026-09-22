import { Calculator, CalendarCheck2, Clock, Users } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

const stats: readonly StatCardProps[] = [
  { label: "Clients", value: 142, delta: 2.5, icon: Users },
  { label: "Filings This Month", value: 18, icon: CalendarCheck2 },
  { label: "Upcoming Deadlines", value: 6, delta: -1, icon: Clock },
  { label: "Provisioned Tax", value: 52000, formatOptions: usd, icon: Calculator },
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