import { Command } from "cmdk";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMode } from "./modes";
import { useCommandPalette } from "./providers";
import { getCoreModules, getModeDef, getModeModules, MODES, type ModeId } from "./registry";

interface PaletteEntry {
  id: string;
  label: string;
  keywords: string;
  icon: LucideIcon;
  badge: string | null;
  accent?: string;
}

function moduleEntry(
  id: string,
  label: string,
  path: string,
  icon: LucideIcon,
  badge: string | null,
): PaletteEntry {
  return { id, label, keywords: `${label} ${path}`, icon, badge };
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { modeId, setMode } = useMode();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  function goTo(path: string) {
    close();
    navigate(path);
  }

  function handleModeSelect(mode: ModeId) {
    setMode(mode);
    goTo("/");
  }

  const modeEntries: PaletteEntry[] = MODES.map((mode) => ({
    id: `mode:${mode.id}`,
    label: mode.label,
    keywords: mode.label,
    icon: mode.icon,
    badge: mode.tagline,
    accent: mode.accent,
  }));

  const toolEntries = getModeModules(modeId).map((module) =>
    moduleEntry(module.id, module.title, module.path, module.icon, "Current mode"),
  );

  const coreEntries = getCoreModules().map((module) =>
    moduleEntry(module.id, module.title, module.path, module.icon, "Core"),
  );

  const dashboardEntry = moduleEntry("dashboard", "Dashboard", "/", LayoutDashboard, null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Close command palette"
            className="absolute inset-0 bg-black/60"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0B1120] shadow-2xl"
            initial={reduceMotion ? { opacity: 0, scale: 1 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <Command>
              <Command.Input
                placeholder={`Search modules, tools and modes… (current: ${getModeDef(modeId).label})`}
                className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-text placeholder:text-muted/60 focus:outline-none"
              />
              <Command.List className="max-h-[55vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
                  No results.
                </Command.Empty>

                <Command.Group
                  heading="Modes"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted"
                >
                  {modeEntries.map((entry) => (
                    <Command.Item
                      key={entry.id}
                      value={entry.label}
                      onSelect={() => handleModeSelect(entry.id.replace("mode:", "") as ModeId)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text aria-selected:bg-white/5"
                    >
                      <entry.icon className="h-4 w-4 shrink-0" style={{ color: entry.accent }} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{entry.label}</span>
                      </span>
                      {entry.badge !== null && (
                        <span className="shrink-0 text-xs text-muted">{entry.badge}</span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group
                  heading="Overview"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted"
                >
                  <Command.Item
                    key={dashboardEntry.id}
                    value={dashboardEntry.label}
                    onSelect={() => goTo("/")}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text aria-selected:bg-white/5"
                  >
                    <dashboardEntry.icon className="h-4 w-4 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1 font-medium">{dashboardEntry.label}</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group
                  heading={`${getModeDef(modeId).label} tools`}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted"
                >
                  {toolEntries.map((entry) => (
                    <Command.Item
                      key={entry.id}
                      value={`${entry.label} ${entry.keywords}`}
                      onSelect={() => goTo(`/${entry.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text aria-selected:bg-white/5"
                    >
                      <entry.icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 font-medium">{entry.label}</span>
                      {entry.badge !== null && (
                        <span className="shrink-0 text-xs text-muted">{entry.badge}</span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group
                  heading="Core"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted"
                >
                  {coreEntries.map((entry) => (
                    <Command.Item
                      key={entry.id}
                      value={`${entry.label} ${entry.keywords}`}
                      onSelect={() => goTo(`/${entry.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-text aria-selected:bg-white/5"
                    >
                      <entry.icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 font-medium">{entry.label}</span>
                      {entry.badge !== null && (
                        <span className="shrink-0 text-xs text-muted">{entry.badge}</span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}