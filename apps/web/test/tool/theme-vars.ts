import { readFileSync } from 'node:fs';
import path from 'node:path';
import { formatHex, interpolate } from 'culori';

// Reads the colour tokens straight from the stylesheets, so the contrast tests check what the browser paints.

const WEB = path.join(import.meta.dirname, '../..');
export const TOKENS = readFileSync(path.join(WEB, 'src/styles/tokens.css'), 'utf8');
export const THEMES = readFileSync(path.join(WEB, 'public/assets/themes.css'), 'utf8');

export type TVars = Record<string, string>;

export function block(css: string, selector: string): TVars {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const sel = (m[1] ?? '').replace(/\s+/gu, ' ').trim();
    if (sel !== selector) continue;
    const vars: TVars = {};
    for (const d of (m[2] ?? '').matchAll(/(--at-[\w-]+)\s*:\s*([^;]+);/gu))
      vars[d[1] as string] = (d[2] as string).trim();
    return vars;
  }
  throw new Error(`no rule for ${selector}`);
}

export const DARK = '[data-theme="dark"], [data-theme="oled"]';
export const VARIANTS = ['light', 'dark', 'oled'] as const;
export type TVariant = (typeof VARIANTS)[number];

export function paletteVars(id: string, v: TVariant): TVars {
  const base = {
    light: block(TOKENS, ':root, [data-theme="light"]'),
    dark: block(TOKENS, '[data-theme="dark"]'),
    oled: block(TOKENS, '[data-theme="oled"]'),
  }[v];
  if (id === 'clear-night') return base;
  const own =
    v === 'light'
      ? block(THEMES, `[data-palette="${id}"][data-theme="light"]`)
      : block(THEMES, `[data-palette="${id}"]:is(${DARK})`);
  const oled = v === 'oled' ? block(THEMES, '[data-palette][data-theme="oled"]') : {};
  return { ...base, ...own, ...oled };
}

export function lampVars(id: string, v: TVariant): TVars {
  if (id === 'aqua') return {};
  const light = v === 'light';
  if (['violet', 'mint', 'sky'].includes(id))
    return block(TOKENS, light ? `[data-accent="${id}"]` : `[data-accent="${id}"]:is(${DARK})`);
  return block(THEMES, light ? `[data-theme][data-accent="${id}"]` : `[data-accent="${id}"]:is(${DARK})`);
}

// a at (1 - t) and b at t in sRGB: color-mix(in srgb, b t, a), or b at alpha t painted over a.
export const mix = (a: string, b: string, t: number) => formatHex(interpolate([a, b], 'rgb')(t)) ?? a;
