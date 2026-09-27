// Export one KV namespace to an encrypted backup and prove the result decrypts back to the same records.
import { decryptBackup, encryptBackup, isEncryptedBackup } from './crypto.ts';
import { BACKUP_FORMAT, BACKUP_PREFIXES, BACKUP_VERSION, parseBackup, serializeBackup, type IBackup } from './format.ts';
import { readAll, type IKvStore } from './store.ts';

export interface IExportOptions {
  namespace: string;
  namespaceId: string;
  encryptionKey: string;
  now?: Date;
  prefixes?: readonly string[];
  onProgress?: (read: number) => void;
}

export interface IExportResult {
  bytes: Uint8Array;
  backup: IBackup;
}

export async function exportNamespace(store: IKvStore, options: IExportOptions): Promise<IExportResult> {
  const prefixes = [...(options.prefixes ?? BACKUP_PREFIXES)];
  const records = await readAll(store, prefixes, options.onProgress);
  const backup: IBackup = {
    header: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      namespace: options.namespace,
      namespaceId: options.namespaceId,
      createdAt: (options.now ?? new Date()).toISOString(),
      prefixes,
      count: records.length,
    },
    records,
  };
  const plain = serializeBackup(backup);
  const bytes = await encryptBackup(plain, options.encryptionKey);
  // Round-trip before anything is uploaded: a backup that cannot be read back is a failed backup.
  const check = parseBackup(await decryptBackup(bytes, options.encryptionKey));
  if (check.records.length !== records.length || serializeBackup(check) !== plain) {
    throw new Error(`Backup of ${options.namespace} did not verify after encryption`);
  }
  return { bytes, backup };
}

export async function readBackupFile(bytes: Uint8Array, encryptionKey: string | undefined): Promise<IBackup> {
  if (isEncryptedBackup(bytes)) {
    if (!encryptionKey) throw new Error('This backup is encrypted: set BACKUP_ENCRYPTION_KEY');
    return parseBackup(await decryptBackup(bytes, encryptionKey));
  }
  return parseBackup(new TextDecoder().decode(bytes));
}
