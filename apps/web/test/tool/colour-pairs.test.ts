import { readFileSync } from 'node:fs';
import path from 'node:path';
import { wcagContrast } from 'culori';
import { describe, expect, it } from 'vitest';
import { darkOf, fitLamp } from '../../src/tool/packs/themes/fit.js';
import { LAMPS, PALETTES } from '../../src/tool/packs/themes/looks.js';
import {
  block,
  DARK,
  lampVars,
  mix,
  paletteVars,
  THEMES,
  TOKENS,
  type TVariant,
  type TVars,
  VARIANTS,
} from './theme-vars.js';

// Every foreground/background pair the tool and the shell paint, for every colour theme × lamp (and custom lamps) ×
// light/dark/OLED: text 4.5:1, icons, rings, bars, input borders and the focus ring 3:1 (WCAG 2.2 AA; docs/05 §1.1).
// The mixes mirror the stylesheets: a tint is color-mix(in srgb, <token> p%, transparent) over its ground.

const AMBIENT = readFileSync(path.join(import.meta.dirname, '../../src/styles/ambient.css'), 'utf8');
const TEXT = 4.5;
const UI = 3;
const ROOT = block(TOKENS, ':root');

type TPair = [fg: string, bg: string, min: number, what: string];

function resolve(t: TVars, value: string, depth = 0): string {
  const ref = /^var\((--[\w-]+)\)$/u.exec(value.trim());
  if (!ref) return value.trim();
  const next = t[ref[1] as string] ?? ROOT[ref[1] as string];
  if (next === undefined || depth > 8) throw new Error(`unresolved ${value}`);
  return resolve(t, next, depth + 1);
}

const CUSTOM = ['#3F7FBF', '#FF0000', '#00FF00', '#FFFF00', '#FF00FF', '#808080'].map(fitLamp);
const DARK_CUSTOM = block(THEMES, `[data-accent="custom"]:is(${DARK})`)['--at-on-accent'] ?? '';

function lookVars(palette: string, v: TVariant, lamp: string): TVars {
  const base = paletteVars(palette, v);
  if (!lamp.startsWith('#')) return { ...base, ...lampVars(lamp, v) };
  const hex = v === 'light' ? lamp : darkOf(lamp);
  const on = v === 'light' ? '#FFFFFF' : DARK_CUSTOM;
  return { ...base, '--at-accent': hex, '--at-accent-text': hex, '--at-focus': hex, '--at-on-accent': on };
}

// The break-phase colour of Focus mode: the violet lamp, or aqua when violet is the lamp.
function altOf(t: TVars, v: TVariant, lamp: string): string {
  const side = v === 'light' ? 'light' : 'dark';
  return resolve(t, `var(--at-lamp-${lamp === 'violet' ? 'aqua' : 'violet'}-${side})`);
}

function pairs(t: TVars, v: TVariant, lamp: string): TPair[] {
  const c = (k: string) => resolve(t, `var(${k})`);
  const [ground, surface, lift, sunken, raised] = [
    '--at-ground',
    '--at-surface',
    '--at-lift',
    '--at-sunken',
    '--at-raised',
  ].map(c) as [string, string, string, string, string];
  const [ink, ink2, muted, accent, accentText] = [
    '--at-ink',
    '--at-ink-2',
    '--at-muted',
    '--at-accent',
    '--at-accent-text',
  ].map(c) as [string, string, string, string, string];
  const [warn, bad, good, track] = ['--at-warn', '--at-bad', '--at-good', '--at-track'].map(c) as [
    string,
    string,
    string,
    string,
  ];
  const onAccent = c('--at-on-accent');
  const onTone = c('--at-on-tone');
  const pages = { ground, surface, lift };
  const grounds = { ...pages, sunken };
  const dark = v !== 'light';
  const out: TPair[] = [];
  const add = (fg: string, bg: string, min: number, what: string) => out.push([fg, bg, min, what]);

  for (const [n, bg] of Object.entries({ ...grounds, secondary: mix(surface, ink, 0.06) })) {
    add(ink, bg, TEXT, `ink on ${n}`);
    add(ink2, bg, TEXT, `ink-2 on ${n}`);
    add(muted, bg, TEXT, `muted on ${n}`);
  }
  add(ink, raised, TEXT, 'ink on raised (Stop, selected segment)');
  add(ink2, raised, TEXT, 'ink-2 on raised');
  add(ink, mix(raised, ink, 0.12), TEXT, 'ink on raised hover');

  for (const [n, bg] of Object.entries(grounds)) {
    for (const [k, tone] of Object.entries({ warn, bad, good })) add(tone, bg, TEXT, `${k} text on ${n}`);
    add(accentText, bg, TEXT, `accent text on ${n}`);
    add(accent, bg, UI, `lamp (ring, bars, dots) on ${n}`);
    add(c('--at-focus'), bg, UI, `focus ring on ${n}`);
    add(c('--at-input-border'), bg, UI, `input border on ${n}`);
  }

  for (const [n, bg] of Object.entries(pages)) {
    const selected = mix(bg, accent, 0.15);
    add(ink, selected, TEXT, `ink on a selected item over ${n}`);
    add(ink2, selected, TEXT, `ink-2 on a selected item over ${n}`);
    add(accentText, selected, UI, `lamp icon on a selected item over ${n}`);
    add(muted, mix(bg, accent, 0.08), TEXT, `muted on a lamp-tinted card over ${n}`);
    for (const [k, tone] of Object.entries({ muted, accent, warn, bad })) {
      const tint = mix(bg, tone, 0.12);
      add(ink, tint, TEXT, `ink on the ${k} pill or tag over ${n}`);
      add(tone, tint, UI, `${k} pill glyph over ${n}`);
    }
    for (const [k, tone] of Object.entries({ warn, bad })) {
      const card = mix(bg, tone, 0.08);
      add(ink, card, TEXT, `ink on the ${k} card over ${n}`);
      add(ink2, card, TEXT, `ink-2 on the ${k} card over ${n}`);
      add(tone, card, UI, `${k} icon on its card over ${n}`);
    }
    const done = mix(bg, good, 0.1);
    add(ink, done, TEXT, `ink on a finished cook timer over ${n}`);
    add(good, done, UI, `finished cook bar over ${n}`);
    add(altOf(t, v, lamp), bg, UI, `Focus break colour on ${n}`);
  }

  for (const [k, icon] of Object.entries({ good, warn, bad, info: ink2 })) add(icon, surface, UI, `${k} toast icon`);

  add(onAccent, accent, TEXT, 'label on a lamp-filled button');
  add(onAccent, mix(accent, ink, 0.12), TEXT, 'label on a lamp-filled button, hover');
  // Tide text sits in the upper half of the water, where the deepening gradient adds at most 10 % black.
  add(onAccent, mix(accent, '#000000', 0.1), TEXT, 'Tide text under water');
  for (const [k, tone] of Object.entries({ good, warn, bad })) add(onTone, tone, TEXT, `label on a ${k} fill`);

  add(accent, track, UI, 'ring arc on its track');
  for (const [k, tone] of Object.entries({ warn, bad })) add(tone, track, UI, `${k} ring arc on its track`);

  add(ink, mix(surface, accent, 0.2), UI, 'heat map dots, level 1');
  add(ink, mix(surface, accent, 0.4), UI, 'heat map dots, level 2');
  add(dark ? onAccent : ink, mix(surface, accent, 0.65), UI, 'heat map dots, level 3');
  add(onAccent, mix(surface, accent, 0.9), UI, 'heat map dots, level 4');
  return out;
}

function nightPairs(t: TVars): TPair[] {
  const n = block(AMBIENT, '.at-ambient[data-mode="night"]');
  const r = (k: string) => resolve({ ...t, ...n }, `var(${k})`);
  const ground = resolve(t, 'var(--at-night-ground)');
  const out: TPair[] = [];
  for (const [bg, name] of [
    [ground, 'ground'],
    [r('--at-surface'), 'surface'],
  ] as const) {
    for (const k of ['--at-night-ink', '--at-ink', '--at-ink-2', '--at-muted', '--at-accent-text'])
      out.push([r(k), bg, TEXT, `night ${k} on ${name}`]);
    out.push([r('--at-accent'), bg, UI, `night lamp on ${name}`]);
    out.push([r('--at-focus'), bg, UI, `night focus on ${name}`]);
    out.push([r('--at-ink'), mix(bg, r('--at-night-muted'), 0.12), TEXT, `night pill on ${name}`]);
  }
  out.push([r('--at-on-accent'), r('--at-accent'), TEXT, 'night label on a lamp-filled button']);
  return out;
}

const LOOKS = PALETTES.flatMap(([palette]) =>
  VARIANTS.flatMap((v) =>
    [...LAMPS.map(([id]) => id), ...CUSTOM].map((lamp) => ({ name: `${palette} / ${lamp} / ${v}`, palette, lamp, v })),
  ),
);

function failures(list: TPair[]): string[] {
  return list
    .map(([fg, bg, min, what]) => [wcagContrast(fg, bg), min, what, fg, bg] as const)
    .filter(([ratio, min]) => ratio < min)
    .map(([ratio, min, what, fg, bg]) => `${what}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${String(min)}:1`);
}

describe('every colour pair in the tool and shell meets WCAG 2.2 AA', () => {
  it('covers 9 themes × 18 lamps × 3 variants', () => {
    expect(LOOKS).toHaveLength(9 * 18 * 3);
  });

  it.each(LOOKS)('$name', ({ palette, lamp, v }) => {
    const t = lookVars(palette, v, lamp);
    const list = pairs(t, v, lamp);
    if (v === 'oled') list.push(...nightPairs(t));
    expect(list.length).toBeGreaterThan(90);
    expect(failures(list)).toEqual([]);
  });

  it('auto in a dark system paints the dark theme', () => {
    expect(block(TOKENS, ':root:not([data-theme])')).toEqual(block(TOKENS, '[data-theme="dark"]'));
  });

  it('shadcn state foregrounds use the on-tone token, never a raw white', () => {
    for (const k of ['destructive', 'success', 'warning'])
      expect(new RegExp(`--${k}-foreground:\\s*var\\(--at-on-tone\\);`, 'u').test(TOKENS), k).toBe(true);
  });
});
