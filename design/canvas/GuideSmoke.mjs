// Smoke test for Guide*, PresetPage and UntilPage: every prop combination resolves every {{hole}},
// tags balance, handlers work. With --measure, renders each layout in Chromium and reports natural heights.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dir, load, missing, balance, toHtml } from './ProLib.mjs';

let bad = 0, combos = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
const THEMES = ['auto', 'light', 'dark'], LAYOUTS = ['phone', 'tablet', 'desktop'];
const FILES = ['GuideOn', 'GuideVs', 'GuideLearn', 'GuideGuides', 'PresetPage', 'UntilPage'].map((f) => f + '.dc.html');
const check = (file, props, patch) => {
  const { Component, markup } = load(file);
  const c = new Component(props);
  if (patch) Object.assign(c.state, patch);
  const v = c.renderVals();
  const miss = missing(markup, v);
  combos++;
  if (miss.length) fail(file + ' ' + JSON.stringify(props) + ' ' + JSON.stringify(patch ?? {}) + ' missing: ' + miss.join(', '));
  return { c, v };
};

for (const f of FILES) { const off = balance(f); if (off.length) fail(f + ' unbalanced: ' + off.join(', ')); }

// 1. Prop matrix.
for (const theme of THEMES) for (const layout of LAYOUTS) {
  for (const status of ['ready', 'awake']) {
    for (const stale of [false, true]) check('GuideOn.dc.html', { theme, layout, status, stale });
    check('GuideVs.dc.html', { theme, layout, status });
    for (const copied of [null, 'c1', 'c3']) check('GuideLearn.dc.html', { theme, layout, status }, { copied });
    for (const done of [[false, false, false, false], [true, false, false, false], [true, true, true, true]]) check('GuideGuides.dc.html', { theme, layout, status }, { done });
    for (const clock of ['auto', 'evening', 'morning']) check('UntilPage.dc.html', { theme, layout, status, clock });
    for (const mode of ['starting']) check('GuideOn.dc.html', { theme, layout, status }, { mode });
  }
  check('PresetPage.dc.html', { theme, layout });
}

// 2. Handlers.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
{
  const { Component } = load('GuideOn.dc.html');
  const c = new Component({ layout: 'phone', theme: 'dark' });
  let v = c.renderVals();
  if (v.statusLabel !== 'Ready' || v.primaryLabel !== 'Keep awake · 30 min') fail('on ready ' + v.primaryLabel);
  console.log('GuideOn ready:', v.statusLabel, '|', v.primaryLabel, '|', v.kicker, v.bigA + v.bigB, v.metaA, v.metaB, '|', v.verifiedLabel, '| presets', v.presets.map((p) => p.label).join(' '));
  v.presets[0].pick(); v = c.renderVals(); if (v.primaryLabel !== 'Keep awake · 15 min') fail('pick 15');
  v.start(); v = c.renderVals(); if (v.statusLabel !== 'Starting…') fail('starting');
  await wait(950); c.tick(); v = c.renderVals();
  if (v.statusLabel !== 'Screen awake' || !v.isRunning) fail('awake');
  console.log('  awake:', v.statusLabel, v.bigA + v.bigB, v.metaA, v.metaB, '|', v.note);
  v.extend(); v = c.renderVals(); console.log('  +15:', v.bigA + v.bigB);
  v.presets[4].pick(); v = c.renderVals(); c.tick(); v = c.renderVals(); console.log('  no limit while running:', v.kicker, v.bigA + v.bigB, v.metaA, v.metaB, 'extend?', v.canExtend);
  v.stop(); v = c.renderVals(); if (v.statusLabel !== 'Ready') fail('stop');
  v.faq[1].toggle(); v = c.renderVals(); if (!v.faq[1].isOpen || v.faq[0].isOpen) fail('faq');
  v.toc[2].pick(); v = c.renderVals(); if (v.toc[2].current !== 'location') fail('toc');
  v.setLight(); v = c.renderVals(); if (!v.themeLight) fail('theme');
  const st = new Component({ stale: true }).renderVals();
  console.log('  stale:', st.isStale, st.verifiedLabel, '| works rows', st.works.length, st.works.map((w) => w.label).join(', '));
}
{
  const { Component } = load('GuideVs.dc.html');
  const v = new Component({ layout: 'desktop' }).renderVals();
  console.log('GuideVs:', v.rows.length, 'rows,', v.rows.filter((r) => r.same).length, 'same |', v.primaryLabel, '|', v.toc.map((x) => x.label).join(' / '));
}
{
  const { Component } = load('GuideLearn.dc.html');
  const c = new Component({ layout: 'phone', theme: 'light' });
  let v = c.renderVals();
  console.log('GuideLearn:', Object.keys(v).filter((k) => /^c\d$/.test(k)).map((k) => k + ' ' + v[k].file + ' ' + v[k].lines.length + ' lines').join(', '));
  const line = v.c1.lines[7].toks.map((x) => x.x).join('');
  if (line !== "    sentinel = await navigator.wakeLock.request('screen');") fail('tokens roundtrip: ' + line);
  const html = v.c3.lines[0].toks.map((x) => x.x).join('');
  if (!html.startsWith('<iframe src=')) fail('html roundtrip ' + html);
  console.log('  c1 line 8 tokens:', v.c1.lines[7].toks.map((x) => x.x + '|' + x.c).join('  '));
  v.c2.copy(); v = c.renderVals(); if (v.c2.label !== 'Copied' || v.c1.label !== 'Copy') fail('copy');
  console.log('  copy:', v.c2.label, v.c2.aria);
  await wait(2050); v = c.renderVals(); if (v.c2.label !== 'Copy') fail('copy reset');
  console.log('  chains:', v.chains.map((ch) => ch.items.map((i) => i.label).join(' > ')).join(' || '));
}
{
  const { Component } = load('GuideGuides.dc.html');
  const c = new Component({ layout: 'desktop', theme: 'dark' });
  let v = c.renderVals();
  console.log('GuideGuides:', v.progLabel, '| current', v.steps.findIndex((s) => s.isCurrent) + 1, '| prog', v.prog);
  v.steps[1].toggle(); v = c.renderVals(); console.log('  +step2:', v.progLabel, v.steps.map((s) => s.mark).join(' '));
  v.steps[2].toggle(); c.renderVals().steps[3].toggle(); v = c.renderVals();
  if (!v.allDone || v.progLabel !== 'All 4 steps done') fail('all done');
  console.log('  all:', v.progLabel, v.allDone);
  v.reset(); v = c.renderVals(); if (v.prog !== '0.000') fail('reset');
}
{
  const { Component } = load('PresetPage.dc.html');
  for (const layout of LAYOUTS) { const v = new Component({ layout, theme: 'dark' }).renderVals(); console.log('Preset', layout, v.W, v.H, 'main', v.hint, v.mainTheme); }
}
{
  const { Component } = load('UntilPage.dc.html');
  for (const clock of ['evening', 'morning']) {
    const c = new Component({ layout: 'phone', theme: 'light', clock });
    let v = c.renderVals();
    console.log('Until', clock, '|', v.nowTime, '|', v.primaryLabel, '|', v.whenLine, '|', v.metaA, v.metaB, v.bigA + v.bigB, '|', v.note, '|', v.times.map((x) => x.label + ' ' + x.sub).join(', '));
    v.start(); await wait(950); v = c.renderVals();
    console.log('  running:', v.statusLabel, v.bigA + v.bigB, v.metaA, v.metaB, v.note);
    v.extend(); v = c.renderVals(); console.log('  +15:', v.metaB, v.chipLabel);
    v.stop(); v = c.renderVals(); console.log('  stopped:', v.statusLabel, v.primaryLabel);
  }
}
console.log('combos checked:', combos, 'failures:', bad);

// 3. Optional measurement.
if (process.argv.includes('--measure')) {
  const require = createRequire('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const out = {};
  for (const file of FILES) for (const layout of LAYOUTS) {
    const { Component } = load(file);
    const c = new Component({ layout, theme: 'dark', status: 'ready', stale: true });
    if (file.startsWith('GuideGuides')) c.state.done = [true, true, false, false];
    const vals = c.renderVals();
    const tmp = new URL('./.guide-render.html', import.meta.url);
    writeFileSync(tmp, toHtml(file, vals));
    const w = parseInt(vals.W, 10);
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(tmp.href);
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const root = document.querySelector('.at-root');
      const W = root.getBoundingClientRect().width;
      const over = [...root.querySelectorAll('*')].filter((e) => {
        const b = e.getBoundingClientRect();
        if (!b.width) return false;
        let a = e.parentElement;
        while (a && a !== root) { const cs = getComputedStyle(a); if (cs.overflowX === 'auto' || cs.overflowX === 'hidden') return false; a = a.parentElement; }
        return b.right > W + 1 || b.left < -1;
      }).slice(0, 6).map((e) => e.tagName + ':' + (e.textContent || '').trim().slice(0, 40));
      return { h: Math.ceil(root.getBoundingClientRect().height), over };
    });
    console.log(file, layout, 'natural', r.h, r.over.length ? 'OVERFLOW ' + r.over.join(' | ') : '');
    (out[file] ??= {})[layout] = [w, r.h];
    if (process.argv.includes('--shots')) await page.screenshot({ path: new URL('./shots/guide-' + file.replace('.dc.html', '') + '-' + layout + '.png', import.meta.url).pathname, fullPage: true });
    await page.close();
  }
  await browser.close();
  writeFileSync(new URL('./GuideMeasured.json', import.meta.url), JSON.stringify(out, null, 1));
}
