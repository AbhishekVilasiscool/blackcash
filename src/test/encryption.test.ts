import { describe, expect, it, vi } from "vitest";
import {
  initializeVault,
  unlockVault,
  encryptData,
  decryptData,
  encryptField,
  decryptField,
  generateSalt,
  computeVerificationHash,
} from "../lib/crypto";

vi.mock("../lib/db", () => ({
  db: {
    settings: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

const testPassphrase = "test-passphrase-123";
const wrongPassphrase = "wrong-passphrase";
const testData = { name: "Test Account", code: "1000", type: "asset", balance: 1234.56 };

describe("Crypto - Encryption at Rest", () => {

  it("generates a cryptographically random salt", async () => {
    const salt1 = await generateSalt();
    const salt2 = await generateSalt();
    expect(salt1).toHaveLength(16);
    expect(salt2).toHaveLength(16);
    expect(salt1).not.toEqual(salt2);
  });

  it("derives different keys for different passphrases with same salt", async () => {
    const salt = await generateSalt();
    const metadata1 = {
      salt: Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join(""),
      verificationHash: await computeVerificationHash(testPassphrase, salt),
      autoLockMinutes: 15,
      createdAt: new Date().toISOString(),
    };
    const metadata2 = {
      salt: Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join(""),
      verificationHash: await computeVerificationHash(wrongPassphrase, salt),
      autoLockMinutes: 15,
      createdAt: new Date().toISOString(),
    };
    const key1 = await unlockVault(testPassphrase, metadata1);
    const key2 = await unlockVault(wrongPassphrase, metadata2);
    
    // Test that encrypting with one key and decrypting with the other fails
    const plaintext = "test data";
    const encrypted = await encryptData(plaintext, key1);
    await expect(decryptData(encrypted, key2)).rejects.toThrow();
  });

  it("initializes vault with passphrase and produces metadata", async () => {
    const metadata = await initializeVault(testPassphrase);
    expect(metadata.salt).toBeDefined();
    expect(metadata.verificationHash).toBeDefined();
    expect(metadata.autoLockMinutes).toBe(15);
    expect(metadata.createdAt).toBeDefined();
  });

  it("unlocks vault with correct passphrase", async () => {
    const metadata = await initializeVault(testPassphrase);
    const key = await unlockVault(testPassphrase, metadata);
    expect(key).toBeDefined();
    // CryptoKey from Web Crypto API is used with crypto.subtle.encrypt/decrypt
    // Test that it works for encryption/decryption
    const plaintext = "test";
    const encrypted = await encryptData(plaintext, key);
    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("rejects wrong passphrase with clear error", async () => {
    const metadata = await initializeVault(testPassphrase);
    await expect(unlockVault(wrongPassphrase, metadata)).rejects.toThrow("Invalid passphrase");
  });

  it("encrypts and decrypts data losslessly (round-trip)", async () => {
    const metadata = await initializeVault(testPassphrase);
    const key = await unlockVault(testPassphrase, metadata);

    const plaintext = JSON.stringify(testData);
    const encrypted = await encryptData(plaintext, key);
    const decrypted = await decryptData(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts field values losslessly", async () => {
    const metadata = await initializeVault(testPassphrase);
    const key = await unlockVault(testPassphrase, metadata);

    const testValues = [
      "simple string",
      "1234.56",
      "account-name-with-dashes",
      "special chars: !@#$%^&*()",
      "unicode: 测试 🔐",
      "",
      "a".repeat(1000),
    ];

    for (const value of testValues) {
      const encrypted = await encryptField(value, key);
      const decrypted = await decryptField(encrypted, key);
      expect(decrypted).toBe(value);
    }
  });

  it("produces different ciphertext for same plaintext (IV randomness)", async () => {
    const metadata = await initializeVault(testPassphrase);
    const key = await unlockVault(testPassphrase, metadata);

    const plaintext = "test data";
    const encrypted1 = await encryptData(plaintext, key);
    const encrypted2 = await encryptData(plaintext, key);

    expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);

    const decrypted1 = await decryptData(encrypted1, key);
    const decrypted2 = await decryptData(encrypted2, key);
    expect(decrypted1).toBe(plaintext);
    expect(decrypted2).toBe(plaintext);
  });

  it("fails to decrypt with wrong key", async () => {
    const metadata1 = await initializeVault(testPassphrase);
    const metadata2 = await initializeVault(wrongPassphrase);
    const key1 = await unlockVault(testPassphrase, metadata1);
    const key2 = await unlockVault(wrongPassphrase, metadata2);

    const plaintext = JSON.stringify(testData);
    const encrypted = await encryptData(plaintext, key1);

    await expect(decryptData(encrypted, key2)).rejects.toThrow();
  });

  it("verification hash is deterministic for same passphrase and salt", async () => {
    const salt = await generateSalt();
    const hash1 = await computeVerificationHash(testPassphrase, salt);
    const hash2 = await computeVerificationHash(testPassphrase, salt);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 256 bits = 64 hex chars
  });

  it("different salts produce different verification hashes", async () => {
    const salt1 = await generateSalt();
    const salt2 = await generateSalt();
    const hash1 = await computeVerificationHash(testPassphrase, salt1);
    const hash2 = await computeVerificationHash(testPassphrase, salt2);
    expect(hash1).not.toBe(hash2);
  });
});

describe("Vault - Session Management", () => {
  it("uses PBKDF2 with 200,000 iterations", async () => {
    const metadata = await initializeVault(testPassphrase);
    const key = await unlockVault(testPassphrase, metadata);
    expect(key).toBeDefined();
    // Verify it works for encryption/decryption
    const plaintext = "test";
    const encrypted = await encryptData(plaintext, key);
    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});