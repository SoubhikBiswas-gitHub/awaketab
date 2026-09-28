import { readFileSync } from 'node:fs';
import path from 'node:path';
import { wcagContrast, wcagLuminance } from 'culori';
import { describe, expect, it } from 'vitest';
import { darkOf, fitLamp, lampOk, ON_DARK, WORST_DARK, WORST_LIGHT } from '../../src/tool/packs/themes/fit.js';
import {
  type ILook,
  LAMPS,
  LEGACY_LAMPS,
  lampOf,
  lookFree,
  lookOf,
  ownedLook,
  PALETTES,
  PATTERNS,
  PRESETS,
  presetLook,
} from '../../src/tool/packs/themes/looks.js';
import { block, DARK, lampVars, mix, paletteVars, THEMES, VARIANTS } from './theme-vars.js';

// Every colour theme × lamp × light/dark/OLED is checked with culori (WCAG 2.2 AA): text 4.5:1 on the page and on
// cards, UI (rings, focus, input borders) 3:1, labels on lamp-filled buttons 4.5:1, and text stays AA over the
// patterns (ink at their strongest alpha) and the aurora glow (lamp at 8 %). docs/05 §1, DESIGN.md §2.
// colour-pairs.test.ts checks every other text and UI pair the tool paints.

const WEB = path.join(import.meta.dirname, '../..');

const PATTERN_ALPHA = Number(/--at-pat-a:\s*([\d.]+);/u.exec(THEMES)?.[1]);

const CASES = PALETTES.flatMap(([palette]) =>
  VARIANTS.flatMap((v) => LAMPS.map(([lamp]) => ({ name: `${palette} / ${lamp} / ${v}`, palette, lamp, v }))),
);

describe('colour themes meet WCAG AA (culori)', () => {
  it('covers every theme, lamp and variant', () => {
    expect(CASES).toHaveLength(9 * 12 * 3);
    expect(PATTERN_ALPHA).toBeGreaterThan(0);
    expect(PATTERN_ALPHA).toBeLessThanOrEqual(0.07);
  });

  it.each(PALETTES.flatMap(([p]) => VARIANTS.map((v) => [p, v] as const)))('%s / %s: text and UI', (p, v) => {
    const t = paletteVars(p, v);
    for (const bg of ['--at-ground', '--at-surface']) {
      const ground = t[bg] as string;
      for (const k of ['--at-ink', '--at-ink-2', '--at-muted', '--at-warn', '--at-bad', '--at-good'])
        expect(wcagContrast(t[k] as string, ground), `${k} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      expect(wcagContrast(t['--at-input-border'] as string, ground), `input on ${bg}`).toBeGreaterThanOrEqual(3);
      const patterned = mix(ground, t['--at-ink'] as string, PATTERN_ALPHA);
      for (const k of ['--at-ink-2', '--at-muted'])
        expect(wcagContrast(t[k] as string, patterned), `${k} on ${bg} + pattern`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(CASES)('$name: lamp', ({ palette, lamp, v }) => {
    const t = { ...paletteVars(palette, v), ...lampVars(lamp, v) };
    const accent = t['--at-accent'] as string;
    for (const bg of ['--at-ground', '--at-surface'])
      expect(
        wcagContrast(t['--at-accent-text'] as string, t[bg] as string),
        `accent text on ${bg}`,
      ).toBeGreaterThanOrEqual(4.5);
    expect(wcagContrast(accent, t['--at-ground'] as string), 'ring').toBeGreaterThanOrEqual(3);
    expect(wcagContrast(t['--at-focus'] as string, t['--at-ground'] as string), 'focus').toBeGreaterThanOrEqual(3);
    expect(wcagContrast(t['--at-on-accent'] as string, accent), 'label on the lamp').toBeGreaterThanOrEqual(4.5);
    const aurora = mix(t['--at-ground'] as string, accent, 0.08);
    expect(wcagContrast(t['--at-muted'] as string, aurora), 'muted over aurora').toBeGreaterThanOrEqual(4.5);
  });

  it('the custom-lamp checks use the darkest light page and the lightest dark card of any theme', () => {
    const light = PALETTES.flatMap(([p]) => ['--at-ground', '--at-surface'].map((k) => paletteVars(p, 'light')[k]));
    const dark = PALETTES.flatMap(([p]) => ['--at-ground', '--at-surface'].map((k) => paletteVars(p, 'dark')[k]));
    const lum = (c: string | undefined) => wcagLuminance(c ?? '#000');
    expect(Math.min(...light.map(lum))).toBeCloseTo(lum(WORST_LIGHT), 6);
    expect(Math.max(...dark.map(lum))).toBeCloseTo(lum(WORST_DARK), 6);
    expect(block(THEMES, `[data-accent="custom"]:is(${DARK})`)['--at-on-accent']?.toUpperCase()).toBe(ON_DARK);
  });
});

describe('custom lamp colour (vanilla-colorful, fitted)', () => {
  it('darkOf matches color-mix(in srgb, lamp 40%, #fff) from themes.css', () => {
    expect(block(THEMES, `[data-accent="custom"]:is(${DARK})`)['--at-accent']).toBe(
      'color-mix(in srgb, var(--at-custom) 40%, #fff)',
    );
    for (const hex of ['#087B87', '#0000FF', '#7F6400'])
      expect(darkOf(hex).toLowerCase()).toBe(mix('#ffffff', hex, 0.4));
  });

  it('fits any picked colour to AA on every theme, keeping its hue', () => {
    let seed = 7;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const picks = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#000000', '#808080'];
    for (let i = 0; i < 60; i += 1)
      picks.push(
        `#${Math.floor(r() * 0xffffff)
          .toString(16)
          .padStart(6, '0')
          .toUpperCase()}`,
      );
    for (const pick of picks) {
      const hex = fitLamp(pick);
      expect(lampOk(hex), pick).toBe(true);
      const dark = darkOf(hex);
      for (const [p] of PALETTES) {
        const light = paletteVars(p, 'light');
        const night = paletteVars(p, 'dark');
        for (const bg of ['--at-ground', '--at-surface']) {
          expect(wcagContrast(hex, light[bg] as string), `${pick} → ${hex} on ${p}`).toBeGreaterThanOrEqual(4.5);
          expect(wcagContrast(dark, night[bg] as string), `${pick} → ${dark} on ${p} dark`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(wcagContrast('#FFFFFF', hex)).toBeGreaterThanOrEqual(4.5);
      expect(wcagContrast(ON_DARK, dark)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps a readable colour as it is', () => {
    expect(fitLamp('#087B87')).toBe('#087B87');
    expect(fitLamp('nope')).toBe('#087B87');
  });
});

describe('look catalogue (docs/00 identifiers)', () => {
  it('matches the settings types, gates and preset rules', () => {
    expect(PALETTES.map(([p]) => p)).toEqual([
      'clear-night',
      'paper',
      'nord',
      'solarized',
      'midnight',
      'forest',
      'sunset',
      'mono',
      'contrast',
    ]);
    expect(PALETTES.filter(([, free]) => free).map(([p]) => p)).toEqual(['clear-night', 'paper', 'nord']);
    expect(LAMPS.filter(([, , free]) => free).map(([l]) => l)).toEqual(['aqua', 'violet', 'amber', 'teal']);
    expect(PATTERNS.filter(([, free]) => free).map(([p]) => p)).toEqual(['none', 'grain', 'dots', 'grid']);
    expect(PRESETS).toHaveLength(8);
    expect(PRESETS.filter(([id]) => lookFree(presetLook(id) as ILook)).map(([id]) => id)).toEqual([
      'classic',
      'library',
      'fjord',
    ]);
    expect(presetLook('night-desk')).toEqual({ palette: 'midnight', accent: '#A34F00', pattern: 'stars' });
    expect(presetLook('kitchen')).toEqual({ palette: 'paper', accent: '#B1452F', pattern: 'dots' });
    expect(presetLook('focus')).toEqual({ palette: 'nord', accent: '#2A6A8A', pattern: 'grain' });
  });

  it('new lamps never reuse a legacy hex, and every lamp has its CSS', () => {
    const hexes = LAMPS.map(([, hex]) => hex);
    for (const legacy of Object.keys(LEGACY_LAMPS)) expect(hexes).not.toContain(legacy);
    expect(new Set(hexes).size).toBe(12);
    for (const [id, hex] of LAMPS) {
      if (id === 'aqua') continue;
      expect(lampVars(id, 'light')['--at-accent']?.toUpperCase(), id).toBe(hex);
    }
  });

  it('reads stored settings defensively and gates Pro parts', () => {
    expect(lookOf({})).toEqual({ palette: 'clear-night', accent: '#087B87', pattern: 'none' });
    expect(lookOf({ palette: 'disco' as never, pattern: 'x' as never, accent: '#0f766e' })).toEqual({
      palette: 'clear-night',
      accent: '#167A50',
      pattern: 'none',
    });
    expect(lampOf('#b86e00')).toEqual({ id: 'aqua', hex: '#087B87' });
    expect(lampOf('#123456')).toEqual({ id: 'custom', hex: '#123456' });
    expect(lampOf('not a colour')).toEqual({ id: 'aqua', hex: '#087B87' });
    const pro = { palette: 'midnight', accent: '#B1452F', pattern: 'stars' } as const;
    expect(ownedLook(pro, true)).toEqual(pro);
    expect(ownedLook(pro, false)).toEqual({ palette: 'clear-night', accent: '#087B87', pattern: 'none' });
    expect(ownedLook({ palette: 'paper', accent: '#0A7565', pattern: 'dots' }, false)).toEqual({
      palette: 'paper',
      accent: '#0A7565',
      pattern: 'dots',
    });
  });

  it('the inline boot script mirrors the lamp and legacy maps (aqua sets no attribute)', () => {
    const boot = readFileSync(path.join(WEB, 'src/boot/boot.js'), 'utf8');
    const literal = /const accents = (\{[^}]*\});/u.exec(boot)?.[1] ?? '{}';
    const map = Object.fromEntries([...literal.matchAll(/'(#[0-9A-F]{6})':\s*'(\w+)'/gu)].map((m) => [m[1], m[2]]));
    const expected: Record<string, string> = {};
    for (const [id, hex] of LAMPS) if (id !== 'aqua') expected[hex] = id;
    for (const [legacy, hex] of Object.entries(LEGACY_LAMPS)) {
      const id = lampOf(hex).id;
      if (id !== 'aqua') expected[legacy] = id;
    }
    expect(map).toEqual(expected);
  });

  it('has CSS for every pattern but none', () => {
    for (const [id] of PATTERNS) {
      if (id === 'none') continue;
      expect(THEMES, id).toContain(`[data-pattern="${id}"]`);
    }
  });
});
