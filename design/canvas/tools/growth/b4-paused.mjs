import { header, DATELINE, PILL, RING, CLOSE_X, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthPaused';
export const title = 'Back from a hidden tab · honest options';
export const heights = { phone: 844, tablet: 1180, desktop: 800 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  browser: { editor: 'enum', options: ['chrome', 'firefox', 'mobile'], default: 'chrome' },
  count: { editor: 'enum', options: ['first', 'third'], default: 'third' }
};

const SECONDARY = 'height: 52px; box-sizing: border-box; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}; white-space: nowrap';

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: 4%; width: 150%; height: 70%; background: radial-gradient(45% 45% at 50% 50%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('')}
${DATELINE}

  <main style="{{bodyStyle}}">
    <div style="grid-area: pill; justify-self: {{align}}">${PILL}</div>
    <div style="grid-area: face; display: flex; align-items: center; justify-content: center">${RING}</div>

    <div style="grid-area: note; display: flex; flex-direction: column; gap: 12px">
      <sc-if value="{{isFirst}}" hint-placeholder-val="{{false}}">
        <div role="status" class="at-rise" style="display: flex; align-items: center; justify-content: {{justify}}; flex-wrap: wrap; gap: 4px 12px; font-size: 14px; line-height: 20px; color: {{t.ink2}}">
          <span><strong style="font-weight: 600; color: {{t.ink}}">Screen awake again</strong> · paused 2 min while this tab was hidden</span>
          <button onClick="{{openHelp}}" aria-expanded="{{helpAria}}" style="min-height: 44px; padding: 0 4px; border: 0; background: transparent; font-size: 14px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 4px">Why did it pause?</button>
        </div>
      </sc-if>

      <sc-if value="{{showCard}}" hint-placeholder-val="{{true}}">
        <aside aria-labelledby="pz-h" class="at-rise" style="display: flex; flex-direction: column; gap: 16px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: {{cardShadow}}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px">
            <div role="status" style="display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-top: 4px">
              <h2 id="pz-h" style="display: flex; align-items: center; gap: 8px; font-size: 20px; line-height: 28px; font-weight: 600"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: {{lamp}}; box-shadow: 0 0 8px {{lampGlow}}"></span>Screen awake again</h2>
              <p style="font-size: 14px; color: {{t.muted}}">{{countLine}}</p>
            </div>
            <button onClick="{{close}}" aria-label="Close" style="width: 44px; height: 44px; flex-shrink: 0; border: 0; background: transparent; border-radius: 12px; color: {{t.ink2}}; display: grid; place-items: center">${CLOSE_X}</button>
          </div>
          <p style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">{{lead}}</p>
          <ul style="display: flex; flex-direction: column">
            <sc-for list="{{opts}}" as="o" hint-placeholder-count="2">
              <li style="display: grid; grid-template-columns: {{optCols}}; align-items: center; gap: 12px 16px; padding: 12px 0; border-top: 1px solid {{t.line}}">
                <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
                  <span style="font-size: 15px; font-weight: 600">{{o.title}}</span>
                  <span style="font-size: 14px; line-height: 20px; color: {{t.ink2}}; text-wrap: pretty">{{o.text}}</span>
                </span>
                <sc-if value="{{o.isButton}}" hint-placeholder-val="{{true}}">
                  <button onClick="{{o.act}}" style="${SECONDARY}">{{o.cta}}</button>
                </sc-if>
                <sc-if value="{{o.isLink}}" hint-placeholder-val="{{false}}">
                  <a href="{{o.href}}" style="${SECONDARY}; display: inline-flex; align-items: center; justify-content: center; text-decoration: none">{{o.cta}}</a>
                </sc-if>
              </li>
            </sc-for>
          </ul>
          <sc-if value="{{hasFoot}}" hint-placeholder-val="{{false}}">
            <p style="font-size: 13px; line-height: 18px; color: {{t.muted}}; text-wrap: pretty">{{foot}}</p>
          </sc-if>
        </aside>
      </sc-if>

      <sc-if value="{{acted}}" hint-placeholder-val="{{false}}">
        <p role="status" class="at-in" style="font-size: 14px; line-height: 20px; color: {{t.muted}}; text-align: {{textAlign}}">{{actedText}}</p>
      </sc-if>
    </div>

    <div style="grid-area: dock; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
      <button onClick="{{extend}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 17px; font-weight: 600; color: {{t.ink}}">+15 min</button>
      <button onClick="{{stop}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; border: 0; background: {{t.primaryBg}}; font-size: 17px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>
    </div>
  </main>
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), help: props.count !== 'first', acted: '', left: 1458, total: 1800 };
  }
  heights() { return { phone: 844, tablet: 1180, desktop: 800 }; }
  update(prev) { if (prev.count !== this.props.count || prev.browser !== this.props.browser) this.setState({ help: this.props.count !== 'first', acted: '' }); }
  onTick() { const s = this.state; if (s.left > 0) this.setState({ left: s.left - 1 }); }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const br = this.props.browser || 'chrome', third = this.props.count !== 'first';
    const pl = this.pill('awake', b);
    const endMs = Math.round((s.now + s.left * 1000) / 60000) * 60000;
    const r = this.ring({ mode: 'awake', p: s.left / s.total, shown: s.left, kicker: 'Time left', metaA: 'until', metaB: this.when(endMs), size: desk ? 440 : tab ? 360 : (s.help ? 160 : 260) }, b);
    const done = (msg) => () => this.setState({ help: false, acted: msg });
    const SETS = {
      chrome: {
        lead: 'The screen stays awake only while this tab is visible. Keep it in front, or use one of these while you work in another window:',
        opts: [
          { title: 'Float a small window', text: 'A small window with +15 and Stop stays on top of your other windows, so the lock holds.', cta: 'Open floating window', act: done('Floating window open. Keep it where you can see it.') },
          { title: 'Let Chrome hold it', text: 'AwakeTab for Chrome keeps the screen on with this tab hidden or minimised. Free.', cta: 'Get the extension', href: 'PageExtension.dc.html' }
        ],
        foot: ''
      },
      firefox: {
        lead: 'The screen stays awake only while this tab is visible. In Firefox 151 or later you can float a small window instead:',
        opts: [
          { title: 'Float a small window', text: 'A small window with +15 and Stop stays on top of your other windows, so the lock holds.', cta: 'Open floating window', act: done('Floating window open. Keep it where you can see it.') },
          { title: 'Or give AwakeTab its own window', text: 'Move this tab into its own window and leave it in view beside your work.', cta: 'Open in a new window', act: done('Opened in its own window. Keep it in view.') }
        ],
        foot: 'Firefox gives extensions no power API, so there is no AwakeTab extension for it.'
      },
      mobile: {
        lead: 'Phones and tablets take the lock back when you switch apps or tabs. No web page can change that. Come back and the session resumes by itself.',
        opts: [
          { title: 'Or change the timeout itself', text: 'A longer Auto-Lock or screen timeout lasts, if your device lets you change it.', cta: 'Read the guide', href: 'ContentArticle.dc.html' }
        ],
        foot: ''
      }
    };
    const set = phone ? SETS.mobile : SETS[br] || SETS.chrome; // Phones get no extension and no floating window.
    const opts = set.opts.map((o) => ({ title: o.title, text: o.text, cta: o.cta, href: o.href || '#', act: o.act || (() => {}), isButton: !!o.cta && !o.href, isLink: !!o.href }));
    return {
      tone: pl.tone, pl, r, aura: this.rgba(b.lamp, b.dark ? 0.14 : 0.1),
      bodyStyle: desk
        ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: 500px minmax(0, 1fr); grid-template-rows: 1fr auto auto auto 1fr; grid-template-areas: 'face .' 'face pill' 'face note' 'face dock' 'face .'; column-gap: 64px; row-gap: 20px; padding: 8px 80px 40px 80px"
        : tab
          ? "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 520px); justify-content: center; grid-template-rows: auto auto auto 1fr auto; grid-template-areas: 'pill' 'face' 'note' '.' 'dock'; row-gap: 24px; padding: 32px 32px 48px"
          : "position: relative; flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto auto 1fr auto; grid-template-areas: 'pill' 'face' 'note' '.' 'dock'; row-gap: 16px; padding: 12px 16px 20px",
      align: desk ? 'start' : 'center', textAlign: desk ? 'start' : 'center', justify: desk ? 'flex-start' : 'center',
      isFirst: !third && !s.help && !s.acted, showCard: s.help, helpAria: s.help ? 'true' : 'false',
      countLine: third ? 'Paused 3 times this session, 7 min in all' : 'Paused for 2 min while this tab was hidden',
      lead: set.lead, opts, optCols: phone ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) auto', hasFoot: !!set.foot, foot: set.foot,
      acted: !!s.acted, actedText: s.acted,
      openHelp: () => this.setState({ help: true }), close: () => this.setState({ help: false }),
      extend: () => this.setState({ left: s.left + 900, total: s.total + 900 }), stop: () => this.setState({ help: false })
    };
  }
`;

export const wrappers = [
  ['GrowthPausedDeskDark', 'Back from hidden · 3rd time · Chrome · desktop · dark', { theme: 'dark', layout: 'desktop', browser: 'chrome', count: 'third' }, 1280, 800],
  ['GrowthPausedDeskLight', 'Back from hidden · 3rd time · Firefox · desktop · light', { theme: 'light', layout: 'desktop', browser: 'firefox', count: 'third' }, 1280, 800],
  ['GrowthPausedPhoneDark', 'Back from hidden · 1st time · quiet · phone · dark', { theme: 'dark', layout: 'phone', browser: 'mobile', count: 'first' }, 390, 844],
  ['GrowthPausedPhoneLight', 'Back from hidden · 3rd time · phone · light', { theme: 'light', layout: 'phone', browser: 'mobile', count: 'third' }, 390, 844]
];
