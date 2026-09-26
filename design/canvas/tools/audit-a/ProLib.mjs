// Shared helpers for the Pro boards: load a .dc.html, instantiate its Component, check holes,
// and expand the template into static HTML (for height measurement and screenshots).
import { readFileSync } from 'node:fs';

export const dir = new URL(process.env.DCDIR ? 'file://' + process.env.DCDIR : '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/', import.meta.url);

globalThis.window = globalThis.window ?? { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
export class DCLogic {
  constructor(p) { this.props = p; }
  setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; }
}

export function load(file) {
  const src = readFileSync(new URL(file, dir), 'utf8');
  const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
  const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  const body = src.split('<x-dc>')[1].split('</x-dc>')[0];
  const helmet = body.split('<helmet>')[1].split('</helmet>')[0];
  const markup = body.split('</helmet>')[1];
  const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
  return { src, Component, helmet, markup, holes };
}

const get = (scope, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
const literal = (p) => (p === 'true' ? true : p === 'false' ? false : /^-?\d+(\.\d+)?$/.test(p) ? Number(p) : undefined);
export const resolve = (scope, path) => { const l = literal(path); return l !== undefined ? l : get(scope, path); };

// Count holes that resolve to undefined, walking sc-for scopes properly.
export function missing(markup, vals) {
  const bad = [];
  walk(markup, vals, (path, scope) => { if (resolve(scope, path) === undefined) bad.push(path); }, true);
  return [...new Set(bad)];
}

function walk(src, scope, onHole, visitAll) {
  let out = '';
  let i = 0;
  const openRe = /<sc-(if|for)\b([^>]*)>/g;
  while (true) {
    openRe.lastIndex = i;
    const m = openRe.exec(src);
    if (!m) { out += subst(src.slice(i), scope, onHole); break; }
    out += subst(src.slice(i, m.index), scope, onHole);
    const tag = m[1];
    const attrs = m[2];
    // find matching close
    let depth = 1, k = m.index + m[0].length;
    const re = new RegExp('<sc-' + tag + '\\b[^>]*>|</sc-' + tag + '>', 'g');
    re.lastIndex = k;
    let c;
    while ((c = re.exec(src))) {
      if (c[0].startsWith('</')) { depth--; if (depth === 0) break; } else depth++;
    }
    if (!c) throw new Error('unbalanced sc-' + tag);
    const inner = src.slice(k, c.index);
    const hole = (name) => { const a = attrs.match(new RegExp(name + '="\\{\\{\\s*([\\w.$]+)\\s*\\}\\}"')); return a && a[1]; };
    if (tag === 'if') {
      const p = hole('value');
      onHole(p, scope);
      const v = resolve(scope, p);
      if (v || visitAll) {
        const r = walk(inner, scope, onHole, visitAll);
        if (v) out += r;
      }
    } else {
      const p = hole('list');
      onHole(p, scope);
      const as = attrs.match(/as="(\w+)"/)[1];
      const list = resolve(scope, p) ?? [];
      list.forEach((item, idx) => { out += walk(inner, { ...scope, [as]: item, $index: idx }, onHole, visitAll); });
    }
    i = c.index + c[0].length;
  }
  return out;
}

function subst(text, scope, onHole) {
  return text
    .replace(/\s(on[A-Z]\w*)="\{\{\s*([\w.$]+)\s*\}\}"/g, (all, ev, p) => { onHole(p, scope); return ''; })
    .replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (all, p) => {
      onHole(p, scope);
      const v = resolve(scope, p);
      return v === undefined || v === null ? '' : String(v).replace(/</g, '&lt;');
    });
}

export function toHtml(file, vals) {
  const { helmet, markup } = load(file);
  const body = walk(markup, vals, () => {}, false)
    .replace(/<dc-import[^>]*><\/dc-import>/g, '')
    .replace(/\s(readOnly|disabled)="false"/g, "").replace(/maxLength=/g, 'maxlength=').replace(/autoComplete=/g, 'autocomplete=').replace(/readOnly/g, 'readonly').replace(/spellCheck=/g, 'spellcheck=');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' + helmet + '<style>.at-root{height:auto!important} *{animation:none!important;transition:none!important}</style></head><body>' + body + '</body></html>';
}

export function balance(file) {
  const { markup } = load(file);
  const count = (re) => (markup.match(re) || []).length;
  const pairs = { 'sc-if': [/<sc-if\b/g, /<\/sc-if>/g], 'sc-for': [/<sc-for\b/g, /<\/sc-for>/g], div: [/<div\b/g, /<\/div>/g], section: [/<section\b/g, /<\/section>/g], article: [/<article\b/g, /<\/article>/g], button: [/<button\b/g, /<\/button>/g], a: [/<a\b/g, /<\/a>/g], span: [/<span\b/g, /<\/span>/g], ul: [/<ul\b/g, /<\/ul>/g], li: [/<li\b/g, /<\/li>/g], figure: [/<figure\b/g, /<\/figure>/g], p: [/<p[\s>]/g, /<\/p>/g], table: [/<table\b/g, /<\/table>/g], tr: [/<tr\b/g, /<\/tr>/g], td: [/<td\b/g, /<\/td>/g], th: [/<th\b/g, /<\/th>/g], form: [/<form\b/g, /<\/form>/g], svg: [/<svg\b/g, /<\/svg>/g], 'dc-import': [/<dc-import\b/g, /<\/dc-import>/g] };
  const off = [];
  for (const [k, [o, c]] of Object.entries(pairs)) if (count(o) !== count(c)) off.push(k + ' ' + count(o) + '/' + count(c));
  return off;
}
