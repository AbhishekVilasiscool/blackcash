import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { db } from "../../lib/db";
import { Journal } from "./Journal";

// Forced repo failure: proves the save status strip shows the FULL
// error (name + message) on-screen instead of failing silently.
vi.mock("../../lib/repos/journalRepo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/repos/journalRepo")>();
  const failure = new Error("Simulated write failure: connection lost");
  failure.name = "DatabaseClosedError";
  return {
    ...actual,
    createJournalEntry: vi.fn().mockRejectedValue(failure),
  };
});

beforeEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.seedChartOfAccounts(1);
});

afterEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
});

describe("Journal save status strip (forced repo failure)", () => {
  test(
    "failed save shows Failed with full error name and message, drawer stays open",
    async () => {
      const { unmount } = render(<Journal />);
      fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
      await screen.findByText("New Journal Entry", undefined, { timeout: 15000 });
      await waitFor(
        () => {
          expect(
            (screen.getByLabelText("Line 1 account") as HTMLSelectElement).options.length,
          ).toBeGreaterThan(1);
        },
        { timeout: 15000 },
      );

      // Idle strip reads Ready before anything happens.
      expect(screen.getByTestId("save-status")).toHaveTextContent("Ready");

      // Guided default already renders both blocks — no "Add line" click.
      fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
        target: { value: "Doomed entry" },
      });
      const accounts = await db.accounts.where("clientId").equals(1).toArray();
      const cashId = String(accounts.find((a) => a.code === "1000")!.id!);
      const salesId = String(accounts.find((a) => a.code === "4000")!.id!);
      fireEvent.change(screen.getByLabelText("Line 1 account"), { target: { value: cashId } });
      fireEvent.change(screen.getByLabelText("Line 1 amount"), { target: { value: "50" } });
      fireEvent.change(screen.getByLabelText("Line 2 account"), { target: { value: salesId } });
      fireEvent.change(screen.getByLabelText("Line 2 amount"), { target: { value: "50" } });

      fireEvent.click(screen.getByRole("button", { name: /create entry/i }));

      // The strip — not the console — carries the full failure, and the
      // drawer stays open so the user can retry.
      const strip = await screen.findByTestId("save-status", undefined, { timeout: 15000 });
      await waitFor(
        () => {
          expect(strip.textContent).toMatch(/Failed:/);
        },
        { timeout: 15000 },
      );
      expect(strip.textContent).toMatch(/DatabaseClosedError/);
      expect(strip.textContent).toMatch(/Simulated write failure: connection lost/);
      expect(screen.getByText("New Journal Entry")).toBeInTheDocument();
      expect(await db.journalEntries.count()).toBe(0);

      unmount();
    },
    60000,
  );
});
