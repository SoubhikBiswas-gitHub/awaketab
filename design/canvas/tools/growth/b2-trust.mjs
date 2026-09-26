import { header, DATELINE, PILL, RING, CLOSE_X, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthTrust';
export const title = 'Trust panel · how AwakeTab knows';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  state: { editor: 'enum', options: ['awake', 'paused', 'blocked', 'fallback'], default: 'awake' }
};

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}

  <main style="{{toolStyle}}">
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 16px">
      ${PILL}
      <button onClick="{{open}}" aria-haspopup="dialog" aria-expanded="{{openAria}}" style="min-height: 44px; padding: 0 4px; border: 0; background: transparent; font-size: 14px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 5px">How do we know?</button>
    </div>
    ${RING}
    <p style="max-width: 420px; font-size: 14px; line-height: 20px; color: {{t.muted}}; text-align: center; text-wrap: pretty">{{note}}</p>
  </main>

  <sc-if value="{{sheetOpen}}" hint-placeholder-val="{{true}}">
    <div aria-hidden="true" class="at-scrim" onClick="{{close}}" style="position: absolute; inset: 0; z-index: 20; background: {{scrim}}"></div>
    <section role="dialog" aria-modal="true" aria-labelledby="trust-h" class="{{sheetClass}}" style="{{sheetStyle}}">
      <sc-if value="{{isPhone}}" hint-placeholder-val="{{true}}">
        <div aria-hidden="true" style="width: 40px; height: 4px; border-radius: 999px; background: {{t.line2}}; margin: 12px auto 0"></div>
      </sc-if>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: {{headPad}}">
        <h2 id="trust-h" style="font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.02em">How AwakeTab knows</h2>
        <button onClick="{{close}}" aria-label="Close" style="width: 44px; height: 44px; flex-shrink: 0; border: 0; background: transparent; border-radius: 12px; color: {{t.ink2}}; display: grid; place-items: center">${CLOSE_X}</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 24px; padding: 0 20px 32px">
        <p style="font-size: 15px; line-height: 22px; color: {{t.ink2}}; text-wrap: pretty">Everything under Right now is read from your browser this second. Nothing here is a guess dressed up as a fact.</p>

        <section aria-labelledby="trust-now" style="display: flex; flex-direction: column; gap: 4px">
          <h3 id="trust-now" style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}; padding-bottom: 8px">Right now</h3>
          <ul style="display: flex; flex-direction: column">
            <sc-for list="{{checks}}" as="c" hint-placeholder-count="4">
              <li style="display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 12px; padding: 12px 0; border-top: 1px solid {{t.line}}">
                <span aria-hidden="true" style="width: 10px; height: 10px; margin-top: 8px; border-radius: 50%; box-sizing: border-box; border: 1px solid {{c.line}}; background: {{c.fill}}; justify-self: center"></span>
                <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                  <span style="font-size: 15px; font-weight: 600; color: {{t.ink}}">{{c.title}}</span>
                  <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">{{c.detail}}</span>
                </span>
              </li>
            </sc-for>
          </ul>
        </section>

        <section aria-labelledby="trust-data" style="display: flex; flex-direction: column; gap: 4px">
          <h3 id="trust-data" style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}; padding-bottom: 8px">Your data</h3>
          <ul style="display: flex; flex-direction: column">
            <li style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid {{t.line}}">
              <span style="font-size: 15px; font-weight: 600">No account</span>
              <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Nothing to sign up for. Pro uses a licence key, never a password.</span>
            </li>
            <li style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid {{t.line}}">
              <span style="font-size: 15px; font-weight: 600">Kept in this browser</span>
              <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Settings, this session and your stats stay on this device. No cookies and no ads on this page.</span>
            </li>
            <li style="display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid {{t.line}}">
              <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                <span id="trust-tele" style="font-size: 15px; font-weight: 600">Share anonymous usage data</span>
                <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Counts such as sessions started and pill changes. No IP address, no user id.</span>
              </span>
              <button role="switch" aria-checked="{{teleOn}}" aria-labelledby="trust-tele" onClick="{{toggleTele}}" style="position: relative; width: 52px; height: 44px; padding: 0; border: 0; background: transparent">
                <span aria-hidden="true" style="position: absolute; left: 0; top: 6px; width: 52px; height: 32px; box-sizing: border-box; border-radius: 999px; background: {{sw.track}}; border: 1px solid {{sw.line}}; transition: background-color .45s, border-color .45s"></span>
                <span aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 10px; width: 24px; height: 24px; border-radius: 50%; background: {{sw.knob}}; transform: translateX({{sw.x}})"></span>
              </button>
            </li>
          </ul>
        </section>

        <section aria-labelledby="trust-check" style="display: flex; flex-direction: column; gap: 4px">
          <h3 id="trust-check" style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}; padding-bottom: 8px">Check our work</h3>
          <ul style="display: flex; flex-direction: column">
            <sc-for list="{{links}}" as="l" hint-placeholder-count="3">
              <li style="border-top: 1px solid {{t.line}}">
                <a href="{{l.href}}" style="display: grid; grid-template-columns: minmax(0, 1fr) 20px; align-items: center; gap: 12px; min-height: 52px; box-sizing: border-box; padding: 8px 0; text-decoration: none; color: {{t.ink}}">
                  <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0"><span style="font-size: 15px; font-weight: 600">{{l.title}}</span><span style="font-size: 13px; color: {{t.muted}}">{{l.sub}}</span></span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="{{lamp}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
                </a>
              </li>
            </sc-for>
          </ul>
        </section>
      </div>
    </section>
  </sc-if>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), open: true, tele: true, startedAt: Date.now() - 19 * 60000 - 12000, lostAt: Date.now() - 2 * 60000 };
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const mode = this.props.state || 'awake';
    const pl = this.pill(mode, b);
    const total = 1800, left = Math.max(0, total - Math.round((s.now - s.startedAt) / 1000));
    const endMs = Math.round((s.startedAt + total * 1000) / 60000) * 60000;
    const p = left / total;
    const meta = { awake: ['Time left', 'until', this.when(endMs)], fallback: ['Time left', 'until', this.when(endMs)], paused: ['Paused', 'resumes when you return', ''], blocked: ['Not keeping awake', 'see the fix', ''] }[mode];
    const r = this.ring({ mode, p, shown: left, kicker: meta[0], metaA: meta[1], metaB: meta[2], size: desk ? 400 : tab ? 360 : 200 }, b);
    const dot = (c, solid) => ({ fill: solid ? c : 'transparent', line: c });
    const ok = dot(b.lamp, true), warn = dot(b.amber, true), bad = dot(b.red, true), info = dot(t.muted, false);
    const started = this.hm(s.startedAt), lost = this.hm(s.lostAt);
    const timer = Object.assign({ title: 'Timer', detail: 'Counts on your system clock, so a laptop that slept comes back with an honest number, not a stale one.' }, info);
    const batt = Object.assign({ title: 'Power settings', detail: 'Browsers do not report them. On iPhone, Low Power Mode forces a 30-second Auto-Lock even while the pill says awake.' }, info);
    const CHECKS = {
      awake: [
        Object.assign({ title: 'Wake lock', detail: 'Held. Your browser confirmed it at ' + started + ' and has not taken it back since.' }, ok),
        Object.assign({ title: 'This tab', detail: 'Visible. If you switch away, the browser takes the lock back and the pill says so.' }, ok),
        timer, batt
      ],
      paused: [
        Object.assign({ title: 'Wake lock', detail: 'Released by the browser at ' + lost + ', when this tab was hidden. The screen may sleep.' }, warn),
        Object.assign({ title: 'This tab', detail: 'Hidden. Come back and AwakeTab asks for the lock again by itself.' }, warn),
        timer, batt
      ],
      blocked: [
        Object.assign({ title: 'Wake lock', detail: 'Refused by the browser at ' + started + '. Nothing is keeping the screen on right now.' }, bad),
        Object.assign({ title: 'Usual causes', detail: 'The tab was not in front, the page sits in a frame without permission, or Safari needs one tap first. The fix is on the main screen.' }, info),
        timer
      ],
      fallback: [
        Object.assign({ title: 'Wake lock', detail: 'This browser has no Screen Wake Lock API, so there is nothing to ask for.' }, info),
        Object.assign({ title: 'Video fallback', detail: 'A muted one-frame video is playing, which keeps the screen on. It needs this tab visible and uses a little more battery.' }, ok),
        Object.assign({ title: 'This tab', detail: 'Visible. The video stops when the tab is hidden, and the pill will say so.' }, ok),
        timer
      ]
    };
    const NOTE = {
      awake: 'Started ' + started + ' · keep this tab visible',
      paused: 'You switched away, so the screen may sleep. Come back and it resumes by itself.',
      blocked: 'Your browser said no. The fix is below the clock.',
      fallback: 'Using a muted video to keep the screen on. It needs this tab visible and uses a little more battery.'
    };
    const on = s.tele;
    const sheetBase = 'box-sizing: border-box; z-index: 21; overflow-y: auto; overscroll-behavior: contain; background: ' + t.surface + '; color: ' + t.ink + '; ';
    return {
      tone: pl.tone, pl, r, note: NOTE[mode], checks: CHECKS[mode],
      aura: this.rgba(pl.tone, 0.08),
      toolStyle: 'position: relative; flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: ' + (desk ? '0 520px 40px 40px' : '8px 20px 120px'),
      sheetOpen: s.open, openAria: s.open ? 'true' : 'false',
      sheetClass: phone ? 'at-sheet-body at-sheet-up' : 'at-sheet-body at-sheet-side',
      sheetStyle: phone
        ? sheetBase + 'position: absolute; left: 0; right: 0; bottom: 0; height: 74%; border-radius: 28px 28px 0 0; border-top: 1px solid ' + t.line2 + '; box-shadow: ' + b.sheetShadow
        : sheetBase + 'position: absolute; top: 0; bottom: 0; inset-inline-end: 0; width: ' + (tab ? 440 : 460) + 'px; border-start-start-radius: 28px; border-end-start-radius: 28px; border-inline-start: 1px solid ' + t.line2 + '; box-shadow: ' + b.sheetShadow,
      headPad: phone ? '8px 12px 8px 20px' : '16px 12px 8px 20px',
      teleOn: on ? 'true' : 'false',
      sw: { track: on ? b.lamp : t.track, line: on ? b.lamp : t.line2, knob: on ? b.lampInk : t.muted, x: on ? '20px' : '0px' },
      toggleTele: () => this.setState({ tele: !this.state.tele }),
      links: [
        { title: 'Honest limits', sub: 'What a browser tab cannot do, said plainly', href: 'HomeBelow.dc.html' },
        { title: 'The engine is open source', sub: '@awaketab/wake, with a live state demo', href: 'PageLibrary.dc.html' },
        { title: 'How we check support', sub: 'Browser documentation and automated tests. Real-device results appear in the matrix once recorded.', href: 'PageAbout.dc.html' }
      ],
      open: () => this.setState({ open: true }), close: () => this.setState({ open: false })
    };
  }
`;

export const wrappers = [
  ['GrowthTrustPhoneDark', 'Trust panel · phone · dark · awake', { theme: 'dark', layout: 'phone', state: 'awake' }, 390, 844],
  ['GrowthTrustPhoneLight', 'Trust panel · phone · light · paused', { theme: 'light', layout: 'phone', state: 'paused' }, 390, 844],
  ['GrowthTrustDeskDark', 'Trust panel · desktop · dark · fallback', { theme: 'dark', layout: 'desktop', state: 'fallback' }, 1280, 800],
  ['GrowthTrustDeskLight', 'Trust panel · desktop · light · blocked', { theme: 'light', layout: 'desktop', state: 'blocked' }, 1280, 800]
];
