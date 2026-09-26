// Tiny .dc.html loader + static renderer used by the smoke test and the measuring/screenshot script.
import { readFileSync } from 'node:fs';

export const PROJECT = '/home/user/awaketab/design/canvas/project/';

export function load(file, env = {}) {
  const src = readFileSync(PROJECT + file, 'utf8');
  const xdc = src.split('<x-dc>')[1].split('</x-dc>')[0];
  const helmet = xdc.split('<helmet>')[1].split('</helmet>')[0];
  const markup = xdc.split('</helmet>')[1];
  const tag = src.match(/<script type="text\/x-dc" data-dc-script data-props='([^']*)'>/);
  const props = JSON.parse(tag[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
  const js = src.split(tag[0])[1].split('</script>')[0];
  class DCLogic {
    constructor(p) { this.props = p; }
    setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; }
    forceUpdate() {}
  }
  const win = env.window ?? { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
  const Component = new Function('DCLogic', 'window', 'navigator', 'document', js + '\nreturn Component;')(DCLogic, win, env.navigator ?? {}, env.document ?? undefined);
  return { src, helmet, markup, props, Component };
}

function parseAttrs(s) {
  const out = {};
  for (const m of s.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

export function parse(src) {
  const re = /<sc-(for|if)\b([^>]*)>|<\/sc-(for|if)>/g;
  const root = { t: 'root', children: [] };
  const stack = [root];
  let last = 0, m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m.index > last) top.children.push({ t: 'text', s: src.slice(last, m.index) });
    if (m[1]) {
      const n = { t: m[1], attrs: parseAttrs(m[2]), children: [] };
      if (m[1] === 'if' && !('hint-placeholder-val' in n.attrs)) throw new Error('sc-if without hint: ' + m[0]);
      if (m[1] === 'for' && !('hint-placeholder-count' in n.attrs)) throw new Error('sc-for without hint: ' + m[0]);
      top.children.push(n);
      stack.push(n);
    } else {
      const n = stack.pop();
      if (n.t !== m[3]) throw new Error('mismatched </sc-' + m[3] + '> near ' + src.slice(m.index - 80, m.index));
    }
    last = re.lastIndex;
  }
  if (stack.length !== 1) throw new Error('unclosed sc-' + stack[stack.length - 1].t);
  root.children.push({ t: 'text', s: src.slice(last) });
  return root;
}

const HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
function lookup(path, scope) {
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  const parts = path.split('.');
  let v = scope;
  for (const k of parts) { if (v == null) return undefined; v = v[k]; }
  return v;
}
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render(node, scope, missing, ctx = 'root') {
  if (node.t === 'text') {
    // event attributes: drop, but check they resolve to functions
    let s = node.s.replace(/\s(on[A-Z]\w*)="\{\{\s*([\w.$]+)\s*\}\}"/g, (all, ev, p) => {
      const v = lookup(p, scope);
      if (typeof v !== 'function') missing.push(ev + '=' + p + ' (not a function) @' + ctx);
      return '';
    });
    return s.replace(HOLE, (all, p) => {
      const v = lookup(p, scope);
      if (v === undefined || v === null) { missing.push(p + ' @' + ctx); return ''; }
      if (typeof v === 'object' || typeof v === 'function') { missing.push(p + ' (is ' + typeof v + ') @' + ctx); return ''; }
      return esc(v);
    });
  }
  if (node.t === 'if') {
    const p = node.attrs.value.replace(HOLE, '$1');
    const v = lookup(p, scope);
    if (v === undefined) missing.push('sc-if ' + p + ' @' + ctx);
    return v ? node.children.map((c) => render(c, scope, missing, ctx)).join('') : '';
  }
  if (node.t === 'for') {
    const p = node.attrs.list.replace(HOLE, '$1');
    const list = lookup(p, scope);
    if (!Array.isArray(list)) { missing.push('sc-for ' + p + ' (not array) @' + ctx); return ''; }
    return list.map((item, i) => {
      const inner = Object.assign(Object.create(null), scope, { [node.attrs.as]: item, $index: i });
      return node.children.map((c) => render(c, inner, missing, ctx + '>' + node.attrs.as + i)).join('');
    }).join('');
  }
  return node.children.map((c) => render(c, scope, missing, ctx)).join('');
}

export function checkNesting(markup) {
  const errs = [];
  for (const tag of ['div', 'section', 'ol', 'ul', 'li', 'nav', 'header', 'footer', 'main', 'article', 'aside', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'button', 'a', 'span', 'p', 'label', 'svg', 'pre', 'code', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'form', 'select', 'output', 'figure', 'time', 'strong', 'g', 'dc-import']) {
    const open = (markup.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const close = (markup.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) errs.push(tag + ' open ' + open + ' close ' + close);
  }
  if (/<dc-import[^>]*\/>/.test(markup)) errs.push('self-closed dc-import');
  return errs;
}
