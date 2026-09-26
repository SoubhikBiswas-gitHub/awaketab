import { readFileSync, readdirSync } from 'node:fs';
const dir = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const src = readFileSync(dir + 'Main.dc.html', 'utf8');
const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
const props = JSON.parse(src.split("data-props='")[1].split("'>")[0]);
let sysDark = true;
globalThis.window = { matchMedia: () => ({ matches: sysDark, addEventListener() {}, removeEventListener() {} }) };
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
const markup = src.split('<script type="text/x-dc"')[0];
let fail = 0;
const err = (...a) => { fail++; if (fail < 40) console.log('FAIL', ...a); };

// Balance checks.
for (const tag of ['sc-if', 'sc-for', 'div', 'button', 'span', 'section', 'svg', 'header', 'nav', 'dl', 'output', 'p', 'a', 'kbd']) {
  const open = (markup.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
  const close = (markup.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (open !== close) err('unbalanced', tag, open, close);
}
for (const m of markup.matchAll(/<sc-if\b[^>]*>/g)) if (!/hint-placeholder-val=/.test(m[0])) err('sc-if without hint', m[0]);
for (const m of markup.matchAll(/<sc-for\b[^>]*>/g)) if (!/hint-placeholder-count=/.test(m[0])) err('sc-for without hint', m[0]);
if (/\{\{[^}]*[^\w.$\s}][^}]*\}\}/.test(markup)) err('expression in hole', markup.match(/\{\{[^}]*[^\w.$\s}][^}]*\}\}/)[0]);

// Loop blocks (not nested).
const loops = [...markup.matchAll(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g)].map((m) => ({ list: m[1], v: m[2], body: m[3] }));
const outer = markup.replace(/<sc-for list="\{\{[\w.]+\}\}" as="\w+"[^>]*>[\s\S]*?<\/sc-for>/g, (m) => m.match(/<sc-for[^>]*>/)[0]);
const holesIn = (s) => [...new Set([...s.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const PILLS = ['Ready', 'Starting…', 'Screen awake', 'Paused — tab hidden', "Blocked — here's the fix", 'Tap to use the fallback', 'Awake via video fallback'];

function check(v, tag) {
  for (const h of holesIn(outer)) {
    if (h === 'true' || h === 'false') continue;
    if (get(v, h) === undefined) err('missing', h, tag);
  }
  for (const L of loops) {
    const list = get(v, L.list);
    if (!Array.isArray(list)) { err('not array', L.list, tag); continue; }
    for (const h of holesIn(L.body)) {
      const [head, ...rest] = h.split('.');
      if (h === 'true' || h === 'false') continue;
      if (head === L.v) { for (const it of list) if (get(it, rest.join('.')) === undefined) { err('missing item', L.list, h, tag); break; } }
      else if (get(v, h) === undefined) err('missing (in loop)', h, tag);
    }
  }
  if (!PILLS.includes(v.statusLabel)) err('pill', v.statusLabel, tag);
}

let combos = 0;
for (const status of props.status.options)
  for (const face of props.face.options)
    for (const layout of props.layout.options)
      for (const theme of props.theme.options)
        for (const sheet of props.sheet.options)
          for (const sd of [true, false]) {
            if (sd === false && theme !== 'auto') continue;
            sysDark = sd;
            const c = new Component({ status, face, layout, theme, sheet, phase: 'auto' });
            check(c.renderVals(), [status, face, layout, theme, sheet, sd].join('/'));
            combos++;
          }
sysDark = true;
// Panels and accent prop too.
for (const panel of ['until', 'custom']) for (const layout of ['phone', 'tablet', 'desktop']) { const c = new Component({ panel, layout }); check(c.renderVals(), panel); combos++; }
for (const accent of ['#5BE0E8', '#A594FF', '#7EF0B8', '#7CB8FF', '#123456']) { const c = new Component({ accent, sheet: 'settings', theme: 'light' }); check(c.renderVals(), accent); combos++; }
console.log('combinations checked:', combos, '| holes:', holesIn(markup).length, '| loops:', loops.length);

// Interactions.
const eq = (a, b, what) => { if (a !== b) err(what, JSON.stringify(a), '!==', JSON.stringify(b)); else console.log('ok  ', what, '=', JSON.stringify(a)); };
let c = new Component({ status: 'awake', theme: 'dark', sheet: 'settings' });
let v = c.renderVals();
eq(v.lamp, '#5BE0E8', 'default lamp (dark)');
v.lamps[1].pick(); v = c.renderVals();
eq(v.lamp, '#A594FF', 'lamp after picking Violet');
eq(v.faceColor, '#A594FF', 'ring colour follows lamp');
eq(v.lampNote, 'Violet', 'lamp note');
v.lamps[3].pick(); v = c.renderVals();
eq(v.lampNote, 'Sky · Pro preview', 'sky marked Pro');
v.sg.theme.opts[1].pick(); v = c.renderVals();
eq(v.lamp, '#255FBD', 'sky light value in light theme');
eq(v.t.surface, '#FFFFFF', 'light surface');
v.sg.theme.opts[3].pick(); v = c.renderVals();
eq(v.t.bg, '#000000', 'OLED ground');
eq(v.t.surface, '#0A0A0A', 'OLED surface');
eq(v.t.ink, '#EAF0F7', 'OLED ink follows dark');
eq(v.themeDark, true, 'header shows dark slot for OLED');
eq(v.halo, 'transparent', 'no halo on OLED');
v.setAuto(); v = c.renderVals(); eq(v.sg.theme.x, '0%', 'header Auto syncs sheet');
// 12/24 h.
c.state.now = new Date(2026, 8, 26, 22, 5, 9).getTime();
v = c.renderVals(); console.log('     follow language:', v.nowTime, '|', v.dateLong, '|', v.metaA, v.metaB);
v.sg.fmt.opts[2].pick(); v = c.renderVals();
eq(v.nowTime, '22:05', '24-hour nowTime');
console.log('     24h meta:', v.metaA, v.metaB, '| note:', v.note);
v.sw.secs.toggle(); v = c.renderVals(); eq(v.nowTime, '22:05:09', '24-hour with seconds');
v.sg.fmt.opts[1].pick(); v = c.renderVals(); eq(v.nowTime.replace(/\s/g, ' '), '10:05:09 PM', '12-hour with seconds');
// Switches, battery, reset.
eq(v.sw.batt.on, 'false', 'battery switch default off'); eq(v.battOff, true, 'slider disabled');
v.sw.batt.toggle(); v = c.renderVals(); eq(v.sw.batt.on, 'true', 'battery switch on');
v.setBatt({ target: { value: '22' } }); v = c.renderVals(); eq(v.battLevel, 22, 'battery level');
v.setBatt({ target: { value: '99' } }); v = c.renderVals(); eq(v.battLevel, 30, 'battery clamp');
v.sw.tele.toggle(); v = c.renderVals(); eq(v.sw.tele.on, 'false', 'telemetry off');
v.sg.end.opts[1].pick(); v = c.renderVals(); eq(c.state.endAsk, false, 'Just stop');
v.resetAll(); v = c.renderVals();
eq(v.lamp, '#5BE0E8', 'reset lamp'); eq(v.nowTime.replace(/\s/g, ' '), '10:05 PM', 'reset clock'); eq(v.sw.tele.on, 'true', 'reset telemetry'); eq(c.state.endAsk, true, 'reset end');
// Sheets.
v.closeSheet(); v = c.renderVals(); eq(v.sheetOpen, false, 'close sheet');
v.openStats(); v = c.renderVals(); eq(v.sheetTitle, 'Your stats', 'open stats');
console.log('     figs:', v.figs.map((f) => f.label + ' ' + f.a + f.ua + f.b + f.ub).join(' · '));
console.log('     cells:', v.cells.length, 'unlocked:', v.cells.filter((x) => x.op === 1).length, 'future:', v.cells.filter((x) => x.title === 'Later this week').length);
v.openSettings(); v = c.renderVals(); eq(v.sheetTitle, 'Settings', 'open settings');
// Extend prompt: timed session reaches zero, countdown to ended.
c = new Component({ status: 'awake' });
c.state.left = 2; c.tick(); c.tick(); v = c.renderVals();
eq(c.state.mode, 'timesup', 'zero with Ask to extend');
eq(v.statusLabel, 'Screen awake', 'pill during prompt'); eq(v.dockAsk, true, 'inline prompt shown'); eq(v.showLength, false, 'length block hidden');
eq(v.askLeft, 60, 'Stops in 60 s');
for (let i = 0; i < 12; i++) c.tick(); v = c.renderVals(); eq(v.askLeft, 48, 'countdown after 12 s');
for (let i = 0; i < 48; i++) c.tick(); v = c.renderVals();
eq(c.state.mode, 'ended', 'countdown reaches ended'); eq(v.statusLabel, 'Ready', 'pill after end'); eq(v.kicker, 'Session complete', 'kicker after end');
c = new Component({ status: 'timesup' }); v = c.renderVals(); v.askOpts[1].pick(); v = c.renderVals();
eq(c.state.mode, 'awake', '+30 min resumes'); eq(v.bigA + v.bigB, '30:00', '+30 min time');
c = new Component({ status: 'timesup' }); v = c.renderVals(); v.askStop(); eq(c.state.mode, 'ended', 'Stop ends');
c = new Component({ status: 'fallback' }); c.state.left = 1; c.tick(); v = c.renderVals(); eq(v.statusLabel, 'Awake via video fallback', 'fallback prompt pill');
c = new Component({ status: 'awake' }); c.state.endAsk = false; c.state.left = 1; c.tick(); eq(c.state.mode, 'ended', 'Just stop goes straight to ended');
// Layout presets.
eq(new Component({ layout: 'phone' }).renderVals().gridItems.filter((x) => x.col === 'span 2').length, 7, 'phone shows all seven presets');
eq(new Component({ layout: 'tablet' }).renderVals().presets.map((p) => p.label).join(' '), '15 min 30 min 45 min 1 h 2 h 4 h ∞', 'tablet presets');
eq(new Component({ layout: 'tablet' }).renderVals().scale, 1.35, 'tablet face scale');
eq(new Component({ layout: 'tablet' }).renderVals().showStatsBtn, true, 'tablet Stats button');
eq(new Component({ layout: 'tablet' }).renderVals().isDesk, false, 'tablet nav hidden');

// Wrappers mount Main with known prop values.
for (const f of readdirSync(dir).filter((f) => f.endsWith('.dc.html') && f !== 'Main.dc.html')) {
  const s = readFileSync(dir + f, 'utf8');
  for (const m of s.matchAll(/<dc-import name="Main"([^>]*)>/g))
    for (const a of m[1].matchAll(/(\w+)="([^"]*)"/g))
      if (a[1] !== 'hint' && !a[2].includes('{{') && props[a[1]] && props[a[1]].options && props[a[1]].editor === 'enum' && !props[a[1]].options.includes(a[2])) err('wrapper prop', f, a[1], a[2]);
}
console.log(fail ? 'FAILED: ' + fail : 'ALL PASS (0 missing)');
process.exit(fail ? 1 : 0);
