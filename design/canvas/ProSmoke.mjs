// Smoke test for the Pro boards: every prop combination resolves every {{hole}}, tags balance,
// handlers work (lamp picker, message, schedule, heatmap, FAQ, activate flow, device removal).
// Then writes the wrapper boards with sizes taken from each component's own W/H.
import { writeFileSync, existsSync } from 'node:fs';
import { dir, load, missing, balance } from './ProLib.mjs';

let bad = 0, combos = 0;
const fail = (msg) => { bad++; console.log('FAIL', msg); };
const check = (file, props, patch) => {
  const { Component, markup } = load(file);
  const c = new Component(props);
  if (patch) Object.assign(c.state, patch);
  const miss = missing(markup, c.renderVals());
  combos++;
  if (miss.length) fail(file + ' ' + JSON.stringify(props) + ' ' + JSON.stringify(patch ?? {}) + ' missing: ' + miss.join(', '));
  return c;
};
const THEMES = ['auto', 'light', 'dark'], LAYOUTS = ['phone', 'tablet', 'desktop'];

for (const f of ['Pro.dc.html', 'ProActivate.dc.html', 'ProManage.dc.html']) {
  const off = balance(f);
  if (off.length) fail(f + ' unbalanced: ' + off.join(', '));
}

// 1. Pro: theme x layout x interactive states.
for (const theme of THEMES) for (const layout of LAYOUTS) {
  check('Pro.dc.html', { theme, layout });
  for (const lamp of ['aqua', 'violet', 'mint', 'sky']) for (const heat of ['free', 'pro']) for (const faq of [-1, 0, 2, 4])
    check('Pro.dc.html', { theme, layout }, { lamp, heat, faq, msg: faq === 2 ? '' : 'x'.repeat(80), days: faq === 4 ? [0, 0, 0, 0, 0, 0, 0] : [1, 0, 1, 0, 1, 0, 0] });
}
{
  const { Component } = load('Pro.dc.html');
  const c = new Component({ layout: 'desktop', theme: 'dark' });
  let v = c.renderVals();
  v.lamps[3].pick(); v = c.renderVals(); if (v.pickName !== 'Sky' || v.pickTag !== 'Pro colour') fail('lamp pick sky');
  v.lamps[0].pick(); v = c.renderVals(); if (v.pickTag !== 'Free colour') fail('lamp pick aqua');
  v.setMsg({ target: { value: 'Reception opens at 9:00 AM' } }); v = c.renderVals(); if (v.msgCount !== '26 / 80') fail('msg count ' + v.msgCount);
  v.setMsg({ target: { value: 'y'.repeat(120) } }); v = c.renderVals(); if (v.msg.length !== 80) fail('msg clamp');
  v.setMsg({ target: { value: '  ' } }); v = c.renderVals(); if (v.msgShown !== 'Add a message in Settings') fail('msg empty');
  console.log('schedule:', v.schedLine);
  v.days[4].toggle(); v = c.renderVals(); console.log('  minus Fri:', v.schedLine);
  v.days[1].toggle(); v = c.renderVals(); console.log('  minus Tue:', v.schedLine);
  v.days[5].toggle(); v.days = c.renderVals().days; c.renderVals().days[6].toggle(); v = c.renderVals(); console.log('  plus weekend:', v.schedLine);
  v.showFree(); v = c.renderVals(); if (!v.heatLocked || v.heat.filter((h) => h.bs === 'solid').length !== 7) fail('heat free shows 7 days, got ' + v.heat.filter((h) => h.bs === 'solid').length);
  v.showPro(); v = c.renderVals(); if (v.heatLocked || v.heat.filter((h) => h.bs === 'solid').length !== 83) fail('heat pro');
  v.faq[3].toggle(); v = c.renderVals(); if (!v.faq[3].isOpen || v.faq[0].isOpen) fail('faq toggle');
  v.faq[3].toggle(); v = c.renderVals(); if (v.faq.some((q) => q.isOpen)) fail('faq close');
  v.setLight(); v = c.renderVals(); if (v.themeLight !== true) fail('theme light');
  console.log('Pro handlers ok; sizes', LAYOUTS.map((l) => new Component({ layout: l }).renderVals().W + 'x' + new Component({ layout: l }).renderVals().H).join(' '));
}

// 2. ProActivate: theme x layout x state x ext x error.
const ERRS = ['invalid_key', 'activation_limit', 'revoked', 'polar_unavailable', 'offline', 'bad_token'];
for (const theme of THEMES) for (const layout of LAYOUTS) for (const state of ['idle', 'checking', 'success', 'error']) for (const ext of [false, true]) for (const error of ERRS)
  check('ProActivate.dc.html', { theme, layout, state, ext, error }, { copied: error === 'offline' });
{
  const { Component } = load('ProActivate.dc.html');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Web: short key -> error -> fix key -> retry -> success -> reset.
  const c = new Component({ layout: 'phone', theme: 'dark' });
  let v = c.renderVals();
  if (v.btnLabel !== 'Activate on this device' || !v.showForm) fail('activate idle');
  v.setKey({ target: { value: 'too-short' } });
  c.renderVals().submit({ preventDefault() {} }); v = c.renderVals();
  if (!v.isChecking || v.btnLabel !== 'Checking your key…' || v.busy !== true) fail('activate checking');
  c.renderVals().submit(); // double submit while checking is ignored
  await wait(1500); v = c.renderVals();
  if (!v.isError || v.errText !== "That key doesn't match a purchase. Check the receipt email.") fail('activate error ' + v.errText);
  console.log('activate: error ->', v.errTitle, '|', v.errText, '| current row:', v.fails.find((f) => f.current === 'true').code);
  v.setKey({ target: { value: '7C1E94B2-5A0D-4F63-9E28-B31D6CA04F7A' } }); v = c.renderVals();
  if (v.isError) fail('editing key clears error');
  v.retry(); await wait(1500); v = c.renderVals();
  if (!v.isSuccessWeb || v.showForm || v.keyTail !== '4F7A') fail('activate success');
  console.log('activate: success -> Pro is active on this device | key ending', v.keyTail, '| unlocked:', v.unlocked.join('; '));
  v.reset(); v = c.renderVals(); if (!v.showForm || v.key !== '') fail('activate reset');
  // Extension variant.
  const e = new Component({ layout: 'desktop', theme: 'light', ext: true });
  v = e.renderVals();
  if (v.btnLabel !== 'Show key for the extension' || !v.lead.startsWith('Enter your key here')) fail('ext labels');
  v.setKey({ target: { value: '7C1E94B2-5A0D-4F63-9E28-B31D6CA04F7A' } });
  e.renderVals().submit(); await wait(1500); v = e.renderVals();
  if (!v.isSuccessExt || v.isSuccessWeb) fail('ext success');
  v.copy(); v = e.renderVals(); if (v.copyLabel !== 'Copied') fail('ext copy');
  clearTimeout(e.copyT);
  // Limit error offers Manage devices.
  const l = new Component({ state: 'error', error: 'activation_limit' });
  if (!l.renderVals().errManage) fail('limit manage link');
  console.log('ProActivate flow ok');
}

// 3. ProManage: theme x layout x empty x confirm.
for (const theme of THEMES) for (const layout of LAYOUTS) for (const empty of [false, true]) for (const confirm of [null, 'd1', 'd3'])
  check('ProManage.dc.html', { theme, layout, empty }, { confirm });
{
  const { Component } = load('ProManage.dc.html');
  const c = new Component({ layout: 'desktop', theme: 'dark' });
  let v = c.renderVals();
  if (v.meterLabel !== '4 of 5 devices' || v.rows[0].date !== '26 September 2026') fail('manage initial ' + v.meterLabel + ' ' + v.rows[0].date);
  console.log('manage:', v.meterLabel, '|', v.freeLabel, '|', v.rows.map((r) => r.label + ' ' + r.date).join('; '));
  v.rows[1].ask(); v = c.renderVals(); if (!v.rows[1].confirming) fail('manage ask');
  v.rows[1].keep(); v = c.renderVals(); if (v.rows[1].confirming) fail('manage keep');
  v.rows[1].ask(); c.renderVals().rows[1].remove(); v = c.renderVals();
  if (v.meterLabel !== '3 of 5 devices' || v.freeLabel !== '2 activations left') fail('manage remove');
  v.rows[0].ask(); c.renderVals().rows[0].remove(); v = c.renderVals();
  if (!v.isEmpty) fail('removing this device empties the page');
  const e = new Component({ empty: true }); v = e.renderVals();
  if (!v.isEmpty || v.hasRows) fail('manage empty prop');
  console.log('ProManage flow ok');
}

console.log('combos checked:', combos, 'failures:', bad);

// 4. Wrapper boards.
const size = (file, props) => { const { Component } = load(file); const v = new Component(props).renderVals(); return [parseInt(v.W, 10), parseInt(v.H, 10)]; };
const boards = {};
const wrap = (file, child, title, props) => {
  const [w, h] = size(child + '.dc.html', props);
  const attrs = Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ');
  if (process.env.WRITE_WRAPPERS) writeFileSync(new URL(file, dir), `<!doctype html>
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
<dc-import name="${child}" ${attrs} hint-size="${w}px,${h}px"></dc-import>
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
  boards[file] = { w, h, title, is_interactive: true };
};
wrap('ProPhoneDark.dc.html', 'Pro', 'Pro · phone · dark', { layout: 'phone', theme: 'dark' });
wrap('ProPhoneLight.dc.html', 'Pro', 'Pro · phone · light', { layout: 'phone', theme: 'light' });
wrap('ProTablet.dc.html', 'Pro', 'Pro · tablet · light', { layout: 'tablet', theme: 'light' });
wrap('ProDeskDark.dc.html', 'Pro', 'Pro · desktop · dark', { layout: 'desktop', theme: 'dark' });
wrap('ProDeskLight.dc.html', 'Pro', 'Pro · desktop · light', { layout: 'desktop', theme: 'light' });
wrap('ProActivatePhone.dc.html', 'ProActivate', 'Activate · phone · dark · success', { layout: 'phone', theme: 'dark', state: 'success' });
wrap('ProActivateDesk.dc.html', 'ProActivate', 'Activate · desktop · light · error', { layout: 'desktop', theme: 'light', state: 'error' });
wrap('ProManageDesk.dc.html', 'ProManage', 'Manage devices · desktop · dark', { layout: 'desktop', theme: 'dark' });
wrap('ProManagePhoneEmpty.dc.html', 'ProManage', 'Manage devices · phone · light · empty', { layout: 'phone', theme: 'light', empty: 'true' });
for (const f of Object.keys(boards).filter((f) => existsSync(new URL(f, dir)))) { /* D-R18 removed some wrappers */ const off = balance(f); if (off.length) { bad++; console.log('FAIL wrapper', f, off); } }
const base = {
  'Pro.dc.html': { w: 390, h: size('Pro.dc.html', {})[1], title: '▶ Pro · play me · follows your system', is_interactive: true },
  'ProActivate.dc.html': { w: 390, h: size('ProActivate.dc.html', {})[1], title: '▶ Activate · idle · try the flow', is_interactive: true },
  'ProManage.dc.html': { w: 390, h: size('ProManage.dc.html', {})[1], title: '▶ Manage devices · phone', is_interactive: true }
};
console.log('BOARDS', JSON.stringify({ ...base, ...boards }));
console.log(bad ? 'SMOKE FAILED' : 'SMOKE OK');
process.exit(bad ? 1 : 0);
