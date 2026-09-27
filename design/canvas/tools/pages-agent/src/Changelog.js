const SIZES = { phone: [390, 7844], tablet: [820, 5828], desktop: [1280, 5948] };
// Fragments from changelog/*.md, sorted as lib/changelog.ts does (date desc, release first, then file name desc).
// Tags are a design proposal: the fragments carry no type field today.
const ENTRIES = [
  ['2026-09-26', 'served-urls', 'Changed', 'Page addresses without redirects', 'Every page now opens directly at the address used in links, search results and shared URLs, for example awaketab.com/30m or awaketab.com/for/cooking, with no redirect first. The language homes keep their trailing slash, for example awaketab.com/es/.'],
  ['2026-09-26', 'privacy-contact-changelog', 'Changed', 'A contact address, a fuller privacy policy and a readable changelog', 'The [About](PageAboutDesk.dc.html) page now lists a contact address, support@awaketab.com, for support, refunds, bug reports and data requests.'],
  ['2026-09-26', 'polar-webhooks', 'Fixed', 'Pro cancellations and refunds reach every device', 'When you cancel a Pro subscription, turn a cancellation back off, or get a refund through Polar, your Pro devices now pick up the change the next time they check in, the same way on the website and in the extension. A cancelled yearly plan still keeps Pro until the end of the period you paid for. A full refund ends Pro on every device.'],
  ['2026-09-26', 'm8-embed-library', 'New', 'Embed widget, kiosk links, and the wake lock library', 'Sites can now add a "keep my screen on" button with one line: `<script async src="https://awaketab.com/embed.js" data-mode="cook"><\/script>`. The widget is the real AwakeTab in a small frame, with the same honest status in eight languages. The new [/kiosk](PageKioskDesk.dc.html) page builds start URLs for lobby screens and signage, and [/library](PageLibraryDesk.dc.html) has a live state-machine demo running the library build.'],
  ['2026-09-26', 'm7-extension', 'New', 'AwakeTab for Chrome, the browser extension', 'A web page can only keep the screen awake while its tab is visible. AwakeTab for Chrome asks Chrome itself to keep the display awake, or just the computer, so it keeps working when the tab is hidden or the window is minimised, for as long as Chrome is running. It still can\'t stop sleep when you close a laptop lid, and it never fakes keyboard or mouse input.'],
  ['2026-09-26', 'm6-followups', 'New', 'Sessions per day, focus blocks and a floating timer in your language', 'Stats now counts sessions per day. "Today" reads, for example, "42 min · 2 sessions", and the CSV export fills its `sessions` column. Days recorded before this update show no count rather than a guess. Focus mode now shows how many focus blocks you have finished today. A block only counts when it runs to the end.'],
  ['2026-09-26', 'm6-engagement', 'New', 'Ambient modes, stats and an offline app', 'Press {M} to switch the awake screen into Clock, Focus, Minimal, Night, Message or Cook. Focus runs 25/5-minute Pomodoro cycles. Night shows red digits on true black. Cook keeps the screen on while you pause its timer and adds up to three named kitchen timers that survive a reload. Message shows one line of your own text (Pro).'],
  ['2026-09-26', 'licence-api-fixes', 'Fixed', 'Pro licence fixes', 'If you cancel a yearly Pro subscription, Pro keeps working until the end of the period you paid for. Before this fix it stopped as soon as you cancelled. A device you remove on `/pro/manage` now actually loses Pro, and devices you use regularly are no longer removed as "unused for 90 days" when you add a new one. Lifetime licences no longer need their key entered again after 90 days.'],
  ['2026-09-26', 'launch-readiness', 'Fixed', 'Steadier layout, clearer focus and pages that stay in your language', 'The tool no longer shifts when a session starts. The status pill, the timer caption and the Stop button keep their places, so the page does not move under your finger. The "Read this in…" language suggestion now appears at the bottom of the screen instead of pushing the tool down.'],
  ['2026-09-26', 'kv-backups', 'New', 'Encrypted weekly backups of licence records', 'Licence records are now backed up every week. Each backup is encrypted before it is stored and kept for twelve weeks, and restoring one follows a tested procedure. The key that protects stored licence keys can now be rotated safely. What AwakeTab stores has not changed: licence keys are still kept only in encrypted form.'],
  ['2026-09-26', 'i18n-content', 'New', 'Top guides in seven more languages', 'Ten core guides are now available in Spanish, Brazilian Portuguese, German, French, Japanese, Simplified Chinese and Hindi. Each one is written for how people search in that language, embeds the tool with the same preset, and keeps every honest limit. They\'re marked "native review pending" and stay out of search results until a native speaker has checked them.'],
  ['2026-09-26', 'ext-system-level', 'Fixed', 'The extension says "System awake" at System level', 'At System level, AwakeTab for Chrome keeps your computer awake, but your screen can still dim, turn off or lock. The popup used to say "Screen awake" there as well. It now says "System awake", with "Screen may dim or lock" underneath, in all eight languages. The toolbar badge still shows SYS. At Screen level nothing changes.'],
  ['2026-09-26', 'ext-handoff-embed-cache', 'Fixed', 'Extension key hand-off uses one activation; faster embed widget loads', 'Opening "Find your key on awaketab.com" from AwakeTab for Chrome no longer activates Pro in that browser as well. The page checks the key and shows it to copy, and only the extension activates it. Moving your key into the extension now uses one of your five activations instead of two.'],
  ['2026-09-26', 'cjk-hindi-slugs', 'Changed', 'Japanese, Chinese and Hindi pages use English addresses', 'The Japanese, Chinese and Hindi versions of our guides now use the same address as the English page with the language in front, for example `awaketab.com/ja/for/cooking` rather than a romanised spelling. These links are easier to read and share. Spanish, Portuguese, German and French pages keep their translated addresses.'],
  ['2026-09-26', 'checkout-auto-fill', 'Fixed', 'Pro activates by itself right after checkout', 'After you buy Pro, the page Polar sends you back to now finds your licence key and activates this browser on its own, and the hand-off from AwakeTab for Chrome shows the key ready to copy. Before, it could not find the key and asked you to paste it from the receipt email.'],
  ['2026-09-12', 'analytics-pro', 'New', 'Site analytics and Pro plumbing', 'First-party `/api/e` beacon (anonymous telemetry, on by default), donation link in the footer, Pro pricing and activation pages, and licence endpoints. Ads remain disabled (`PUBLIC_ADS_ENABLED=0`). `/pro/activate` lists activation errors and supports `?ext=1` copy-paste for the extension. `/pro/manage` can remove a device.'],
  ['2026-09-11', 'shadcn-ui', 'Changed', 'Consistent controls across pages', 'Buttons, badges, cards, tables, alerts, breadcrumbs and form fields now share one component library across the tool, content and Pro pages, so the same control looks the same everywhere and in every theme. Everything is rendered at build time: no new JavaScript, no change to what the tool does, to the performance budgets, or to third-party requests (still none on tool pages).'],
  ['2026-09-09', 'site-i18n', 'New', 'Site, SEO and eight locales', 'The home page now carries the full tool, a support matrix, honest limits and eight FAQs. Hub and trust pages are live. UI strings exist in eight languages; unreviewed locale homes stay out of the sitemap until a native speaker signs them off.'],
  ['2026-09-09', 'foundation', 'New', 'Foundation', 'Published the initial AwakeTab holding page and repository foundation.'],
  ['2026-09-09', 'content-pages', 'New', 'Fifty-one English scenario pages', 'Fifty-one English articles across /for, /on, /vs, /guides and /learn. Each page embeds the tool with autostart off, states an honest limit, and links related routes. Ads remain off.']
];
const PARTS = [
  ['On the awake screen', 'Press M for Clock, Focus (25/5-minute blocks, with today\'s count), Minimal, Night, Message (Pro) or Cook.'],
  ['In your language', 'The tool is available in eight languages.'],
  ['Steadier and faster', 'The page no longer moves when a session starts, and the first screen appears sooner on phones.'],
  ['Beyond the tab', 'AwakeTab for Chrome keeps the display, or only the computer, awake while the tab is hidden, using Chrome\'s own power API.'],
  ['Pro and licences', 'Cancelling a yearly plan keeps Pro until the end of the period you paid for.'],
  ['Still honest', 'A web page cannot keep the screen on while its tab is hidden, cannot keep Teams or Slack "Available", and cannot stop sleep when you close a laptop lid.']
];
const FILTERS = [['all', 'All'], ['New', 'New'], ['Fixed', 'Fixed'], ['Changed', 'Changed']];
const TAG_GLYPH = { New: 'M12 5v14M5 12h14', Fixed: 'M5 12.5l4.5 4.5L19 7.5', Changed: 'M4 9h13l-3.5-3.5M20 15H7l3.5 3.5' };

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: props.theme ?? 'auto', sysDark: sysDark(), filter: 'all' };
  }
  componentDidMount() { themeMount(this); }
  componentWillUnmount() { themeUnmount(this); }
  componentDidUpdate(prev) {
    if (prev.theme !== this.props.theme && this.props.theme) this.setState({ theme: this.props.theme });
  }
  renderVals() {
    const s = this.state;
    const sh = shell(this, SIZES, '', 'phone');
    const { t, p, dark, isDesk, isTab, isPhone } = sh;
    const violet = dark ? '#A594FF' : '#5A47CF';
    const TAGC = { New: p.lamp, Fixed: t.ink2, Changed: violet };
    const shown = ENTRIES.filter((e) => s.filter === 'all' || e[2] === s.filter);
    const groups = [];
    for (const [iso, id, tag, title, body] of shown) {
      let g = groups[groups.length - 1];
      if (!g || g.iso !== iso) { g = { iso, date: fullDate(iso), items: [] }; groups.push(g); }
      const c = TAGC[tag];
      g.items.push({ id, tag, title, segs: segs(body, p, t), tagInk: c, tagStyle: atTag(t, c), tagGlyph: TAG_GLYPH[tag], border: g.items.length ? '1px solid ' + t.line : 'none' });
    }
    const fi = FILTERS.findIndex((f) => f[0] === s.filter);
    const count = (id) => (id === 'all' ? ENTRIES.length + 1 : ENTRIES.filter((e) => e[2] === id).length + (id === 'New' ? 1 : 0));
    return Object.assign(sh, {
      mainPad: isDesk ? '32px 80px 0' : isTab ? '32px 32px 0' : '12px 16px 0', mainMax: isDesk ? '1040px' : '100%',
      filterSeg: seg(FILTERS, s.filter, (id) => this.setState({ filter: id }), t, { max: '520px', fs: 14 }), tagRelease: atTag(t, p.lamp),
      lampSoft: rgba(p.lamp, 0.14), lampLine: rgba(p.lamp, 0.45),
      filters: FILTERS.map(([id, label], i) => ({ label, aria: label + ', ' + count(id) + ' changes', count: count(id), sel: id === s.filter ? 'true' : 'false', style: atSeg(FILTERS, s.filter, () => {}, t, { fs: 14 }).items[i].style, pick: () => this.setState({ filter: id }) })),
      filterX: fi * 100 + '%',
      showRelease: s.filter === 'all' || s.filter === 'New',
      relPad: isPhone ? '24px 20px' : '32px', relNum: isPhone ? '72px' : '104px',
      relLine: rgba(p.lamp, 0.35), relAura: rgba(p.lamp, dark ? 0.16 : 0.12), relShadow: dark ? '0 40px 80px -48px rgba(0,0,0,0.8)' : '0 30px 60px -40px rgba(14,23,38,0.25)',
      partCols: isPhone ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      parts: PARTS.map(([head, body]) => ({ head, body })),
      groups, dotBg: t.ground,
      groupCols: isDesk ? '210px minmax(0, 1fr)' : 'minmax(0, 1fr)',
      railLine: isDesk ? 'none' : 'linear-gradient(' + t.line + ', ' + t.line + ') no-repeat 0 0 / 1px 100%', railPad: isDesk ? '0' : '20px', railIndent: isDesk ? '0' : '6px',
      bodyType: isPhone ? AT_TYPE.ui : AT_TYPE.body
    });
  }
}
