import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gateLooks } from '../../src/tool/accent.js';

describe('gateLooks (a lapsed licence falls back to the free look)', () => {
  const html = document.documentElement;
  afterEach(() => {
    for (const k of ['accent', 'palette', 'pattern', 'preview']) html.removeAttribute(`data-${k}`);
  });

  it('keeps free lamps, colour themes and patterns and drops Pro ones without ambient.packs', () => {
    Object.assign(html.dataset, { accent: 'amber', palette: 'nord', pattern: 'grid' });
    gateLooks(false);
    expect({ ...html.dataset }).toMatchObject({ accent: 'amber', palette: 'nord', pattern: 'grid' });
    Object.assign(html.dataset, { accent: 'coral', palette: 'midnight', pattern: 'stars' });
    gateLooks(false);
    expect(
      html.hasAttribute('data-accent') || html.hasAttribute('data-palette') || html.hasAttribute('data-pattern'),
    ).toBe(false);
  });

  it('leaves everything with Pro, and leaves a running preview alone', () => {
    Object.assign(html.dataset, { accent: 'custom', palette: 'mono' });
    gateLooks(true);
    expect(html.dataset.accent).toBe('custom');
    html.dataset.preview = 'palette';
    gateLooks(false);
    expect(html.dataset.palette).toBe('mono');
  });
});

// ---- WCAG contrast of every palette in tokens.css -------------------------------------------------------

const CSS = readFileSync(path.join(import.meta.dirname, '../../src/styles/tokens.css'), 'utf8');

function block(selector: string): Record<string, string> {
  for (const m of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const sel = (m[1] ?? '')
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/\s+/gu, ' ')
      .trim();
    if (sel !== selector) continue;
    const vars: Record<string, string> = {};
    for (const d of (m[2] ?? '').matchAll(/(--at-[\w-]+)\s*:\s*([^;]+);/gu))
      vars[d[1] as string] = (d[2] as string).trim();
    return vars;
  }
  throw new Error(`tokens.css: no rule for ${selector}`);
}

function hex(value: string | undefined): [number, number, number] {
  let h = (value ?? '').replace('#', '').toLowerCase();
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/u.test(h)) throw new Error(`not a hex colour: ${String(value)}`);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(value: string | undefined): number {
  const [r, g, b] = hex(value).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string | undefined, b: string | undefined): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('contrast helper', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000', '#fff')).toBeCloseTo(21, 5);
    expect(contrast('#fff', '#fff')).toBeCloseTo(1, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });
});

const THEMES = {
  light: block(':root, [data-theme="light"]'),
  dark: block('[data-theme="dark"]'),
  oled: block('[data-theme="oled"]'),
};

const PALETTES = ['aqua', 'violet', 'mint', 'sky'].flatMap((id) =>
  (['light', 'dark', 'oled'] as const).map((theme) => {
    const base = THEMES[theme];
    let over: Record<string, string> = {};
    if (id !== 'aqua') {
      over =
        theme === 'light'
          ? block(`[data-accent="${id}"]`)
          : block(`[data-accent="${id}"]:is([data-theme="dark"], [data-theme="oled"])`);
    }
    return { name: `${id} / ${theme}`, vars: { ...base, ...over } };
  }),
);

describe('lamp colours meet WCAG AA (tokens.css, DESIGN.md §2.2)', () => {
  it('parses every lamp with the tokens under test', () => {
    expect(PALETTES).toHaveLength(12);
    for (const { vars } of PALETTES) {
      for (const k of ['--at-ground', '--at-surface', '--at-accent', '--at-accent-text', '--at-on-accent']) {
        expect(() => hex(vars[k])).not.toThrow();
      }
    }
  });

  it.each(PALETTES)('$name', ({ vars }) => {
    const ground = vars['--at-ground'];
    const surface = vars['--at-surface'];
    // Non-text UI (ring, chip border): 3:1 against the page.
    expect(contrast(vars['--at-accent'], ground)).toBeGreaterThanOrEqual(3);
    // Accent-coloured text on the page and on cards.
    expect(contrast(vars['--at-accent-text'], ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars['--at-accent-text'], surface)).toBeGreaterThanOrEqual(4.5);
    // Label on a filled primary button (shadcn --primary = accent-text) and on the lamp fill itself.
    expect(contrast(vars['--at-on-accent'], vars['--at-accent-text'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(vars['--at-on-accent'], vars['--at-accent'])).toBeGreaterThanOrEqual(4.5);
    // Focus ring: 3:1 against the page.
    expect(contrast(vars['--at-focus'], ground)).toBeGreaterThanOrEqual(3);
  });

  it('the light lamp values are the stored settings hexes (DESIGN.md §2.2)', () => {
    const lamps = { '#087B87': 'aqua', '#5A47CF': 'violet', '#167A50': 'mint', '#255FBD': 'sky' };
    for (const [hex, id] of Object.entries(lamps)) {
      const vars = PALETTES.find((p) => p.name === `${id} / light`)?.vars ?? {};
      expect(vars['--at-accent']?.toUpperCase(), id).toBe(hex);
      expect(vars['--at-accent-text']?.toUpperCase(), id).toBe(hex);
    }
  });

  it('the auto/dark media block matches the explicit dark theme', () => {
    const media =
      /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{([^}]*)\}/u.exec(CSS)?.[1] ?? '';
    expect(Object.keys(THEMES.dark).length).toBeGreaterThan(15);
    for (const k of Object.keys(THEMES.dark)) {
      const value = new RegExp(`${k}\\s*:\\s*([^;]+);`, 'u').exec(media)?.[1]?.trim();
      expect(value, k).toBe(THEMES.dark[k]);
    }
  });
});

describe('Clear Night neutrals and tones meet WCAG AA (DESIGN.md §2.1)', () => {
  it.each(Object.entries(THEMES))('%s', (_theme, vars) => {
    const ground = vars['--at-ground'];
    const surface = vars['--at-surface'];
    // Text tokens: ink, ink-2, muted, and the tone colours used as text (text-destructive, text-warning).
    for (const k of ['--at-ink', '--at-ink-2', '--at-muted', '--at-warn', '--at-bad', '--at-good']) {
      expect(contrast(vars[k], ground), `${k} on ground`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(vars[k], surface), `${k} on surface`).toBeGreaterThanOrEqual(4.5);
    }
    // Input borders are non-text UI (decision O-56): 3:1 on the page and on cards.
    expect(contrast(vars['--at-input-border'], ground)).toBeGreaterThanOrEqual(3);
    expect(contrast(vars['--at-input-border'], surface)).toBeGreaterThanOrEqual(3);
  });
});
