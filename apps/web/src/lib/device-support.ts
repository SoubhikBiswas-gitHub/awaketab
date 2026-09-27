import matrix from '../data/support-matrix.json';

export interface ISupportTag {
  label: string;
  native: boolean;
}

const BROWSER_ID: Record<string, string> = { 'samsung-internet': 'samsung' };
const PLATFORM: Record<string, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  chromeos: 'ChromeOS',
  android: 'Android',
  ios: 'iOS',
  ipados: 'iPadOS',
};
// Pages whose support rests on a matrix context rather than a browser row.
const CONTEXT: Record<string, string> = { 'ios-home-screen': 'ios-pwa' };

const version = (v: string | null): string => (v ? `${v}+` : '');

// Every tag comes from src/data/support-matrix.json: the page's browsers, kept only where the matrix lists them on
// one of the page's systems.
export function supportTags(slug: string, browsers: readonly string[], os: readonly string[]): ISupportTag[] {
  const contextId = CONTEXT[slug];
  if (contextId) {
    const context = matrix.contexts.find((c) => c.id === contextId);
    return context
      ? [{ label: `${context.name} ${version(context.minimumVersion)}`.trim(), native: context.mechanism === 'native' }]
      : [];
  }
  const platforms = new Set(os.map((o) => PLATFORM[o]).filter(Boolean));
  const tags: ISupportTag[] = [];
  for (const id of browsers) {
    const row = matrix.browsers.find((b) => b.id === (BROWSER_ID[id] ?? id));
    if (!row) continue;
    if (platforms.size > 0 && !row.platforms.some((p) => platforms.has(p))) continue;
    tags.push({ label: `${row.name} ${version(row.minimumVersion)}`.trim(), native: row.mechanism === 'native' });
  }
  return tags;
}
