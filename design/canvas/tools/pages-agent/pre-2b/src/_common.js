const DARK = {
  bg: 'radial-gradient(120% 70% at 50% 26%, #13203A 0%, #0A0E16 58%, #070A11 100%)',
  surface: '#111826', line: '#1F2940', line2: '#33405C', ink: '#EAF0F7', ink2: '#B7C1D1', muted: '#8E9AAE',
  track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16', chip: '#26324B', chipShadow: 'rgba(0,0,0,0.4)',
  tideBg: 'radial-gradient(90% 80% at 50% 15%, #16233B 0%, #0B111D 100%)', tideInkTop: '#EAF0F7', tideInkWater: '#04232A'
};
const LIGHT = {
  bg: 'radial-gradient(120% 70% at 50% 26%, #FFFFFF 0%, #F2F6FA 60%, #E7EEF6 100%)',
  surface: '#FFFFFF', line: '#DCE3EC', line2: '#C3CDDA', ink: '#0E1726', ink2: '#3A4659', muted: '#5B6779',
  track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F4F7FB', chip: '#E3EAF2', chipShadow: 'rgba(14,23,38,0.14)',
  tideBg: 'radial-gradient(90% 80% at 50% 15%, #FFFFFF 0%, #E8EFF6 100%)', tideInkTop: '#0E1726', tideInkWater: '#FFFFFF'
};
// Long-page ground: the tool's night lift anchored to the top (same as ContentArticle).
const PAGE = {
  dark: { ground: 'radial-gradient(1400px 900px at 50% -160px, #13203A 0%, rgba(10,14,22,0) 72%), #0A0E16', lamp: '#5BE0E8', lampFill: '#5BE0E8', lampInk: '#04232A', link: '#5BE0E8', warn: '#F2B34C', bad: '#FF7A7A', well: '#0D1320', wellInk: '#D6DEEA', codeBg: 'rgba(234,240,247,0.07)' },
  light: { ground: 'radial-gradient(1400px 900px at 50% -160px, #FFFFFF 0%, rgba(242,246,250,0) 72%), #F2F6FA', lamp: '#0A8F9B', lampFill: '#087B87', lampInk: '#FFFFFF', link: '#087B87', warn: '#B7791F', bad: '#D14343', well: '#F6F9FC', wellInk: '#1C2636', codeBg: 'rgba(14,23,38,0.06)' }
};
const FS = {
  desktop: { h1: '56px', h2: '30px', h3: '19px', lede: '21px', body: '17px', small: '14px' },
  tablet: { h1: '46px', h2: '27px', h3: '18px', lede: '19px', body: '17px', small: '14px' },
  phone: { h1: '36px', h2: '24px', h3: '17px', lede: '18px', body: '16px', small: '14px' }
};
const NAV = [['Use cases', '#', 'for'], ['Devices', '#', 'on'], ['Extension', 'PageExtensionDesk.dc.html', 'extension'], ['Pro', '#', 'pro']];

function rgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
function hm(ms) { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function hms(ms) { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); }
function fullDate(iso) { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
function dateLong(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString('en-GB', { weekday: 'long' }) + ', ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function pad2(n) { return String(n).padStart(2, '0'); }
function clockParts(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? [h + ':' + pad2(m), ':' + pad2(s)] : [pad2(m), ':' + pad2(s)];
}
function sysDark() { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return true; } }
function themeMount(c) {
  try {
    c.mq = window.matchMedia('(prefers-color-scheme: dark)');
    c.onMq = (e) => c.setState({ sysDark: e.matches });
    c.mq.addEventListener('change', c.onMq);
  } catch (e) {}
}
function themeUnmount(c) { if (c.mq) c.mq.removeEventListener('change', c.onMq); }
function layoutOf(props) { return ['phone', 'tablet', 'desktop'].includes(props.layout) ? props.layout : 'desktop'; }

// Inline markup: `code`, **strong**, [label](href). Returns segments for <sc-for>.
function segs(str, p, t) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m;
  const plain = 'color: inherit';
  const push = (text, style) => out.push({ text, style, isText: true, isLink: false, href: '' });
  while ((m = re.exec(str))) {
    if (m.index > last) push(str.slice(last, m.index), plain);
    if (m[1]) push(m[1], "font-family: 'Geist Mono', ui-monospace, monospace; font-size: 0.86em; padding: 1px 6px; border-radius: 6px; background: " + p.codeBg + '; color: ' + t.ink + '; overflow-wrap: anywhere');
    else if (m[2]) push(m[2], 'font-weight: 600; color: ' + t.ink);
    else out.push({ text: m[3], href: m[4], isText: false, isLink: true, style: '' });
    last = re.lastIndex;
  }
  if (last < str.length) push(str.slice(last), plain);
  return out;
}

// Shared shell values: theme tokens, layout flags, header, footer, theme switch.
function shell(c, sizes, current) {
  const s = c.state;
  const layout = layoutOf(c.props);
  const desk = layout === 'desktop', tab = layout === 'tablet', phone = layout === 'phone';
  const dark = s.theme === 'dark' || (s.theme === 'auto' && s.sysDark);
  const t = dark ? DARK : LIGHT;
  const p = dark ? PAGE.dark : PAGE.light;
  const size = sizes[layout];
  return {
    t, p, dark, layout, isDesk: desk, isTab: tab, isPhone: phone, notPhone: !phone, notDesk: !desk,
    W: size[0] + 'px', H: size[1] + 'px', fs: FS[layout],
    gut: desk ? '56px' : tab ? '70px' : '20px',
    headPad: desk ? '56px' : tab ? '70px' : '20px 12px', footPad: desk ? '56px' : tab ? '70px' : '20px', footGap: desk ? '96px' : '72px',
    bead: t.muted,
    nav: NAV.map(([label, href, id]) => ({ label, href, cur: id === current ? 'page' : 'false', color: id === current ? t.ink : t.ink2, dot: id === current ? 1 : 0 })),
    themeLight: s.theme === 'light', themeDark: s.theme === 'dark', themeAuto: s.theme === 'auto',
    themeX: (s.theme === 'light' ? 0 : s.theme === 'dark' ? 44 : 88) + 'px',
    themeLightInk: s.theme === 'light' ? t.ink : t.muted, themeDarkInk: s.theme === 'dark' ? t.ink : t.muted, themeAutoInk: s.theme === 'auto' ? t.ink : t.muted,
    setLight: () => c.setState({ theme: 'light' }), setDark: () => c.setState({ theme: 'dark' }), setAuto: () => c.setState({ theme: 'auto' })
  };
}

// A segmented bar (one sliding indicator), as in Main.
function seg(options, current, onPick, t) {
  const i = Math.max(0, options.findIndex((o) => o[0] === current));
  return {
    n: options.length, x: i * 100 + '%',
    items: options.map(([id, label, aria]) => ({ id, label, aria: aria || label, sel: id === current ? 'true' : 'false', weight: id === current ? 600 : 500, color: id === current ? t.ink : t.ink2, pick: () => onPick(id) }))
  };
}
