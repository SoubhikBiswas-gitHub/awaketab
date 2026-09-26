import { header, FOOTER, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthB2B';
export const title = 'Business entry points inside a use-case article';
export const heights = { phone: 1680, tablet: 1640, desktop: 1280 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  variant: { editor: 'enum', options: ['recipe', 'kiosk'], default: 'recipe' }
};

const KICK = 'font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}';
const BTN = 'height: 52px; box-sizing: border-box; padding: 0 20px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.ground}}; font-size: 16px; font-weight: 600; color: {{t.ink}}; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; white-space: nowrap';
const LINK = 'display: inline-flex; align-items: center; min-height: 44px; font-size: 15px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 5px';

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
${header('Use cases')}
  <main style="position: relative; flex-grow: 1; box-sizing: border-box; width: 100%; max-width: {{colMax}}; margin: 0 auto; padding: {{mainPad}}; display: flex; flex-direction: column; gap: 32px">
    <nav aria-label="Breadcrumb" style="font-size: 14px; color: {{t.muted}}; display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
      <a href="HubFor.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: {{t.ink2}}; text-decoration: none">AwakeTab</a><span aria-hidden="true">›</span>
      <a href="HubFor.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; color: {{t.ink2}}; text-decoration: none">Keep your screen awake for a task</a>
    </nav>
    <div style="display: flex; flex-direction: column; gap: 12px">
      <h1 style="font-size: {{h1Size}}; line-height: {{h1LH}}; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance">{{h1}}</h1>
      <p style="font-size: 14px; color: {{t.muted}}">Article excerpt · the section before “Operating-system notes”</p>
    </div>

    <section aria-labelledby="ar-setup" style="display: flex; flex-direction: column; gap: 12px">
      <h2 id="ar-setup" style="font-size: {{h2Size}}; line-height: {{h2LH}}; font-weight: 600">Practical setup</h2>
      <p style="font-size: 18px; line-height: 28px; color: {{t.ink2}}; text-wrap: pretty">{{setup}}</p>
    </section>

    <aside aria-labelledby="b2b-h" class="at-in" style="display: grid; grid-template-columns: {{asideCols}}; gap: 24px; padding: {{asidePad}}; border-radius: 28px; background: {{t.surface}}; border: 1px solid {{t.line}}; align-items: center">
      <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">
        <p style="${KICK}">{{kicker}}</p>
        <h2 id="b2b-h" style="font-size: {{h2Size}}; line-height: {{h2LH}}; font-weight: 600; text-wrap: balance">{{title}}</h2>
        <p style="font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">{{lead}}</p>
        <ul style="display: flex; flex-direction: column; gap: 8px">
          <sc-for list="{{facts}}" as="f" hint-placeholder-count="3">
            <li style="display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 12px; font-size: 15px; line-height: 22px"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" style="margin-top: 4px"><path d="M2 6.4l2.6 2.6L10 3.4" fill="none" stroke="{{lamp}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>{{f}}</li>
          </sc-for>
        </ul>
        <div style="display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center">
          <a href="{{ctaHref}}" style="${BTN}">{{cta}}</a>
          <a href="{{moreHref}}" style="${LINK}">{{more}}</a>
        </div>
      </div>

      <sc-if value="{{isRecipe}}" hint-placeholder-val="{{true}}">
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 12px; min-width: 0">
          <figcaption style="${KICK}">On your recipe page</figcaption>
          <div data-placeholder="embed on the host page" style="border-radius: 16px; padding: 16px; background: {{hostBg}}; border: 1px solid {{t.line2}}; display: flex; flex-direction: column; gap: 12px">
            <div aria-hidden="true" style="display: flex; flex-direction: column; gap: 8px"><span style="height: 10px; width: 62%; border-radius: 999px; background: {{hostLine}}"></span><span style="height: 10px; width: 88%; border-radius: 999px; background: {{hostLine}}"></span><span style="height: 10px; width: 74%; border-radius: 999px; background: {{hostLine}}"></span></div>
            <div style="max-width: 320px; width: 100%; box-sizing: border-box; min-height: 96px; padding: 12px 12px 12px 16px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 12px">
              <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0"><span style="font-size: 15px; font-weight: 600">Keep screen awake</span><span style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: {{t.muted}}"><svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.5" fill="none" stroke="{{t.muted}}" stroke-width="1.6"></circle></svg>Ready</span></span>
              <button onClick="{{demo}}" style="height: 44px; padding: 0 20px; border-radius: 999px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 15px; font-weight: 600">{{demoLabel}}</button>
              <span style="grid-column: 1 / -1; font-size: 12px; color: {{t.muted}}">Keep awake by AwakeTab</span>
            </div>
            <div aria-hidden="true" style="display: flex; flex-direction: column; gap: 8px"><span style="height: 10px; width: 80%; border-radius: 999px; background: {{hostLine}}"></span><span style="height: 10px; width: 56%; border-radius: 999px; background: {{hostLine}}"></span></div>
          </div>
          <p style="font-size: 13px; color: {{t.muted}}">Compact size, 320 × 96. A full-width size is 240 tall.</p>
        </figure>
      </sc-if>

      <sc-if value="{{isKiosk}}" hint-placeholder-val="{{false}}">
        <figure style="margin: 0; display: flex; flex-direction: column; gap: 12px; min-width: 0">
          <figcaption style="${KICK}">One link per screen</figcaption>
          <div role="radiogroup" aria-label="Screen mode" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
            <sc-for list="{{modes}}" as="m" hint-placeholder-count="3">
              <button role="radio" aria-checked="{{m.sel}}" onClick="{{m.pick}}" style="height: 44px; border-radius: 999px; border: 1px solid {{m.ring}}; background: {{m.bg}}; font-size: 14px; font-weight: {{m.weight}}; color: {{t.ink}}">{{m.label}}</button>
            </sc-for>
          </div>
          <sc-if value="{{msgNote}}" hint-placeholder-val="{{false}}"><p role="status" style="font-size: 13px; line-height: 18px; color: {{t.muted}}">Message mode needs a Kiosk licence or Pro. Without one you get a 60-second preview.</p></sc-if>
          <output aria-label="Kiosk link" style="min-height: 52px; box-sizing: border-box; padding: 12px 16px; border-radius: 8px; border: 1px solid {{t.line2}}; background: {{t.field}}; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 14px; line-height: 20px; overflow-wrap: anywhere">{{kioskUrl}}</output>
          <div aria-hidden="true" data-placeholder="wall screen" style="aspect-ratio: 16 / 9; box-sizing: border-box; border-radius: 16px; background: #0A0E16; border: 1px solid #33405C; box-shadow: inset 0 0 0 8px #1A2336; display: grid; place-items: center; color: #EAF0F7">
            <span style="display: flex; flex-direction: column; align-items: center; gap: 8px"><span style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{wallSize}}; letter-spacing: -0.02em">{{wallText}}</span><span style="font-size: 12px; line-height: 16px; color: #8E9AAE">{{wallSub}}</span></span>
          </div>
        </figure>
      </sc-if>
    </aside>

    <section aria-labelledby="ar-os" style="display: flex; flex-direction: column; gap: 12px">
      <h2 id="ar-os" style="font-size: {{h2Size}}; line-height: {{h2LH}}; font-weight: 600">Operating-system notes</h2>
      <p style="font-size: 18px; line-height: 28px; color: {{t.muted}}">The article continues here, unchanged.</p>
    </section>
  </main>
${FOOTER}
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = { theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now(), mode: 'minimal', tapped: false };
  }
  heights() { return { phone: 1680, tablet: 1640, desktop: 1280 }; }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const recipe = (this.props.variant || 'recipe') === 'recipe';
    const MODES = [['minimal', 'Minimal'], ['clock', 'Clock'], ['message', 'Message']];
    const modes = MODES.map(([id, label]) => ({ label, sel: s.mode === id ? 'true' : 'false', ring: s.mode === id ? b.lamp : t.line, bg: s.mode === id ? b.lampSoft : 'transparent', weight: s.mode === id ? 600 : 500, pick: () => this.setState({ mode: id }) }));
    const clock = this.hm(s.now).replace(/ [AP]M$/, '');
    const R = recipe ? {
      h1: 'Keep your screen on while cooking',
      setup: 'Prop the tablet where you can see it from the stove, open this page, pick a length a little longer than the recipe and tap Keep awake. The pill tells you from across the kitchen whether the screen is really being held on.',
      kicker: 'For recipe sites', title: 'Run a recipe site? Put this button on your recipes.',
      lead: 'Your readers keep the screen on while the page is visible, without leaving it, with the same honest status and kitchen timers.',
      facts: ['One script tag, nothing to host', 'Free, with a small credit under the button', 'An Embed licence removes the credit: $29 a year per site, opening soon'],
      cta: 'Get the embed code', ctaHref: 'EmbedShowcase.dc.html', more: 'Embed licences open soon', moreHref: 'EmbedShowcase.dc.html'
    } : {
      h1: 'Keep a wall dashboard on all day',
      setup: 'Open AwakeTab on the device that shows the dashboard, choose Until I stop (∞) and switch to Minimal mode. After a restart the browser brings the tab back and the session resumes on its own.',
      kicker: 'For screens you manage', title: 'Running screens nobody touches?',
      lead: 'Build one link that starts by itself in Minimal or Clock mode and resumes after a restart.',
      facts: ['Free to use, no account', 'No ads on the screen, ever', 'A Kiosk licence adds your logo and a message: $19 one site, $49 five sites'],
      cta: 'Build a kiosk link', ctaHref: 'PageKiosk.dc.html', more: 'See the Kiosk licence', moreHref: 'Pro.dc.html'
    };
    return Object.assign(R, {
      tone: b.lamp, msgNote: s.mode === 'message', isRecipe: recipe, isKiosk: !recipe, modes,
      colMax: desk ? '1040px' : '820px', mainPad: desk ? '24px 80px 96px' : tab ? '24px 32px 64px' : '12px 16px 48px',
      h1Size: phone ? '34px' : '48px', h1LH: phone ? '42px' : '56px', h2Size: phone ? '24px' : '28px', h2LH: phone ? '32px' : '36px',
      asideCols: desk ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)', asidePad: desk ? '32px' : '24px',
      hostBg: t.ground, hostLine: t.track,
      demoLabel: s.tapped ? 'Stop' : 'Start', demo: () => this.setState({ tapped: !this.state.tapped }),
      kioskUrl: 'awaketab.com/?autostart=1&mode=' + s.mode + (s.mode === 'message' ? '&msg=Lobby%20open%20until%206%20PM' : ''),
      wallText: s.mode === 'message' ? 'Lobby open until 6 PM' : clock, wallSub: s.mode === 'minimal' ? 'Screen awake' : s.mode === 'clock' ? this.dateLong(s.now) : 'Screen awake',
      wallSize: s.mode === 'message' ? (desk ? '26px' : '22px') : desk ? '48px' : '40px'
    });
  }
`;

export const wrappers = [
  ['GrowthB2BRecipePhoneLight', 'B2B entry · recipe sites · /for/cooking · phone · light', { theme: 'light', layout: 'phone', variant: 'recipe' }, 390, 1680],
  ['GrowthB2BRecipeDeskDark', 'B2B entry · recipe sites · /for/cooking · desktop · dark', { theme: 'dark', layout: 'desktop', variant: 'recipe' }, 1280, 1280],
  ['GrowthB2BKioskPhoneDark', 'B2B entry · kiosks · /for/dashboards · phone · dark', { theme: 'dark', layout: 'phone', variant: 'kiosk' }, 390, 1680],
  ['GrowthB2BKioskDeskLight', 'B2B entry · kiosks · /for/dashboards · desktop · light', { theme: 'light', layout: 'desktop', variant: 'kiosk' }, 1280, 1280]
];
