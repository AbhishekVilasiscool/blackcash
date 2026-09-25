import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { db } from "../../lib/db";
import { Journal } from "./Journal";

// Regression test for the invisible-drawer bug: app/layout.tsx wraps every
// route in a framer-motion div with a permanent perspective transform
// (transformPerspective: 1000). Per CSS, a non-none transform on an ancestor
// hijacks the containing block for ALL position:fixed descendants, so the
// New Entry drawer sized/positioned itself against the page-content box
// instead of the viewport — the 810px panel ended up ~550px off-screen and
// only its footer was visible. The fix portals fixed overlays to
// document.body. Rendering inside a transformed wrapper here reproduces the
// production ancestor chain; the drawer must escape it.
function renderInsideTransformedRoute() {
  return render(
    <div style={{ transform: "perspective(1000px)" }} data-testid="route-transform">
      <Journal />
    </div>,
  );
}

beforeEach(async () => {
  await db.seedChartOfAccounts(1);
});

afterEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  document.body.innerHTML = "";
});

describe("Journal drawer escapes transformed ancestors (body portal)", () => {
  test("open drawer is a direct body child, not nested in the transformed route", async () => {
    const { unmount } = renderInsideTransformedRoute();
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");

    const drawer = screen.getByTestId("journal-drawer");
    // Portaled: direct child of body, outside the perspective wrapper.
    expect(drawer.parentElement).toBe(document.body);
    expect(
      screen.getByTestId("route-transform").contains(drawer),
    ).toBe(false);
    // Open state: the `hidden` utility must be gone.
    expect(drawer.className).not.toMatch(/(?:^|\s)hidden(?:\s|$)/);

    unmount();
  });

  test("FROM/TO account and amount fields render inside the open, unhidden drawer", async () => {
    const { unmount } = renderInsideTransformedRoute();
    fireEvent.click(screen.getByRole("button", { name: /new entry/i }));
    await screen.findByText("New Journal Entry");
    await waitFor(() => {
      expect(
        (screen.getByLabelText("Line 1 account") as HTMLSelectElement).options.length,
      ).toBeGreaterThan(1);
    });

    const drawer = screen.getByTestId("journal-drawer");
    for (const name of ["Line 1 account", "Line 1 amount", "Line 2 account", "Line 2 amount"]) {
      const field = screen.getByLabelText(name);
      // Inside the open drawer (not the hidden background tree)…
      expect(drawer.contains(field)).toBe(true);
      // …with no hidden/display:none marker on the field or its ancestors
      // up to the drawer root.
      let node: HTMLElement | null = field as HTMLElement;
      while (node && node !== drawer) {
        expect(node.hasAttribute("hidden")).toBe(false);
        expect(node.style.display).not.toBe("none");
        node = node.parentElement;
      }
    }

    unmount();
  });
});
