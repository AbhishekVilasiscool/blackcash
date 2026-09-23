import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type Dexie from "dexie";

vi.mock("../lib/db", () => ({
  db: {
    open: vi.fn(),
    settings: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}));

function deniedError(): Error {
  const error = new Error("UnknownError: The user denied permission to access");
  error.name = "UnknownError";
  return error;
}

async function freshDbMocks() {
  const dbModule = await import("../lib/db");
  return {
    open: vi.mocked(dbModule.db.open),
    get: vi.mocked(dbModule.db.settings.get),
    put: vi.mocked(dbModule.db.settings.put),
  };
}

beforeEach(() => {
  // Fresh module registry per test so each gets its own vault store singleton.
  vi.resetModules();
});

describe("useVault with blocked site storage", () => {
  test("first load fails once, cleanly: storageBlocked without throwing", async () => {
    const { open, get } = await freshDbMocks();
    open.mockRejectedValueOnce(deniedError());
    const { useVault } = await import("./useVault");

    const first = renderHook(() => useVault());
    await waitFor(() => expect(first.result.current.storageBlocked).toBe(true));
    expect(first.result.current.isUninitialized).toBe(true);
    expect(first.result.current.storageError).toMatch(/local storage/i);

    // A second mounted consumer shares the single probe — no retry storm,
    // so the open attempt happens exactly once and React stays calm.
    const second = renderHook(() => useVault());
    await waitFor(() => expect(second.result.current.storageBlocked).toBe(true));
    expect(open).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();

    first.unmount();
    second.unmount();
  });

  test("setup-time denial surfaces the honest message instead of Dexie text", async () => {
    const { open, put } = await freshDbMocks();
    open.mockResolvedValue({} as Dexie);
    put.mockRejectedValueOnce(deniedError());
    const { useVault } = await import("./useVault");

    const { result } = renderHook(() => useVault());
    await waitFor(() => expect(result.current.isUninitialized).toBe(true));

    await expect(result.current.setup("correct horse battery staple", 15)).rejects.toThrow(
      /could not access local storage/i,
    );
    expect(result.current.storageBlocked).toBe(true);
  });

  test("healthy storage still initializes to uninitialized without blocking", async () => {
    const { open, get } = await freshDbMocks();
    open.mockResolvedValue({} as Dexie);
    get.mockResolvedValue(undefined);
    const { useVault } = await import("./useVault");

    const { result, unmount } = renderHook(() => useVault());
    await waitFor(() => expect(result.current.isUninitialized).toBe(true));
    expect(result.current.storageBlocked).toBe(false);
    expect(result.current.storageError).toBeNull();
    expect(open).toHaveBeenCalledTimes(1);
    unmount();
  });
});
