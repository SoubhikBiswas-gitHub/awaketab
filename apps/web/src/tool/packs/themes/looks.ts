import type { ISettings, TPalette, TPattern } from '@awaketab/core';
import uiHref from './themes-ui.css?url';

declare const __AT_THEMES__: string;

export type TLookKind = 'palette' | 'accent' | 'pattern';

export interface ILook {
  palette: TPalette;
  accent: string;
  pattern: TPattern;
}

// [id, free]. Clear Night is tokens.css; the others re-map the same --at-* tokens in public/assets/themes.css.
export const PALETTES: ReadonlyArray<readonly [TPalette, boolean]> = [
  ['clear-night', true],
  ['paper', true],
  ['nord', true],
  ['solarized', false],
  ['midnight', false],
  ['forest', false],
  ['sunset', false],
  ['mono', false],
  ['contrast', false],
];

// [id, stored light-theme hex, free]. The first four live in tokens.css, the rest in themes.css; boot.js mirrors it.
export const LAMPS: ReadonlyArray<readonly [string, string, boolean]> = [
  ['aqua', '#087B87', true],
  ['violet', '#5A47CF', true],
  ['amber', '#A34F00', true],
  ['teal', '#0A7565', true],
  ['mint', '#167A50', false],
  ['sky', '#255FBD', false],
  ['ice', '#2A6A8A', false],
  ['lavender', '#7446B0', false],
  ['rose', '#B0366A', false],
  ['coral', '#B1452F', false],
  ['gold', '#7F6400', false],
  ['lime', '#4D7300', false],
];

// The old palette hexes (amber, indigo, teal, rose) keep pointing at the lamps that replaced them (docs/08 §2.1).
export const LEGACY_LAMPS: Readonly<Record<string, string>> = {
  '#B86E00': '#087B87',
  '#4F46E5': '#5A47CF',
  '#0F766E': '#167A50',
  '#BE123C': '#255FBD',
};

export const PATTERNS: ReadonlyArray<readonly [TPattern, boolean]> = [
  ['none', true],
  ['grain', true],
  ['dots', true],
  ['grid', true],
  ['topo', false],
  ['waves', false],
  ['aurora', false],
  ['stars', false],
  ['drift', false],
];

// One-tap combinations: [id, palette, lamp id, pattern]. Free when every part is free.
export const PRESETS: ReadonlyArray<readonly [string, TPalette, string, TPattern]> = [
  ['classic', 'clear-night', 'aqua', 'none'],
  ['library', 'paper', 'teal', 'grid'],
  ['fjord', 'nord', 'amber', 'grain'],
  ['night-desk', 'midnight', 'amber', 'stars'],
  ['kitchen', 'paper', 'coral', 'dots'],
  ['focus', 'nord', 'ice', 'grain'],
  ['campfire', 'sunset', 'gold', 'drift'],
  ['northern-lights', 'midnight', 'mint', 'aurora'],
];

const DEFAULT_LAMP = '#087B87';
export const CUSTOM = 'custom';
const HEX = /^#[0-9A-F]{6}$/u;

export function lampHex(id: string): string {
  return LAMPS.find((l) => l[0] === id)?.[1] ?? DEFAULT_LAMP;
}

// Stored hex → lamp id: a lamp, a legacy hex's replacement, any other valid hex is a custom lamp, else Aqua.
export function lampOf(stored: string): { id: string; hex: string } {
  const up = stored.toUpperCase();
  const hex = LEGACY_LAMPS[up] ?? up;
  const lamp = LAMPS.find((l) => l[1] === hex);
  if (lamp) return { id: lamp[0], hex };
  return HEX.test(hex) ? { id: CUSTOM, hex } : { id: 'aqua', hex: DEFAULT_LAMP };
}

export function isFree(kind: TLookKind, id: string): boolean {
  const table = kind === 'palette' ? PALETTES : kind === 'pattern' ? PATTERNS : LAMPS.map((l) => [l[0], l[2]] as const);
  return !!table.find((r) => r[0] === id)?.[1];
}

export function lookFree(look: ILook): boolean {
  return isFree('palette', look.palette) && isFree('accent', lampOf(look.accent).id) && isFree('pattern', look.pattern);
}

// Nested new fields are read defensively: an old or hand-edited record falls back to the defaults.
export function lookOf(s: Partial<ISettings>): ILook {
  const palette = PALETTES.some((p) => p[0] === s.palette) ? (s.palette as TPalette) : 'clear-night';
  const pattern = PATTERNS.some((p) => p[0] === s.pattern) ? (s.pattern as TPattern) : 'none';
  return { palette, accent: lampOf(typeof s.accent === 'string' ? s.accent : DEFAULT_LAMP).hex, pattern };
}

// What a visitor without Pro may keep: every Pro part falls back to its default (a lapsed licence, docs/05 §1).
export function ownedLook(s: Partial<ISettings>, packs: boolean): ILook {
  const look = lookOf(s);
  if (packs) return look;
  return {
    palette: isFree('palette', look.palette) ? look.palette : 'clear-night',
    accent: isFree('accent', lampOf(look.accent).id) ? look.accent : DEFAULT_LAMP,
    pattern: isFree('pattern', look.pattern) ? look.pattern : 'none',
  };
}

export function presetLook(id: string): ILook | null {
  const p = PRESETS.find((r) => r[0] === id);
  return p ? { palette: p[1], accent: lampHex(p[2]), pattern: p[3] } : null;
}

export function sameLook(a: ILook, b: ILook): boolean {
  return a.palette === b.palette && a.accent === b.accent && a.pattern === b.pattern;
}

const sheets = new Map<string, Promise<void>>();

function linkCss(href: string, mark?: string): Promise<void> {
  let ready = sheets.get(href);
  if (!ready) {
    ready = new Promise((resolve) => {
      if (mark && document.querySelector(`link[${mark}]`)) {
        resolve();
        return;
      }
      // Absolute, so the <link> pip-window.ts clones into the about:blank PiP document still resolves.
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: new URL(href, location.href).href,
      });
      if (mark) link.setAttribute(mark, '');
      link.onload = link.onerror = () => {
        resolve();
      };
      document.head.append(link);
    });
    sheets.set(href, ready);
  }
  return ready;
}

// The colour themes, lamps and patterns: the same sheet boot.js links before first paint when a stored look needs it.
export const themesCss = (): Promise<void> => linkCss(__AT_THEMES__, 'data-at-themes');

// The pack's own UI (Appearance gallery, preview chip, colour picker); never part of the inlined tool CSS.
export const uiCss = (): Promise<void> => linkCss(uiHref);

export function paintLook(look: ILook, el: HTMLElement = document.documentElement): void {
  const d = el.dataset;
  const { id, hex } = lampOf(look.accent);
  if (look.palette === 'clear-night') delete d.palette;
  else d.palette = look.palette;
  if (look.pattern === 'none') delete d.pattern;
  else d.pattern = look.pattern;
  if (id === 'aqua') delete d.accent;
  else d.accent = id;
  if (id === CUSTOM) el.style.setProperty('--at-custom', hex);
  else el.style.removeProperty('--at-custom');
}
