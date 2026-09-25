import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { db } from "../../lib/db";
import { Journal } from "./Journal";

async function seedTwoAccounts() {
  await db.seedChartOfAccounts(1);
  const accounts = await db.accounts.where("clientId").equals(1).toArray();
  const cash = accounts.find((a) => a.code === "1000");
  const sales = accounts.find((a) => a.code === "4000");
  if (!cash?.id || !sales?.id) throw new Error("seed chart of accounts failed");
  return { cashId: String(cash.id), salesId: String(sales.id) };
}

function lineInputs(lineNumber: number) {
  return {
    account: screen.getByLabelText(`Line ${lineNumber} account`) as HTMLSelectElement,
    debit: screen.getByLabelText(`Line ${lineNumber} debit`) as HTMLInputElement,
    credit: screen.getByLabelText(`Line ${lineNumber} credit`) as HTMLInputElement,
  };
}

async function openNewEntryForm() {
  fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
  // Drawer opens synchronously; account options arrive via useLiveQuery.
  await screen.findByText("New Journal Entry");
  await waitFor(() => {
    const select = screen.getByLabelText("Line 1 account") as HTMLSelectElement;
    expect(select.options.length).toBeGreaterThan(1);
  });
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /create entry/i }) as HTMLButtonElement;
}

beforeEach(async () => {
  await db.seedChartOfAccounts(1);
});

afterEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
});

describe("Journal entry form validation (UI must match ledger rules)", () => {
  test("debit and credit are mutually exclusive per line: filling one clears the other", async () => {
    const { cashId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    const line1 = lineInputs(1);
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.debit, { target: { value: "100" } });

    // Entering a debit clears and disables credit for that line.
    expect(line1.debit.value).toBe("100");
    expect(line1.credit.value).toBe("");
    expect(line1.credit.disabled).toBe(true);

    // Entering a credit clears the debit side instead.
    fireEvent.change(line1.credit, { target: { value: "50" } });
    expect(line1.credit.value).toBe("50");
    expect(line1.debit.value).toBe("");
    expect(line1.debit.disabled).toBe(true);

    unmount();
  });

  test("screenshot scenario: equal totals with no accounts selected is NOT Balanced and cannot submit", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    fireEvent.click(screen.getByRole("button", { name: /add line/i }));
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Screenshot repro" },
    });

    // Two lines, equal totals (1,222.00 / 1,222.00), no account on either line.
    const line1 = lineInputs(1);
    const line2 = lineInputs(2);
    fireEvent.change(line1.debit, { target: { value: "1222" } });
    fireEvent.change(line2.credit, { target: { value: "1222" } });

    // Totals still display the raw sums…
    expect(screen.getAllByText("1,222.00")).toHaveLength(2);
    // …but the badge must refuse "Balanced" and the button must stay disabled.
    expect(screen.queryByText("Balanced")).not.toBeInTheDocument();
    expect(screen.getByText("Unbalanced")).toBeInTheDocument();
    expect(submitButton().disabled).toBe(true);
    // …with visible per-line errors in the alert box (the status hint may
    // echo the first one — scope to the alert to assert the error list).
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Line 1: Select an account")).toBeInTheDocument();
    expect(within(alert).getByText("Line 2: Select an account")).toBeInTheDocument();

    // Even forcing a submit (e.g. Enter key) is blocked with visible errors
    // and persists nothing. Live errors (not the save-error state) carry this.
    const form = submitButton().closest("form");
    if (!form) throw new Error("submit form not found");
    fireEvent.submit(form);
    await waitFor(
      () => {
        expect(within(screen.getByRole("alert")).getAllByText("Line 1: Select an account")).toHaveLength(1);
      },
      { timeout: 10000 },
    );
    expect(await db.journalEntries.count()).toBe(0);

    unmount();
  });

  test(
    "genuinely valid balanced entry shows Balanced, enables submit, and persists",
    async () => {
    const { cashId, salesId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    fireEvent.click(screen.getByRole("button", { name: /add line/i }));
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Valid entry" },
    });

    const line1 = lineInputs(1);
    const line2 = lineInputs(2);
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.debit, { target: { value: "100" } });
    fireEvent.change(line2.account, { target: { value: salesId } });
    fireEvent.change(line2.credit, { target: { value: "100" } });

    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(submitButton().disabled).toBe(false);

    fireEvent.click(submitButton());

    // The drawer stays mounted and hides via the `hidden` CSS class (assert
    // the class, not toBeVisible(): jsdom never loads author stylesheets, so
    // visibility matchers can't see class-based display:none).
    await waitFor(
      () => {
        const drawer = screen.getByText("New Journal Entry").closest("div.fixed");
        expect(drawer?.className).toMatch(/(?:^|\s)hidden(?:\s|$)/);
      },
      { timeout: 10000 },
    );
    await screen.findByText("Valid entry", undefined, { timeout: 10000 });
    const entries = await db.journalEntries.toArray();
    expect(entries).toHaveLength(1);
    // The permanent status strip mirrors the real transition, entry id included.
    expect(screen.getByTestId("save-status")).toHaveTextContent(
      new RegExp(`Saved successfully \\(entry #${entries[0].id}\\)`),
    );
    const lines = await db.journalLines.where("entryId").equals(entries[0].id!).toArray();
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => [l.debit, l.credit]).sort()).toEqual([
      [0, 100],
      [100, 0],
    ]);

    unmount();
    },
    // fake-indexeddb + Dexie transaction + liveQuery re-render can exceed
    // the 5s default under parallel-worker load (see replica experiment).
    30000,
  );

  test("pristine form explains the disabled submit instead of looking broken", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    // Disabled — but with a named next step, not silence…
    expect(submitButton().disabled).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent(/add a memo/i);
    // …and without shouting ledger errors at an untouched form.
    expect(screen.queryByText("Line 1: Select an account")).not.toBeInTheDocument();
    expect(screen.queryByText("Balanced")).not.toBeInTheDocument();

    unmount();
  });

  test("single-line entry names the 2-line requirement in the hint", async () => {
    const { cashId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "One liner" },
    });
    const line1 = {
      account: screen.getByLabelText("Line 1 account") as HTMLSelectElement,
      debit: screen.getByLabelText("Line 1 debit") as HTMLInputElement,
    };
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.debit, { target: { value: "100" } });

    // One complete line is still not submittable — and the UI says why.
    expect(submitButton().disabled).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent(/at least 2 lines/i);

    unmount();
  });

  test("disabled side explains itself in the field: placeholder names the reason", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    const debit = screen.getByLabelText("Line 1 debit") as HTMLInputElement;
    const credit = screen.getByLabelText("Line 1 credit") as HTMLInputElement;
    expect(debit.getAttribute("placeholder")).toBe("0.00");
    expect(credit.getAttribute("placeholder")).toBe("0.00");

    fireEvent.change(debit, { target: { value: "250" } });
    expect(credit.disabled).toBe(true);
    expect(credit.getAttribute("placeholder")).toBe("already debited");
    expect(credit.getAttribute("title")).toMatch(/already has a debit/i);

    // Clearing the debit restores the credit field to normal.
    fireEvent.change(debit, { target: { value: "" } });
    expect(credit.disabled).toBe(false);
    expect(credit.getAttribute("placeholder")).toBe("0.00");

    unmount();
  });

  test("single line gets an unmissable callout plus a highlighted Add Line button", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    // One line: callout visible, Add Line ringed.
    expect(
      screen.getByText("Add at least one more line to balance this entry."),
    ).toBeInTheDocument();
    const addLine = screen.getByRole("button", { name: /add line/i });
    expect(addLine.className).toContain("ring-accent/60");

    // Two lines: callout gone, highlight gone.
    fireEvent.click(addLine);
    expect(
      screen.queryByText("Add at least one more line to balance this entry."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add line/i }).className).not.toContain(
      "ring-accent/60",
    );

    unmount();
  });

  test("balanced 2-line entry without memo: disabled with an unmistakable reason, then memo enables and persists", async () => {
    const { cashId, salesId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");
    // Account options arrive via useLiveQuery — wait before selecting.
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Line 1 account") as HTMLSelectElement).options.length,
      ).toBeGreaterThan(1);
    });

    // Two valid lines, equal totals, accounts selected — but NO memo.
    // (Deliberately not touching the memo field.)
    // Second line must exist first.
    fireEvent.click(screen.getByRole("button", { name: /add line/i }));
    const line1 = {
      account: screen.getByLabelText("Line 1 account") as HTMLSelectElement,
      debit: screen.getByLabelText("Line 1 debit") as HTMLInputElement,
    };
    const line2 = {
      account: screen.getByLabelText("Line 2 account") as HTMLSelectElement,
      credit: screen.getByLabelText("Line 2 credit") as HTMLInputElement,
    };
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.debit, { target: { value: "11" } });
    fireEvent.change(line2.account, { target: { value: salesId } });
    fireEvent.change(line2.credit, { target: { value: "11" } });

    // The exact reported live state: green badge, disabled button.
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(submitButton().disabled).toBe(true);

    // …with the missing memo named loudly, not as muted decoration.
    const hint = screen.getByRole("status");
    expect(hint).toHaveTextContent(/add a memo/i);
    expect(hint.className).toContain("text-accent");
    expect(hint.className).toContain("font-semibold");
    expect(hint.className).not.toContain("text-muted");

    // Fill the memo → button enables → click persists the entry.
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Memo completes it" },
    });
    expect(submitButton().disabled).toBe(false);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(submitButton());

    await screen.findByText("Memo completes it", undefined, { timeout: 10000 });
    const entries = await db.journalEntries.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].memo).toBe("Memo completes it");

    unmount();
  },
  30000,
  );

  test("primary submit button is always rendered (never invisible), only enabled/disabled", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    // Disabled on a pristine form — but present, with accessible name.
    const button = submitButton();
    expect(button).toBeInTheDocument();
    expect(button.disabled).toBe(true);
    // The button carries the primary accent background class (the missing
    // --color-accent theme token used to make this transparent/invisible).
    expect(button.className).toContain("bg-accent");
    // And Cancel renders in the same action row.
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    unmount();
  });
});
