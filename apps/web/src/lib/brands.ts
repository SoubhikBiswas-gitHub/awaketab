// SVG Logos names for the browsers and systems the site names. Apple systems use the Apple mark because the
// macOS and iOS entries are wordmarks that repeat the visible text; Samsung Internet has no logo in the set.
export type TBrand =
  | 'chrome'
  | 'microsoft-edge'
  | 'firefox'
  | 'safari'
  | 'opera'
  | 'apple'
  | 'android-icon'
  | 'microsoft-windows-icon'
  | 'linux-tux';

export interface IBrandMark {
  logo: TBrand | null;
  name: string;
}

const BROWSER: Record<string, IBrandMark> = {
  chrome: { logo: 'chrome', name: 'Chrome' },
  edge: { logo: 'microsoft-edge', name: 'Edge' },
  firefox: { logo: 'firefox', name: 'Firefox' },
  safari: { logo: 'safari', name: 'Safari' },
  opera: { logo: 'opera', name: 'Opera' },
  samsung: { logo: null, name: 'Samsung Internet' },
  'samsung-internet': { logo: null, name: 'Samsung Internet' },
  'ios-pwa': { logo: 'apple', name: 'iOS Home Screen app' },
};

const SYSTEM: Record<string, IBrandMark> = {
  ios: { logo: 'apple', name: 'iOS' },
  ipados: { logo: 'apple', name: 'iPadOS' },
  macos: { logo: 'apple', name: 'macOS' },
  android: { logo: 'android-icon', name: 'Android' },
  windows: { logo: 'microsoft-windows-icon', name: 'Windows' },
  linux: { logo: 'linux-tux', name: 'Linux' },
  // ChromeOS has no logo of its own in the set; Chrome is the browser it runs.
  chromeos: { logo: 'chrome', name: 'ChromeOS' },
};

export const browserMark = (id: string): IBrandMark | undefined => BROWSER[id];
export const systemMark = (id: string): IBrandMark | undefined => SYSTEM[id];

// Longer names come first, so "ChromeOS" is matched before "Chrome".
const WORDS: Array<[RegExp, TBrand | null]> = [
  [/\bSamsung Internet\b/u, null],
  [/\b(?:ChromeOS|Chromebook)\b/u, 'chrome'],
  [/\bChrome\b/u, 'chrome'],
  [/\bEdge\b/u, 'microsoft-edge'],
  [/\bFirefox\b/u, 'firefox'],
  [/\bSafari\b/u, 'safari'],
  [/\bOpera\b/u, 'opera'],
  [/\b(?:iPhone|iPad|iPadOS|iOS|macOS|Mac)\b/u, 'apple'],
  [/\bAndroid\b/u, 'android-icon'],
  [/\bWindows\b/u, 'microsoft-windows-icon'],
  [/\bLinux\b/u, 'linux-tux'],
];

// Logos for the brands a short label names, in reading order, each once; `null` stands for Samsung Internet.
export function brandsIn(text: string): Array<TBrand | null> {
  const found: Array<[number, TBrand | null]> = [];
  let rest = text;
  for (const [re, logo] of WORDS) {
    const m = re.exec(rest);
    if (!m) continue;
    rest = rest.slice(0, m.index) + ' '.repeat(m[0].length) + rest.slice(m.index + m[0].length);
    if (!found.some(([, l]) => l === logo)) found.push([m.index, logo]);
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, logo]) => logo);
}

const LEADS =
  /^(?:Samsung Internet|ChromeOS|Chromebook|Chrome|Edge|Firefox|Safari|Opera|iPhone|iPad|iPadOS|iOS|macOS|Mac|Android|Windows|Linux)\b/u;

// A row header that starts with a brand shows its logo: every brand in a short name ("iPhone and Android"),
// only the first in a longer line ("Edge 84 or later on Windows").
export function rowBrands(text: string): Array<TBrand | null> {
  const plain = text.replace(/<[^>]+>/gu, '').trim();
  if (!LEADS.test(plain)) return [];
  const found = brandsIn(plain);
  return plain.split(/\s+/u).length <= 4 ? found : found.slice(0, 1);
}
