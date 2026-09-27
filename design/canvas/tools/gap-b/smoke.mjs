// Gap agent B smoke test (writes nothing): ContentArticle, HubFor (5 hubs), HomeBelow, PresetPage, UntilPage and
// every wrapper that mounts them. Checks holes, tag balance, hints, SIZES vs wrapper sizes, P-LANG behaviour and hub data.
// usage: node smoke.mjs
import { readFileSync, readdirSync } from 'node:fs';
const D = '/home/user/awaketab/design/canvas/project/';
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
globalThis.document = { querySelector: () => ({ focus() {} }), activeElement: null };
const timers = [];
globalThis.setTimeout = (fn) => { timers.push(fn); return timers.length; };
globalThis.clearTimeout = () => {};
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const load = (name) => {
  const src = readFileSync(D + name + '.dc.html', 'utf8');
  const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
  const markup = src.split('<script type="text/x-dc"')[0];
  const Component = new Function('DCLogic', js + '\nreturn { Component, SIZES };')(DCLogic);
  const loops = {};
  for (const m of markup.matchAll(/<sc-for list="\{\{\s*([\w.$]+)\s*\}\}" as="(\w+)"/g)) loops[m[2]] = m[1];
  const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
  const count = (re) => (markup.match(re) || []).length;
  const tags = ['sc-if', 'sc-for', 'div', 'section', 'button', 'a', 'span', 'ul', 'li', 'nav', 'footer', 'p', 'h2'];
  const unbalanced = tags.filter((t) => count(new RegExp('<' + t + '\\b', 'g')) !== count(new RegExp('</' + t + '>', 'g')));
  const hintless = count(/<sc-if(?![^>]*hint-placeholder-val)[^>]*>/g) + count(/<sc-for(?![^>]*hint-placeholder-count)[^>]*>/g);
  const props = JSON.parse(/data-props='([^']*)'/.exec(src)[1]);
  return { ...Component, holes, loops, unbalanced, hintless, props, src };
};
const resolve = (v, h, loops) => {
  const parts = h.split('.');
  if (['true', 'false'].includes(parts[0])) return true;
  let base = v;
  if (loops[parts[0]]) {
    const list = resolve(v, loops[parts[0]], loops);
    if (!Array.isArray(list)) return undefined;
    if (!list.length) return 'empty-list';
    base = { [parts[0]]: list[0] };
  }
  return parts.reduce((o, k) => (o == null ? o : o[k]), base);
};
const size = (S, props, layout) => { const x = S.for ? S[props.hub || 'for'][layout || 'phone'] : S[layout || 'phone']; return Array.isArray(x) ? x[1] : x; };
let fail = 0; const bad = (...m) => { fail++; if (fail < 40) console.log('FAIL', ...m); };
const BASES = { ContentArticle: { status: ['ready', 'awake'] }, HubFor: { hub: ['for', 'on', 'vs', 'guides', 'learn'] }, HomeBelow: {}, PresetPage: {}, UntilPage: { status: ['ready', 'awake'], clock: ['evening', 'morning'] } };
let combos = 0;
for (const [name, extra] of Object.entries(BASES)) {
  const L = load(name);
  if (L.unbalanced.length) bad(name, 'unbalanced', L.unbalanced);
  if (L.hintless) bad(name, 'sc-* without hints', L.hintless);
  if (!L.props.language || L.props.language.options.join() !== 'closed,open') bad(name, 'language prop');
  if (!/AT-LANG v1/.test(L.src) || !/onKeyDown="\{\{lang.key\}\}"/.test(L.src)) bad(name, 'P-LANG missing');
  const keys = Object.keys(extra); const vals = keys.map((k) => extra[k]);
  const cart = vals.reduce((a, vs) => a.flatMap((x) => vs.map((v) => [...x, v])), [[]]);
  for (const layout of ['phone', 'tablet', 'desktop']) for (const theme of ['auto', 'light', 'dark']) for (const language of ['closed', 'open']) for (const c of cart) {
    const props = { layout, theme, language, ...Object.fromEntries(keys.map((k, i) => [k, c[i]])) };
    const comp = new L.Component(props); const v = comp.renderVals(); combos++;
    for (const h of L.holes) if (resolve(v, h, L.loops) === undefined) bad(name, 'hole', h, JSON.stringify(props));
    const H = size(L.SIZES, props, layout);
    if (v.H !== H + 'px' && v.H !== undefined) bad(name, 'H', v.H, H, JSON.stringify(props));
    if (H > 8000) bad(name, 'taller than 8000', H);
    const g = v.lang;
    if (g.open !== (language === 'open')) bad(name, 'langOpen seed', JSON.stringify(props));
    if (g.rows.length !== 8 || g.rows.map((r) => r.name).join('|') !== 'English|Español|Português (Brasil)|Deutsch|Français|日本語|简体中文|हिन्दी') bad(name, 'rows');
    if (g.rows.filter((r) => r.cur === 'true').length !== 1 || g.label !== 'English' || g.aria !== 'Language: English') bad(name, 'current');
    if (g.sheet !== (layout === 'phone' && language === 'open')) bad(name, 'sheet', JSON.stringify(props));
  }
  // behaviour: toggle, Escape, arrows
  const comp = new L.Component({ layout: 'desktop', theme: 'dark', ...Object.fromEntries(keys.map((k) => [k, extra[k][0]])) });
  let v = comp.renderVals(); v.lang.toggle(); v = comp.renderVals();
  if (!v.lang.open || v.lang.expanded !== 'true' || v.lang.chev !== 'rotate(180deg)') bad(name, 'toggle open');
  const rows = [{ focus() { document.activeElement = rows[0]; } }, { focus() { document.activeElement = rows[1]; } }];
  const box = { querySelectorAll: () => rows, querySelector: () => ({ focus() {} }) };
  document.activeElement = rows[0]; v.lang.key({ key: 'ArrowDown', currentTarget: box, preventDefault() {} });
  if (document.activeElement !== rows[1]) bad(name, 'ArrowDown');
  v.lang.key({ key: 'ArrowDown', currentTarget: box, preventDefault() {} });
  if (document.activeElement !== rows[0]) bad(name, 'ArrowDown wrap');
  v.lang.key({ key: 'Escape', currentTarget: box, preventDefault() {} }); v = comp.renderVals();
  if (v.lang.open) bad(name, 'Escape closes');
  console.log(name, 'holes', L.holes.length, '| hrefs', v.lang.rows.map((r) => r.href).join(' '));
}
// Hub data
{
  const L = load('HubFor');
  for (const hub of ['for', 'on', 'vs', 'guides', 'learn']) {
    const v = new L.Component({ hub, layout: 'desktop', theme: 'light' }).renderVals();
    const n = v.groups.reduce((a, g) => a + g.items.length, 0);
    const txt = JSON.stringify(v.groups) + v.hub.lead + v.hub.note;
    if (/—/.test(txt)) bad('HubFor', hub, 'em dash');
    if (/in our (tests|checks)|battery saver (denies|blocks)|Battery Saver denies|on a shelf/i.test(txt)) bad('HubFor', hub, 'unbacked claim');
    if (v.jumps.length !== v.jumpN || v.jumps.filter((j) => j.current === 'location').length !== 1) bad('HubFor', hub, 'jumps');
    console.log('hub', hub, '|', v.hub.h1, '|', v.groups.map((g) => g.title + ' ' + g.count).join(' · '), '| items', n, '| nav current', v.navs.filter((x) => x.on).map((x) => x.label).join() || 'none', '| lang path', v.lang.rows[1].href);
  }
}
// Wrappers: size = base SIZES for its props, same in hint-size and $preview.
const bases = Object.fromEntries(Object.keys(BASES).map((n) => [n, load(n)]));
let wraps = 0;
for (const f of readdirSync(D).filter((f) => f.endsWith('.dc.html'))) {
  const s = readFileSync(D + f, 'utf8');
  const m = /<dc-import name="(ContentArticle|HubFor|HomeBelow|PresetPage|UntilPage)" ([^>]*)hint-size="(\d+)px,(\d+)px"><\/dc-import>/.exec(s);
  if (!m || Object.keys(BASES).includes(f.replace('.dc.html', ''))) continue;
  wraps++;
  const props = Object.fromEntries([...m[2].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
  const H = size(bases[m[1]].SIZES, props, props.layout);
  const box = /<div style="width: (\d+)px; height: (\d+)px/.exec(s); const pv = /"\$preview":\{"width":(\d+),"height":(\d+)\}/.exec(s);
  const crop = /margin-top: -(\d+)px/.exec(s);
  if (+m[4] !== H) bad(f, 'hint height', m[4], 'base', H);
  if (+box[2] + (crop ? +crop[1] : 0) !== H || box[2] !== pv[2] || box[1] !== pv[1] || box[1] !== m[3]) bad(f, 'box/preview', box[1], box[2], pv[1], pv[2]);
}
console.log('combos', combos, '| wrappers checked', wraps, '| failures', fail);
process.exit(fail ? 1 : 0);
