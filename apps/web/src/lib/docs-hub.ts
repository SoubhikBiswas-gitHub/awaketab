export interface IDocsGroup {
  id: string;
  title: string;
  line: string;
  slugs: readonly string[];
}

export interface IDocsTile {
  href: string;
  kind: 'guides' | 'vs';
  title: string;
  line: string;
  unit: readonly [string, string];
  icon: string;
}

// Featured pages render only once they exist, in this order.
export const DOCS_FEATURED: readonly string[] = ['how-awaketab-works', 'honest-limits', 'faq'];

export const DOCS_GROUPS: readonly IDocsGroup[] = [
  {
    id: 'reference',
    title: 'Reference',
    line: 'Which browsers hold the screen, and the API underneath.',
    slugs: ['browser-support-matrix', 'screen-wake-lock-api-guide'],
  },
  {
    id: 'behaviour',
    title: 'Behaviour',
    line: 'What a battery saver or a chat app does to a screen kept awake.',
    slugs: ['low-power-mode-and-wake-locks', 'does-a-wake-lock-keep-teams-green'],
  },
  {
    id: 'trust',
    title: 'Trust',
    line: 'Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded.',
    slugs: ['how-we-tested'],
  },
];

export const DOCS_MORE: Omit<IDocsGroup, 'slugs'> = {
  id: 'more',
  title: 'More',
  line: 'Other articles about wake locks.',
};

export const DOCS_TILES: readonly IDocsTile[] = [
  {
    href: '/guides',
    kind: 'guides',
    title: 'Fix a problem',
    line: 'Step-by-step fixes for timeouts, greyed-out settings and screens that go dark.',
    unit: ['guide', 'guides'],
    icon: 'wrench',
  },
  {
    href: '/vs',
    kind: 'vs',
    title: 'Compare tools',
    line: 'When an app, a command or another tab is the better pick, and why.',
    unit: ['comparison', 'comparisons'],
    icon: 'scales',
  },
];

// Phosphor duotone names, one per article.
const ICONS: Record<string, string> = {
  'how-awaketab-works': 'lightbulb',
  'honest-limits': 'gauge',
  faq: 'question',
  'browser-support-matrix': 'table',
  'screen-wake-lock-api-guide': 'code',
  'low-power-mode-and-wake-locks': 'battery-low',
  'does-a-wake-lock-keep-teams-green': 'user-check',
  'how-we-tested': 'clipboard-text',
};

export function docsIcon(slug: string): string {
  return ICONS[slug] ?? 'file-text';
}

const READ_KEYS = [
  'lead',
  'steps',
  'stepsDone',
  'pills',
  'checklist',
  'matrix',
  'rows',
  'compare',
  'picks',
  'notes',
  'lifecycle',
  'toolNote',
  'faq',
  'honestLimit',
] as const;
const SKIP_KEYS = new Set([
  'src',
  'shotSrc',
  'href',
  'state',
  'result',
  'frame',
  'width',
  'height',
  'shotWidth',
  'shotHeight',
  'us',
  'same',
]);
const WORDS_PER_MINUTE = 220;

function countWords(value: unknown): number {
  if (typeof value === 'string') return value.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countWords(item), 0);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce<number>(
      (sum, [key, item]) => (SKIP_KEYS.has(key) ? sum : sum + countWords(item)),
      0,
    );
  }
  return 0;
}

export function readingMinutes(body: string | undefined, data: Readonly<Record<string, unknown>>): number | null {
  const prose = (body ?? '').replace(/^::.*$/gmu, ' ');
  const words = countWords(prose) + READ_KEYS.reduce((sum, key) => sum + countWords(data[key]), 0);
  if (words === 0) return null;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
