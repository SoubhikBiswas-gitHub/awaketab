// Build job lists: node gen-jobs.mjs <set> > jobs.json   (set = base | wrappers | main | all)
import { readFileSync, readdirSync } from 'node:fs';
const DIR = process.env.DCDIR || '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const size = (file, props) => {
  const src = readFileSync(DIR + file, 'utf8');
  const js = src.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const C = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
  const v = new C(props).renderVals();
  const W = parseInt(v.W ?? v.z?.W ?? '0', 10), H = parseInt(v.H ?? v.z?.H ?? '0', 10);
  return { W, H };
};
const canvas = JSON.parse(readFileSync(DIR + 'canvas.json', 'utf8')).boards;
const set = process.argv[2] || 'all';
const jobs = [];
const add = (id, file, props, scheme, extra = {}) => {
  let { W, H } = extra.W ? extra : size(file, props);
  if (file === 'PipWindow.dc.html') W = 280;
  jobs.push({ id, file, props, W, H, scheme: scheme || (props.theme === 'light' ? 'light' : 'dark'), ...extra });
};
const layouts = ['phone', 'tablet', 'desktop'];
const themes = ['dark', 'light'];
if (set === 'base' || set === 'all') {
  for (const L of layouts) for (const T of themes) {
    for (const k of ['resume', 'secondtab', 'install', 'denied', 'rating', 'shortcuts', 'share', 'toast']) add(`Extras-${k}-${L}-${T}`, 'Extras.dc.html', { kind: k, layout: L, theme: T });
    for (const m of ['clock', 'focus', 'minimal', 'night', 'message', 'cook']) add(`Ambient-${m}-${L}-${T}`, 'Ambient.dc.html', { mode: m, layout: L, theme: T, controls: 'shown' });
    for (const s of ['ready', 'awake']) add(`ContentArticle-${L}-${T}-${s}`, 'ContentArticle.dc.html', { layout: L, theme: T, status: s });
    add(`HubFor-${L}-${T}`, 'HubFor.dc.html', { layout: L, theme: T });
    add(`HomeBelow-${L}-${T}`, 'HomeBelow.dc.html', { layout: L, theme: T });
  }
  for (const T of themes) {
    for (const fs of ['idle', 'break', 'long']) add(`Ambient-focus-${fs}-desktop-${T}`, 'Ambient.dc.html', { mode: 'focus', focusState: fs, layout: 'desktop', theme: T, controls: 'shown' });
    for (const cs of ['none', 'full']) for (const L of ['phone', 'tablet']) add(`Ambient-cook-${cs}-${L}-${T}`, 'Ambient.dc.html', { mode: 'cook', cookSeed: cs, layout: L, theme: T, controls: 'shown' });
    for (const st of ['fallback', 'paused']) add(`Ambient-clock-${st}-phone-${T}`, 'Ambient.dc.html', { mode: 'clock', status: st, layout: 'phone', theme: T, controls: 'shown' });
    add(`Ambient-message-pro-phone-${T}`, 'Ambient.dc.html', { mode: 'message', pro: true, layout: 'phone', theme: T, controls: 'shown' });
    for (const pro of [false, true]) for (const amb of ['focus', 'clock']) for (const st of ['awake', 'fallback', 'paused']) add(`PipWindow-${T}-${pro ? 'pro' : 'free'}-${amb}-${st}`, 'PipWindow.dc.html', { theme: T, pro, ambient: amb, status: st });
  }
}
if (set === 'wrappers' || set === 'all') {
  const mine = /^(Extras.+|Ambient.+|Pip(Dark|Light|OverDesk)|ContentArticle.+|HubFor.+|HomeBelow.+|Ring(Dark|Light)|Bold(Dark|Light)|Horizon(Dark|Light)|Tide(Dark|Light)|Paused(Dark|Light)|Blocked(Dark|Light)|Done(Dark|Light)|Until(Dark|Light)|Desk(Ring|Horizon|Tide).*|Tool.+)\.dc\.html$/;
  for (const f of readdirSync(DIR).filter((f) => mine.test(f)).sort()) {
    const b = canvas[f];
    const src = readFileSync(DIR + f, 'utf8');
    const m = /<div style="width: (\d+)px; height: (\d+)px/.exec(src);
    const W = m ? +m[1] : b.w, H = m ? +m[2] : b.h;
    const light = /theme="light"|Light|Phone(?!Dark)/.test(f) && !/Dark/.test(f);
    jobs.push({ id: 'W-' + f.replace('.dc.html', ''), file: f, props: {}, W, H, scheme: /Light/.test(f) ? 'light' : 'dark', canvas: b ? [b.w, b.h] : null });
  }
}
if (set === 'main' || set === 'all') {
  const dp = JSON.parse(readFileSync(DIR + 'Main.dc.html', 'utf8').match(/data-props='([^']*)'/)[1]);
  const statuses = dp.status.options, faces = dp.face.options, mlayouts = dp.layout.options;
  const panels = dp.panel.options.filter((x) => x !== 'none'), edges = dp.edge ? dp.edge.options.filter((x) => x !== 'none') : [];
  for (const L of mlayouts) for (const T of ['dark', 'light', 'oled', 'auto']) {
    const sch = T === 'light' ? 'light' : 'dark';
    for (const s of statuses) for (const f of faces) {
      if ((T === 'auto' || T === 'oled') && !(f === 'ring' || s === 'awake')) continue;
      add(`Main-${L}-${T}-${s}-${f}`, 'Main.dc.html', { layout: L, theme: T, status: s, face: f }, sch);
    }
    for (const sh of ['settings', 'stats']) add(`Main-${L}-${T}-sheet-${sh}`, 'Main.dc.html', { layout: L, theme: T, status: 'awake', face: 'ring', sheet: sh }, sch);
    if (T === 'auto') continue;
    for (const pn of panels) add(`Main-${L}-${T}-panel-${pn}`, 'Main.dc.html', { layout: L, theme: T, status: 'ready', face: 'ring', panel: pn }, sch);
    for (const ph of ['dawn', 'day', 'dusk', 'night']) add(`Main-${L}-${T}-horizon-${ph}`, 'Main.dc.html', { layout: L, theme: T, status: 'awake', face: 'horizon', phase: ph }, sch);
    for (const e of edges) add(`Main-${L}-${T}-edge-${e}`, 'Main.dc.html', { layout: L, theme: T, status: 'awake', face: 'ring', edge: e }, sch);
  }
  add('Main-phone-auto-lightscheme', 'Main.dc.html', { layout: 'phone', theme: 'auto', status: 'awake', face: 'ring' }, 'light');
}
process.stdout.write(JSON.stringify(jobs));
