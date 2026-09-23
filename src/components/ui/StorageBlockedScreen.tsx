import { ShieldAlert } from "lucide-react";
import { WaxSeal } from "../ornament/WaxSeal";
import { STORAGE_BLOCKED_MESSAGE } from "../../lib/storageHealth";
import { Button } from "./Button";

interface StorageBlockedScreenProps {
  /** Raw technical detail for the <details> block; never shown as the headline. */
  technicalDetail?: string;
}

/**
 * Full-screen, on-brand fallback shown exactly once when the browser blocks
 * IndexedDB access. No retries, no re-render loops — the user reloads when
 * they have allowed storage.
 */
export function StorageBlockedScreen({ technicalDetail }: StorageBlockedScreenProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded-xl border border-border bg-[var(--bg-2)] p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <WaxSeal size={48} tone="oxblood" aria-hidden="true" className="mx-auto mb-4" />
          <h1 className="font-display text-xl font-semibold">Local storage is blocked</h1>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{STORAGE_BLOCKED_MESSAGE}</p>
        </div>

        <ol className="mb-6 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Open your browser&apos;s site settings for this page.</li>
          <li>Allow storage / site data (or pause shields for this site).</li>
          <li>If you are in a private window, try a normal window instead.</li>
          <li>Reload below — your ledger never left this device.</li>
        </ol>

        <Button type="button" className="w-full" onClick={handleReload}>
          Reload BlackCash
        </Button>

        {technicalDetail && (
          <details className="mt-4 text-xs text-muted">
            <summary className="cursor-pointer underline">Technical detail</summary>
            <p className="mt-1 break-words font-mono">{technicalDetail}</p>
          </details>
        )}
      </div>
    </div>
  );
}
