import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import support from '../../src/data/support-matrix.json';
import { parseDeviceMatrix, verifiedDates, type IDeviceMatrix } from '../../src/lib/device-matrix.js';
import { applyResults, checkIds } from '../../scripts/support-matrix.mts';

const file = path.resolve('docs/metrics/device-matrix.json');
const load = async () => JSON.parse(await readFile(file, 'utf8')) as unknown;

describe('docs/metrics/device-matrix.json (E12-T05/T06)', () => {
  it('is a valid pending example: 14 planned cases, no outcomes claimed', async () => {
    const m = parseDeviceMatrix(await load());
    expect(m.status).toBe('pending');
    expect(m.rows).toHaveLength(14);
    expect(m.rows.every((r) => r.verdict === 'pending' && r.observed === null && r.date === null)).toBe(true);
    expect(m.method.length).toBeGreaterThanOrEqual(3);
  });

  it('names only browsers and contexts that exist in src/data/support-matrix.json', async () => {
    expect(checkIds(parseDeviceMatrix(await load()), support)).toEqual([]);
  });
});

describe('parseDeviceMatrix', () => {
  const row = {
    id: 'win11-chrome',
    device: 'Laptop',
    os: 'Windows 11',
    browser: 'chrome',
    version: null,
    power: 'plugged',
    mode: 'standard',
    case: 'Native lock',
    expected: 'held',
    observed: null,
    evidence: null,
    date: null,
    verdict: 'pending',
  };
  const doc = (over: Record<string, unknown> = {}, rows: unknown[] = [row]) => ({
    version: 1,
    status: 'pending',
    updatedAt: null,
    method: ['m'],
    rows,
    ...over,
  });

  it.each([
    ['a wrong version', doc({ version: 2 })],
    ['an unknown status', doc({ status: 'done' })],
    ['no method', doc({ method: [] })],
    ['no rows', doc({}, [])],
    ['a duplicate id', doc({}, [row, row])],
    ['a bad verdict', doc({}, [{ ...row, verdict: 'ok' }])],
    ['a bad date', doc({}, [{ ...row, date: '26/09/2026' }])],
    ['a pending row with an outcome', doc({}, [{ ...row, observed: 'held 10 min' }])],
    [
      'a result without evidence',
      doc({}, [{ ...row, verdict: 'pass', date: '2026-10-01', version: '130', observed: 'held' }]),
    ],
    ['a complete matrix with pending rows', doc({ status: 'complete', updatedAt: '2026-10-01' })],
    [
      'a complete matrix without updatedAt',
      doc({ status: 'complete' }, [
        { ...row, verdict: 'pass', date: '2026-10-01', version: '130', observed: 'held', evidence: 'a.png' },
      ]),
    ],
  ])('rejects %s', (_label, data) => {
    expect(() => parseDeviceMatrix(data)).toThrow(/device-matrix\.json/u);
  });

  it('accepts a recorded run and reports the latest passing date per browser', () => {
    const done = { verdict: 'pass', version: '130', observed: 'held 10 min', evidence: 'win11-chrome.png' };
    const m = parseDeviceMatrix(
      doc({ status: 'complete', updatedAt: '2026-10-02' }, [
        { ...row, ...done, date: '2026-10-01' },
        { ...row, ...done, id: 'win11-chrome-2', date: '2026-10-02', verdict: 'partial' },
        { ...row, ...done, id: 'safari-1', browser: 'safari', verdict: 'fail', date: '2026-10-02' },
      ]),
    );
    expect(verifiedDates(m)).toEqual({ chrome: '2026-10-02' });
  });
});

describe('support-matrix update hook (scripts/support-matrix.mts)', () => {
  const base = JSON.parse(JSON.stringify(support)) as typeof support;

  it('writes nothing while the run is pending', async () => {
    expect(applyResults(parseDeviceMatrix(await load()), base)).toBeNull();
  });

  it('stamps lastUpdated and lastVerified from a complete run, leaving untested rows unclaimed', () => {
    const complete: IDeviceMatrix = {
      version: 1,
      status: 'complete',
      updatedAt: '2026-10-05',
      method: ['m'],
      rows: [
        {
          id: 'a',
          device: 'd',
          os: 'o',
          browser: 'firefox',
          version: '131',
          power: 'plugged',
          mode: 'standard',
          case: 'c',
          expected: 'e',
          observed: 'held',
          evidence: 'x.png',
          date: '2026-10-04',
          verdict: 'pass',
        },
      ],
    };
    const next = applyResults(complete, base);
    expect(next?.lastUpdated).toBe('2026-10-05');
    expect(next?.browsers.find((b) => b.id === 'firefox')).toMatchObject({ lastVerified: '2026-10-04' });
    expect(next?.browsers.find((b) => b.id === 'chrome')).not.toHaveProperty('lastVerified');
    const rows = complete.rows.map((r) => ({ ...r, browser: 'netscape' }));
    expect(checkIds({ ...complete, rows }, base)).toEqual(['a: unknown browser id "netscape"']);
  });
});
