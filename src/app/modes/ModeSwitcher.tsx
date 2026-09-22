import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { MODES } from "../registry/modes";
import { useMode } from "./ModeProvider";
import { WaxSeal } from "../../components/ornament";

function ModeSegmented() {
  const { modeId, setMode } = useMode();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      {/* Horizontal row of wax seals */}
      <div className="flex items-center gap-1.5" role="tablist" aria-label="Mode selection">
        {MODES.map((mode) => {
          const active = mode.id === modeId;

          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(mode.id)}
              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent min-w-0 ${
                active ? "opacity-100" : "opacity-50 hover:opacity-75"
              }`}
              style={{
                "--mode-accent": mode.accent,
              } as React.CSSProperties}
            >
              <WaxSeal
                size={26}
                accent={mode.accent}
                tone={active ? "accent" : "oxblood"}
                className="shrink-0 transition-all duration-300"
                style={{
                  transform: active ? "scale(1.08)" : "scale(1)",
                  filter: active ? "drop-shadow(0 0 6px var(--mode-accent))" : "none",
                } as React.CSSProperties}
                aria-hidden="true"
              />
              <span
                className={`font-caps text-[9px] leading-tight transition-colors whitespace-nowrap truncate max-w-[64px] ${
                  active ? "text-text" : "text-muted"
                }`}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active mode info below */}
      <motion.div
        className="px-2 py-2 text-center"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span className="block font-caps-lg leading-tight text-text">
          {MODES.find((m) => m.id === modeId)?.label}
        </span>
        <span className="block font-display-italic text-sm leading-tight text-muted mt-0.5">
          {MODES.find((m) => m.id === modeId)?.tagline}
        </span>
      </motion.div>
    </div>
  );
}

export function ModeSwitcher() {
  return <ModeSegmented />;
}

export function ModeSwitcherSheet() {
  const { mode } = useMode();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text"
        aria-label={`Switch mode, current: ${mode.label}`}
        style={{ "--switch-accent": mode.accent } as React.CSSProperties}
      >
        <mode.icon className="h-3.5 w-3.5" style={{ color: mode.accent }} aria-hidden="true" />
        <span className="max-w-20 truncate font-caps">{mode.label}</span>
        <ChevronUp className="h-3 w-3 text-muted" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close mode picker"
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Switch mode"
              className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-y-auto rounded-t-xl border-t border-border bg-[var(--bg-2)] p-4 pb-8"
              initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold font-display">Switch mode</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-text"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ModeSegmented />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}