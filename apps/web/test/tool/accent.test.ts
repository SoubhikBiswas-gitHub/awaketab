import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ACCENTS, accentId, applyAccent, DEFAULT_ACCENT, PACK_ACCENTS } from '../../src/tool/accent.js';

describe('accentId (docs/05 §1.1a)', () => {
  it('maps the stored light-theme hex to a palette id, case-insensitively', () => {
    expect(accentId('#B86E00', false)).toBe('amber');
    expect(accentId('#4f46e5', false)).toBe('indigo');
    expect(accentId('#0F766E', true)).toBe('teal');
    expect(accentId('#be123c', true)).toBe('rose');
  });

  it('pack accents need ambient.packs; unknown values fall back to amber', () => {
    expect(accentId('#0F766E', false)).toBe('amber');
    expect(accentId('#BE123C', false)).toBe('amber');
    expect(accentId('#123456', true)).toBe('amber');
    expect(accentId('', true)).toBe('amber');
    expect(ACCENTS[DEFAULT_ACCENT]).toBe('amber');
    expect([...PACK_ACCENTS].map((h) => ACCENTS[h as keyof typeof ACCENTS])).toEqual(['teal', 'rose']);
  });
});

describe('applyAccent', () => {
  afterEach(() => {
    delete document.documentElement.dataset.accent;
  });

  it('sets data-accent for non-default palettes and removes it for amber', () => {
    expect(applyAccent('#4F46E5', false)).toBe('indigo');
    expect(document.documentElement.dataset.accent).toBe('indigo');
    expect(applyAccent('#B86E00', false)).toBe('amber');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('removes a pack accent the licence no longer covers', () => {
    applyAccent('#0F766E', true);
    expect(document.documentElement.dataset.accent).toBe('teal');
    applyAccent('#0F766E', false);
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });
});

// ---- WCAG contrast of every palette in tokens.css -------------------------------------------------------

const CSS = readFileSync(path.join(import.meta.dirname, '../../src/styles/tokens.css'), 'utf8');

/** Custom properties declared in the first rule whose selector list matches `selector` exactly. */
function block(selector: string): Record<string, string> {
  for (const m of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const sel = (m[1] ?? '').replace(/\/\*[\s\S]*?\*\//gu, '').replace(/\s+/gu, ' ').trim();
    if (sel !== selector) continue;
    const vars: Record<string, string> = {};
    for (const d of (m[2] ?? '').matchAll(/(--at-[\w-]+)\s*:\s*([^;]+);/gu)) vars[d[1] as string] = (d[2] as string).trim();
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

/** WCAG 2.x relative luminance. */
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

const PALETTES = Object.values(ACCENTS).flatMap((id) =>
  (['light', 'dark', 'oled'] as const).map((theme) => {
    const base = THEMES[theme];
    let over: Record<string, string> = {};
    if (id !== 'amber') {
      over = theme === 'light' ? block(`[data-accent="${id}"]`) : block(`[data-accent="${id}"]:is([data-theme="dark"], [data-theme="oled"])`);
    }
    return { name: `${id} / ${theme}`, vars: { ...base, ...over } };
  }),
);

describe('accent palettes meet WCAG AA (tokens.css)', () => {
  it('parses every palette with the tokens under test', () => {
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
    // Label on a filled primary button (shadcn --primary = accent-text).
    expect(contrast(vars['--at-on-accent'], vars['--at-accent-text'])).toBeGreaterThanOrEqual(4.5);
  });

  it('the auto/dark media block matches the explicit dark theme', () => {
    const media = /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{([^}]*)\}/u.exec(CSS)?.[1] ?? '';
    for (const k of ['--at-ground', '--at-surface', '--at-accent', '--at-accent-text', '--at-on-accent']) {
      const value = new RegExp(`${k}\\s*:\\s*([^;]+);`, 'u').exec(media)?.[1]?.trim();
      expect(value, k).toBe(THEMES.dark[k]);
    }
  });
});
