// Smoke test for the big-screens boards: every prop combination, every {{hole}} resolves, handlers run, tags balance.
import { readFileSync, existsSync } from 'node:fs';
import { load, missing, balance } from './lib.mjs';
import { WRAPPERS } from './wrappers.mjs';

const dir = new URL('../directions/project/', import.meta.url);
let bad = 0, combos = 0;
const combosOf = (spec) => Object.entries(spec).reduce((acc, [k, vs]) => acc.flatMap((a) => vs.map((v) => ({ ...a, [k]: v }))), [{}]);
const check = (file, props, patch) => {
  const { Component, markup } = load(file);
  const c = new Component(props);
  if (patch) Object.assign(c.state, patch);
  const v = c.renderVals();
  const m = missing(markup, v);
  combos++;
  if (m.length) { bad += m.length; console.log('MISSING', file, JSON.stringify(props), m.join(', ')); }
  return { c, v };
};

const SPECS = {
  'KioskScreen.dc.html': { size: ['tv', 'portrait'], mode: ['clock', 'message', 'logo', 'dashboard-overlay'], theme: ['auto', 'light', 'dark', 'oled'], licensed: [true, false, 'true', 'false'], status: ['awake', 'fallback', 'paused'] },
  'EmbedEdge.dc.html': { edge: ['noallow', 'unsupported', 'battery', 'sidebar', 'running'], host: ['light', 'dark'], licensed: [true, false], theme: ['auto', 'light', 'dark'], layout: ['phone', 'tablet', 'desktop'] },
  'EmbedCook.dc.html': { size: ['compact', 'full'], state: ['idle', 'running', 'paused', 'timerdone'], theme: ['auto', 'light', 'dark', 'oled'] },
  'OgCards.dc.html': { kind: ['home', 'article', 'device', 'vs', 'pro', 'preset'], theme: ['auto', 'light', 'dark'] },
  'StoreAssets.dc.html': { kind: ['shot1', 'shot2', 'shot3', 'shot4', 'shot5', 'promo', 'marquee'], theme: ['auto', 'light', 'dark'] },
  'IconSet.dc.html': { theme: ['auto', 'light', 'dark'] }
};
for (const [file, spec] of Object.entries(SPECS)) {
  for (const props of combosOf(spec)) check(file, props);
  const off = balance(file);
  if (off.length) { bad++; console.log('UNBALANCED', file, off.join(', ')); }
  const src = readFileSync(new URL(file, dir), 'utf8');
  if (/—/.test(src.replace(/Paused — tab hidden|Blocked — here's the fix|Welcome&nbsp;— please ring the bell|Done — AwakeTab|Paused — tap to resume the timer|' — done'|Timer 1 — done/g, ''))) console.log('NOTE em dash left in', file);
}

// Kiosk: preview countdown runs out and falls back to the clock; burn-in shift steps; dashboard Stop/Start.
{
  const { c } = check('KioskScreen.dc.html', { mode: 'message', licensed: false });
  for (let i = 0; i < 45; i++) c.tick();
  let v = c.renderVals();
  console.log('kiosk preview:', v.showMessage ? 'message' : 'clock', '| ended note:', v.showEndedNote, '| status:', v.statusLabel, '|', v.statusMeta);
  c.setState({ shift: 3 }); v = c.renderVals(); console.log('kiosk shift:', v.shiftX, v.shiftY);
  const d = check('KioskScreen.dc.html', { mode: 'dashboard-overlay', licensed: true }).c;
  let dv = d.renderVals(); dv.toggleRun(); dv = d.renderVals(); console.log('kiosk dashboard stop:', dv.statusLabel, dv.wBtnLabel, '| attribution:', dv.showAttrib);
  const p = check('KioskScreen.dc.html', { mode: 'clock', status: 'paused' }).v; console.log('kiosk paused:', p.statusLabel, '|', p.statusMeta);
}
// Embed edge: Start on each edge, copy, host and licence switches.
for (const edge of ['noallow', 'unsupported', 'battery', 'sidebar', 'running']) {
  const { c } = check('EmbedEdge.dc.html', { edge });
  let v = c.renderVals();
  const before = v.statusLabel;
  v.primary(); v = c.renderVals();
  const mid = v.statusLabel;
  clearTimeout(c.boot);
  if (c.state.lock === 'requesting') c.setState({ lock: edge === 'noallow' || edge === 'battery' ? 'denied' : 'held' });
  v = c.renderVals();
  console.log('embed', edge.padEnd(11), '|', before, '->', mid, '->', v.statusLabel, '| notice:', v.showNotice ? v.noticeText.slice(0, 40) : '-', '| btn:', v.btnLabel);
  v.copy(); clearTimeout(c.copyT); v.hostOpts[1].pick(); v.licOpts[1].pick(); v = c.renderVals();
  if (v.copyLabel !== 'Copied' || c.state.host !== 'dark' || c.state.licensed !== true || v.showAttrib) { bad++; console.log('embed controls failed', edge); }
  combos++;
}
// Embed cook: start, add timers up to three, tap to pause, remove, stop.
{
  const { c } = check('EmbedCook.dc.html', { size: 'full', state: 'idle' });
  let v = c.renderVals();
  v.quick[0].add(); clearTimeout(c.boot); c.setState({ lock: 'held' });
  v = c.renderVals(); v.quick[1].add(); v = c.renderVals(); v.quick[2].add(); v = c.renderVals(); v.quick[3].add(); v = c.renderVals();
  console.log('cook timers:', v.timers.map((k) => k.name + ' ' + k.left).join(', '), '| can add:', v.canAdd);
  v.tapDigits(); v = c.renderVals(); console.log('cook tap:', v.hint);
  v.timers[0].remove(); v = c.renderVals(); v.stop(); v = c.renderVals(); console.log('cook stop:', v.statusLabel, '| timers left:', v.timers.length);
  const d = check('EmbedCook.dc.html', { size: 'full', state: 'timerdone' }).v; console.log('cook done:', d.timers.map((k) => k.left).join(', '), '| announce:', d.announce);
}
// Wrappers: each exists, mounts an existing child with props the child declares.
for (const [file, child, , props, w, h] of WRAPPERS.filter(([f]) => existsSync(new URL(f, dir)))) { // D-R18 removed some wrappers
  const src = readFileSync(new URL(file, dir), 'utf8');
  const childSrc = readFileSync(new URL(child + '.dc.html', dir), 'utf8');
  const declared = JSON.parse(childSrc.split("data-props='")[1].split("'>")[0]);
  const undeclared = Object.keys(props).filter((k) => !(k in declared));
  if (!src.includes(`name="${child}"`) || undeclared.length) { bad++; console.log('WRAPPER', file, undeclared); }
  const { v } = check(child + '.dc.html', Object.fromEntries(Object.entries(props)));
  const W = v.W ?? v.z?.W, H = v.H ?? v.z?.H;
  if ((W && W !== w + 'px') || (H && H !== h + 'px')) { bad++; console.log('SIZE MISMATCH', file, W, H, w, h); }
}
// Mounted siblings used by StoreAssets.
for (const f of ['ExtPopup.dc.html', 'ExtOptions.dc.html']) if (!existsSync(new URL(f, dir))) { bad++; console.log('missing child', f); }

console.log('combinations checked:', combos, '| missing holes / failures:', bad);
process.exit(bad ? 1 : 0);
