const PREFIXES = ['embed.', 'tool.pill.', 'tool.advice.'] as const;
const EXACT = new Set([
  'tool.ring.stop',
  'tool.timer.until',
  'tool.when.tomorrow',
  'tool.when.day',
  'stats.minutes',
  'ambient.cook.timer.default',
  'ambient.cook.timer.done',
  'ambient.cook.timer.removeNamed',
  'ambient.cook.timer.notify',
  'ambient.cook.timer.invalid',
]);
// `tool.advice.retry` is the widget's Retry label after a denial (board EmbedEdge), so it stays in.
const SKIP = new Set(['tool.pill.idle.deferred', 'tool.advice.learn']);

export function isEmbedKey(key: string): boolean {
  if (SKIP.has(key)) return false;
  return EXACT.has(key) || PREFIXES.some((p) => key.startsWith(p));
}

export function embedCatalog(catalog: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(catalog).filter(([key]) => isEmbedKey(key)));
}
