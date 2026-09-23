import { db } from "../lib/db";
import { useVault } from "./useVault";
import { isSensitiveTable } from "../lib/crypto";
import type { BlackcashDatabase } from "../lib/db";

type TableName = "accounts" | "journalEntries" | "journalLines" | "contacts" | "interactions" | "contactLinks" | "settings";

interface EncryptedTableWrapper {
  add: (item: Record<string, unknown>) => Promise<number>;
  put: (item: Record<string, unknown>) => Promise<number>;
  update: (id: number | string, changes: Record<string, unknown>) => Promise<number>;
  delete: (id: number | string) => Promise<number>;
  get: (id: number | string) => Promise<Record<string, unknown> | undefined>;
  toArray: () => Promise<Record<string, unknown>[]>;
  where: (index: string) => {
    equals: (value: unknown) => {
      toArray: () => Promise<Record<string, unknown>[]>;
      count: () => Promise<number>;
      delete: () => Promise<number>;
    };
  };
}

function getTable(database: BlackcashDatabase, tableName: TableName): EncryptedTableWrapper {
  switch (tableName) {
    case "accounts":
      return database.accounts as unknown as EncryptedTableWrapper;
    case "journalEntries":
      return database.journalEntries as unknown as EncryptedTableWrapper;
    case "journalLines":
      return database.journalLines as unknown as EncryptedTableWrapper;
    case "contacts":
      return database.contacts as unknown as EncryptedTableWrapper;
    case "interactions":
      return database.interactions as unknown as EncryptedTableWrapper;
    case "contactLinks":
      return database.contactLinks as unknown as EncryptedTableWrapper;
    case "settings":
      return database.settings as unknown as EncryptedTableWrapper;
  }
}

function createEncryptedTableWrapper(tableName: TableName, vault: ReturnType<typeof useVault>) {
  const originalTable = getTable(db, tableName);

  if (!originalTable || !isSensitiveTable(tableName)) {
    return originalTable;
  }

  return {
    async add(item: Record<string, unknown>) {
      const encryptedItem = await vault.encryptTableRow(tableName, item);
      return originalTable.add(encryptedItem);
    },

    async put(item: Record<string, unknown>) {
      const encryptedItem = await vault.encryptTableRow(tableName, item);
      return originalTable.put(encryptedItem);
    },

    async update(id: number | string, changes: Record<string, unknown>) {
      const existing = await originalTable.get(id);
      if (!existing) return 0;

      const merged = { ...existing, ...changes };
      const encryptedMerged = await vault.encryptTableRow(tableName, merged);
      return originalTable.update(id, encryptedMerged);
    },

    async delete(id: number | string) {
      return originalTable.delete(id);
    },

    async get(id: number | string) {
      const item = await originalTable.get(id);
      if (!item) return undefined;
      return vault.decryptTableRow(tableName, item);
    },

    async toArray() {
      const items = await originalTable.toArray();
      const decryptedItems = await Promise.all(items.map((item) => vault.decryptTableRow(tableName, item)));
      return decryptedItems;
    },

    where(index: string) {
      const originalWhere = originalTable.where(index);
      return {
        equals: (value: unknown) => ({
          async toArray() {
            const items = await originalWhere.equals(value).toArray();
            return Promise.all(items.map((item) => vault.decryptTableRow(tableName, item)));
          },
          async count() {
            return originalWhere.equals(value).count();
          },
          async delete() {
            return originalWhere.equals(value).delete();
          },
        }),
      };
    },
  };
}

export function useEncryptedDb() {
  const vault = useVault();

  return {
    accounts: createEncryptedTableWrapper("accounts", vault),
    journalEntries: createEncryptedTableWrapper("journalEntries", vault),
    journalLines: createEncryptedTableWrapper("journalLines", vault),
    contacts: createEncryptedTableWrapper("contacts", vault),
    interactions: createEncryptedTableWrapper("interactions", vault),
    contactLinks: createEncryptedTableWrapper("contactLinks", vault),
    settings: db.settings as unknown as EncryptedTableWrapper,
  };
}