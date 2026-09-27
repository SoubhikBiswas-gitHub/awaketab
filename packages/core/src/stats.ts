export function dayKey(ms: number, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).format(new Date(ms));
}

export function computeStreaks(
  days: Record<string, number>,
  now = Date.now(),
  timeZone?: string,
): { currentStreakDays: number; longestStreakDays: number } {
  const keys = Object.keys(days)
    .filter((k) => (days[k] ?? 0) >= 1)
    .sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    if (prev && consecutive(prev, k)) run += 1;
    else run = 1;
    if (run > longest) longest = run;
    prev = k;
  }
  const today = dayKey(now, timeZone);
  const yday = dayKey(now - 86_400_000, timeZone);
  let current = 0;
  if ((days[today] ?? 0) >= 1) {
    current = 1;
    let cursor = today;
    for (;;) {
      const prevDay = shiftDay(cursor, -1);
      if ((days[prevDay] ?? 0) >= 1) {
        current += 1;
        cursor = prevDay;
      } else break;
    }
  } else if ((days[yday] ?? 0) >= 1) {
    current = 1;
    let cursor = yday;
    for (;;) {
      const prevDay = shiftDay(cursor, -1);
      if ((days[prevDay] ?? 0) >= 1) {
        current += 1;
        cursor = prevDay;
      } else break;
    }
  }
  return { currentStreakDays: current, longestStreakDays: Math.max(longest, current) };
}

function consecutive(a: string, b: string): boolean {
  return shiftDay(a, 1) === b;
}

function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

export function pruneDays(days: Record<string, number>, now = Date.now(), timeZone?: string): Record<string, number> {
  const cutoff = dayKey(now - 365 * 86_400_000, timeZone);
  const next: Record<string, number> = {};
  // localStorage is user-editable: anything but a number under a day key is dropped here.
  for (const [k, v] of Object.entries(days)) {
    if (k >= cutoff && typeof v === 'number') next[k] = v;
  }
  return next;
}

export function countDay(
  rec: Record<string, number> | undefined,
  now: number,
  timeZone?: string,
): Record<string, number> {
  const next = rec ?? {};
  const key = dayKey(now, timeZone);
  next[key] = (next[key] ?? 0) + 1;
  return next;
}

export function creditMinutes(
  stats: { days: Record<string, number>; totalMinutes: number },
  now: number,
  minutes: number,
  timeZone?: string,
) {
  if (minutes <= 0) return;
  const key = dayKey(now, timeZone);
  stats.days[key] = (stats.days[key] ?? 0) + minutes;
  stats.totalMinutes += minutes;
}

export function exportStatsCsv(
  stats: { days: Record<string, number>; daySessions?: Record<string, number> },
  ver = '0.0.0',
): string {
  const per = stats.daySessions ?? {};
  const rows = [...new Set([...Object.keys(stats.days), ...Object.keys(per)])]
    .sort()
    .map((date) => `${date},${String(stats.days[date] ?? 0)},${String(per[date] ?? '')}`);
  return `date,awake_minutes,sessions\n${rows.join('\n')}\n# exported ${dayKey(Date.now())} from AwakeTab v${ver}\n`;
}
