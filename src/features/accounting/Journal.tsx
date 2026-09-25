import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { Plus, Edit, Search, Save, RotateCcw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { db } from "../../lib/db";
import type { JournalEntry, JournalLine } from "../../lib/db";
import { validateEntry } from "../../lib/finance/ledger";
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showReversalInfo, setShowReversalInfo] = useState<{ originalId: number; reversalId: number } | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Permanent on-page save diagnostics: a thin status strip at the bottom of
  // the form mirrors the REAL state transitions of the save below
  // (idle → saving → saved/failed). Never decorative — the failed state
  // shows error.name + the FULL error.message so a broken save is provable
  // on-screen without DevTools.
  type SavePhase = "idle" | "saving" | "saved" | "failed";
  interface SaveStatus {
    phase: SavePhase;
    entryId?: number;
    errorName?: string;
    errorMessage?: string;
  }
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ phase: "idle" });

  // Permanent bound for any save that could hang without settling.
  const SAVE_TIMEOUT_MS = 8000;

  const entries = useLiveQuery(
    () => listJournalEntries(db, clientId, { status: statusFilter === "all" ? undefined : statusFilter, query: searchQuery }),
    [clientId, statusFilter, searchQuery, refresh]
  ) ?? [];

  const accounts = useLiveQuery(
    () => db.accounts.where("clientId").equals(clientId).filter((a) => a.isActive).toArray(),
    [clientId]
  ) ?? [];

  // Single source of truth for line validity: the tested ledger validator.
  // The form maps its string inputs to candidate lines WITHOUT filtering
  // anything out, so every violation surfaces as a visible inline error.
  // (The old code filtered invalid lines away before checking, which let the
  // badge and the submit button disagree with what submit would actually do.)
  const candidateLines: JournalLine[] = useMemo(
    () =>
      formData.lines.map((line) => ({
        entryId: editingEntry?.id ?? 0,
        accountId: line.accountId === "" ? Number.NaN : parseInt(line.accountId, 10),
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        memo: line.memo,
        createdAt: "",
      })),
    [formData.lines, editingEntry],
  );

  const candidateEntry: JournalEntry = useMemo(
    () => ({
      id: editingEntry?.id,
      date: formData.date,
      memo: formData.memo,
      reference: formData.reference,
      clientId,
      createdAt: "",
      updatedAt: "",
      status: "draft" as const,
    }),
    [editingEntry, formData.date, formData.memo, formData.reference, clientId],
  );

  // validateEntry() knows nothing about account selection (it sees numeric
  // ids), so the form adds exactly one rule of its own: every line needs an
  // account. All other ledger rules come straight from the lib function.
  const accountErrors: string[] = useMemo(
    () =>
      formData.lines.flatMap((line, index) =>
        line.accountId === "" ? [`Line ${index + 1}: Select an account`] : [],
      ),
    [formData.lines],
  );

  const lineValidation = useMemo(
    () => validateEntry(candidateEntry, candidateLines),
    [candidateEntry, candidateLines],
  );

  const linesValid = accountErrors.length === 0 && lineValidation.ok;

  const totals = useMemo(
    () => ({
      totalDebit: candidateLines.reduce((sum, line) => sum + line.debit, 0),
      totalCredit: candidateLines.reduce((sum, line) => sum + line.credit, 0),
    }),
    [candidateLines],
  );

  const canPost =
    linesValid &&
    formData.lines.length >= 2 &&
    formData.memo.trim() !== "" &&
    formData.date !== "";

  const isDirty = useMemo(
    () =>
      formData.memo.trim() !== "" ||
      formData.reference.trim() !== "" ||
      formData.lines.some(
        (line) => line.accountId !== "" || line.debit !== "" || line.credit !== "" || line.memo !== "",
      ),
    [formData],
  );

  // Live inline errors: always computed, but only shown once the user has
  // interacted (dirty) or attempted a submit — never shouting at a pristine form.
  const liveErrors: string[] = useMemo(
    () => [
      ...accountErrors,
      ...(lineValidation.ok ? [] : lineValidation.errors.map((error) => error.message)),
    ],
    [accountErrors, lineValidation],
  );
  const visibleLiveErrors = liveErrors.length > 0 && (submitAttempted || isDirty) ? liveErrors : [];

  // A disabled submit button with no explanation reads as "the button is
  // broken". Always name the single next thing blocking submit — gentle
  // progressive hints, never the full error list on a pristine form.
  const submitHint: string | null = useMemo(() => {
    if (canPost) return null;
    if (formData.memo.trim() === "") return "Add a memo to describe this entry.";
    if (formData.lines.length < 2) return "Add at least 2 lines — double-entry needs both sides.";
    if (liveErrors.length > 0) return liveErrors[0];
    if (formData.date === "") return "Pick a date for this entry.";
    return "Complete the entry to enable submit.";
  }, [canPost, formData.memo, formData.lines.length, formData.date, liveErrors]);

  function resetForm() {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      memo: "",
      reference: "",
      lines: [emptyLine()],
    });
    setErrors([]);
    setSubmitAttempted(false);
    setSaveStatus({ phase: "idle" });
    setEditingEntry(null);
  }

  function handleOpenDrawer(entry?: JournalEntryWithLines) {
    setSaveStatus({ phase: "idle" });
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
    setSubmitAttempted(false);
    // NOTE: saveStatus intentionally NOT reset here — the terminal
    // saved/failed state stays inspectable in the (hidden but mounted)
    // drawer until the next open.
  }

  function updateLine(index: number, field: keyof LineFormData, value: string) {
    const newLines = [...formData.lines];
    const updated = { ...newLines[index], [field]: value };
    // Debit and credit are mutually exclusive per line (ledger core rule):
    // entering a nonzero value on one side clears the other side, so the
    // invalid both-sides state cannot even be constructed in the UI.
    if (field === "debit" && value.trim() !== "" && Number(value) !== 0) {
      updated.credit = "";
    }
    if (field === "credit" && value.trim() !== "" && Number(value) !== 0) {
      updated.debit = "";
    }
    newLines[index] = updated;
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
    setSubmitAttempted(true);
    setErrors([]);

    // The exact same validation the badge and the submit button use — there
    // is only one implementation of "is this valid", in ledger.ts. The live
    // inline errors already show these (submitAttempted is true from here
    // on), so only persistence failures go into the save-error state.
    if (accountErrors.length > 0 || !lineValidation.ok) {
      return;
    }

    const entryData: Omit<JournalEntry, "id" | "clientId" | "createdAt" | "updatedAt"> = {
      date: formData.date,
      memo: formData.memo,
      reference: formData.reference,
      status: "draft",
    };
    const submitLines = candidateLines.map(({ accountId, debit, credit, memo }) => ({
      accountId,
      debit,
      credit,
      memo,
    }));

    setSaveStatus({ phase: "saving" });
    try {
      const save = editingEntry
        ? updateJournalEntry(db, editingEntry.id!, entryData, submitLines)
        : createJournalEntry(db, { ...entryData, clientId }, submitLines);
      // Permanent: a save that never settles (stuck transaction, storage
      // blocked mid-session) must surface a message, never hang silently.
      // The late-settling save still applies normally if it ever resolves.
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Saving is taking too long — your entry may still save in the background. " +
                "Check the entries list, then try again.",
            ),
          );
        }, SAVE_TIMEOUT_MS);
      });
      const saved = await Promise.race([save, timeout]);
      setSaveStatus({ phase: "saved", entryId: saved.id });
      setRefresh((v) => v + 1);
      handleCloseDrawer();
    } catch (err) {
      // Permanent, quiet: full error for diagnostics; message for the user.
      // The submit path can never fail silently — every rejection lands here
      // and is mirrored on-screen in both the error box and the status strip.
      console.error("[journal] Save failed:", err);
      setErrors([err instanceof Error ? err.message : "Failed to save entry"]);
      setSaveStatus({
        phase: "failed",
        errorName: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
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
          className="relative flex w-full max-w-4xl max-h-[90vh] max-h-[90dvh] flex-col overflow-hidden bg-[var(--bg-2)] border border-border rounded-t-xl p-6 shadow-xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">
              {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
            </h2>
            <button onClick={handleCloseDrawer} className="p-1 rounded-lg hover:bg-white/5 text-muted" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          {(visibleLiveErrors.length > 0 || errors.length > 0) && (
            <div
              role="alert"
              className="mb-4 shrink-0 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm"
            >
              <ul className="list-disc pl-4 space-y-1">
                {[...visibleLiveErrors, ...errors].map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* The form is a flex column: pinned Date/Memo/Reference on top,
              a scrolling Lines region in the middle, and a pinned action
              footer at the bottom — so the memo field and the submit button
              are reachable at 100% zoom without scrolling the whole panel. */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col space-y-4">
            <div className="grid shrink-0 grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="shrink-0 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-caps text-sm tracking-wider text-muted">Lines</h3>
                <Button
                  variant="ghost"
                  className={`px-3 py-1.5 text-sm ${formData.lines.length < 2 ? "ring-2 ring-accent/60" : ""}`}
                  onClick={addLine}
                  disabled={formData.lines.length >= 20}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line
                </Button>
              </div>
            </div>

            {formData.lines.length < 2 && (
              <div className="shrink-0 rounded-xl border border-accent/50 bg-accent/10 p-3">
                <p className="text-sm font-medium text-text">
                  Add at least one more line to balance this entry.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Double-entry needs both sides — use the highlighted{" "}
                  <span className="font-semibold text-accent">Add Line</span> button above,
                  then pick an account and an amount for each line.
                </p>
              </div>
            )}

            {/* Only this region scrolls: it gets its own visible scrollbar
                gutter so reaching it never requires zooming out. */}
            <div
              data-testid="lines-scroll"
              className="min-h-0 flex-1 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]"
            >
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
                            aria-label={`Line ${index + 1} account`}
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
                            disabled={line.credit.trim() !== "" && Number(line.credit) !== 0}
                            aria-label={`Line ${index + 1} debit`}
                            title={
                              line.credit.trim() !== "" && Number(line.credit) !== 0
                                ? "This line already has a credit — clear Credit to enter a debit."
                                : "Debit amount for this line"
                            }
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text text-right font-mono focus:outline-2 focus:outline-accent disabled:opacity-40"
                            placeholder={
                              line.credit.trim() !== "" && Number(line.credit) !== 0
                                ? "already credited"
                                : "0.00"
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit}
                            onChange={(e) => updateLine(index, "credit", e.target.value)}
                            disabled={line.debit.trim() !== "" && Number(line.debit) !== 0}
                            aria-label={`Line ${index + 1} credit`}
                            title={
                              line.debit.trim() !== "" && Number(line.debit) !== 0
                                ? "This line already has a debit — clear Debit to enter a credit."
                                : "Credit amount for this line"
                            }
                            className="w-full rounded-xl border border-border bg-surface px-2 py-1.5 text-sm text-text text-right font-mono focus:outline-2 focus:outline-accent disabled:opacity-40"
                            placeholder={
                              line.debit.trim() !== "" && Number(line.debit) !== 0
                                ? "already debited"
                                : "0.00"
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.memo}
                            onChange={(e) => updateLine(index, "memo", e.target.value)}
                            aria-label={`Line ${index + 1} memo`}
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
                      <td className="p-2 text-right font-mono tabular-nums text-text">{totals.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-mono tabular-nums text-text">{totals.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${linesValid ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {linesValid ? "Balanced" : "Unbalanced"}
                        </span>
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            {/* Pinned footer: actions, hint, and save strip stay visible at
                100% zoom no matter how many lines the scrolling region holds. */}
            <div
              data-testid="drawer-footer"
              className="shrink-0 space-y-3 border-t border-border pt-4"
            >
              <div className="flex gap-3">
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
            {submitHint && (
              <p
                role="status"
                className="flex items-center gap-1.5 text-xs font-semibold text-accent"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {submitHint}
              </p>
            )}
            <div
              data-testid="save-status"
              aria-live="polite"
              className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] ${
                saveStatus.phase === "failed"
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : saveStatus.phase === "saved"
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : saveStatus.phase === "saving"
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-white/5 text-muted"
              }`}
            >
              {saveStatus.phase === "idle" && <span>Ready</span>}
              {saveStatus.phase === "saving" && <span className="animate-pulse">Saving…</span>}
              {saveStatus.phase === "saved" && (
                <span>
                  Saved successfully
                  {saveStatus.entryId !== undefined ? ` (entry #${saveStatus.entryId})` : ""}
                </span>
              )}
              {saveStatus.phase === "failed" && (
                <span className="break-words">
                  Failed: {saveStatus.errorName}: {saveStatus.errorMessage}
                </span>
              )}
              </div>
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