import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CommandPalette } from "./commandPalette";

export interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((previous) => !previous), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;
      if (hasModifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext);
  if (context === null) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return context;
}