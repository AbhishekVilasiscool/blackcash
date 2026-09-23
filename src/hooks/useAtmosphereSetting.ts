import { useCallback, useEffect, useSyncExternalStore } from "react";
import { db } from "../lib/db";

type AtmosphereLevel = "full" | "lite" | "off";

const ATMOSPHERE_KEY = "atmosphere";

function getInitialLevel(): AtmosphereLevel {
  if (typeof window === "undefined") return "lite";

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;

  if (isMobile || lowMemory) return "lite";
  return "full";
}

function createAtmosphereStore() {
  let level: AtmosphereLevel = getInitialLevel();
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => level;

  const setLevel = (newLevel: AtmosphereLevel) => {
    if (level !== newLevel) {
      level = newLevel;
      listeners.forEach((listener) => listener());
      // Best-effort persistence; silent when site storage is blocked.
      void db.settings.put({ key: ATMOSPHERE_KEY, value: newLevel }).catch(() => undefined);
    }
  };

  const initialize = async () => {
    let setting;
    try {
      setting = await db.settings.get(ATMOSPHERE_KEY);
    } catch {
      // Storage blocked or otherwise unavailable: keep the default level.
      // The vault store owns the honest blocked-storage UX.
      return;
    }
    if (setting !== undefined && (setting.value === "full" || setting.value === "lite" || setting.value === "off")) {
      level = setting.value;
      listeners.forEach((listener) => listener());
    }
  };

  return { subscribe, getSnapshot, setLevel, initialize };
}

const atmosphereStore = createAtmosphereStore();

export function useAtmosphereSetting(): { level: AtmosphereLevel; setLevel: (level: AtmosphereLevel) => void } {
  const level = useSyncExternalStore(atmosphereStore.subscribe, atmosphereStore.getSnapshot);
  const setLevel = useCallback(atmosphereStore.setLevel, []);

  useEffect(() => {
    atmosphereStore.initialize();
  }, []);

  return { level, setLevel };
}