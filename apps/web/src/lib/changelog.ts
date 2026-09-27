export interface IChangelogSortable {
  id: string;
  data: { date: Date; release?: string | undefined };
}

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

export function changelogDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type TChangelogType = 'new' | 'fixed' | 'changed';

export function changelogLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export interface IReleaseParts {
  lede: string;
  parts: Array<{ head: string; body: string }>;
  rest: string[];
}

const upperFirst = (text: string) => text.replace(/^./u, (c) => c.toUpperCase());

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

export function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/gu, '<a href="$2">$1</a>');
}

export function groupByDate<T extends { date: string }>(entries: readonly T[]): Array<{ date: string; items: T[] }> {
  const groups: Array<{ date: string; items: T[] }> = [];
  for (const entry of entries) {
    const last = groups.at(-1);
    if (last?.date === entry.date) last.items.push(entry);
    else groups.push({ date: entry.date, items: [entry] });
  }
  return groups;
}
