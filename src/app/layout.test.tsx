import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { db } from "../lib/db";
import { ModeProvider } from "./modes";
import { CommandPaletteProvider } from "./providers";
import { Layout } from "./layout";

// Unlocked vault without PBKDF2 cost: the layout branches under test only
// read status flags, never crypto.
vi.mock("../hooks/useVault", () => ({
  useVault: () => ({
    status: "unlocked",
    isLocked: false,
    isUnlocked: true,
    isUninitialized: false,
    metadata: null,
    storageBlocked: false,
    storageError: null,
    setup: vi.fn(),
    unlock: vi.fn(),
    lock: vi.fn(),
    changePassphrase: vi.fn(),
    setAutoLock: vi.fn(),
    getKey: () => null,
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    encryptTableRow: vi.fn(),
    decryptTableRow: vi.fn(),
  }),
  useVaultKey: () => null,
  useVaultStatus: () => ({
    status: "unlocked",
    isLocked: false,
    isUnlocked: true,
    isUninitialized: false,
  }),
}));

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

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ModeProvider>
        <CommandPaletteProvider>
          <Layout />
        </CommandPaletteProvider>
      </ModeProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  stubMatchMedia();
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
  window.localStorage.clear();
});

afterEach(async () => {
  await db.journalLines.clear();
  await db.journalEntries.clear();
  await db.accounts.clear();
  await db.settings.clear();
  window.localStorage.clear();
});

describe("Layout header/sidebar visibility across viewport sizes", () => {
  test("vault status renders in BOTH the mobile header and the desktop sidebar", async () => {
    const { unmount } = renderLayout();

    // Mobile header (unmounts at lg) AND desktop sidebar (mounts at lg)
    // must each carry the vault status, so no viewport width loses it.
    // (jsdom applies no CSS, so both trees are queryable at once.)
    const badges = await screen.findAllByText("UNLOCKED");
    expect(badges).toHaveLength(2);
    expect(screen.getByText("local-first · open source")).toBeInTheDocument();

    unmount();
  });

  test("sticky mobile header clears the top safe area (fullscreen/notch)", () => {
    const { unmount } = renderLayout();

    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    // py-3 spacing preserved PLUS the safe-area inset (0px where unsupported).
    expect(header.style.paddingTop).toContain("env(safe-area-inset-top)");

    unmount();
  });

  test("sidebar footer stacks tagline and vault indicator vertically (never side-by-side)", () => {
    const { unmount } = renderLayout();

    // Regression guard for mid-word wrapping ("local-"/"first"): the two
    // footer children must share a vertical-stack container, and the tagline
    // itself must never wrap — jsdom has no layout engine, so the test pins
    // the structure that makes horizontal competition impossible.
    const tagline = screen.getByText("local-first · open source");
    const stack = tagline.parentElement;
    if (!stack) throw new Error("sidebar footer stack not found");
    expect(stack.className).toContain("flex-col");
    expect(tagline.className).toContain("whitespace-nowrap");

    unmount();
  });
});
