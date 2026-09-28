import { readFileSync } from 'node:fs';
import path from 'node:path';
import { type Color, colorsNamed, parse } from 'culori';
import { describe, expect, it } from 'vitest';
import { LAMPS, PALETTES } from '../../src/tool/packs/themes/looks.js';
import {
  block,
  EXT_CONTEXTS,
  EXT_SHEETS,
  hex,
  type IContext,
  type IRule,
  lampVars,
  localVars,
  over,
  paletteVars,
  parseCss,
  ratio,
  REPO,
  Resolver,
  VARIANTS,
  WEB_CONTEXTS,
  WEB_SHEETS,
} from './colour-audit.js';

// Content, marketing and extension pages: every text colour against the background it sits on, in every colour
// theme × lamp × light / dark / OLED (the extension: Clear Night × Aqua), passes WCAG 2.2 AA (4.5:1 text, 3:1 for
// icons, glyphs and focus rings). A rule without its own background is checked on the page ground and on a card.

const GRAPHIC =
  /(?:^|[\s>+~.#-])(?:svg|path|circle|rect|polyline|line)\b|glyph|icon|dot\b|bead|check|mark\b|arc\b|led\b|star|swatch/u;
const INACTIVE = /:disabled|\[disabled\]|aria-disabled|\[data-locked="1"\]/u;
// Controls whose colour paints only an icon (their text, if any, has its own rule).
const ICON_ONLY = new Set(['.at-docs-badge', '.wl-pinned', '.wl-pin[aria-pressed="true"]', '.wl-art-toolbar']);

interface IFail {
  where: string;
  ctx: string;
  fg: string;
  bg: string;
  ratio: number;
  min: number;
}

function audit(rules: IRule[], contexts: IContext[]): { fails: IFail[]; checked: number } {
  const local = localVars(rules);
  const worst = new Map<string, IFail>();
  let checked = 0;
  for (const ctx of contexts) {
    const r = new Resolver(ctx, local);
    const pages = [...r.colours('var(--at-ground)'), ...r.colours('var(--at-surface)')];
    for (const rule of rules) {
      r.at(rule);
      const sel = rule.chain.at(-1) ?? '';
      if (INACTIVE.test(rule.chain.join(' '))) continue;
      const live = rule.decls.filter((d) => !d.art);
      const bgDecl = live.findLast((d) => d.prop === 'background' || d.prop === 'background-color');
      const own = bgDecl ? r.colours(bgDecl.value) : [];
      const grounds = own.length ? own.flatMap((b) => pages.map((p) => over(b, p))) : pages;
      const check = (value: string, min: number, line: number) => {
        for (const fg of r.colours(value))
          for (const bg of grounds) {
            const got = ratio(fg, bg);
            checked += 1;
            if (got >= min) continue;
            const where = `${rule.file}:${String(line)} ${sel}`;
            const prev = worst.get(where);
            if (!prev || got < prev.ratio)
              worst.set(where, {
                where,
                ctx: ctx.name,
                fg: hex(fg),
                bg: hex(bg),
                ratio: Math.round(got * 100) / 100,
                min,
              });
          }
      };
      for (const d of live) {
        if (d.prop === 'color') check(d.value, GRAPHIC.test(sel) || ICON_ONLY.has(sel) ? 3 : 4.5, d.line);
        if ((d.prop === 'outline' || d.prop === 'outline-color') && /focus/u.test(sel)) check(d.value, 3, d.line);
      }
    }
  }
  return { fails: [...worst.values()], checked };
}

describe('content and extension colours meet WCAG AA in every theme', () => {
  it('covers every colour theme, lamp and variant on the site, and the extension themes', () => {
    expect(WEB_CONTEXTS).toHaveLength(9 * 12 * 3);
    expect(EXT_CONTEXTS).toHaveLength(3);
    expect(WEB_SHEETS.length).toBeGreaterThan(20);
    expect(EXT_SHEETS).toHaveLength(4);
  });

  it('site pages: every text / background pair', () => {
    const { fails, checked } = audit(WEB_SHEETS.flatMap(parseCss), WEB_CONTEXTS);
    expect(fails).toEqual([]);
    expect(checked).toBeGreaterThan(250_000);
  });

  it('extension popup, options and welcome: every text / background pair', () => {
    const { fails, checked } = audit(EXT_SHEETS.flatMap(parseCss), EXT_CONTEXTS);
    expect(fails).toEqual([]);
    expect(checked).toBeGreaterThan(800);
  });
});

const NAMED = new Set(Object.keys(colorsNamed));
const MASK = /^(?:-webkit-)?mask(?:-image)?$|^--[\w-]*mask$/u;

function literals(value: string): string[] {
  const bare = value.replace(/url\([^)]*\)/gu, '').replace(/(["'])(?:(?!\1).)*\1/gu, '');
  const found = [...bare.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/giu)].map(
    (m) => m[0],
  );
  for (const w of bare.matchAll(/(?<![\w-])[a-z]+(?![\w-])/giu))
    if (NAMED.has(w[0].toLowerCase()) && !/^in$/u.test(w[0])) found.push(w[0]);
  return found;
}

describe('no raw colour outside marked art blocks', () => {
  it.each([...WEB_SHEETS, ...EXT_SHEETS])('%s', (file) => {
    const raw = parseCss(file).flatMap((r) =>
      r.decls
        .filter((d) => !d.art && !MASK.test(d.prop) && d.prop !== 'font' && !d.prop.startsWith('font-'))
        .flatMap((d) => literals(d.value).map((l) => `${String(d.line)} ${d.prop}: ${l}`)),
    );
    expect(raw).toEqual([]);
  });

  it('the scan sees what it should', () => {
    expect(literals('0 1px 2px rgb(0 0 0 / 30%)')).toEqual(['rgb(']);
    expect(literals('light-dark(#fff, black)')).toEqual(['#fff', 'black']);
    expect(literals('var(--at-lamp-violet-dark) url("data:image/svg+xml,stroke=\'black\'")')).toEqual([]);
    expect(literals('color-mix(in oklab, var(--at-accent) 60%, transparent)')).toEqual([]);
  });
});

const read = (file: string) => readFileSync(path.join(REPO, file), 'utf8');
const low = (c: string | undefined) =>
  (c ?? '').toLowerCase().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/u, '#$1$1$2$2$3$3');

describe('art that mirrors a theme keeps the token values', () => {
  it('the Customise section swatches match every colour theme and lamp', () => {
    const css = read('apps/web/src/styles/home-yours.css');
    for (const [p] of PALETTES) {
      const own = block(css, `[data-pal="${p}"]`);
      expect(low(own['--at-hy-l']), `${p} light`).toBe(low(paletteVars(p, 'light')['--at-ground']));
      expect(low(own['--at-hy-d']), `${p} dark`).toBe(low(paletteVars(p, 'dark')['--at-ground']));
    }
    for (const [lamp, lightHex] of LAMPS) {
      const m = /^light-dark\((#\w+), (#\w+)\)$/u.exec(block(css, `[data-lamp="${lamp}"]`)['--at-hy-a'] ?? '');
      const dark = { ...paletteVars('clear-night', 'dark'), ...lampVars(lamp, 'dark') }['--at-accent'];
      expect([low(m?.[1]), low(m?.[2])], lamp).toEqual([low(lightHex), low(dark)]);
    }
  });

  it('the kiosk preview paints Clear Night light, dark and OLED exactly', () => {
    const names: Record<string, string> = {
      '--kp-ink': '--at-ink',
      '--kp-ink2': '--at-ink-2',
      '--kp-muted': '--at-muted',
      '--kp-lamp': '--at-accent',
      '--kp-track': '--at-track',
      '--kp-line': '--at-line',
      '--kp-surface': '--at-surface',
    };
    const rules = parseCss('apps/web/src/styles/pages.css');
    const kp = (sel: string): Record<string, string> =>
      Object.fromEntries(
        (rules.find((r) => r.chain.at(-1) === sel)?.decls ?? [])
          .filter((d) => d.prop.startsWith('--kp-'))
          .map((d) => [d.prop, d.value]),
      );
    const css = read('apps/web/src/styles/pages.css');
    expect(css).toContain('.at-k-screen[data-ktheme="light"]');
    const dark = kp('.at-k-screen');
    const light = kp('.at-k-screen[data-ktheme="light"]');
    const auto = kp('.at-k-screen[data-ktheme="auto"]');
    const oled = kp('.at-k-screen[data-ktheme="oled"]');
    const t = { light: paletteVars('clear-night', 'light'), dark: paletteVars('clear-night', 'dark') };
    for (const [k, token] of Object.entries(names)) {
      expect(low(dark[k]), `dark ${k}`).toBe(low(t.dark[token]));
      expect(low(light[k]), `light ${k}`).toBe(low(t.light[token]));
      expect(auto[k], `auto ${k}`).toBe(`light-dark(${light[k] ?? ''}, ${dark[k] ?? ''})`);
    }
    expect(dark['--kp-bg']).toBe(
      `radial-gradient(120% 100% at 50% 8%, ${t.dark['--at-lift'] ?? ''} 0%, ${t.dark['--at-ground'] ?? ''} 72%)`,
    );
    expect(low(oled['--kp-bg'])).toBe(low(paletteVars('clear-night', 'oled')['--at-ground']));
    expect(low(oled['--kp-surface'])).toBe(low(paletteVars('clear-night', 'oled')['--at-surface']));
  });

  it('browser theme colours are the page grounds', () => {
    const ground = (v: (typeof VARIANTS)[number]) => low(paletteVars('clear-night', v)['--at-ground']);
    const boot = /const GROUND = \{ light: '(#\w+)', dark: '(#\w+)', oled: '(#\w+)' \}/u.exec(
      read('apps/web/src/boot/boot.js'),
    );
    expect([low(boot?.[1]), low(boot?.[2]), low(boot?.[3])]).toEqual([ground('light'), ground('dark'), ground('oled')]);
    const metas = [
      ...read('apps/web/src/layouts/BaseLayout.astro').matchAll(
        /name="theme-color"(?: media="\(prefers-color-scheme: (\w+)\)")? content="(#\w+)"/gu,
      ),
    ];
    expect(metas).toHaveLength(3);
    for (const m of metas) expect(low(m[2]), m[0]).toBe(ground(m[1] === 'dark' ? 'dark' : 'light'));
  });

  it('the extension badge and the OG image use the token colours', () => {
    const shared = paletteVars('clear-night', 'light');
    const status = read('apps/extension/src/status.ts');
    const badge = /BADGE_COLORS[^=]*= \{ display: '(#\w+)', system: '(#\w+)' \}/u.exec(status);
    expect([low(badge?.[1]), low(badge?.[2])]).toEqual([
      low(shared['--at-badge-screen']),
      low(shared['--at-badge-system']),
    ]);
    for (const k of ['--at-badge-screen', '--at-badge-system'])
      expect(
        ratio(parse(shared['--at-badge-ink'] ?? '') as Color, parse(shared[k] ?? '') as Color),
        k,
      ).toBeGreaterThanOrEqual(4.5);
    const og = /const COLOURS = \{([^}]*)\}/u.exec(read('apps/web/src/lib/og.ts'))?.[1] ?? '';
    const colours = Object.fromEntries([...og.matchAll(/(\w+): '(#\w+)'/gu)].map((m) => [m[1], m[2]]));
    expect(Object.keys(colours)).toEqual(['ground', 'ink', 'muted', 'track', 'lamp']);
    for (const [k, token] of Object.entries({
      ground: '--at-ground',
      ink: '--at-ink',
      muted: '--at-muted',
      track: '--at-track',
      lamp: '--at-accent',
    }))
      expect(low(colours[k]), k).toBe(low(shared[token]));
  });
});

describe('page roles added to every theme', () => {
  it.each(PALETTES.flatMap(([p]) => VARIANTS.map((v) => [p, v] as const)))('%s / %s: bezel and shadow', (p, v) => {
    const t = paletteVars(p, v);
    expect(t['--at-bezel'], 'bezel').toMatch(/^#/u);
    expect(t['--at-shadow-color'], 'shadow').toMatch(/^#/u);
    const bezel = parse(t['--at-bezel'] ?? '') as Color;
    expect(ratio(parse(t['--at-bezel-ink'] ?? '') as Color, bezel), 'ink on the bezel').toBeGreaterThanOrEqual(4.5);
    expect(ratio(parse(t['--at-ink'] ?? '') as Color, parse(t['--at-ground'] ?? '') as Color)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
