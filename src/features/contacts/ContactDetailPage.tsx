import { ArrowLeft, Link2, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ornament/Card";
import { LinkedRecord } from "../../components/ui/LinkedRecord";
import { db } from "../../lib/db";
import {
  createInteraction,
  deleteContact,
  getContact,
  listContactLinks,
  listInteractions,
} from "../../lib/repos/contactsRepo";
import {
  INTERACTION_KINDS,
  type Contact,
  type ContactInteraction,
  type ContactLink,
  type InteractionKind,
} from "../../lib/types/contacts";
import { ContactDrawer } from "./ContactDrawer";
import { ContactTypeBadge } from "./ContactTypeBadge";
import { InteractionTimeline } from "./InteractionTimeline";

function todayIso(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const contactId = Number(params.contactId);

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [kind, setKind] = useState<InteractionKind>("call");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayIso);

  useEffect(() => {
    if (!Number.isFinite(contactId)) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      getContact(db, contactId),
      listInteractions(db, contactId),
      listContactLinks(db, contactId),
    ]).then(([loadedContact, loadedInteractions, loadedLinks]) => {
      if (cancelled) return;
      setContact(loadedContact ?? null);
      setInteractions(loadedInteractions);
      setLinks(loadedLinks);
      setLoading(false);
    }).catch(() => {
      // Site storage blocked (or any other read failure): stop loading so
      // the page renders its empty state; Layout owns the blocked UX.
      if (cancelled) return;
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [contactId, refresh]);

  async function handleAddInteraction() {
    if (contactId < 0 || note.trim() === "") return;
    await createInteraction(db, { contactId, kind, note: note.trim(), date });
    setNote("");
    setRefresh((value) => value + 1);
  }

  async function handleDelete() {
    if (!Number.isFinite(contactId)) return;
    await deleteContact(db, contactId);
    navigate("/contacts");
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (contact === null) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to="/contacts"
          className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Contacts
        </Link>
        <p className="text-sm text-muted">This contact no longer exists.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/contacts"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Contacts
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
              {contact.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{contact.name}</h1>
              <p className="mt-0.5 text-sm text-muted">{contact.company ?? "Independent"}</p>
              <div className="mt-2">
                <ContactTypeBadge type={contact.type} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button variant="danger" onClick={() => void handleDelete()}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>

        {(contact.email !== undefined || contact.phone !== undefined || contact.followUpDate !== undefined) && (
          <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
            {contact.email !== undefined && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="truncate text-text">{contact.email}</dd>
              </div>
            )}
            {contact.phone !== undefined && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="text-text">{contact.phone}</dd>
              </div>
            )}
            {contact.followUpDate !== undefined && (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 shrink-0 rounded-full bg-amber-400/20 ring-2 ring-amber-400/20" />
                <dd className="text-text">
                  Follow-up on {formatDate(contact.followUpDate)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {contact.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-white/5 px-2.5 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">Interactions</h2>
        <form
          className="mt-4 flex flex-col gap-3 border-b border-border pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleAddInteraction();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[160px_170px_1fr]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interaction-kind" className="text-xs font-medium uppercase tracking-wide text-muted">
                Kind
              </label>
              <select
                id="interaction-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as InteractionKind)}
                className="rounded-xl border border-border bg-black/25 px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
              >
                {INTERACTION_KINDS.map((option) => (
                  <option key={option} value={option} className="capitalize">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interaction-date" className="text-xs font-medium uppercase tracking-wide text-muted">
                Date
              </label>
              <input
                id="interaction-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl border border-border bg-black/25 px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interaction-note" className="text-xs font-medium uppercase tracking-wide text-muted">
                Note
              </label>
              <input
                id="interaction-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What happened?"
                className="rounded-xl border border-border bg-black/25 px-3 py-2.5 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={note.trim() === ""}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add interaction
            </Button>
          </div>
        </form>
        <div className="mt-5">
          <InteractionTimeline interactions={interactions} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Link2 className="h-4 w-4 text-accent" aria-hidden="true" />
          Linked records
        </h2>
        {links.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Invoices, deals, documents and projects related to this contact will appear here.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {links.map((link) => (
              <LinkedRecord key={link.id} kind={link.kind} label={link.label} sublabel={contact.name} />
            ))}
          </div>
        )}
      </Card>

      <ContactDrawer
        open={drawerOpen}
        contact={contact}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setRefresh((value) => value + 1)}
      />
    </div>
  );
}