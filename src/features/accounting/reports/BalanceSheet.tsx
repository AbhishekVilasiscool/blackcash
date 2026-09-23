import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { Download, Calendar } from "lucide-react";
import { db } from "../../../lib/db";
import { type Account, type JournalEntry } from "../../../lib/db";
import { Card } from "../../../components/ornament/Card";
import { Button } from "../../../components/ui/Button";
import { Section } from "../../../components/ornament/Section";
import { useClientId } from "../../../hooks/useClientId";
import { balanceSheet, type BalanceSheetResult } from "../../../lib/finance/ledger";

export function BalanceSheet() {
  const clientId = useClientId();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

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

  const result: BalanceSheetResult = useMemo(() => balanceSheet(accounts, journalLines, journalEntries, asOfDate), [accounts, journalLines, journalEntries, asOfDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  };

  const handleExport = () => {
    const lines = [
      "Balance Sheet",
      `As of ${asOfDate}`,
      "",
      "ASSETS",
      "Account Code,Account Name,Amount",
      ...result.assetRows.map((row) => [row.accountCode, row.accountName, formatCurrency(row.amount)].join(",")),
      `Total Assets,,${formatCurrency(result.totalAssets)}`,
      "",
      "LIABILITIES",
      "Account Code,Account Name,Amount",
      ...result.liabilityRows.map((row) => [row.accountCode, row.accountName, formatCurrency(row.amount)].join(",")),
      `Total Liabilities,,${formatCurrency(result.totalLiabilities)}`,
      "",
      "EQUITY",
      "Account Code,Account Name,Amount",
      ...result.equityRows.map((row) => [row.accountCode, row.accountName, formatCurrency(row.amount)].join(",")),
      `Total Equity,,${formatCurrency(result.totalEquity)}`,
      "",
      `Total Liabilities + Equity,,${formatCurrency(result.totalLiabilities + result.totalEquity)}`,
      `Balanced,${result.isBalanced ? "YES" : "NO"}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-sheet-${asOfDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <Section n={1} title="Balance Sheet">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              <span>As of date:</span>
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
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
                  <td className="p-3" colSpan={3}>ASSETS</td>
                </tr>
                {result.assetRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-white/5">
                    <td className="p-3 font-mono text-text">{row.accountCode}</td>
                    <td className="p-3 font-medium text-text">{row.accountName}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Assets</td>
                  <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(result.totalAssets)}</td>
                </tr>
              </tfoot>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-white/5 font-semibold">
                  <td className="p-3" colSpan={3}>LIABILITIES</td>
                </tr>
                {result.liabilityRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-white/5">
                    <td className="p-3 font-mono text-text">{row.accountCode}</td>
                    <td className="p-3 font-medium text-text">{row.accountName}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Liabilities</td>
                  <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(result.totalLiabilities)}</td>
                </tr>
              </tfoot>
              <tbody className="divide-y divide-border/50">
                <tr className="bg-white/5 font-semibold">
                  <td className="p-3" colSpan={3}>EQUITY</td>
                </tr>
                {result.equityRows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-white/5">
                    <td className="p-3 font-mono text-text">{row.accountCode}</td>
                    <td className="p-3 font-medium text-text">{row.accountName}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Equity</td>
                  <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(result.totalEquity)}</td>
                </tr>
                <tr className="bg-white/5 font-bold border-t-2 border-border">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={2}>Total Liabilities + Equity</td>
                  <td className="p-3 text-right font-mono tabular-nums text-text">{formatCurrency(result.totalLiabilities + result.totalEquity)}</td>
                </tr>
                <tr className="bg-white/5 font-bold">
                  <td className="p-3 text-right font-caps text-[10px] tracking-wider" colSpan={3}>
                    {result.isBalanced ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400">
                        Balance Sheet Balances ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium bg-red-500/10 text-red-400">
                        OUT OF BALANCE: Assets ≠ Liabilities + Equity
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {result.assetRows.length === 0 && result.liabilityRows.length === 0 && result.equityRows.length === 0 && (
          <div className="text-center py-12 text-muted">
            No balances found for the selected date.
          </div>
        )}
      </Section>
    </div>
  );
}

export default BalanceSheet;