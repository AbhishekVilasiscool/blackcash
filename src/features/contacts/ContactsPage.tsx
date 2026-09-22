import { Download, Import, Plus, Search, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { db } from "../../lib/db";
import {
  contactsToCsv,
  createContact,
  deleteContact,
  importContacts,
  listContacts,
  parseContactsCsv,
} from "../../lib/repos/contactsRepo";
import { CONTACT_TYPES, type Contact, type ContactType } from "../../lib/types/contacts";
import { ContactDrawer } from "./ContactDrawer";
import { ContactTypeBadge } from "./ContactTypeBadge";
import { SwipeRow } from "./SwipeRow";

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [undoContact, setUndoContact] = useState<Contact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listContacts(db, { query, type: typeFilter }).then((rows) => {
      if (cancelled) return;
      setContacts(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query, typeFilter, refresh]);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      setUndoContact(null);
    }, 5000);
  }

  async function handleDelete(contact: Contact) {
    if (contact.id === undefined) return;
    await deleteContact(db, contact.id);
    setUndoContact(contact);
    showToast("Contact deleted.");
    setRefresh((value) => value + 1);
  }

  async function handleUndo() {
    if (undoContact === null) return;
    await createContact(db, {
      name: undoContact.name,
      type: undoContact.type,
      company: undoContact.company,
      email: undoContact.email,
      phone: undoContact.phone,
      tags: undoContact.tags,
      followUpDate: undoContact.followUpDate,
    });
    setUndoContact(null);
    setToast(null);
    setRefresh((value) => value + 1);
  }

  async function handleImportFile(file: File) {
    try {
      const rows = parseContactsCsv(await file.text());
      if (rows.length === 0) {
        showToast("No valid contacts found in that CSV.");
        return;
      }
      const count = await importContacts(db, rows);
      showToast(`Imported ${count} contact${count === 1 ? "" : "s"}.`);
      setRefresh((value) => value + 1);
    } catch {
      showToast("Could not read that file.");
    }
  }

  function handleExport() {
    const csv = contactsToCsv(contacts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted">Clients, vendors, investors and teams — stored locally.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = "";
            }}
          />
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Import className="h-4 w-4" aria-hidden="true" />
            Import
          </Button>
          <Button variant="ghost" onClick={handleExport} disabled={contacts.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts…"
            aria-label="Search contacts"
            className="w-full rounded-xl border border-border bg-black/25 py-2.5 pl-9 pr-3 text-sm text-text transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={typeFilter === "all"} label="All" onClick={() => setTypeFilter("all")} />
          {CONTACT_TYPES.map((type) => (
            <FilterChip
              key={type}
              active={typeFilter === type}
              label={type}
              onClick={() => setTypeFilter(type)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="text-sm text-muted">
            {query !== "" || typeFilter !== "all"
              ? "No contacts match those filters."
              : "No contacts yet — add your first one or import a CSV."}
          </p>
          {query === "" && typeFilter === "all" && (
            <Button className="mt-4" onClick={() => setDrawerOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a contact
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <SwipeRow onDelete={() => void handleDelete(contact)}>
                <Link
                  to={`/contacts/${contact.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{contact.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {contact.company ?? contact.email ?? contact.phone ?? "No details yet"}
                    </span>
                  </span>
                  <ContactTypeBadge type={contact.type} />
                </Link>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <ContactDrawer
        open={drawerOpen}
        contact={null}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setRefresh((value) => value + 1)}
      />

      {toast !== null && (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:left-auto lg:right-6 lg:bottom-6 lg:justify-end">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-[#0B1120] px-4 py-3 shadow-xl">
            <span className="text-sm text-text">{toast}</span>
            {undoContact !== null && (
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => void handleUndo()}>
                <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                Undo
              </Button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="text-muted transition-colors hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
        active ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

export default ContactsPage;