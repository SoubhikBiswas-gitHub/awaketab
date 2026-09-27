/** The fields of a `changelog` collection entry that decide its place on `/changelog` (F-07). */
export interface IChangelogSortable {
  id: string;
  data: { date: Date; release?: string | undefined };
}

/**
 * Newest `date` first. On the same day a release summary (`release` set) comes before the individual fragments,
 * then file names descending. The order never depends on the file system or on build time.
 */
export function compareChangelog(a: IChangelogSortable, b: IChangelogSortable): number {
  const byDate = b.data.date.getTime() - a.data.date.getTime();
  if (byDate !== 0) return byDate;
  const byRelease = Number(b.data.release !== undefined) - Number(a.data.release !== undefined);
  if (byRelease !== 0) return byRelease;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

export function sortChangelog<T extends IChangelogSortable>(entries: readonly T[]): T[] {
  return [...entries].sort(compareChangelog);
}

/** `2026-09-26` — the date as written in front matter (YAML dates are UTC midnight). */
export function changelogDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type TChangelogType = 'new' | 'fixed' | 'changed';

/** `26 September 2026`: the date headings and the release date on /changelog (DESIGN.md §4, full month name). */
export function changelogLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export interface IReleaseParts {
  /** The first paragraph, shown as the release's lede. */
  lede: string;
  /** Every later paragraph written as `Heading: text`, shown as the release's labelled grid. */
  parts: Array<{ head: string; body: string }>;
  /** Later paragraphs without a `Heading:` label, shown after the grid. */
  rest: string[];
}

const upperFirst = (text: string) => text.replace(/^./u, (c) => c.toUpperCase());

/** Splits a release fragment's Markdown body into its lede and its `Heading: text` paragraphs (the 1.0 card). */
export function releaseParts(body: string): IReleaseParts {
  const paragraphs = body
    .split(/\n\s*\n/u)
    .map((p) => p.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  const [lede = '', ...others] = paragraphs;
  const parts: IReleaseParts['parts'] = [];
  const rest: string[] = [];
  for (const p of others) {
    const m = /^([^:.`[\]]{2,40}):\s+(.+)$/u.exec(p);
    if (m?.[1] && m[2]) parts.push({ head: upperFirst(m[1]), body: upperFirst(m[2]) });
    else rest.push(p);
  }
  return { lede, parts, rest };
}

const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Inline Markdown for the release card's paragraphs: escapes HTML, then `code` and [label](href) only. */
export function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/gu, '<a href="$2">$1</a>');
}

/** Consecutive entries that share a date, in order (the entries are already sorted by `sortChangelog`). */
export function groupByDate<T extends { date: string }>(entries: readonly T[]): Array<{ date: string; items: T[] }> {
  const groups: Array<{ date: string; items: T[] }> = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last?.date === entry.date) last.items.push(entry);
    else groups.push({ date: entry.date, items: [entry] });
  }
  return groups;
}
