import { header, FOOTER, CTA_GLYPH, THEME_PROP, LAYOUT_PROP } from './common.mjs';

export const name = 'GrowthPlanHelper';
export const title = 'Which plan fits · /pro helper';
export const heights = { phone: 2080, tablet: 1600, desktop: 1100 };
export const props = {
  theme: THEME_PROP, layout: LAYOUT_PROP,
  answer: { editor: 'enum', options: ['free', 'once', 'year', 'site', 'screens'], default: 'free' }
};

const KICK = 'font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}';
const LEGEND = 'padding: 0; margin-bottom: 12px; font-size: 20px; line-height: 28px; font-weight: 600; color: {{t.ink}}';
const CHIP = (o) => `<button role="${o.role}" aria-checked="{{${o.v}.sel}}" onClick="{{${o.v}.pick}}" style="min-height: 56px; padding: 12px 16px; border-radius: 16px; border: 1px solid {{${o.v}.ring}}; background: {{${o.v}.bg}}; color: {{t.ink}}; text-align: start; display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: center; gap: 12px">
                <span aria-hidden="true" style="width: 24px; height: 24px; box-sizing: border-box; border-radius: {{${o.v}.shape}}; border: 1px solid {{${o.v}.mark}}; background: {{${o.v}.fill}}; display: grid; place-items: center"><svg width="12" height="12" viewBox="0 0 12 12" style="opacity: {{${o.v}.tick}}"><path d="M2 6.4l2.6 2.6L10 3.4" fill="none" stroke="{{lampInk}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0"><span style="font-size: 15px; font-weight: {{${o.v}.weight}}">{{${o.v}.label}}</span><span style="font-size: 13px; color: {{t.muted}}">{{${o.v}.sub}}</span></span>
              </button>`;

export const markup = `
<div class="{{rootCls}}" style="width: {{W}}; height: {{H}}; box-sizing: border-box; position: relative; overflow: hidden; background: {{t.bg}}; color: {{t.ink}}; display: flex; flex-direction: column">
  <div aria-hidden="true" class="at-aura" style="position: absolute; left: -25%; top: -4%; width: 150%; height: 50%; background: radial-gradient(45% 45% at 60% 40%, {{aura}} 0%, transparent 70%); pointer-events: none"></div>
${header('Pro')}
  <main style="position: relative; flex-grow: 1; box-sizing: border-box; width: 100%; max-width: 1280px; margin: 0 auto; padding: {{mainPad}}; display: flex; flex-direction: column; gap: {{secGap}}">
    <div class="at-in" style="display: flex; flex-direction: column; gap: 12px; max-width: 680px">
      <p style="${KICK}">AwakeTab Pro</p>
      <h1 style="font-size: {{h1Size}}; line-height: {{h1LH}}; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance">Which plan fits you?</h1>
      <p style="font-size: 18px; line-height: 28px; color: {{t.ink2}}; text-wrap: pretty">Three quick questions. The answer is often free, and we will say so.</p>
    </div>

    <div style="{{gridStyle}}">
      <div style="display: flex; flex-direction: column; gap: 32px; min-width: 0">
        <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
          <legend style="${LEGEND}">1 · Where will you use it?</legend>
          <div role="radiogroup" aria-label="Where will you use it?" style="display: grid; grid-template-columns: {{q1Cols}}; gap: 8px">
            <sc-for list="{{q1}}" as="o" hint-placeholder-count="3">
              ${CHIP({ v: 'o', role: 'radio', round: true })}
            </sc-for>
          </div>
        </fieldset>

        <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
          <legend style="${LEGEND}">{{q2Legend}}</legend>
          <div role="{{q2Role}}" aria-label="{{q2Legend}}" style="display: grid; grid-template-columns: {{q2Cols}}; gap: 8px">
            <sc-for list="{{q2}}" as="o" hint-placeholder-count="4">
              ${CHIP({ v: 'o', role: '{{o.role}}', round: false })}
            </sc-for>
          </div>
        </fieldset>

        <sc-if value="{{showQ3}}" hint-placeholder-val="{{true}}">
          <fieldset class="at-in" style="margin: 0; padding: 0; border: 0; min-width: 0">
            <legend style="${LEGEND}">3 · How would you rather pay?</legend>
            <div role="radiogroup" aria-label="How would you rather pay?" style="display: grid; grid-template-columns: {{q1Cols2}}; gap: 8px">
              <sc-for list="{{q3}}" as="o" hint-placeholder-count="2">
                ${CHIP({ v: 'o', role: 'radio', round: true })}
              </sc-for>
            </div>
          </fieldset>
        </sc-if>
      </div>

      <aside aria-labelledby="fit-h" aria-live="polite" style="position: relative; display: flex; flex-direction: column; gap: 20px; padding: 24px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{resLine}}; box-shadow: {{cardShadow}}; min-width: 0">
        <p style="${KICK}">Our suggestion</p>
        <div style="display: flex; flex-direction: column; gap: 8px">
          <h2 id="fit-h" style="font-size: {{h2Size}}; line-height: {{h2LH}}; font-weight: 600">{{res.title}}</h2>
          <p style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; font-weight: 600; letter-spacing: -0.02em; font-variant-numeric: tabular-nums"><span style="font-size: {{priceSize}}; line-height: {{priceLH}}">{{res.price}}</span><span style="font-size: 18px; font-weight: 400; letter-spacing: -0.01em; color: {{t.ink2}}">{{res.per}}</span></p>
          <p style="font-size: 15px; line-height: 22px; color: {{t.ink2}}; text-wrap: pretty">{{res.why}}</p>
        </div>
        <ul style="display: flex; flex-direction: column; gap: 8px">
          <sc-for list="{{res.gets}}" as="g" hint-placeholder-count="3">
            <li style="display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 12px; font-size: 14px; line-height: 20px; color: {{t.ink}}"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" style="margin-top: 3px"><path d="M2 6.4l2.6 2.6L10 3.4" fill="none" stroke="{{lamp}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>{{g}}</li>
          </sc-for>
        </ul>
        <sc-if value="{{res.lamp}}" hint-placeholder-val="{{false}}">
          <a href="{{res.href}}" style="height: 60px; box-sizing: border-box; border-radius: 20px; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px -8px {{lampGlow}}">${CTA_GLYPH}{{res.cta}}</a>
        </sc-if>
        <sc-if value="{{res.plain}}" hint-placeholder-val="{{true}}">
          <a href="{{res.href}}" style="height: 52px; box-sizing: border-box; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.ground}}; color: {{t.ink}}; font-size: 16px; font-weight: 600; text-decoration: none; display: flex; align-items: center; justify-content: center">{{res.cta}}</a>
        </sc-if>
        <ul style="display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid {{t.line}}">
          <sc-for list="{{res.notes}}" as="n" hint-placeholder-count="2">
            <li style="font-size: 13px; line-height: 18px; color: {{t.muted}}; text-wrap: pretty">{{n}}</li>
          </sc-for>
        </ul>
        <a href="Pro.dc.html" style="align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 600; color: {{t.ink}}; text-decoration: underline; text-decoration-color: {{lamp}}; text-underline-offset: 5px">Compare everything on the Pro page</a>
      </aside>
    </div>
  </main>
${FOOTER}
</div>`;

export const logic = `
  constructor(props) {
    super(props);
    this.state = Object.assign({ theme: props.theme || 'auto', sysDark: this.sys(), now: Date.now() }, this.seed(props.answer || 'free'));
  }
  seed(a) {
    return {
      free: { use: 'me', wants: ['none'], pay: 'once', logo: 'no', credit: 'fine' },
      once: { use: 'me', wants: ['look', 'stats'], pay: 'once', logo: 'no', credit: 'fine' },
      year: { use: 'me', wants: ['sched'], pay: 'year', logo: 'no', credit: 'fine' },
      site: { use: 'site', wants: ['none'], pay: 'once', logo: 'no', credit: 'remove' },
      screens: { use: 'screens', wants: ['none'], pay: 'once', logo: 'yes', credit: 'fine' }
    }[a] || {};
  }
  heights() { return { phone: 2080, tablet: 1600, desktop: 1100 }; }
  update(prev) { if (prev.answer !== this.props.answer) this.setState(this.seed(this.props.answer || 'free')); }
  vals(b) {
    const s = this.state, t = b.t, desk = b.isDesk, tab = b.isTab, phone = b.isPhone;
    const opt = (on, label, sub, pick, round, role) => ({ label, sub, pick, role: role || 'radio', shape: role === 'checkbox' ? '8px' : '50%', sel: on ? 'true' : 'false', ring: on ? b.lamp : t.line, bg: on ? b.lampFaint : 'transparent', mark: on ? b.lamp : t.line2, fill: on ? b.lamp : 'transparent', tick: on ? 1 : 0, weight: on ? 600 : 500 });
    const q1 = [['me', 'On my own devices', 'Phone, laptop, tablet, up to 5'], ['site', 'On a website I run', 'Recipes, docs, how-to pages'], ['screens', 'On screens I manage', 'Kiosks, dashboards, signage']]
      .map(([id, l, sub]) => opt(s.use === id, l, sub, () => this.setState({ use: id })));
    const WANTS = [['none', 'Nothing else, it already works', 'Keeping the screen on is free'], ['look', 'Lamp colours and a message', 'Mint and Sky, and Message mode'], ['sched', 'Schedules and auto-start', 'In AwakeTab for Chrome'], ['stats', '12 weeks of stats', 'And a CSV export'], ['ads', 'No ads on the guides', 'The tool itself never has ads']];
    const toggle = (id) => () => {
      const cur = this.state.wants;
      if (id === 'none') return this.setState({ wants: ['none'] });
      const next = cur.filter((w) => w !== 'none');
      const out = next.includes(id) ? next.filter((w) => w !== id) : next.concat(id);
      this.setState({ wants: out.length ? out : ['none'] });
    };
    let q2, q2Legend, q2Role = 'group';
    if (s.use === 'site') {
      q2Legend = '2 · Is a small credit under the button fine?';
      q2Role = 'radiogroup';
      q2 = [['fine', 'Yes, keep the credit', 'It reads "Keep awake by AwakeTab"'], ['remove', 'No, remove it', 'Clean embed on your own site']].map(([id, l, sub]) => opt(s.credit === id, l, sub, () => this.setState({ credit: id })));
    } else if (s.use === 'screens') {
      q2Legend = '2 · Do the screens need your own logo?';
      q2Role = 'radiogroup';
      q2 = [['no', 'No, a clock is enough', 'Minimal or Clock mode, starts by itself'], ['yes', 'Yes, our logo on screen', 'Replaces the AwakeTab wordmark']].map(([id, l, sub]) => opt(s.logo === id, l, sub, () => this.setState({ logo: id })));
    } else {
      q2Legend = '2 · Beyond keeping the screen on, what do you want?';
      q2 = WANTS.map(([id, l, sub]) => opt(s.wants.includes(id), l, sub, toggle(id), false, 'checkbox'));
    }
    const wantsPro = s.use === 'me' && !s.wants.includes('none');
    const q3 = [['once', 'Pay once', '$19. Launch price for the first 90 days after launch, then $29'], ['year', 'Every year', '$12 a year']].map(([id, l, sub]) => opt(s.pay === id, l, sub, () => this.setState({ pay: id })));
    const GETS = { look: 'Mint and Sky lamps and Message mode on the awake screen', sched: 'Weekly schedules and auto-start in AwakeTab for Chrome', stats: '12 weeks of stats with a CSV export', ads: 'No ads on the guide pages' };
    const proNotes = ['5 devices, no account. Your key arrives by email.', '14-day refund, no questions asked.', 'Charged in USD; taxes added at checkout where applicable.'];
    let res;
    if (s.use === 'site') res = s.credit === 'remove'
      ? { title: 'Embed licence', price: '$29', per: 'a year per site, opening soon', why: 'Removes the credit line. Licences open soon; the free embed works today, with the credit.', gets: ['One script tag, Cook, Standard, Clock or Minimal mode', 'No "Keep awake by AwakeTab" credit', 'Includes one staging subdomain'], cta: 'Get the free embed code', href: 'EmbedShowcase.dc.html', lamp: false, notes: ['We open licences once checkout can register your domain.'] }
      : { title: 'The free embed', price: '$0', per: 'with a small credit', why: 'Your readers get the same button and status pill. The credit links back to AwakeTab.', gets: ['One script tag', 'Kitchen timers in Cook mode', 'Readers never see ads in the widget'], cta: 'Get the embed code', href: 'EmbedShowcase.dc.html', lamp: false, notes: ['Want the credit gone later? Embed licences ($29 a year per site) open soon.'] };
    else if (s.use === 'screens') res = s.logo === 'yes'
      ? { title: 'Kiosk licence', price: '$19', per: 'one site · $49 five sites', why: 'Your logo on the screen instead of the AwakeTab wordmark, and your own message, set from one URL.', gets: ['Your logo and message in Minimal mode', 'Starts by itself and resumes after a restart', 'Paid once per site'], cta: 'Build a kiosk link', href: 'PageKiosk.dc.html', lamp: true, notes: ['The kiosk link itself is free; the licence adds branding.', 'Charged in USD; taxes added at checkout where applicable.'] }
      : { title: 'A free kiosk link', price: '$0', per: 'no licence needed', why: 'Autostart, Minimal mode and Clock mode all work without paying.', gets: ['One URL per screen', 'Starts by itself, resumes after a restart', 'No ads on the screen'], cta: 'Build a kiosk link', href: 'PageKiosk.dc.html', lamp: false, notes: ['Add your logo and a message later with a Kiosk licence: $19 one site, $49 five sites.'] };
    else if (!wantsPro) res = { title: 'Free is enough', price: '$0', per: 'no key, no account', why: 'Everything that keeps a screen awake is free, and stays free.', gets: ['Every length, Until a time, No limit', 'All seven honest states and the fallback', 'Ambient modes, the floating window and AwakeTab for Chrome'], cta: 'Open AwakeTab', href: 'Main.dc.html', lamp: false, notes: ['If you want more later, Pro starts at $12 a year.'] };
    else if (s.pay === 'year') res = { title: 'Pro, yearly', price: '$12', per: 'a year', why: 'The extras you picked, on 5 devices.', gets: s.wants.map((w) => GETS[w]).filter(Boolean), cta: 'Get yearly Pro', href: 'Pro.dc.html', lamp: true, notes: ['If the plan ends, Pro features lock. Your settings and stats stay.', 'Lifetime: at the launch price, less than two years of the yearly plan.'].concat(proNotes.slice(1, 2)) };
    else res = { title: 'Pro, pay once', price: '$19', per: 'once', why: 'Launch price for the first 90 days after launch, then $29. The extras you picked, on 5 devices. Pay once, no renewal.', gets: s.wants.map((w) => GETS[w]).filter(Boolean), cta: 'Get lifetime Pro', href: 'Pro.dc.html', lamp: true, notes: ['At the launch price, less than two years of the yearly plan.'].concat(proNotes) };
    res.plain = !res.lamp;
    return {
      tone: b.lamp, aura: b.aura,
      mainPad: desk ? '40px 80px 96px' : tab ? '40px 32px 64px' : '24px 16px 48px', secGap: desk ? '48px' : '32px',
      h1Size: phone ? '34px' : '48px', priceSize: phone ? '40px' : '48px', priceLH: phone ? '48px' : '56px', h1LH: phone ? '42px' : '56px', h2Size: phone ? '24px' : '28px', h2LH: phone ? '32px' : '36px',
      gridStyle: desk ? 'display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 48px; align-items: start' : 'display: flex; flex-direction: column; gap: 32px',
      q1Cols: desk ? 'repeat(3, minmax(0, 1fr))' : tab ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)',
      q1Cols2: phone ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      q2Cols: phone ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      q1, q2, q2Legend, q2Role, q3, showQ3: wantsPro, res,
      resLine: res.lamp ? b.lampLine : t.line, resGlow: res.lamp ? b.lampGlow : 'transparent'
    };
  }
`;

export const wrappers = [
  ['GrowthPlanPhoneDark', 'Which plan fits · free is enough · phone · dark', { theme: 'dark', layout: 'phone', answer: 'free' }, 390, 2080],
  ['GrowthPlanPhoneLight', 'Which plan fits · pay once · phone · light', { theme: 'light', layout: 'phone', answer: 'once' }, 390, 2080],
  ['GrowthPlanTabletLight', 'Which plan fits · kiosk · tablet · light', { theme: 'light', layout: 'tablet', answer: 'screens' }, 820, 1600],
  ['GrowthPlanDeskDark', 'Which plan fits · yearly · desktop · dark', { theme: 'dark', layout: 'desktop', answer: 'year' }, 1280, 1100],
  ['GrowthPlanDeskLight', 'Which plan fits · recipe site · desktop · light', { theme: 'light', layout: 'desktop', answer: 'site' }, 1280, 1100]
];
