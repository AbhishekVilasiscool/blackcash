import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { Download, Calendar } from "lucide-react";
import { db } from "../../../lib/db";
import { type Account, type JournalEntry } from "../../../lib/db";
import { Card } from "../../../components/ornament/Card";
import { Button } from "../../../components/ui/Button";
import { Section } from "../../../components/ornament/Section";
import { useClientId } from "../../../hooks/useClientId";
import { incomeStatement, type IncomeStatementResult } from "../../../lib/finance/ledger";

export function IncomeStatement() {
  const clientId = useClientId();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const accounts = useLiveQuery(
    () => db.accounts.where("clientId").equals(clientId).filter((a: Account) => a.isActive).toArray(),
    [clientId]
  ) ?? [];

  const journalEntries = useLiveQuery(
    () => db.journalEntries.where("clientId").equals(clientId).filter((e: JournalEntry) => e.status === "posted").toArray(),
    [clientId]
  ) ?? [];

  const journalLines = useLiveQuery(
    () => db.journalLines.toArray(),
    []
  ) ?? [];

  const result: IncomeStatementResult = useMemo(() => incomeStatement(accounts, journalLines, journalEntries, startDate, endDate), [accounts, journalLines, journalEntries, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  };

  const handleExport = () => {
    const lines = [
      "Income Statement (P&L)",
      `${startDate} to ${endDate}`,
      "",
      "REVENUE",
      "Account Code,Account Name,Amount",
      ...result.revenueRows.map((row) => [row.accountCode, row.accountName, formatCurrency(row.amount)].join(",")),
      `Total Revenue,,${formatCurrency(result.totalRevenue)}`,
      "",
      "EXPENSES",
      "Account Code,Account Name,Amount",
      ...result.expenseRows.map((row) => [row.accountCode, row.accountName, formatCurrency(row.amount)].join(",")),
      `Total Expenses,,${formatCurrency(result.totalExpense)}`,
      "",
      `Net Income,,${formatCurrency(result.netIncome)}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `income-statement-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <Section n={1} title="Income Statement (P&L)">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              <span>From:</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
              max={endDate}
            />
            <label className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              <span>To:</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Code</th>
                  <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Account Name</th>
                  <th className="text-right p-3 font-caps text-[10px] tracking-wider text-muted">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-white/5 font-semibold">
                  <td className="p-3" colSpan={3}>REVENUE</td>
                </tr>
                {result.revenueRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-white/5">
                    <td className="p-3 font-mono text-text">{row.accountCode}</td>
                    <td className="p-3 font-medium text-text">{row.accountName}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-green-400">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Revenue</td>
                  <td className="p-3 text-right font-mono tabular-nums text-green-400">{formatCurrency(result.totalRevenue)}</td>
                </tr>
              </tfoot>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-white/5 font-semibold">
                  <td className="p-3" colSpan={3}>EXPENSES</td>
                </tr>
                {result.expenseRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-white/5">
                    <td className="p-3 font-mono text-text">{row.accountCode}</td>
                    <td className="p-3 font-medium text-text">{row.accountName}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-red-400">({formatCurrency(row.amount)})</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Expenses</td>
                  <td className="p-3 text-right font-mono tabular-nums text-red-400">({formatCurrency(result.totalExpense)})</td>
                </tr>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Net Income</td>
                  <td className="p-3 text-right font-mono tabular-nums">{result.netIncome >= 0 ? formatCurrency(result.netIncome) : `(${formatCurrency(Math.abs(result.netIncome))})`}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {result.revenueRows.length === 0 && result.expenseRows.length === 0 && (
          <div className="text-center py-12 text-muted">
            No revenue or expense entries found for the selected period.
          </div>
        )}
      </Section>
    </div>
  );
}

export default IncomeStatement;