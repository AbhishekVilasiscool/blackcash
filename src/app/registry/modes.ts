import { BookOpen, Landmark, ShieldCheck, Wallet } from "lucide-react";
import type { ModeDef, ModeId } from "./types";

export const MODES: readonly ModeDef[] = [
  {
    id: "accountant",
    label: "Accountant",
    accent: "#5FB8A5",
    accent2: "#4FA695",
    tagline: "Books, journals & statements",
    icon: BookOpen,
  },
  {
    id: "cpa",
    label: "CPA",
    accent: "#9B87C9",
    accent2: "#8A75B8",
    tagline: "Tax, deadlines & compliance",
    icon: ShieldCheck,
  },
  {
    id: "banker",
    label: "Banker",
    accent: "#8FC1E3",
    accent2: "#7EB0D2",
    tagline: "Valuation & deal pipeline",
    icon: Landmark,
  },
  {
    id: "investor",
    label: "Investor",
    accent: "#C9A45C",
    accent2: "#B8934B",
    tagline: "Portfolios & growth",
    icon: Wallet,
  },
];

export function getModeDef(modeId: ModeId): ModeDef {
  const def = MODES.find((mode) => mode.id === modeId);
  if (def === undefined) {
    throw new Error(`Unknown mode: ${modeId}`);
  }
  return def;
}

export function isModeId(value: string | null | undefined): value is ModeId {
  if (value === undefined || value === null) {
    return false;
  }
  return MODES.some((mode) => mode.id === (value as ModeId));
}