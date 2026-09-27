// Content agent: writes wrapper boards, then smoke-tests ContentArticle, HubFor and HomeBelow.
import { readFileSync, writeFileSync } from 'node:fs';
const D = '/home/user/awaketab/design/canvas/project/';

// 1. Wrappers (same shape as gen.mjs).
const wrap = (file, name, title, props, w, h) => writeFileSync(D + file, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · ${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>body{margin:0}</style>
</helmet>
<div style="width: ${w}px; height: ${h}px">
<dc-import name="${name}" ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')} hint-size="${w}px,${h}px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`);
// Fix batch 1b sizes (natural content heights, measured with measure.mjs).
const SZ = JSON.parse(readFileSync(new URL('./sizes.json', import.meta.url), 'utf8'));
const W = { phone: 390, tablet: 820, desktop: 1280 };
const boards = [
  ['ContentArticlePhoneDark.dc.html', 'ContentArticle', 'cooking phone dark', { layout: 'phone', theme: 'dark', status: 'ready' }],
  ['ContentArticlePhoneLight.dc.html', 'ContentArticle', 'cooking phone light', { layout: 'phone', theme: 'light', status: 'awake' }],
  ['ContentArticleTablet.dc.html', 'ContentArticle', 'cooking tablet', { layout: 'tablet', theme: 'light', status: 'ready' }],
  ['ContentArticleDeskDark.dc.html', 'ContentArticle', 'cooking desktop dark', { layout: 'desktop', theme: 'dark', status: 'awake' }],
  ['ContentArticleDeskLight.dc.html', 'ContentArticle', 'cooking desktop light', { layout: 'desktop', theme: 'light', status: 'ready' }],
  ['HubForPhone.dc.html', 'HubFor', 'use cases phone', { layout: 'phone', theme: 'dark' }],
  ['HubForDesk.dc.html', 'HubFor', 'use cases desktop', { layout: 'desktop', theme: 'light' }],
  ['HomeBelowPhone.dc.html', 'HomeBelow', 'home below the tool phone', { layout: 'phone', theme: 'dark' }],
  ['HomeBelowDesk.dc.html', 'HomeBelow', 'home below the tool desktop', { layout: 'desktop', theme: 'light' }]
];
for (const [file, name, title, props] of boards) wrap(file, name, title, props, W[props.layout], SZ[name][props.layout]);
const END_TOP = 6344; // top of #home-faq on the phone layout (measure.mjs)
const PH = SZ.HomeBelow.phone, EH = PH - END_TOP;
writeFileSync(D + 'HomeBelowPhoneEnd.dc.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · home below the tool phone end</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>body{margin:0}</style>
</helmet>
<div style="width: 390px; height: ${EH}px; overflow: hidden">
<div style="margin-top: -${END_TOP}px; width: 390px; height: ${PH}px">
<dc-import name="HomeBelow" layout="phone" theme="dark" hint-size="390px,${PH}px"></dc-import>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":${EH}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`);
console.log('wrappers written:', boards.length + 1, 'HomeBelowPhoneEnd', 390 + 'x' + EH);

// 2. Logic smoke test.
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
const timers = [];
globalThis.setTimeout = (fn) => { timers.push(fn); return timers.length; };
globalThis.clearTimeout = () => {};
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const load = (name) => {
  const src = readFileSync(D + name + '.dc.html', 'utf8');
  const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
  const markup = src.split('<script type="text/x-dc"')[0];
  const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  // Holes, with loop-variable prefixes resolved against the first item of their list.
  const loops = {};
  for (const m of markup.matchAll(/<sc-for list="\{\{\s*([\w.$]+)\s*\}\}" as="(\w+)"/g)) loops[m[2]] = m[1];
  const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
  // Balance checks.
  const count = (re) => (markup.match(re) || []).length;
  const bal = { 'sc-if': [count(/<sc-if\b/g), count(/<\/sc-if>/g)], 'sc-for': [count(/<sc-for\b/g), count(/<\/sc-for>/g)], div: [count(/<div\b/g), count(/<\/div>/g)], section: [count(/<section\b/g), count(/<\/section>/g)], button: [count(/<button\b/g), count(/<\/button>/g)], a: [count(/<a\b/g), count(/<\/a>/g)], span: [count(/<span\b/g), count(/<\/span>/g)], ul: [count(/<ul\b/g), count(/<\/ul>/g)], li: [count(/<li\b/g), count(/<\/li>/g)] };
  for (const tg of ['ol', 'dl', 'dt', 'dd', 'p', 'h2', 'h3', 'nav', 'aside', 'figure', 'header', 'footer', 'article', 'strong', 'svg', 'kbd', 'output']) bal[tg] = [count(new RegExp('<' + tg + '\\b', 'g')), count(new RegExp('</' + tg + '>', 'g'))];
  const unbalanced = Object.entries(bal).filter(([, [o, c]]) => o !== c);
  const hintless = count(/<sc-if(?![^>]*hint-placeholder-val)[^>]*>/g) + count(/<sc-for(?![^>]*hint-placeholder-count)[^>]*>/g);
  const emDash = [...markup.matchAll(/[^>]*—[^<]*/g)].map((m) => m[0].trim()).filter((x) => !/Paused — tab hidden|Blocked — here's the fix|Paused — tap to resume/.test(x));
  return { Component, holes, loops, unbalanced, hintless, emDash };
};
const resolve = (v, h, loops) => {
  const parts = h.split('.');
  if (['true', 'false'].includes(parts[0])) return true;
  if (parts[0] === '$index') return 0;
  let base = v;
  if (loops[parts[0]]) {
    let list = resolve(v, loops[parts[0]], loops);
    if (!Array.isArray(list)) return undefined;
    if (!list.length) return 'empty-list';
    base = { [parts[0]]: list[0] };
  }
  return parts.reduce((o, k) => (o == null ? o : o[k]), base);
};

let missing = 0, combos = 0;
const results = {};
for (const name of ['ContentArticle', 'HubFor', 'HomeBelow']) {
  const { Component, holes, loops, unbalanced, hintless, emDash } = load(name);
  results[name] = { holes: holes.length, unbalanced, hintless, emDash };
  for (const layout of ['phone', 'tablet', 'desktop'])
    for (const theme of ['auto', 'light', 'dark'])
      for (const status of ['ready', 'awake']) {
        const c = new Component({ layout, theme, status });
        const v = c.renderVals();
        combos++;
        for (const h of holes) {
          const val = resolve(v, h, loops);
          if (val === undefined) { missing++; if (missing < 30) console.log('missing', name, h, layout, theme, status); }
        }
        if (v.W !== W[layout] + 'px' || v.H !== SZ[name][layout] + 'px') { missing++; console.log('size mismatch', name, layout, v.W, v.H); }
      }
}
console.log('combos:', combos, 'holes per file:', Object.fromEntries(Object.entries(results).map(([k, r]) => [k, r.holes])), 'missing:', missing);
for (const [k, r] of Object.entries(results)) console.log(k, 'unbalanced:', JSON.stringify(r.unbalanced), 'sc-* without hints:', r.hintless, 'em dashes in new copy:', JSON.stringify(r.emDash));

// 3. Interactions: article tool start/stop, kitchen timers, cook pause, FAQ, checklist, TOC, theme.
{
  const { Component } = load('ContentArticle');
  const c = new Component({ layout: 'desktop', theme: 'auto' });
  let v = c.renderVals();
  console.log('article ready:', v.statusLabel, v.bigA + v.bigB, '|', v.metaA, '| setup', v.isSetup, '| faq open', v.faq.map((f) => f.open).join(','));
  v.start(); v = c.renderVals(); console.log('after start:', v.statusLabel);
  timers.shift()(); c.tick(); c.tick(); c.tick(); v = c.renderVals();
  console.log('awake + 3 ticks:', v.statusLabel, v.bigA + v.bigB, '|', v.metaA, v.metaB, '| running', v.isRunning, '| bead', v.tone);
  v.quick[1].add(); v = c.renderVals(); v.quick[0].add(); v = c.renderVals(); c.tick(); v = c.renderVals();
  console.log('timers:', v.timers.map((k) => k.text + ' (' + k.aria + ')').join(', '));
  v.quick[2].add(); v = c.renderVals(); v.quick[3].add(); v = c.renderVals();
  console.log('max 3 timers:', v.timers.length, 'quick disabled:', v.quick[0].disabled);
  v.timers[0].remove(); v = c.renderVals(); console.log('after remove:', v.timers.length);
  v.togglePause(); c.tick(); v = c.renderVals(); console.log('cook paused:', v.bigA + v.bigB, '|', v.note, '|', v.clockAria);
  v.togglePause(); c.tick(); v = c.renderVals(); console.log('resumed:', v.bigA + v.bigB);
  v.faq[1].toggle(); v = c.renderVals(); console.log('faq after toggle 1:', v.faq.map((f) => f.open).join(','));
  v.faq[1].toggle(); v = c.renderVals(); console.log('faq after toggle 1 again:', v.faq.map((f) => f.open).join(','));
  v.checks[2].toggle(); v = c.renderVals(); console.log('checklist:', v.checkCount);
  v.toc[3].pick(); v = c.renderVals(); console.log('toc current:', v.toc.find((x) => x.current === 'location').label);
  v.setLight(); v = c.renderVals(); console.log('theme light:', v.t.surface, v.themeX);
  v.stop(); v = c.renderVals(); console.log('after stop:', v.statusLabel, v.bigA + v.bigB, '| setup', v.isSetup);
}
{
  const { Component } = load('HubFor');
  const c = new Component({ layout: 'phone', theme: 'dark' });
  let v = c.renderVals();
  console.log('hub groups:', v.groups.map((g) => g.title + ' ' + g.items.length).join(' | '), '| total', v.groups.reduce((n, g) => n + g.items.length, 0));
  v.start(); timers.shift()(); c.tick(); c.tick(); v = c.renderVals(); console.log('hub teaser:', v.statusLabel, v.bigA + v.bigB);
  v.stop(); v = c.renderVals(); console.log('hub teaser stop:', v.statusLabel);
  v.jumps[2].pick(); v = c.renderVals(); console.log('jump:', v.jumpX, v.jumps[2].current);
  console.log('cooking href:', v.groups[0].items[0].href);
}
{
  const { Component } = load('HomeBelow');
  const c = new Component({ layout: 'desktop', theme: 'light' });
  let v = c.renderVals();
  console.log('home states:', v.states.map((s) => s.label).join(' · '));
  v.faq[4].toggle(); v = c.renderVals(); console.log('home faq:', v.faq.map((f) => f.open).join(','));
  console.log('matrix rows:', v.matrix.length, 'scenario links:', v.scenarios.length);
}
