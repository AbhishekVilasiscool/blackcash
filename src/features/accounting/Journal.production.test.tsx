import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { db } from "../../lib/db";
import { App } from "../../app/App";
import { useVault } from "../../hooks/useVault";

// Production-tree regression: boots the REAL <App/> (router, providers,
// vault store, startup seeding), performs a REAL vault setup (same code path
// as a first-time user — no bypasses), then submits a genuinely valid,
// balanced 2-line Journal entry and asserts it persists, lists, and makes no
// noise. Any silent submit failure reproduces here.

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(async () => {
  stubMatchMedia();
  window.history.pushState({}, "", "/journal");
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
  window.localStorage.clear();
});

afterEach(async () => {
  // Clear the vault auto-lock timer so workers exit cleanly.
  const { result, unmount } = renderHook(() => useVault());
  result.current.lock();
  unmount();
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
  window.localStorage.clear();
});

describe("Journal production-tree regression: valid submit persists", () => {
  test(
    "full app boot, real vault setup, valid 2-line balanced submit persists and lists",
    async () => {
      const consoleErrors: string[] = [];
      const errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        consoleErrors.push(args.map((a) => String(a)).join(" "));
      });
      const rejections: unknown[] = [];
      const onRejection = (event: PromiseRejectionEvent) => {
        rejections.push(event.reason);
      };
      window.addEventListener("unhandledrejection", onRejection);

      try {
        render(<App />);

        // 1. Fresh database → vault setup form (first-load path, real crypto).
        const passphrase = await screen.findByPlaceholderText(
          "Enter passphrase (min 8 characters)",
          undefined,
          { timeout: 15000 },
        );
        fireEvent.change(passphrase, { target: { value: "correct horse battery staple" } });
        fireEvent.change(screen.getByPlaceholderText("Confirm passphrase"), {
          target: { value: "correct horse battery staple" },
        });
        fireEvent.click(screen.getByRole("checkbox"));
        fireEvent.click(screen.getByRole("button", { name: /initialize vault/i }));

        // 2. Vault unlocks → app shell with Journal route renders.
        const newEntryButton = (await screen.findByRole(
          "button",
          { name: /new entry/i },
          { timeout: 30000 },
        )) as HTMLButtonElement;
        fireEvent.click(newEntryButton);
        await screen.findByText("New Journal Entry", undefined, { timeout: 15000 });

        // 3. Startup seeding populated the pickers through the production
        // path (both guided blocks share the same account list).
        const cashOptions = await screen.findAllByRole(
          "option",
          { name: /1000 - Cash on Hand/ },
          { timeout: 15000 },
        );
        expect(cashOptions.length).toBeGreaterThanOrEqual(2);

        // 4. Fill a genuinely valid entry: 2 guided blocks, accounts
        // selected, debits == credits, memo, date. FROM defaults to
        // money-out (credit), TO to money-in (debit).
        fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
          target: { value: "Production-tree fee income" },
        });
        const dbAccounts = await db.accounts.where("clientId").equals(1).toArray();
        const cashId = String(dbAccounts.find((a) => a.code === "1000")!.id!);
        const salesId = String(dbAccounts.find((a) => a.code === "4000")!.id!);
        fireEvent.change(screen.getByLabelText("Line 1 account"), { target: { value: salesId } });
        fireEvent.change(screen.getByLabelText("Line 1 amount"), { target: { value: "100" } });
        fireEvent.change(screen.getByLabelText("Line 2 account"), { target: { value: cashId } });
        fireEvent.change(screen.getByLabelText("Line 2 amount"), { target: { value: "100" } });

        expect(screen.getByText("Balanced")).toBeInTheDocument();
        const submit = screen.getByRole("button", { name: /create entry/i }) as HTMLButtonElement;
        expect(submit.disabled).toBe(false);

        // 5. Click Create Entry — scoped console.error capture around the click.
        const errorsBefore = consoleErrors.length;
        const rejectionsBefore = rejections.length;
        fireEvent.click(submit);

        // (i) persists in IndexedDB with intact lines…
        await waitFor(
          async () => {
            expect(await db.journalEntries.count()).toBe(1);
          },
          { timeout: 20000 },
        );
        const entries = await db.journalEntries.toArray();
        const lines = await db.journalLines.where("entryId").equals(entries[0].id!).toArray();
        expect(lines).toHaveLength(2);
        expect(lines.map((l) => [l.debit, l.credit]).sort()).toEqual([
          [0, 100],
          [100, 0],
        ]);

        // (ii) …appears in the rendered Journal list…
        await screen.findByText("Production-tree fee income", undefined, { timeout: 20000 });

        // (iii) …with no console.error (beyond React act() test-env noise)
        // and no unhandled rejections during the click.
        const clickErrors = consoleErrors.slice(errorsBefore).filter((m) => !m.includes("act("));
        expect(clickErrors).toEqual([]);
        expect(rejections.slice(rejectionsBefore)).toEqual([]);
      } finally {
        window.removeEventListener("unhandledrejection", onRejection);
        errorSpy.mockRestore();
      }
    },
    120000,
  );
});
