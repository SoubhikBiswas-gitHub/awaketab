// Page shell on top of the primitives: t (theme tokens), p (page roles), ty (type scale per layout), hdr, ftr.
function pageRoles(t) {
  return {
    ground: 'radial-gradient(1400px 900px at 50% -160px, ' + t.lift + ' 0%, ' + atRgba(t.ground, 0) + ' 72%), ' + t.ground,
    lamp: t.lamp, lampFill: t.lamp, lampInk: t.onLamp, link: t.lamp, warn: t.warn, bad: t.bad, well: t.sunken, codeBg: t.sunken
  };
}
const rgba = atRgba;
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
// The default layout matches the board width: pages whose play-me board is 390 wide default to phone.
function layoutOf(props, def) { return ['phone', 'tablet', 'desktop'].includes(props.layout) ? props.layout : (def || 'desktop'); }

// Inline markup: `code`, **strong**, [label](href), {{key}} as a keycap (kbd). Returns segments for <sc-for>.
function segs(str, p, t) {
  const out = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\{([^{}]+)\}/g;
  let last = 0, m;
  const plain = 'color: inherit';
  const push = (text, style, kind) => out.push({ text, style, kind: kind || 'text', isText: true, isLink: false, href: '' });
  while ((m = re.exec(str))) {
    if (m.index > last) push(str.slice(last, m.index), plain);
    if (m[1]) push(m[1], atCode(t), 'code');
    else if (m[2]) push(m[2], 'font-weight: 600; color: ' + t.ink);
    else if (m[5]) push(m[5], atKbd(t), 'kbd');
    else out.push({ text: m[3], href: m[4], isText: false, isLink: true, style: '' });
    last = re.lastIndex;
  }
  if (last < str.length) push(str.slice(last), plain);
  return out;
}

// Shared shell values: theme tokens, layout flags, type scale, header, footer, gutters.
function shell(c, sizes, current, def) {
  const s = c.state;
  const layout = layoutOf(c.props, def);
  const desk = layout === 'desktop', tab = layout === 'tablet', phone = layout === 'phone';
  const { dark, t } = atTheme(s.theme, s.sysDark);
  const p = pageRoles(t);
  const size = sizes[layout];
  const g = AT_GUTTER[layout];
  return {
    t, p, dark, layout, isDesk: desk, isTab: tab, isPhone: phone, notPhone: !phone, notDesk: !desk,
    W: size[0] + 'px', H: size[1] + 'px',
    ty: Object.assign({}, AT_TYPE, { h1: phone ? AT_TYPE.h1Phone : AT_TYPE.h1, h2: phone ? AT_TYPE.h2Phone : AT_TYPE.h2, price: phone ? AT_TYPE.pricePhone : AT_TYPE.price }),
    gut: g + 'px', secGap: AT_SECTION[layout] + 'px', mono: AT_MONO, digitFont: AT_DIGITS,
    hdr: atHeader(c, t, layout, current, t.muted), ftr: atFooter(t, layout),
    card: atCard(t, phone), tag: atTag(t), code: atCode(t),
    setLight: () => c.setState({ theme: 'light' }), setDark: () => c.setState({ theme: 'dark' }), setAuto: () => c.setState({ theme: 'auto' }),
    btnPrimary: atBtn('primary', t), btnStop: atBtn('stop', t), btnMedium: atBtn('medium', t), btnSmall: atBtn('small', t), btnSmallLamp: atBtn('smallLamp', t), btnQuiet: atBtn('quiet', t)
  };
}

// A segmented bar (one sliding indicator), as in Main; shape kept for the page templates.
function seg(options, current, onPick, t, opts) {
  const b = atSeg(options, current, onPick, t, opts);
  const i = Math.max(0, options.findIndex((o) => o[0] === current));
  return Object.assign(b, { n: options.length, x: i * 100 + '%' });
}
