import { createContext, useContext, type ReactNode } from "react";
import type { ModuleDef } from "./types";

const ModuleContext = createContext<ModuleDef | null>(null);

export function ModuleProvider({ def, children }: { def: ModuleDef; children: ReactNode }) {
  return <ModuleContext.Provider value={def}>{children}</ModuleContext.Provider>;
}

export function useModule(): ModuleDef {
  const def = useContext(ModuleContext);
  if (def === null) {
    throw new Error("useModule must be used inside a module route");
  }
  return def;
}