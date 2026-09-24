import type { BlackcashDatabase } from "../db";
import type { JournalEntry, JournalLine, Account } from "../db";
import { validateEntry, postEntry, voidEntry } from "../finance/ledger";

function now(): string {
  return new Date().toISOString();
}

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[];
}

export interface JournalEntryListItem {
  id: number;
  date: string;
  memo: string;
  reference: string;
  status: "draft" | "posted" | "void";
  total: number;
  reversedEntryId?: number;
  voidedAt?: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  lines: JournalLine[];
}

export async function listJournalEntries(
  database: BlackcashDatabase,
  clientId: number,
  filters: { status?: string; query?: string } = {}
): Promise<JournalEntryListItem[]> {
  let entries = await database.journalEntries
    .where("clientId")
    .equals(clientId)
    .reverse()
    .toArray();

  if (filters.status) {
    entries = entries.filter((e) => e.status === filters.status);
  }

  if (filters.query) {
    const q = filters.query.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.memo.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q) ||
        String(e.id).includes(q)
    );
  }

  const lines = await database.journalLines.toArray();
  const entryIds = new Set(entries.map((e) => e.id!));
  const linesByEntry = new Map<number, JournalLine[]>();
  for (const line of lines) {
    if (entryIds.has(line.entryId)) {
      const arr = linesByEntry.get(line.entryId) ?? [];
      arr.push(line);
      linesByEntry.set(line.entryId, arr);
    }
  }

  return entries.map((entry) => {
    const entryLines = linesByEntry.get(entry.id!) ?? [];
    const total = entryLines.reduce((sum, line) => sum + line.debit, 0);
    return {
      id: entry.id!,
      date: entry.date,
      memo: entry.memo,
      reference: entry.reference,
      status: entry.status,
      total,
      reversedEntryId: entry.reversedEntryId,
      voidedAt: entry.voidedAt,
      clientId: entry.clientId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lines: entryLines,
    };
  });
}

export async function getJournalEntry(
  database: BlackcashDatabase,
  id: number
): Promise<JournalEntryWithLines | undefined> {
  const entry = await database.journalEntries.get(id);
  if (!entry) return undefined;

  const lines = await database.journalLines.where("entryId").equals(id).toArray();
  return { ...entry, lines: lines as JournalLine[] };
}

export async function createJournalEntry(
  database: BlackcashDatabase,
  entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">,
  lines: Omit<JournalLine, "id" | "entryId" | "createdAt">[]
): Promise<JournalEntryWithLines> {
  // TEMP-DIAG (live trace for silent-submit reports — remove once the root
  // cause is confirmed from a real console trace).
  console.log("[journalRepo] REPO_ENTRY createJournalEntry", JSON.stringify({ entry, lines }));
  const validation = validateEntry(entry as JournalEntry, lines as JournalLine[]);
  if (!validation.ok) {
    console.log(
      "[journalRepo] REPO_VALIDATION_FAILED",
      JSON.stringify(validation.errors.map((e) => e.message)),
    );
    throw new Error(validation.errors.map((e) => e.message).join("; "));
  }

  // TEMP-DIAG (live trace — see note above).
  console.log("[journalRepo] REPO_DB_WRITE_START");
  try {
    const created = await database.transaction("rw", database.journalEntries, database.journalLines, async () => {
      const nowStr = now();
      const entryId = await database.journalEntries.add({
        ...entry,
        createdAt: nowStr,
        updatedAt: nowStr,
      });

      const createdLines = lines.map((line) => ({
        ...line,
        entryId,
        createdAt: nowStr,
      }));
      await database.journalLines.bulkAdd(createdLines as any);

      return { ...entry, id: entryId, createdAt: nowStr, updatedAt: nowStr, lines: createdLines as JournalLine[] };
    });
    console.log("[journalRepo] REPO_DB_WRITE_SUCCESS");
    return created;
  } catch (error) {
    console.log(
      "[journalRepo] REPO_DB_WRITE_FAILED",
      JSON.stringify({
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
    throw error;
  }
}

export async function updateJournalEntry(
  database: BlackcashDatabase,
  id: number,
  entry: Partial<Omit<JournalEntry, "id" | "clientId" | "createdAt">>,
  lines: Omit<JournalLine, "id" | "entryId" | "createdAt">[]
): Promise<JournalEntryWithLines> {
  const existingEntry = await database.journalEntries.get(id);
  if (!existingEntry) throw new Error("Entry not found");

  const mergedEntry = { ...existingEntry, ...entry, updatedAt: now() };
  // TEMP-DIAG (live trace for silent-submit reports — remove once the root
  // cause is confirmed from a real console trace).
  console.log("[journalRepo] REPO_ENTRY updateJournalEntry", JSON.stringify({ id, entry, lines }));
  const validation = validateEntry(mergedEntry, lines as JournalLine[]);
  if (!validation.ok) {
    console.log(
      "[journalRepo] REPO_VALIDATION_FAILED",
      JSON.stringify(validation.errors.map((e) => e.message)),
    );
    throw new Error(validation.errors.map((e) => e.message).join("; "));
  }

  console.log("[journalRepo] REPO_DB_WRITE_START");
  try {
    const updated = await database.transaction("rw", database.journalEntries, database.journalLines, async () => {
      await database.journalEntries.update(id, { ...entry, updatedAt: now() });
      await database.journalLines.where("entryId").equals(id).delete();
      const createdLines = lines.map((line) => ({
        ...line,
        entryId: id,
        createdAt: now(),
      }));
      await database.journalLines.bulkAdd(createdLines as any);
      return { ...mergedEntry, lines: createdLines as JournalLine[] };
    });
    console.log("[journalRepo] REPO_DB_WRITE_SUCCESS");
    return updated;
  } catch (error) {
    console.log(
      "[journalRepo] REPO_DB_WRITE_FAILED",
      JSON.stringify({
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
    throw error;
  }
}

export async function postJournalEntry(
  database: BlackcashDatabase,
  id: number
): Promise<JournalEntryWithLines> {
  const entryWithLines = await getJournalEntry(database, id);
  if (!entryWithLines) throw new Error("Entry not found");

  const result = postEntry(entryWithLines, entryWithLines.lines);
  if (!result.ok) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }

  return await database.transaction("rw", database.journalEntries, database.journalLines, async () => {
    await database.journalEntries.update(id, { status: "posted", updatedAt: now() });
    return { ...entryWithLines, status: "posted" as const };
  });
}

export async function voidJournalEntry(
  database: BlackcashDatabase,
  id: number
): Promise<{ original: JournalEntryWithLines; reversal: JournalEntryWithLines }> {
  const entryWithLines = await getJournalEntry(database, id);
  if (!entryWithLines) throw new Error("Entry not found");

  // Create reversing entry
  const reversedLines: Omit<JournalLine, "id" | "entryId" | "createdAt">[] = entryWithLines.lines.map((line) => ({
    accountId: line.accountId,
    debit: line.credit,
    credit: line.debit,
    memo: `Reversal of: ${line.memo || entryWithLines.memo}`,
  }));

  const reversalEntry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> = {
    date: new Date().toISOString().split("T")[0],
    memo: `Reversal of entry #${entryWithLines.id}: ${entryWithLines.memo}`,
    reference: `REV-${entryWithLines.reference || entryWithLines.id}`,
    clientId: entryWithLines.clientId,
    status: "posted",
    reversedEntryId: id,
  };

  const validation = validateEntry(reversalEntry as JournalEntry, reversedLines as JournalLine[]);
  if (!validation.ok) {
    throw new Error(validation.errors.map((e) => e.message).join("; "));
  }

  const voidResult = voidEntry(entryWithLines, entryWithLines.lines, 0, reversedLines as JournalLine[]);
  if (!voidResult.ok) {
    throw new Error(voidResult.errors.map((e) => e.message).join("; "));
  }

  return await database.transaction("rw", database.journalEntries, database.journalLines, async () => {
    // Create reversal entry
    const reversalId = await database.journalEntries.add({
      ...reversalEntry,
      createdAt: now(),
      updatedAt: now(),
    });

    const reversalLinesWithId = reversedLines.map((line) => ({
      ...line,
      entryId: reversalId,
      createdAt: now(),
    }));
    await database.journalLines.bulkAdd(reversalLinesWithId as any);

    // Void original entry
    await database.journalEntries.update(id, {
      status: "void",
      voidedAt: now(),
      reversedEntryId: reversalId,
      updatedAt: now(),
    });

    const original = { ...entryWithLines, status: "void" as const, voidedAt: now(), reversedEntryId: reversalId, updatedAt: now() };
    const reversal = { ...reversalEntry, id: reversalId, createdAt: now(), updatedAt: now(), lines: reversalLinesWithId as JournalLine[] };

    return { original, reversal };
  });
}

export async function getAccountBalance(
  database: BlackcashDatabase,
  accountId: number,
  asOfDate?: string
): Promise<number> {
  const account = await database.accounts.get(accountId);
  if (!account) return 0;

  const lines = await database.journalLines.where("accountId").equals(accountId).toArray();
  const entries = await database.journalEntries
    .where("status")
    .equals("posted")
    .toArray();

  const { accountBalance } = await import("../finance/ledger");
  const balance = accountBalance(account, lines, entries, asOfDate);
  return balance.balance;
}

export async function getAccountBalances(
  database: BlackcashDatabase,
  clientId: number,
  asOfDate?: string
): Promise<Map<number, number>> {
  const accounts = await database.accounts.where("clientId").equals(clientId).toArray();
  const lines = await database.journalLines.toArray();
  const entries = await database.journalEntries
    .where("status")
    .equals("posted")
    .toArray();

  const { accountBalance } = await import("../finance/ledger");
  const balances = new Map<number, number>();
  for (const account of accounts) {
    const bal = accountBalance(account, lines, entries, asOfDate);
    balances.set(account.id!, bal.balance);
  }
  return balances;
}

export function entryToCsv(entry: JournalEntryWithLines, accounts: Account[]): string {
  const header = "date,memo,reference,accountCode,accountName,debit,credit,lineMemo";
  const lines = entry.lines.map((line) => {
    const account = accounts.find((a) => a.id === line.accountId);
    return [
      entry.date,
      csvEscape(entry.memo),
      csvEscape(entry.reference),
      csvEscape(account?.code ?? ""),
      csvEscape(account?.name ?? ""),
      line.debit.toFixed(2),
      line.credit.toFixed(2),
      csvEscape(line.memo),
    ].join(",");
  });
  return [header, ...lines].join("\r\n") + "\r\n";
}

export function entriesToCsv(entries: JournalEntryListItem[]): string {
  const header = "id,date,memo,reference,status,total";
  const lines = entries.map((e) => [
    e.id,
    e.date,
    csvEscape(e.memo),
    csvEscape(e.reference),
    e.status,
    e.total.toFixed(2),
  ].join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}