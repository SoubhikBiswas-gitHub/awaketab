// Smoke test for every Page*.dc.html: all prop combinations render with 0 missing holes, tags balance,
// handlers work (library state machine + code tabs, kiosk URL builder, 404 mini tool, filters, TOC).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load, parse, render, checkNesting, PROJECT } from './dc.mjs';
import { WRAPS } from './wrappers.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGES = {
  PageKiosk: { licensed: [false, true] },
  PageLibrary: {},
  PageExtension: {},
  PageAbout: {},
  PageChangelog: {},
  PageLegal: { doc: ['privacy', 'terms'] },
  Page404: {}
};
let missing = 0, combos = 0, holes = 0;
const combosOf = (extra) => {
  let out = [{}];
  for (const theme of ['auto', 'light', 'dark']) void theme;
  const axes = Object.assign({ theme: ['auto', 'light', 'dark'], layout: ['phone', 'tablet', 'desktop'], sys: [true, false], language: ['closed', 'open'] }, extra);
  for (const [k, vs] of Object.entries(axes)) out = out.flatMap((o) => vs.map((v) => ({ ...o, [k]: v })));
  return out;
};
const renderCheck = (name, markup, c, label) => {
  const miss = [];
  render(parse(markup), c.renderVals(), miss);
  if (miss.length) { missing += miss.length; console.log('MISSING', name, label, miss.slice(0, 5)); }
};

for (const [name, extra] of Object.entries(PAGES)) {
  const file = name + '.dc.html';
  const base = load(file);
  const nest = checkNesting(base.markup);
  assert.deepEqual(nest, [], name + ' nesting: ' + nest.join(', '));
  holes += new Set([...base.markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1])).size;
  for (const props of combosOf(extra)) {
    const { sys, ...p } = props;
    const { Component } = load(file, { window: { matchMedia: () => ({ matches: sys, addEventListener() {}, removeEventListener() {} }) } });
    const c = new Component(p);
    c.componentDidMount?.();
    const v = c.renderVals();
    const dark = p.theme === 'dark' || (p.theme === 'auto' && sys);
    assert.equal(v.dark, dark, name + ' theme resolution');
    renderCheck(name, base.markup, c, JSON.stringify(props));
    // theme switch handlers
    v.setLight(); assert.equal(c.renderVals().dark, false); c.renderVals().setDark(); assert.equal(c.renderVals().dark, true); c.renderVals().setAuto();
    c.componentWillUnmount?.();
    combos++;
  }
}

// Wrapper sizes match the component's natural board size.
for (const [file, comp, , props, w, h] of WRAPS) {
  const { Component } = load(comp + '.dc.html');
  const v = new Component(props).renderVals();
  assert.equal(v.W, w + 'px', file + ' width');
  assert.equal(v.H, h + 'px', file + ' height');
  const src = readFileSync(PROJECT + file + '.dc.html', 'utf8');
  assert.ok(src.includes(`name="${comp}"`) && !/<dc-import[^>]*\/>/.test(src), file + ' import');
}

// ---- Library: state machine across scenarios, code tabs.
{
  const { markup, Component } = load('PageLibrary.dc.html');
  const c = new Component({ layout: 'desktop', theme: 'dark' });
  const v = () => c.renderVals();
  const pick = (scen) => v().pickScenario({ target: { value: scen } });
  const trail = () => c.state.log.slice().reverse().map((e) => e.to).join('>');

  pick('simulated');
  v().hide(); assert.equal(c.state.lock, 'idle', 'hide does nothing while idle');
  v().request(); assert.equal(c.state.lock, 'requesting');
  await sleep(400); assert.equal(c.state.lock, 'held');
  renderCheck('PageLibrary', markup, c, 'held');
  v().hide(); assert.equal(c.state.lock, 'lost'); assert.equal(c.state.advice, 'hidden_document');
  renderCheck('PageLibrary', markup, c, 'lost');
  v().show(); assert.equal(c.state.lock, 'requesting');
  await sleep(400); assert.equal(c.state.lock, 'held');
  v().release(); assert.equal(c.state.lock, 'idle');
  console.log('simulated:', trail(), '|', v().log.map((l) => l.time + ' ' + l.from + '→' + l.to + ' (' + l.why + ')')[0]);

  pick('denied');
  assert.equal(c.state.log.length, 0, 'scenario change resets log');
  v().request(); await sleep(400);
  assert.equal(c.state.lock, 'denied'); assert.equal(v().advice, 'battery_saver'); assert.equal(v().hasAdvice, true);
  renderCheck('PageLibrary', markup, c, 'denied');
  console.log('denied:', trail(), '| advice', v().advice, '| simOff', v().simOff);

  pick('unsupported');
  v().request(); assert.equal(c.state.lock, 'unsupported'); await sleep(450); assert.equal(c.state.lock, 'fallback');
  renderCheck('PageLibrary', markup, c, 'fallback');
  console.log('unsupported:', trail());

  pick('real'); // navigator stub has no wakeLock
  v().request(); await sleep(450);
  console.log('real (no API):', trail());
  assert.equal(c.state.lock, 'fallback');

  // Real API present: grant, then platform release, then denial.
  const sentinels = [];
  const nav = { wakeLock: { request: () => { const s = new EventTarget(); s.release = () => s.dispatchEvent(new Event('release')); sentinels.push(s); return Promise.resolve(s); } } };
  const { Component: C2 } = load('PageLibrary.dc.html', { navigator: nav, document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} } });
  const r = new C2({});
  r.renderVals().request(); await sleep(10);
  assert.equal(r.state.lock, 'held');
  sentinels[0].dispatchEvent(new Event('release')); assert.equal(r.state.lock, 'lost');
  r.renderVals().release(); assert.equal(r.state.lock, 'idle');
  console.log('real (API):', r.state.log.slice().reverse().map((e) => e.to + '(' + e.reason + ')').join(' > '));
  const nav2 = { wakeLock: { request: () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })) } };
  const { Component: C3 } = load('PageLibrary.dc.html', { navigator: nav2, window: { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }), self: 1, top: 1 } });
  const d = new C3({}); d.renderVals().request(); await sleep(10);
  assert.equal(d.state.lock, 'denied'); console.log('real (denied):', d.state.advice);

  // Code tabs
  for (const tab of v().tabs) {
    tab.pick();
    const vv = v();
    assert.ok(vv.lines.length > 3 && vv.fileName, 'tab ' + tab.label);
    renderCheck('PageLibrary', markup, c, 'tab ' + tab.label);
    vv.copyCode();
    assert.equal(c.state.codeCopied, true);
    console.log('tab', tab.label, vv.fileName, vv.lines.length + ' lines, selected', vv.tabs.find((x) => x.sel === 'true').label, 'tabX', vv.tabX);
  }
}

// ---- Kiosk URL builder
{
  const { markup, Component } = load('PageKiosk.dc.html');
  const c = new Component({ layout: 'phone', theme: 'light' });
  const v = () => c.renderVals();
  assert.equal(v().fullUrl, 'https://awaketab.com/?autostart=1&mode=message&msg=Welcome.+Please+ring+the+bell.&theme=dark');
  v().modeSeg.items[1].pick(); v().lenSeg.items[1].pick(); v().themeSeg.items[3].pick(); v().toggleAuto();
  assert.equal(v().fullUrl, 'https://awaketab.com/?autostart=0&preset=p60&mode=clock&theme=oled');
  v().setLogo({ target: { value: 'http://x.com/a.png' } }); assert.equal(v().fullUrl.includes('logo='), false);
  v().setLogo({ target: { value: 'https://example.com/logo.png' } });
  v().setToken({ target: { value: 'not a token' } }); assert.equal(v().fullUrl.includes('#lic='), false); assert.equal(v().showMark, true);
  v().setToken({ target: { value: 'aaa.bbb.ccc' } }); assert.ok(v().fullUrl.endsWith('#lic=aaa.bbb.ccc')); assert.equal(v().showLogo, true); assert.equal(v().showMark, false);
  for (const m of v().modeSeg.items) { m.pick(); renderCheck('PageKiosk', markup, c, 'mode ' + m.id); }
  v().copy(); assert.equal(v().copyLabel, 'Copied');
  console.log('kiosk url:', v().fullUrl);
}

// ---- 404 mini tool
{
  const { markup, Component } = load('Page404.dc.html');
  const c = new Component({ layout: 'phone', theme: 'dark' });
  c.componentDidMount();
  let v = c.renderVals();
  assert.equal(v.statusLabel, 'Ready');
  v.start(); v = c.renderVals(); assert.equal(v.statusLabel, 'Starting…');
  await sleep(2100);
  v = c.renderVals();
  assert.equal(v.statusLabel, 'Screen awake'); assert.ok(c.state.left < 1800, 'time ticks');
  renderCheck('Page404', markup, c, 'awake');
  console.log('404:', v.statusLabel, v.bigA + v.bigB, v.metaA, v.metaB, '| bead', v.bead);
  v.extend(); assert.ok(c.state.left > 2600);
  c.renderVals().stop(); assert.equal(c.renderVals().statusLabel, 'Ready');
  c.componentWillUnmount();
}

// ---- Changelog filter, Legal TOC, Extension level
{
  const { markup, Component } = load('PageChangelog.dc.html');
  const c = new Component({ layout: 'phone', theme: 'dark' });
  for (const f of c.renderVals().filters) {
    f.pick();
    const v = c.renderVals();
    renderCheck('PageChangelog', markup, c, 'filter ' + f.label);
    console.log('changelog', f.label, f.count, '→', v.groups.reduce((n, g) => n + g.items.length, 0) + (v.showRelease ? 1 : 0), 'entries,', v.groups.map((g) => g.date).join(' / '));
  }
  const L = load('PageLegal.dc.html');
  const l = new L.Component({ doc: 'privacy', layout: 'desktop', theme: 'light' });
  l.renderVals().toc[3].pick();
  assert.equal(l.renderVals().toc[3].cur, 'location');
  console.log('legal:', l.renderVals().updated, '| toc', l.renderVals().toc.map((x) => x.title).length, 'items');
  const E = load('PageExtension.dc.html');
  const e = new E.Component({ layout: 'desktop', theme: 'light' });
  e.renderVals().levels[1].pick();
  const ev = e.renderVals();
  assert.equal(ev.levelPill, 'System awake'); assert.equal(ev.popStatus, 'system'); assert.equal(ev.levelBadge, 'SYS');
  renderCheck('PageExtension', E.markup, e, 'system');
}

// ---- Footer language switcher (PRIMITIVES.md P-LANG): 8 locales in order, current row, locale-home links, open/close.
{
  const ORDER = 'English|Español|Português (Brasil)|Deutsch|Français|日本語|简体中文|हिन्दी';
  const HOME = ['', '/es/', '/pt-br/', '/de/', '/fr/', '/ja/', '/zh/', '/hi/'];
  const PATH = { Page404: '/', PageAbout: '/about', PageChangelog: '/changelog', PageExtension: '/extension', PageKiosk: '/kiosk', PageLibrary: '/library' };
  for (const name of Object.keys(PAGES)) {
    const { src, markup, Component } = load(name + '.dc.html');
    assert.ok(src.includes('AT-LANG v1') && markup.includes('onKeyDown="{{lang.key}}"') && src.includes('.at-chev{'), name + ' lang markup');
    for (const layout of ['phone', 'tablet', 'desktop']) {
      const c = new Component({ layout, theme: 'dark', doc: 'terms' });
      let v = c.renderVals();
      assert.equal(v.lang.open, false); assert.equal(v.lang.label, 'English'); assert.equal(v.lang.aria, 'Language: English');
      assert.equal(v.lang.rows.map((r) => r.name).join('|'), ORDER, name + ' order');
      const path = PATH[name] || '/terms';
      v.lang.rows.forEach((r, i) => {
        assert.equal(r.href, i ? HOME[i] : path, name + ' href ' + i);
        assert.equal(r.hreflang, i ? '' : 'en', name + ' hreflang ' + i);
        assert.equal(r.cur, i ? 'false' : 'true');
        assert.equal(r.note, i ? 'Translation in review' : 'Current');
      });
      v.lang.toggle(); v = c.renderVals();
      assert.equal(v.lang.open, true); assert.equal(v.lang.sheet, layout === 'phone'); assert.equal(v.lang.pop, layout !== 'phone');
      assert.equal(v.lang.expanded, 'true'); assert.equal(v.lang.role, layout === 'phone' ? 'dialog' : 'group');
      renderCheck(name, markup, c, 'lang open ' + layout);
      v.lang.key({ key: 'Escape', preventDefault() {}, currentTarget: { querySelector: () => ({ focus() {} }) } });
      assert.equal(c.renderVals().lang.open, false, name + ' Esc closes');
      const o = new Component({ layout, language: 'open' });
      assert.equal(o.renderVals().lang.open, true, name + ' language=open seeds');
    }
  }
  console.log('lang: 7 pages × 3 layouts, 8 locales in order, locale-home links, Esc closes');
}

console.log('pages', Object.keys(PAGES).length, '· prop combinations', combos, '· distinct holes', holes, '· missing', missing);
if (missing) process.exit(1);
