import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { db } from "../../lib/db";
import { type Account, type AccountType, type AccountSubtype } from "../../lib/db";
import { Card } from "../../components/ornament/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Section } from "../../components/ornament/Section";
import { useClientId } from "../../hooks/useClientId";

const TYPE_GROUPS: { type: AccountType; label: string; order: number }[] = [
  { type: "asset", label: "Assets", order: 1 },
  { type: "liability", label: "Liabilities", order: 2 },
  { type: "equity", label: "Equity", order: 3 },
  { type: "revenue", label: "Revenue", order: 4 },
  { type: "expense", label: "Expenses", order: 5 },
];

const SUBTYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  receivable: "Receivable",
  inventory: "Inventory",
  fixed_asset: "Fixed Asset",
  other_asset: "Other Asset",
  payable: "Payable",
  loan: "Loan",
  tax_payable: "Tax Payable",
  accrued_expense: "Accrued Expense",
  deferred_revenue: "Deferred Revenue",
  other_liability: "Other Liability",
  capital: "Capital",
  retained_earnings: "Retained Earnings",
  drawings: "Drawings",
  other_equity: "Other Equity",
  sales: "Sales",
  service_revenue: "Service Revenue",
  interest_income: "Interest Income",
  other_revenue: "Other Revenue",
  cost_of_goods_sold: "COGS",
  payroll: "Payroll",
  rent: "Rent",
  utilities: "Utilities",
  marketing: "Marketing",
  professional_fees: "Professional Fees",
  insurance: "Insurance",
  depreciation: "Depreciation",
  interest_expense: "Interest Expense",
  tax_expense: "Tax Expense",
  other_expense: "Other Expense",
};

interface AccountFormData {
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  parentId: string;
  isActive: boolean;
}

export function ChartOfAccounts() {
  const clientId = useClientId();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    code: "",
    name: "",
    type: "asset" as AccountType,
    subtype: "cash" as AccountSubtype,
    parentId: "",
    isActive: true,
  });
  const [showInactive, setShowInactive] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Permanent click diagnostic: proves on-screen (no DevTools needed)
  // whether the Add Account click reaches its handler at all. If the counter
  // increments but no drawer appears, the drawer render is at fault; if the
  // counter never moves, the click itself is swallowed before the handler.
  const [drawerOpenCount, setDrawerOpenCount] = useState(0);

  const accounts = useLiveQuery(
    () => db.accounts.where("clientId").equals(clientId).toArray(),
    [clientId]
  ) ?? [];

  const filteredAccounts = accounts.filter((acc: Account) => {
    if (!showInactive && !acc.isActive) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      acc.code.toLowerCase().includes(query) ||
      acc.name.toLowerCase().includes(query) ||
      acc.subtype.toLowerCase().includes(query)
    );
  });

  const groupedAccounts = TYPE_GROUPS.map((group) => ({
    ...group,
    accounts: filteredAccounts
      .filter((a) => a.type === group.type)
      .sort((a, b) => a.code.localeCompare(b.code)),
  })).filter((g) => g.accounts.length > 0);

  const handleOpenDrawer = (account?: Account) => {
    setDrawerOpenCount((count) => count + 1);
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        parentId: String(account.parentId ?? ""),
        isActive: account.isActive,
      });
} else {
      setEditingAccount(null);
      const typeAccounts = accounts.filter((a: Account) => a.type === formData.type);
      const maxCode = typeAccounts.reduce((max, acc) => Math.max(max, parseInt(acc.code) || 0), 0);
      const defaultSubtype = formData.type === "asset" ? "cash" :
        formData.type === "liability" ? "payable" :
        formData.type === "equity" ? "capital" :
        formData.type === "revenue" ? "sales" : "cost_of_goods_sold";
      setFormData({
        code: `${maxCode + 10}`.padStart(4, "0"),
        name: "",
        type: formData.type,
        subtype: defaultSubtype as AccountSubtype,
        parentId: "",
        isActive: true,
      });
    }
    setSubmitError(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const code = formData.code.trim();
    const name = formData.name.trim();
    if (code === "" || name === "") {
      setSubmitError("Code and name are required.");
      return;
    }
    // Account codes must be unique per client — duplicates silently corrupt
    // reports that key off codes.
    const duplicate = await db.accounts
      .where("clientId")
      .equals(clientId)
      .filter((a) => a.code === code && a.id !== editingAccount?.id)
      .first()
      .catch(() => undefined);
    if (duplicate) {
      setSubmitError(`Code "${code}" is already used by "${duplicate.name}".`);
      return;
    }

    const data = {
      code,
      name,
      type: formData.type,
      subtype: formData.subtype,
      parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
      isActive: formData.isActive,
      clientId,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingAccount) {
        await db.accounts.update(editingAccount.id!, { ...data, createdAt: editingAccount.createdAt });
      } else {
        await db.accounts.add({ ...data, createdAt: new Date().toISOString() });
      }
    } catch (err) {
      // e.g. site storage blocked after the page loaded.
      setSubmitError(err instanceof Error ? err.message : "Failed to save account.");
      return;
    }
    setIsDrawerOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Deactivate "${account.name}"?`)) return;
    await db.accounts.update(account.id!, { isActive: false, updatedAt: new Date().toISOString() });
  };

  const getParentName = (parentId?: number) => {
    if (!parentId) return "None";
    const parent = accounts.find((a: Account) => a.id === parentId);
    return parent ? `${parent.code} - ${parent.name}` : "Unknown";
  };

return (
    <Section n={1} title="Chart of Accounts">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted" />
            <Input
              placeholder="Search accounts by code, name, or subtype..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-border"
              />
              Show inactive
            </label>
            <Button onClick={() => handleOpenDrawer()} className="ml-2">
              <Plus className="h-4 w-4 mr-2" /> Add Account
            </Button>
            <span className="text-xs text-muted" data-testid="drawer-open-count">
              Drawer opens: {drawerOpenCount}
            </span>
          </div>
        </div>

        {groupedAccounts.length === 0 ? (
          <div className="text-center py-12 text-muted">
            No accounts found. Click "Add Account" to create your first account.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedAccounts.map((group) => (
              <div key={group.type} className="space-y-2">
                <h3 className="font-caps text-sm tracking-wider text-muted flex items-center gap-2">
                  {group.label}
                  <span className="font-mono text-xs text-muted/50 px-2 py-0.5 rounded bg-white/5">
                    {group.accounts.length}
                  </span>
                </h3>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-white/5">
                          <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Code</th>
                          <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Name</th>
                          <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Subtype</th>
                          <th className="text-left p-3 font-caps text-[10px] tracking-wider text-muted">Parent</th>
                          <th className="text-center p-3 font-caps text-[10px] tracking-wider text-muted">Status</th>
                          <th className="text-right p-3 font-caps text-[10px] tracking-wider text-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {group.accounts.map((account) => (
                          <tr key={account.id} className={`hover:bg-white/5 ${!account.isActive ? "opacity-50" : ""}`}>
                            <td className="p-3 font-mono text-text">{account.code}</td>
                            <td className="p-3 font-medium text-text">{account.name}</td>
                            <td className="p-3 text-muted">
                              {SUBTYPE_LABELS[account.subtype] || account.subtype}
                            </td>
                            <td className="p-3 text-muted text-sm">
                              {account.parentId ? getParentName(account.parentId) : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${
                                  account.isActive
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {account.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleOpenDrawer(account)}
                                  aria-label={`Edit ${account.name}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                {!account.isActive && (
                                  <Button
                                    variant="ghost"
                                    onClick={() => handleDelete(account)}
                                    aria-label={`Deactivate ${account.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        <div
          className={`fixed inset-0 z-50 flex items-end justify-center ${isDrawerOpen ? "block" : "hidden"}`}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-2)] border border-border rounded-t-xl p-6 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">
                {editingAccount ? "Edit Account" : "New Account"}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-muted"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm"
                >
                  {submitError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-caps text-muted mb-1">Code</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="1000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-caps text-muted mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as AccountType;
                      const defaultSubtype = newType === "asset" ? "cash" :
                        newType === "liability" ? "payable" :
                        newType === "equity" ? "capital" :
                        newType === "revenue" ? "sales" : "cost_of_goods_sold";
                      setFormData({ ...formData, type: newType, subtype: defaultSubtype as AccountSubtype });
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                    required
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-caps text-muted mb-1">Subtype</label>
                  <select
                    value={formData.subtype}
                    onChange={(e) => setFormData({ ...formData, subtype: e.target.value as AccountSubtype })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                    required
                  >
                    {(() => {
                      const subtypes: Record<AccountType, AccountSubtype[]> = {
                        asset: ["cash", "bank", "receivable", "inventory", "fixed_asset", "other_asset"],
                        liability: ["payable", "loan", "tax_payable", "accrued_expense", "deferred_revenue", "other_liability"],
                        equity: ["capital", "retained_earnings", "drawings", "other_equity"],
                        revenue: ["sales", "service_revenue", "interest_income", "other_revenue"],
                        expense: [
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
                        ],
                      };
                      return subtypes[formData.type as AccountType]?.map((s) => (
                        <option key={s} value={s}>
                          {SUBTYPE_LABELS[s] || s}
                        </option>
                      )) ?? [];
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-caps text-muted mb-1">Parent Account (Optional)</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                  >
                    <option value="">None</option>
                    {(() => {
                      const typeAccounts = accounts.filter((a) => a.type === formData.type && a.isActive);
                      return typeAccounts.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {a.code} - {a.name}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-caps text-muted mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Account Name"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="isActive" className="text-sm text-text">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingAccount ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default ChartOfAccounts;

interface AccountFormData {
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  parentId: string;
  isActive: boolean;
}