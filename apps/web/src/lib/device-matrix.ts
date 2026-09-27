const DEVICE_VERDICTS = ['pending', 'pass', 'partial', 'fail'] as const;
export type TDeviceVerdict = (typeof DEVICE_VERDICTS)[number];
const DEVICE_POWER = ['plugged', 'battery', 'battery-saver'] as const;
type TDevicePower = (typeof DEVICE_POWER)[number];

interface IDeviceRow {
  id: string;
  device: string;
  os: string;
  browser: string;
  version: string | null;
  power: TDevicePower;
  mode: string;
  case: string;
  expected: string;
  observed: string | null;
  evidence: string | null;
  date: string | null;
  verdict: TDeviceVerdict;
}

export interface IDeviceMatrix {
  version: 1;
  status: 'pending' | 'complete';
  updatedAt: string | null;
  method: string[];
  rows: IDeviceRow[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function fail(message: string): never {
  throw new Error(`device-matrix.json: ${message}`);
}

function text(row: Record<string, unknown>, key: string, where: string, nullable = false): string | null {
  const value = row[key];
  if (value === null && nullable) return null;
  if (typeof value !== 'string' || !value.trim())
    fail(`${where}.${key} must be a non-empty string${nullable ? ' or null' : ''}`);
  return value.trim();
}

function date(value: unknown, where: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value)))
    fail(`${where} must be YYYY-MM-DD or null`);
  return value;
}

export function parseDeviceMatrix(data: unknown): IDeviceMatrix {
  if (!data || typeof data !== 'object') fail('not an object');
  const d = data as Record<string, unknown>;
  if (d.version !== 1) fail('version must be 1');
  if (d.status !== 'pending' && d.status !== 'complete') fail('status must be "pending" or "complete"');
  if (!Array.isArray(d.method) || d.method.length === 0) fail('method must be a non-empty array of strings');
  const method = d.method.map((m: unknown, i) => {
    if (typeof m !== 'string' || !m.trim()) fail(`method[${String(i)}] must be a non-empty string`);
    return m.trim();
  });
  if (!Array.isArray(d.rows) || d.rows.length === 0) fail('rows must be a non-empty array');
  const ids = new Set<string>();
  const rows = d.rows.map((raw: unknown, i): IDeviceRow => {
    const where = `rows[${String(i)}]`;
    if (!raw || typeof raw !== 'object') fail(`${where} is not an object`);
    const r = raw as Record<string, unknown>;
    const id = text(r, 'id', where) ?? '';
    if (!ID_RE.test(id) || ids.has(id)) fail(`${where}.id must be unique kebab-case`);
    ids.add(id);
    const verdict = r.verdict;
    if (typeof verdict !== 'string' || !(DEVICE_VERDICTS as readonly string[]).includes(verdict))
      fail(`${where}.verdict is invalid`);
    const power = r.power;
    if (typeof power !== 'string' || !(DEVICE_POWER as readonly string[]).includes(power))
      fail(`${where}.power is invalid`);
    const row: IDeviceRow = {
      id,
      device: text(r, 'device', where) ?? '',
      os: text(r, 'os', where) ?? '',
      browser: text(r, 'browser', where) ?? '',
      version: text(r, 'version', where, true),
      power: power as TDevicePower,
      mode: text(r, 'mode', where) ?? '',
      case: text(r, 'case', where) ?? '',
      expected: text(r, 'expected', where) ?? '',
      observed: text(r, 'observed', where, true),
      evidence: text(r, 'evidence', where, true),
      date: date(r.date, `${where}.date`),
      verdict: verdict as TDeviceVerdict,
    };
    // A recorded outcome needs its date, versions and evidence (E12-T05: "each cell has date, versions,
    // outcome, evidence note"); a pending row must not carry an outcome.
    if (row.verdict !== 'pending' && (!row.date || !row.version || !row.observed || !row.evidence)) {
      fail(`${where} has verdict "${row.verdict}" but lacks date, version, observed or evidence`);
    }
    if (row.verdict === 'pending' && row.observed !== null) fail(`${where} is pending but has an observed outcome`);
    return row;
  });
  const updatedAt = date(d.updatedAt, 'updatedAt');
  if (d.status === 'complete') {
    if (!updatedAt) fail('a complete matrix needs updatedAt');
    if (rows.some((r) => r.verdict === 'pending')) fail('a complete matrix cannot contain pending rows');
  }
  return { version: 1, status: d.status, updatedAt, method, rows };
}

export function verifiedDates(matrix: IDeviceMatrix): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of matrix.rows) {
    if ((row.verdict === 'pass' || row.verdict === 'partial') && row.date) {
      const prev = out[row.browser];
      if (!prev || row.date > prev) out[row.browser] = row.date;
    }
  }
  return out;
}
