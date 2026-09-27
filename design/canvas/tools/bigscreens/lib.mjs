// Big-screens agent helpers: load a .dc.html, check holes, expand to static HTML (with dc-import children).
import { load, missing, balance, resolve } from '../directions/ProLib.mjs';
export { load, missing, balance };

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function walk(src, scope) {
  let out = '';
  let i = 0;
  const openRe = /<sc-(if|for)\b([^>]*)>/g;
  for (;;) {
    openRe.lastIndex = i;
    const m = openRe.exec(src);
    if (!m) { out += subst(src.slice(i), scope); break; }
    out += subst(src.slice(i, m.index), scope);
    const tag = m[1];
    let depth = 1, k = m.index + m[0].length, c;
    const re = new RegExp('<sc-' + tag + '\\b[^>]*>|</sc-' + tag + '>', 'g');
    re.lastIndex = k;
    while ((c = re.exec(src))) { if (c[0].startsWith('</')) { if (--depth === 0) break; } else depth++; }
    const inner = src.slice(k, c.index);
    const hole = (name) => { const a = m[2].match(new RegExp(name + '="\\{\\{\\s*([\\w.$]+)\\s*\\}\\}"')); return a && a[1]; };
    if (tag === 'if') { if (resolve(scope, hole('value'))) out += walk(inner, scope); }
    else {
      const as = m[2].match(/as="(\w+)"/)[1];
      (resolve(scope, hole('list')) ?? []).forEach((item, idx) => { out += walk(inner, { ...scope, [as]: item, $index: idx }); });
    }
    i = c.index + c[0].length;
  }
  return out;
}

function subst(text, scope) {
  // dc-import: keep raw values for props bound with a whole hole.
  text = text.replace(/<dc-import([^>]*)><\/dc-import>/g, (all, attrs) => {
    const props = {};
    for (const a of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) {
      const w = a[2].match(/^\{\{\s*([\w.$]+)\s*\}\}$/);
      props[camel(a[1])] = w ? resolve(scope, w[1]) : a[2];
    }
    return '<dc-child data-props="' + encodeURIComponent(JSON.stringify(props)) + '"></dc-child>';
  });
  return text
    .replace(/\s(on[A-Z]\w*)="\{\{\s*([\w.$]+)\s*\}\}"/g, '')
    .replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (all, p) => { const v = resolve(scope, p); return v == null ? '' : String(v).replace(/</g, '&lt;'); });
}

export function expand(file, props, helmets = new Set(), patch) {
  const { Component, helmet, markup } = load(file);
  helmets.add(helmet);
  const c = new Component(props);
  if (patch) Object.assign(c.state, patch);
  const vals = c.renderVals();
  let html = walk(markup, vals);
  html = html.replace(/<dc-child data-props="([^"]*)"><\/dc-child>/g, (all, enc) => {
    const p = JSON.parse(decodeURIComponent(enc));
    return expand(p.name + '.dc.html', p, helmets).html;
  });
  return { html, vals };
}

export function toPage(file, props, patch) {
  const helmets = new Set();
  const { html, vals } = expand(file, props, helmets, patch);
  return { vals, page: '<!doctype html><html lang="en"><head><meta charset="utf-8">' + [...helmets].join('\n') + '<style>*{animation:none!important;transition:none!important}</style></head><body>' + html.replace(/\s(readOnly|disabled)="false"/g, '') + '</body></html>' };
}
