import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  accentHex,
  ACCENTS,
  accentId,
  applyAccent,
  DEFAULT_ACCENT,
  LEGACY_ACCENTS,
  PACK_ACCENTS,
} from '../../src/tool/accent.js';

describe('accentId (DESIGN.md §2.2, docs/05 §1.1a)', () => {
  it('maps the stored light-theme hex to a lamp id, case-insensitively', () => {
    expect(accentId('#087B87', false)).toBe('aqua');
    expect(accentId('#5a47cf', false)).toBe('violet');
    expect(accentId('#167A50', true)).toBe('mint');
    expect(accentId('#255fbd', true)).toBe('sky');
  });

  it('pack lamps need ambient.packs; unknown values fall back to aqua', () => {
    expect(accentId('#167A50', false)).toBe('aqua');
    expect(accentId('#255FBD', false)).toBe('aqua');
    expect(accentId('#123456', true)).toBe('aqua');
    expect(accentId('', true)).toBe('aqua');
    expect(ACCENTS[DEFAULT_ACCENT]).toBe('aqua');
    expect([...PACK_ACCENTS].map((h) => ACCENTS[h as keyof typeof ACCENTS])).toEqual(['mint', 'sky']);
  });
});

describe('legacy palette migration (docs/08 §2.1)', () => {
  // Stored value → [lamp hex, id with ambient.packs, id without].
  const TABLE: Array<[string, string, string, string]> = [
    ['#B86E00', '#087B87', 'aqua', 'aqua'], // amber → aqua (default)
    ['#4F46E5', '#5A47CF', 'violet', 'violet'], // indigo → violet
    ['#0F766E', '#167A50', 'mint', 'aqua'], // teal → mint
    ['#BE123C', '#255FBD', 'sky', 'aqua'], // rose → sky
    ['#b86e00', '#087B87', 'aqua', 'aqua'],
    ['#123456', '#087B87', 'aqua', 'aqua'], // unknown → aqua
    ['not a colour', '#087B87', 'aqua', 'aqua'],
  ];

  it.each(TABLE)('%s → %s (%s, or %s without packs)', (stored, hex, withPacks, withoutPacks) => {
    expect(accentHex(stored)).toBe(hex);
    expect(accentId(stored, true)).toBe(withPacks);
    expect(accentId(stored, false)).toBe(withoutPacks);
  });

  it('covers exactly the four old palettes and targets current lamps', () => {
    expect(Object.keys(LEGACY_ACCENTS).sort()).toEqual(['#0F766E', '#4F46E5', '#B86E00', '#BE123C']);
    for (const lamp of Object.values(LEGACY_ACCENTS)) expect(ACCENTS[lamp]).toBeDefined();
  });

  it('the inline boot script mirrors the lamp and legacy maps (aqua sets no attribute)', () => {
    const boot = readFileSync(path.join(import.meta.dirname, '../../src/boot/boot.js'), 'utf8');
    const literal = /const accents = (\{[^}]*\});/u.exec(boot)?.[1] ?? '{}';
    const map = Object.fromEntries([...literal.matchAll(/'(#[0-9A-F]{6})':\s*'(\w+)'/gu)].map((m) => [m[1], m[2]]));
    const expected: Record<string, string> = {};
    for (const [hex, id] of Object.entries(ACCENTS)) if (id !== 'aqua') expected[hex] = id;
    for (const [hex, lamp] of Object.entries(LEGACY_ACCENTS))
      if (ACCENTS[lamp] !== 'aqua') expected[hex] = ACCENTS[lamp];
    expect(map).toEqual(expected);
  });
});

describe('applyAccent', () => {
  afterEach(() => {
    delete document.documentElement.dataset.accent;
  });

  it('sets data-accent for non-default lamps and removes it for aqua', () => {
    expect(applyAccent('#5A47CF', false)).toBe('violet');
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(applyAccent('#087B87', false)).toBe('aqua');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('removes a pack lamp the licence no longer covers', () => {
    applyAccent('#167A50', true);
    expect(document.documentElement.dataset.accent).toBe('mint');
    applyAccent('#167A50', false);
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('applies the lamp that replaced a legacy palette', () => {
    expect(applyAccent('#4F46E5', false)).toBe('violet');
    expect(document.documentElement.dataset.accent).toBe('violet');
    expect(applyAccent('#B86E00', false)).toBe('aqua');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
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

const PALETTES = Object.values(ACCENTS).flatMap((id) =>
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
    for (const [hex, id] of Object.entries(ACCENTS)) {
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
