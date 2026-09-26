// Support-matrix update hook (E12-T06): docs/metrics/device-matrix.json → src/data/support-matrix.json.
//
//   pnpm -F web matrix:check   validates the device matrix and that every row names a support-matrix id (build step)
//   pnpm -F web matrix:sync    additionally writes the results: `lastUpdated` = the matrix's `updatedAt`, and a
//                              `lastVerified` date on every browser/context row with a passing (or partial) case
//
// While the matrix is `pending` the sync writes nothing: an untested combination is never claimed (docs/19 B7).
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDeviceMatrix, verifiedDates, type IDeviceMatrix } from '../src/lib/device-matrix.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEVICE_MATRIX = path.resolve(ROOT, '../../docs/metrics/device-matrix.json');
export const SUPPORT_MATRIX = path.join(ROOT, 'src/data/support-matrix.json');

interface ISupportRow {
  id: string;
  lastVerified?: string;
  [key: string]: unknown;
}

interface ISupportMatrix {
  lastUpdated: string;
  browsers: ISupportRow[];
  contexts: ISupportRow[];
  [key: string]: unknown;
}

export function checkIds(device: IDeviceMatrix, support: ISupportMatrix): string[] {
  const known = new Set([...support.browsers, ...support.contexts].map((r) => r.id));
  return device.rows.filter((r) => !known.has(r.browser)).map((r) => `${r.id}: unknown browser id "${r.browser}"`);
}

/** Returns the updated support matrix, or null when there is nothing to write (pending run). */
export function applyResults(device: IDeviceMatrix, support: ISupportMatrix): ISupportMatrix | null {
  if (device.status !== 'complete' || !device.updatedAt) return null;
  const dates = verifiedDates(device);
  const stamp = (row: ISupportRow): ISupportRow => {
    const date = dates[row.id];
    return date ? { ...row, lastVerified: date } : row;
  };
  return {
    ...support,
    lastUpdated: device.updatedAt,
    browsers: support.browsers.map(stamp),
    contexts: support.contexts.map(stamp),
  };
}

async function main(write: boolean): Promise<void> {
  const device = parseDeviceMatrix(JSON.parse(await readFile(DEVICE_MATRIX, 'utf8')));
  const support = JSON.parse(await readFile(SUPPORT_MATRIX, 'utf8')) as ISupportMatrix;
  const problems = checkIds(device, support);
  if (problems.length > 0) throw new Error(`support-matrix: ${problems.join('; ')}`);
  const next = write ? applyResults(device, support) : null;
  if (next) await writeFile(SUPPORT_MATRIX, `${JSON.stringify(next, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ supportMatrix: { status: device.status, rows: device.rows.length, written: next !== null } })}\n`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main(process.argv.includes('--write'));
}
