import type { JournalEntry, JournalLine, Account, AccountType } from "../db";

export interface ValidationError {
  code: string;
  message: string;
  lineIndex?: number;
}

export type ValidationResult =
  | { ok: true; entry: JournalEntry; lines: JournalLine[] }
  | { ok: false; errors: ValidationError[] };

export interface AccountBalance {
  accountId: number;
  accountCode: string;
  accountName: string;
  type: AccountType;
  subtype: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  normalBalance: "debit" | "credit";
}

export interface TrialBalanceRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  type: AccountType;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface IncomeStatementRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface IncomeStatementResult {
  revenueRows: IncomeStatementRow[];
  expenseRows: IncomeStatementRow[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

export interface BalanceSheetRow {
  accountId: number;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface BalanceSheetResult {
  assetRows: BalanceSheetRow[];
  liabilityRows: BalanceSheetRow[];
  equityRows: BalanceSheetRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

/**
 * Validates a journal entry for double-entry accounting rules.
 * Returns a typed Result instead of throwing exceptions.
 */
export function validateEntry(
  entry: JournalEntry,
  lines: JournalLine[],
  existingEntries: JournalEntry[] = []
): ValidationResult {
  const errors: ValidationError[] = [];

  // At least 2 lines required
  if (lines.length < 2) {
    errors.push({
      code: "MIN_LINES",
      message: "A journal entry must have at least 2 lines",
    });
  }

  // No zero-amount lines
  lines.forEach((line, index) => {
    if (line.debit === 0 && line.credit === 0) {
      errors.push({
        code: "ZERO_AMOUNT",
        message: `Line ${index + 1}: Amount cannot be zero`,
        lineIndex: index,
      });
    }
    if (line.debit > 0 && line.credit > 0) {
      errors.push({
        code: "BOTH_SIDES",
        message: `Line ${index + 1}: A line cannot have both debit and credit`,
        lineIndex: index,
      });
    }
  });

  // Debits must equal credits
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

  if (totalDebits !== totalCredits) {
    errors.push({
      code: "UNBALANCED",
      message: `Debits (${totalDebits}) do not equal credits (${totalCredits})`,
    });
  }

  // Check for duplicate reference in posted entries
  if (entry.reference && entry.status === "posted") {
    const duplicate = existingEntries.find(
      (e) => e.reference === entry.reference && e.id !== entry.id && e.status === "posted"
    );
    if (duplicate) {
      errors.push({
        code: "DUPLICATE_REFERENCE",
        message: `Reference "${entry.reference}" already exists in a posted entry`,
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, entry, lines };
}

/**
 * Posts a draft entry - transitions status from draft to posted
 */
export function postEntry(
  entry: JournalEntry,
  lines: JournalLine[]
): ValidationResult {
  if (entry.status !== "draft") {
    return {
      ok: false,
      errors: [{ code: "INVALID_STATUS", message: "Only draft entries can be posted" }],
    };
  }

  const validation = validateEntry({ ...entry, status: "posted" }, lines);
  if (!validation.ok) return validation;

  return { ok: true, entry: { ...entry, status: "posted" }, lines };
}

/**
 * Voids a posted entry - creates a reversing entry
 * Never mutates a posted entry's lines directly
 */
export function voidEntry(
  entry: JournalEntry,
  lines: JournalLine[],
  newEntryId: number,
  newLines: JournalLine[]
): ValidationResult {
  if (entry.status !== "posted") {
    return {
      ok: false,
      errors: [{ code: "INVALID_STATUS", message: "Only posted entries can be voided" }],
    };
  }

  // Verify the new lines are exact reversals
  if (lines.length !== newLines.length) {
    return {
      ok: false,
      errors: [{ code: "REVERSAL_LINE_COUNT", message: "Reversing entry must have same number of lines" }],
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const orig = lines[i];
    const rev = newLines[i];
    if (orig.accountId !== rev.accountId) {
      return {
        ok: false,
        errors: [{ code: "REVERSAL_ACCOUNT_MISMATCH", message: `Line ${i + 1}: Account mismatch in reversal` }],
      };
    }
    if (orig.debit !== rev.credit || orig.credit !== rev.debit) {
      return {
        ok: false,
        errors: [{ code: "REVERSAL_AMOUNT_MISMATCH", message: `Line ${i + 1}: Amounts must be reversed` }],
      };
    }
  }

  return {
    ok: true,
    entry: { ...entry, status: "void", voidedAt: new Date().toISOString(), reversedEntryId: newEntryId },
    lines: newLines,
  };
}

/**
 * Determines the normal balance side for an account type
 */
function getNormalBalance(type: AccountType): "debit" | "credit" {
  switch (type) {
    case "asset":
    case "expense":
      return "debit";
    case "liability":
    case "equity":
    case "revenue":
      return "credit";
    default:
      return "debit";
  }
}

/**
 * Calculates the balance of a single account as of a given date
 */
export function accountBalance(
  account: Account,
  lines: JournalLine[],
  entries: JournalEntry[],
  asOfDate?: string
): AccountBalance {
  const cutoffDate = asOfDate ? new Date(asOfDate).getTime() : Infinity;

  // Filter posted lines up to the cutoff date
  const postedLines = lines.filter((line) => {
    if (line.accountId !== account.id) return false;
    const entry = entries.find((e) => e.id === line.entryId);
    if (!entry || entry.status !== "posted") return false;
    if (asOfDate && new Date(entry.date).getTime() > cutoffDate) return false;
    return true;
  });

  const debitTotal = postedLines.reduce((sum, line) => sum + line.debit, 0);
  const creditTotal = postedLines.reduce((sum, line) => sum + line.credit, 0);

  const normalBalance = getNormalBalance(account.type);
  let balance: number;

  if (normalBalance === "debit") {
    balance = debitTotal - creditTotal;
  } else {
    balance = creditTotal - debitTotal;
  }

  return {
    accountId: account.id!,
    accountCode: account.code,
    accountName: account.name,
    type: account.type,
    subtype: account.subtype,
    debitTotal,
    creditTotal,
    balance,
    normalBalance,
  };
}

/**
 * Generates a trial balance as of a given date
 */
export function trialBalance(
  accounts: Account[],
  lines: JournalLine[],
  entries: JournalEntry[],
  asOfDate?: string
): TrialBalanceResult {
  const balances = accounts
    .filter((a) => a.isActive)
    .map((account) => accountBalance(account, lines, entries, asOfDate))
    .filter((b) => b.balance !== 0);

  const rows: TrialBalanceRow[] = balances.map((b) => ({
    accountId: b.accountId,
    accountCode: b.accountCode,
    accountName: b.accountName,
    type: b.type,
    debitBalance: b.normalBalance === "debit" ? b.balance : 0,
    creditBalance: b.normalBalance === "credit" ? b.balance : 0,
  }));

  const totalDebits = rows.reduce((sum, r) => sum + r.debitBalance, 0);
  const totalCredits = rows.reduce((sum, r) => sum + r.creditBalance, 0);

  return {
    rows,
    totalDebits,
    totalCredits,
    isBalanced: totalDebits === totalCredits,
  };
}

/**
 * Generates an income statement for a date range
 */
export function incomeStatement(
  accounts: Account[],
  lines: JournalLine[],
  entries: JournalEntry[],
  startDate: string,
  endDate: string
): IncomeStatementResult {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Filter posted entries in date range
  const postedEntries = entries.filter(
    (e) => e.status === "posted" && new Date(e.date).getTime() >= start && new Date(e.date).getTime() <= end
  );
  const postedEntryIds = new Set(postedEntries.map((e) => e.id));

  const relevantLines = lines.filter((l) => postedEntryIds.has(l.entryId));

  const revenueAccounts = accounts.filter((a) => a.type === "revenue" && a.isActive);
  const expenseAccounts = accounts.filter((a) => a.type === "expense" && a.isActive);

  const revenueRows: IncomeStatementRow[] = revenueAccounts.map((account) => {
    const accountLines = relevantLines.filter((l) => l.accountId === account.id);
    const creditTotal = accountLines.reduce((sum, l) => sum + l.credit, 0);
    const debitTotal = accountLines.reduce((sum, l) => sum + l.debit, 0);
    const amount = creditTotal - debitTotal; // Revenue increases on credit
    return {
      accountId: account.id!,
      accountCode: account.code,
      accountName: account.name,
      amount,
    };
  });

  const expenseRows: IncomeStatementRow[] = expenseAccounts.map((account) => {
    const accountLines = relevantLines.filter((l) => l.accountId === account.id);
    const debitTotal = accountLines.reduce((sum, l) => sum + l.debit, 0);
    const creditTotal = accountLines.reduce((sum, l) => sum + l.credit, 0);
    const amount = debitTotal - creditTotal; // Expenses increase on debit
    return {
      accountId: account.id!,
      accountCode: account.code,
      accountName: account.name,
      amount,
    };
  });

  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRows.reduce((sum, r) => sum + r.amount, 0);

  return {
    revenueRows,
    expenseRows,
    totalRevenue,
    totalExpense,
    netIncome: totalRevenue - totalExpense,
  };
}

/**
 * Generates a balance sheet as of a given date
 */
export function balanceSheet(
  accounts: Account[],
  lines: JournalLine[],
  entries: JournalEntry[],
  asOfDate: string
): BalanceSheetResult {
  const assetAccounts = accounts.filter((a) => a.type === "asset" && a.isActive);
  const liabilityAccounts = accounts.filter((a) => a.type === "liability" && a.isActive);
  const equityAccounts = accounts.filter((a) => a.type === "equity" && a.isActive);

  const assetRows: BalanceSheetRow[] = assetAccounts.map((account) => {
    const bal = accountBalance(account, lines, entries, asOfDate);
    return {
      accountId: account.id!,
      accountCode: account.code,
      accountName: account.name,
      amount: bal.balance,
    };
  });

  const liabilityRows: BalanceSheetRow[] = liabilityAccounts.map((account) => {
    const bal = accountBalance(account, lines, entries, asOfDate);
    return {
      accountId: account.id!,
      accountCode: account.code,
      accountName: account.name,
      amount: bal.balance,
    };
  });

  const equityRows: BalanceSheetRow[] = equityAccounts.map((account) => {
    const bal = accountBalance(account, lines, entries, asOfDate);
    return {
      accountId: account.id!,
      accountCode: account.code,
      accountName: account.name,
      amount: bal.balance,
    };
  });

  const totalAssets = assetRows.reduce((sum, r) => sum + r.amount, 0);
  const totalLiabilities = liabilityRows.reduce((sum, r) => sum + r.amount, 0);
  const totalEquity = equityRows.reduce((sum, r) => sum + r.amount, 0);

  return {
    assetRows,
    liabilityRows,
    equityRows,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: totalAssets === totalLiabilities + totalEquity,
  };
}