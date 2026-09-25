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

// Guided two-block layout: each line card exposes one account picker, one
// amount input, and a money-in/money-out direction toggle. Line 1 (FROM)
// defaults to money-out (credit); line 2 (TO) defaults to money-in (debit).
function lineInputs(lineNumber: number) {
  return {
    account: screen.getByLabelText(`Line ${lineNumber} account`) as HTMLSelectElement,
    amount: screen.getByLabelText(`Line ${lineNumber} amount`) as HTMLInputElement,
    moneyIn: screen.getByLabelText(`Line ${lineNumber}: money in (debit)`) as HTMLButtonElement,
    moneyOut: screen.getByLabelText(`Line ${lineNumber}: money out (credit)`) as HTMLButtonElement,
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
  // Guided default: both blocks render up front.
  await screen.findByLabelText("Line 2 account");
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
  test("direction toggle carries the typed amount across sides without zeroing it", async () => {
    const { cashId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    const line1 = lineInputs(1);
    expect(line1.moneyOut.getAttribute("aria-pressed")).toBe("true");
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.amount, { target: { value: "100" } });

    // Switching direction keeps the value and flips the pressed side.
    expect(line1.amount.value).toBe("100");
    fireEvent.click(line1.moneyIn);
    expect(line1.moneyIn.getAttribute("aria-pressed")).toBe("true");
    expect(line1.moneyOut.getAttribute("aria-pressed")).toBe("false");
    expect(line1.amount.value).toBe("100");

    // Switching back carries it again.
    fireEvent.click(line1.moneyOut);
    expect(line1.amount.value).toBe("100");

    unmount();
  });

  test("screenshot scenario: equal totals with no accounts selected is NOT Balanced and cannot submit", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    await openNewEntryForm();

    // Two guided blocks render by default — no "Add line" click needed.
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Screenshot repro" },
    });

    // Two lines, equal totals (1,222.00 / 1,222.00), no account on either line.
    const line1 = lineInputs(1);
    const line2 = lineInputs(2);
    fireEvent.change(line1.amount, { target: { value: "1222" } });
    fireEvent.change(line2.amount, { target: { value: "1222" } });

    // Totals still display the raw sums…
    expect(screen.getAllByText("1,222.00")).toHaveLength(2);
    // …but the badge must refuse "Balanced" and the button must stay disabled.
    expect(screen.queryByText("Balanced")).not.toBeInTheDocument();
    expect(screen.getByText("Unbalanced")).toBeInTheDocument();
    // …and the prominent summary shows a $0.00 difference (amounts agree)
    // yet still Unbalanced, naming the real blocker: missing accounts.
    const summary = screen.getByTestId("balance-summary");
    expect(summary).toHaveTextContent(/Difference: \$0\.00/);
    expect(summary).toHaveTextContent(/pick an account/i);
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

    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Valid entry" },
    });

    // FROM block defaults to money-out (credit), TO block to money-in (debit).
    const line1 = lineInputs(1);
    const line2 = lineInputs(2);
    fireEvent.change(line1.account, { target: { value: salesId } });
    fireEvent.change(line1.amount, { target: { value: "100" } });
    fireEvent.change(line2.account, { target: { value: cashId } });
    fireEvent.change(line2.amount, { target: { value: "100" } });

    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByTestId("balance-summary")).toHaveTextContent(/Difference: \$0\.00/);
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
    expect(screen.getByText(/add a memo/i)).toBeInTheDocument();
    // …and without shouting ledger errors at an untouched form.
    expect(screen.queryByText("Line 1: Select an account")).not.toBeInTheDocument();
    expect(screen.queryByText("Balanced")).not.toBeInTheDocument();

    unmount();
  });

  test("guided default opens with FROM and TO blocks and a secondary split action", async () => {
    const { cashId } = await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");
    await screen.findByLabelText("Line 2 account");

    // Plain-language guided blocks, not raw debit/credit rows…
    expect(screen.getByText("From — where the money leaves")).toBeInTheDocument();
    expect(screen.getByText("To — where the money goes")).toBeInTheDocument();
    // …grouped account pickers (real optgroups, not a flat list)…
    // (Account options arrive via useLiveQuery — wait before asserting.)
    await waitFor(() => {
      const select = screen.getByLabelText("Line 1 account") as HTMLSelectElement;
      expect(select.options.length).toBeGreaterThan(1);
    });
    const picker = screen.getByLabelText("Line 1 account") as HTMLSelectElement;
    expect(picker.querySelector('optgroup[label="Assets"]')).not.toBeNull();
    expect(picker.querySelector('optgroup[label="Expenses"]')).not.toBeNull();
    // …and the split action is present but quiet (no urgent highlight).
    const addLine = screen.getByRole("button", { name: /add another line/i });
    expect(addLine.className).not.toContain("ring-accent/60");

    // One filled block alone is still not submittable.
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "One block filled" },
    });
    const line1 = lineInputs(1);
    fireEvent.change(line1.account, { target: { value: cashId } });
    fireEvent.change(line1.amount, { target: { value: "100" } });
    expect(submitButton().disabled).toBe(true);

    unmount();
  });

  test("amount field keeps a plain 0.00 placeholder and the toggle explains each direction", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    const line1 = lineInputs(1);
    expect(line1.amount.getAttribute("placeholder")).toBe("0.00");
    expect(line1.moneyIn.getAttribute("title")).toMatch(/money in/i);
    expect(line1.moneyOut.getAttribute("title")).toMatch(/money out/i);

    // Typing an amount then flipping direction keeps the value on the card.
    fireEvent.change(line1.amount, { target: { value: "250" } });
    fireEvent.click(line1.moneyIn);
    expect(line1.amount.value).toBe("250");
    expect(line1.amount.getAttribute("placeholder")).toBe("0.00");

    unmount();
  });

  test("two-block default shows no single-line callout and no highlighted add action", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");
    await screen.findByLabelText("Line 2 account");

    // Two blocks by default: no "add one more line" callout, no urgency ring.
    expect(
      screen.queryByText("Add at least one more line to balance this entry."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add another line/i }).className).not.toContain(
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

    // Two valid blocks, equal totals, accounts selected — but NO memo.
    // (Deliberately not touching the memo field.)
    const line1 = lineInputs(1);
    const line2 = lineInputs(2);
    fireEvent.change(line1.account, { target: { value: salesId } });
    fireEvent.change(line1.amount, { target: { value: "11" } });
    fireEvent.change(line2.account, { target: { value: cashId } });
    fireEvent.change(line2.amount, { target: { value: "11" } });

    // The exact reported live state: green badge, disabled button.
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(submitButton().disabled).toBe(true);

    // …with the missing memo named loudly, not as muted decoration.
    const hint = screen.getByText(/add a memo/i);
    expect(hint.className).toContain("text-accent");
    expect(hint.className).toContain("font-semibold");
    expect(hint.className).not.toContain("text-muted");

    // Fill the memo → button enables → click persists the entry.
    fireEvent.change(screen.getByPlaceholderText("Description of the transaction"), {
      target: { value: "Memo completes it" },
    });
    expect(submitButton().disabled).toBe(false);
    expect(screen.queryByText(/add a memo/i)).not.toBeInTheDocument();
    fireEvent.click(submitButton());

    await screen.findByText("Memo completes it", undefined, { timeout: 10000 });
    const entries = await db.journalEntries.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0].memo).toBe("Memo completes it");

    unmount();
  },
  30000,
  );

  test("drawer layout contract: memo and submit footer stay out of the scrolling lines region", async () => {
    await seedTwoAccounts();
    const { unmount } = render(<Journal />);
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    const scrollRegion = screen.getByTestId("lines-scroll");
    const footer = screen.getByTestId("drawer-footer");
    // The middle region owns the only overflow: reaching it never needs zoom.
    expect(scrollRegion.className).toContain("overflow-y-auto");
    // Critical controls live outside the scroll region…
    const memo = screen.getByPlaceholderText("Description of the transaction");
    expect(scrollRegion.contains(memo)).toBe(false);
    expect(footer.contains(submitButton())).toBe(true);
    expect(scrollRegion.contains(footer)).toBe(false);
    // …while the variable-length line cards live inside it.
    expect(scrollRegion.contains(screen.getByLabelText("Line 1 amount"))).toBe(true);
    expect(scrollRegion.contains(screen.getByTestId("balance-summary"))).toBe(true);

    unmount();
  });

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
