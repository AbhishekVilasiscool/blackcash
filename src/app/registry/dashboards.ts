import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ModeId } from "./types";

export const MODE_DASHBOARDS: Record<ModeId, LazyExoticComponent<ComponentType>> = {
  accountant: lazy(() => import("../../features/dashboard/AccountantDashboard")),
  cpa: lazy(() => import("../../features/dashboard/CpaDashboard")),
  banker: lazy(() => import("../../features/dashboard/BankerDashboard")),
  investor: lazy(() => import("../../features/dashboard/InvestorDashboard")),
};