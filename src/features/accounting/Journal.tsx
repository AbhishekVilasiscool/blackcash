import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { Plus, Edit, Search, Save, RotateCcw, X, CheckCircle2 } from "lucide-react";
import { db } from "../../lib/db";
import type { JournalEntry } from "../../lib/db";
import { Card } from "../../components/ornament/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Section } from "../../components/ornament/Section";
import { WaxSeal } from "../../components/ornament/WaxSeal";
import { useClientId } from "../../hooks/useClientId";
import {
  listJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  voidJournalEntry,
  type JournalEntryWithLines,
  type JournalEntryListItem,
} from "../../lib/repos/journalRepo";

const STATUS_SEAL_CONFIG = {
  draft: { tone: "oxblood" as const, label: "Draft", accent: "#7A1F26" },
  posted: { tone: "accent" as const, label: "Posted", accent: "var(--accent)" },
  void: { tone: "oxblood" as const, label: "Void", accent: "#7A1F26" },
};

interface LineFormData {
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
}

interface EntryFormData {
  date: string;
  memo: string;
  reference: string;
  lines: LineFormData[];
}

const emptyLine = (): LineFormData => ({ accountId: "", debit: "", credit: "", memo: "" });

export function Journal() {
  const clientId = useClientId();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "posted" | "void">("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryWithLines | null>(null);
  const [formData, setFormData] = useState<EntryFormData>({
    date: new Date().toISOString().split("T")[0],
    memo: "",
    reference: "",
    lines: [emptyLine()],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [showReversalInfo, setShowReversalInfo] = useState<{ originalId: number; reversalId: number } | null>(null);
  const [refresh, setRefresh] = useState(0);

  const entries = useLiveQuery(
    () => listJournalEntries(db, clientId, { status: statusFilter === "all" ? undefined : statusFilter, query: searchQuery }),
    [clientId, statusFilter, searchQuery, refresh]
  ) ?? [];

  const accounts = useLiveQuery(
    () => db.accounts.where("clientId").equals(clientId).filter((a) => a.isActive).toArray(),
    [clientId]
  ) ?? [];

  const runningTotals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of formData.lines) {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    }
    return { totalDebit, totalCredit, balanced: totalDebit === totalCredit && totalDebit > 0 };
  }, [formData.lines]);

  const canPost = runningTotals.balanced && formData.lines.length >= 2 && formData.memo.trim() !== "" && formData.date !== "";

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      memo: "",
      reference: "",
      lines: [emptyLine()],
    });
    setErrors([]);
    setEditingEntry(null);
  }

  function handleOpenDrawer(entry?: JournalEntryWithLines) {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        date: entry.date,
        memo: entry.memo,
        reference: entry.reference,
        lines: entry.lines.map((line) => ({
          accountId: String(line.accountId),
          debit: line.debit > 0 ? String(line.debit) : "",
          credit: line.credit > 0 ? String(line.credit) : "",
          memo: line.memo,
        })),
      });
    } else {
      resetForm();
    }
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setEditingEntry(null);
    setErrors([]);
  }

  function updateLine(index: number, field: keyof LineFormData, value: string) {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
    setErrors([]);
  }

  function addLine() {
    setFormData({ ...formData, lines: [...formData.lines, emptyLine()] });
  }

  function removeLine(index: number) {
    if (formData.lines.length <= 2) return;
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const validLines = formData.lines
      .map((line) => ({
        accountId: parseInt(line.accountId, 10),
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        memo: line.memo,
      }))
      .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));

    if (validLines.length < 2) {
      setErrors(["At least 2 lines with amounts are required"]);
      return;
    }

    const totalDebit = validLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = validLines.reduce((sum, l) => sum + l.credit, 0);
    if (totalDebit !== totalCredit) {
      setErrors([`Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})`]);
      return;
    }

    const entryData: Omit<JournalEntry, "id" | "clientId" | "createdAt" | "updatedAt"> = {
      date: formData.date,
      memo: formData.memo,
      reference: formData.reference,
      status: "draft",
    };

    try {
      if (editingEntry) {
        await updateJournalEntry(db, editingEntry.id!, entryData, validLines);
      } else {
        await createJournalEntry(db, { ...entryData, clientId }, validLines);
      }
      setRefresh((v) => v + 1);
      handleCloseDrawer();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Failed to save entry"]);
    }
  }

  async function handlePost() {
    if (!editingEntry) return;
    try {
      await postJournalEntry(db, editingEntry.id!);
      setRefresh((v) => v + 1);
      handleCloseDrawer();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Failed to post entry"]);
    }
  }

  async function handleVoid() {
    if (!editingEntry) return;
    if (!confirm("Void this posted entry? This creates a reversing entry and cannot be undone.")) return;
    try {
      const entryId = editingEntry.id!;
      const result = await voidJournalEntry(db, entryId);
      setShowReversalInfo({ originalId: entryId, reversalId: result.reversal.id! });
      setRefresh((v) => v + 1);
      handleCloseDrawer();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Failed to void entry"]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Section n={1} title="Journal">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted" />
            <Input
              placeholder="Search entries by memo, reference, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
              <option value="void">Void</option>
            </select>
            <Button onClick={() => handleOpenDrawer()} className="ml-2">
              <Plus className="h-4 w-4 mr-2" /> New Entry
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 text-muted">
            No journal entries found. Click "New Entry" to create your first entry.
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-white/5">
                    <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Date</th>
                    <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Memo</th>
                    <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Reference</th>
                    <th className="text-right p-3 font-caps text-[10px] tracking-wider text-muted">Total</th>
                    <th className="text-center p-3 font-caps text-[10px] tracking-wider text-muted">Status</th>
                    <th className="text-right p-3 font-caps text-[10px] tracking-wider text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {entries.map((entry: JournalEntryListItem) => {
                    const sealConfig = STATUS_SEAL_CONFIG[entry.status];
                    const isVoid = entry.status === "void";
                    return (
                      <tr key={entry.id} className={`hover:bg-white/5 ${isVoid ? "opacity-50" : ""}`}>
                        <td className="p-3 font-mono text-text whitespace-nowrap">{entry.date}</td>
                        <td className="p-3 font-medium text-text truncate max-w-xs">{entry.memo || "—"}</td>
                        <td className="p-3 text-muted font-mono">{entry.reference || "—"}</td>
                        <td className="p-3 text-right font-mono tabular-nums text-text">
                          {entry.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <WaxSeal
                              size={24}
                              accent={sealConfig.accent}
                              tone={sealConfig.tone}
                              aria-label={`${sealConfig.label} status`}
                            />
                            <span className="font-caps text-[10px] leading-tight">{sealConfig.label}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {entry.status === "draft" && (
                              <>
                                <Button
                                  variant="ghost"
                                  className="px-3 py-1.5 text-sm"
                                  onClick={() => handleOpenDrawer(entry as JournalEntryWithLines)}
                                  aria-label={`Edit entry #${entry.id}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="primary" className="px-3 py-1.5 text-sm" onClick={() => { setEditingEntry(entry as JournalEntryWithLines); handlePost(); }}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Post
                                </Button>
                              </>
                            )}
                            {entry.status === "posted" && (
                              <>
                                <Button
                                  variant="ghost"
                                  className="px-3 py-1.5 text-sm"
                                  onClick={() => handleOpenDrawer(entry as JournalEntryWithLines)}
                                  aria-label={`View entry #${entry.id}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="danger" className="px-3 py-1.5 text-sm" onClick={handleVoid}>
                                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                  Void
                                </Button>
                              </>
                            )}
                            {entry.status === "void" && (
                              <Button
                                variant="ghost"
                                className="px-3 py-1.5 text-sm"
                                onClick={() => handleOpenDrawer(entry as JournalEntryWithLines)}
                                aria-label={`View voided entry #${entry.id}`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {entry.reversedEntryId && (
                              <Button
                                variant="ghost"
                                className="px-3 py-1.5 text-sm"
                                onClick={() => {
                                  const entryId = entry.id as unknown as number;
                                  const originalId = entry.reversedEntryId as unknown as number;
                                  setShowReversalInfo({ originalId, reversalId: entryId });
                                }}
                                aria-label={`View reversal for entry #${entry.id as unknown as number}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Section>

      <div
        className={`fixed inset-0 z-50 flex items-end justify-center ${isDrawerOpen ? "block" : "hidden"}`}
        onClick={handleCloseDrawer}
      >
        <div className="absolute inset-0 bg-black/50" onClick={handleCloseDrawer} />
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--bg-2)] border border-border rounded-t-xl p-6 shadow-xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">
              {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </h2>
            <button onClick={handleCloseDrawer} className="p-1 rounded-lg hover:bg-white/5 text-muted" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          {errors.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              <ul className="list-disc pl-4 space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-caps text-muted mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-caps text-muted mb-1">Memo</label>
                <Input
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="Description of the transaction"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-caps text-muted mb-1">Reference</label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Optional reference number"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-caps text-sm tracking-wider text-muted">Lines</h3>
                <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={addLine} disabled={formData.lines.length >= 20}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-white/5">
                      <th className="text-left p-2 font-caps text-[10px] tracking-wider text-muted w-48">Account</th>
                      <th className="text-right p-2 font-caps text-[10px] tracking-wider text-muted w-32">Debit</th>
                      <th className="text-right p-2 font-caps text-[10px] tracking-wider text-muted w-32">Credit</th>
                      <th className="text-left p-2 font-caps text-[10px] tracking-wider text-muted flex-1">Memo</th>
                      <th className="text-center p-2 font-caps text-[10px] tracking-wider text-muted w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="p-2">
                          <select
                            value={line.accountId}
                            onChange={(e) => updateLine(index, "accountId", e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text focus:outline-2 focus:outline-accent"
                          >
                            <option value="">Select account</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={String(acc.id)}>
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit}
                            onChange={(e) => updateLine(index, "debit", e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text text-right font-mono focus:outline-2 focus:outline-accent"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit}
                            onChange={(e) => updateLine(index, "credit", e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text text-right font-mono focus:outline-2 focus:outline-accent"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.memo}
                            onChange={(e) => updateLine(index, "memo", e.target.value)}
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text focus:outline-2 focus:outline-accent"
                            placeholder="Line memo"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => removeLine(index)} disabled={formData.lines.length <= 2} aria-label="Remove line">
                            <X className="h-3.5 w-3.5 text-danger" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/5 font-bold">
                      <td className="p-2 text-right font-caps text-[10px] tracking-wider">Totals</td>
                      <td className="p-2 text-right font-mono tabular-nums text-text">{runningTotals.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-text">{runningTotals.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${runningTotals.balanced ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {runningTotals.balanced ? "Balanced" : "Unbalanced"}
                        </span>
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="ghost" onClick={handleCloseDrawer} className="flex-1">
                Cancel
              </Button>
              {editingEntry?.status === "draft" && (
                <>
                  <Button type="submit" className="flex-1" disabled={!canPost}>
                    <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
                  </Button>
                  <Button variant="primary" type="button" onClick={handlePost} disabled={!canPost} className="flex-1">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Post Entry
                  </Button>
                </>
              )}
              {editingEntry?.status === "posted" && (
                <Button variant="danger" type="button" onClick={handleVoid} className="flex-1">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Void Entry
                </Button>
              )}
              {!editingEntry && (
                <Button type="submit" className="flex-1" disabled={!canPost}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Create Entry
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showReversalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowReversalInfo(null)}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReversalInfo(null)} />
          <div className="relative w-full max-w-md bg-[var(--bg-2)] border border-border rounded-xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-4">Entry Voided</h3>
            <div className="space-y-2 text-sm">
              <p>Original entry <span className="font-mono">#{showReversalInfo.originalId}</span> has been voided.</p>
              <p>A reversing entry <span className="font-mono">#{showReversalInfo.reversalId}</span> was created and posted.</p>
              <p className="text-muted">The original shows "Reversed by #X" and the reversal shows "Reverses #Y".</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => setShowReversalInfo(null)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;