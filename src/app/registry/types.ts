import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type ModeId = "accountant" | "cpa" | "banker" | "investor";

export type StatUnit = "currency" | "count" | "percent" | "ratio";

export interface ModuleDef {
  id: string;
  title: string;
  icon: LucideIcon;
  path: string;
  modes: ModeId[] | "all";
  status: "ready" | "soon";
  component: LazyExoticComponent<ComponentType>;
  accent?: string;
}

export interface ModeDef {
  id: ModeId;
  label: string;
  accent: string;
  accent2: string;
  tagline: string;
  icon: LucideIcon;
}