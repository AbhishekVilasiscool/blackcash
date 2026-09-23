import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { db } from "../../lib/db";
import { getModeDef } from "../registry/modes";
import type { ModeDef, ModeId } from "../registry/types";

export interface ModeContextValue {
  mode: ModeDef;
  modeId: ModeId;
  setMode: (mode: ModeId) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const ACTIVE_MODE_KEY = "activeMode";

interface ModeProviderProps {
  children: ReactNode;
  initialMode?: ModeId;
}

export function ModeProvider({ children, initialMode = "accountant" }: ModeProviderProps) {
  const [modeId, setModeId] = useState<ModeId>(initialMode);

  useEffect(() => {
    let cancelled = false;
    void db.settings.get(ACTIVE_MODE_KEY).then((setting) => {
      if (!cancelled && setting !== undefined && isKnownModeId(setting.value)) {
        setModeId(setting.value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode = getModeDef(modeId);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", mode.accent);
    root.style.setProperty("--accent-2", mode.accent2);
  }, [mode]);

  const setMode = useCallback((next: ModeId) => {
    setModeId(next);
    void db.settings.put({ key: ACTIVE_MODE_KEY, value: next });
  }, []);

  const value = useMemo<ModeContextValue>(
    () => ({ mode, modeId: mode.id, setMode }),
    [mode, setMode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

function isKnownModeId(value: string): value is ModeId {
  return value === "accountant" || value === "cpa" || value === "banker" || value === "investor";
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (context === null) {
    throw new Error("useMode must be used within ModeProvider");
  }
  return context;
}