import { useEffect, useSyncExternalStore } from "react";
import { db } from "../lib/db";
import {
  initializeVault,
  unlockVault,
  type VaultMetadata,
  encryptField,
  decryptField,
  isSensitiveTable,
  getSensitiveFields,
} from "../lib/crypto";

const VAULT_METADATA_KEY = "vault_metadata";
const AUTO_LOCK_KEY = "auto_lock_minutes";

type VaultStatus = "uninitialized" | "locked" | "unlocked";

function createVaultStore() {
  let status: VaultStatus = "uninitialized";
  let key: CryptoKey | null = null;
  let metadata: VaultMetadata | null = null;
  let autoLockTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  const getSnapshot = () => ({
    status,
    isLocked: status === "locked",
    isUnlocked: status === "unlocked",
    isUninitialized: status === "uninitialized",
    metadata,
  });

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setAutoLockTimer = (minutes: number) => {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    if (minutes > 0 && status === "unlocked") {
      autoLockTimer = setTimeout(() => {
        lock();
      }, minutes * 60 * 1000);
    }
  };

  const initialize = async () => {
    const setting = await db.settings.get(VAULT_METADATA_KEY);
    if (setting !== undefined) {
      try {
        metadata = JSON.parse(setting.value);
        status = "locked";
        notify();
      } catch {
        status = "uninitialized";
        notify();
      }
    } else {
      status = "uninitialized";
      notify();
    }
  };

  const setup = async (passphrase: string, autoLockMinutes = 15) => {
    const newMetadata = await initializeVault(passphrase);
    newMetadata.autoLockMinutes = autoLockMinutes;
    metadata = newMetadata;
    await db.settings.put({ key: VAULT_METADATA_KEY, value: JSON.stringify(metadata) });
    await db.settings.put({ key: AUTO_LOCK_KEY, value: String(autoLockMinutes) });

    const derivedKey = await unlockVault(passphrase, metadata);
    key = derivedKey;
    status = "unlocked";
    setAutoLockTimer(autoLockMinutes);
    notify();
  };

  const unlock = async (passphrase: string) => {
    if (!metadata) throw new Error("Vault not initialized");
    const derivedKey = await unlockVault(passphrase, metadata);
    key = derivedKey;
    status = "unlocked";
    setAutoLockTimer(metadata.autoLockMinutes);
    notify();
  };

  const lock = () => {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    autoLockTimer = null;
    key = null;
    status = metadata ? "locked" : "uninitialized";
    notify();
  };

  const changePassphrase = async (oldPassphrase: string, newPassphrase: string, autoLockMinutes?: number) => {
    if (!metadata || !key) throw new Error("Vault not unlocked");

    await unlockVault(oldPassphrase, metadata);

    const newMetadata = await initializeVault(newPassphrase);
    newMetadata.autoLockMinutes = autoLockMinutes ?? metadata.autoLockMinutes;
    metadata = newMetadata;

    const newKey = await unlockVault(newPassphrase, metadata);
    key = newKey;

    await db.settings.put({ key: VAULT_METADATA_KEY, value: JSON.stringify(metadata) });
    if (autoLockMinutes !== undefined) {
      await db.settings.put({ key: AUTO_LOCK_KEY, value: String(autoLockMinutes) });
    }
    setAutoLockTimer(metadata.autoLockMinutes);
    notify();
  };

  const setAutoLock = async (minutes: number) => {
    if (!metadata) return;
    metadata.autoLockMinutes = minutes;
    await db.settings.put({ key: VAULT_METADATA_KEY, value: JSON.stringify(metadata) });
    await db.settings.put({ key: AUTO_LOCK_KEY, value: String(minutes) });
    setAutoLockTimer(minutes);
    notify();
  };

  const getKey = () => key;

  // NOTE: plain functions, NOT hooks. createVaultStore() runs once at module
  // scope (outside any component render), where no React dispatcher exists —
  // wrapping these in useCallback crashed production on load with
  // "Cannot read properties of null (reading 'useCallback')". Identity is
  // already stable (created once), and `key` is read live from the closure
  // at call time, so memoization deps would be meaningless here anyway.
  const encrypt = async <T,>(data: T): Promise<string> => {
    if (!key) throw new Error("Vault is locked");
    return encryptField(JSON.stringify(data), key);
  };

  const decrypt = async <T,>(encryptedB64: string): Promise<T> => {
    if (!key) throw new Error("Vault is locked");
    const json = await decryptField(encryptedB64, key);
    return JSON.parse(json);
  };

  const encryptTableRow = async (
    tableName: string,
    row: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    if (!key || !isSensitiveTable(tableName)) return row;

    const sensitiveFields = getSensitiveFields(tableName);
    const encryptedRow = { ...row };

    for (const field of sensitiveFields) {
      const value = row[field];
      if (value !== undefined && value !== null) {
        (encryptedRow as Record<string, unknown>)[field] = await encryptField(String(value), key);
      }
    }

    return encryptedRow;
  };

  const decryptTableRow = async (
    tableName: string,
    row: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    if (!key || !isSensitiveTable(tableName)) return row;

    const sensitiveFields = getSensitiveFields(tableName);
    const decryptedRow = { ...row };

    for (const field of sensitiveFields) {
      const value = row[field];
      if (value !== undefined && value !== null && typeof value === "string") {
        try {
          (decryptedRow as Record<string, unknown>)[field] = await decryptField(value, key);
        } catch {
          (decryptedRow as Record<string, unknown>)[field] = value;
        }
      }
    }

    return decryptedRow;
  };

  return {
    subscribe,
    getSnapshot,
    initialize,
    setup,
    unlock,
    lock,
    changePassphrase,
    setAutoLock,
    getKey,
    encrypt,
    decrypt,
    encryptTableRow,
    decryptTableRow,
  };
}

const vaultStore = createVaultStore();

export function useVault() {
  const snapshot = useSyncExternalStore(vaultStore.subscribe, vaultStore.getSnapshot);

  useEffect(() => {
    vaultStore.initialize();
  }, []);

  return {
    ...snapshot,
    setup: vaultStore.setup,
    unlock: vaultStore.unlock,
    lock: vaultStore.lock,
    changePassphrase: vaultStore.changePassphrase,
    setAutoLock: vaultStore.setAutoLock,
    getKey: vaultStore.getKey,
    encrypt: vaultStore.encrypt,
    decrypt: vaultStore.decrypt,
    encryptTableRow: vaultStore.encryptTableRow,
    decryptTableRow: vaultStore.decryptTableRow,
  };
}

export function useVaultKey() {
  const { getKey } = useVault();
  return getKey();
}

export function useVaultStatus() {
  const { status, isLocked, isUnlocked, isUninitialized } = useVault();
  return { status, isLocked, isUnlocked, isUninitialized };
}