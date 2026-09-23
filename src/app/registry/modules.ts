import { lazy } from "react";
import {
  Activity,
  Banknote,
  BookOpen,
  Briefcase,
  Calculator,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FolderSearch,
  Gauge,
  Landmark,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Notebook,
  Percent,
  PieChart,
  Receipt,
  Scale,
  Settings,
  Star,
  Table2,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
  Code2,
} from "lucide-react";
import type { ModeId, ModuleDef } from "./types";

const soonComponent = lazy(() => import("../../features/soon/ModuleSoonPlaceholder"));
const isDev = import.meta.env.DEV;

const journalComponent = lazy(() => import("../../features/accounting/Journal"));
const chartOfAccountsComponent = lazy(() => import("../../features/accounting/ChartOfAccounts"));
const settingsComponent = lazy(() => import("../../features/settings/SettingsPage"));
const trialBalanceComponent = lazy(() => import("../../features/accounting/reports/TrialBalance"));
const incomeStatementComponent = lazy(() => import("../../features/accounting/reports/IncomeStatement"));
const balanceSheetComponent = lazy(() => import("../../features/accounting/reports/BalanceSheet"));

const ACCENT_COLORS: Record<ModeId, string> = {
  accountant: "#5FB8A5",
  cpa: "#9B87C9",
  banker: "#8FC1E3",
  investor: "#C9A45C",
};

function withAccent(module: Omit<ModuleDef, "accent"> & { accent?: string }): ModuleDef {
  if (module.accent) return module as ModuleDef;
  if (module.modes === "all") return { ...module, accent: ACCENT_COLORS.investor } as ModuleDef;
  if (Array.isArray(module.modes) && module.modes[0]) {
    return { ...module, accent: ACCENT_COLORS[module.modes[0]] } as ModuleDef;
  }
  return { ...module, accent: ACCENT_COLORS.investor } as ModuleDef;
}

export const MODULES: readonly ModuleDef[] = [
  // dashboard (home, all modes)
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    modes: "all",
    status: "ready",
    component: lazy(() => import("../../features/dashboard/ModeDashboard")),
  },
  // accountant tools
  withAccent({
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    icon: BookOpen,
    path: "chart-of-accounts",
    modes: ["accountant"],
    status: "ready",
    component: chartOfAccountsComponent,
  }),
  withAccent({
    id: "journal",
    title: "Journal",
    icon: Notebook,
    path: "journal",
    modes: ["accountant"],
    status: "ready",
    component: journalComponent,
  }),
  withAccent({
    id: "invoices",
    title: "Invoices",
    icon: Receipt,
    path: "invoices",
    modes: ["accountant"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "expenses",
    title: "Expenses",
    icon: Banknote,
    path: "expenses",
    modes: ["accountant"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "reconciliation",
    title: "Reconciliation",
    icon: Scale,
    path: "reconciliation",
    modes: ["accountant"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "trial-balance",
    title: "Trial Balance",
    icon: ListChecks,
    path: "trial-balance",
    modes: ["accountant"],
    status: "ready",
    component: trialBalanceComponent,
  }),
  withAccent({
    id: "pnl",
    title: "P&L",
    icon: TrendingUp,
    path: "pnl",
    modes: ["accountant"],
    status: "ready",
    component: incomeStatementComponent,
  }),
  withAccent({
    id: "balance-sheet",
    title: "Balance Sheet",
    icon: Landmark,
    path: "balance-sheet",
    modes: ["accountant"],
    status: "ready",
    component: balanceSheetComponent,
  }),
  withAccent({
    id: "loans",
    title: "Loan Analyzer",
    icon: Wallet,
    path: "loans",
    modes: ["accountant"],
    status: "soon",
    component: soonComponent,
  }),
  // cpa tools
  withAccent({
    id: "tax-estimator",
    title: "Tax Estimator",
    icon: Calculator,
    path: "tax-estimator",
    modes: ["cpa"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "deadlines",
    title: "Deadlines",
    icon: CalendarCheck2,
    path: "deadlines",
    modes: ["cpa"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "client-files",
    title: "Client Files",
    icon: FolderSearch,
    path: "client-files",
    modes: ["cpa"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "audit-checklist",
    title: "Audit Checklist",
    icon: ClipboardCheck,
    path: "audit-checklist",
    modes: ["cpa"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "depreciation",
    title: "Depreciation",
    icon: Gauge,
    path: "depreciation",
    modes: ["cpa"],
    status: "soon",
    component: soonComponent,
  }),
  // banker tools
  withAccent({
    id: "dcf",
    title: "DCF Valuation",
    icon: LineChart,
    path: "dcf",
    modes: ["banker"],
    status: "ready",
    component: lazy(() => import("../../features/dcf/DcfPage")),
  }),
  withAccent({
    id: "lbo",
    title: "LBO",
    icon: Activity,
    path: "lbo",
    modes: ["banker"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "comps",
    title: "Comps",
    icon: Table2,
    path: "comps",
    modes: ["banker"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "wacc",
    title: "WACC",
    icon: Percent,
    path: "wacc",
    modes: ["banker"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "deal-pipeline",
    title: "Deal Pipeline",
    icon: Workflow,
    path: "deal-pipeline",
    modes: ["banker"],
    status: "soon",
    component: soonComponent,
  }),
  // investor tools
  withAccent({
    id: "portfolio",
    title: "Portfolio",
    icon: PieChart,
    path: "portfolio",
    modes: ["investor"],
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "ratios",
    title: "Ratio Analysis",
    icon: Percent,
    path: "ratios",
    modes: ["investor"],
    status: "ready",
    component: lazy(() => import("../../features/ratios/RatiosPage")),
  }),
  withAccent({
    id: "growth",
    title: "Growth Projections",
    icon: TrendingUp,
    path: "growth",
    modes: ["investor"],
    status: "ready",
    component: lazy(() => import("../../features/growth/GrowthPage")),
  }),
  withAccent({
    id: "watchlist",
    title: "Watchlist",
    icon: Star,
    path: "watchlist",
    modes: ["investor"],
    status: "soon",
    component: soonComponent,
  }),
  // core (all modes)
  withAccent({
    id: "contacts",
    title: "Contacts",
    icon: Users,
    path: "contacts",
    modes: "all",
    status: "ready",
    component: lazy(() => import("../../features/contacts/ContactsPage")),
  }),
  withAccent({
    id: "documents",
    title: "Documents",
    icon: BookOpen,
    path: "documents",
    modes: "all",
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "notes",
    title: "Notes",
    icon: Notebook,
    path: "notes",
    modes: "all",
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "tasks",
    title: "Tasks",
    icon: CheckCircle2,
    path: "tasks",
    modes: "all",
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "reports",
    title: "Reports",
    icon: Briefcase,
    path: "reports",
    modes: "all",
    status: "soon",
    component: soonComponent,
  }),
  withAccent({
    id: "settings",
    title: "Settings",
    icon: Settings,
    path: "settings",
    modes: "all",
    status: "ready",
    component: settingsComponent,
  }),
  ...(isDev
    ? [
        withAccent({
          id: "styleguide",
          title: "Styleguide",
          icon: Code2,
          path: "styleguide",
          modes: "all" as const,
          status: "ready" as const,
          component: lazy(() => import("../../features/styleguide/StyleguidePage")),
        }),
      ]
    : []),
];

export interface ModuleGroup {
  group: string;
  items: readonly ModuleDef[];
}

export function getModeModules(modeId: ModeId): ModuleDef[] {
  return MODULES.filter(
    (module) => module.id !== "dashboard" && module.modes !== "all" && module.modes.includes(modeId),
  );
}

export function getCoreModules(): ModuleDef[] {
  return MODULES.filter((module) => module.modes === "all" && module.id !== "dashboard");
}

export function getGroupedModules(modeId: ModeId): ModuleGroup[] {
  return [
    { group: "Mode tools", items: getModeModules(modeId) },
    { group: "Core", items: getCoreModules() },
  ];
}

export function getModuleByPath(path: string): ModuleDef | undefined {
  return MODULES.find((module) => module.path === path);
}

export function getModuleById(id: string): ModuleDef | undefined {
  return MODULES.find((module) => module.id === id);
}

export function getKeyModules(modeId: ModeId, count = 4): ModuleDef[] {
  const modeModules = [...getModeModules(modeId)].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "ready" ? -1 : 1,
  );
  const readyCore = getCoreModules().filter((module) => module.status === "ready");
  return [...modeModules, ...readyCore].slice(0, count);
}