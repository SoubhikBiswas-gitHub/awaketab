const SIZES = { phone: [390, 1536], tablet: [820, 1650], desktop: [1280, 1040] };
const GUIDES = [
  ['Keep your screen on while cooking', '/for/cooking'],
  ['Keep the screen on while presenting', '/for/presentations'],
  ['Keep the screen on while downloading', '/for/downloads'],
  ['Keep iPhone on in Safari', '/on/iphone-safari'],
  ['iPhone Auto-Lock Never is greyed out', '/guides/iphone-auto-lock-never-greyed-out'],
  ['Windows 11 screen off after 1 minute', '/guides/windows-11-screen-turns-off-after-1-minute']
];
const TOTAL = 1800;

function starList(seed, n) {
  let x = seed;
  const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let i = 0; i < n; i++) out.push(Math.round(r() * 354) + 'px ' + Math.round(r() * 136) + 'px 0 ' + (r() > 0.8 ? '1px' : '0') + ' rgba(255,255,255,' + (0.45 + r() * 0.55).toFixed(2) + ')');
  return out.join(', ');
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.stars1 = starList(11, 24);
    this.stars2 = starList(73, 16);
    this.state = { theme: props.theme ?? 'auto', sysDark: sysDark(), now: Date.now(), mode: 'ready', total: TOTAL, left: TOTAL, startedAt: Date.now() };
  }
  componentDidMount() {
    themeMount(this);
    this.timer = setInterval(() => this.tick(), 1000);
  }
  componentWillUnmount() { themeUnmount(this); clearInterval(this.timer); clearTimeout(this.boot); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  tick() {
    const s = this.state;
    const next = { now: Date.now() };
    if (s.mode === 'awake') {
      if (s.left <= 1) { next.left = 0; next.mode = 'ready'; next.total = TOTAL; next.left = TOTAL; }
      else next.left = s.left - 1;
    }
    this.setState(next);
  }
  start() {
    clearTimeout(this.boot);
    this.setState({ mode: 'starting', total: TOTAL, left: TOTAL, startedAt: Date.now(), now: Date.now() });
    this.boot = setTimeout(() => this.setState({ mode: 'awake' }), 900);
  }
  renderVals() {
    const s = this.state;
    const sh = shell(this, SIZES, '', 'phone');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const live = s.mode === 'awake' || s.mode === 'starting';
    const tone = live ? p.lamp : t.muted;
    const prog = s.left / s.total;
    const phi = (110 * prog * Math.PI) / 180;
    const cx = 179 + 140 * Math.cos(phi), cy = 160 - 116 * Math.sin(phi);
    const [bigA, bigB] = clockParts(s.left);
    const endMs = Math.round((s.now + s.left * 1000) / 60000) * 60000;
    const scale = isDesk ? 1.45 : isTab ? 1.6 : 1;
    return Object.assign(sh, {
      bead: tone, hdr: atHeader(this, t, sh.layout, '', tone), pill: atPill('M', s.mode === 'awake' ? 'held' : s.mode === 'starting' ? 'requesting' : 'idle', t),
      mainCols: isDesk ? '540px minmax(0, 1fr)' : 'minmax(0, 1fr)',
      mainPad: isDesk ? '48px 80px 0' : isTab ? '32px 32px 0' : '16px 16px 0',
      navTop: isDesk ? '64px' : '8px',
      aura: atRgba(tone, live ? (dark ? 0.14 : 0.1) : 0.05),
      statusLabel: s.mode === 'awake' ? 'Screen awake' : s.mode === 'starting' ? 'Starting…' : 'Ready',
      sc: { w: Math.round(358 * scale) + 'px', h: Math.round(236 * scale) + 'px', scale },
      sceneShadow: dark ? '0 30px 60px -30px rgba(0,0,0,0.8)' : '0 30px 60px -34px rgba(14,23,38,0.45)',
      stars1: this.stars1, stars2: this.stars2,
      orbX: (cx - 22).toFixed(1) + 'px', orbY: (cy - 22).toFixed(1) + 'px',
      bigA, bigB, horizonInk: t.horizonInk, digitInk: live ? t.horizonInk : AT_TOK.dark.ink2, secInk: AT_TOK.dark.ink2,
      timerAria: bigA + bigB + ' left',
      nowTime: hm(s.now),
      metaA: s.mode === 'ready' ? 'ends at' : 'until', metaB: hm(endMs),
      note: s.mode === 'ready' ? 'Keeps this screen on while this tab stays visible.' : s.mode === 'starting' ? 'Asking your browser to keep the screen on…' : 'Started ' + hm(s.startedAt) + ' · keep this tab visible',
      isSetup: s.mode === 'ready', isRun: s.mode !== 'ready',
      btnExtend: atBtn('medium', t) + '; height: 60px; font-size: 17px; line-height: 24px',
      start: () => this.start(),
      extend: () => this.setState({ left: s.left + 900, total: s.total + 900 }),
      stop: () => { clearTimeout(this.boot); this.setState({ mode: 'ready', total: TOTAL, left: TOTAL }); },
      guides: GUIDES.map(([title, path]) => ({ title, path }))
    });
  }
}
