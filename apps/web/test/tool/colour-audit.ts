import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { type Color, formatHex8, interpolateWithPremultipliedAlpha, parse, rgb, wcagContrast } from 'culori';
import { LAMPS, PALETTES } from '../../src/tool/packs/themes/looks.js';

// Shared by page-colours.test.ts: a small CSS reader, the token values of every theme × palette × lamp, and a
// resolver that turns a declared value (var(), light-dark(), color-mix(), gradients) into the colours it can paint.

export const REPO = path.join(import.meta.dirname, '../../../..');
const WEB = path.join(REPO, 'apps/web');
const TOKENS = readFileSync(path.join(WEB, 'src/styles/tokens.css'), 'utf8');
const THEMES = readFileSync(path.join(WEB, 'public/assets/themes.css'), 'utf8');

// The content, marketing and extension stylesheets this audit owns (the tool island has its own).
export const WEB_SHEETS = [
  'content.css',
  'article/*.css',
  'hub.css',
  'hub-gallery.css',
  'pick-gallery.css',
  'docs-hub.css',
  'pages.css',
  'pro.css',
  'extension-page.css',
  'home*.css',
  'tilt.css',
  'icon-motion.css',
  'page-404.css',
  'embed.css',
  'device-matrix.css',
].flatMap((p) => globSync(`apps/web/src/styles/${p}`, { cwd: REPO }).sort());
export const EXT_SHEETS = [
  'apps/extension/src/styles/base.css',
  ...globSync('apps/extension/entrypoints/*/*.css', { cwd: REPO }).sort(),
];

interface IDecl {
  prop: string;
  value: string;
  line: number;
  art: boolean;
}

export interface IRule {
  file: string;
  chain: string[];
  decls: IDecl[];
}

const ART_RULE = 'declaration-property-value-disallowed-list';

// Lines inside a `stylelint-disable declaration-property-value-disallowed-list` block (or its next-line form) are
// art: drawings that keep their own fixed colours.
function artLines(css: string): Set<number> {
  const lines = css.split('\n');
  const art = new Set<number>();
  let open = false;
  lines.forEach((l, i) => {
    const n = i + 1;
    if (l.includes('stylelint-disable-next-line') && l.includes(ART_RULE)) art.add(n + 1);
    else if (/stylelint-disable\s/u.test(l) && l.includes(ART_RULE)) open = true;
    if (open) art.add(n);
    if (/stylelint-enable\s/u.test(l) && l.includes(ART_RULE)) open = false;
  });
  return art;
}

export function parseCss(file: string): IRule[] {
  const css = readFileSync(path.join(REPO, file), 'utf8');
  const art = artLines(css);
  const rules: IRule[] = [];
  const stack: { sel: string; decls: IDecl[] }[] = [{ sel: '', decls: [] }];
  let buf = '';
  let line = 1;
  let start = 1;
  let depth = 0;
  const decl = () => {
    const text = buf.trim();
    buf = '';
    if (!text) return;
    const at = text.indexOf(':');
    if (at < 0) return;
    const frame = stack.at(-1);
    frame?.decls.push({
      prop: text.slice(0, at).trim(),
      value: text
        .slice(at + 1)
        .replace(/\s+/gu, ' ')
        .replace(/\s*!important$/u, '')
        .trim(),
      line: start,
      art: art.has(start),
    });
  };
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i] as string;
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      line += (css.slice(i, end).match(/\n/gu) ?? []).length;
      i = end + 1;
      continue;
    }
    if (c === '\n') line += 1;
    if (!buf.trim() && /\S/u.test(c)) start = line;
    if (c === '"' || c === "'") {
      const end = css.indexOf(c, i + 1);
      buf += css.slice(i, end + 1);
      i = end;
      continue;
    }
    if (c === '(') depth += 1;
    if (c === ')') depth -= 1;
    if (depth === 0 && c === '{') {
      stack.push({ sel: buf.replace(/\s+/gu, ' ').trim(), decls: [] });
      buf = '';
    } else if (depth === 0 && c === ';') decl();
    else if (depth === 0 && c === '}') {
      decl();
      const frame = stack.pop();
      if (frame?.decls.length)
        rules.push({ file, chain: [...stack.map((f) => f.sel).filter(Boolean), frame.sel], decls: frame.decls });
    } else buf += c;
  }
  return rules;
}

export type TVars = Record<string, string>;
export type TVariant = 'light' | 'dark' | 'oled';
export const VARIANTS: readonly TVariant[] = ['light', 'dark', 'oled'];

export function block(css: string, selector: string): TVars {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)) {
    const sel = (m[1] ?? '')
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/\s+/gu, ' ')
      .trim();
    if (sel !== selector) continue;
    const vars: TVars = {};
    for (const d of (m[2] ?? '').matchAll(/(--at-[\w-]+)\s*:\s*([^;]+);/gu))
      vars[d[1] as string] = (d[2] as string).trim();
    return vars;
  }
  throw new Error(`no rule for ${selector}`);
}

const DARK = '[data-theme="dark"], [data-theme="oled"]';

export function paletteVars(id: string, v: TVariant): TVars {
  const base = {
    light: block(TOKENS, ':root, [data-theme="light"]'),
    dark: block(TOKENS, '[data-theme="dark"]'),
    oled: block(TOKENS, '[data-theme="oled"]'),
  }[v];
  const shared = block(TOKENS, ':root');
  if (id === 'clear-night') return { ...shared, ...base };
  const own =
    v === 'light'
      ? block(THEMES, `[data-palette="${id}"][data-theme="light"]`)
      : block(THEMES, `[data-palette="${id}"]:is(${DARK})`);
  const oled = v === 'oled' ? block(THEMES, '[data-palette][data-theme="oled"]') : {};
  return { ...shared, ...base, ...own, ...oled };
}

export function lampVars(id: string, v: TVariant): TVars {
  if (id === 'aqua') return {};
  const light = v === 'light';
  if (['violet', 'mint', 'sky'].includes(id))
    return block(TOKENS, light ? `[data-accent="${id}"]` : `[data-accent="${id}"]:is(${DARK})`);
  return block(THEMES, light ? `[data-theme][data-accent="${id}"]` : `[data-accent="${id}"]:is(${DARK})`);
}

export interface IContext {
  name: string;
  v: TVariant;
  vars: TVars;
}

export const WEB_CONTEXTS: IContext[] = PALETTES.flatMap(([p]) =>
  VARIANTS.flatMap((v) =>
    LAMPS.map(([lamp]) => ({ name: `${p} / ${lamp} / ${v}`, v, vars: { ...paletteVars(p, v), ...lampVars(lamp, v) } })),
  ),
);
// The extension imports tokens.css only: Clear Night, the Aqua lamp, light / dark / OLED.
export const EXT_CONTEXTS: IContext[] = VARIANTS.map((v) => ({
  name: `extension / ${v}`,
  v,
  vars: paletteVars('clear-night', v),
}));

interface ILocal {
  value: string;
  when: TVariant | null;
  file: string;
  rule: IRule;
}

// A stylesheet's own custom properties, each with the theme its selector (or media query) limits it to.
export function localVars(rules: IRule[]): Map<string, ILocal[]> {
  const out = new Map<string, ILocal[]>();
  for (const r of rules) {
    const scope = r.chain.join(' ');
    const when: TVariant | null =
      /data-theme="oled"\]/u.test(scope) && !/data-theme="dark"/u.test(scope)
        ? 'oled'
        : /data-theme="dark"|prefers-color-scheme: dark/u.test(scope)
          ? 'dark'
          : /data-theme="light"/u.test(scope)
            ? 'light'
            : null;
    for (const d of r.decls) {
      if (!d.prop.startsWith('--') || d.art) continue;
      const list = out.get(d.prop) ?? [];
      list.push({ value: d.value, when, file: r.file, rule: r });
      out.set(d.prop, list);
    }
  }
  return out;
}

function splitTop(s: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const c of s) {
    if (c === '(') depth += 1;
    if (c === ')') depth -= 1;
    if (depth === 0 && c === sep) {
      out.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function args(expr: string, name: string): string[] {
  return splitTop(expr.slice(name.length + 1, expr.lastIndexOf(')')));
}

function mix(a: Color, b: Color, t: number, space: string): Color {
  const mode = space === 'oklab' ? 'oklab' : space === 'oklch' ? 'oklch' : 'rgb';
  return rgb(interpolateWithPremultipliedAlpha([a, b], mode)(t)) ?? a;
}

export class Resolver {
  private readonly memo = new Map<string, Color[]>();

  private rule: IRule | null = null;

  constructor(
    private readonly ctx: IContext,
    private readonly local: Map<string, ILocal[]>,
  ) {}

  // Custom properties resolve from the rule being checked first, then its stylesheet, then any audited sheet.
  at(rule: IRule | null): this {
    if (rule !== this.rule) this.memo.clear();
    this.rule = rule;
    return this;
  }

  private defs(name: string): string[] {
    const all = this.local.get(name) ?? [];
    const rule = this.rule;
    const same = rule ? all.filter((d) => d.rule === rule) : [];
    const file = rule ? all.filter((d) => d.file === rule.file) : [];
    // A page that re-points a theme token (the /pro lamp picker) only shows lamps the contexts already cover.
    const token = name in this.ctx.vars;
    const own = same.length ? same : token ? [] : file.length ? file : all;
    if (own.length) {
      const matching = own.filter((d) => d.when === this.ctx.v || (d.when === 'dark' && this.ctx.v === 'oled'));
      const exact = matching.filter((d) => d.when === this.ctx.v);
      const pick = exact.length ? exact : matching.length ? matching : own.filter((d) => d.when === null);
      if (pick.length) return [...new Set(pick.map((d) => d.value))];
    }
    const value = this.ctx.vars[name];
    return value ? [value] : [];
  }

  // Resolves a custom property that holds a number or percentage (for color-mix weights).
  private scalar(expr: string, depth: number): string {
    const m = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/u.exec(expr.trim());
    if (!m) return expr.trim();
    const d = this.defs(m[1] as string)[0] ?? m[2];
    return d ? this.scalar(d, depth + 1) : expr;
  }

  colours(expr: string, depth = 0): Color[] {
    const e = expr.trim();
    const key = e;
    const hit = this.memo.get(key);
    if (hit) return hit;
    if (depth > 12) return [];
    let out: Color[] = [];
    const v = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/u.exec(e);
    if (v) {
      const defs = this.defs(v[1] as string);
      out = defs.length ? defs.flatMap((d) => this.colours(d, depth + 1)) : v[2] ? this.colours(v[2], depth + 1) : [];
    } else if (e.startsWith('light-dark(')) {
      const [a = '', b = ''] = args(e, 'light-dark');
      out = this.colours(this.ctx.v === 'light' ? a : b, depth + 1);
    } else if (e.startsWith('color-mix(')) {
      const [space = '', a = '', b = ''] = args(e, 'color-mix');
      const part = (s: string) => {
        const m = /^(.*?)(?:\s+(var\([^)]*\)|[\d.]+%))?$/u.exec(s) ?? [];
        const pct = m[2] ? Number.parseFloat(this.scalar(m[2], depth)) : Number.NaN;
        return { c: this.colours(m[1] ?? s, depth + 1), p: pct };
      };
      const A = part(a);
      const B = part(b);
      const pa = Number.isNaN(A.p) ? (Number.isNaN(B.p) ? 50 : 100 - B.p) : A.p;
      const mode = space.replace(/^in\s+/u, '').trim();
      for (const ca of A.c) for (const cb of B.c) out.push(mix(cb, ca, pa / 100, mode));
    } else if (/^(repeating-)?(linear|radial|conic)-gradient\(/u.test(e)) {
      const name = e.slice(0, e.indexOf('('));
      out = args(e, name).flatMap((stop) => {
        const head = splitTop(stop, ' ')[0] ?? '';
        return this.colours(stop.startsWith('var(') || stop.includes('(') ? firstColourToken(stop) : head, depth + 1);
      });
    } else if (splitTop(e).length > 1) {
      out = splitTop(e).flatMap((p) => this.colours(p, depth + 1));
    } else if (e === 'transparent') {
      out = [{ mode: 'rgb', r: 0, g: 0, b: 0, alpha: 0 }];
    } else {
      const words = splitTop(e, ' ');
      for (const w of words) {
        if (/^(var|light-dark|color-mix|rgba?|hsla?)\(/u.test(w)) {
          out = this.colours(w, depth + 1);
          if (out.length) break;
        }
        const c = /^(#|rgb|hsl)|^[a-z]+$/u.test(w) && w !== 'currentcolor' && w !== 'inherit' ? parse(w) : undefined;
        if (c) {
          out = [rgb(c)];
          break;
        }
      }
    }
    this.memo.set(key, out);
    return out;
  }
}

function firstColourToken(stop: string): string {
  const words = splitTop(stop, ' ');
  return words.find((w) => /^(var|light-dark|color-mix|rgba?|hsla?)\(|^#/u.test(w) || parse(w) !== undefined) ?? '';
}

export function over(fg: Color, bg: Color): Color {
  const f = rgb(fg);
  const b = rgb(bg);
  const a = f.alpha ?? 1;
  if (a >= 1) return f;
  return { mode: 'rgb', r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a) };
}

export const ratio = (fg: Color, bg: Color) => wcagContrast(over(fg, bg), bg);
export const hex = (c: Color) => formatHex8(c) ?? '?';
