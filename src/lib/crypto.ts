const PBKDF2_ITERATIONS = 200000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface CryptoKeyPair {
  key: CryptoKey;
  salt: Uint8Array;
}

export interface EncryptedData {
  iv: Uint8Array;
  ciphertext: Uint8Array;
  salt: Uint8Array;
}

export interface VaultMetadata {
  salt: string;
  verificationHash: string;
  autoLockMinutes: number;
  createdAt: string;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function computeVerificationHash(passphrase: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(bits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export async function initializeVault(passphrase: string): Promise<VaultMetadata> {
  const salt = await generateSalt();
  const verificationHash = await computeVerificationHash(passphrase, salt);

  return {
    salt: Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join(""),
    verificationHash,
    autoLockMinutes: 15,
    createdAt: new Date().toISOString(),
  };
}

export async function unlockVault(passphrase: string, metadata: VaultMetadata): Promise<CryptoKey> {
  const salt = new Uint8Array(metadata.salt.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
  const verificationHash = await computeVerificationHash(passphrase, salt);

  if (verificationHash !== metadata.verificationHash) {
    throw new Error("Invalid passphrase");
  }

  return deriveKey(passphrase, salt);
}

export async function encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(data)
  );

  return {
    iv,
    ciphertext: new Uint8Array(ciphertext),
    salt: new Uint8Array(0),
  };
}

export async function decryptData(encrypted: EncryptedData, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encrypted.iv.buffer as ArrayBuffer },
    key,
    encrypted.ciphertext.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function encryptObject<T>(obj: T, key: CryptoKey): Promise<EncryptedData> {
  return encryptData(JSON.stringify(obj), key);
}

export async function decryptObject<T>(encrypted: EncryptedData, key: CryptoKey): Promise<T> {
  const json = await decryptData(encrypted, key);
  return JSON.parse(json);
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encryptedDataToBase64(encrypted: EncryptedData): string {
  return JSON.stringify({
    iv: arrayBufferToBase64(encrypted.iv),
    ciphertext: arrayBufferToBase64(encrypted.ciphertext),
  });
}

export function base64ToEncryptedData(base64: string): EncryptedData {
  const parsed = JSON.parse(base64);
  return {
    iv: base64ToArrayBuffer(parsed.iv),
    ciphertext: base64ToArrayBuffer(parsed.ciphertext),
    salt: new Uint8Array(0),
  };
}

export async function encryptField(value: string, key: CryptoKey): Promise<string> {
  if (!value) return value;
  const encrypted = await encryptData(value, key);
  return encryptedDataToBase64(encrypted);
}

export async function decryptField(encryptedB64: string, key: CryptoKey): Promise<string> {
  if (!encryptedB64) return encryptedB64;
  try {
    const encrypted = base64ToEncryptedData(encryptedB64);
    return await decryptData(encrypted, key);
  } catch {
    return encryptedB64;
  }
}

export function getSensitiveFields(tableName: string): string[] {
  switch (tableName) {
    case "accounts":
      return ["name", "code", "type", "subtype", "parentId"];
    case "journalEntries":
      return ["memo", "reference"];
    case "journalLines":
      return ["memo", "debit", "credit"];
    case "contacts":
      return ["name", "company", "email", "phone", "tags"];
    case "interactions":
      return ["note", "kind"];
    case "contactLinks":
      return ["label", "kind"];
    default:
      return [];
  }
}

export function isSensitiveTable(tableName: string): boolean {
  return [
    "accounts",
    "journalEntries",
    "journalLines",
    "contacts",
    "interactions",
    "contactLinks",
  ].includes(tableName);
}