import { useVault } from "../../hooks/useVault";
import { WaxSeal } from "../ornament/WaxSeal";
import { Lock, Unlock } from "lucide-react";

export function VaultIndicator() {
  const { isLocked, isUninitialized, lock } = useVault();

  if (isUninitialized) {
    return (
      <div className="flex items-center gap-2" title="Vault not initialized">
        <WaxSeal size={20} tone="oxblood" aria-label="Vault not initialized" />
        <span className="font-caps text-[9px] text-muted">UNINITIALIZED</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" title={isLocked ? "Vault locked - click to unlock" : "Vault unlocked - click to lock"}>
      <WaxSeal
        size={20}
        tone={isLocked ? "oxblood" : "accent"}
        className="cursor-pointer transition-colors hover:opacity-75"
        onClick={isLocked ? undefined : lock}
        aria-label={isLocked ? "Vault locked" : "Vault unlocked"}
        style={{ filter: isLocked ? "none" : "drop-shadow(0 0 6px var(--accent))" } as React.CSSProperties}
      />
      <span className="font-caps text-[9px] leading-tight transition-colors">
        {isLocked ? "LOCKED" : "UNLOCKED"}
      </span>
      <Lock className={`h-3 w-3 transition-colors ${isLocked ? "text-muted" : "text-accent"}`} aria-hidden="true" />
      {!isLocked && <Unlock className="h-3 w-3 text-accent" aria-hidden="true" />}
    </div>
  );
}

export function VaultStatusBadge() {
  const { isLocked, isUninitialized } = useVault();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium font-caps">
      <span className={`w-1.5 h-1.5 rounded-full ${isUninitialized ? "bg-muted" : isLocked ? "bg-red-400" : "bg-green-400"}`} />
      <span className={isUninitialized ? "text-muted" : isLocked ? "text-red-400" : "text-green-400"}>
        {isUninitialized ? "UNINITIALIZED" : isLocked ? "LOCKED" : "UNLOCKED"}
      </span>
    </div>
  );
}