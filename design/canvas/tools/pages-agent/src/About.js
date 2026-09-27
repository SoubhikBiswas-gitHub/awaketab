const SIZES = { phone: [390, 3104], tablet: [820, 2296], desktop: [1280, 2066] };
const STATES = [['idle', 'Ready'], ['requesting', 'Starting…'], ['held', 'Screen awake'], ['lost', 'Paused — tab hidden'], ['denied', "Blocked — here's the fix"], ['unsupported', 'Tap to use the fallback'], ['fallback', 'Awake via video fallback']];
const DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';
const GLYPH = { lost: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z', denied: 'M6 1L11.2 10.5H.8z', fallback: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z' };
const JOURNEYS = ['Acquisition', 'Denial', 'Release on hidden tabs', 'Reacquisition', 'Fallback behaviour', 'Multi-tab warnings'];
const PRINCIPLES = [
  ['A tab is not a system setting', 'A normal browser tab cannot guarantee operation while hidden, prevent system sleep after a laptop lid closes, or override battery-saving policy.'],
  ['No fake input', 'AwakeTab does not simulate mouse movement or keystrokes and does not claim to keep chat presence indicators available.'],
  ['Nothing else on the awake screen', 'The awake screen carries no advertising or third-party scripts.'],
  ['Open to inspection', 'The core wake-lock package is developed as open-source software so its state transitions can be inspected independently.']
];

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: props.theme ?? 'auto', sysDark: sysDark() };
  }
  componentDidMount() { themeMount(this); }
  componentWillUnmount() { themeUnmount(this); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  renderVals() {
    const sh = shell(this, SIZES, '', 'desktop');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const TONE = { idle: t.muted, requesting: p.lamp, held: p.lamp, unsupported: p.lamp, fallback: p.lamp, lost: p.warn, denied: p.bad };
    return Object.assign(sh, {
      cols: isDesk ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr)',
      areas: isDesk ? '"intro side" "body side"' : '"intro" "side" "body"',
      rowGap: isDesk ? '64px' : '48px',
      mainPad: isDesk ? '32px 80px 0' : isTab ? '32px 32px 0' : '12px 16px 0',
      secGap: isDesk ? '96px' : '64px',
      avatarBg: t.raised, lampGlow: atRgba(p.lamp, 0.6),
      stateCols: isDesk ? 'repeat(4, minmax(0, 1fr))' : isTab ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
      states: STATES.map(([id, pill]) => ({ id, pill, glyph: GLYPH[id] || DOT, tone: TONE[id], fill: id === 'idle' || id === 'requesting' ? 'transparent' : TONE[id] })),
      journeys: JOURNEYS.map((label) => ({ label })),
      prinCols: isPhone ? '28px minmax(0, 1fr)' : '48px minmax(0, 1fr)',
      principles: PRINCIPLES.map(([head, body], i) => ({ n: '0' + (i + 1), head, body }))
    });
  }
}
