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
