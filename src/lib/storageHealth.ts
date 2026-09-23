import { db } from "./db";

/**
 * Copy shown when the browser refuses IndexedDB access (strict privacy
 * settings, shields, or private browsing). Honest and actionable — the user
 * can fix this themselves, so we tell them exactly how.
 */
export const STORAGE_BLOCKED_MESSAGE =
  "BlackCash could not access local storage. This usually means your browser is blocking site storage " +
  "(common with strict privacy settings, shields, or private browsing). Please allow storage for this " +
  "site and reload.";

const BLOCKED_ERROR_NAMES = new Set([
  "OpenFailedError",
  "DatabaseClosedError",
  "UnknownError",
  "SecurityError",
  "QuotaExceededError",
  "InvalidStateError",
  "NotAllowedError",
]);

const BLOCKED_MESSAGE_PATTERN =
  /denied permission|not allowed|permission (denied|to access)|block(ed|ing)? (site )?storage|storage (is )?(blocked|unavailable|disabled)|user denied|securityerror|quotaexceeded|indexeddb[^.]{0,60}(blocked|disabled|denied)|access[^.]{0,40}(blocked|denied)/i;

/**
 * Distinguishes "the browser is blocking site storage" from every other
 * failure (wrong passphrase, corrupt metadata, genuine bugs). Pure function
 * so it is trivially unit-testable.
 */
export function isStorageBlockedError(error: unknown): boolean {
  if (error === null || error === undefined) return false;
  const name =
    typeof error === "object" && "name" in error && typeof (error as { name: unknown }).name === "string"
      ? (error as { name: string }).name
      : "";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";
  // Dexie wraps the native denial (e.g. Brave's
  // "UnknownError: The user denied permission to access") and keeps the name.
  if (BLOCKED_ERROR_NAMES.has(name)) return true;
  // Dexie's inner errors and raw DOMExceptions carry the denial in the message.
  if (BLOCKED_MESSAGE_PATTERN.test(message)) return true;
  const inner =
    typeof error === "object" && "inner" in error
      ? (error as { inner: unknown }).inner
      : undefined;
  if (inner !== undefined && inner !== error) {
    // One level of Dexie `inner` unwrapping; never recurse unboundedly.
    if (inner instanceof Error && BLOCKED_MESSAGE_PATTERN.test(inner.message)) return true;
    if (
      typeof inner === "object" &&
      inner !== null &&
      "name" in inner &&
      typeof (inner as { name: unknown }).name === "string" &&
      BLOCKED_ERROR_NAMES.has((inner as { name: string }).name)
    ) {
      return true;
    }
  }
  return false;
}

/** Error thrown for storage-blocked failures so UI layers can show the honest message. */
export class StorageBlockedError extends Error {
  constructor(detail?: string) {
    super(detail ? `${STORAGE_BLOCKED_MESSAGE} (${detail})` : STORAGE_BLOCKED_MESSAGE);
    this.name = "StorageBlockedError";
  }
}

/**
 * Opens the database explicitly (Dexie otherwise opens lazily on first use)
 * and converts a browser storage denial into a StorageBlockedError. Callers
 * must still handle rejection exactly once — never retry in a loop.
 */
export async function ensureStorageAvailable(): Promise<void> {
  try {
    await db.open();
  } catch (error) {
    if (isStorageBlockedError(error)) {
      throw new StorageBlockedError(
        error instanceof Error ? error.message : undefined,
      );
    }
    throw error;
  }
}
