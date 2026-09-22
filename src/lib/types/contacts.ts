export type ContactType = "client" | "vendor" | "investor" | "target" | "colleague";

export type InteractionKind = "call" | "email" | "meeting" | "note";

export const CONTACT_TYPES: readonly ContactType[] = [
  "client",
  "vendor",
  "investor",
  "target",
  "colleague",
];

export const INTERACTION_KINDS: readonly InteractionKind[] = ["call", "email", "meeting", "note"];

export interface Contact {
  id?: number;
  name: string;
  type: ContactType;
  company?: string;
  email?: string;
  phone?: string;
  tags: string[];
  followUpDate?: string;
  createdAt: string;
}

export type ContactInput = Omit<Contact, "id" | "createdAt"> & { createdAt?: string };

export interface ContactInteraction {
  id?: number;
  contactId: number;
  kind: InteractionKind;
  note: string;
  date: string;
  createdAt: string;
}

export type ContactLinkKind = "invoice" | "deal" | "document" | "project";

export interface ContactLink {
  id?: number;
  contactId: number;
  kind: ContactLinkKind;
  refId: number;
  label: string;
  createdAt: string;
}

export interface ContactFilters {
  query?: string;
  type?: ContactType | "all";
}

export interface ContactCsvRow {
  name: string;
  type: ContactType;
  company?: string;
  email?: string;
  phone?: string;
  tags: string[];
  followUpDate?: string;
}

export function isContactType(value: string): value is ContactType {
  return (CONTACT_TYPES as readonly string[]).includes(value);
}

export function isInteractionKind(value: string): value is InteractionKind {
  return (INTERACTION_KINDS as readonly string[]).includes(value);
}