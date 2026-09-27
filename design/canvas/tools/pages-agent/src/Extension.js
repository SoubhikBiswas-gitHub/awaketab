const SIZES = { phone: [390, 5544], tablet: [820, 4476], desktop: [1280, 3512] };
const ADDS = [
  ['With the tab hidden or the window minimised', 'Pauses until you come back', 'Keeps going while Chrome is running'],
  ['What stays awake', 'The screen', 'The screen, or only the computer'],
  ['Timers', 'Presets, custom lengths and until a time', '15 minutes to 4 hours, until a time, or until you stop'],
  ['Status at a glance', 'The pill in the tab', 'The popup pill and a toolbar badge: ON, SYS or minutes left'],
  ['Shortcut', '{Space}, while the tab is in front', '{Alt}+{Shift}+{A} from any tab'],
  ['Schedules and auto-start', 'No', 'With Pro'],
  ['Install', 'Nothing to install', 'Chrome or Edge']
];
const LIMITS = ['It works only while Chrome is running.', 'It can’t stop sleep when you close a laptop lid.', 'It doesn’t keep Teams or Slack showing you as available: presence follows your keyboard and mouse, and AwakeTab never fakes input.'];
const PERMS = [
  ['power', '', 'Hold the display or system keep-awake.'],
  ['storage', '', 'Save your settings and the current session.'],
  ['alarms', '', 'Run timers and schedules while the background worker sleeps.'],
  ['notifications', 'Optional', 'Tell you when a timer ends.'],
  ['Site access', 'Optional, one site at a time', 'Start automatically on sites you pick. No site access by default.']
];
const LEVELS = [['screen', 'Screen'], ['system', 'System']];
const DAYS = [['M', 'Monday', 1], ['T', 'Tuesday', 1], ['W', 'Wednesday', 1], ['T', 'Thursday', 1], ['F', 'Friday', 1], ['S', 'Saturday', 0], ['S', 'Sunday', 0]];

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: props.theme ?? 'auto', sysDark: sysDark(), level: 'screen' };
  }
  componentDidMount() { themeMount(this); }
  componentWillUnmount() { themeUnmount(this); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  renderVals() {
    const s = this.state;
    const sh = shell(this, SIZES, 'extension', 'desktop');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const sys = s.level === 'system';
    const popScale = isPhone ? 358 / 360 : 1;
    return Object.assign(sh, {
      mainPad: isDesk ? '32px 80px 0' : isTab ? '32px 32px 0' : '12px 16px 0',
      secGap: isDesk ? '96px' : isTab ? '64px' : '48px',
      heroCols: isDesk ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)',
      pop: { w: Math.round(360 * popScale) + 'px', h: Math.round(600 * popScale) + 'px', scale: popScale.toFixed(4) },
      popStatus: sys ? 'system' : 'awake', popTheme: dark ? 'dark' : 'light',
      popAura: rgba(p.lamp, dark ? 0.18 : 0.14), popShadow: dark ? '0 40px 80px -30px rgba(0,0,0,0.8)' : '0 40px 80px -36px rgba(14,23,38,0.35)',
      lampGlow: rgba(p.lamp, 0.55), lampSoft: rgba(p.lamp, 0.14), lampLine: rgba(p.lamp, 0.45),
      lampSoftPill: rgba(p.lamp, 0.12), lampLinePill: rgba(p.lamp, 0.38),
      adds: ADDS.map(([label, web, ext], i) => ({ label, web: segs(web, p, t), ext: segs(ext, p, t), border: i ? '1px solid ' + t.line : 'none' })),
      levelCols: isDesk ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
      levels: seg(LEVELS, s.level, (id) => this.setState({ level: id }), t).items,
      levelX: sys ? '100%' : '0%', levelSeg: seg(LEVELS, s.level, (id) => this.setState({ level: id }), t, { max: '360px' }),
      pill: atPill('M', 'held', t, { label: sys ? 'System awake' : 'Screen awake' }),
      levelHelp: sys ? 'Keeps the computer awake. The screen may still dim or turn off.' : 'Keeps the screen on and the computer awake.',
      levelPill: sys ? 'System awake' : 'Screen awake', levelSub: sys ? 'Screen may dim or lock' : ' ', levelBadge: sys ? 'SYS' : 'ON',
      lap: {
        w: isPhone ? 280 : 320, h: isPhone ? 175 : 200,
        frame: dark ? '#1E2638' : '#CFD8E3', notch: dark ? '#2A3550' : '#B7C3D1',
        screen: dark ? '#05070B' : '#1A2230', glow: dark ? '#13203A' : '#FFFFFF', glowOp: sys ? 0 : 1,
        contentOp: sys ? 0.12 : 1, bar: t.ink, bar2: t.line2, chip: p.lamp, led: p.lamp
      },
      days: DAYS.map(([l, aria, on]) => ({ l, aria: aria + (on ? ', on' : ', off'), border: on ? p.lamp : t.line2, bg: on ? rgba(p.lamp, 0.14) : 'transparent', ink: on ? t.ink : t.muted })),
      twoCols: isPhone ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      limits: LIMITS.map((text) => ({ text })),
      perms: PERMS.map(([name, opt, why], i) => ({ name, opt, why, border: i ? '1px solid ' + t.line : 'none' })),
      permCols: isPhone ? 'minmax(0, 1fr)' : '128px minmax(0, 1fr)'
    });
  }
}
