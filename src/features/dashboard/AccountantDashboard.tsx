import { Banknote, Calculator, Receipt, Wallet } from "lucide-react";
import type { StatCardProps } from "../../components/ui/StatCard";
import { DashboardScaffold } from "./DashboardScaffold";

const stats: readonly StatCardProps[] = [
  { label: "Monthly Revenue", value: 48250, unit: "currency", delta: 3.2, icon: Receipt },
  { label: "Receivables", value: 18200, unit: "currency", delta: -2.1, icon: Banknote },
  { label: "Tax Provision", value: 12400, unit: "currency", icon: Calculator },
  { label: "Cash on Hand", value: 86100, unit: "currency", delta: 1.4, icon: Wallet },
];

export function AccountantDashboard() {
  return (
    <DashboardScaffold
      modeId="accountant"
      greeting="Good day, accountant."
      subtitle="Books, journals and statements — all in one place."
      stats={stats}
    />
  );
}

export default AccountantDashboard;