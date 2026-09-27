const SIZES = { phone: [390, 4228], tablet: [820, 3408], desktop: [1280, 3104] };
const STATES = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'];
const PILL = { idle: 'Ready', requesting: 'Starting…', held: 'Screen awake', lost: 'Paused — tab hidden', denied: "Blocked — here's the fix", unsupported: 'Tap to use the fallback', fallback: 'Awake via video fallback' };
const DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';
const GLYPH = { idle: DOT, requesting: DOT, held: DOT, unsupported: DOT, lost: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z', denied: 'M6 1L11.2 10.5H.8z', fallback: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z' };
// Grid cell of each state: column, row.
const CELL = { idle: [0, 0], requesting: [1, 0], held: [2, 0], unsupported: [0, 1], denied: [1, 1], lost: [2, 1], fallback: [0, 2] };
const EDGES = [['idle', 'requesting', 'request()'], ['requesting', 'held', 'acquired'], ['requesting', 'denied', 'denied'], ['held', 'lost', 'released'], ['lost', 'requesting', 'retry'], ['idle', 'unsupported', 'no API'], ['unsupported', 'fallback', 'gesture']];
const GEO = {
  wide: { w: 700, h: 310, nw: 180, nh: 64, col: 260, row: 124, cf: '13px', showPill: true, labels: true, mono: true },
  phone: { w: 316, h: 236, nw: 100, nh: 44, col: 108, row: 96, cf: '12px', showPill: false, labels: false, mono: false }
};
const SCENARIOS = {
  real: 'Uses this browser’s own Screen Wake Lock API. Switch tabs for real to see it pause.',
  simulated: 'An injected lock whose “tab hidden” releases it, so lost and the retry are visible.',
  denied: 'An injected lock that rejects with NotAllowedError, as Firefox does at 5 % battery or less while not charging.',
  unsupported: 'No Wake Lock API, so Request starts the inlined video fallback from your click.'
};
const MAJOR = '1';
const CODE = {
  esm: ['main.js', `import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  pill.textContent = to;            // idle · requesting · held · lost · denied · unsupported · fallback
  hint.textContent = advice ?? '';  // e.g. 'iframe_no_allow', 'hidden_document'
});
start.addEventListener('click', () => lock.request()); // a gesture keeps the video fallback available
stop.addEventListener('click', () => lock.release());`, 'ESM, for bundlers. Every change event carries the state it left, the state it entered, a reason and an advice code.'],
  cdn: ['index.html', `<!-- Once the npm package is published -->
<script src="https://cdn.jsdelivr.net/npm/@awaketab/wake@${MAJOR}/dist/awaketab-wake.iife.js"><\/script>
<script>
  const lock = AwakeTabWake.createWakeLock();
  document.querySelector('#start').addEventListener('click', () => lock.request());
<\/script>`, 'CDN, no build step. The IIFE build puts AwakeTabWake on the page.'],
  react: ['KeepAwake.jsx', `import { useWakeLock } from '@awaketab/wake/react';

export function KeepAwake() {
  const { state, request, release } = useWakeLock();
  return state === 'held' || state === 'fallback'
    ? <button onClick={release}>Screen awake · Stop</button>
    : <button onClick={request}>Keep screen on</button>;
}`, 'Each adapter is < 400 B and imports the core, so you get one lock instance.'],
  preact: ['KeepAwake.jsx', `import { useWakeLock } from '@awaketab/wake/preact';

export function KeepAwake() {
  const { state, request, release } = useWakeLock();
  return state === 'held' || state === 'fallback'
    ? <button onClick={release}>Screen awake · Stop</button>
    : <button onClick={request}>Keep screen on</button>;
}`, 'Each adapter is < 400 B and imports the core, so you get one lock instance.'],
  vue: ['KeepAwake.vue', `<script setup>
import { useWakeLock } from '@awaketab/wake/vue';
const { state, request, release } = useWakeLock();
<\/script>

<template>
  <button v-if="state === 'held' || state === 'fallback'" @click="release">Screen awake · Stop</button>
  <button v-else @click="request">Keep screen on</button>
</template>`, 'Each adapter is < 400 B and imports the core, so you get one lock instance.']
};
const TABS = [['esm', 'ESM'], ['cdn', 'CDN'], ['react', 'React'], ['preact', 'Preact'], ['vue', 'Vue']];
const CMP = [
  ['Last release', 'Maintained; semver', '16 December 2020'],
  ['Native Wake Lock', 'Yes, first', 'Yes (when present)'],
  ['Honest state', 'Seven states + change events with reason and advice', '`isEnabled` boolean'],
  ['Denial diagnosis', '`classifyDenial()` advice codes', 'None'],
  ['Fallback', 'Inlined 1-frame video, gesture-aware, pauses when hidden', 'Looping video, always on'],
  ['Size (gzip)', '≤ 3.4 KB, fallback included', '≈ 3.2 KB'],
  ['TypeScript · SSR', 'Native · inert on the server', 'Community typings · no'],
  ['Adapters', 'React, Preact, Vue (< 400 B each)', 'No']
];
const RELATED = [['How AwakeTab is checked', '#', '→'], ['Screen Wake Lock API guide', '#', '→'], ['NoSleep.js vs Wake Lock', '#', '→']];
const TOKEN = /(\/\/.*$|<!--.*?-->)|('[^']*'|"[^"]*"|`[^`]*`)|\b(import|from|export|function|const|return|let|await|async|new)\b|(<\/?[A-Za-z][\w-]*|\/?(?<!=)>)/g;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.timers = [];
    this.state = Object.assign({ theme: props.theme ?? 'auto', sysDark: sysDark(), tab: 'esm', codeCopied: false, installCopied: false }, this.fresh('real'));
  }
  fresh(scen) { return { scen, lock: 'idle', advice: null, log: [], visited: { idle: true }, last: null }; }
  componentDidMount() {
    themeMount(this);
    try {
      this.onVis = () => {
        if (this.state.scen !== 'real') return;
        if (document.visibilityState === 'visible' && this.state.lock === 'lost') this.realRequest('retry');
      };
      document.addEventListener('visibilitychange', this.onVis);
    } catch (e) {}
  }
  componentWillUnmount() {
    this.clear();
    themeUnmount(this);
    try { document.removeEventListener('visibilitychange', this.onVis); } catch (e) {}
    clearTimeout(this.ct); clearTimeout(this.it);
  }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.dropSentinel();
  }
  dropSentinel() {
    const s = this.sentinel;
    this.sentinel = null;
    if (s) { try { s.release(); } catch (e) {} }
  }
  later(fn, ms) { this.timers.push(setTimeout(fn, ms)); }
  go(to, reason, advice) {
    this.setState((s) => {
      if (s.lock === to && reason !== 'retry') return {};
      const entry = { at: Date.now(), from: s.lock, to, reason, advice: advice || null };
      const visited = Object.assign({}, s.visited, { [to]: true });
      return { lock: to, advice: advice || (to === 'held' || to === 'fallback' || to === 'idle' ? null : s.advice), log: [entry].concat(s.log).slice(0, 12), visited, last: [s.lock, to] };
    });
  }
  realRequest(reason) {
    let wl = null;
    try { wl = navigator && navigator.wakeLock ? navigator.wakeLock : null; } catch (e) { wl = null; }
    if (!wl) {
      this.go('unsupported', 'unsupported');
      this.later(() => this.go('fallback', 'fallback_started'), 420);
      return;
    }
    this.go('requesting', reason);
    let inIframe = false;
    try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }
    Promise.resolve().then(() => wl.request('screen')).then((sentinel) => {
      this.sentinel = sentinel;
      this.go('held', 'acquired');
      sentinel.addEventListener('release', () => {
        if (this.sentinel !== sentinel) return;
        this.sentinel = null;
        let hidden = false;
        try { hidden = document.visibilityState === 'hidden'; } catch (e) {}
        this.go('lost', hidden ? 'released_hidden' : 'released_platform', hidden ? 'hidden_document' : null);
      });
    }).catch((err) => {
      const name = err && err.name;
      this.go('denied', 'denied', name === 'SecurityError' ? 'insecure_context' : inIframe ? 'iframe_no_allow' : 'battery_saver');
    });
  }
  request() {
    const s = this.state;
    if (s.lock === 'held' || s.lock === 'fallback' || s.lock === 'requesting') return;
    if (s.scen === 'real') return this.realRequest('request');
    if (s.scen === 'unsupported') {
      if (s.lock !== 'unsupported') this.go('unsupported', 'unsupported');
      this.later(() => this.go('fallback', 'fallback_started'), 420);
      return;
    }
    this.go('requesting', 'request');
    if (s.scen === 'denied') this.later(() => this.go('denied', 'denied', 'battery_saver'), 350);
    else this.later(() => this.go('held', 'acquired'), 350);
  }
  release() {
    this.clear();
    if (this.state.lock !== 'idle') this.go('idle', 'user_release');
  }
  hide() {
    if (this.state.scen !== 'simulated') return;
    if (this.state.lock === 'held') this.go('lost', 'released_hidden', 'hidden_document');
  }
  show() {
    if (this.state.scen !== 'simulated' || this.state.lock !== 'lost') return;
    this.go('requesting', 'retry');
    this.later(() => this.go('held', 'acquired'), 350);
  }
  highlight(code, t, p, dark) {
    const kw = dark ? '#A594FF' : '#5A47CF';
    return code.split('\n').map((line, i) => {
      const segsOut = [];
      let last = 0, m;
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(line))) {
        if (m.index > last) segsOut.push({ x: line.slice(last, m.index), c: t.ink });
        segsOut.push({ x: m[0], c: m[1] ? t.muted : m[2] ? p.link : m[3] ? kw : t.ink2 });
        last = TOKEN.lastIndex;
      }
      if (last < line.length) segsOut.push({ x: line.slice(last), c: t.ink });
      return { n: i + 1, segs: segsOut };
    });
  }
  renderVals() {
    const s = this.state;
    const sh = shell(this, SIZES, '', 'desktop');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const TONE = { idle: t.muted, requesting: p.lamp, held: p.lamp, unsupported: p.lamp, fallback: p.lamp, lost: p.warn, denied: p.bad };
    const tone = TONE[s.lock];
    const live = s.lock === 'held' || s.lock === 'fallback';

    // Diagram geometry
    const G = isPhone ? GEO.phone : GEO.wide;
    const pos = (id) => { const [c, r] = CELL[id]; return [c * G.col, r * G.row]; };
    const ctr = (id) => { const [x, y] = pos(id); return [x + G.nw / 2, y + G.nh / 2]; };
    const clip = (dx, dy) => Math.min(dx ? (G.nw / 2) / Math.abs(dx) : Infinity, dy ? (G.nh / 2) / Math.abs(dy) : Infinity);
    const edges = EDGES.map(([a, b, label]) => {
      const [ax, ay] = ctr(a), [bx, by] = ctr(b);
      const len = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / len, dy = (by - ay) / len;
      const sa = clip(dx, dy) + 4, sb = clip(dx, dy) + 5;
      const x1 = ax + dx * sa, y1 = ay + dy * sa, x2 = bx - dx * sb, y2 = by - dy * sb;
      const hx = x2 - dx * 8, hy = y2 - dy * 8, nx = -dy * 4.5, ny = dx * 4.5;
      const on = s.last && s.last[0] === a && s.last[1] === b;
      const f = (n) => n.toFixed(1);
      return {
        d: 'M' + f(x1) + ' ' + f(y1) + 'L' + f(hx) + ' ' + f(hy), head: 'M' + f(x2) + ' ' + f(y2) + 'L' + f(hx + nx) + ' ' + f(hy + ny) + 'L' + f(hx - nx) + ' ' + f(hy - ny) + 'Z',
        stroke: on ? TONE[b] : t.line2, sw: on ? 2.5 : 1.5, dash: on ? 'none' : '4 5',
        label: G.labels ? label : '', hasLabel: G.labels, lx: f((x1 + x2) / 2) + 'px', ly: f((y1 + y2) / 2) + 'px', ink: on ? t.ink : t.muted
      };
    }).filter((e) => e);
    const nodes = STATES.map((id) => {
      const [x, y] = pos(id);
      const cur = s.lock === id, seen = !!s.visited[id];
      const tn = TONE[id];
      return {
        id, pill: PILL[id], x: x + 'px', y: y + 'px', cur: cur ? 'step' : 'false', glyph: GLYPH[id], tone: tn,
        border: cur ? atRgba(tn, 0.45) : seen ? t.line2 : t.line,
        bg: cur ? 'linear-gradient(' + atRgba(tn, 0.14) + ', ' + atRgba(tn, 0.14) + '), ' + t.surface : t.surface,
        shadow: cur ? '0 0 0 4px ' + rgba(tn, 0.1) + ', 0 0 30px ' + rgba(tn, 0.28) : 'none',
        ink: cur || seen ? t.ink : t.muted, sub: cur ? t.ink2 : t.muted, dot: cur || seen ? tn : t.muted
      };
    });
    const scale = isTab ? 632 / 700 : 1;

    const log = s.log.map((e, i) => ({
      time: hms(e.at), from: e.from, to: e.to, why: e.reason + (e.advice ? ', ' + e.advice : ''),
      toInk: TONE[e.to] === t.muted ? t.ink : TONE[e.to], cls: i === 0 ? 'at-in' : ''
    }));

    const [fileName, code, tabNote] = CODE[s.tab];
    const ti = TABS.findIndex((x) => x[0] === s.tab);
    const tabSeg = seg(TABS, s.tab, (id) => this.setState({ tab: id, codeCopied: false }), t, { fs: isPhone ? 13 : 14 });
    const tabs = tabSeg.items.map((b) => Object.assign({}, b, { tid: 'lib-tab-' + b.id }));
    const sim = s.scen === 'simulated';

    return Object.assign(sh, {
      mainPad: isDesk ? '40px 80px 0' : isTab ? '32px 32px 0' : '24px 16px 0', tabSeg, notePad: isPhone ? '20px' : '24px',
      chipLink: 'min-height: 44px; padding: 0 16px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; border: 1px solid ' + t.line2 + '; color: ' + t.ink + '; text-decoration: none; font-size: 15px; line-height: 22px; font-weight: 500',
      lampSoft: rgba(p.lamp, 0.14), lampLine: rgba(p.lamp, 0.45), warnSoft: rgba(p.warn, 0.08), warnLine: rgba(p.warn, 0.32),
      installLabel: s.installCopied ? 'Copied' : 'Copy', tagSoon: atTag(t, p.lamp),
      copyInstall: () => {
        try { navigator.clipboard.writeText('npm install @awaketab/wake'); } catch (e) {}
        clearTimeout(this.it); this.setState({ installCopied: true });
        this.it = setTimeout(() => this.setState({ installCopied: false }), 2000);
      },
      cardPad: isDesk ? '32px' : isTab ? '24px' : '20px 16px',
      cardShadow: dark ? '0 40px 80px -48px rgba(0,0,0,0.8)' : '0 30px 60px -40px rgba(14,23,38,0.25)',
      aura: rgba(tone, live ? (dark ? 0.12 : 0.08) : 0.04),
      demoCols: isDesk ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)',
      demoAreas: isDesk ? '"head head" "ctrl ctrl" "diag log"' : '"head" "ctrl" "diag" "log"',
      selW: isPhone ? '100%' : '380px',
      scen: s.scen,
      pickScenario: (e) => { this.clear(); this.setState(this.fresh(e.target.value in SCENARIOS ? e.target.value : 'real')); },
      scenNote: SCENARIOS[s.scen] + (sim ? '' : ' Simulate tab hidden and visible work in the second scenario.'),
      cur: { id: s.lock, pill: PILL[s.lock], tone, soft: rgba(tone, 0.12), line: rgba(tone, 0.38), glow: live ? rgba(tone, 0.8) : 'transparent', glyph: GLYPH[s.lock], fill: s.lock === 'idle' || s.lock === 'requesting' ? 'transparent' : tone },
      pill: atPill('M', s.lock, t),
      hasAdvice: !!s.advice, advice: s.advice || '',
      btnCols: isPhone ? 'repeat(2, minmax(0, 1fr))' : 'auto auto auto auto',
      request: () => this.request(), release: () => this.release(), hide: () => this.hide(), show: () => this.show(),
      simOff: !sim, btnRequest: atBtn('mediumLamp', t), btnRelease: atBtn('medium', t) + '; border: 0; background: ' + t.stopBg + '; color: ' + t.stopInk,
      btnSim: atBtn('medium', t) + (sim ? '' : '; background: transparent; border-color: ' + t.line + '; color: ' + t.muted + '; cursor: not-allowed') + (isPhone ? '; font-size: 14px; padding: 0 12px' : ''),
      g: { wpx: G.w + 'px', hpx: G.h + 'px', w: Math.round(G.w * scale) + 'px', h: Math.round(G.h * scale) + 'px', wn: G.w, hn: G.h, nw: G.nw + 'px', nh: G.nh + 'px', cf: G.cf, idFont: G.mono ? AT_MONO : 'font-family: inherit', showPill: G.showPill, scale: scale.toFixed(4) },
      edges, nodes,
      log, logEmpty: log.length === 0, logMin: isDesk ? '348px' : '240px',
      useCols: isDesk ? 'minmax(0, 300px) minmax(0, 1fr)' : 'minmax(0, 1fr)',
      tabs, tabX: tabSeg.x, tabId: 'lib-tab-' + s.tab, tabNote, fileName,
      lines: this.highlight(code, t, p, dark), lineNo: t.muted, codeFont: isPhone ? '13px' : '14px',
      codeCopied: s.codeCopied ? 'Copied' : '', copyAria: 'Copy the ' + TABS[ti][1] + ' example',
      copyCode: () => {
        try { navigator.clipboard.writeText(code); } catch (e) {}
        clearTimeout(this.ct); this.setState({ codeCopied: true });
        this.ct = setTimeout(() => this.setState({ codeCopied: false }), 2000);
      },
      cmp: CMP.map(([label, a, b], i) => ({ label, a: segs(a, p, t), b: segs(b, p, t), border: i ? '1px solid ' + t.line : 'none' })),
      related: RELATED.map(([label, href, arrow]) => ({ label, href, arrow }))
    });
  }
}
