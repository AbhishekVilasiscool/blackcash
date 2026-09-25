import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Command, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BottomSheet } from "../components/ui/BottomSheet";
import { ModeSwitcher, ModeSwitcherSheet, useMode } from "./modes";
import { useCommandPalette } from "./providers";
import { getGroupedModules, getKeyModules, type ModuleDef, type ModuleGroup } from "./registry";
import { AppRoutes } from "./router";
import { Atmosphere } from "../components/atmosphere";
import { WaxSeal } from "../components/ornament";
import { toRomanNumeral } from "../components/ornament/RomanNumeral";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { VaultIndicator } from "../components/ui/VaultIndicator";
import { UnlockScreen } from "../components/ui/UnlockScreen";
import { StorageBlockedScreen } from "../components/ui/StorageBlockedScreen";
import { useVault } from "../hooks/useVault";
import { useClientId } from "../hooks/useClientId";
import { useSeedDefaults } from "../hooks/useSeedDefaults";

function DashboardNavItem({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink
      to="/"
      end
      className={({ isActive }) =>
        compact
          ? `flex flex-col items-center gap-1 py-2.5 text-[10px] font-caps transition-colors ${
              isActive ? "text-accent" : "text-muted"
            }`
          : `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-caps transition-colors ${
              isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-white/5 hover:text-text"
            }`
      }
    >
      <LayoutDashboard className={compact ? "h-5 w-5" : "h-4 w-4 shrink-0"} aria-hidden="true" />
      Dashboard
    </NavLink>
  );
}

function ModuleNavItem({ def }: { def: ModuleDef }) {
  return (
    <NavLink
      to={def.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-caps transition-colors ${
          isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-white/5 hover:text-text"
        }`
      }
    >
      <def.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{def.title}</span>
      {def.status === "soon" && (
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
          Soon
        </span>
      )}
    </NavLink>
  );
}

function NavGroup({ group, index }: { group: ModuleGroup; index: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 pt-4 text-[10px] font-caps text-muted flex items-center gap-2">
        <span className="font-display text-accent" aria-hidden="true">{toRomanNumeral(index)}.</span>
        {group.group}
      </p>
      {group.items.map((def) => (
        <ModuleNavItem key={def.id} def={def} />
      ))}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { open } = useCommandPalette();
  const { modeId, mode } = useMode();
  const [moreOpen, setMoreOpen] = useState(false);
  const { isLocked, isUninitialized, storageBlocked, storageError, unlock, setup } = useVault();
  const clientId = useClientId();
  // Default chart of accounts for new/empty databases — every route, every
  // launch, regardless of vault timing. No-op when accounts already exist.
  useSeedDefaults(clientId);

  const groups = getGroupedModules(modeId);
  const keyModules = getKeyModules(modeId, 4);

  const pageMotion = reduceMotion
    ? { opacity: 1 }
    : { opacity: 0, y: 8, rotateY: -8 };

  const handleUnlock = async (passphrase: string) => {
    await unlock(passphrase);
  };

  const handleSetup = async (passphrase: string, autoLockMinutes: number) => {
    await setup(passphrase, autoLockMinutes);
  };

  // Browser refused IndexedDB access (strict privacy settings, shields, or
  // private browsing). This short-circuits BOTH the first-load setup path
  // and the return-visit unlock path with one honest screen — no retries,
  // no render loops; the user allows storage and reloads.
  if (storageBlocked) {
    return (
      <div className="min-h-screen relative">
        <StorageBlockedScreen technicalDetail={storageError ?? undefined} />
      </div>
    );
  }

  if (isLocked || isUninitialized) {
    return (
      <div className="min-h-screen relative">
        <ErrorBoundary label="atmosphere" compact>
          <Atmosphere />
        </ErrorBoundary>
        <UnlockScreen
          onUnlock={handleUnlock}
          onSetup={handleSetup}
          isUninitialized={isUninitialized}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ErrorBoundary label="atmosphere" compact>
        <Atmosphere />
      </ErrorBoundary>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-[var(--bg-2)]/80 px-5 py-6 backdrop-blur lg:flex">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1 text-left transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Open command palette"
        >
          <WaxSeal size={36} accent={mode.accent} aria-hidden="true" />
          <span className="text-lg font-display font-semibold tracking-tight">BlackCash</span>
        </button>

        <div className="mt-6 rounded-xl border border-border bg-surface p-2">
          <ModeSwitcher />
        </div>

        <nav
          className="mt-4 flex-1 overflow-y-auto pr-1"
          aria-label="Primary"
        >
          <DashboardNavItem />
          {groups.map((group, index) => (
            <NavGroup key={group.group} group={group} index={index} />
          ))}
        </nav>

        {/* Stacked vertically (not side-by-side): at 216px of usable
            sidebar width the tagline and the indicator compete and the
            tagline breaks mid-word at its hyphen. Column layout gives each
            full width at ANY sidebar width, so future footer additions
            cannot reintroduce the competition. */}
        <div className="mt-auto flex flex-col gap-1.5 border-t border-border p-3">
          <p className="whitespace-nowrap text-xs leading-relaxed text-muted">local-first · open source</p>
          {/* Vault status must be visible at every viewport width: the
              mobile header (which also shows it) unmounts at lg, so the
              desktop sidebar carries its own indicator. */}
          <VaultIndicator />
        </div>
      </aside>

      {/* Mobile header. Sticky within the page scroll container; the
          safe-area top padding keeps it below notches / system UI in
          fullscreen (env() is 0px where there is no safe area, so this is a
          no-op on plain desktop browsers). */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-[var(--bg-2)]/80 px-4 py-3 backdrop-blur lg:hidden"
        // Preserve py-3's 0.75rem top padding AND clear the safe area.
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <span className="flex items-center gap-2 text-base font-display font-semibold tracking-tight">
          <ModeSwitcherSheet />
        </span>
        <div className="flex items-center gap-3">
          <VaultIndicator />
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <kbd className="rounded border border-border bg-surface px-1 font-sans text-[10px]">K</kbd>
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[var(--bg-2)]/90 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          <DashboardNavItem compact />
          {keyModules.slice(0, 3).map((def) => (
            <NavLink
              key={def.id}
              to={def.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] font-caps transition-colors ${
                  isActive ? "text-accent" : "text-muted"
                }`
              }
            >
              <def.icon className="h-5 w-5" aria-hidden="true" />
              {def.title}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-caps text-muted"
            aria-label="More modules"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="All modules">
        <div className="pb-2 text-xs text-muted">
          Current mode: {mode.label} · {mode.tagline}
        </div>
        <DashboardNavItem />
        {groups.map((group, index) => (
          <NavGroup key={group.group} group={group} index={index} />
        ))}
      </BottomSheet>

      {/* Content with animated route transitions */}
      <div className="pb-20 lg:pb-8 lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          <ErrorBoundary
            label="page"
            resetKey={location.pathname + "-" + modeId}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={pageMotion}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                exit={pageMotion}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  transformOrigin: "left center",
                  transformPerspective: 1000,
                } as React.CSSProperties}
              >
                <AppRoutes />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}