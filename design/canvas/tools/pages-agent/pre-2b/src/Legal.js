const SIZES = {
  privacy: { phone: [390, 7129], tablet: [820, 5111], desktop: [1280, 4508] },
  terms: { phone: [390, 2341], tablet: [820, 1854], desktop: [1280, 1619] }
};
const P = (text) => ({ kind: 'p', text });
const DL = (items) => ({ kind: 'dl', items });
const DOCS = {
  privacy: {
    title: 'Privacy', effective: '2026-09-09', updated: '2026-09-26', other: ['Terms', 'PageTermsPhone.dc.html'],
    lede: 'AwakeTab requires no account and sets no cookies.',
    sections: [
      ['browser', 'Data stored in your browser', 'your settings, sessions and stats live in this browser, under six keys. You can clear them from Settings or your browser.', [
        DL([
          ['`at.v1.settings`', 'Theme, accent, default duration, sound, notifications, end behavior, battery, ambient, language, telemetry and keyboard preferences.'],
          ['`at.v1.session`', 'The current or last session so a reload can offer to resume it.'],
          ['`at.v1.stats`', 'Local-date minute totals, session count and streak data retained for up to 365 days.'],
          ['`at.v1.license`', 'An offline-verifiable Pro token, plan, features, validation time and random device identifier.'],
          ['`at.v1.meta`', 'Install date, completed-session count, rating-prompt choice and last seen version.'],
          ['`at.v1.onboarding`', 'Dismissed tips, including language suggestions.']
        ]),
        P('This data stays in browser storage unless a feature explicitly contacts the first-party API. You can clear it from Settings or your browser. `BroadcastChannel(\'awaketab\')` coordinates open tabs without sending that state to a server.')
      ]],
      ['telemetry', 'Optional first-party telemetry', 'only while telemetry is on, AwakeTab sends anonymous events to its own server. No user id, no fingerprint, no persistent identifier.', [
        P('When telemetry is enabled, AwakeTab may send: `page_view`, `session_start`, `session_end`, `lock_state`, `lock_denied`, `fallback_used`, `resume_shown`, `resume_accepted`, `pwa_install`, `pip_open`, `share_click`, `pro_view`, `pro_checkout_click`, `pro_activated`, `rating_prompt`, `extension_click`, `ad_slot_loaded`, `sponsor_view`, `sponsor_click`, `session_extend`, `affiliate_click`, `rating_submitted` and sampled `client_error` events.'),
        P('Common fields are timestamp, path without query parameters, locale, coarse browser/OS and viewport classes, application version and a random per-tab session id held only in memory. AwakeTab does not collect a user id, exact user agent, fingerprint, full referrer or persistent analytics identifier.')
      ]],
      ['extension', 'AwakeTab for Chrome (browser extension)', 'the extension keeps the same records on your computer, asks for power, storage and alarms (anything else is optional), and sends no usage data unless you turn it on.', [
        P('The extension keeps the same records as the site, in `chrome.storage.local` on your computer: `at.v1.settings`, `at.v1.session`, `at.v1.stats`, `at.v1.license` (only after you activate Pro), `at.v1.ext` (Screen or System level, schedules and auto-start sites) and `at.v1.device` (a random device id created once per browser profile, used only to count Pro activations).'),
        P('If Chrome sync is on, your settings, schedules and auto-start sites are also copied through `chrome.storage.sync` to your other Chrome profiles. The licence token and the device id never sync.'),
        P('The extension asks for `power`, `storage` and `alarms`. Notifications and access to a website are optional and requested only when you turn on end-of-timer notifications or add an auto-start site; the site permission covers that one site, and the extension never reads page content. Which sites you add is never sent anywhere.'),
        P('Anonymous usage statistics are off by default in the extension. If you turn them on in its settings, it sends at most `session_start`, `session_end`, `pro_activated` and `client_error` events to `awaketab.com/api/e` with `source: ext` and the common fields above — never a URL, tab title or site name. Activating Pro sends the licence key, the random device id and the label “AwakeTab for Chrome · your operating system” to `/api/license/activate`. The extension shows no ads, loads no remote code and never simulates keyboard or mouse input.')
      ]],
      ['server-data', 'Data kept on our servers', 'three kinds of records, each with an end date: usage events for 90 days, ratings for up to 2 years, and a licence record until the licence expires plus one year.', [
        P('AwakeTab runs on Cloudflare. It keeps three kinds of records there, and nothing else:'),
        DL([
          ['Anonymous usage events', 'The telemetry events above, and content-security-policy reports your browser may send to `/api/csp` (only the page path is kept). They are stored in Cloudflare Workers Analytics Engine and **deleted automatically after 90 days**. They carry no IP address and no identifier beyond the per-tab random session id, so they cannot be traced back to you. Turn telemetry off in Settings to stop sending them.'],
          ['Ratings', 'If you rate AwakeTab, we store the stars, any text you choose to write (up to 500 characters), the page language, the app version and the time, for up to 2 years. No name, email, IP address or device id is attached. Only the aggregate (average and count) is published.'],
          ['Licence record', 'If you buy Pro or a Business licence, we keep a record to fulfil the purchase, handle refunds and stop abuse: the plan and its status, your licence key (encrypted), the Polar order and customer ids, and for each activated device a hash of its random device id, its label and when it was last seen. It is kept until the licence expires plus one year, then deleted. Your name, email and payment details stay with Polar, the merchant of record, whose privacy terms apply.']
        ]),
        P('**Deleting your licence data.** Email [support@awaketab.com](mailto:support@awaketab.com) from any address with your licence key or Polar receipt, and ask us to delete your licence data. We delete the licence record and its device list within 7 days and confirm by reply. Deleting it ends Pro on every device, and it does not refund the purchase (a refund within 14 days does that, see the terms). Usage events and ratings carry no identity, so no one, including us, can pick out yours; they expire on the schedule above.')
      ]],
      ['network', 'Network and payment data', 'your IP address is used briefly, as a salted hash, for rate limiting and is never stored as analytics. Polar handles payment.', [
        P('API rate limiting uses a salted hash of the source IP transiently; neither the IP nor its hash is stored as analytics. Pro purchases are processed by Polar, whose checkout privacy terms apply. Licence endpoints receive only the licence key or token, a random device id and a user-visible device label.')
      ]],
      ['ads', 'Advertising (not yet active)', 'no page shows ads today. If article ads start, they will never appear on the awake screen, in Picture-in-Picture, in embeds or in the extension.', [
        P('**No page shows ads today.** This section describes what will apply once advertising starts on the articles; the effective date above will change when it does.'),
        P('AwakeTab\'s tool pages load no third-party scripts and show no ads. Our articles (pages under /for, /on, /vs, /guides and /learn) will show advertisements from Google AdSense. Ad vendors may set cookies and process your IP address and browsing information to show and measure ads. If you are in the EEA, the UK or Switzerland we will ask for your consent first through a certified consent management platform, and you will be able to change your choice any time via “Manage consent” in the footer. AwakeTab Pro removes ads on all pages. We never show ads on the awake screen, in Picture-in-Picture, in embeds or in the browser extension.')
      ]],
      ['contact', 'Contact', 'one address for every question about this policy or your data.', [
        P('Questions about this policy or your data: [support@awaketab.com](mailto:support@awaketab.com).')
      ]]
    ]
  },
  terms: {
    title: 'Terms', effective: '2026-09-09', updated: '2026-09-09', other: ['Privacy', 'PagePrivacyDesk.dc.html'],
    lede: 'You may use AwakeTab to request that a supported browser keep a display awake while the relevant page remains eligible. Browser, operating-system and device power policy always remain in control.',
    sections: [
      ['guarantee', 'No guarantee of uninterrupted wakefulness', 'trust the live status pill, not a promise. Do not rely on AwakeTab for safety-critical monitoring.', [
        P('AwakeTab cannot guarantee operation in a hidden tab, after closing a laptop lid, during low-power modes, after browser suspension, or when a device administrator blocks the API. Use the live status pill as the current result and do not rely on AwakeTab for safety-critical monitoring.')
      ]],
      ['use', 'Responsible use', 'use the shortest session you need, and do not use AwakeTab to fake activity or availability.', [
        P('Keeping a display on uses battery and may cause image retention on some screens. Follow device guidance, use the shortest suitable duration and stop a session when it is no longer needed. You must not use the service to misrepresent activity or availability.')
      ]],
      ['licences', 'Software and licences', 'the website is provided as-is, open-source packages keep their own licence, and paid licences have a 14-day refund.', [
        P('The public website is provided as-is. Open-source packages are governed by the licence included with their source. Paid product terms, activation limits and refund information shown at checkout apply in addition to these terms. Features and browser support may change as platforms change.'),
        P('Paid licences include a 14-day refund, no questions asked. Email [support@awaketab.com](mailto:support@awaketab.com) with your receipt or use the Polar customer portal. Refunds deactivate the licence key.')
      ]]
    ]
  }
};

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: props.theme ?? 'auto', sysDark: sysDark(), active: null };
  }
  componentDidMount() { themeMount(this); }
  componentWillUnmount() { themeUnmount(this); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
    if (prev.doc !== this.props.doc) this.setState({ active: null });
  }
  renderVals() {
    const s = this.state;
    const docId = this.props.doc === 'terms' ? 'terms' : 'privacy';
    const D = DOCS[docId];
    const sh = shell(this, SIZES[docId], '');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const active = s.active && D.sections.some((x) => x[0] === s.active) ? s.active : D.sections[0][0];
    return Object.assign(sh, {
      docTitle: D.title, lede: D.lede, effective: fullDate(D.effective), updated: fullDate(D.updated),
      otherLabel: D.other[0], otherHref: D.other[1],
      cols: isDesk ? '232px minmax(0, 1fr)' : 'minmax(0, 1fr)',
      areas: isDesk ? '". head" "toc body"' : '"head" "toc" "body"',
      mainPad: isDesk ? '32px 56px 0' : isTab ? '28px 70px 0' : '12px 20px 0',
      tocPad: isDesk ? '6px 0 0' : '18px 18px 10px', tocBg: isDesk ? 'transparent' : t.surface, tocBorder: isDesk ? '0' : '1px solid ' + t.line,
      tocRail: '1px solid ' + t.line,
      toc: D.sections.map(([id, title]) => ({
        title, href: '#' + docId + '-' + id, cur: id === active ? 'location' : 'false', weight: id === active ? 600 : 500,
        color: id === active ? t.ink : t.ink2, mark: id === active ? p.lamp : 'transparent', pick: () => this.setState({ active: id })
      })),
      sumBg: rgba(p.lamp, dark ? 0.07 : 0.06), sumLine: rgba(p.lamp, dark ? 0.22 : 0.26), sumFont: isPhone ? '15px' : '16px',
      dlCols: isPhone ? 'minmax(0, 1fr)' : '190px minmax(0, 1fr)',
      sections: D.sections.map(([id, title, summary, blocks]) => ({
        id: docId + '-' + id, hid: docId + '-' + id + '-h', title, summary,
        blocks: blocks.map((b) => b.kind === 'p'
          ? { isP: true, isDl: false, segs: segs(b.text, p, t), items: [] }
          : { isP: false, isDl: true, segs: [], items: b.items.map(([term, desc]) => ({ term: segs(term, p, t), desc: segs(desc, p, t) })) })
      }))
    });
  }
}
