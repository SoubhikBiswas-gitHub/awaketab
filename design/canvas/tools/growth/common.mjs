// Shared fragments for the Growth boards. Tokens, helmet CSS, header, pill and ring are copied
// from Main.dc.html so every Growth board reads as the same product.
import { readFileSync } from 'node:fs';
import { LINK, CSS, JS, HEADER_OPEN, LOGO, NAV, THEME, FOOTER as P_FOOTER, PILL as P_PILL, CTA_GLYPH as P_CTA } from '../fix2a/prim.mjs';

export const PROJECT = new URL('../directions/project/', import.meta.url);

const mainSrc = readFileSync(new URL('Main.dc.html', PROJECT), 'utf8');
const mainHelmet = mainSrc.split('<helmet>')[1].split('</helmet>')[0];

const EXTRA_CSS = [
  '.at-rise3{animation:at-in .9s var(--ease) both;animation-delay:.35s}',
  '.at-step{transition:opacity .6s var(--ease),transform .6s var(--ease),background-color .6s var(--ease),border-color .6s var(--ease)}',
  '.at-l button:focus-visible,.at-l a:focus-visible,.at-l input:focus-visible,.at-l textarea:focus-visible{outline-color:#087B87}'
].join('\n');

// Shared primitives (fix batch 2a) plus the face classes Main defines that the shared block does not.
const mainStyle = mainHelmet.split('<style>')[1].split('</style>')[0].split('\n');
const keyOf = (l) => { const m = /^(@keyframes [\w-]+|\.[\w-]+)\{/.exec(l.trim()); return m ? m[1] : null; };
const FACE_CSS = mainStyle.filter((l) => { const k = keyOf(l); return k && !CSS.includes('\n' + k + '{') && !CSS.includes(' ' + k.replace('@keyframes ', '') + '{'); }).join('\n');
export const HELMET = '\n' + LINK + '\n' + CSS + '\n<style>\n' + FACE_CSS + '\n' + EXTRA_CSS + '\n</style>\n';

// Header: identical to Main (logo bead takes {{tone}}), desktop nav with an optional current item.
export function header(current) {
  return `  ${HEADER_OPEN}
    ${LOGO}
    ${NAV(current)}
    ${THEME}
  </header>`;
}

export const DATELINE = `  <div style="position: relative; flex-shrink: 0; padding: {{linePad}}; display: flex; justify-content: space-between; align-items: baseline; gap: 12px">
    <time style="font-size: 15px; line-height: 22px; color: {{t.ink2}}">{{dateLong}}</time>
    <time class="at-num" style="font-size: 15px; line-height: 22px; color: {{t.ink}}">{{nowTime}}</time>
  </div>`;

// Status pill from Main. Expects {{pl.*}} from pill().
export const PILL = P_PILL;

// Ring face from Main, drawn at 320 px and scaled. Expects {{r.*}} from ring().
export const RING = `<div style="position: relative; width: {{r.box}}; height: {{r.box}}; flex-shrink: 0">
          <div style="position: absolute; left: 0; top: 0; width: 320px; height: 320px; transform: scale({{r.scale}}); transform-origin: 0 0">
            <div aria-hidden="true" style="position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(from -0.6deg, {{t.tick}} 0deg 1.2deg, transparent 1.2deg 6deg); -webkit-mask: radial-gradient(circle, transparent 125px, #000 126px, #000 132px, transparent 133px); mask: radial-gradient(circle, transparent 125px, #000 126px, #000 132px, transparent 133px)"></div>
            <sc-if value="{{r.live}}" hint-placeholder-val="{{true}}">
              <div aria-hidden="true" class="at-sweep" style="position: absolute; inset: 28px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg 240deg, {{r.faint}} 360deg)"></div>
            </sc-if>
            <svg width="320" height="320" viewBox="0 0 320 320" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible">
              <defs><filter id="gRingGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"></feGaussianBlur></filter></defs>
              <circle cx="160" cy="160" r="146" fill="none" stroke="{{t.track}}" stroke-width="6" stroke-dasharray="{{r.trackDash}}"></circle>
              <g transform="rotate(-90 160 160)">
                <circle class="at-arc" cx="160" cy="160" r="146" fill="none" stroke="{{r.color}}" stroke-opacity="{{r.glowOp}}" stroke-width="14" stroke-linecap="round" filter="url(#gRingGlow)" style="stroke-dasharray: {{r.dash}}"></circle>
                <circle class="at-arc" cx="160" cy="160" r="146" fill="none" stroke="{{r.color}}" stroke-opacity="{{r.op}}" stroke-width="6" stroke-linecap="round" style="stroke-dasharray: {{r.dash}}"></circle>
              </g>
              <g class="at-lin" style="transform: rotate({{r.tipDeg}}); transform-origin: 160px 160px; opacity: {{r.tipOp}}">
                <circle class="at-halo" cx="160" cy="14" r="7" fill="{{r.color}}"></circle>
                <circle cx="160" cy="14" r="5.5" fill="{{t.ink}}"></circle>
              </g>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">
              <div class="at-kick" style="color: {{t.muted}}">{{r.kicker}}</div>
              <div role="timer" aria-label="{{r.aria}}" class="at-num" style="font-weight: 200; font-size: {{r.size}}; line-height: 1; letter-spacing: -0.02em; color: {{r.numColor}}; transition: color .6s">{{r.bigA}}<span style="color: {{t.muted}}">{{r.bigB}}</span></div>
              <div style="font-size: 15px; line-height: 22px; color: {{t.muted}}">{{r.metaA}} <span style="color: {{t.ink}}; font-weight: 500">{{r.metaB}}</span></div>
            </div>
          </div>
        </div>`;

// Footer shared by page boards (DESIGN.md 11.7).
export const FOOTER = `  ${P_FOOTER}`;

// Primary CTA glyph (logo ring + bead), from Main.
export const CTA_GLYPH = P_CTA;

export const CLOSE_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;

// Preset segmented bar from Main. Expects presets, presetN, presetX, presetFont.
export const PRESETS = `<sc-if value="{{notPhone}}" hint-placeholder-val="{{false}}">
          <div role="group" aria-label="Session length" style="position: relative; display: grid; grid-template-columns: repeat({{presetN}}, minmax(0, 1fr)); padding: 4px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
            <div aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 4px; width: calc((100% - 8px) / {{presetN}}); height: 44px; box-sizing: border-box; border-radius: 999px; background: {{lampSoft}}; border: 1px solid {{lampLine}}; transform: translateX({{presetX}})"></div>
            <sc-for list="{{presets}}" as="c" hint-placeholder-count="7">
              <button aria-pressed="{{c.sel}}" aria-label="{{c.aria}}" onClick="{{c.pick}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; font-size: {{presetFont}}; font-weight: {{c.weight}}; color: {{c.color}}; white-space: nowrap">{{c.label}}</button>
            </sc-for>
          </div>
          </sc-if>
          <sc-if value="{{isPhone}}" hint-placeholder-val="{{true}}">
          <div role="group" aria-label="Session length" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
            <sc-for list="{{presets}}" as="c" hint-placeholder-count="7">
              <button aria-pressed="{{c.sel}}" aria-label="{{c.aria}}" onClick="{{c.pick}}" class="at-slide" style="height: 44px; padding: 0; border-radius: 999px; border: 1px solid {{c.ring}}; background: {{c.bg}}; font-size: 15px; font-weight: {{c.weight}}; color: {{c.color}}; white-space: nowrap">{{c.label}}</button>
            </sc-for>
          </div>
          </sc-if>`;

// Constants and shared methods placed in every Component.
export const CONSTS = `${JS}const C = 2 * Math.PI * 146;
// Growth names on top of the shared tokens (all values are tokens).
const DARK = Object.assign({}, AT_DARK, { chip: AT_DARK.raised, chipShadow: 'transparent', field: AT_DARK.sunken, screen: AT_DARK.sunken });
const LIGHT = Object.assign({}, AT_LIGHT, { chip: AT_LIGHT.raised, chipShadow: 'transparent', field: AT_LIGHT.sunken, screen: AT_LIGHT.sunken });
// Lamp colours (DESIGN.md 2.2): id, name, dark, light, Pro.
const LAMPS = [['aqua', 'Aqua', '#5BE0E8', '#087B87', false], ['violet', 'Violet', '#A594FF', '#5A47CF', false], ['mint', 'Mint', '#7EF0B8', '#167A50', true], ['sky', 'Sky', '#7CB8FF', '#255FBD', true]];
// Preset labels from en.json; phones show all seven (PRODUCT.md anti-reference). ∞ is named Until I stop.
const PRESET_ROWS = [['p15', '15 min', '15 minutes', 900], ['p30', '30 min', '30 minutes', 1800], ['p45', '45 min', '45 minutes', 2700], ['p60', '1 h', '1 hour', 3600], ['p120', '2 h', '2 hours', 7200], ['p240', '4 h', '4 hours', 14400], ['pinf', '∞', 'Until I stop', 0]];
const DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';
const GLYPH = { paused: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z', blocked: 'M6 1L11.2 10.5H.8z', fallback: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z' };
// Pill strings are a contract: exactly these seven.
const LABEL = { ready: 'Ready', ended: 'Ready', starting: 'Starting…', awake: 'Screen awake', paused: 'Paused — tab hidden', blocked: "Blocked — here's the fix", needtap: 'Tap to use the fallback', fallback: 'Awake via video fallback' };
`;

export const METHODS = `  sys() { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return true; } }
  componentDidMount() {
    this.timer = setInterval(() => this.tick(), 1000);
    try {
      this.mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.onMq = (e) => this.setState({ sysDark: e.matches });
      this.mq.addEventListener('change', this.onMq);
    } catch (e) {}
    if (this.mount) this.mount();
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    (this.timers || []).forEach((x) => clearTimeout(x));
    if (this.mq) this.mq.removeEventListener('change', this.onMq);
  }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
    if (this.update) this.update(prev);
  }
  tick() { this.setState({ now: Date.now() }); if (this.onTick) this.onTick(); }
  later(ms, fn) { (this.timers = this.timers || []).push(setTimeout(fn, ms)); }
  rgba(hex, a) {
    const n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  hm(ms, secs) {
    const o = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (secs) o.second = '2-digit';
    return new Date(ms).toLocaleTimeString('en-US', o);
  }
  nextDay(ms) { return new Date(ms).toDateString() !== new Date(this.state.now).toDateString(); }
  when(ms) { return this.hm(ms) + (this.nextDay(ms) && ms > this.state.now ? ' tomorrow' : ''); }
  dateLong(ms) {
    const d = new Date(ms);
    return d.toLocaleDateString('en-GB', { weekday: 'long' }) + ', ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  split(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h ? [h + ':' + p(m), ':' + p(s)] : [p(m), ':' + p(s)];
  }
  words(sec) {
    if (!sec) return 'no limit';
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    if (h && m) return h + ' h ' + m + ' min';
    if (h) return h === 1 ? '1 hour' : h + ' hours';
    return m + ' min';
  }
  mins(m) {
    if (!m) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min';
  }
  pill(mode, b) {
    const tone = { ready: b.t.muted, ended: b.t.muted, paused: b.amber, blocked: b.red }[mode] || b.lamp;
    const live = mode === 'awake' || mode === 'fallback' || mode === 'starting';
    const hollow = mode === 'ready' || mode === 'ended' || mode === 'starting';
    return atPill({ size: 'M', label: LABEL[mode], tone, glyph: GLYPH[mode] || DOT, hollow, glow: live && mode !== 'starting' });
  }
  ring(o, b) {
    const mode = o.mode, p = o.p;
    const live = mode === 'awake' || mode === 'fallback' || mode === 'starting';
    const tone = { paused: b.amber, blocked: b.red }[mode] || o.color || b.lamp;
    const DASH = { paused: '18 12', blocked: '1 13' };
    const shown = o.shown;
    const parts = shown === null ? ['∞', ''] : this.split(shown);
    const size = o.size || 320;
    return {
      box: size + 'px', scale: (size / 320).toFixed(4), live, color: tone, faint: this.rgba(tone, b.dark ? 0.16 : 0.12),
      dash: DASH[mode] || (p <= 0 ? '0.01 ' + C.toFixed(1) : (C * p).toFixed(1) + ' ' + C.toFixed(1)),
      op: mode === 'ready' ? 0.45 : mode === 'ended' ? 0 : 1, glowOp: live ? 0.45 : 0,
      trackDash: mode === 'fallback' ? '3 9' : 'none',
      tipDeg: (360 * p).toFixed(2) + 'deg', tipOp: live && shown !== null && p > 0 ? 1 : 0,
      kicker: o.kicker, metaA: o.metaA, metaB: o.metaB, bigA: parts[0], bigB: parts[1],
      size: shown !== null && shown >= 3600 ? '60px' : '76px', numColor: live ? b.t.ink : b.t.ink2,
      aria: shown === null ? 'No limit' : parts[0] + parts[1] + ' left'
    };
  }
  presetBar(cur, phone, b, set) {
    const rows = PRESET_ROWS;
    const i = Math.max(0, rows.findIndex((x) => x[0] === cur));
    return {
      presets: rows.map(([id, label, aria]) => ({ label, aria, sel: cur === id ? 'true' : 'false', weight: cur === id ? 600 : 500, color: cur === id ? b.t.ink : b.t.ink2, ring: cur === id ? b.lampLine : b.t.line, bg: cur === id ? b.lampSoft : 'transparent', pick: () => set(id) })),
      presetN: rows.length, presetX: i * 100 + '%', presetFont: b.isTab ? '15px' : '13px'
    };
  }
  presetSecs(id) { const f = PRESET_ROWS.find((x) => x[0] === id); return f ? f[3] : 1800; }
  base() {
    const s = this.state;
    const L = this.props.layout || 'phone';
    const c = atChrome({ theme: s.theme, sysDark: s.sysDark, layout: L, set: (id) => this.setState({ theme: id }) });
    const dark = c.dark, lamp = c.lamp;
    const t = dark ? DARK : LIGHT;
    const amber = t.warn, red = t.bad;
    const H = this.heights()[L];
    return Object.assign(c, {
      t, amber, red, amberSoft: this.rgba(amber, 0.1), amberLine: this.rgba(amber, 0.38), redSoft: this.rgba(red, 0.08), redLine: this.rgba(red, 0.32),
      layout: L, W: c.isDesk ? '1280px' : c.isTab ? '820px' : '390px', H: H + 'px', rootCls: dark ? 'at-root' : 'at-root at-l',
      hdrPad: '0 ' + c.gutter, linePad: '0 ' + c.gutter,
      sheetShadow: '0 24px 64px -24px rgba(0,0,0,.45)',
      dateLong: this.dateLong(s.now), nowTime: this.hm(s.now),
      scrim: 'rgba(4,7,12,0.55)',
      aura: this.rgba(lamp, dark ? 0.1 : 0.08)
    });
  }
  renderVals() { const b = this.base(); Object.assign(b, this.vals(b)); b.bead = b.tone || b.lamp; return b; }
`;

// Assemble one self-contained .dc.html.
export function page({ title, props, markup, logic, preview }) {
  const dp = JSON.stringify(Object.assign({}, props, { $preview: preview }));
  if (dp.includes("'")) throw new Error('single quote in data-props for ' + title);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AwakeTab · ${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>${HELMET}</helmet>
${markup.trim()}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${dp}'>
${CONSTS}
class Component extends DCLogic {
${logic.trim()}
${METHODS}}
</script>
</body>
</html>
`;
}

export const THEME_PROP = { editor: 'enum', options: ['auto', 'light', 'dark'], default: 'auto' };
export const LAYOUT_PROP = { editor: 'enum', options: ['phone', 'tablet', 'desktop'], default: 'phone' };

export function wrapper(base, title, props, w, h) {
  const attrs = Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<!doctype html>
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
<dc-import name="${base}" ${attrs} hint-size="${w}px,${h}px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
}
