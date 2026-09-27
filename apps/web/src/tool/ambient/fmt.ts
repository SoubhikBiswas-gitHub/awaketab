import cssHref from '../../styles/ambient.css?url';
import { t } from '../i18n.js';
import { el } from './tick.js';

// Display helpers for the ambient layer and the Document PiP window. Kept out of tick.ts, which the embed
// bundle (esbuild, docs/11) also imports.

const p2 = (n: number) => String(n).padStart(2, '0');

export function split(ms: number): [string, string] {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = p2(Math.floor((s % 3600) / 60));
  return [h ? `${String(h)}:${m}` : m, `:${p2(s % 60)}`];
}

export function short(ms: number): string {
  const [a, b] = split(ms);
  return a.replace(/^0(?=\d$)/u, '') + b;
}

export function digits(node: HTMLElement, ms: number): string {
  const [a, b] = split(ms);
  node.replaceChildren(a, el('span', {}, b));
  return a + b;
}

const lang = () => document.documentElement.lang || 'en';

export function hm(ms: number, h24: boolean | null = null): string {
  return new Intl.DateTimeFormat(lang(), {
    hour: 'numeric',
    minute: '2-digit',
    ...(h24 === null ? {} : { hour12: !h24 }),
    numberingSystem: 'latn',
  }).format(ms);
}

export function at(ms: number, now: number, h24: boolean | null): string {
  const r = Math.round(ms / 60_000) * 60_000;
  const time = hm(r, h24);
  return new Date(r).toDateString() === new Date(now).toDateString() ? time : t('ambient.tomorrow', { time });
}

export function dateLong(ms: number): string {
  const l = lang();
  const f = (o: Intl.DateTimeFormatOptions, loc = l) => new Intl.DateTimeFormat(loc, o).format(ms);
  return l === 'en'
    ? `${f({ weekday: 'long' })}, ${f({ day: 'numeric', month: 'long', year: 'numeric' }, 'en-GB')}`
    : f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

let css: Promise<unknown> | undefined;

export function ambientCss(): Promise<unknown> {
  return (css ??= new Promise((resolve) => {
    // Absolute, so the <link> pip-window.ts clones into the about:blank PiP document still resolves.
    const link = el('link', { rel: 'stylesheet', href: new URL(cssHref, location.href).href });
    link.onload = link.onerror = resolve;
    document.head.append(link);
  }));
}
