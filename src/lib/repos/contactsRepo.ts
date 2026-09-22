import type { BlackcashDatabase } from "../db";
import type {
  Contact,
  ContactInteraction,
  ContactLink,
  ContactInput,
  ContactFilters,
  ContactCsvRow,
} from "../types/contacts";
import {
  isContactType,
  type InteractionKind,
  type ContactLinkKind,
} from "../types/contacts";

function now(): string {
  return new Date().toISOString();
}

export async function listContacts(
  database: BlackcashDatabase,
  filters: ContactFilters = {},
): Promise<Contact[]> {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? "";
  const all = await database.contacts.toArray();
  return all
    .filter((contact) => {
      if (filters.type !== undefined && filters.type !== "all" && contact.type !== filters.type) {
        return false;
      }
      if (normalizedQuery !== "") {
        const haystack = [
          contact.name,
          contact.company ?? "",
          contact.email ?? "",
          contact.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name)) as Contact[];
}

export async function getContact(
  database: BlackcashDatabase,
  id: number,
): Promise<Contact | undefined> {
  return database.contacts.get(id) as Promise<Contact | undefined>;
}

export async function createContact(
  database: BlackcashDatabase,
  input: ContactInput,
): Promise<Contact> {
  const name = input.name.trim();
  if (name === "") {
    throw new Error("Contact name is required");
  }
  const record: Contact = {
    name,
    type: input.type,
    company: input.company?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    tags: input.tags,
    followUpDate: input.followUpDate || undefined,
    createdAt: input.createdAt ?? now(),
  };
  const id = await database.contacts.add(record as any);
  return { ...record, id };
}

export async function updateContact(
  database: BlackcashDatabase,
  id: number,
  patch: Partial<ContactInput>,
): Promise<boolean> {
  const changed = await database.contacts.update(id, patch);
  return changed > 0;
}

export async function deleteContact(
  database: BlackcashDatabase,
  id: number,
): Promise<void> {
  await database.transaction("rw", database.contacts, database.interactions, database.contactLinks, async () => {
    await database.interactions.where("contactId").equals(id).delete();
    await database.contactLinks.where("contactId").equals(id).delete();
    await database.contacts.delete(id);
  });
}

export async function listInteractions(
  database: BlackcashDatabase,
  contactId: number,
): Promise<ContactInteraction[]> {
  const rows = await database.interactions.where("contactId").equals(contactId).toArray();
  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  ) as ContactInteraction[];
}

export async function createInteraction(
  database: BlackcashDatabase,
  input: {
    contactId: number;
    kind: InteractionKind;
    note: string;
    date: string;
    createdAt?: string;
  },
): Promise<ContactInteraction> {
  const record: ContactInteraction = {
    contactId: input.contactId,
    kind: input.kind,
    note: input.note.trim(),
    date: input.date,
    createdAt: input.createdAt ?? now(),
  };
  const id = await database.interactions.add(record as any);
  return { ...record, id };
}

export async function listContactLinks(
  database: BlackcashDatabase,
  contactId: number,
): Promise<ContactLink[]> {
  const rows = await database.contactLinks.where("contactId").equals(contactId).toArray();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as ContactLink[];
}

export async function createContactLink(
  database: BlackcashDatabase,
  input: {
    contactId: number;
    kind: ContactLinkKind;
    refId: number;
    label: string;
    createdAt?: string;
  },
): Promise<ContactLink> {
  const record: ContactLink = {
    contactId: input.contactId,
    kind: input.kind,
    refId: input.refId,
    label: input.label.trim(),
    createdAt: input.createdAt ?? now(),
  };
  const id = await database.contactLinks.add(record as any);
  return { ...record, id };
}

export function contactsToCsv(contacts: readonly Contact[]): string {
  const header = "name,type,company,email,phone,tags,followUpDate";
  const lines = contacts.map((contact) =>
    [
      csvEscape(contact.name),
      contact.type,
      csvEscape(contact.company ?? ""),
      csvEscape(contact.email ?? ""),
      csvEscape(contact.phone ?? ""),
      csvEscape(contact.tags.join(";")),
      csvEscape(contact.followUpDate ?? ""),
    ].join(","),
  );
  return [header, ...lines].join("\r\n") + "\r\n";
}

export function parseContactsCsv(text: string): ContactCsvRow[] {
  const records = parseCsvRows(text);
  if (records.length === 0) return [];

  const first = records[0].map((heading) => heading.trim().toLowerCase());
  const hasHeaders = first.some((heading) => KNOWN_HEADERS.includes(heading));
  const startRow = hasHeaders ? 1 : 0;

  const indexFor = (key: string, fallback: number): number =>
    hasHeaders ? first.indexOf(key) : fallback;

  const rows: ContactCsvRow[] = [];
  for (let i = startRow; i < records.length; i++) {
    const record = records[i];
    const name = cell(record, indexFor("name", 0));
    const type = cell(record, indexFor("type", 1));
    if (name === "" || !isContactType(type)) continue;
    rows.push({
      name,
      type,
      company: emptyToUndefined(cell(record, indexFor("company", 2))),
      email: emptyToUndefined(cell(record, indexFor("email", 3))),
      phone: emptyToUndefined(cell(record, indexFor("phone", 4))),
      tags: cell(record, indexFor("tags", 5))
        .split(";")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
      followUpDate: emptyToUndefined(cell(record, indexFor("followupdate", 6))),
    });
  }
  return rows;
}

export async function importContacts(
  database: BlackcashDatabase,
  rows: readonly ContactCsvRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const records = rows.map(
    (row): Contact => ({
      name: row.name,
      type: row.type,
      company: row.company,
      email: row.email,
      phone: row.phone,
      tags: row.tags,
      followUpDate: row.followUpDate,
      createdAt: now(),
    }),
  );
  await database.contacts.bulkAdd(records);
  return records.length;
}

const KNOWN_HEADERS = ["name", "type", "company", "email", "phone", "tags", "followupdate"];

function cell(row: readonly string[], index: number): string {
  if (index < 0 || index >= row.length) return "";
  return row[index].trim();
}

function emptyToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (inQuotes) {
      if (character === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      field = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else if (character === "\r") {
      // skipped; \r\n is terminated by the \n branch
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    field = "";
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  return rows;
}