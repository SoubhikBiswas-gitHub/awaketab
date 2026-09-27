import { describe, expect, it } from 'vitest';

import {
  changelogDate,
  changelogLongDate,
  groupByDate,
  inlineMarkdown,
  releaseParts,
  sortChangelog,
} from '../../src/lib/changelog';

const entry = (id: string, date: string, release?: string) => ({
  id,
  data: { date: new Date(date), ...(release ? { release } : {}) },
});

describe('changelog order (F-07)', () => {
  it('sorts by date, newest first, not by file name', () => {
    const sorted = sortChangelog([
      entry('2026-09-zz-old', '2026-09-09'),
      entry('2026-09-aa-new', '2026-09-26'),
      entry('2026-09-mid', '2026-09-12'),
    ]);
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

describe('/changelog layout helpers (B6)', () => {
  it('writes the long date with the full month name, in any time zone', () => {
    expect(changelogLongDate('2026-09-26')).toBe('26 September 2026');
    expect(changelogLongDate('2026-01-01')).toBe('1 January 2026');
  });

  it('splits a release body into its lede and its labelled paragraphs', () => {
    const body =
      'AwakeTab 1.0 keeps your screen on.\n\nOn the awake screen: press M for Clock.\n\nBeyond the tab: the extension.\nIt wraps.\n\nA closing line without a label.';
    expect(releaseParts(body)).toEqual({
      lede: 'AwakeTab 1.0 keeps your screen on.',
      parts: [
        { head: 'On the awake screen', body: 'Press M for Clock.' },
        { head: 'Beyond the tab', body: 'The extension. It wraps.' },
      ],
      rest: ['A closing line without a label.'],
    });
  });

  it('renders inline code and links in release paragraphs, and escapes everything else', () => {
    expect(inlineMarkdown('Press `M` or see [/embed](/embed) & <b>')).toBe(
      'Press <code>M</code> or see <a href="/embed">/embed</a> &amp; &lt;b&gt;',
    );
  });

  it('groups consecutive entries by date, keeping their order', () => {
    const groups = groupByDate([
      { id: 'a', date: '2026-09-26' },
      { id: 'b', date: '2026-09-26' },
      { id: 'c', date: '2026-09-12' },
    ]);
    expect(groups.map((g) => [g.date, g.items.map((i) => i.id)])).toEqual([
      ['2026-09-26', ['a', 'b']],
      ['2026-09-12', ['c']],
    ]);
  });
});
