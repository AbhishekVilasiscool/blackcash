import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { db } from "../../lib/db";
import { createContact, updateContact } from "../../lib/repos/contactsRepo";
import {
  CONTACT_TYPES,
  type Contact,
  type ContactInput,
  type ContactType,
} from "../../lib/types/contacts";

export interface ContactDrawerProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  type: ContactType;
  company: string;
  email: string;
  phone: string;
  tags: string;
  followUpDate: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "client",
  company: "",
  email: "",
  phone: "",
  tags: "",
  followUpDate: "",
};

export function ContactDrawer({ open, contact, onClose, onSaved }: ContactDrawerProps) {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (contact) {
      setForm({
        name: contact.name,
        type: contact.type,
        company: contact.company ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        tags: contact.tags.join(", "),
        followUpDate: contact.followUpDate ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, contact]);

  function setValue<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const name = form.name.trim();
    if (name === "") {
      setError("Give this contact a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: ContactInput = {
        name,
        type: form.type,
        company: form.company.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
        followUpDate: form.followUpDate || undefined,
      };
      if (contact?.id !== undefined) {
        await updateContact(db, contact.id, input);
      } else {
        await createContact(db, input);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={contact ? "Edit contact" : "New contact"}
            className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-xl border-t border-border bg-[#0B1120] p-4 pb-10 lg:inset-y-0 lg:inset-x-auto lg:right-0 lg:w-[440px] lg:max-h-none lg:rounded-none lg:border-l lg:border-t-0 lg:rounded-l-2xl"
            initial={reduceMotion ? { opacity: 0 } : { y: 64 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 64 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <h3 className="mb-4 px-1 text-base font-semibold">
              {contact ? "Edit contact" : "New contact"}
            </h3>

            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(event) => setValue("name", event.target.value)}
                autoFocus
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Type</span>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("type", type)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        form.type === type
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted hover:text-text"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Company"
                value={form.company}
                onChange={(event) => setValue("company", event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => setValue("phone", event.target.value)}
              />
              <Input
                label="Tags"
                hint="Comma separated, e.g. analytics, urgent"
                value={form.tags}
                onChange={(event) => setValue("tags", event.target.value)}
              />
              <Input
                label="Follow-up date"
                type="date"
                value={form.followUpDate}
                onChange={(event) => setValue("followUpDate", event.target.value)}
              />

              {error !== null && <p className="text-sm text-danger">{error}</p>}

              <div className="mt-2 flex gap-2">
                <Button type="button" onClick={handleSubmit} disabled={saving}>
                  {saving ? "Saving…" : contact ? "Save changes" : "Add contact"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}