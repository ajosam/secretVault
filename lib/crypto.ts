import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getMasterKey(): Buffer {
  const raw = process.env.SECRET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("SECRET_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SECRET_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export interface EncryptedValue {
  ciphertext: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  authTag: Uint8Array<ArrayBuffer>;
  checksum: string;
}

// Prisma 7's Bytes fields are typed as Uint8Array<ArrayBuffer>. Node's Buffer/
// randomBytes/crypto outputs are Uint8Array<ArrayBufferLike> (could in theory be
// backed by a SharedArrayBuffer), so a fresh plain-ArrayBuffer-backed copy is made
// before returning — this is what satisfies the generated client's stricter type.
function toPlainBytes(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(input.length);
  out.set(input);
  return out;
}

export function encryptSecretValue(plaintext: string): EncryptedValue {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const checksum = "sha256:" + createHash("sha256").update(plaintext).digest("hex").slice(0, 16) + "…";

  return {
    ciphertext: toPlainBytes(ciphertext),
    iv: toPlainBytes(iv),
    authTag: toPlainBytes(authTag),
    checksum,
  };
}

export function decryptSecretValue(input: { ciphertext: Uint8Array; iv: Uint8Array; authTag: Uint8Array }): string {
  const key = getMasterKey();
  const decipher = createDecipheriv("aes-256-gcm", key, input.iv);
  decipher.setAuthTag(input.authTag);
  const plaintext = Buffer.concat([decipher.update(input.ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
