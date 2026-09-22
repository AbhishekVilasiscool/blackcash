import Dexie, { type EntityTable } from "dexie";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type AssetSubtype =
  | "cash"
  | "bank"
  | "receivable"
  | "inventory"
  | "fixed_asset"
  | "other_asset";

export type LiabilitySubtype =
  | "payable"
  | "loan"
  | "tax_payable"
  | "accrued_expense"
  | "deferred_revenue"
  | "other_liability";

export type EquitySubtype =
  | "capital"
  | "retained_earnings"
  | "drawings"
  | "other_equity";

export type RevenueSubtype =
  | "sales"
  | "service_revenue"
  | "interest_income"
  | "other_revenue";

export type ExpenseSubtype =
  | "cost_of_goods_sold"
  | "payroll"
  | "rent"
  | "utilities"
  | "marketing"
  | "professional_fees"
  | "insurance"
  | "depreciation"
  | "interest_expense"
  | "tax_expense"
  | "other_expense";

export type AccountSubtype =
  | AssetSubtype
  | LiabilitySubtype
  | EquitySubtype
  | RevenueSubtype
  | ExpenseSubtype;

export type JournalEntryStatus = "draft" | "posted" | "void";

export interface Account {
  id?: number;
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  parentId?: number;
  isActive: boolean;
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id?: number;
  date: string;
  memo: string;
  reference: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  status: JournalEntryStatus;
  reversedEntryId?: number;
  voidedAt?: string;
}

export interface JournalLine {
  id?: number;
  entryId: number;
  accountId: number;
  debit: number;
  credit: number;
  memo: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Contact {
  id?: number;
  name: string;
  type: string;
  company?: string;
  email?: string;
  phone?: string;
  tags: string[];
  followUpDate?: string;
  createdAt: string;
}

export interface ContactInteraction {
  id?: number;
  contactId: number;
  kind: string;
  note: string;
  date: string;
  createdAt: string;
}

export interface ContactLink {
  id?: number;
  contactId: number;
  kind: string;
  refId: number;
  label: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export const ASSET_SUBTYPES: readonly AssetSubtype[] = [
  "cash",
  "bank",
  "receivable",
  "inventory",
  "fixed_asset",
  "other_asset",
];

export const LIABILITY_SUBTYPES: readonly LiabilitySubtype[] = [
  "payable",
  "loan",
  "tax_payable",
  "accrued_expense",
  "deferred_revenue",
  "other_liability",
];

export const EQUITY_SUBTYPES: readonly EquitySubtype[] = [
  "capital",
  "retained_earnings",
  "drawings",
  "other_equity",
];

export const REVENUE_SUBTYPES: readonly RevenueSubtype[] = [
  "sales",
  "service_revenue",
  "interest_income",
  "other_revenue",
];

export const EXPENSE_SUBTYPES: readonly ExpenseSubtype[] = [
  "cost_of_goods_sold",
  "payroll",
  "rent",
  "utilities",
  "marketing",
  "professional_fees",
  "insurance",
  "depreciation",
  "interest_expense",
  "tax_expense",
  "other_expense",
];

export const SUBTYPE_BY_TYPE: Record<AccountType, readonly string[]> = {
  asset: ASSET_SUBTYPES,
  liability: LIABILITY_SUBTYPES,
  equity: EQUITY_SUBTYPES,
  revenue: REVENUE_SUBTYPES,
  expense: EXPENSE_SUBTYPES,
};

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<Account, "id" | "createdAt" | "updatedAt">[] = [
  // Assets (1000-1999)
  { code: "1000", name: "Cash on Hand", type: "asset", subtype: "cash", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1010", name: "Petty Cash", type: "asset", subtype: "cash", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1100", name: "Checking Account", type: "asset", subtype: "bank", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1110", name: "Savings Account", type: "asset", subtype: "bank", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1200", name: "Accounts Receivable", type: "asset", subtype: "receivable", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1210", name: "Allowance for Doubtful Accounts", type: "asset", subtype: "receivable", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1300", name: "Inventory", type: "asset", subtype: "inventory", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1500", name: "Prepaid Expenses", type: "asset", subtype: "other_asset", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1600", name: "Equipment", type: "asset", subtype: "fixed_asset", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1610", name: "Accumulated Depreciation - Equipment", type: "asset", subtype: "fixed_asset", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1700", name: "Vehicles", type: "asset", subtype: "fixed_asset", parentId: undefined, isActive: true, clientId: 0 },
  { code: "1710", name: "Accumulated Depreciation - Vehicles", type: "asset", subtype: "fixed_asset", parentId: undefined, isActive: true, clientId: 0 },

  // Liabilities (2000-2999)
  { code: "2000", name: "Accounts Payable", type: "liability", subtype: "payable", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2100", name: "Accrued Expenses", type: "liability", subtype: "accrued_expense", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2200", name: "Sales Tax Payable", type: "liability", subtype: "tax_payable", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2300", name: "Payroll Tax Payable", type: "liability", subtype: "tax_payable", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2400", name: "Short-term Loans", type: "liability", subtype: "loan", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2500", name: "Long-term Loans", type: "liability", subtype: "loan", parentId: undefined, isActive: true, clientId: 0 },
  { code: "2600", name: "Deferred Revenue", type: "liability", subtype: "deferred_revenue", parentId: undefined, isActive: true, clientId: 0 },

  // Equity (3000-3999)
  { code: "3000", name: "Owner's Capital", type: "equity", subtype: "capital", parentId: undefined, isActive: true, clientId: 0 },
  { code: "3100", name: "Retained Earnings", type: "equity", subtype: "retained_earnings", parentId: undefined, isActive: true, clientId: 0 },
  { code: "3200", name: "Owner's Drawings", type: "equity", subtype: "drawings", parentId: undefined, isActive: true, clientId: 0 },

  // Revenue (4000-4999)
  { code: "4000", name: "Sales Revenue", type: "revenue", subtype: "sales", parentId: undefined, isActive: true, clientId: 0 },
  { code: "4100", name: "Service Revenue", type: "revenue", subtype: "service_revenue", parentId: undefined, isActive: true, clientId: 0 },
  { code: "4200", name: "Interest Income", type: "revenue", subtype: "interest_income", parentId: undefined, isActive: true, clientId: 0 },

  // Expenses (5000-5999)
  { code: "5000", name: "Cost of Goods Sold", type: "expense", subtype: "cost_of_goods_sold", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5100", name: "Payroll Expense", type: "expense", subtype: "payroll", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5200", name: "Rent Expense", type: "expense", subtype: "rent", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5300", name: "Utilities Expense", type: "expense", subtype: "utilities", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5400", name: "Marketing Expense", type: "expense", subtype: "marketing", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5500", name: "Professional Fees", type: "expense", subtype: "professional_fees", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5600", name: "Insurance Expense", type: "expense", subtype: "insurance", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5700", name: "Depreciation Expense", type: "expense", subtype: "depreciation", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5800", name: "Interest Expense", type: "expense", subtype: "interest_expense", parentId: undefined, isActive: true, clientId: 0 },
  { code: "5900", name: "Tax Expense", type: "expense", subtype: "tax_expense", parentId: undefined, isActive: true, clientId: 0 },
];

/**
 * Local-first storage layer for double-entry accounting.
 * Everything lives in the browser's IndexedDB — no backend, no account, nothing leaves the device.
 */
export class BlackcashDatabase extends Dexie {
  accounts!: EntityTable<Account, "id">;
  journalEntries!: EntityTable<JournalEntry, "id">;
  journalLines!: EntityTable<JournalLine, "id">;
  settings!: EntityTable<Setting, "key">;
  contacts!: EntityTable<Contact, "id">;
  interactions!: EntityTable<ContactInteraction, "id">;
  contactLinks!: EntityTable<ContactLink, "id">;

  constructor() {
    super("blackcash");
    this.version(3).stores({
      accounts: "++id, code, name, type, subtype, parentId, isActive, clientId, createdAt",
      journalEntries: "++id, date, memo, reference, clientId, createdAt, status, reversedEntryId",
      journalLines: "++id, entryId, accountId, debit, credit, createdAt",
      settings: "key",
      contacts: "++id, name, type, company, email, phone, *tags, createdAt",
      interactions: "++id, contactId, kind, note, date",
      contactLinks: "++id, contactId, kind",
    });
  }

  /**
   * Seed the default chart of accounts for a new client workspace.
   */
  async seedChartOfAccounts(clientId: number): Promise<void> {
    const existingCount = await this.accounts.where("clientId").equals(clientId).count();
    if (existingCount > 0) return;

    const now = new Date().toISOString();
    const accounts = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      ...acc,
      clientId,
      createdAt: now,
      updatedAt: now,
    }));
    await this.accounts.bulkAdd(accounts);
  }
}

export const db = new BlackcashDatabase();