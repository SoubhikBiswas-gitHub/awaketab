import { header, DATELINE, PILL, PRESETS, CTA_GLYPH, CLOSE_X, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthDone';
export const title = 'Session done · one gentle next step';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  next: { editor: 'enum', options: ['install', 'ios', 'extension', 'pro', 'none'], default: 'install' },
  paused: { editor: 'enum', options: ['none', 'once'], default: 'once' }
};

const SECONDARY = 'height: 52px; box-sizing: border-box; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}';
const GHOST = 'height: 52px; box-sizing: border-box; padding: 0 16px; border-radius: 20px; border: 0; background: transparent; font-size: 15px; font-weight: 600; color: {{t.ink2}}';
const CARD = 'display: flex; flex-direction: column; gap: 16px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: {{cardShadow}}';
const ICON = (d) => `<sc-if value="{{notPhone}}" hint-placeholder-val="{{false}}"><span aria-hidden="true" style="width: 36px; height: 36px; flex-shrink: 0; border-radius: 12px; background: {{lampSoft}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{{lampText}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span></sc-if>`;

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}

  <main style="{{bodyStyle}}">
    <div style="grid-area: pill; justify-self: {{align}}">${PILL}</div>

    <section aria-labelledby="done-k" class="at-in" style="grid-area: receipt; align-self: center; display: flex; flex-direction: column; gap: {{recGap}}; text-align: {{textAlign}}; align-items: {{alignItems}}">
      <h1 id="done-k" style="font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Session complete</h1>
      <p style="display: flex; flex-direction: column; gap: 8px; align-items: {{alignItems}}">
        <span style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{bigSize}}; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: {{t.ink}}">{{heldBig}}<span style="font-size: {{unitSize}}; font-weight: 400; letter-spacing: -0.01em; color: {{t.ink2}}"> min</span></span>
        <span style="font-size: 16px; color: {{t.ink2}}">{{heldWords}}</span>
      </p>
      <div style="width: 100%; max-width: {{barMax}}; display: flex; flex-direction: column; gap: 8px">
        <div role="img" aria-label="{{barAria}}" style="display: flex; gap: 4px; height: 14px">
          <sc-for list="{{segs}}" as="g" hint-placeholder-count="3">
            <span style="flex-grow: {{g.grow}}; flex-basis: 0; border-radius: 999px; box-sizing: border-box; background: {{g.bg}}; border: {{g.border}}"></span>
          </sc-for>
        </div>
        <div aria-hidden="true" style="display: flex; justify-content: space-between; font-family: Geist, system-ui, sans-serif; font-size: 13px; color: {{t.muted}}; font-variant-numeric: tabular-nums"><span>{{fromTime}}</span><span>{{toTime}}</span></div>
        <ul style="display: flex; flex-wrap: wrap; gap: 8px 20px; justify-content: {{justify}}; font-size: 14px; color: {{t.ink2}}">
          <li style="display: flex; align-items: center; gap: 8px"><span aria-hidden="true" style="width: 14px; height: 8px; border-radius: 999px; background: {{lamp}}"></span>{{heldLegend}}</li>
          <sc-if value="{{hasPause}}" hint-placeholder-val="{{true}}">
            <li style="display: flex; align-items: center; gap: 8px"><span aria-hidden="true" style="width: 14px; height: 8px; border-radius: 999px; box-sizing: border-box; border: 1px solid {{amber}}; background: {{pauseBg}}"></span>{{pauseLegend}}</li>
          </sc-if>
        </ul>
      </div>
    </section>

    <sc-if value="{{showNote}}" hint-placeholder-val="{{true}}"><p style="grid-area: note; font-size: 14px; line-height: 20px; color: {{t.muted}}; text-align: {{textAlign}}">The screen can sleep now. Nothing else is running.</p></sc-if>

    <div style="grid-area: next; display: flex; flex-direction: column">
      <sc-if value="{{showInstall}}" hint-placeholder-val="{{true}}">
        <aside aria-labelledby="nx-install" class="at-rise2" style="${CARD}">
          <div style="display: flex; gap: 12px; align-items: flex-start">
            ${ICON('<path d="M12 4v10M8 10l4 4 4-4"></path><path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"></path>')}
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
              <h2 id="nx-install" style="font-size: 20px; line-height: 28px; font-weight: 600">Open it in one tap next time</h2>
              <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Install AwakeTab and it gets its own window and works offline. It still keeps the screen on only while it is visible.</p>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
            <button onClick="{{accept}}" style="${SECONDARY}">Install AwakeTab</button>
            <button onClick="{{dismiss}}" style="${GHOST}">Not now</button>
          </div>
        </aside>
      </sc-if>

      <sc-if value="{{showIos}}" hint-placeholder-val="{{false}}">
        <aside aria-labelledby="nx-ios" class="at-rise2" style="${CARD}">
          <div style="display: flex; gap: 12px; align-items: flex-start">
            ${ICON('<path d="M12 3v12M8 7l4-4 4 4"></path><path d="M6 11H5v10h14V11h-1"></path>')}
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
              <h2 id="nx-ios" style="font-size: 20px; line-height: 28px; font-weight: 600">Add AwakeTab to your Home Screen</h2>
              <sc-if value="{{notPhone}}" hint-placeholder-val="{{false}}"><p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}">Then it opens in one tap, full screen.</p></sc-if>
            </div>
          </div>
          <p style="font-size: 16px; line-height: 26px; color: {{t.ink}}">In Safari, tap Share, then Add to Home Screen, then Add.</p>
          <div style="display: flex; align-items: center; gap: 12px">
            <p style="flex-grow: 1; min-width: 0; font-size: 13px; line-height: 18px; color: {{t.muted}}; text-wrap: pretty">From the Home Screen this needs iOS 18.4 or later. In a Safari tab, iOS 16.4.</p>
            <button onClick="{{dismiss}}" style="${SECONDARY}; flex-shrink: 0">Got it</button>
          </div>
        </aside>
      </sc-if>

      <sc-if value="{{showExt}}" hint-placeholder-val="{{false}}">
        <aside aria-labelledby="nx-ext" class="at-rise2" style="${CARD}">
          <div style="display: flex; gap: 12px; align-items: flex-start">
            ${ICON('<rect x="3" y="5" width="18" height="14" rx="3"></rect><path d="M3 9h18"></path><path d="M9 14h6"></path>')}
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
              <h2 id="nx-ext" style="font-size: 20px; line-height: 28px; font-weight: 600">This tab was hidden {{hidden}} times</h2>
              <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Each time, the browser let the screen sleep. AwakeTab for Chrome keeps it on with the tab hidden or the window minimised.</p>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
            <a href="PageExtension.dc.html" style="${SECONDARY}; display: inline-flex; align-items: center; text-decoration: none">Get the extension</a>
            <button onClick="{{dismiss}}" style="${GHOST}">Not now</button>
          </div>
          <p style="font-size: 13px; color: {{t.muted}}">Free. Chrome, Edge, Brave, Arc and Opera.</p>
        </aside>
      </sc-if>

      <sc-if value="{{showPro}}" hint-placeholder-val="{{false}}">
        <aside aria-label="About Pro" class="at-rise2" style="display: flex; align-items: center; gap: 12px; min-height: 52px; box-sizing: border-box; padding: 4px 4px 4px 16px; border-radius: 16px; border: 1px solid {{t.line}}">
          <p style="flex-grow: 1; font-size: 14px; line-height: 20px; color: {{t.ink2}}">Pro keeps Message mode up all session, and adds Mint and Sky lamps and 12 weeks of stats. <a href="Pro.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 4px">See what's in Pro</a></p>
          <button onClick="{{dismiss}}" aria-label="Hide this" style="width: 44px; height: 44px; flex-shrink: 0; border: 0; background: transparent; border-radius: 12px; color: {{t.ink2}}; display: grid; place-items: center">${CLOSE_X}</button>
        </aside>
      </sc-if>

      <sc-if value="{{showAfter}}" hint-placeholder-val="{{false}}">
        <p role="status" class="at-in" style="font-size: 14px; line-height: 20px; color: {{t.muted}}; text-align: {{textAlign}}">{{afterText}}</p>
      </sc-if>
    </div>

    <div style="grid-area: dock; display: flex; flex-direction: column; gap: 20px">
      ${PRESETS}
      <button onClick="{{again}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 10px 30px -8px {{lampGlow}}">
        ${CTA_GLYPH}
        {{againLabel}}
      </button>
    </div>
  </main>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), preset: 'p30', gone: false, done: '' };
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  update(prev) { if (prev.next !== this.props.next) this.setState({ gone: false, done: '' }); }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const next = this.props.next || 'install';
    const pl = this.pill('ended', b);
    // Sample session: 30 min, ended a minute ago. Pauses are what the tab really reported.
    const total = 30;
    const endMs = Math.round((s.now - 60000) / 60000) * 60000, startMs = endMs - total * 60000;
    const pauses = next === 'extension' ? [[6, 2], [14, 3], [22, 2]] : this.props.paused === 'none' ? [] : [[11, 2]];
    const pausedMin = pauses.reduce((a, p) => a + p[1], 0), held = total - pausedMin;
    const segs = [];
    let at = 0;
    const heldSeg = (n) => ({ grow: n, bg: b.lamp, border: '0' });
    const pauseBg = 'repeating-linear-gradient(135deg, ' + this.rgba(b.amber, 0.55) + ' 0 3px, transparent 3px 6px)';
    for (const [from, len] of pauses) { if (from > at) segs.push(heldSeg(from - at)); segs.push({ grow: len, bg: pauseBg, border: '1px solid ' + b.amber }); at = from + len; }
    if (at < total) segs.push(heldSeg(total - at));
    const bar = this.presetBar(s.preset, phone, b, (id) => this.setState({ preset: id }));
    const live = !s.gone && !s.done;
    return Object.assign(bar, {
      tone: pl.tone, pl, aura: this.rgba(t.muted, 0.06),
      bodyStyle: desk
        ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: 560px minmax(0, 1fr); grid-template-rows: 1fr auto auto auto auto 1fr; grid-template-areas: 'receipt .' 'receipt pill' 'receipt note' 'receipt next' 'receipt dock' 'receipt .'; column-gap: 64px; row-gap: 20px; padding: 8px 80px 40px 80px"
        : tab
          ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 520px); justify-content: center; grid-template-rows: auto auto auto auto 1fr auto; grid-template-areas: 'pill' 'receipt' 'note' 'next' '.' 'dock'; row-gap: 32px; padding: 40px 32px 48px"
          : "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto auto auto 1fr auto; grid-template-areas: 'pill' 'receipt' 'note' 'next' '.' 'dock'; row-gap: 16px; padding: 12px 16px 20px",
      align: desk ? 'start' : 'center', textAlign: desk ? 'start' : 'center', alignItems: desk ? 'flex-start' : 'center', justify: desk ? 'flex-start' : 'center',
      recGap: desk ? '24px' : '12px', bigSize: desk ? '128px' : tab ? '112px' : '56px', unitSize: desk ? '32px' : tab ? '28px' : '20px', barMax: desk ? '520px' : '100%',
      heldBig: String(held), heldWords: pausedMin ? 'kept awake, of a ' + total + ' min session' : 'kept awake, the whole ' + total + ' min',
      fromTime: this.hm(startMs), toTime: this.hm(endMs), segs, pauseBg,
      barAria: 'Timeline from ' + this.hm(startMs) + ' to ' + this.hm(endMs) + ': held ' + held + ' min' + (pausedMin ? ', paused ' + pausedMin + ' min' : ''),
      heldLegend: 'Held · ' + held + ' min', hasPause: pausedMin > 0,
      pauseLegend: 'Paused · ' + pausedMin + ' min' + (phone && next === 'extension' ? '' : ', tab hidden ' + (pauses.length === 1 ? 'once' : pauses.length + ' times')),
      hidden: pauses.length,
      showInstall: live && next === 'install', showIos: live && next === 'ios', showExt: live && next === 'extension', showPro: live && next === 'pro',
      showNote: !phone || !live || next === 'none', showAfter: !!s.done || (s.gone && next !== 'pro' && next !== 'none'),
      afterText: s.done || 'Okay. This will not come up again on this device.',
      accept: () => this.setState({ done: 'Installed. Open AwakeTab from your home screen or app list.' }),
      dismiss: () => this.setState({ gone: true }),
      againLabel: 'Again · ' + this.words(this.presetSecs(s.preset)),
      again: () => this.setState({ gone: true })
    });
  }
`;

export const wrappers = [
  ['GrowthDoneInstallPhoneDark', 'Done · install after 2nd session · phone · dark', { theme: 'dark', layout: 'phone', next: 'install', paused: 'once' }, 390, 844],
  ['GrowthDoneIosPhoneLight', 'Done · iPhone Home Screen steps · phone · light', { theme: 'light', layout: 'phone', next: 'ios', paused: 'none' }, 390, 844],
  ['GrowthDoneExtensionDeskDark', 'Done · hidden 3 times · extension · desktop · dark', { theme: 'dark', layout: 'desktop', next: 'extension' }, 1280, 800],
  ['GrowthDoneProDeskLight', 'Done · one Pro line · desktop · light', { theme: 'light', layout: 'desktop', next: 'pro', paused: 'none' }, 1280, 800],
  ['GrowthDoneNonePhoneLight', 'Done · nothing to suggest · phone · light', { theme: 'light', layout: 'phone', next: 'none', paused: 'once' }, 390, 844]
];
