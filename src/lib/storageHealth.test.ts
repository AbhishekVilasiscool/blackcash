import { describe, expect, test } from "vitest";
import { isStorageBlockedError, STORAGE_BLOCKED_MESSAGE, StorageBlockedError } from "./storageHealth";

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

describe("isStorageBlockedError", () => {
  test("recognizes Brave-style denial wrapped by Dexie", () => {
    expect(
      isStorageBlockedError(namedError("UnknownError", "The user denied permission to access")),
    ).toBe(true);
  });

  test.each([
    ["DatabaseClosedError", "Database has been closed"],
    ["OpenFailedError", "Failed to open database"],
    ["SecurityError", "The operation is insecure"],
    ["QuotaExceededError", "Quota exceeded"],
    ["InvalidStateError", "A mutation operation was attempted on a database that did not allow mutations"],
    ["NotAllowedError", "Permission not allowed"],
  ])("recognizes blocked-storage name %s", (name, message) => {
    expect(isStorageBlockedError(namedError(name, message))).toBe(true);
  });

  test("recognizes Dexie-shaped errors carrying denial in inner", () => {
    expect(
      isStorageBlockedError({
        name: "OpenFailedError",
        message: "Failed to open",
        inner: namedError("SecurityError", "The user denied permission to access"),
      }),
    ).toBe(true);
  });

  test("recognizes raw denial strings", () => {
    expect(isStorageBlockedError("UnknownError: The user denied permission to access")).toBe(true);
  });

  test.each([
    ["wrong passphrase", new Error("Vault not initialized")],
    ["decryption failure", new Error("Failed to decrypt with wrong key")],
    ["syntax", new SyntaxError("Unexpected token")],
    ["type error", new TypeError("Cannot read properties of undefined")],
    ["generic", new Error("Something unexpected happened")],
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
  ])("does not misclassify %s", (_label, value) => {
    expect(isStorageBlockedError(value)).toBe(false);
  });
});

describe("StorageBlockedError", () => {
  test("carries the honest user-facing message", () => {
    const error = new StorageBlockedError("UnknownError: denied");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("StorageBlockedError");
    expect(error.message).toContain(STORAGE_BLOCKED_MESSAGE);
  });
});
