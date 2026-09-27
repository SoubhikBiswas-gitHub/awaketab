import type { TLocale } from '../i18n/locales';
import { contentIndex, pagePath, type TContentKind } from './content-i18n';

// The header menus (docs/05 §3.25): what each one lists. Labels and hints are i18n keys under header.menu.*;
// the suggested length of a use case comes from its page's front matter, so the ring never disagrees with the page.
export const MENU_FOR = ['cooking', 'reading', 'presentations', 'dashboards', 'video-calls', 'downloads'] as const;

export const MENU_ON = ['iphone-safari', 'ipad', 'android-chrome', 'macos', 'windows-11', 'chromebook'] as const;

export const MENU_RES = [
  { id: 'guides', href: '/guides', icon: 'M12 20.5v-17M12 5.5h5.5l2 2-2 2H12M12 11.5H6.5l-2 2 2 2H12' },
  {
    id: 'docs',
    href: '/learn',
    icon: 'M7 3.5h6.5l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM13.5 3.5v4h4M8.5 12.5h7M8.5 16h4.5',
  },
  {
    id: 'compare',
    href: '/vs',
    icon: 'M12 4v16M8 20h8M5 7.5h14M5 7.5l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7.5l-2.5 6a2.5 2.5 0 0 0 5 0z',
  },
  { id: 'changelog', href: '/changelog', icon: 'M4.5 7h2M4.5 12h2M4.5 17h2M9.5 7h10M9.5 12h10M9.5 17h6' },
] as const;

// Sections whose pages open under Resources, for the trigger's current-section mark.
export const RES_SECTIONS: readonly string[] = ['guides', 'learn', 'vs', 'changelog'];

// Suggested lengths on a four-hour dial, the longest preset; "until I stop" fills the ring.
const DIAL: Record<string, number> = { p15: 6.25, p30: 12.5, p45: 18.75, p60: 25, p120: 50, p240: 100, pinf: 100 };

export interface IRing {
  p: number;
  x: number;
  y: number;
}

// An arc of p % drawn clockwise from 12 o'clock, and where its bead sits.
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

// The page in the reader's language when it exists, else the English page (hreflang="en" and the "(English)" hint).
export async function menuLink(kind: TContentKind, slug: string, locale: TLocale): Promise<IMenuLink> {
  const index = await contentIndex();
  const local = locale !== 'en' && index.some((p) => p.kind === kind && p.locale === locale && p.enSlug === slug);
  return local ? { href: pagePath(kind, slug, locale), en: false } : { href: `/${kind}/${slug}`, en: locale !== 'en' };
}
