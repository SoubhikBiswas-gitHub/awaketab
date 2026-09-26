import { header, DATELINE, PILL, CTA_GLYPH, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthShare';
export const title = 'Tell a friend · share a setup · no referral codes';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  variant: { editor: 'enum', options: ['tell', 'low', 'preset'], default: 'tell' }
};

const BTN = 'height: 52px; box-sizing: border-box; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap';
const GHOST = 'height: 52px; box-sizing: border-box; padding: 0 16px; border-radius: 20px; border: 0; background: transparent; font-size: 15px; font-weight: 600; color: {{t.ink2}}';
const CARD = 'display: flex; flex-direction: column; gap: 16px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: {{cardShadow}}';
const KICK = 'font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}';
const STARS = `<div role="radiogroup" aria-label="Rating, 1 to 5 stars" style="display: flex; gap: 4px">
              <sc-for list="{{stars}}" as="st" hint-placeholder-count="5">
                <button role="radio" aria-checked="{{st.sel}}" aria-label="{{st.aria}}" onClick="{{st.pick}}" style="width: 44px; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 12px; display: grid; place-items: center"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" fill="{{st.fill}}" stroke="{{st.line}}" stroke-width="1.5" stroke-linejoin="round"></path></svg></button>
              </sc-for>
            </div>`;

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}
  <main style="{{bodyStyle}}">
    <div style="grid-area: ctx; display: flex; flex-direction: column; gap: 16px; align-items: {{alignItems}}; text-align: {{textAlign}}">
      ${PILL}
      <sc-if value="{{showCtx}}" hint-placeholder-val="{{true}}">
        <p style="display: flex; flex-direction: column; gap: 4px"><span style="${KICK}">Session complete</span><span style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{ctxSize}}; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums">30<span style="font-size: 0.4em; color: {{t.ink2}}"> min</span></span><span style="font-size: 15px; color: {{t.ink2}}">ended at {{endText}} · your 5th session</span></p>
      </sc-if>
      <sc-if value="{{isPreset}}" hint-placeholder-val="{{false}}">
        <figure style="margin: 0; width: 100%; max-width: {{prevMax}}; display: flex; flex-direction: column; gap: 12px">
          <figcaption style="${KICK}">What they will see</figcaption>
          <div style="border-radius: 20px; overflow: hidden; border: 1px solid {{t.line}}; background: {{t.surface}}; text-align: start">
            <div aria-hidden="true" style="position: relative; height: {{ogH}}; background: radial-gradient(120% 90% at 50% 20%, #13203A 0%, #0A0E16 60%); display: grid; place-items: center">
              <svg width="{{ogRing}}" height="{{ogRing}}" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#1A2336" stroke-width="5"></circle><circle cx="60" cy="60" r="50" fill="none" stroke="#5BE0E8" stroke-width="5" stroke-linecap="round" stroke-dasharray="314 314" transform="rotate(-90 60 60)"></circle><text x="60" y="68" text-anchor="middle" font-family="Geist Mono, ui-monospace, monospace" font-size="24" font-weight="300" fill="#EAF0F7">{{ogDigits}}</text></svg>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; padding: 16px 16px 16px">
              <span style="font-size: 13px; color: {{t.muted}}">awaketab.com</span>
              <span style="font-size: 16px; font-weight: 600; line-height: 1.3">Keep your screen awake for {{lenWords}}</span>
              <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}">Free, no account. The pill says when it is really working.</span>
            </div>
          </div>
          <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">{{opensText}}</p>
        </figure>
      </sc-if>
    </div>

    <div style="grid-area: card; display: flex; flex-direction: column; gap: 12px; min-width: 0">
      <sc-if value="{{isTell}}" hint-placeholder-val="{{true}}">
        <section aria-labelledby="sh-tell" class="at-rise" style="${CARD}">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap">
            <p role="status" style="font-size: 15px; line-height: 22px; font-weight: 600">Thanks — that helps.</p>
            ${STARS}
          </div>
          <div style="height: 1px; background: {{t.line}}"></div>
          <h2 id="sh-tell" style="font-size: 20px; line-height: 28px; font-weight: 600">Know someone whose screen keeps going dark?</h2>
          <label style="display: flex; flex-direction: column; gap: 8px">
            <span style="font-size: 13px; color: {{t.muted}}">You can edit this before it goes anywhere</span>
            <textarea rows="4" maxLength="280" onChange="{{editMsg}}" style="box-sizing: border-box; width: 100%; resize: none; padding: 12px 16px; border-radius: 8px; border: 1px solid {{t.inputBorder}}; background: {{t.field}}; color: {{t.ink}}; font-size: 15px; line-height: 22px">{{msg}}</textarea>
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
            <button onClick="{{share}}" style="${BTN}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"></path><path d="M6 11H5v10h14V11h-1"></path></svg>Share…</button>
            <button onClick="{{copy}}" style="${BTN}">{{copyLabel}}</button>
            <button onClick="{{skip}}" style="${GHOST}">Not now</button>
          </div>
          <p style="font-size: 13px; line-height: 18px; color: {{t.muted}}; text-wrap: pretty">No referral codes and no rewards. The link is plain awaketab.com, with nothing that tracks you or them.</p>
        </section>
      </sc-if>

      <sc-if value="{{isLow}}" hint-placeholder-val="{{false}}">
        <section aria-labelledby="sh-low" class="at-rise" style="${CARD}">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap">
            <h2 id="sh-low" style="font-size: 20px; line-height: 28px; font-weight: 600">Sorry it fell short</h2>
            ${STARS}
          </div>
          <label style="display: flex; flex-direction: column; gap: 8px">
            <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}">Anything we should fix? (optional)</span>
            <textarea rows="4" maxLength="280" onChange="{{editNote}}" placeholder="The screen still went dark on my…" style="box-sizing: border-box; width: 100%; resize: none; padding: 12px 16px; border-radius: 8px; border: 1px solid {{t.inputBorder}}; background: {{t.field}}; color: {{t.ink}}; font-size: 15px; line-height: 22px">{{note}}</textarea>
            <span style="align-self: flex-end; font-family: Geist, system-ui, sans-serif; font-size: 12px; color: {{t.muted}}">{{noteCount}} / 280</span>
          </label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <button onClick="{{send}}" style="${BTN}">{{sendLabel}}</button>
            <button onClick="{{skip}}" style="${GHOST}">Maybe later</button>
          </div>
          <p style="font-size: 13px; line-height: 18px; color: {{t.muted}}; text-wrap: pretty">Your stars count toward the public rating exactly like anyone else's. We only suggest sharing after a 4 or 5.</p>
        </section>
      </sc-if>

      <sc-if value="{{isPreset}}" hint-placeholder-val="{{false}}">
        <section aria-labelledby="sh-preset" class="at-rise" style="${CARD}">
          <h2 id="sh-preset" style="font-size: 20px; line-height: 28px; font-weight: 600">Share this setup</h2>
          <div role="radiogroup" aria-label="Length" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
            <sc-for list="{{lens}}" as="l" hint-placeholder-count="4">
              <button role="radio" aria-checked="{{l.sel}}" onClick="{{l.pick}}" style="height: 44px; border-radius: 999px; border: 1px solid {{l.ring}}; background: {{l.bg}}; font-size: 14px; font-weight: {{l.weight}}; color: {{t.ink}}">{{l.label}}</button>
            </sc-for>
          </div>
          <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px">
            <span style="display: flex; flex-direction: column; gap: 4px"><span id="sh-auto" style="font-size: 15px; font-weight: 600">Start automatically</span><span style="font-size: 13px; color: {{t.muted}}">Starts as soon as the link opens, where the browser allows it</span></span>
            <button role="switch" aria-checked="{{autoOn}}" aria-labelledby="sh-auto" onClick="{{toggleAuto}}" style="position: relative; width: 52px; height: 44px; padding: 0; border: 0; background: transparent">
              <span aria-hidden="true" style="position: absolute; left: 0; top: 6px; width: 52px; height: 32px; box-sizing: border-box; border-radius: 999px; background: {{sw.track}}; border: 1px solid {{sw.line}}"></span>
              <span aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 10px; width: 24px; height: 24px; border-radius: 50%; background: {{sw.knob}}; transform: translateX({{sw.x}})"></span>
            </button>
          </div>
          <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px">
            <output aria-label="Link" style="min-height: 48px; box-sizing: border-box; padding: 0 16px; border-radius: 8px; border: 1px solid {{t.line2}}; background: {{t.field}}; display: flex; align-items: center; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 14px; color: {{t.ink}}; overflow-wrap: anywhere">{{url}}</output>
            <button onClick="{{copy}}" style="${BTN}">{{copyLabel}}</button>
          </div>
          <p style="font-size: 13px; line-height: 18px; color: {{t.muted}}">Nothing about you is in the link. It only carries the length.</p>
        </section>
      </sc-if>

      <sc-if value="{{closed}}" hint-placeholder-val="{{false}}">
        <p role="status" class="at-in" style="font-size: 14px; color: {{t.muted}}; text-align: {{textAlign}}">{{closedText}}</p>
      </sc-if>
    </div>

    <sc-if value="{{notPreset}}" hint-placeholder-val="{{true}}">
      <div style="grid-area: dock">
        <button onClick="{{skip}}" style="width: 100%; height: 60px; box-sizing: border-box; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 30px -8px {{lampGlow}}">${CTA_GLYPH}Again · 30 min</button>
      </div>
    </sc-if>
  </main>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), stars: props.variant === 'low' ? 2 : 5, closed: '', copied: false, sent: false, auto: false, len: 'p45', note: '',
      msg: 'I use AwakeTab to keep my screen on from a browser tab. It shows when it is really working, and there is no account. awaketab.com' };
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  update(prev) { if (prev.variant !== this.props.variant) this.setState({ stars: this.props.variant === 'low' ? 2 : 5, closed: '', copied: false, sent: false }); }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const v = this.props.variant || 'tell';
    const pl = this.pill('ended', b);
    const lowNow = s.stars <= 3;
    const isTell = v !== 'preset' && !s.closed && !lowNow, isLow = v !== 'preset' && !s.closed && lowNow;
    const starC = b.lamp; // Stars use the lamp, like the rating prompt in Extras; amber stays reserved for Paused.
    const stars = [1, 2, 3, 4, 5].map((n) => ({ aria: n + (n === 1 ? ' star' : ' stars'), sel: s.stars === n ? 'true' : 'false', fill: n <= s.stars ? starC : 'transparent', line: n <= s.stars ? starC : t.line2, pick: () => this.setState({ stars: n }) }));
    const LENS = [['p15', '15 min', '/15m', 900], ['p30', '30 min', '/30m', 1800], ['p45', '45 min', '/45m', 2700], ['p60', '1 h', '/1h', 3600]];
    const cur = LENS.find((l) => l[0] === s.len) || LENS[2];
    const lens = LENS.map(([id, label]) => ({ label, sel: s.len === id ? 'true' : 'false', ring: s.len === id ? b.lamp : t.line, bg: s.len === id ? b.lampSoft : 'transparent', weight: s.len === id ? 600 : 500, pick: () => this.setState({ len: id, copied: false }) }));
    const on = s.auto;
    const endMs = Math.round((s.now - 60000) / 60000) * 60000;
    return {
      tone: pl.tone, pl, aura: this.rgba(t.muted, 0.06),
      bodyStyle: desk
        ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr) 480px; grid-template-rows: 1fr auto auto 1fr; grid-template-areas: 'ctx .' 'ctx card' 'ctx dock' 'ctx .'; column-gap: 64px; row-gap: 20px; align-items: center; padding: 8px 80px 40px 80px"
        : tab
          ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 520px); justify-content: center; grid-template-rows: auto auto 1fr auto; grid-template-areas: 'ctx' 'card' '.' 'dock'; row-gap: 32px; padding: 40px 32px 48px"
          : "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto 1fr auto; grid-template-areas: 'ctx' 'card' '.' 'dock'; row-gap: 16px; padding: 12px 16px 20px",
      alignItems: desk ? 'flex-start' : 'center', textAlign: desk ? 'start' : 'center',
      ctxSize: desk ? '112px' : tab ? '88px' : '56px', endText: this.hm(endMs),
      isTell, isLow, showCtx: v !== 'preset' && !phone, isPreset: v === 'preset', notPreset: v !== 'preset', closed: !!s.closed, closedText: s.closed,
      stars, msg: s.msg, note: s.note, noteCount: s.note.length,
      editMsg: (e) => this.setState({ msg: String(e && e.target ? e.target.value : s.msg).slice(0, 280) }),
      editNote: (e) => this.setState({ note: String(e && e.target ? e.target.value : '').slice(0, 280) }),
      share: () => this.setState({ closed: 'Shared. Thank you for passing it on.' }),
      copy: () => this.setState({ copied: true }), copyLabel: s.copied ? 'Copied' : 'Copy link',
      send: () => this.setState({ closed: 'Sent. Thank you, we read every note.' }), sendLabel: 'Send',
      skip: () => this.setState({ closed: 'No problem. We will not ask again for a while.' }),
      lens, lenWords: this.words(cur[3]), ogDigits: cur[3] >= 3600 ? '1:00:00' : String(cur[3] / 60) + ':00',
      prevMax: desk ? '520px' : '100%', ogH: desk ? '220px' : '96px', ogRing: desk ? '150' : '72',
      url: 'awaketab.com' + cur[2] + (on ? '?autostart=1' : ''),
      opensText: on ? 'It opens AwakeTab set to ' + this.words(cur[3]) + ' and starts right away where the browser allows it. If not, one tap on Keep awake starts it.' : 'It opens AwakeTab set to ' + this.words(cur[3]) + '. It starts when they tap Keep awake.',
      autoOn: on ? 'true' : 'false', toggleAuto: () => this.setState({ auto: !this.state.auto, copied: false }),
      sw: { track: on ? b.lamp : t.track, line: on ? b.lamp : t.line2, knob: on ? b.lampInk : t.muted, x: on ? '20px' : '0px' }
    };
  }
`;

export const wrappers = [
  ['GrowthShareTellPhoneDark', 'Tell a friend · after 5 stars · phone · dark', { theme: 'dark', layout: 'phone', variant: 'tell' }, 390, 844],
  ['GrowthShareLowPhoneLight', 'Low rating · ask what to fix, no share · phone · light', { theme: 'light', layout: 'phone', variant: 'low' }, 390, 844],
  ['GrowthSharePresetDeskLight', 'Share a setup · link preview · desktop · light', { theme: 'light', layout: 'desktop', variant: 'preset' }, 1280, 800],
  ['GrowthSharePresetPhoneDark', 'Share a setup · link preview · phone · dark', { theme: 'dark', layout: 'phone', variant: 'preset' }, 390, 844],
  ['GrowthShareTellDeskDark', 'Tell a friend · after 5 stars · desktop · dark', { theme: 'dark', layout: 'desktop', variant: 'tell' }, 1280, 800]
];
