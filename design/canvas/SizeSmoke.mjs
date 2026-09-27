// Wave 3 (TOOL-SIZES): writes the Size*/Edge* wrapper boards, then smoke-tests Main.dc.html across
// status x face x layout x theme x sheet x edge (+ panels), runs the interactions, and checks every wrapper.
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { dir, load, missing, balance } from './ProLib.mjs';

// 1. Wrappers.
const SIZE = { phone: [390, 844], small: [320, 568], landscape: [844, 390], tablet: [820, 1180], tabletLandscape: [1180, 820], desktop: [1280, 800], xl: [1920, 1080] };
const wrap = (file, title, props) => {
  const [w, h] = SIZE[props.layout ?? 'phone'];
  writeFileSync(new URL(file, dir), `<!doctype html>
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
<dc-import name="Main" ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')} hint-size="${w}px,${h}px"></dc-import>
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
  return { file, w, h, title };
};
export const WRAPS = [
  wrap('SizeSmallDark.dc.html', 'small screen dark', { layout: 'small', status: 'awake', face: 'ring', theme: 'dark' }),
  wrap('SizeSmallLight.dc.html', 'small screen light', { layout: 'small', status: 'ready', face: 'ring', theme: 'light' }),
  wrap('SizeLandscape.dc.html', 'phone landscape dark', { layout: 'landscape', status: 'awake', face: 'bold', theme: 'dark' }),
  wrap('SizeLandscapeLight.dc.html', 'phone landscape light', { layout: 'landscape', status: 'ready', face: 'tide', theme: 'light' }),
  wrap('SizeTabletLandscape.dc.html', 'tablet landscape', { layout: 'tabletLandscape', status: 'awake', face: 'horizon', theme: 'light', phase: 'day' }),
  wrap('SizeXL.dc.html', 'large display dark', { layout: 'xl', status: 'awake', face: 'ring', theme: 'dark' }),
  wrap('SizeXLLight.dc.html', 'large display light', { layout: 'xl', status: 'awake', face: 'tide', theme: 'light' }),
  wrap('EdgeLastMinute.dc.html', 'final minute', { status: 'awake', face: 'ring', theme: 'dark', edge: 'lastminute' }),
  wrap('EdgeMultiDay.dc.html', 'multi-day session', { status: 'awake', face: 'bold', theme: 'light', edge: 'multiday' }),
  wrap('EdgeUntilPassed.dc.html', 'until a time that passed', { status: 'ready', face: 'ring', theme: 'dark', edge: 'untilpassed' }),
  wrap('EdgeLongNoLimit.dc.html', 'no limit for over a day', { layout: 'desktop', status: 'awake', face: 'ring', theme: 'light', edge: 'longnolimit' }),
  wrap('EdgeDeferred.dc.html', 'opened in a background tab', { status: 'ready', face: 'ring', theme: 'dark', edge: 'deferred' }),
  wrap('EdgeOffline.dc.html', 'offline', { status: 'awake', face: 'tide', theme: 'light', edge: 'offline' }),
  wrap('EdgeLowBattery.dc.html', 'stopped on low battery', { status: 'ended', face: 'ring', theme: 'dark', edge: 'lowbattery' }),
  wrap('EdgeOled.dc.html', 'OLED black', { status: 'awake', face: 'ring', theme: 'oled' }),
  wrap('EdgeReturn.dc.html', 'back from a hidden tab', { layout: 'desktop', status: 'awake', face: 'horizon', theme: 'light', phase: 'day', edge: 'hiddenreturn' })
];

// 2. Structure.
let bad = 0;
const fail = (m) => { bad++; if (bad < 40) console.log('FAIL', m); };
const main = load('Main.dc.html');
const off = balance('Main.dc.html');
if (off.length) fail('Main unbalanced: ' + off.join(', '));
for (const tag of ['header', 'nav', 'output', 'label', 'dl', 'kbd', 'time', 'p', 'h2', 'h3']) {
  const o = (main.markup.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length, c = (main.markup.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (o !== c) fail('Main unbalanced ' + tag + ' ' + o + '/' + c);
}
for (const m of main.markup.matchAll(/<sc-if\b[^>]*>/g)) if (!/hint-placeholder-val=/.test(m[0])) fail('sc-if without hint ' + m[0]);
for (const m of main.markup.matchAll(/<sc-for\b[^>]*>/g)) if (!/hint-placeholder-count=/.test(m[0])) fail('sc-for without hint ' + m[0]);
if (/\{\{[^}]*[^\w.$\s}][^}]*\}\}/.test(main.markup)) fail('expression in hole');
const PROPS = JSON.parse(main.src.split("data-props='")[1].split("'>")[0]);

// 3. Every combination.
const PILLS = ['Ready', 'Starting…', 'Screen awake', 'Paused — tab hidden', "Blocked — here's the fix", 'Tap to use the fallback', 'Awake via video fallback'];
const O = (k) => PROPS[k].options;
let combos = 0;
const t0 = Date.now();
const check = (props, patch, tag) => {
  const c = new main.Component(props);
  if (patch) Object.assign(c.state, patch);
  const v = c.renderVals();
  const miss = missing(main.markup, v);
  combos++;
  if (miss.length) fail((tag || '') + JSON.stringify(props) + ' missing: ' + miss.join(', '));
  if (!PILLS.includes(v.statusLabel)) fail('pill ' + v.statusLabel);
  return [c, v];
};
for (const status of O('status')) for (const face of O('face')) for (const layout of O('layout')) for (const theme of O('theme')) for (const sheet of O('sheet')) for (const edge of O('edge'))
  check({ status, face, layout, theme, sheet, edge, phase: 'auto' });
for (const status of O('status')) for (const layout of O('layout')) for (const panel of O('panel')) for (const edge of O('edge')) for (const phase of O('phase'))
  check({ status, face: 'horizon', layout, theme: 'auto', panel, edge, phase });
console.log('combos', combos, 'in', Date.now() - t0, 'ms');

// 4. Interactions.
const C = main.Component;
{ // Small (batch 1a): all seven presets in two rows; More… holds only Until… / Custom…; mini readout while a panel is open.
  const c = new C({ layout: 'small', theme: 'dark' });
  let v = c.renderVals();
  const lab = (x) => x.gridItems.map((i) => i.label).join(' ');
  if (lab(v) !== '15 min 30 min 45 min 1 h 2 h 4 h ∞ More…') fail('small presets ' + lab(v));
  if (v.gridItems[6].aria !== 'Until I stop') fail('small ∞ name ' + v.gridItems[6].aria);
  v.gridItems[4].pick(); v = c.renderVals();
  if (v.primaryLabel !== 'Keep awake · 2 hours' || v.gridItems[4].sel !== 'true') fail('small pick 2 h ' + v.primaryLabel);
  v.gridItems[7].pick(); v = c.renderVals();
  if (!v.panelMore || !v.isMini || v.showDial) fail('small more panel');
  v.openCustom(); v = c.renderVals(); v.more(); v = c.renderVals(); v.closePanel(); v = c.renderVals();
  if (v.gridItems[7].label !== 'Custom' || v.gridItems[7].sel !== 'true' || !v.panelNone || v.primaryLabel !== 'Keep awake · 50 min') fail('small custom via More… ' + v.gridItems[7].label + ' ' + v.primaryLabel);
  console.log('small:', lab(v), '|', v.primaryLabel, '| face', v.boxW, v.boxH, v.scale);
}
{ // Until a time that already passed today -> tomorrow, honest question, change time.
  const c = new C({ layout: 'phone', theme: 'dark' });
  let v = c.renderVals();
  v.openUntil(); v = c.renderVals();
  const d = new Date(Date.now() - 3600000);
  const val = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  v.setUntilTime({ target: { value: val } }); v = c.renderVals();
  if (!v.untilPast || v.untilSlotsOn || !/ is tomorrow\. Keep awake until then\?$/.test(v.pastQ) || !/tomorrow$/.test(v.primaryLabel)) fail('until past ' + v.pastQ + ' | ' + v.primaryLabel);
  console.log('until past:', v.pastQ, '|', v.pastIn, '|', v.primaryLabel);
  v.changeTime(); v = c.renderVals();
  if (v.untilPast || !v.untilSlotsOn) fail('change time');
  const e = new C({ edge: 'untilpassed', theme: 'light' }); const ev = e.renderVals();
  if (!ev.untilPast || !ev.panelUntil) fail('edge untilpassed');
  console.log('edge untilpassed:', ev.pastQ, '|', ev.primaryLabel, '| note shown:', ev.showNote);
}
{ // Custom climbs past 12 h in 1 h steps and caps at 7 days.
  const c = new C({ panel: 'custom' });
  c.state.custom = 715; c.state.preset = 'custom';
  let v = c.renderVals();
  v.more(); v = c.renderVals(); v.more(); v = c.renderVals();
  if (v.customWords !== '13 hours' || v.moreAria !== '1 hour more') fail('custom step ' + v.customWords);
  c.state.custom = 10070; v = c.renderVals(); v.more(); v = c.renderVals(); v.more(); v = c.renderVals();
  if (c.state.custom !== 10080 || v.customWords !== '7 days') fail('custom cap ' + v.customWords);
  c.state.custom = 1560; v = c.renderVals();
  console.log('custom:', v.customWords, '|', v.primaryLabel);
}
{ // Multi-day and long no-limit formats.
  const m = new C({ edge: 'multiday' }).renderVals();
  if (!/^1d \d\d:\d\d$/.test(m.bigA) || !m.note.startsWith('Until ') || !m.note.includes(' · ')) fail('multiday ' + m.bigA + m.bigB + ' ' + m.note);
  console.log('multiday:', m.bigA + m.bigB, '|', m.kicker, m.metaA, m.metaB, '|', m.note, '|', m.timerAria, '|', m.ofTotal);
  const n = new C({ edge: 'longnolimit', layout: 'desktop' }).renderVals();
  if (n.bigA !== '1d 03:14' || n.metaA !== 'since') fail('longnolimit ' + n.bigA);
  console.log('longnolimit:', n.bigA + n.bigB, '|', n.kicker, n.metaA, n.metaB, '|', n.note, '|', n.timerAria);
}
{ // Final minute arrives through play and hands over to the extend prompt.
  const c = new C({ status: 'awake' });
  c.state.left = 62; c.tick(); let v = c.renderVals();
  if (v.final || v.announce) fail('not final at 61');
  c.tick(); v = c.renderVals();
  if (!v.final || v.announce !== '1 minute left' || v.kicker !== 'Final minute') fail('final at 60');
  console.log('final:', v.bigA + v.bigB, '|', v.kicker, '|', v.note, '| aria', v.announce, '| digits', v.numColor, v.ringW);
  for (let i = 0; i < 60; i++) c.tick();
  v = c.renderVals();
  if (!v.dockAsk || v.final || v.announce) fail('final -> timesup ' + c.state.mode);
}
{ // Deferred: Ready pill + secondary line, start clears it.
  const c = new C({ edge: 'deferred' });
  let v = c.renderVals();
  if (v.statusLabel !== 'Ready' || !v.deferred || !/Starts when you open this tab/.test(v.announce) || !v.primaryLabel.startsWith('Start now')) fail('deferred');
  console.log('deferred:', v.statusLabel, '+ "Starts when you open this tab" |', v.note, '|', v.primaryLabel);
  v.start(); v = c.renderVals();
  if (v.deferred || v.statusLabel !== 'Starting…') fail('deferred start');
}
{ // Low battery: stopped, honest card, Start anyway.
  const c = new C({ edge: 'lowbattery', layout: 'small' });
  let v = c.renderVals();
  if (v.statusLabel !== 'Ready' || !v.isLowBatt || !v.dockBatt || v.dockSetup || v.showLength) fail('lowbattery');
  console.log('lowbattery:', v.kicker, v.bigA + v.bigB, v.metaA, v.metaB, '|', v.timerAria);
  v.openSettings(); v = c.renderVals(); if (!v.sheetSettings || v.sw.batt.on !== 'true') fail('battery settings');
  v.closeSheet(); v.start(); v = c.renderVals();
  if (v.isLowBatt || v.statusLabel !== 'Starting…') fail('start anyway');
}
{ // Offline and return toasts; real visibility round trip.
  const c = new C({ edge: 'offline' });
  let v = c.renderVals();
  if (v.toasts.length !== 1 || !v.toasts[0].text.startsWith("You're offline")) fail('offline toast');
  v.toasts[0].dismiss(); v = c.renderVals(); if (v.toasts.length) fail('offline dismiss');
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const r = new C({ status: 'awake' });
  r.componentDidMount();
  document.visibilityState = 'hidden'; r.onVis(); v = r.renderVals();
  if (v.statusLabel !== 'Paused — tab hidden') fail('hide -> paused ' + v.statusLabel);
  r.state.hiddenAt = Date.now() - 5000;
  document.visibilityState = 'visible'; r.onVis(); v = r.renderVals();
  if (v.statusLabel !== 'Starting…' || v.toasts[0]?.text !== 'Re-acquiring the wake lock') fail('return re-acquiring ' + v.statusLabel);
  r.reacquired(); v = r.renderVals();
  if (v.statusLabel !== 'Screen awake' || v.toasts[0]?.text !== 'Screen awake again') fail('return toast');
  console.log('return:', v.statusLabel, '|', v.toasts.map((x) => x.text).join(' / '));
  r.componentWillUnmount();
  const p = new C({ status: 'paused' }); p.componentDidMount(); document.visibilityState = 'visible'; p.onVis();
  if (p.renderVals().statusLabel !== 'Paused — tab hidden') fail('seeded paused must stay paused');
  p.componentWillUnmount();
  const e = new C({ edge: 'hiddenreturn' }).renderVals();
  if (e.toasts.length !== 1) fail('edge hiddenreturn');
}
{ // Compact theme button cycles on small.
  const c = new C({ layout: 'small', theme: 'auto' });
  const seq = [];
  for (let i = 0; i < 4; i++) { const v = c.renderVals(); seq.push(c.state.theme); v.cycleTheme(); }
  if (seq.join(',') !== 'auto,light,dark,auto') fail('theme cycle ' + seq);
}
{ // Existing props still behave as before (gen.mjs flow).
  const c = new C({});
  let v = c.renderVals();
  v.openUntil(); v = c.renderVals(); v.openCustom(); v = c.renderVals(); v.more(); v = c.renderVals();
  if (v.customWords !== '50 min') fail('legacy custom ' + v.customWords);
  c.state.preset = 'p30'; c.start(); c.state.mode = 'awake'; c.tick(); v = c.renderVals();
  v.extend(); v = c.renderVals(); if (v.ofTotal !== 'of 45 min') fail('legacy extend ' + v.ofTotal);
  v.stop(); v = c.renderVals(); if (v.statusLabel !== 'Ready') fail('legacy stop');
  for (const [l, w, h] of [['phone', '390px', '844px'], ['tablet', '820px', '1180px'], ['desktop', '1280px', '800px']]) {
    const g = new C({ layout: l }).renderVals();
    if (g.W !== w || g.H !== h) fail('legacy size ' + l);
  }
}

{ // Batch 1a decisions: first visit (O-70), ∞ CTA (O-87), detected blocked cause (O-76), Stop -> Done receipt (O-73), 60 s grace (O-08).
  const f = new C({ edge: 'firstvisit' }).renderVals();
  if (f.statusLabel !== 'Screen awake' || !/^Started for you · asked at /.test(f.note)) fail('firstvisit ' + f.note);
  const c = new C({}); c.state.preset = 'pinf'; let v = c.renderVals();
  if (v.primaryLabel !== 'Keep awake · ∞' || v.primaryAria !== 'Keep awake until I stop') fail('∞ CTA ' + v.primaryLabel);
  const b = new C({ status: 'blocked' }).renderVals();
  if (!b.causeKnown || !/Safari needs one tap/.test(b.causeLine) || b.causes.length) fail('blocked cause');
  const d = new C({ status: 'awake' }); d.renderVals().stop(); v = d.renderVals();
  if (!v.showReceipt || v.rc.big !== '6' || v.statusLabel !== 'Ready') fail('stop -> receipt ' + v.rc.big);
  const t = new C({ status: 'timesup' }).renderVals(); if (t.askLeft !== 60) fail('grace ' + t.askLeft);
  console.log('decisions:', f.note, '|', v.rc.big + v.rc.unit, v.rc.heldLegend, '| blocked:', b.causeLine);
}

// 5. Every board that mounts Main (existing and new) passes valid props and resolves.
const files = readdirSync(dir).filter((f) => f.endsWith('.dc.html') && f !== 'Main.dc.html');
let mounts = 0;
for (const f of files) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  for (const m of src.matchAll(/<dc-import name="Main"([^>]*)><\/dc-import>/g)) {
    mounts++;
    const props = {};
    for (const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) if (a[1] !== 'hint-size') props[a[1].replace(/-(\w)/g, (x, y) => y.toUpperCase())] = a[2];
    for (const [k, val] of Object.entries(props)) {
      if (val.includes('{{')) continue;
      if (PROPS[k]?.options && !PROPS[k].options.includes(val) && PROPS[k].editor === 'enum') fail(f + ' bad ' + k + '=' + val);
      if (!PROPS[k]) fail(f + ' unknown prop ' + k);
    }
    const [, v] = check(Object.fromEntries(Object.entries(props).filter(([, x]) => !x.includes('{{'))), null, f + ' ');
    const hint = m[1].match(/hint-size="(\d+)px,(\d+)px"/);
    if (hint && !/\{\{/.test(m[1]) && (v.W !== hint[1] + 'px' || v.H !== hint[2] + 'px')) fail(f + ' hint-size ' + hint[1] + 'x' + hint[2] + ' vs ' + v.W + 'x' + v.H);
  }
  if (/^(Size|Edge)/.test(f)) { const o = balance(f); if (o.length) fail(f + ' unbalanced ' + o.join(', ')); }
}
console.log('boards mounting Main:', mounts, 'across', files.length, 'files');
console.log('TOTAL combos', combos, 'missing/failures:', bad);
process.exit(bad ? 1 : 0);
