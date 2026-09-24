import { useEffect } from "react";
import { db } from "../lib/db";

/**
 * Ensures the default chart of accounts exists for the active client.
 * Runs on app start for every route (not just the Chart of Accounts page),
 * independent of vault state — seeds are plain rows in the same table every
 * reader uses, so they must exist before and regardless of vault
 * setup/unlock. The seeder itself is idempotent and concurrency-safe.
 * Rejections (e.g. blocked site storage) are swallowed here: the vault
 * store probes storage separately and Layout owns that UX.
 */
export function useSeedDefaults(clientId: number): void {
  useEffect(() => {
    void db.seedChartOfAccounts(clientId).catch(() => undefined);
  }, [clientId]);
}
