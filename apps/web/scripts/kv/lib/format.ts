// KV backup file format (docs/14-devops.md §11): JSON Lines, one header line then one record per line.
//
//   {"format":"awaketab-kv-backup","version":1,"namespace":"LICENSES","namespaceId":"…","createdAt":"…","prefixes":[…],"count":2}
//   {"key":"lic:…","value":"{…}","expiration":1790000000}
//   {"key":"cus:…","value":"[…]","metadata":{…}}
//
// `value` is the raw KV string; `expiration` (absolute Unix seconds) and `metadata` are copied from the
// KV key listing so a restore writes the key back exactly as it was. The file is never stored in plain
// text: `crypto.ts` wraps it in AES-256-GCM before it leaves the machine or the CI runner.

export const BACKUP_FORMAT = 'awaketab-kv-backup';
export const BACKUP_VERSION = 1;

export const BACKUP_PREFIXES = ['lic:', 'cus:', 'embed:', 'ord:', 'lk:', 'grant:', 'sub:', 'rating:'] as const;

export interface IKvRecord {
  key: string;
  value: string;
  expiration?: number;
  metadata?: unknown;
}

export interface IBackupHeader {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  namespace: string;
  namespaceId: string;
  createdAt: string;
  prefixes: string[];
  count: number;
}

export interface IBackup {
  header: IBackupHeader;
  records: IKvRecord[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serializeBackup(backup: IBackup): string {
  const header: IBackupHeader = { ...backup.header, count: backup.records.length };
  const lines = [JSON.stringify(header)];
  for (const row of backup.records) {
    const out: IKvRecord = { key: row.key, value: row.value };
    if (row.expiration !== undefined) out.expiration = row.expiration;
    if (row.metadata !== undefined && row.metadata !== null) out.metadata = row.metadata;
    lines.push(JSON.stringify(out));
  }
  return `${lines.join('\n')}\n`;
}

function parseRecord(line: string, lineNo: number): IKvRecord {
  let row: unknown;
  try {
    row = JSON.parse(line);
  } catch {
    throw new Error(`Backup line ${String(lineNo)} is not valid JSON`);
  }
  if (!isObject(row) || typeof row.key !== 'string' || row.key === '' || typeof row.value !== 'string') {
    throw new Error(`Backup line ${String(lineNo)} is not a { key, value } record`);
  }
  const out: IKvRecord = { key: row.key, value: row.value };
  if (row.expiration !== undefined) {
    if (typeof row.expiration !== 'number' || !Number.isInteger(row.expiration) || row.expiration <= 0) {
      throw new Error(`Backup line ${String(lineNo)} has an invalid expiration`);
    }
    out.expiration = row.expiration;
  }
  if (row.metadata !== undefined) out.metadata = row.metadata;
  return out;
}

export function parseBackup(text: string): IBackup {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const first = lines[0];
  if (first === undefined) throw new Error('Backup is empty');
  let header: unknown;
  try {
    header = JSON.parse(first);
  } catch {
    throw new Error('Backup header is not valid JSON');
  }
  if (!isObject(header) || header.format !== BACKUP_FORMAT) throw new Error(`Not an ${BACKUP_FORMAT} file`);
  if (header.version !== BACKUP_VERSION) throw new Error(`Unsupported backup version ${String(header.version)}`);
  if (
    typeof header.namespace !== 'string' ||
    typeof header.namespaceId !== 'string' ||
    typeof header.createdAt !== 'string' ||
    !Array.isArray(header.prefixes) ||
    !header.prefixes.every((prefix) => typeof prefix === 'string') ||
    typeof header.count !== 'number'
  ) {
    throw new Error('Backup header is incomplete');
  }
  const records = lines.slice(1).map((line, index) => parseRecord(line, index + 2));
  if (records.length !== header.count) {
    throw new Error(`Backup is truncated: header says ${String(header.count)} records, found ${String(records.length)}`);
  }
  const seen = new Set<string>();
  for (const row of records) {
    if (seen.has(row.key)) throw new Error(`Backup lists ${row.key} twice`);
    seen.add(row.key);
  }
  return {
    header: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      namespace: header.namespace,
      namespaceId: header.namespaceId,
      createdAt: header.createdAt,
      prefixes: header.prefixes.map(String),
      count: header.count,
    },
    records,
  };
}

export function countByPrefix(records: IKvRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { key } of records) {
    const colon = key.indexOf(':');
    const family = colon > 0 ? key.slice(0, colon + 1) : '(other)';
    counts[family] = (counts[family] ?? 0) + 1;
  }
  return counts;
}

export function backupFileName(namespace: string, date: Date): string {
  return `${namespace}-${date.toISOString().slice(0, 10)}.jsonl.enc`;
}
