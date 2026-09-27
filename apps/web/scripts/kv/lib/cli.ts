// The three KV ops commands as testable functions. The entry files (../backup.ts, ../restore.ts,
// ../reencrypt.ts) only wire in the real environment, file system and Cloudflare client.
//
//   pnpm kv:backup    [--out <dir>]
//   pnpm kv:restore   <file> [--namespace-id <id>] [--prefix <p>]… [--apply] [--overwrite] [--yes-production]
//   pnpm kv:reencrypt --namespace-id <id> [--apply] [--yes-production]
//
// Exit codes: 0 ok · 1 the operation failed or left work to redo · 2 usage or configuration error.
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { exportNamespace, readBackupFile } from './backup.ts';
import { backupFileName, countByPrefix } from './format.ts';
import { reencryptNamespace } from './reencrypt.ts';
import { applyRestore, planRestore, summarizePlan } from './restore.ts';
import type { IKvStore } from './store.ts';

export interface ITargetStore extends IKvStore {
  title(): Promise<string>;
}

export interface ICliDeps {
  env: Record<string, string | undefined>;
  openStore: (namespaceId: string) => ITargetStore;
  readFile: (file: string) => Promise<Uint8Array>;
  writeFile: (file: string, bytes: Uint8Array) => Promise<void>;
  out: (line: string) => void;
  err: (line: string) => void;
  now?: () => Date;
}

export class UsageError extends Error {}

export function backupTargets(env: Record<string, string | undefined>): Array<{ namespace: string; namespaceId: string }> {
  const production = env.KV_LICENSES_ID?.trim();
  if (!production) throw new UsageError('KV_LICENSES_ID is not set (the id of the production LICENSES namespace)');
  const targets = [{ namespace: 'LICENSES', namespaceId: production }];
  const preview = env.KV_LICENSES_PREVIEW_ID?.trim();
  if (preview) targets.push({ namespace: 'LICENSES_PREVIEW', namespaceId: preview });
  return targets;
}

export function isProductionTarget(title: string, namespaceId: string, env: Record<string, string | undefined>): boolean {
  if (env.KV_LICENSES_ID && namespaceId === env.KV_LICENSES_ID.trim()) return true;
  return !/preview/iu.test(title);
}

function requireEnv(env: Record<string, string | undefined>, names: string[]): void {
  const missing = names.filter((name) => !env[name]?.trim());
  if (missing.length > 0) throw new UsageError(`Missing environment: ${missing.join(', ')}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function guarded(deps: ICliDeps, run: () => Promise<number>): Promise<number> {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.err(`error: ${message}`);
    return error instanceof UsageError ? 2 : 1;
  }
}

function usage<TResult>(parse: () => TResult): TResult {
  try {
    return parse();
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
}

// ---------------------------------------------------------------------------------------------------------

export function runBackup(argv: string[], deps: ICliDeps): Promise<number> {
  return guarded(deps, async () => {
    const { values } = usage(() =>
      parseArgs({ args: argv, options: { out: { type: 'string', default: 'kv-backups' } }, strict: true }),
    );
    requireEnv(deps.env, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'BACKUP_ENCRYPTION_KEY']);
    const targets = backupTargets(deps.env);
    const outDir = values.out;
    const now = deps.now?.() ?? new Date();
    for (const target of targets) {
      const store = deps.openStore(target.namespaceId);
      const { bytes } = await exportNamespace(store, {
        ...target,
        encryptionKey: deps.env.BACKUP_ENCRYPTION_KEY ?? '',
        now,
      });
      const file = path.join(outDir, backupFileName(target.namespace, now));
      await deps.writeFile(file, bytes);
      // Record counts stay inside the encrypted file: workflow logs of a public repository are public.
      deps.out(JSON.stringify({ namespace: target.namespace, file, bytes: bytes.byteLength, sha256: sha256(bytes) }));
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------------------------------------

export function runRestore(argv: string[], deps: ICliDeps): Promise<number> {
  return guarded(deps, async () => {
    const { values, positionals } = usage(() =>
      parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
          'namespace-id': { type: 'string' },
          prefix: { type: 'string', multiple: true },
          apply: { type: 'boolean', default: false },
          overwrite: { type: 'boolean', default: false },
          'yes-production': { type: 'boolean', default: false },
        },
      }),
    );
    const file = positionals[0];
    if (!file || positionals.length > 1) throw new UsageError('Usage: pnpm kv:restore <backup file> [--namespace-id <id>] [--apply]');
    const backup = await readBackupFile(await deps.readFile(file), deps.env.BACKUP_ENCRYPTION_KEY);
    const { header } = backup;
    deps.out(
      JSON.stringify({
        backup: { namespace: header.namespace, namespaceId: header.namespaceId, createdAt: header.createdAt, count: header.count },
        byPrefix: countByPrefix(backup.records),
      }),
    );

    const namespaceId = values['namespace-id'];
    const apply = values.apply;
    const overwrite = values.overwrite;
    if (!namespaceId) {
      if (apply) throw new UsageError('--apply needs --namespace-id <target namespace id>');
      deps.err('Backup decrypted and validated. Pass --namespace-id <id> to compare it with a namespace (dry run).');
      return 0;
    }
    requireEnv(deps.env, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']);
    const store = deps.openStore(namespaceId);
    const title = await store.title();
    const production = isProductionTarget(title, namespaceId, deps.env);
    if (apply && production && !values['yes-production']) {
      throw new UsageError(`Target "${title}" (${namespaceId}) is production. Re-run with --yes-production to write to it.`);
    }
    if (header.namespaceId !== namespaceId) {
      deps.err(`note: the backup is of ${header.namespace} (${header.namespaceId}); restoring into "${title}" (${namespaceId}).`);
    }

    const plan = await planRestore(backup.records, store, { prefixes: values.prefix ?? [] });
    const summary = summarizePlan(plan, overwrite);
    const conflicts = plan.conflict.slice(0, 20).map((row) => row.key);
    if (!apply) {
      deps.out(JSON.stringify({ dryRun: true, target: { title, namespaceId, production }, ...summary, conflicts }));
      deps.err(
        summary.willWrite > 0
          ? `Dry run: nothing written. Re-run with --apply${production ? ' --yes-production' : ''} to write ${String(summary.willWrite)} keys.`
          : 'Dry run: nothing to write.',
      );
      return 0;
    }
    const written = await applyRestore(plan, store, overwrite);
    deps.out(JSON.stringify({ dryRun: false, target: { title, namespaceId, production }, ...summary, written, conflicts }));
    if (plan.conflict.length > 0 && !overwrite) {
      deps.err(`${String(plan.conflict.length)} keys differ from the backup and were kept. Use --overwrite to replace them.`);
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------------------------------------

export function runReencrypt(argv: string[], deps: ICliDeps): Promise<number> {
  return guarded(deps, async () => {
    const { values, positionals } = usage(() =>
      parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
          'namespace-id': { type: 'string' },
          apply: { type: 'boolean', default: false },
          'yes-production': { type: 'boolean', default: false },
        },
      }),
    );
    const namespaceId = values['namespace-id'];
    if (!namespaceId || positionals.length > 0) throw new UsageError('Usage: pnpm kv:reencrypt --namespace-id <id> [--apply]');
    requireEnv(deps.env, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'OLD_LICENSE_KEY_ENC_KEY', 'NEW_LICENSE_KEY_ENC_KEY']);
    const apply = values.apply;
    const store = deps.openStore(namespaceId);
    const title = await store.title();
    const production = isProductionTarget(title, namespaceId, deps.env);
    if (apply && production && !values['yes-production']) {
      throw new UsageError(`Target "${title}" (${namespaceId}) is production. Re-run with --yes-production to write to it.`);
    }
    deps.err(`kv:reencrypt ${apply ? 'APPLY' : 'dry run'} on "${title}" (${namespaceId})`);
    const summary = await reencryptNamespace(store, {
      oldKey: deps.env.OLD_LICENSE_KEY_ENC_KEY ?? '',
      newKey: deps.env.NEW_LICENSE_KEY_ENC_KEY ?? '',
      apply,
      onProgress: (row) => {
        deps.err(
          `  scanned ${String(row.scanned)} · ${apply ? 'rotated' : 'to rotate'} ${String(row.rotated)} · already new ${String(row.alreadyNew)} · failed ${String(row.failed.length)} · changed ${String(row.changed.length)}`,
        );
      },
    });
    deps.out(JSON.stringify({ target: { title, namespaceId, production }, ...summary }));
    if (summary.failed.length > 0) deps.err(`${String(summary.failed.length)} records open with neither key; they were not written.`);
    if (summary.changed.length > 0) deps.err(`${String(summary.changed.length)} records changed during the run; run the command again.`);
    if (!apply && summary.rotated > 0) {
      deps.err(`Dry run: nothing written. Re-run with --apply${production ? ' --yes-production' : ''}.`);
    }
    return summary.failed.length > 0 || summary.changed.length > 0 ? 1 : 0;
  });
}
