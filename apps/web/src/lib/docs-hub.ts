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

// The /learn hub (Docs). Featured pages render only once they exist in the collection, in this order.
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
    icon: 'M14.5 6.5a4 4 0 0 0-5.2 5.1L4 16.9V20h3.1l5.3-5.3a4 4 0 0 0 5.1-5.2l-2.4 2.4-2.3-.6-.6-2.3z',
  },
  {
    href: '/vs',
    kind: 'vs',
    title: 'Compare tools',
    line: 'When an app, a command or another tab is the better pick, and why.',
    unit: ['comparison', 'comparisons'],
    icon: 'M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7',
  },
];

const ICONS: Record<string, string> = {
  'how-awaketab-works':
    'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  'honest-limits': 'M4 17a8 8 0 0 1 16 0M12 17l3.5-4.5M4 20h16',
  faq: 'M5 4.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5v-3.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM10 8.8a2 2 0 1 1 2.8 1.8c-.5.2-.8.6-.8 1.1v.3M12 14h.01',
  'browser-support-matrix':
    'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 9.5h16M4 14.5h16M10 4v16',
  'screen-wake-lock-api-guide': 'm9 7-5 5 5 5M15 7l5 5-5 5',
  'low-power-mode-and-wake-locks':
    'M4 7.5h13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM21 10.5v3M6 10.5v3',
  'does-a-wake-lock-keep-teams-green':
    'M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 20a6.5 6.5 0 0 1 11-4.7M18 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  'how-we-tested':
    'M9 3.5h6v3H9zM7.5 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1.5M9 13.5l2 2 4-4',
};

const ICON_PAGE = 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4';

export function docsIcon(slug: string): string {
  return ICONS[slug] ?? ICON_PAGE;
}

// Only the fields a reader sees on the page count toward reading time; ids, paths and enum values do not.
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
