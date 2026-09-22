import Dexie, { type EntityTable } from "dexie";
import type {
  Contact,
  ContactInteraction,
  ContactLink,
} from "./types/contacts";

export type AccountType =
  | "cash"
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  createdAt: string;
}

export interface Transaction {
  id?: number;
  accountId: number;
  /** Signed amount; positive is an inflow. */
  amount: number;
  /** ISO date string. */
  date: string;
  memo: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

/**
 * Local-first storage layer. Everything lives in the browser's IndexedDB —
 * no backend, no account, nothing leaves the device.
 */
export class BlackcashDatabase extends Dexie {
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<Transaction, "id">;
  settings!: EntityTable<Setting, "key">;
  contacts!: EntityTable<Contact, "id">;
  interactions!: EntityTable<ContactInteraction, "id">;
  contactLinks!: EntityTable<ContactLink, "id">;

  constructor() {
    super("blackcash");
    this.version(1).stores({
      accounts: "++id, name, type, createdAt",
      transactions: "++id, accountId, date, createdAt",
    });
    this.version(2).stores({
      accounts: "++id, name, type, createdAt",
      transactions: "++id, accountId, date, createdAt",
      settings: "key",
      contacts: "++id, name, type, company, email, phone, *tags, createdAt",
      interactions: "++id, contactId, kind, note, date",
      contactLinks: "++id, contactId, kind",
    });
  }
}

export const db = new BlackcashDatabase();