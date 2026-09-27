import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
const dir = new URL('./project/', import.meta.url);
const src = readFileSync(new URL('Main.dc.html', dir), 'utf8');

// 1. Logic smoke test across every state, face, layout and theme.
const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } }
const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
const holes = [...new Set([...src.split('<script type="text/x-dc"')[0].matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))];
let bad = 0;
for (const status of ['ready', 'starting', 'awake', 'paused', 'blocked', 'needtap', 'fallback', 'ended'])
  for (const face of ['ring', 'bold', 'horizon', 'tide'])
    for (const layout of ['phone', 'desktop'])
      for (const theme of ['light', 'dark']) {
        const c = new Component({ status, face, layout, theme, phase: 'auto' });
        const v = c.renderVals();
        for (const h of holes) {
          if (['f', 'c', 'u', 'b', 'true', 'false'].includes(h.split('.')[0])) continue;
          const val = h.split('.').reduce((o, k) => (o == null ? o : o[k]), v);
          if (val === undefined) { bad++; if (bad < 20) console.log('missing', h, status, face); }
        }
      }
// Interaction: start, tick, extend, stop, until, custom.
const c = new Component({});
let v = c.renderVals();
v.openUntil(); v = c.renderVals(); console.log('until chip:', v.untilChip, '|', v.primaryLabel, '|', v.untilOpts.map((u) => u.label).join(', '));
v.openCustom(); v = c.renderVals(); v.more(); v = c.renderVals(); console.log('custom:', v.customWords, '|', v.primaryLabel);
c.state.preset = 'p30'; c.start(); c.state.mode = 'awake'; c.tick(); v = c.renderVals();
console.log('awake:', v.statusLabel, v.bigA + v.bigB, v.metaA, v.metaB, v.arcDash, '|', v.dateLong, v.nowTime);
v.extend(); v = c.renderVals(); console.log('extended:', v.bigA + v.bigB, v.ofTotal);
v.stop(); v = c.renderVals(); console.log('stopped:', v.statusLabel, v.primaryLabel);
console.log('holes checked:', holes.length, 'missing:', bad);

// 2. Wrapper boards that mount Main with fixed props.
const wrap = (file, title, props, w = 390, h = 844) => process.env.WRITE_WRAPPERS && writeFileSync(new URL(file, dir), `<!doctype html>
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
wrap('RingDark.dc.html', 'ring dark', {"status": "awake", "face": "ring", "theme": "dark"});
wrap('BoldDark.dc.html', 'bold dark', {"status": "awake", "face": "bold", "theme": "dark"});
wrap('HorizonDark.dc.html', 'horizon dark', {"status": "awake", "face": "horizon", "theme": "dark", "phase": "night"});
wrap('TideDark.dc.html', 'tide dark', {"status": "awake", "face": "tide", "theme": "dark"});
wrap('PausedDark.dc.html', 'paused dark', {"status": "paused", "face": "ring", "theme": "dark"});
wrap('BlockedDark.dc.html', 'blocked dark', {"status": "blocked", "face": "ring", "theme": "dark"});
wrap('DoneDark.dc.html', 'done dark', {"status": "ended", "face": "tide", "theme": "dark"});
wrap('UntilDark.dc.html', 'until dark', {"status": "ready", "face": "ring", "panel": "until", "theme": "dark"});
wrap('RingLight.dc.html', 'ring light', {"status": "awake", "face": "ring", "theme": "light"});
wrap('BoldLight.dc.html', 'bold light', {"status": "awake", "face": "bold", "theme": "light"});
wrap('HorizonLight.dc.html', 'horizon light', {"status": "awake", "face": "horizon", "theme": "light", "phase": "day"});
wrap('TideLight.dc.html', 'tide light', {"status": "awake", "face": "tide", "theme": "light"});
wrap('PausedLight.dc.html', 'paused light', {"status": "paused", "face": "ring", "theme": "light"});
wrap('BlockedLight.dc.html', 'blocked light', {"status": "blocked", "face": "ring", "theme": "light"});
wrap('DoneLight.dc.html', 'done light', {"status": "ended", "face": "tide", "theme": "light"});
wrap('UntilLight.dc.html', 'until light', {"status": "ready", "face": "ring", "panel": "until", "theme": "light"});
wrap('DeskRingDark.dc.html', 'deskring dark', {"layout": "desktop", "status": "awake", "face": "ring", "theme": "dark"}, 1280, 800);
wrap('DeskHorizonDark.dc.html', 'deskhorizon dark', {"layout": "desktop", "status": "awake", "face": "horizon", "theme": "dark", "phase": "night"}, 1280, 800);
wrap('DeskTideDark.dc.html', 'desktide dark', {"layout": "desktop", "status": "awake", "face": "tide", "theme": "dark"}, 1280, 800);
wrap('DeskRingLight.dc.html', 'deskring light', {"layout": "desktop", "status": "awake", "face": "ring", "theme": "light"}, 1280, 800);
wrap('DeskHorizonLight.dc.html', 'deskhorizon light', {"layout": "desktop", "status": "awake", "face": "horizon", "theme": "light", "phase": "day"}, 1280, 800);
wrap('DeskTideLight.dc.html', 'desktide light', {"layout": "desktop", "status": "awake", "face": "tide", "theme": "light"}, 1280, 800);
console.log('wrappers written');
