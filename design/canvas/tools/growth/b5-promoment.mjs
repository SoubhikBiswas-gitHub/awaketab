import { header, DATELINE, PILL, RING, CLOSE_X, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthProMoment';
export const title = 'Pro moments · informative, never pushy';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  moment: { editor: 'enum', options: ['lamp', 'message', 'stats'], default: 'lamp' }
};

const BTN = 'height: 52px; box-sizing: border-box; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; white-space: nowrap';
const KICK = 'font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}';
const PRICE = `<p style="font-size: 13px; line-height: 18px; color: {{t.muted}}">Pro is $12 a year, or $19 once. Launch price for the first 90 days after launch, then $29. 5 devices, 14-day refund.</p>`;

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{rootBg}}; color: {{t.ink}}; display: flex; flex-direction: column">

  <sc-if value="{{isMessage}}" hint-placeholder-val="{{false}}">
    <div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; padding: {{msgPad}}">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap">
        ${PILL}
        <span style="font-family: Geist, system-ui, sans-serif; font-size: 15px; color: {{t.ink2}}; font-variant-numeric: tabular-nums">{{leftShort}} left · until {{untilText}}</span>
      </div>
      <div style="flex-grow: 1; display: grid; place-items: center; text-align: center; padding: 24px 0">
        <sc-if value="{{showMsg}}" hint-placeholder-val="{{true}}">
          <p class="at-step" style="font-size: {{msgSize}}; line-height: 1.08; font-weight: 600; letter-spacing: -0.035em; color: {{t.ink}}; opacity: {{msgOp}}; text-wrap: balance">Back at 11:30 AM</p>
        </sc-if>
        <sc-if value="{{showClock}}" hint-placeholder-val="{{false}}">
          <p class="at-in" role="timer" style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{clockSize}}; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: {{t.ink}}">{{clockText}}</p>
        </sc-if>
      </div>
      <sc-if value="{{cardOpen}}" hint-placeholder-val="{{true}}">
        <aside aria-labelledby="pm-msg" class="at-rise" style="align-self: center; width: 100%; max-width: 560px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}">
          <h2 id="pm-msg" style="font-size: 20px; line-height: 28px; font-weight: 600">That was the free 60-second preview</h2>
          <p style="font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">Your message stayed up for 60 seconds. The screen is still awake and your session carries on.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <button onClick="{{backToClock}}" style="${BTN}">Back to Clock</button>
          </div>
        </aside>
      </sc-if>
    </div>
  </sc-if>

  <sc-if value="{{isSheet}}" hint-placeholder-val="{{true}}">
    <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}
    <main style="{{toolStyle}}">
      ${PILL}
      ${RING}
    </main>
    <sc-if value="{{scrimOn}}" hint-placeholder-val="{{false}}">
      <div aria-hidden="true" class="at-scrim" style="position: absolute; inset: 0; z-index: 20; background: {{scrim}}"></div>
    </sc-if>
    <section role="dialog" aria-modal="{{modalAria}}" aria-labelledby="pm-sheet" class="{{sheetClass}}" style="{{sheetStyle}}">
      <sc-if value="{{isPhone}}" hint-placeholder-val="{{true}}">
        <div aria-hidden="true" style="width: 40px; height: 4px; border-radius: 999px; background: {{t.line2}}; margin: 12px auto 0"></div>
      </sc-if>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: {{headPad}}">
        <h2 id="pm-sheet" style="font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.02em">{{sheetTitle}}</h2>
        <button aria-label="{{closeAria}}" onClick="{{closeSheet}}" style="width: 44px; height: 44px; flex-shrink: 0; border: 0; background: transparent; border-radius: 12px; color: {{t.ink2}}; display: grid; place-items: center">${CLOSE_X}</button>
      </div>

      <sc-if value="{{isLamp}}" hint-placeholder-val="{{true}}">
        <div style="display: flex; flex-direction: column; gap: 16px; padding: 0 20px 24px">
          <h3 id="pm-lamp" style="${KICK}">Lamp colour</h3>
          <div role="radiogroup" aria-labelledby="pm-lamp" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
            <sc-for list="{{lamps}}" as="l" hint-placeholder-count="4">
              <button role="radio" aria-checked="{{l.sel}}" aria-label="{{l.aria}}" onClick="{{l.pick}}" style="height: 88px; padding: 8px 4px; border-radius: 16px; border: 1px solid {{l.ring}}; background: {{l.bg}}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: {{t.ink}}">
                <span aria-hidden="true" style="width: 26px; height: 26px; border-radius: 50%; background: {{l.color}}; box-shadow: 0 0 0 4px {{l.halo}}, 0 0 14px {{l.glow}}"></span>
                <span style="font-size: 13px; font-weight: {{l.weight}}">{{l.name}}</span>
                <span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.08em; color: {{t.muted}}; min-height: 16px">{{l.tag}}</span>
              </button>
            </sc-for>
          </div>
          <sc-if value="{{previewing}}" hint-placeholder-val="{{true}}">
            <aside aria-labelledby="pm-prev" role="status" class="at-rise" style="display: flex; flex-direction: column; gap: 12px; padding: 16px 16px 16px; border-radius: 16px; background: {{prevSoft}}; border: 1px solid {{prevLine}}">
              <h4 id="pm-prev" style="font-size: 20px; line-height: 28px; font-weight: 600">You are previewing {{prevName}}</h4>
              <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Mint and Sky come with Pro. The preview lasts while Settings is open. Close Settings and the lamp goes back to {{keepName}}.</p>
              ${PRICE}
              <div style="display: flex; flex-wrap: wrap; gap: 8px">
                <button onClick="{{keepFree}}" style="${BTN}">Keep {{keepName}}</button>
                <a href="Pro.dc.html" style="${BTN}">See what's in Pro</a>
              </div>
            </aside>
          </sc-if>
          <sc-if value="{{notPreviewing}}" hint-placeholder-val="{{false}}">
            <p role="status" style="font-size: 14px; line-height: 20px; color: {{t.muted}}">{{lampNote}}</p>
          </sc-if>
        </div>
      </sc-if>

      <sc-if value="{{isStats}}" hint-placeholder-val="{{false}}">
        <div style="display: flex; flex-direction: column; gap: 20px; padding: 0 20px 24px">
          <dl style="margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
            <sc-for list="{{figs}}" as="f" hint-placeholder-count="4">
              <div style="display: flex; flex-direction: column-reverse; gap: 4px; padding: 12px 16px; border-radius: 12px; background: {{t.field}}; border: 1px solid {{t.line}}">
                <dt style="font-size: 13px; color: {{t.muted}}">{{f.label}}</dt>
                <dd style="margin: 0; font-family: Geist, system-ui, sans-serif; font-size: 20px; font-weight: 400; font-variant-numeric: tabular-nums">{{f.value}}</dd>
              </div>
            </sc-for>
          </dl>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <h3 style="${KICK}">Last 12 weeks</h3>
            <div role="img" aria-label="{{hmAria}}" style="display: grid; grid-template-columns: 18px repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(7, auto); gap: 4px">
              <sc-for list="{{hmDays}}" as="d" hint-placeholder-count="3">
                <span aria-hidden="true" style="grid-column: 1; grid-row: {{d.row}}; font-size: 12px; color: {{t.muted}}; align-self: center">{{d.label}}</span>
              </sc-for>
              <sc-for list="{{cells}}" as="c" hint-placeholder-count="84">
                <span aria-hidden="true" style="grid-column: {{c.col}}; grid-row: {{c.row}}; aspect-ratio: 1; border-radius: 8px; box-sizing: border-box; background: {{c.bg}}; border: 1px solid {{c.ring}}"></span>
              </sc-for>
            </div>
          </div>
          <p style="display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; color: {{t.muted}}"><span aria-hidden="true" style="width: 14px; height: 14px; border-radius: 4px; box-sizing: border-box; background: {{hatch}}; border: 1px solid {{lampLine}}"></span>Locked — Pro keeps 12 weeks</p>
          <aside aria-labelledby="pm-week" class="at-rise" style="display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 16px; background: {{t.field}}; border: 1px solid {{t.line}}">
            <h4 id="pm-week" style="font-size: 20px; line-height: 28px; font-weight: 600">Your first week is in</h4>
            <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">Free stats show the last 7 days. Older days stay saved in this browser. Pro shows 12 weeks of them and exports them as a CSV file.</p>
            ${PRICE}
            <div style="display: flex; gap: 8px"><a href="Pro.dc.html" style="${BTN}">See what's in Pro</a></div>
          </aside>
        </div>
      </sc-if>
    </section>
  </sc-if>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), lampId: 'mint', keep: 'aqua', card: true, left: 1458, total: 1800 };
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  update(prev) { if (prev.moment !== this.props.moment) this.setState({ lampId: 'mint', keep: 'aqua', card: true }); }
  onTick() { const s = this.state; if (s.left > 0) this.setState({ left: s.left - 1 }); }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const moment = this.props.moment || 'lamp';
    const row = LAMPS.find((l) => l[0] === s.lampId) || LAMPS[0];
    const keepRow = LAMPS.find((l) => l[0] === s.keep) || LAMPS[0];
    const lampC = b.dark ? row[2] : row[3];
    const stMode = moment === 'message' ? 'awake' : 'ready';
    const pl = this.pill(stMode, Object.assign({}, b, { lamp: moment === 'lamp' ? lampC : b.lamp }));
    const endMs = Math.round((s.now + s.left * 1000) / 60000) * 60000;
    const r = stMode === 'ready' ? this.ring({ mode: 'ready', p: 1, shown: 1800, kicker: 'Keeps awake for', metaA: 'ends at', metaB: this.when(Math.round((s.now + 1800000) / 60000) * 60000), color: moment === 'lamp' ? lampC : b.lamp, size: desk ? 440 : tab ? 380 : 200 }, b) : this.ring({ mode: 'awake', p: s.left / s.total, shown: s.left, kicker: 'Time left', metaA: 'until', metaB: this.when(endMs), color: moment === 'lamp' ? lampC : b.lamp, size: desk ? 440 : tab ? 380 : 200 }, b);
    const lamps = LAMPS.map(([id, nm, dk, lt, pro]) => {
      const on = s.lampId === id, c = b.dark ? dk : lt;
      return { name: nm, tag: pro ? 'PRO' : '', aria: nm + (pro ? ', Pro, preview' : ''), sel: on ? 'true' : 'false', color: c, halo: this.rgba(c, 0.18), glow: on ? this.rgba(c, 0.55) : 'transparent', ring: on ? c : t.line, bg: on ? this.rgba(c, 0.1) : 'transparent', weight: on ? 600 : 500,
        pick: () => this.setState(pro ? { lampId: id } : { lampId: id, keep: id }) };
    });
    const previewing = row[4];
    // Stats: 8 days of sample use. Free shows the last 7; the 8th day back is kept but locked.
    const today = new Date(s.now), wd = (today.getDay() + 6) % 7;
    const MIN = [65, 40, 95, 30, 120, 55, 80, 45];
    const LV = [0, 0.2, 0.4, 0.65, 0.9];
    const level = (m) => (m === 0 ? 0 : m < 45 ? 1 : m < 90 ? 2 : m < 150 ? 3 : 4);
    const hatch = 'repeating-linear-gradient(135deg, ' + this.rgba(b.lamp, 0.35) + ' 0 2px, transparent 2px 5px)';
    const cells = [];
    for (let col = 0; col < 12; col++) for (let rw = 0; rw < 7; rw++) {
      const off = (11 - col) * 7 + (wd - rw);
      const base = { col: col + 2, row: rw + 1 };
      if (off < 0) cells.push(Object.assign(base, { bg: 'transparent', ring: 'transparent' }));
      else if (off <= 6) { const lv = level(MIN[off]); cells.push(Object.assign(base, { bg: this.rgba(b.lamp, LV[lv]), ring: 'transparent' })); }
      else if (off === 7) cells.push(Object.assign(base, { bg: hatch, ring: this.rgba(b.lamp, 0.45) }));
      else cells.push(Object.assign(base, { bg: t.track, ring: 'transparent' }));
    }
    const week = MIN.slice(0, wd + 1).reduce((a, m) => a + m, 0);
    const figs = [{ label: 'Today', value: this.mins(MIN[0]) }, { label: 'This week', value: this.mins(week) }, { label: 'Days used this week', value: (wd + 1) + ' of 7' }, { label: 'All time', value: this.mins(MIN.reduce((a, m) => a + m, 0)) }];
    const sheetBase = 'box-sizing: border-box; z-index: 21; overflow-y: auto; overscroll-behavior: contain; background: ' + t.surface + '; color: ' + t.ink + '; ';
    const [lm, ls] = this.split(s.left);
    return {
      tone: pl.tone, pl, r, aura: this.rgba(moment === 'lamp' ? lampC : b.lamp, b.dark ? 0.16 : 0.12),
      rootBg: moment === 'message' ? t.screen : t.bg,
      isMessage: moment === 'message', isSheet: moment !== 'message', isLamp: moment === 'lamp', isStats: moment === 'stats',
      scrimOn: moment === 'stats', modalAria: moment === 'stats' ? 'true' : 'false',
      toolStyle: 'position: relative; flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: ' + (phone ? 'flex-start' : 'center') + '; gap: 20px; padding: ' + (desk ? '0 520px 40px 40px' : tab ? '0 460px 40px 20px' : '8px 20px 0'),
      sheetClass: phone ? 'at-sheet-body at-sheet-up' : 'at-sheet-body at-sheet-side',
      sheetStyle: phone
        ? sheetBase + 'position: absolute; left: 0; right: 0; bottom: 0; height: ' + (moment === 'lamp' ? '58%' : '82%') + '; border-radius: 28px 28px 0 0; border-top: 1px solid ' + t.line2 + '; box-shadow: ' + b.sheetShadow
        : sheetBase + 'position: absolute; top: 0; bottom: 0; inset-inline-end: 0; width: ' + (tab ? 420 : 460) + 'px; border-start-start-radius: 28px; border-end-start-radius: 28px; border-inline-start: 1px solid ' + t.line2 + '; box-shadow: ' + b.sheetShadow,
      headPad: phone ? '8px 12px 4px 20px' : '16px 12px 8px 20px',
      sheetTitle: moment === 'stats' ? 'Your stats' : 'Settings', closeAria: moment === 'stats' ? 'Close stats' : 'Close settings',
      closeSheet: () => this.setState({ lampId: s.keep }),
      lamps, previewing, notPreviewing: !previewing, prevName: row[1], keepName: keepRow[1],
      prevSoft: this.rgba(lampC, 0.08), prevLine: this.rgba(lampC, 0.4),
      lampNote: row[1] + ' is free. It stays after you close Settings.',
      keepFree: () => this.setState({ lampId: s.keep }),
      hatch, figs, cells, hmDays: [{ label: 'M', row: 1 }, { label: 'W', row: 3 }, { label: 'F', row: 5 }],
      hmAria: 'Time awake per day. The last 7 days are shown. One older day is saved and locked: Pro keeps 12 weeks.',
      msgPad: desk ? '28px 48px 40px' : tab ? '28px 32px 40px' : '16px 16px 20px',
      msgSize: desk ? '104px' : tab ? '72px' : '48px', clockSize: desk ? '168px' : tab ? '128px' : '84px',
      leftShort: lm + ls, untilText: this.when(endMs),
      showMsg: s.card, showClock: !s.card, cardOpen: s.card, msgOp: s.card ? 0.5 : 1,
      clockText: this.hm(s.now).replace(/ [AP]M$/, ''),
      backToClock: () => this.setState({ card: false })
    };
  }
`;

export const wrappers = [
  ['GrowthProLampPhoneDark', 'Pro moment · previewing a Pro lamp · phone · dark', { theme: 'dark', layout: 'phone', moment: 'lamp' }, 390, 844],
  ['GrowthProLampDeskLight', 'Pro moment · previewing a Pro lamp · desktop · light', { theme: 'light', layout: 'desktop', moment: 'lamp' }, 1280, 800],
  ['GrowthProMessageDeskDark', 'Pro moment · end of the 60 s Message preview · desktop · dark', { theme: 'dark', layout: 'desktop', moment: 'message' }, 1280, 800],
  ['GrowthProMessagePhoneLight', 'Pro moment · end of the 60 s Message preview · phone · light', { theme: 'light', layout: 'phone', moment: 'message' }, 390, 844],
  ['GrowthProStatsPhoneLight', 'Pro moment · day 8 of stats · phone · light', { theme: 'light', layout: 'phone', moment: 'stats' }, 390, 844],
  ['GrowthProStatsDeskDark', 'Pro moment · day 8 of stats · desktop · dark', { theme: 'dark', layout: 'desktop', moment: 'stats' }, 1280, 800]
];
