import type { TLocale } from '../i18n/locales';
import { contentIndex, pagePath, type TContentKind } from './content-i18n';

// Suggested lengths come from each page's front matter so the ring matches the page.
export const MENU_FOR = ['cooking', 'reading', 'presentations', 'dashboards', 'video-calls', 'downloads'] as const;

export const MENU_ON = ['iphone-safari', 'ipad', 'android-chrome', 'macos', 'windows-11', 'chromebook'] as const;

export const MENU_RES = [
  { id: 'guides', href: '/guides', icon: 'signpost' },
  { id: 'docs', href: '/learn', icon: 'article' },
  { id: 'compare', href: '/vs', icon: 'scales' },
  { id: 'changelog', href: '/changelog', icon: 'list-bullets' },
] as const;

// Real platform logos beside each device row (SVG Logos names); ChromeOS has none, so Chromebook shows Chrome.
export const DEVICE_BRAND: Record<string, string> = {
  'iphone-safari': 'apple',
  ipad: 'apple',
  'android-chrome': 'android-icon',
  macos: 'apple',
  'windows-11': 'microsoft-windows-icon',
  chromebook: 'chrome',
};

export const RES_SECTIONS: readonly string[] = ['guides', 'learn', 'vs', 'changelog'];

// Four-hour dial; "until I stop" fills the ring.
const DIAL: Record<string, number> = { p15: 6.25, p30: 12.5, p45: 18.75, p60: 25, p120: 50, p240: 100, pinf: 100 };

export interface IRing {
  p: number;
  x: number;
  y: number;
}

export function arc(p: number, radius: number, centre: number): IRing {
  const a = (p / 100) * 2 * Math.PI;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { p, x: round(centre + radius * Math.sin(a)), y: round(centre - radius * Math.cos(a)) };
}

export const ring = (preset: string): IRing => arc(DIAL[preset] ?? 100, 20, 22);

export interface IMenuLink {
  href: string;
  en: boolean;
}

export async function menuLink(kind: TContentKind, slug: string, locale: TLocale): Promise<IMenuLink> {
  const index = await contentIndex();
  const local = locale !== 'en' && index.some((p) => p.kind === kind && p.locale === locale && p.enSlug === slug);
  return local ? { href: pagePath(kind, slug, locale), en: false } : { href: `/${kind}/${slug}`, en: locale !== 'en' };
}
