import { readFileSync, writeFileSync } from 'node:fs';
const dir = '/home/user/awaketab/design/canvas/project/';
const WRITE = process.argv.includes('--write');

globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }

function load(file) {
  const src = readFileSync(dir + file, 'utf8');
  const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
  const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  const markup = src.split('<script type="text/x-dc"')[0];
  const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
  // Balance checks.
  const count = (re) => (markup.match(re) || []).length;
  const bal = {
    'sc-if': [count(/<sc-if[\s>]/g), count(/<\/sc-if>/g)],
    'sc-for': [count(/<sc-for[\s>]/g), count(/<\/sc-for>/g)],
    div: [count(/<div[\s>]/g), count(/<\/div>/g)],
    span: [count(/<span[\s>]/g), count(/<\/span>/g)],
    button: [count(/<button[\s>]/g), count(/<\/button>/g)],
    form: [count(/<form[\s>]/g), count(/<\/form>/g)],
    svg: [count(/<svg[\s>]/g), count(/<\/svg>/g)],
    'dc-import': [count(/<dc-import[\s>]/g), count(/<\/dc-import>/g)]
  };
  for (const [k, [o, c]] of Object.entries(bal)) if (o !== c) console.log('UNBALANCED', file, k, o, c);
  // Every sc-if/sc-for has its hint attrs.
  for (const m of markup.matchAll(/<sc-if[^>]*>/g)) if (!m[0].includes('hint-placeholder-val')) console.log('no hint', file, m[0]);
  for (const m of markup.matchAll(/<sc-for[^>]*>/g)) if (!m[0].includes('hint-placeholder-count')) console.log('no hint', file, m[0]);
  // Loop variables declared by sc-for.
  const loopVars = new Set([...markup.matchAll(/<sc-for[^>]*as="(\w+)"/g)].map((m) => m[1]).concat(['$index', 'true', 'false']));
  return { Component, holes, loopVars };
}

function check(file, Component, holes, loopVars, props) {
  const c = new Component(props);
  const v = c.renderVals();
  let bad = 0;
  for (const h of holes) {
    if (loopVars.has(h.split('.')[0])) continue;
    const val = h.split('.').reduce((o, k) => (o == null ? o : o[k]), v);
    if (val === undefined) { bad++; console.log('missing', file, h, JSON.stringify(props)); }
  }
  return { bad, c, v };
}

let missing = 0;

// Ambient: mode × layout × theme × pro × status, plus focus/cook seeds.
const A = load('Ambient.dc.html');
let combos = 0;
for (const mode of ['clock', 'focus', 'minimal', 'night', 'message', 'cook'])
  for (const layout of ['phone', 'tablet', 'desktop'])
    for (const theme of ['light', 'dark', 'auto'])
      for (const pro of [false, 'true'])
        for (const status of ['awake', 'fallback', 'paused'])
          for (const focusState of mode === 'focus' ? ['idle', 'focus', 'break', 'long'] : ['focus'])
            for (const cookSeed of mode === 'cook' ? ['none', 'some', 'full'] : ['some']) {
              combos++;
              const { bad, c, v } = check('Ambient', A.Component, A.holes, A.loopVars, { mode, layout, theme, pro, status, focusState, cookSeed, controls: 'auto' });
              missing += bad;
              // loop items must also resolve
              for (const [list, keys] of [['modes', ['label', 'sel', 'pick', 'weight', 'color']], ['dots', ['bg', 'bd', 'now']], ['ticks', ['h', 'c']], ['quick', ['label', 'aria', 'add']], ['timers', ['name', 'done', 'flash', 'big', 'sub', 'aria', 'p', 'bg', 'bd', 'ink', 'bar', 'removeAria', 'remove']]])
                for (const it of v[list]) for (const k of keys) if (it[k] === undefined) { missing++; console.log('missing item', list, k); }
            }
console.log('Ambient combos:', combos);

// Interaction: focus start, tick, skip through the whole block.
{
  const c = new A.Component({ mode: 'focus', layout: 'desktop', theme: 'dark', focusState: 'idle' });
  let v = c.renderVals();
  console.log('focus idle:', v.focusIdle, '|', v.focusIntro, '|', v.todayText);
  v.focusStart(); c.tick(); v = c.renderVals();
  console.log('focus start+1s:', v.phaseName, v.cycleText, v.fA + v.fB, v.fP, v.nextText, '|', v.skipLabel, '|', v.dotsAria);
  const seen = [];
  for (let i = 0; i < 8; i++) { v.focusSkip(); v = c.renderVals(); seen.push(v.focusRunning ? v.phaseName + ' ' + v.cycleText.split(' ')[1] : 'done'); }
  console.log('skips:', seen.join(' > '), '| toast:', v.toastText, '|', v.todayText);
  // boundary via ticks
  const c2 = new A.Component({ mode: 'focus', focusState: 'focus' });
  c2.state.focusEl = 1499; c2.tick(); v = c2.renderVals();
  console.log('tick across boundary:', v.phaseName, v.fA + v.fB, '| toast:', v.toastText);
}
// Interaction: cook timers.
{
  const c = new A.Component({ mode: 'cook', layout: 'tablet', theme: 'light', cookSeed: 'some' });
  let v = c.renderVals();
  console.log('cook:', v.cookA + v.cookB, v.cookHint, '|', v.timers.map((k) => k.name + ' ' + k.big + ' (' + k.sub + ')').join('; '), '|', v.timerCount, 'form', v.formOn);
  v.cookTap(); v = c.renderVals(); console.log('tap:', v.cookHint, v.cookPausedStr, v.statusLabel);
  c.tick(); const el1 = c.state.cookEl; c.tick(); console.log('paused elapsed frozen:', el1 === c.state.cookEl);
  v = c.renderVals(); v.cookTap();
  v = c.renderVals(); v.onName({ target: { value: 'Garlic bread in the oven now' } }); v = c.renderVals();
  console.log('name clipped:', JSON.stringify(v.tName));
  v.quick[0].add(); v = c.renderVals();
  console.log('added:', v.timers.map((k) => k.name + ' ' + k.big).join('; '), '| formOn', v.formOn, 'full', v.cookFull);
  v.quick[1].add(); v = c.renderVals(); console.log('4th add toast:', v.toastText);
  // expire Pasta
  c.state.timers = c.state.timers.map((k) => (k.name === 'Pasta' ? { ...k, endsAt: Date.now() - 10 } : k));
  c.tick(); v = c.renderVals();
  const pasta = v.timers.find((k) => k.name === 'Pasta');
  console.log('pasta done:', pasta.done, pasta.big, pasta.flash, pasta.sub, '| toast:', v.toastText);
  pasta.remove(); v = c.renderVals();
  console.log('after remove:', v.timers.map((k) => k.name).join(', '), 'formOn', v.formOn);
  v.toggleCustom(); v = c.renderVals(); v.cMore(); v.onCustom({ target: { value: '90' } }); v = c.renderVals();
  console.log('custom:', v.customOpen, v.tCustom); v.addCustom({ preventDefault() {} }); v = c.renderVals();
  console.log('custom added:', v.timers.map((k) => k.name + ' ' + k.big).join('; '));
  const c3 = new A.Component({ mode: 'cook', cookSeed: 'none' }); v = c3.renderVals();
  v.onCustom({ target: { value: '0' } }); v = c3.renderVals(); v.addCustom({ preventDefault() {} }); v = c3.renderVals();
  console.log('invalid custom toast:', v.toastText, '| timers', v.timers.length);
}
// Interaction: bar, message, night dim, controls auto-hide.
{
  const c = new A.Component({ mode: 'clock', theme: 'dark' });
  let v = c.renderVals();
  console.log('clock:', v.clk.hm, v.clk.ap, v.clk.s, '|', v.dateLong, '|', v.leftShort, v.untilText, v.ringDash);
  const order = [];
  for (let i = 0; i < 6; i++) { v.nextMode(); v = c.renderVals(); order.push(c.state.mode); }
  console.log('next (free):', order.join(' > '), '| toast:', v.toastText);
  v.modes[4].pick(); v = c.renderVals();
  console.log('message free:', v.previewText, v.msgLocked, v.canEdit);
  c.state.previewLeft = 1; c.tick(); v = c.renderVals(); console.log('preview spent:', v.previewText, v.msgLocked);
  const p = new A.Component({ mode: 'message', pro: 'true' }); v = p.renderVals();
  v.startEdit(); v = p.renderVals(); v.onDraft({ target: { value: '  Back at‮ 3 pm\u0007  ' } }); v = p.renderVals(); v.saveMsg({ preventDefault() {} }); v = p.renderVals();
  console.log('pro message saved:', JSON.stringify(v.msg), v.editing, v.canEdit);
  const n = new A.Component({ mode: 'night', layout: 'phone' });
  n.lastInput = Date.now() - 31000; n.tick(); v = n.renderVals(); console.log('night dim:', v.nightOp, v.nightNote, '| bar hidden:', v.barOp);
  v.wake({}); v = n.renderVals(); console.log('wake:', v.nightOp, v.barOp);
  v.wake({ key: 'Tab' }); n.lastInput = Date.now() - 5000; n.tick(); v = n.renderVals(); console.log('keyboard keeps bar:', v.barOp);
  const sh = new A.Component({ mode: 'clock', controls: 'shown' }); sh.lastInput = 0; sh.tick(); console.log('shown never hides:', sh.renderVals().barOp);
  v.fullscreen(); console.log('fullscreen (no DOM) toast:', n.renderVals().toastText);
}

// PiP
const Pp = load('PipWindow.dc.html');
for (const theme of ['light', 'dark', 'auto'])
  for (const pro of [false, 'true'])
    for (const ambient of ['focus', 'clock'])
      for (const status of ['awake', 'fallback', 'paused']) {
        const { bad, c, v } = check('Pip', Pp.Component, Pp.holes, Pp.loopVars, { theme, pro, ambient, status });
        missing += bad;
        v.extend(); c.renderVals(); v.stop(); missing += check('Pip', Pp.Component, Pp.holes, Pp.loopVars, { theme, pro, ambient, status }).bad;
        const after = c.renderVals();
        for (const h of Pp.holes) { if (Pp.loopVars.has(h.split('.')[0])) continue; if (h.split('.').reduce((o, k) => (o == null ? o : o[k]), after) === undefined) { missing++; console.log('pip after stop missing', h); } }
      }
{
  const c = new Pp.Component({ pro: 'true', ambient: 'clock', theme: 'light' }); let v = c.renderVals();
  console.log('pip pro clock:', v.H, v.kicker, v.bigA + v.bigB, v.digitSize);
  const f = new Pp.Component({}); v = f.renderVals(); console.log('pip free:', v.H, v.statusLabel, v.bigA + v.bigB, v.untilText);
  v.extend(); v = f.renderVals(); console.log('pip +15:', v.bigA + v.bigB); v.stop(); v = f.renderVals(); console.log('pip stop:', v.statusLabel, v.stopped);
}
const Pd = load('PipOverDesk.dc.html');
for (const theme of ['light', 'dark', 'auto']) {
  const { bad, v } = check('PipOverDesk', Pd.Component, Pd.holes, Pd.loopVars, { theme });
  missing += bad;
  for (const r of v.rows) { if (r.cells.length !== 8) { missing++; console.log('row cells', r.n, r.cells.length); } for (const x of r.cells) for (const k of ['v', 'align', 'outline', 'color']) if (x[k] === undefined) { missing++; console.log('cell missing', k); } }
}
console.log('TOTAL missing:', missing);

if (WRITE) {
  const wrap = (file, title, name, props, w, h) => writeFileSync('/home/user/awaketab/design/canvas/tools/fix1b/xap/w2/' + file, `<!doctype html>
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
  wrap('AmbientClockDesk.dc.html', 'clock desktop dark', 'Ambient', { mode: 'clock', layout: 'desktop', theme: 'dark', controls: 'shown' }, 1280, 800);
  wrap('AmbientClockPhone.dc.html', 'clock phone light', 'Ambient', { mode: 'clock', layout: 'phone', theme: 'light', controls: 'shown' }, 390, 844);
  wrap('AmbientFocusDesk.dc.html', 'focus desktop dark', 'Ambient', { mode: 'focus', layout: 'desktop', theme: 'dark', focusState: 'focus', controls: 'shown' }, 1280, 800);
  wrap('AmbientMinimalDesk.dc.html', 'minimal desktop dark', 'Ambient', { mode: 'minimal', layout: 'desktop', theme: 'dark', controls: 'auto' }, 1280, 800);
  wrap('AmbientNightPhone.dc.html', 'night phone', 'Ambient', { mode: 'night', layout: 'phone', theme: 'dark', controls: 'auto' }, 390, 844);
  wrap('AmbientMessageDesk.dc.html', 'message desktop light', 'Ambient', { mode: 'message', layout: 'desktop', theme: 'light', pro: 'false', controls: 'shown' }, 1280, 800);
  wrap('AmbientCookTablet.dc.html', 'cook tablet light', 'Ambient', { mode: 'cook', layout: 'tablet', theme: 'light', cookSeed: 'full', controls: 'shown' }, 1180, 820);
  wrap('AmbientCookTabletDark.dc.html', 'cook tablet dark', 'Ambient', { mode: 'cook', layout: 'tablet', theme: 'dark', cookSeed: 'some', controls: 'shown' }, 1180, 820);
  const pipPair = (file, theme) => {
    const dark = theme === 'dark';
    const bg = dark ? '#0A0E16' : '#F2F6FA', ink = dark ? '#8E9AAE' : '#5B6779', line = dark ? 'rgba(255,255,255,0.10)' : 'rgba(14,23,38,0.14)';
    writeFileSync('/home/user/awaketab/design/canvas/tools/fix1b/xap/w2/' + file, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · floating window ${theme}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;display=swap" rel="stylesheet">
<style>body{margin:0;font-family:Geist,system-ui,sans-serif}</style>
</helmet>
<div style="width: 632px; height: 236px; box-sizing: border-box; padding: 24px; background: ${bg}; display: flex; gap: 24px; align-items: flex-start">
  <div style="display: flex; flex-direction: column; gap: 8px">
    <span style="font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; color: ${ink}">Free · 280 × 120</span>
    <div style="width: 280px; height: 120px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px ${line}, 0 18px 40px -20px rgba(0,0,0,0.5)">
      <dc-import name="PipWindow" theme="${theme}" hint-size="280px,120px"></dc-import>
    </div>
  </div>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <span style="font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; color: ${ink}">Pro · 280 × 160 · focus digits</span>
    <div style="width: 280px; height: 160px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px ${line}, 0 18px 40px -20px rgba(0,0,0,0.5)">
      <dc-import name="PipWindow" theme="${theme}" pro="true" ambient="focus" hint-size="280px,160px"></dc-import>
    </div>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":632,"height":236}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`);
  };
  pipPair('PipDark.dc.html', 'dark');
  pipPair('PipLight.dc.html', 'light');
  console.log('wrappers written');
}
