const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const tail = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  if (days > 0) return `${String(days)}d ${pad(h)}:${tail}`;
  return h > 0 ? `${String(h)}:${tail}` : tail;
}
