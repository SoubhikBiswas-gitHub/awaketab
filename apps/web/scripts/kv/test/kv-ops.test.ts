// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { exportNamespace, readBackupFile } from '../lib/backup.ts';
import { backupTargets, isProductionTarget, runBackup, runReencrypt, runRestore, type ICliDeps, type ITargetStore } from '../lib/cli.ts';
import { decryptBackup, encryptBackup, encryptKeyEnc, isEncryptedBackup, parseAesKey, tryDecryptKeyEnc } from '../lib/crypto.ts';
import { backupFileName, countByPrefix, parseBackup, serializeBackup, type IBackup } from '../lib/format.ts';
import { reencryptNamespace } from '../lib/reencrypt.ts';
import { applyRestore, planRestore } from '../lib/restore.ts';
import { MemoryKvStore } from './memory-store.ts';

// Fixture keys only (never production secrets). Same shape as `openssl rand -base64 32`.
const BACKUP_KEY = Buffer.alloc(32, 7).toString('base64');
const OTHER_KEY = Buffer.alloc(32, 8).toString('base64');
const OLD_ENC = Buffer.alloc(32, 1).toString('base64');
const NEW_ENC = Buffer.alloc(32, 2).toString('base64');
const NOW = Date.UTC(2026, 8, 28, 3, 17);
const FUTURE = Math.floor(NOW / 1000) + 365 * 86_400;
const RAW_KEY = 'AWAKE-1111-2222-3333-SECRETKEY';

function licence(keyEnc: string, extra: Record<string, unknown> = {}) {
  return {
    plan: 'pro_yearly',
    status: 'active',
    keyEnc,
    polarOrderId: 'ord_1',
    customerId: 'cus_1',
    activations: [{ devHash: 'd'.repeat(64), label: 'Mac', at: NOW }],
    limit: 5,
    exp: NOW + 200 * 86_400_000,
    createdAt: NOW - 86_400_000,
    updatedAt: NOW - 3_600_000,
    ...extra,
  };
}

async function seededStore(pageSize = 1000, title = 'LICENSES_PREVIEW'): Promise<MemoryKvStore> {
  const store = new MemoryKvStore(title, pageSize, () => NOW);
  store
    .seed('lic:aaa', licence(await encryptKeyEnc(`${RAW_KEY}-A`, OLD_ENC)), { expiration: FUTURE, metadata: { v: 1 } })
    .seed('lic:bbb', licence(await encryptKeyEnc(`${RAW_KEY}-B`, OLD_ENC)), { expiration: FUTURE })
    .seed('lic:ccc', licence(await encryptKeyEnc(`${RAW_KEY}-C`, OLD_ENC)))
    .seed('cus:cus_1', ['aaa', 'bbb'])
    .seed('ord:ord_1', { plan: 'pro_yearly', amountCents: 1200, currency: 'usd', customerId: 'cus_1', at: NOW })
    .seed('embed:example.com', { keyHash: 'aaa', attribution: false, theme: {}, expiresAt: NOW })
    .seed('rating:r1', { stars: 5, locale: 'en', ver: 'x', at: NOW }, { expiration: FUTURE })
    .seed('wh:evt_1', { at: NOW }, { expiration: FUTURE })
    .seed('rl:e:hash:1', '3', { expiration: FUTURE });
  return store;
}

function sampleBackup(): IBackup {
  return {
    header: {
      format: 'awaketab-kv-backup',
      version: 1,
      namespace: 'LICENSES',
      namespaceId: 'ns-prod',
      createdAt: new Date(NOW).toISOString(),
      prefixes: ['lic:', 'cus:'],
      count: 2,
    },
    records: [
      { key: 'cus:c', value: '["a"]' },
      { key: 'lic:a', value: '{"keyEnc":"x"}', expiration: FUTURE, metadata: { tag: 'm' } },
    ],
  };
}

// ---------------------------------------------------------------------------------------------------------

describe('backup format', () => {
  it('round-trips header, values, expirations and metadata', () => {
    const text = serializeBackup(sampleBackup());
    expect(text.split('\n')[0]).toContain('"format":"awaketab-kv-backup"');
    expect(parseBackup(text)).toEqual(sampleBackup());
  });

  it('rejects truncated files, duplicate keys, wrong versions and malformed lines', () => {
    const lines = serializeBackup(sampleBackup()).trim().split('\n');
    expect(() => parseBackup(lines.slice(0, 2).join('\n'))).toThrow(/truncated/u);
    expect(() => parseBackup([lines[0], lines[1], lines[1]].join('\n'))).toThrow(/twice/u);
    expect(() => parseBackup(lines.join('\n').replace('"version":1', '"version":9'))).toThrow(/version 9/u);
    expect(() => parseBackup([lines[0], lines[1], '{"key":"x"}'].join('\n'))).toThrow(/line 3/u);
    expect(() => parseBackup([lines[0], lines[1], '{"key":"x","value":"v","expiration":-1}'].join('\n'))).toThrow(/expiration/u);
    expect(() => parseBackup('')).toThrow(/empty/u);
    expect(() => parseBackup('{"format":"other"}')).toThrow(/Not an/u);
  });

  it('names files per namespace and UTC day, and counts per key family', () => {
    expect(backupFileName('LICENSES', new Date(NOW))).toBe('LICENSES-2026-09-28.jsonl.enc');
    expect(countByPrefix(sampleBackup().records)).toEqual({ 'cus:': 1, 'lic:': 1 });
  });
});

describe('encryption', () => {
  it('backup envelope round-trips and hides the plaintext', async () => {
    const plain = serializeBackup(sampleBackup()) + RAW_KEY;
    const bytes = await encryptBackup(plain, BACKUP_KEY);
    expect(isEncryptedBackup(bytes)).toBe(true);
    expect(Buffer.from(bytes).toString('latin1')).not.toContain('keyEnc');
    expect(Buffer.from(bytes).toString('latin1')).not.toContain(RAW_KEY);
    expect(await decryptBackup(bytes, BACKUP_KEY)).toBe(plain);
  });

  it('fails closed on a wrong key or a tampered file', async () => {
    const bytes = await encryptBackup('hello', BACKUP_KEY);
    await expect(decryptBackup(bytes, OTHER_KEY)).rejects.toThrow(/wrong BACKUP_ENCRYPTION_KEY/u);
    const tampered = bytes.slice();
    tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 1;
    await expect(decryptBackup(tampered, BACKUP_KEY)).rejects.toThrow(/did not decrypt/u);
    await expect(decryptBackup(new TextEncoder().encode('plain text'), BACKUP_KEY)).rejects.toThrow(/bad magic/u);
  });

  it('accepts only 32-byte base64 keys', () => {
    expect(parseAesKey(BACKUP_KEY, 'K').byteLength).toBe(32);
    expect(() => parseAesKey(Buffer.alloc(16).toString('base64'), 'K')).toThrow(/32 bytes/u);
    expect(() => parseAesKey('not base64!', 'K')).toThrow(/base64/u);
  });

  it('keyEnc opens only with the key it was written with', async () => {
    const packed = await encryptKeyEnc(RAW_KEY, OLD_ENC);
    expect(await tryDecryptKeyEnc(packed, OLD_ENC)).toBe(RAW_KEY);
    expect(await tryDecryptKeyEnc(packed, NEW_ENC)).toBeNull();
    expect(await tryDecryptKeyEnc('AAAA', OLD_ENC)).toBeNull();
  });
});

describe('exportNamespace', () => {
  it('exports every durable family across pages, skips wh:/rl:, and keeps expirations and metadata', async () => {
    const store = await seededStore(2);
    const reads: number[] = [];
    const { bytes, backup } = await exportNamespace(store, {
      namespace: 'LICENSES',
      namespaceId: 'ns-prod',
      encryptionKey: BACKUP_KEY,
      now: new Date(NOW),
      onProgress: (read) => reads.push(read),
    });
    expect(backup.records.map((row) => row.key)).toEqual([
      'cus:cus_1',
      'embed:example.com',
      'lic:aaa',
      'lic:bbb',
      'lic:ccc',
      'ord:ord_1',
      'rating:r1',
    ]);
    expect(backup.records.find((row) => row.key === 'lic:aaa')).toMatchObject({ expiration: FUTURE, metadata: { v: 1 } });
    expect(backup.records.find((row) => row.key === 'lic:ccc')).not.toHaveProperty('expiration');
    expect(store.calls.list).toBeGreaterThan(5); // lic: needed two pages of 2
    expect(reads.at(-1)).toBe(7);
    expect(Buffer.from(bytes).toString('latin1')).not.toContain('cus_1');

    const back = await readBackupFile(bytes, BACKUP_KEY);
    expect(back).toEqual(backup);
    await expect(readBackupFile(bytes, undefined)).rejects.toThrow(/BACKUP_ENCRYPTION_KEY/u);
    expect(await readBackupFile(new TextEncoder().encode(serializeBackup(backup)), undefined)).toEqual(backup);
  });

  it('exports an empty namespace as a valid zero-record backup', async () => {
    const { backup, bytes } = await exportNamespace(new MemoryKvStore(), { namespace: 'LICENSES', namespaceId: 'n', encryptionKey: BACKUP_KEY });
    expect(backup.header.count).toBe(0);
    expect((await readBackupFile(bytes, BACKUP_KEY)).records).toEqual([]);
  });
});

describe('restore', () => {
  async function backupOf(store: MemoryKvStore) {
    return (await exportNamespace(store, { namespace: 'LICENSES', namespaceId: 'ns-prod', encryptionKey: BACKUP_KEY, now: new Date(NOW) }))
      .backup;
  }

  it('plans create / same / conflict / expired and writes only missing keys by default', async () => {
    const source = await seededStore();
    source.seed('rating:old', { stars: 1 }, { expiration: Math.floor(NOW / 1000) + 30 });
    const backup = await backupOf(source);

    const target = new MemoryKvStore('LICENSES_PREVIEW', 1000, () => NOW);
    target.seed('cus:cus_1', ['aaa', 'bbb']); // same
    target.seed('lic:bbb', { changed: true }, { expiration: FUTURE }); // conflict: newer live value
    target.seed('lic:zzz', { only: 'live' }); // not in backup: never touched

    const plan = await planRestore(backup.records, target, { nowMs: NOW });
    expect(plan.same.map((row) => row.key)).toEqual(['cus:cus_1']);
    expect(plan.conflict.map((row) => row.key)).toEqual(['lic:bbb']);
    expect(plan.expired.map((row) => row.key)).toEqual(['rating:old']);
    expect(plan.create).toHaveLength(5);

    expect(await applyRestore(plan, target, false)).toBe(5);
    expect(target.record('lic:aaa')).toEqual(source.record('lic:aaa')); // value + expiration + metadata
    expect(target.record('lic:ccc')).toEqual(source.record('lic:ccc'));
    expect(target.json('lic:bbb')).toEqual({ changed: true });
    expect(target.rows.has('lic:zzz')).toBe(true);
    expect(target.rows.has('rating:old')).toBe(false);
  });

  it('overwrites conflicts only with overwrite, and filters by prefix', async () => {
    const backup = await backupOf(await seededStore());
    const target = new MemoryKvStore('x', 1000, () => NOW).seed('lic:bbb', { changed: true });
    const plan = await planRestore(backup.records, target, { nowMs: NOW, prefixes: ['lic:'] });
    expect(plan.filtered).toBe(4);
    expect(plan.create.map((row) => row.key)).toEqual(['lic:aaa', 'lic:ccc']);
    await applyRestore(plan, target, true);
    expect(target.record('lic:bbb')?.value).toBe(backup.records.find((row) => row.key === 'lic:bbb')?.value);
    expect(target.rows.size).toBe(3);
  });
});

describe('reencryptNamespace', () => {
  it('dry run counts what would rotate and writes nothing', async () => {
    const store = await seededStore();
    const summary = await reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: false, nowMs: NOW });
    expect(summary).toMatchObject({ scanned: 3, rotated: 3, alreadyNew: 0, failed: [], changed: [] });
    expect(store.calls.putMany).toBe(0);
  });

  it('rotates keyEnc only, preserves everything else, and a second run is a no-op', async () => {
    const store = await seededStore(2);
    const before = store.json('lic:aaa') as Record<string, unknown> | null;
    const progress: number[] = [];
    const first = await reencryptNamespace(store, {
      oldKey: OLD_ENC,
      newKey: NEW_ENC,
      apply: true,
      nowMs: NOW,
      onProgress: (row) => progress.push(row.scanned),
    });
    expect(first).toMatchObject({ scanned: 3, rotated: 3, failed: [], changed: [] });
    expect(progress).toEqual([2, 3]);

    const after = store.json('lic:aaa') as Record<string, unknown> | null;
    expect(after?.keyEnc).not.toBe(before?.keyEnc);
    expect({ ...after, keyEnc: null }).toEqual({ ...before, keyEnc: null });
    expect(await tryDecryptKeyEnc(String(after?.keyEnc), NEW_ENC)).toBe(`${RAW_KEY}-A`);
    expect(store.record('lic:aaa')).toMatchObject({ expiration: FUTURE, metadata: { v: 1 } });
    expect(store.record('lic:ccc')).not.toHaveProperty('expiration');
    expect(store.json('cus:cus_1')).toEqual(['aaa', 'bbb']);

    const writes = store.puts.length;
    const second = await reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: true, nowMs: NOW });
    expect(second).toMatchObject({ scanned: 3, rotated: 0, alreadyNew: 3 });
    expect(store.puts.length).toBe(writes);
  });

  it('resumes after an interrupted run', async () => {
    const store = await seededStore(2);
    store.beforePut = (_records, call) => {
      if (call === 2) throw new Error('network dropped');
    };
    await expect(reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: true, nowMs: NOW })).rejects.toThrow(/network/u);
    store.beforePut = null;
    const resumed = await reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: true, nowMs: NOW });
    expect(resumed).toMatchObject({ scanned: 3, rotated: 1, alreadyNew: 2, failed: [] });
  });

  it('never writes a record neither key opens, and skips records without keyEnc', async () => {
    const store = await seededStore();
    store.seed('lic:foreign', licence(await encryptKeyEnc('X', OTHER_KEY)));
    store.seed('lic:nokey', { plan: 'pro_yearly' });
    store.seed('lic:broken', '{not json');
    const summary = await reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: true, nowMs: NOW });
    expect(summary.failed.sort()).toEqual(['lic:broken', 'lic:foreign']);
    expect(summary.noKeyEnc).toBe(1);
    expect(summary.rotated).toBe(3);
    expect(store.puts.map((row) => row.key)).not.toContain('lic:foreign');
    expect(store.puts.map((row) => row.key)).not.toContain('lic:broken');
  });

  it('skips a record changed between read and write and reports it', async () => {
    const store = await seededStore();
    const realGetMany = store.getMany.bind(store);
    let reads = 0;
    store.getMany = async (keys) => {
      reads += 1;
      if (reads === 2) store.seed('lic:bbb', { concurrently: 'updated' }); // lands between read and write
      return realGetMany(keys);
    };
    const summary = await reencryptNamespace(store, { oldKey: OLD_ENC, newKey: NEW_ENC, apply: true, nowMs: NOW });
    expect(summary.changed).toEqual(['lic:bbb']);
    expect(summary.rotated).toBe(2);
    expect(store.json('lic:bbb')).toEqual({ concurrently: 'updated' });
  });

  it('refuses identical or malformed keys', async () => {
    const store = await seededStore();
    await expect(reencryptNamespace(store, { oldKey: OLD_ENC, newKey: OLD_ENC, apply: false })).rejects.toThrow(/same key/u);
    await expect(reencryptNamespace(store, { oldKey: 'short', newKey: NEW_ENC, apply: false })).rejects.toThrow(/OLD_LICENSE_KEY_ENC_KEY/u);
  });
});

// ---------------------------------------------------------------------------------------------------------

interface ITestDeps extends ICliDeps {
  stdout: string[];
  stderr: string[];
  files: Map<string, Uint8Array>;
  stores: Map<string, MemoryKvStore>;
}

function deps(env: Record<string, string>, stores: Record<string, MemoryKvStore> = {}): ITestDeps {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const files = new Map<string, Uint8Array>();
  const map = new Map(Object.entries(stores));
  return {
    env: { CLOUDFLARE_API_TOKEN: 't', CLOUDFLARE_ACCOUNT_ID: 'acc', ...env },
    openStore: (id): ITargetStore => {
      const store = map.get(id);
      if (!store) throw new Error(`no store ${id}`);
      return store;
    },
    readFile: (file) => {
      const bytes = files.get(file);
      return bytes ? Promise.resolve(bytes) : Promise.reject(new Error(`ENOENT ${file}`));
    },
    writeFile: (file, bytes) => {
      files.set(file, bytes);
      return Promise.resolve();
    },
    out: (line) => stdout.push(line),
    err: (line) => stderr.push(line),
    now: () => new Date(NOW),
    stdout,
    stderr,
    files,
    stores: map,
  };
}

describe('CLI guards', () => {
  it('treats a namespace as production unless its title says preview, and always the KV_LICENSES_ID one', () => {
    expect(isProductionTarget('LICENSES', 'a', {})).toBe(true);
    expect(isProductionTarget('awaketab-LICENSES', 'a', {})).toBe(true);
    expect(isProductionTarget('LICENSES_PREVIEW', 'a', {})).toBe(false);
    expect(isProductionTarget('LICENSES_PREVIEW', 'a', { KV_LICENSES_ID: 'a' })).toBe(true);
  });

  it('backs up LICENSES always and LICENSES_PREVIEW when configured', () => {
    expect(() => backupTargets({})).toThrow(/KV_LICENSES_ID/u);
    expect(backupTargets({ KV_LICENSES_ID: 'p' })).toEqual([{ namespace: 'LICENSES', namespaceId: 'p' }]);
    expect(backupTargets({ KV_LICENSES_ID: 'p', KV_LICENSES_PREVIEW_ID: 'q' })).toHaveLength(2);
  });
});

describe('pnpm kv:backup', () => {
  it('writes one encrypted file per namespace and logs no record counts', async () => {
    const d = deps(
      { BACKUP_ENCRYPTION_KEY: BACKUP_KEY, KV_LICENSES_ID: 'p', KV_LICENSES_PREVIEW_ID: 'q' },
      { p: await seededStore(), q: new MemoryKvStore() },
    );
    expect(await runBackup(['--out', 'out'], d)).toBe(0);
    expect([...d.files.keys()]).toEqual(['out/LICENSES-2026-09-28.jsonl.enc', 'out/LICENSES_PREVIEW-2026-09-28.jsonl.enc']);
    const lines = d.stdout.map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(Object.keys(lines[0] ?? {})).toEqual(['namespace', 'file', 'bytes', 'sha256']);
    const prod = await readBackupFile(d.files.get('out/LICENSES-2026-09-28.jsonl.enc') ?? new Uint8Array(), BACKUP_KEY);
    expect(prod.header).toMatchObject({ namespace: 'LICENSES', namespaceId: 'p', count: 7 });
  });

  it('exits 2 with a clear message when configuration is missing, and 1 when the API fails', async () => {
    const missing = deps({});
    expect(await runBackup([], missing)).toBe(2);
    expect(missing.stderr.join()).toMatch(/BACKUP_ENCRYPTION_KEY/u);

    const failing = await seededStore();
    failing.list = () => Promise.reject(new Error('Cloudflare API list lic:* failed: HTTP 403'));
    const d = deps({ BACKUP_ENCRYPTION_KEY: BACKUP_KEY, KV_LICENSES_ID: 'p' }, { p: failing });
    expect(await runBackup([], d)).toBe(1);
    expect(d.stderr.join()).toMatch(/HTTP 403/u);
    expect(d.files.size).toBe(0);
  });
});

describe('pnpm kv:restore', () => {
  async function withBackup(target: MemoryKvStore, env: Record<string, string> = {}) {
    const d = deps({ BACKUP_ENCRYPTION_KEY: BACKUP_KEY, ...env }, { target });
    const { bytes } = await exportNamespace(await seededStore(), { namespace: 'LICENSES', namespaceId: 'p', encryptionKey: BACKUP_KEY, now: new Date(NOW) });
    d.files.set('b.enc', bytes);
    return d;
  }

  it('validates the file alone without a target', async () => {
    const d = await withBackup(new MemoryKvStore());
    expect(await runRestore(['b.enc'], d)).toBe(0);
    expect(JSON.parse(d.stdout[0] ?? '{}')).toMatchObject({ backup: { count: 7 }, byPrefix: { 'lic:': 3 } });
    expect(await runRestore(['b.enc', '--apply'], d)).toBe(2);
  });

  it('is a dry run by default', async () => {
    const target = new MemoryKvStore('LICENSES_PREVIEW');
    const d = await withBackup(target);
    expect(await runRestore(['b.enc', '--namespace-id', 'target'], d)).toBe(0);
    expect(target.calls.putMany).toBe(0);
    expect(JSON.parse(d.stdout[1] ?? '{}')).toMatchObject({ dryRun: true, create: 7, willWrite: 7 });
    expect(d.stderr.join('\n')).toMatch(/Dry run: nothing written/u);
  });

  it('refuses to write production without --yes-production', async () => {
    const target = new MemoryKvStore('LICENSES');
    const d = await withBackup(target);
    expect(await runRestore(['b.enc', '--namespace-id', 'target', '--apply'], d)).toBe(2);
    expect(d.stderr.join()).toMatch(/is production.*--yes-production/u);
    expect(target.calls.putMany).toBe(0);

    expect(await runRestore(['b.enc', '--namespace-id', 'target', '--apply', '--yes-production'], d)).toBe(0);
    expect(target.rows.size).toBe(7);
  });

  it('treats the KV_LICENSES_ID namespace as production whatever its title', async () => {
    const target = new MemoryKvStore('LICENSES_PREVIEW');
    const d = await withBackup(target, { KV_LICENSES_ID: 'target' });
    expect(await runRestore(['b.enc', '--namespace-id', 'target', '--apply'], d)).toBe(2);
    expect(target.calls.putMany).toBe(0);
  });

  it('writes a preview namespace with --apply and reports kept conflicts', async () => {
    const target = new MemoryKvStore('LICENSES_PREVIEW', 1000, () => NOW).seed('lic:aaa', { newer: true });
    const d = await withBackup(target);
    expect(await runRestore(['b.enc', '--namespace-id', 'target', '--apply'], d)).toBe(0);
    expect(target.json('lic:aaa')).toEqual({ newer: true });
    expect(target.rows.size).toBe(7);
    expect(d.stderr.join()).toMatch(/1 keys differ/u);
    expect(d.stderr.join()).toMatch(/restoring into "LICENSES_PREVIEW"/u);
  });

  it('fails on a wrong key', async () => {
    const d = await withBackup(new MemoryKvStore());
    d.env.BACKUP_ENCRYPTION_KEY = OTHER_KEY;
    expect(await runRestore(['b.enc'], d)).toBe(1);
    expect(d.stderr.join()).toMatch(/wrong BACKUP_ENCRYPTION_KEY/u);
  });
});

describe('pnpm kv:reencrypt', () => {
  const keys = { OLD_LICENSE_KEY_ENC_KEY: OLD_ENC, NEW_LICENSE_KEY_ENC_KEY: NEW_ENC };

  it('dry run by default, with progress on stderr and a JSON summary on stdout', async () => {
    const store = await seededStore(2);
    const d = deps(keys, { ns: store });
    expect(await runReencrypt(['--namespace-id', 'ns'], d)).toBe(0);
    expect(store.calls.putMany).toBe(0);
    expect(d.stderr.filter((line) => line.includes('scanned'))).toHaveLength(2);
    expect(JSON.parse(d.stdout[0] ?? '{}')).toMatchObject({ apply: false, rotated: 3 });
  });

  it('refuses production without --yes-production, then rotates with it', async () => {
    const store = await seededStore(1000, 'LICENSES');
    const d = deps(keys, { ns: store });
    expect(await runReencrypt(['--namespace-id', 'ns', '--apply'], d)).toBe(2);
    expect(store.calls.putMany).toBe(0);
    expect(await runReencrypt(['--namespace-id', 'ns', '--apply', '--yes-production'], d)).toBe(0);
    expect(JSON.parse(d.stdout.at(-1) ?? '{}')).toMatchObject({ rotated: 3 });
  });

  it('exits 1 when a record opens with neither key', async () => {
    const store = (await seededStore()).seed('lic:foreign', licence(await encryptKeyEnc('X', OTHER_KEY)));
    const d = deps(keys, { ns: store });
    expect(await runReencrypt(['--namespace-id', 'ns', '--apply'], d)).toBe(1);
    expect(d.stderr.join()).toMatch(/neither key/u);
  });

  it('needs both keys and a namespace', async () => {
    expect(await runReencrypt([], deps(keys))).toBe(2);
    expect(await runReencrypt(['--namespace-id', 'ns'], deps({}))).toBe(2);
  });
});
