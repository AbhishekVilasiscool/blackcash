import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BlackcashDatabase } from "../../db";
import {
  contactsToCsv,
  createContact,
  createContactLink,
  createInteraction,
  deleteContact,
  getContact,
  importContacts,
  listContactLinks,
  listContacts,
  listInteractions,
  parseContactsCsv,
  updateContact,
} from "../contactsRepo";

let database: BlackcashDatabase;

beforeEach(() => {
  database = new BlackcashDatabase();
});

afterEach(async () => {
  await database.delete();
});

describe("contactsRepo", () => {
  it("creates a contact and returns it with an id", async () => {
    const contact = await createContact(database, {
      name: "Ada Lovelace",
      type: "client",
      company: "Analytical Engines",
      email: "ada@example.com",
      tags: ["analytics", "priority"],
    });
    expect(contact.id).toBeTypeOf("number");
    expect(contact.createdAt).toBeTypeOf("string");
    expect(contact.tags).toEqual(["analytics", "priority"]);
  });

  it("rejects a contact with an empty name", async () => {
    await expect(
      createContact(database, { name: "   ", type: "vendor", tags: [] }),
    ).rejects.toThrow("Contact name is required");
  });

  it("lists contacts sorted by name", async () => {
    await createContact(database, { name: "Zelda", type: "client", tags: [] });
    await createContact(database, { name: "Ada", type: "vendor", tags: [] });
    await createContact(database, { name: "Miles", type: "colleague", tags: [] });

    const rows = await listContacts(database);
    expect(rows.map((row) => row.name)).toEqual(["Ada", "Miles", "Zelda"]);
  });

  it("filters by contact type", async () => {
    await createContact(database, { name: "Ada", type: "client", tags: [] });
    await createContact(database, { name: "Zelda", type: "vendor", tags: [] });

    const clients = await listContacts(database, { type: "client" });
    const everyone = await listContacts(database, { type: "all" });
    expect(clients.map((row) => row.name)).toEqual(["Ada"]);
    expect(everyone).toHaveLength(2);
  });

  it("filters by free-text query across email and company", async () => {
    await createContact(database, {
      name: "Ada",
      type: "client",
      company: "Analytical Engines",
      email: "ada@analytical.test",
      tags: [],
    });
    await createContact(database, { name: "Zelda", type: "client", tags: [] });

    const byCompany = await listContacts(database, { query: "analytical" });
    const byEmail = await listContacts(database, { query: "ada@" });
    expect(byCompany.map((row) => row.name)).toEqual(["Ada"]);
    expect(byEmail.map((row) => row.name)).toEqual(["Ada"]);
  });

  it("gets a single contact", async () => {
    const created = await createContact(database, { name: "Ada", type: "client", tags: [] });
    expect((await getContact(database, created.id!))?.name).toBe("Ada");
    expect(await getContact(database, 999)).toBeUndefined();
  });

  it("updates a contact", async () => {
    const created = await createContact(database, { name: "Ada", type: "client", phone: "111", tags: [] });
    const changed = await updateContact(database, created.id!, { phone: "222", type: "vendor" });

    expect(changed).toBe(true);
    const updated = await getContact(database, created.id!);
    expect(updated?.phone).toBe("222");
    expect(updated?.type).toBe("vendor");
  });

  it("deletes a contact along with its interactions and links", async () => {
    const created = await createContact(database, { name: "Ada", type: "client", tags: [] });
    await createInteraction(database, {
      contactId: created.id!,
      kind: "call",
      note: "Intro call",
      date: "2026-09-10",
    });
    await createContactLink(database, {
      contactId: created.id!,
      kind: "document",
      refId: 1,
      label: "Engagement letter",
    });

    await deleteContact(database, created.id!);

    expect(await listContacts(database)).toHaveLength(0);
    expect(await listInteractions(database, created.id!)).toHaveLength(0);
    expect(await listContactLinks(database, created.id!)).toHaveLength(0);
  });

  it("round-trips interactions through create and list", async () => {
    const contact = await createContact(database, { name: "Ada", type: "client", tags: [] });
    await createInteraction(database, {
      contactId: contact.id!,
      kind: "meeting",
      note: "Sprint review",
      date: "2026-09-01",
    });
    await createInteraction(database, {
      contactId: contact.id!,
      kind: "email",
      note: "Follow-up",
      date: "2026-09-05",
    });

    const rows = await listInteractions(database, contact.id!);
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe("email");
    expect(rows[0].note).toBe("Follow-up");
  });

  it("lists typed contact links", async () => {
    const contact = await createContact(database, { name: "Ada", type: "target", tags: [] });
    await createContactLink(database, {
      contactId: contact.id!,
      kind: "deal",
      refId: 7,
      label: "Acquisition LOI",
    });

    const links = await listContactLinks(database, contact.id!);
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe("deal");
  });

  it("serializes and parses CSV without data loss", async () => {
    const contact = await createContact(database, {
      name: 'Dr. "Ada" Lovelace, PhD',
      type: "client",
      company: "Analytical Engines",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      tags: ["analytics", "priority"],
      followUpDate: "2026-10-01",
    });

    const parsed = parseContactsCsv(contactsToCsv([contact]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      name: 'Dr. "Ada" Lovelace, PhD',
      type: "client",
      company: "Analytical Engines",
      email: "ada@example.com",
      phone: "+44 20 7946 0958",
      tags: ["analytics", "priority"],
      followUpDate: "2026-10-01",
    });
  });

  it("imports CSV rows and reports the count", async () => {
    const counts = await importContacts(database, [
      { name: "Ada", type: "client", tags: [] },
      { name: "Zelda", type: "vendor", email: "z@example.com", tags: ["top"] },
    ]);

    expect(counts).toBe(2);
    const rows = await listContacts(database);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.company)).toEqual([undefined, undefined]);
    expect(rows.find((row) => row.name === "Zelda")?.tags).toEqual(["top"]);
  });

  it("skips malformed rows during CSV parsing", async () => {
    const csv =
      'name,type,company,email,phone,tags,followUpDate\n' +
      'Ada,client,Acme,,,,\n' +
      ',vendor,,,,\n' +
      'Zelda,unknown,,,,\n' +
      "Miles,colleague,,,,\"a;b\",\n";

    const parsed = parseContactsCsv(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe("Ada");
    expect(parsed[1]).toEqual({
      name: "Miles",
      type: "colleague",
      tags: ["a", "b"],
    });
  });

  it("parses headerless CSVs positionally", async () => {
    const parsed = parseContactsCsv("Ada,client,Acme,ada@x.test,,,\nZelda,vendor,,,,,");
    expect(parsed).toHaveLength(2);
    expect(parsed[0].company).toBe("Acme");
    expect(parsed[0].email).toBe("ada@x.test");
  });
});