import { header, DATELINE, PILL, RING, PRESETS, CTA_GLYPH, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthFirstVisit';
export const title = 'First visit · proof in 5 seconds';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  start: { editor: 'enum', options: ['tap', 'auto'], default: 'tap' },
  status: { editor: 'enum', options: ['ready', 'awake'], default: 'ready' }
};

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}

  <main style="{{bodyStyle}}">
    <div style="grid-area: intro; display: flex; flex-direction: column; gap: 12px; text-align: {{textAlign}}">
      <h1 class="at-in" style="font-size: {{h1Size}}; line-height: {{h1LH}}; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance">Keeps this screen on while this tab is visible.</h1>
      <p class="at-rise" style="font-size: {{subSize}}; line-height: {{subLH}}; color: {{t.ink2}}; text-wrap: pretty">The pill says Screen awake only after your browser confirms it.</p>
    </div>

    <div style="grid-area: pill; display: flex; flex-direction: column; align-items: {{alignItems}}; gap: 4px">
      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: {{justify}}; gap: 4px 16px">
        ${PILL}
        <a href="GrowthTrust.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 5px">How do we know?</a>
      </div>
      <sc-if value="{{isPhone}}" hint-placeholder-val="{{true}}">
        <p role="status" style="font-size: 13px; line-height: 18px; color: {{t.muted}}; text-align: center; font-variant-numeric: tabular-nums; text-wrap: balance">{{proofLine}}</p>
      </sc-if>
    </div>

    <div style="grid-area: face; display: flex; align-items: center; justify-content: center">
      ${RING}
    </div>

    <sc-if value="{{notPhone}}" hint-placeholder-val="{{false}}">
      <div style="grid-area: proof; display: flex; flex-direction: column; gap: 8px">
        <h2 style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">What just happened</h2>
        <ol style="display: flex; flex-direction: column; border-top: 1px solid {{t.line}}">
          <sc-for list="{{steps}}" as="st" hint-placeholder-count="3">
            <li class="at-step" style="display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 44px; border-bottom: 1px solid {{t.line}}">
              <span aria-hidden="true" style="width: 14px; height: 14px; border-radius: 50%; box-sizing: border-box; border: 1px solid {{st.line}}; background: {{st.fill}}; box-shadow: 0 0 10px {{st.glow}}; justify-self: center"></span>
              <span style="font-size: 15px; color: {{st.ink}}; min-width: 0">{{st.title}}</span>
              <span style="font-family: Geist, system-ui, sans-serif; font-size: 13px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{st.meta}}</span>
            </li>
          </sc-for>
        </ol>
      </div>
    </sc-if>

    <div style="grid-area: dock; display: flex; flex-direction: column; gap: 20px">
      <sc-if value="{{dockSetup}}" hint-placeholder-val="{{true}}">
        <div style="display: flex; flex-direction: column; gap: 20px">
          ${PRESETS}
          <button class="at-rise" onClick="{{start}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 30px -8px {{lampGlow}}">
            ${CTA_GLYPH}
            {{primaryLabel}}
          </button>
        </div>
      </sc-if>
      <sc-if value="{{dockRun}}" hint-placeholder-val="{{false}}">
        <div class="at-rise" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
          <button onClick="{{extend}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 17px; font-weight: 600; color: {{t.ink}}">+15 min</button>
          <button onClick="{{stop}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 0; background: {{t.primaryBg}}; font-size: 17px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>
        </div>
      </sc-if>
    </div>

    <ul aria-label="Good to know" style="grid-area: facts; display: flex; flex-wrap: wrap; justify-content: {{justify}}; gap: 8px 20px; font-size: 13px; line-height: 18px; color: {{t.ink2}}">
      <sc-for list="{{facts}}" as="f" hint-placeholder-count="3">
        <li style="display: flex; align-items: center; gap: 8px"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.4l2.6 2.6L10 3.4" fill="none" stroke="{{lamp}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>{{f}}</li>
      </sc-for>
    </ul>
  </main>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), mode: 'ready', preset: 'p30', total: 1800, left: 1800, askedAt: 0, okAt: 0 };
    if (props.status === 'awake') Object.assign(this.state, { mode: 'awake', askedAt: Date.now() - 4600, okAt: Date.now() - 4200, left: 1796 });
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  mount() { if (this.props.start === 'auto' && this.state.mode === 'ready') this.later(900, () => this.begin()); }
  update(prev) {
    if (prev.status !== this.props.status) this.setState(this.props.status === 'awake' ? { mode: 'awake', askedAt: Date.now() - 4600, okAt: Date.now() - 4200, left: this.state.total || 1800 } : { mode: 'ready', askedAt: 0, okAt: 0 });
  }
  begin() {
    const total = this.presetSecs(this.state.preset);
    this.setState({ mode: 'starting', askedAt: Date.now(), okAt: 0, total, left: total });
    this.later(420, () => this.setState({ mode: 'awake', okAt: Date.now() }));
  }
  onTick() { const s = this.state; if (s.mode === 'awake' && s.total) this.setState({ left: Math.max(0, s.left - 1) }); }
  vals(b) {
    const s = this.state, mode = s.mode, t = b.t;
    const desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const pl = this.pill(mode, b);
    const total = mode === 'ready' ? this.presetSecs(s.preset) : s.total;
    const noLimit = total === 0;
    const left = mode === 'ready' ? total : s.left;
    const p = mode === 'ready' || noLimit ? 1 : left / total;
    const endMs = Math.round((s.now + left * 1000) / 60000) * 60000;
    let kicker = 'Keeps awake for', metaA = noLimit ? 'until you stop' : 'ends at', metaB = noLimit ? '' : this.when(endMs);
    if (mode === 'starting') kicker = 'Starting';
    if (mode === 'awake') { kicker = noLimit ? 'Awake for' : 'Time left'; metaA = noLimit ? 'since' : 'until'; metaB = noLimit ? this.hm(s.okAt) : this.when(endMs); }
    const shown = noLimit ? (mode === 'awake' ? Math.max(0, Math.round((s.now - s.okAt) / 1000)) : null) : left;
    const r = this.ring({ mode, p, shown, kicker, metaA, metaB, size: desk ? 480 : tab ? 360 : 232 }, b);
    const lat = s.okAt && s.askedAt ? ((s.okAt - s.askedAt) / 1000).toFixed(1) : '';
    let proofLine = 'Nothing is running yet. Tap Keep awake and watch the pill.';
    if (mode === 'starting') proofLine = 'Asked your browser at ' + this.hm(s.askedAt, true) + '. Waiting for its answer.';
    if (mode === 'awake') proofLine = 'Asked at ' + this.hm(s.askedAt, true) + ' · browser confirmed ' + lat + ' s later';
    const step = (title, meta, st) => ({ title, meta, line: st === 'todo' ? t.line2 : b.lamp, fill: st === 'done' ? b.lamp : 'transparent', glow: st === 'done' ? this.rgba(b.lamp, 0.5) : 'transparent', ink: st === 'todo' ? t.muted : t.ink });
    const steps = [
      step('Asked your browser for a wake lock', s.askedAt ? this.hm(s.askedAt, true) : 'Not yet', s.askedAt ? 'done' : 'todo'),
      step('Browser confirmed the lock', s.okAt ? lat + ' s later' : mode === 'starting' ? 'Waiting' : 'Not yet', s.okAt ? 'done' : mode === 'starting' ? 'now' : 'todo'),
      step('Pill switched to Screen awake', s.okAt ? this.hm(s.okAt, true) : 'Not yet', s.okAt ? 'done' : 'todo')
    ];
    const bar = this.presetBar(s.preset, phone, b, (id) => this.setState({ preset: id }));
    return Object.assign(bar, {
      tone: pl.tone, pl, r, proofLine, steps,
      aura: this.rgba(mode === 'awake' ? b.lamp : t.muted, mode === 'awake' ? (b.dark ? 0.16 : 0.12) : 0.06),
      bodyStyle: desk
        ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: 520px minmax(0, 1fr); grid-template-rows: 1fr auto auto auto auto auto 1fr; grid-template-areas: 'face .' 'face intro' 'face pill' 'face proof' 'face dock' 'face facts' 'face .'; column-gap: 64px; row-gap: 24px; padding: 8px 80px 32px 80px"
        : tab
          ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 520px); justify-content: center; grid-template-rows: auto auto auto auto auto 1fr auto; grid-template-areas: 'intro' 'pill' 'face' 'proof' 'facts' '.' 'dock'; row-gap: 24px; padding: 40px 32px 48px"
          : "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto auto auto 1fr auto; grid-template-areas: 'intro' 'pill' 'face' 'facts' '.' 'dock'; row-gap: 16px; padding: 12px 16px 20px",
      textAlign: desk ? 'start' : 'center', alignItems: desk ? 'flex-start' : 'center', justify: desk ? 'flex-start' : 'center',
      h1Size: phone ? '24px' : '28px', h1LH: phone ? '32px' : '36px', subSize: desk ? '18px' : '16px', subLH: desk ? '28px' : '26px',
      dockSetup: mode === 'ready', dockRun: mode !== 'ready',
      primaryLabel: 'Keep awake · ' + this.words(total),
      facts: ['No account', 'No ads on this screen', 'Works offline after this visit'],
      start: () => this.begin(),
      stop: () => this.setState({ mode: 'ready', askedAt: 0, okAt: 0 }),
      extend: () => this.setState({ left: s.left + 900, total: s.total + 900 })
    });
  }
`;

export const wrappers = [
  ['GrowthFirstVisitPhoneDark', 'First visit · phone · dark · tap to start', { theme: 'dark', layout: 'phone', start: 'tap' }, 390, 844],
  ['GrowthFirstVisitPhoneLight', 'First visit · phone · light · proof shown', { theme: 'light', layout: 'phone', status: 'awake' }, 390, 844],
  ['GrowthFirstVisitTabletDark', 'First visit · tablet · dark · auto-start', { theme: 'dark', layout: 'tablet', start: 'auto' }, 820, 1180],
  ['GrowthFirstVisitDeskDark', 'First visit · desktop · dark · proof shown', { theme: 'dark', layout: 'desktop', status: 'awake' }, 1280, 800],
  ['GrowthFirstVisitDeskLight', 'First visit · desktop · light · tap to start', { theme: 'light', layout: 'desktop', start: 'tap' }, 1280, 800]
];
