// LICENSE_KEY_ENC_KEY rotation (docs/14-devops.md §10): re-encrypt `keyEnc` on every `lic:*` record.
//
// Idempotent and resumable without a state file: each record is first tried with the NEW key; if that
// works it is already rotated and skipped. Otherwise the OLD key must open it, and the record is written
// back with only `keyEnc` changed (same key, same expiration, same metadata, every other field untouched).
// A record neither key opens is reported and never written. Re-running after an interruption, or after
// the functions started writing new-key records, therefore only touches what is left.
//
// Lost-update guard: just before a batch is written the values are read again, and a record that changed
// since it was read (a webhook or activation landed in between) is skipped and counted as `changed`. The
// run exits non-zero so the operator runs it again; the next pass sees the fresh value.
import { encryptKeyEnc, parseAesKey, tryDecryptKeyEnc } from './crypto.ts';
import type { IKvRecord } from './format.ts';
import { isExpiredForWrite, listPages, readPage, type IKvStore } from './store.ts';

export const LICENSE_PREFIX = 'lic:';

export interface IReencryptOptions {
  oldKey: string;
  newKey: string;
  apply: boolean;
  nowMs?: number;
  onProgress?: (summary: IReencryptSummary) => void;
}

export interface IReencryptSummary {
  apply: boolean;
  scanned: number;
  /** Re-encrypted with the new key (dry run: would be). */
  rotated: number;
  /** Already encrypted with the new key. */
  alreadyNew: number;
  /** Records without a string `keyEnc` (left alone). */
  noKeyEnc: number;
  /** Expiring within 60 s: KV cannot take the write, and the record is about to disappear anyway. */
  expiring: number;
  /** Changed between read and write; run again. */
  changed: string[];
  /** Neither key decrypts `keyEnc`, or the value is not JSON. Never written. */
  failed: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateRotationKeys(oldKey: string, newKey: string): void {
  const oldRaw = parseAesKey(oldKey, 'OLD_LICENSE_KEY_ENC_KEY');
  const newRaw = parseAesKey(newKey, 'NEW_LICENSE_KEY_ENC_KEY');
  if (oldRaw.every((byte, index) => byte === newRaw[index])) {
    throw new Error('OLD_LICENSE_KEY_ENC_KEY and NEW_LICENSE_KEY_ENC_KEY are the same key');
  }
}

export async function reencryptNamespace(store: IKvStore, options: IReencryptOptions): Promise<IReencryptSummary> {
  validateRotationKeys(options.oldKey, options.newKey);
  const nowMs = options.nowMs ?? Date.now();
  const summary: IReencryptSummary = {
    apply: options.apply,
    scanned: 0,
    rotated: 0,
    alreadyNew: 0,
    noKeyEnc: 0,
    expiring: 0,
    changed: [],
    failed: [],
  };

  for await (const keys of listPages(store, LICENSE_PREFIX)) {
    const rows = await readPage(store, keys);
    const pending: Array<{ original: string; next: IKvRecord }> = [];
    for (const row of rows) {
      summary.scanned += 1;
      let record: unknown;
      try {
        record = JSON.parse(row.value);
      } catch {
        summary.failed.push(row.key);
        continue;
      }
      if (!isObject(record) || typeof record.keyEnc !== 'string') {
        summary.noKeyEnc += 1;
        continue;
      }
      if ((await tryDecryptKeyEnc(record.keyEnc, options.newKey)) !== null) {
        summary.alreadyNew += 1;
        continue;
      }
      const plain = await tryDecryptKeyEnc(record.keyEnc, options.oldKey);
      if (plain === null) {
        summary.failed.push(row.key);
        continue;
      }
      if (isExpiredForWrite(row, nowMs)) {
        summary.expiring += 1;
        continue;
      }
      const next: IKvRecord = { ...row, value: JSON.stringify({ ...record, keyEnc: await encryptKeyEnc(plain, options.newKey) }) };
      pending.push({ original: row.value, next });
    }

    if (!options.apply) {
      summary.rotated += pending.length;
    } else if (pending.length > 0) {
      const fresh = await store.getMany(pending.map((row) => row.next.key));
      const writes: IKvRecord[] = [];
      for (const row of pending) {
        if (fresh.get(row.next.key) === row.original) writes.push(row.next);
        else summary.changed.push(row.next.key);
      }
      if (writes.length > 0) await store.putMany(writes);
      summary.rotated += writes.length;
    }
    options.onProgress?.(summary);
  }
  return summary;
}
