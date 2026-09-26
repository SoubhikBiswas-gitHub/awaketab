import { readFileSync, writeFileSync } from 'node:fs';
const dir = '/home/user/awaketab/design/canvas/project/';
const src = readFileSync(dir + 'Extras.dc.html', 'utf8');
const markup = src.split('<script type="text/x-dc"')[0];

// Nesting balance.
for (const tag of ['sc-if', 'sc-for', 'div', 'section', 'button', 'svg', 'dl', 'p', 'span', 'header', 'nav', 'kbd', 'dt', 'dd', 'h2', 'a', 'label', 'textarea', 'output', 'g']) {
  const open = (markup.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
  const close = (markup.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (open !== close) console.log('UNBALANCED', tag, open, close);
}
// Stack check on sc-if / sc-for / div order.
{
  const stack = []; let ok = true;
  for (const m of markup.matchAll(/<(\/?)(sc-if|sc-for|div|section|dl)\b[^>]*>/g)) {
    if (!m[1]) stack.push(m[2]);
    else { const top = stack.pop(); if (top !== m[2]) { ok = false; console.log('MISNEST', top, m[2], m.index); break; } }
  }
  console.log('nesting ok:', ok && stack.length === 0);
}
// sc-if / sc-for hint attrs.
const noHint = [...markup.matchAll(/<sc-(if|for)\b[^>]*>/g)].filter((m) => !/hint-placeholder-(val|count)=/.test(m[0]));
console.log('sc tags missing hints:', noHint.length);

const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
const listeners = [];
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }), addEventListener: (n, f) => listeners.push(f), removeEventListener() {} };
const pending = [];
globalThis.setTimeout = (fn) => { pending.push(fn); return pending.length; };
globalThis.clearTimeout = () => {};
globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
const flush = () => { while (pending.length) pending.shift()(); };

// Map loop aliases to list paths.
const alias = {};
for (const m of markup.matchAll(/<sc-for\s+list="\{\{\s*([\w.$]+)\s*\}\}"\s+as="(\w+)"/g)) alias[m[2]] = m[1];
const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function itemsFor(name, v) {
  const path = alias[name]; const [head, ...rest] = path.split('.');
  if (alias[head]) return itemsFor(head, v).flatMap((it) => get(it, rest.join('.')) || []);
  return get(v, path) || [];
}
let bad = 0, checks = 0;
function check(v, label) {
  for (const h of holes) {
    const head = h.split('.')[0];
    if (['true', 'false', '$index'].includes(head)) continue;
    if (alias[head]) {
      const items = itemsFor(head, v);
      for (const it of items) { checks++; if (get(it, h.split('.').slice(1).join('.')) === undefined) { bad++; if (bad < 30) console.log('missing', h, label); } }
      continue;
    }
    checks++;
    if (get(v, h) === undefined) { bad++; if (bad < 30) console.log('missing', h, label); }
  }
}
const kinds = ['resume', 'secondtab', 'install', 'denied', 'rating', 'shortcuts', 'share', 'toast'];
for (const kind of kinds) for (const layout of ['phone', 'tablet', 'desktop']) for (const theme of ['auto', 'light', 'dark']) {
  const c = new Component({ kind, layout, theme });
  const label = kind + '/' + layout + '/' + theme;
  check(c.renderVals(), label);
  // Exercise every handler once, re-checking after each.
  let v = c.renderVals();
  for (const [k, f] of Object.entries(v)) {
    if (typeof f !== 'function' || ['onNote', 'selectAll', 'noop'].includes(k)) continue;
    const d = new Component({ kind, layout, theme });
    d.renderVals()[k](); flush(); check(d.renderVals(), label + ' after ' + k);
  }
}
console.log('holes:', holes.length, 'checks:', checks, 'missing:', bad);

// Interaction traces.
const show = (c, tag) => { const v = c.renderVals(); console.log(tag.padEnd(22), '|', v.statusLabel, '|', v.bigA + v.bigB, v.metaA, v.metaB, '|', v.showNote ? v.note : '-'); return v; };
let c = new Component({ kind: 'resume', layout: 'phone', theme: 'dark' });
let v = show(c, 'resume');
console.log('  banner:', 'You had ' + v.resumeLeft + ' left · until ' + v.resumeUntil, '/', 'Resume your ' + v.resumeLabel + ' session?');
v.resume(); flush(); show(c, 'resume > Resume');
c = new Component({ kind: 'resume' }); c.renderVals().startFresh(); v = show(c, 'resume > Start fresh'); console.log('  dock:', v.primaryLabel);
c = new Component({ kind: 'secondtab' }); c.renderVals().keepOther(); show(c, 'second > keep other');
c = new Component({ kind: 'secondtab' }); c.renderVals().useThis(); flush(); show(c, 'second > use this');
c = new Component({ kind: 'denied' }); v = show(c, 'denied'); v.useFallback(); v = show(c, 'denied > fallback'); console.log('  trackDash', v.trackDash);
c = new Component({ kind: 'denied' }); c.renderVals().retry(); flush(); show(c, 'denied > retry');
c = new Component({ kind: 'install', layout: 'desktop' }); v = c.renderVals(); console.log('install hdr btn', v.showInstallText, 'card', v.showInstall); v.installLater(); v = c.renderVals(); console.log('  later: card', v.showInstall, 'hdr', v.showInstallText); v.openInstall(); v = c.renderVals(); v.installNow(); v = c.renderVals(); console.log('  installed msg', v.showInstalled, 'hdr', v.showInstallText);
c = new Component({ kind: 'rating', layout: 'phone' }); v = show(c, 'rating'); console.log('  sheet', v.ratingSheet, 'dockSetup', v.dockSetup);
v.sendRating(); v = c.renderVals(); console.log('  send w/o stars err:', v.ratingErr);
v.stars[3].pick(); v = c.renderVals(); console.log('  stars pressed:', v.stars.map((x) => x.on).join(','), v.starWord);
v.onNote({ target: { value: 'x'.repeat(300) } }); v = c.renderVals(); console.log('  count', v.noteCount);
v.sendRating(); v = c.renderVals(); console.log('  label', v.sendLabel); flush(); v = c.renderVals(); console.log('  thanks', v.ratingThanks); v.ratingClose(); v = c.renderVals(); console.log('  closed sheet', v.ratingSheet, 'dock', v.dockSetup, v.primaryLabel);
c = new Component({ kind: 'share', layout: 'desktop' }); v = c.renderVals(); console.log('share', v.shareUrl, v.copyLabel); v.toggleAuto(); v = c.renderVals(); console.log('  auto', v.shareUrl, v.autoOn);
v.copy(); v = c.renderVals(); console.log('  copy', v.copyLabel, 'toasts', v.toasts.map((x) => x.text)); v.nativeShare(); v = c.renderVals(); console.log('  native', v.shareMsg);
c = new Component({ kind: 'shortcuts', layout: 'desktop' }); c.componentDidMount(); v = c.renderVals(); console.log('keys cols', v.keyCols.map((k) => k.rows.length));
listeners.at(-1)({ key: 'd', target: { tagName: 'BODY' } }); v = c.renderVals(); console.log('  press D hit row:', v.keyCols[1].rows[0].bg.includes('rgba'));
listeners.at(-1)({ key: 'Escape', target: { tagName: 'BODY' } }); v = c.renderVals(); console.log('  esc closes:', !v.keysOpen);
listeners.at(-1)({ key: '?', target: { tagName: 'BODY' } }); v = c.renderVals(); console.log('  ? opens:', v.keysOpen);
c = new Component({ kind: 'toast', layout: 'desktop' }); v = c.renderVals(); console.log('toasts', v.toasts.map((x) => x.role + ':' + x.text)); v.toasts[0].dismiss(); v = c.renderVals(); console.log('  after dismiss', v.toasts.length);

