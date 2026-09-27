const SIZES = { phone: [390, 4360], tablet: [820, 3456], desktop: [1280, 2992] };
const ORIGIN = 'https://awaketab.com';
const TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SAMPLE_TOKEN = 'eyJwbGFuIjoiYml6X2tpb3NrX3NpdGUifQ.c2FtcGxlLWtpb3Nr.c2lnbmF0dXJl';
const MODES = [['message', 'Message'], ['clock', 'Clock'], ['minimal', 'Minimal'], ['standard', 'Standard'], ['night', 'Night']];
const KTHEMES = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark'], ['oled', 'OLED black']];
const LENGTHS = [['pinf', 'Until I stop', 'Until I stop'], ['p60', '1 h', '1 hour'], ['p120', '2 h', '2 hours'], ['p240', '4 h', '4 hours']];
const SECS = { pinf: 0, p60: 3600, p120: 7200, p240: 14400 };
const KS = {
  dark: { bg: 'radial-gradient(120% 100% at 50% 8%, #13203A 0%, #0A0E16 72%)', ink: '#EAF0F7', ink2: '#B7C1D1', muted: '#8E9AAE', lamp: '#5BE0E8', track: '#1A2336' },
  light: { bg: 'radial-gradient(120% 100% at 50% 8%, #FFFFFF 0%, #F2F6FA 76%)', ink: '#0E1726', ink2: '#3A4659', muted: '#5B6779', lamp: '#087B87', track: '#E3E9F1' },
  oled: { bg: '#000000', ink: '#EAF0F7', ink2: '#B7C1D1', muted: '#8E9AAE', lamp: '#5BE0E8', track: '#1A2336' }
};
const RC = 2 * Math.PI * 112;
const YES = 'M5 12.5l4.5 4.5L19 7.5', NO = 'M7 12h10', INFO = 'M12 9a3 3 0 1 1 0 6a3 3 0 1 1 0-6z';
const ROWS = [
  ['Starts by itself', 'autostart=1', 'Yes', 'y', 'Yes', 'y'],
  ['Message, Clock, Minimal, Night or Standard screen', 'mode=', 'Yes', 'y', 'Yes', 'y'],
  ['Auto, light, dark or OLED theme', 'theme=', 'Yes', 'y', 'Yes', 'y'],
  ['Your message, up to 80 characters', 'msg=', '60 s preview', 'i', 'Stays on (also with Pro)', 'y'],
  ['Your logo above the timer and on the ambient screen', 'logo=', 'No', 'n', 'Yes', 'y'],
  ['AwakeTab wordmark', '', 'Shown', 'i', 'None', 'y'],
  ['Rating or upgrade prompts', '', 'Can appear', 'i', 'Never', 'y'],
  ['Licence check', '#lic=', 'Not needed', 'n', 'On the device, works offline', 'y']
];

function kioskMsg(raw) {
  const clean = String(raw).normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/gu, ' ').trim();
  return Array.from(clean).slice(0, 80).join('');
}
function httpsLogo(raw) {
  try {
    const u = new URL(String(raw).trim());
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
  } catch (e) { return ''; }
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    const lic = props.licensed === true || props.licensed === 'true';
    this.state = {
      theme: props.theme ?? 'auto', sysDark: sysDark(), now: Date.now(), startedAt: Date.now(),
      mode: 'message', kTheme: 'dark', len: 'pinf', autostart: true,
      msg: 'Welcome. Please ring the bell.', logo: lic ? 'https://example.com/logo.png' : '', token: lic ? SAMPLE_TOKEN : '', copied: false
    };
  }
  componentDidMount() {
    this.timer = setInterval(() => this.setState({ now: Date.now() }), 1000);
    themeMount(this);
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.ct); themeUnmount(this); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  url(s) {
    const q = new URLSearchParams();
    q.set('autostart', s.autostart ? '1' : '0');
    if (s.len !== 'pinf') q.set('preset', s.len);
    q.set('mode', s.mode);
    const msg = kioskMsg(s.msg);
    if (s.mode === 'message' && msg) q.set('msg', msg);
    q.set('theme', s.kTheme);
    const logo = httpsLogo(s.logo);
    if (logo) q.set('logo', logo);
    const token = s.token.trim();
    return { query: q.toString(), hash: TOKEN_RE.test(token) ? '#lic=' + token : '' };
  }
  renderVals() {
    const s = this.state;
    const sh = shell(this, SIZES, '', 'desktop');
    const { t, p, isDesk, isTab, isPhone } = sh;
    const reset = { startedAt: Date.now(), now: Date.now() };
    const segFs = isPhone ? 13 : 14;
    const modeSeg = seg(MODES, s.mode, (id) => this.setState({ mode: id }), t, { fs: segFs });
    const themeSeg = seg(KTHEMES, s.kTheme, (id) => this.setState({ kTheme: id }), t, { fs: segFs });
    const lenSeg = seg(LENGTHS, s.len, (id) => this.setState(Object.assign({ len: id }, reset)), t, { fs: segFs });

    const u = this.url(s);
    const urlSegs = [{ text: ORIGIN + '/?', color: t.muted }];
    u.query.split('&').forEach((pair, i) => {
      const at = pair.indexOf('=');
      if (i) urlSegs.push({ text: '&', color: t.muted });
      urlSegs.push({ text: pair.slice(0, at + 1), color: t.ink2 });
      urlSegs.push({ text: pair.slice(at + 1), color: t.ink });
    });
    if (u.hash) urlSegs.push({ text: u.hash, color: p.link });
    const fullUrl = ORIGIN + '/?' + u.query + u.hash;

    const token = s.token.trim();
    const tokenValid = TOKEN_RE.test(token);
    const logoOk = httpsLogo(s.logo) !== '';
    const logoRaw = s.logo.trim() !== '';

    // Preview screen
    const colW = isDesk ? 644 : isTab ? 680 : 350;
    const innerW = colW - 20;
    const scale = innerW / 640;
    const kKey = s.kTheme === 'auto' ? (sh.dark ? 'dark' : 'light') : s.kTheme;
    const kt = KS[kKey];
    const night = s.mode === 'night';
    const on = s.autostart;
    const tone = on ? kt.lamp : kt.muted;
    const total = SECS[s.len] ?? 0;
    const el = on ? Math.max(0, Math.floor((s.now - s.startedAt) / 1000)) : 0;
    const left = Math.max(0, total - el);
    let bigA, bigB, kicker, metaA, metaB;
    if (total === 0) {
      if (on) { [bigA, bigB] = clockParts(el); kicker = 'Awake for'; metaA = 'since'; metaB = hm(s.startedAt); }
      else { bigA = '∞'; bigB = ''; kicker = 'Keeps awake'; metaA = 'until you stop'; metaB = ''; }
    } else {
      [bigA, bigB] = clockParts(left);
      kicker = on ? 'Time left' : 'Keeps awake for';
      metaA = on ? 'until' : 'ends at';
      metaB = hm(on ? s.startedAt + total * 1000 : s.now + total * 1000);
    }
    const msg = kioskMsg(s.msg) || 'Your message';
    const msgLen = Array.from(msg).length;
    const now = hm(s.now);
    const ampm = now.slice(-2);

    const mark = (k) => (k === 'y' ? [YES, p.lamp, t.ink] : k === 'n' ? [NO, t.muted, t.muted] : [INFO, t.ink2, t.ink2]);
    const cmpRows = ROWS.map(([label, param, free, fk, lic, lk], i) => {
      const f = mark(fk), l = mark(lk);
      return { label, param, hasParam: param !== '', free, lic, freeGlyph: f[0], freeMark: f[1], freeInk: f[2], licGlyph: l[0], licMark: l[1], licInk: l[2], border: i ? '1px solid ' + t.line : 'none' };
    });

    const modeLabel = MODES.find((m) => m[0] === s.mode)[1];
    return Object.assign(sh, {
      mainPad: isDesk ? '40px 80px 0' : isTab ? '32px 32px 0' : '24px 16px 0',
      notePad: isPhone ? '20px' : '24px', chipLink: 'min-height: 44px; padding: 0 16px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; border: 1px solid ' + t.line2 + '; color: ' + t.ink + '; text-decoration: none; font-size: 15px; line-height: 22px; font-weight: 500',
      builderGrid: isDesk
        ? 'display: grid; grid-template-columns: 448px minmax(0, 1fr); grid-template-rows: auto auto 1fr; grid-template-areas: "head head" "form preview" "form url"; column-gap: 48px; row-gap: 32px; align-items: start'
        : 'display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "head" "preview" "form" "url"; row-gap: 32px',
      pairGrid: isTab ? 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px' : 'display: flex; flex-direction: column; gap: 24px',

      lampSoft: rgba(p.lamp, 0.14), lampLine: rgba(p.lamp, 0.45), warnSoft: rgba(p.warn, 0.08), warnLine: rgba(p.warn, 0.32),
      modeSeg, themeSeg, lenSeg,
      autoStr: on ? 'true' : 'false', toggleAuto: () => this.setState(Object.assign({ autostart: !on }, reset)),
      swBg: on ? p.lampFill : t.muted, swKnob: on ? p.lampInk : t.surface, swX: on ? '20px' : '0px', night: AT_NIGHT,
      msg: s.msg, msgCount: Array.from(s.msg).length,
      msgHint: s.mode === 'message' ? 'Without a Kiosk licence or Pro the screen shows the message for a 60 s preview; either one keeps it on.' : 'Only shown in Message mode, so it is left out of the link.',
      setMsg: (e) => this.setState({ msg: e.target.value.slice(0, 80) }),
      logo: s.logo, setLogo: (e) => this.setState({ logo: e.target.value }),
      logoHint: !logoRaw ? 'An https image, shown above the timer and on the ambient screen.' : !logoOk ? 'Needs an https address, so it is left out of the link.' : tokenValid ? 'Added to the link and shown on the screen.' : 'Added to the link. It shows only with a Kiosk licence token.',
      logoHintInk: logoRaw && !logoOk ? p.warn : t.muted,
      token: s.token, setToken: (e) => this.setState({ token: e.target.value }),
      tokenHint: !token ? 'Paste the token from your Kiosk licence. It fills itself in if you activated one here.' : tokenValid ? 'Added after #lic=, which browsers never send to a server.' : 'This does not look like a licence token, so it is left out of the link.',
      tokenHintInk: token && !tokenValid ? p.warn : t.muted,
      pv: { boxW: colW + 'px', boxH: Math.round(360 * scale + 20) + 'px', innerW: innerW + 'px', innerH: Math.round(360 * scale) + 'px', scale: scale.toFixed(4) },
      ks: {
        bg: night ? '#000000' : kt.bg, ink: kt.ink, ink2: kt.ink2, muted: kt.muted, track: kt.track, tone,
        pillS: atPill('S', on ? 'held' : 'idle', Object.assign({}, t, { lamp: night ? AT_NIGHT.muted : kt.lamp, muted: night ? AT_NIGHT.muted : kt.muted, ink: night ? AT_NIGHT.muted : kt.ink })),
        line: kKey === 'light' ? AT_TOK.light.line : AT_TOK.dark.line, surface: kKey === 'light' ? AT_TOK.light.surface : kKey === 'oled' ? AT_TOK.oled.surface : AT_TOK.dark.surface,
        aura: on && !night && kKey !== 'oled' ? rgba(kt.lamp, 0.12) : 'transparent',
        msg, msgSize: msgLen <= 24 ? '48px' : msgLen <= 48 ? '40px' : '32px'
      },
      isMessage: s.mode === 'message', isClock: s.mode === 'clock', isMinimal: s.mode === 'minimal', isStandard: s.mode === 'standard', isNight: night,
      showLogo: tokenValid && logoOk, noLogo: !(tokenValid && logoOk), showMark: !tokenValid,
      nowTime: now, clockMain: now.slice(0, -3), clockAmPm: ampm, dateLine: dateLong(s.now),
      bigA, bigB, kicker, metaA, metaB, ringSize: bigA.length > 3 ? '48px' : '56px',
      ringDash: total === 0 ? RC.toFixed(1) + ' ' + RC.toFixed(1) : Math.max(0.01, RC * (left / total)).toFixed(1) + ' ' + RC.toFixed(1),
      modeLabel, kThemeLabel: KTHEMES.find((k) => k[0] === s.kTheme)[1],
      pvNote: tokenValid ? (logoOk ? 'Licensed: your logo, no AwakeTab wordmark.' : 'Licensed: no AwakeTab wordmark.') : 'Free: shows the AwakeTab wordmark.',
      urlSegs, fullUrl,
      copyLabel: s.copied ? 'Copied' : 'Copy', copiedMsg: s.copied ? 'Link copied' : '',
      copy: () => {
        try { navigator.clipboard.writeText(fullUrl); } catch (e) {}
        clearTimeout(this.ct);
        this.setState({ copied: true });
        this.ct = setTimeout(() => this.setState({ copied: false }), 2000);
      },
      cmpCols: isPhone ? 'minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)',
      cmpGap: isPhone ? '12px' : '24px', cmpPad: isPhone ? '16px' : '24px', cmpType: isPhone ? AT_TYPE.small : AT_TYPE.body,
      colFree: isPhone ? 'Free' : 'Free for every screen', colLic: isPhone ? 'Kiosk licence' : 'With a Kiosk licence',
      cmpRows,
      priceGrid: isPhone ? 'display: flex; flex-direction: column; gap: 16px' : 'display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1fr); gap: ' + (isDesk ? '20px' : '16px') + '; align-items: stretch'
    });
  }
}
