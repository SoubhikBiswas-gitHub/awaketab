import { describe, expect, it } from 'vitest';

import { changelogDate, sortChangelog } from '../../src/lib/changelog';

const entry = (id: string, date: string, release?: string) => ({ id, data: { date: new Date(date), ...(release ? { release } : {}) } });

describe('changelog order (F-07)', () => {
  it('sorts by date, newest first, not by file name', () => {
    const sorted = sortChangelog([entry('2026-09-zz-old', '2026-09-09'), entry('2026-09-aa-new', '2026-09-26'), entry('2026-09-mid', '2026-09-12')]);
    expect(sorted.map((e) => e.id)).toEqual(['2026-09-aa-new', '2026-09-mid', '2026-09-zz-old']);
  });

  it('puts a release summary first on its day, then file names descending, whatever the input order', () => {
    const input = [
      entry('2026-09-m6-engagement', '2026-09-26'),
      entry('2026-09-1.0-launch', '2026-09-26', '1.0'),
      entry('2026-09-m8-embed-library', '2026-09-26'),
      entry('2026-09-foundation', '2026-09-09'),
    ];
    const want = ['2026-09-1.0-launch', '2026-09-m8-embed-library', '2026-09-m6-engagement', '2026-09-foundation'];
    expect(sortChangelog(input).map((e) => e.id)).toEqual(want);
    expect(sortChangelog([...input].reverse()).map((e) => e.id)).toEqual(want);
  });

  it('prints the front-matter date as written', () => {
    expect(changelogDate(new Date('2026-09-26'))).toBe('2026-09-26');
  });
});
