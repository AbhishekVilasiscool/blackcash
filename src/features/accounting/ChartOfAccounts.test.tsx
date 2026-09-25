import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { db, DEFAULT_CHART_OF_ACCOUNTS } from "../../lib/db";
import { useSeedDefaults } from "../../hooks/useSeedDefaults";
import { ChartOfAccounts } from "./ChartOfAccounts";
import { Journal } from "./Journal";

const EXPECTED_SEED_COUNT = DEFAULT_CHART_OF_ACCOUNTS.length;

function accountRows(container: HTMLElement): number {
  return container.querySelectorAll("tbody tr").length;
}

async function openAddAccountForm() {
  fireEvent.click(screen.getByRole("button", { name: /add account/i }));
  await screen.findByText("New Account");
  // Seeded options (parent picker) arrive via useLiveQuery; form itself is sync.
  await waitFor(() => {
    expect(screen.getByPlaceholderText("1000")).toBeInTheDocument();
  });
}

beforeEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
});

afterEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
});

describe("Chart of Accounts seeding and add-account flow", () => {
  test("empty database shows the honest empty state (no phantom accounts)", async () => {
    const { unmount } = render(<ChartOfAccounts />);
    await screen.findByText(/no accounts found/i);
    expect(await db.accounts.count()).toBe(0);
    unmount();
  });

  test("seed hook populates the full default chart exactly once, even under concurrent calls", async () => {
    expect(EXPECTED_SEED_COUNT).toBeGreaterThan(25);

    const hook = renderHook(({ id }: { id: number }) => useSeedDefaults(id), {
      initialProps: { id: 1 },
    });
    const { unmount } = render(<ChartOfAccounts />);

    await screen.findByText("Cash on Hand");
    await screen.findByText("Sales Revenue");
    await waitFor(() => {
      expect(accountRows(document.body)).toBe(EXPECTED_SEED_COUNT);
    });

    // Second pass and concurrent passes must not duplicate anything.
    await db.seedChartOfAccounts(1);
    await Promise.all([
      db.seedChartOfAccounts(1),
      db.seedChartOfAccounts(1),
      db.seedChartOfAccounts(1),
    ]);
    expect(await db.accounts.where("clientId").equals(1).count()).toBe(EXPECTED_SEED_COUNT);

    hook.unmount();
    unmount();
  });

  test(
    "pre-existing manual accounts are preserved while missing defaults are backfilled",
    async () => {
      // The MENNA scenario: user created accounts before seeding was wired up.
      const now = new Date().toISOString();
      await db.accounts.add({
        code: "0010",
        name: "MENNA",
        type: "asset",
        subtype: "cash",
        isActive: true,
        clientId: 1,
        createdAt: now,
        updatedAt: now,
      });

      await db.seedChartOfAccounts(1);

      const all = await db.accounts.where("clientId").equals(1).toArray();
      expect(all).toHaveLength(EXPECTED_SEED_COUNT + 1);
      // Custom account untouched (not overwritten by any default).
      expect(all.find((a) => a.code === "0010")?.name).toBe("MENNA");
      // Every default code now exists.
      for (const def of DEFAULT_CHART_OF_ACCOUNTS) {
        expect(all.some((a) => a.code === def.code)).toBe(true);
      }

      // Re-running changes nothing.
      await db.seedChartOfAccounts(1);
      expect(await db.accounts.where("clientId").equals(1).count()).toBe(EXPECTED_SEED_COUNT + 1);
    },
    30000,
  );

  // Write-path tests carry an explicit timeout: fake-indexeddb + liveQuery
  // re-renders exceed the 5s default when workers are busy (see Journal T3).
  test(
    "add-account flow: drawer, save, immediate table update",
    async () => {
    await db.seedChartOfAccounts(1);
    const { container, unmount } = render(<ChartOfAccounts />);
    await screen.findByText("Cash on Hand");

    await openAddAccountForm();
    fireEvent.change(screen.getByPlaceholderText("1000"), { target: { value: "1750" } });
    fireEvent.change(screen.getByPlaceholderText("Account Name"), {
      target: { value: "Test Emergency Fund" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Row appears live in the table and persists.
    // (Generous timeout: fake-indexeddb + liveQuery re-render is slow under load.)
    await screen.findByText("Test Emergency Fund", undefined, { timeout: 20000 });
    expect(accountRows(container)).toBe(EXPECTED_SEED_COUNT + 1);
    expect(await db.accounts.where("clientId").equals(1).count()).toBe(EXPECTED_SEED_COUNT + 1);

    unmount();
    },
    60000,
  );

  test(
    "duplicate account codes are rejected with a visible error and persist nothing",
    async () => {
    await db.seedChartOfAccounts(1);
    const { unmount } = render(<ChartOfAccounts />);
    await screen.findByText("Cash on Hand");

    await openAddAccountForm();
    fireEvent.change(screen.getByPlaceholderText("1000"), { target: { value: "1000" } });
    fireEvent.change(screen.getByPlaceholderText("Account Name"), {
      target: { value: "Duplicate Cash" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await screen.findByText(/already used by "Cash on Hand"/);
    expect(await db.accounts.where("clientId").equals(1).count()).toBe(EXPECTED_SEED_COUNT);

    unmount();
    },
    30000,
  );

  test(
    "new account appears in the Journal entry account picker (cross-page)",
    async () => {
    await db.seedChartOfAccounts(1);

    // Add through the real CoA UI…
    const coa = render(<ChartOfAccounts />);
    await screen.findByText("Cash on Hand");
    await openAddAccountForm();
    fireEvent.change(screen.getByPlaceholderText("1000"), { target: { value: "1750" } });
    fireEvent.change(screen.getByPlaceholderText("Account Name"), {
      target: { value: "Picker Probe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await screen.findByText("Picker Probe", undefined, { timeout: 20000 });
    coa.unmount();

    // …and pick it in a Journal entry form.
    render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");
    await screen.findByRole("option", { name: "1750 - Picker Probe" }, { timeout: 20000 });
    },
    60000,
  );
});
