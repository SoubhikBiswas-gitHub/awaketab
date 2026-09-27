// Encryption for the KV ops scripts. Two formats, both AES-256-GCM with a 32-byte base64 key:
//
// 1. Backup envelope (BACKUP_ENCRYPTION_KEY): MAGIC (8 bytes) ‖ IV (12) ‖ ciphertext+tag, MAGIC as AAD.
//    Binary, written as `*.jsonl.enc`. A backup therefore never exists as plain text outside memory.
// 2. `keyEnc` on `lic:*` records (LICENSE_KEY_ENC_KEY): base64(IV (12) ‖ ciphertext+tag). This mirrors
//    `encryptUtf8` / `decryptUtf8` in apps/web/functions/_lib/license.ts byte for byte; the interop test in
//    apps/web/functions/_lib/kv-ops-interop.test.ts keeps the two in step.

const MAGIC = new TextEncoder().encode('ATKVBK01');
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function parseAesKey(keyB64: string, name: string): Uint8Array<ArrayBuffer> {
  const trimmed = keyB64.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(trimmed)) throw new Error(`${name} must be base64 (openssl rand -base64 32)`);
  const raw = new Uint8Array(Buffer.from(trimmed, 'base64'));
  if (raw.byteLength !== 32) throw new Error(`${name} must decode to 32 bytes (got ${String(raw.byteLength)})`);
  return raw;
}

async function importKey(raw: Uint8Array<ArrayBuffer>, usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage]);
}

export function isEncryptedBackup(bytes: Uint8Array): boolean {
  return bytes.byteLength >= MAGIC.byteLength && MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function encryptBackup(plain: string, keyB64: string): Promise<Uint8Array> {
  const key = await importKey(parseAesKey(keyB64, 'BACKUP_ENCRYPTION_KEY'), 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: MAGIC }, key, new TextEncoder().encode(plain)),
  );
  const out = new Uint8Array(MAGIC.byteLength + IV_BYTES + ct.byteLength);
  out.set(MAGIC);
  out.set(iv, MAGIC.byteLength);
  out.set(ct, MAGIC.byteLength + IV_BYTES);
  return out;
}

export async function decryptBackup(bytes: Uint8Array, keyB64: string): Promise<string> {
  if (!isEncryptedBackup(bytes)) throw new Error('Not an encrypted AwakeTab KV backup (bad magic)');
  if (bytes.byteLength < MAGIC.byteLength + IV_BYTES + TAG_BYTES) throw new Error('Encrypted backup is truncated');
  const key = await importKey(parseAesKey(keyB64, 'BACKUP_ENCRYPTION_KEY'), 'decrypt');
  const iv = bytes.slice(MAGIC.byteLength, MAGIC.byteLength + IV_BYTES);
  const ct = bytes.slice(MAGIC.byteLength + IV_BYTES);
  let pt: ArrayBuffer;
  try {
    pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: MAGIC }, key, ct);
  } catch {
    throw new Error('Backup did not decrypt: wrong BACKUP_ENCRYPTION_KEY or a corrupted file');
  }
  return new TextDecoder().decode(pt);
}

export async function encryptKeyEnc(plain: string, keyB64: string): Promise<string> {
  const key = await importKey(parseAesKey(keyB64, 'LICENSE_KEY_ENC_KEY'), 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
  const packed = new Uint8Array(IV_BYTES + ct.byteLength);
  packed.set(iv);
  packed.set(ct, IV_BYTES);
  return Buffer.from(packed).toString('base64');
}

export async function tryDecryptKeyEnc(packedB64: string, keyB64: string): Promise<string | null> {
  const packed = new Uint8Array(Buffer.from(packedB64, 'base64'));
  if (packed.byteLength < IV_BYTES + TAG_BYTES) return null;
  const key = await importKey(parseAesKey(keyB64, 'LICENSE_KEY_ENC_KEY'), 'decrypt');
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: packed.slice(0, IV_BYTES) },
      key,
      packed.slice(IV_BYTES),
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
