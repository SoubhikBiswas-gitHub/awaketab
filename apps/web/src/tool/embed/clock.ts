/**
 * Widget digits, DESIGN.md §4 (the same rule on every surface): "MM:SS" under an hour, "H:MM:SS" from one hour,
 * "1d 02:15:00" from 24 hours. Tabular digits in CSS keep the width steady while it counts.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const tail = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  if (days > 0) return `${String(days)}d ${pad(h)}:${tail}`;
  return h > 0 ? `${String(h)}:${tail}` : tail;
}
