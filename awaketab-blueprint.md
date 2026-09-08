# AwakeTab Blueprint — plan for a next-level alternative to nosleep.page

Prepared 6 Sep 2026 for Soubhik. Full designed version (tables, diagram, sources): https://claude.ai/code/artifact/0bfc4f92-7b99-473a-b510-691e05eeddd9

## The bet in five decisions

1. **Brand:** AwakeTab on awaketab.com (+ .app/.page/.dev). All four were unregistered at registry level (RDAP) on 6 Sep 2026. Reserves: NeverDim (neverdim.app), WideAwake (wideawake.page).
2. **Trust over tricks:** native Wake Lock with a live honest status pill (Held / Re-acquiring / Lost / Fallback / Unsupported / Denied). No fake mouse jigglers, no "works in background" claims, no Google ads on the awake screen, no third-party scripts on the tool.
6. **Money (decided 6 Sep 2026):** AwakeTab Pro ($12/yr · $29 lifetime via Polar.sh) is the primary line; display ads only on content pages once indexed (AdSense → Journey by Mediavine → Raptive/Mediavine); a fixed-fee sponsor card is the only monetization on the awake screen, from 100k visits; Cook Mode/kiosk licences; donations as goodwill. Section 11.
3. **Coverage:** until-a-clock-time, ambient/OLED clock modes, end-of-session alerts, battery-aware auto-stop, session restore, PiP floating pill, installable PWA, browser extension for hidden-tab use.
4. **Content architecture:** ~60 English pages (/for, /on, /vs, /guides, /learn) × 8 languages, each embedding the live tool with a scenario preset and 600–1,000 words of real substance.
5. **Authority engine:** open-source TypeScript wake-lock library (NoSleep.js has not shipped since Dec 2020) + tested research ("does a wake lock keep Teams green?").

## 01 · nosleep.page teardown

**Facts.** Single static page on GitHub Pages behind Cloudflare; 8.9 KB HTML + ~25 KB Tailwind + app.js; NoSleep.js 0.12.0 from cdnjs; Show HN Apr 2022 (252 pts / 130 comments); last deploy 3 Oct 2025. Features: toggle ring, 30m/1h/2h + custom HH:MM, today/week stats in localStorage, theme/bg colour pickers, 4-item FAQ, Buy Me a Coffee widget.

**Keep:** auto-start on load (no competitor does this), no account/ads/tracking, tiny and fast, memorable domain, usage stats (unique), the ring UI.

**Defects found in the shipped source:**
- UI can say "awake" while the lock failed — `startSession()` sets active without checking the `noSleep.enable()` promise (trust-breaking).
- Abandoned dependency: NoSleep.js v0.12.0 (16 Dec 2020, ~49 open issues), loaded render-blocking from cdnjs; app reaches into private `_wakeLock`.
- Blocking `alert()` fires on lock release — i.e. exactly when the tab is hidden.
- Stats keyed by UTC date (`toISOString().slice(0,10)`) — "Today" rolls over at 05:30 IST.
- Timer capped at 23:59 via a repurposed `<input type=time>`; no until-a-time mode; "1 hr" chip hidden on phones.
- No session persistence, no manifest, no service worker, no apple-touch-icon.
- Silent at timer end; silent when unsupported (fallback needs a gesture, auto-start fails quietly).
- SEO: no `<h1>`; two conflicting meta descriptions; no og:image; only `WebSite` schema; no sitemap; robots.txt has no Sitemap line; ~150 words; one URL; one language; no freshness since Oct 2025.
- A11y/IA: state by colour + emoji only; countdown not announced; colour pickers hidden inside an FAQ `<details>`.

## 02 · Market (10 sites torn down)

All ship the same five things (toggle, 15m–2h presets, "keep tab visible" disclaimer, dark theme, short FAQ). SEO leaders win on page count, not product:
- screenalwayson.com — 91 URLs (/platforms, /scenarios, /ai clusters), 220–360 words each, AdSense, extension + Mac app cross-sell.
- keep-screen-on.com — 135 URLs, richest schema, ~1,200-word home; roadmap/changelog pages are unedited boilerplate ("John Doe").
- screenawake.com — 9 languages, AI-agent blog posts, no JSON-LD, robots.txt points at a typo'd domain.
- nosleep.online — deepest fallback chain, iframe embed, templated copy leaks, pages targeting competitor brands.
- nosleep.williamchong.cloud — Document Picture-in-Picture floating window (the one new idea); real PWA; broken og:image.
- keep-awake.com — lightest (13 KB JS), most honest FAQ.
- screenawake.online — fake "stealth F15 key"/"invisible mouse" (synthetic DOM events), fabricated testimonials, false "works in background".
- keepscreenawake.org, Balzabu/nosleep-web — thin.

**Implications:** trust is the open lane; page depth bar is low; FAQ rich results were removed 7 May 2026 and HowTo in Sept 2023 so competitors' schema stacks are dead weight — `WebApplication` with genuine `aggregateRating` is what remains.

**White space nobody ships:** until-a-clock-time · honest capability detection · notification/title flash at end · battery-aware auto-stop · session restore · real offline PWA with SEO content · OLED ambient with pixel shift · PiP + timers · stats/streaks · tested Teams/Slack answer · maintained library.

## 03 · What users want (HN 130 comments + competitor FAQs)

Locked corporate 5-minute sleep policy (top use case) · "keep awake until 6:18 pm" (top feature request) · downloads/builds/AI agent runs · recipes, reading, sheet music · presentations, dashboards, kiosks · Teams/Slack presence (needs an honest answer: presence follows input idle; no source shows a wake lock resets it) · "more docs, it's not foolproof" · OLED burn-in/battery/CPU (old Firefox video fallback 25–30% CPU) · iPhone: Safari 16.4+, Home-Screen apps 18.4+, Low Power Mode forces 30 s Auto-Lock.

## 04 · Scenario coverage (each = behaviour + landing page + stated limit)

Cooking (Cook Mode) · Presenting (PiP pill, until-time) · Downloads/builds/AI agents (indefinite + extend prompt + OS matrix) · Dashboards/kiosks (fullscreen ambient, auto-resume, `?autostart=1`) · Sheet music/reading (minimal mode) · Night clock (OLED black, red digits) · Baby monitor/GPS (PWA, battery auto-stop) · Work laptop (auto-start, shortcuts, `/30m` URLs) · Teams/Slack (honesty page, no jiggler) · Timer end (chime, notification, title flash, +30 min) · Denied/unsupported (status + fix) · iOS Low Power Mode (detect + guidance) · Accidental reload (resume banner) · Sharing (preset links, embed, extension).

## 05 · Feature tiers

- **Tier 0 Trust core (wk 1–2):** native Wake Lock, own 1-frame video fallback (no NoSleep.js), status pill driven by `WakeLockSentinel` release + `visibilitychange`, capability probe (Chrome 84 / Edge 84 / Firefox 126 / Safari 16.4 / iOS PWA 18.4), session persistence, toasts not alerts, zero third-party scripts, local-midnight stats.
- **Tier 1 Parity (wk 1–2):** presets 15m–4h/∞, custom to days, until-time; deep links `/30m`, `/until/17-30`; keyboard (Space, 1–6, F, D, Esc, ?); auto/light/dark/OLED; installable PWA with shortcuts + offline; 8 languages; WCAG 2.2 AA; fullscreen.
- **Tier 2 Engagement (wk 6–9):** ambient modes (Clock, Focus/Pomodoro, Minimal, Night, Message); end alerts; battery auto-stop (Chromium); stats/streaks/heatmap/export; PiP pill; burn-in guard; second-tab detector; rating prompt after 5th session.
- **Tier 3 Reach (wk 4–10):** extension (`chrome.power.requestKeepAwake("display")`); open-source library + demo; embeddable widget (`allow="screen-wake-lock"`); share links; research asset (14 browser/OS combos).
- **Non-goals:** synthetic input, Google ads on the awake screen (ever), accounts. Ads arrive later on content pages only — see section 11.

## 06 · Engine and stack

State machine: Idle → Requesting → Held → Lost (tab hidden) → re-request on visible; Requesting → Denied (NotAllowedError) → retry after fix; Idle → Unsupported → Fallback (user tap). Only Held and Fallback may show a running timer. Stack: Astro static + one vanilla-TS island, Tailwind tokens, engine as shared package (site, PiP, embed, extension), Cloudflare Pages, Workbox SW, cookieless analytics; <40 KB JS on home, no third-party requests.

## 07 · Name and domain

**AwakeTab** — describes the behaviour ("open the awake tab"), contains the head keyword, 8 letters, spells as it sounds, no product/extension collision found. Tagline: "The tab that keeps your screen awake." Register .com/.app/.page/.dev; .com canonical. Finalists: NeverDim, WideAwake, EverAwake, AwakeLamp. Rejected: KeepAwake/ScreenAwake/StayAwake/NoSleep-* (collisions, generic), NoDoze (NoDoz trademark), .io as primary (Chagos/TLD uncertainty). Do a trademark screen (USPTO/EUIPO/IP India, class 9/42) and grab GitHub/npm/social handles the same day.

Registry check 6 Sep 2026 — open on .com/.app/.page/.dev/.io: awaketab, tabawake, awakelamp, screenvigil, dontdim, keepwake. Open except .com: neverdim, everawake, nevernap, awakely. wideawake: .page/.dev only. stayawake: all taken.

## 08 · SEO plan

**Where to fight:** tool intent ("keep screen awake", "…online", "keep screen on", "prevent screen from sleeping") owned by thin clones → primary. Use-case, device and alternative intents → primary programmatic pages. Developer intent → library/demo for links. OS how-to head terms (Microsoft/Apple/How-To Geek) → long-tail guides only. Teams/jiggler → one honesty page, not a target.

**Architecture (~60 EN URLs × 8 locales):** `/` (tool above fold, 1,200–1,800 words, support matrix, 8 FAQs) · `/for/{18 scenarios}` · `/on/{12 devices/browsers}` · `/vs/{7 alternatives}` · `/guides/{8 OS how-tos}` · `/learn/{6 deep pieces}` · `/{preset}` duration deep links · changelog/about/privacy/support-matrix/extension/embed/library.

**On-page:** title "{Intent} — AwakeTab" <60 chars; one matching H1; answer in first 100 words; tool is the LCP element (inline SVG); breadcrumbs; hub-and-spoke links; "last verified" lines; per-page OG images; real author page.

**Schema:** `WebApplication` (UtilitiesApplication, price 0, aggregateRating only from real in-app ratings), `Organization`, `WebSite`, `BreadcrumbList`, `Article` with dateModified. FAQPage/HowTo: harmless, no investment.

**Technical:** LCP <1.2 s, INP <100 ms, CLS 0; <40 KB JS; static HTML; sitemap-index with lastmod; canonical; reciprocal hreflang + x-default in locale subfolders; `Permissions-Policy: screen-wake-lock=(self)`, CSP, HSTS; Search Console + Bing + IndexNow; CrUX monitoring; rank tracking on 25 queries × 8 locales.

**Languages:** launch en, es, pt-BR, de, fr, ja, zh-Hans, hi (native-reviewed; localize keywords not sentences). Phase 2: id, tr, ko, it, ru, vi, ar.

**Authority:** Show HN + Product Hunt same day; GitHub/npm library; AlternativeTo + Chrome Web Store listings; original research (Teams test, OS sleep matrix); embed widget with attribution; one dev article; genuine community answers.

**Targets:** Day 30 — 60 URLs indexed, CWV green, extension in review. Day 90 — top 10 for head terms in 3 locales, 20+ referring domains, 25% return rate. Day 180 — top 3 → #1 for "keep screen awake" (EN), #1 on 15+ long-tail queries, library 200+ stars, visible brand searches.

## 09 · Roadmap

- **Phase 0 (days 1–3):** domains, trademark screen, handles, brand tokens, repo, Cloudflare Pages, Search Console. Exit: holding page live with correct meta/OG/schema.
- **Phase 1 (wk 1–2):** Tier 0 + Tier 1 + full home page + 8 locales (home only) + cross-browser test matrix. Exit: CWV green, a11y 100, pill never lies.
- **Phase 2 (wk 3–5):** /for, /on, /guides, hreflang for top 10 pages, extension MVP, Show HN + PH, AlternativeTo, nosleep.page comparison. Exit: 60 URLs indexed, extension approved, 10 referring domains.
- **Phase 3 (wk 6–9):** Tier 2 + library + /vs + /learn + embed + remaining locales. Exit: library published, research live, return rate measured.
- **Phase 4 (ongoing):** GSC-driven pages, support-matrix refresh per browser release, more locales, monthly changelog.

## 10 · Risks and limits to publish

Lock releases when tab hidden/minimized/device locked · keeps display on; whether idle system sleep is also held off varies by OS (Chromium on Windows appears to flag the system as required, macOS does not) — publish only what the test matrix confirms; lid close always sleeps · cannot keep Teams/Slack available · Low Power Mode / battery saver can override · Firefox <126, Safari <16.4 need fallback · iOS notifications only in installed web apps; Battery API Chromium-only. Project risks: Google volatility, cloning (library/research/extension/brand don't copy), browser policy changes, translation quality, Tier 2 scope creep, confirm domains at registrar before sharing.

## 11 · Monetization — final call (decided 6 Sep 2026)

**Decision:** both ads and paid revenue, gated and placed by where attention is. **AwakeTab Pro is the primary line; display ads are secondary and run only on content pages; the awake screen never carries a Google ad (a single fixed-fee sponsor card at scale is its only monetization); every layer opens at a measurable gate.**

**Facts that bind the design**
- Google Publisher Policies ("Out of context ads") ban Google-served ads where "the user's attention is expected to be elsewhere and not on the screen hosting the ad" — the active wake-lock screen is the textbook case. Four competitors run AdSense there anyway (tolerance, not permission). AdSense also forbids any refresh the user didn't request; refresh exists only via Ad Manager-backed networks (declared, ≥30 s, in-view). Active View pays a viewable impression once — hours in view earn nothing extra; attention pricing (Adelaide in DV360 since Jul 2026, TTD Sincera thresholds) discounts idle inventory. No Google ads inside browser extensions.
- Network ladder 2026: Ezoic needs 250k MAU (Feb 2026); Journey by Mediavine = 1,000 Tier-1 sessions/30 days + site ≈4 months; Raptive = 25k pv/mo, ≥50% Tier-1, long-form on most pages; Mediavine = $5k prior-year revenue. AdSense rejects "low value content" tool sites → approval depends on the 60 content pages. AdSense pays India in USD by wire/EFT at $100.
- RPM estimates: idle tool-page impressions ≈ $0.6–3; content pages $2–9 on AdSense, $5–18 on a network (blended geo mix).
- Non-ad: donations convert 0.02–0.05% of visitors (noise); premium earned 3× tips in the one head-to-head found; long-dwell tools price Pro at $12–24/yr or $36 lifetime; paid keep-awake desktop apps $1.99–8.99 one-time, gating automation/customization, never the lock.
- B2B white space: WP Recipe Maker / Tasty gate Cook Mode behind $49–149/yr; no standalone widget exists; kiosk browsers charge €8.90–$99.99/device for keep-on + branding.
- Rails for an Indian individual: Stripe India excludes individuals from international payments (ExtensionPay out); Stripe Managed Payments (Lemon Squeezy's successor) doesn't list India. Use a merchant of record that pays Indian individuals: **Polar.sh** (5%+50¢, license keys, Stripe Connect Express payouts) or **Dodo Payments** (4%+40¢, UPI). Donations: Buy Me a Coffee + GitHub Sponsors both pay to India.

**Revenue stack (share of base-case month-12 revenue)**
1. AwakeTab Pro — $12/yr or $29 lifetime ($19 lifetime for first 90 days); gates ambient theme packs, custom message/logo on the awake screen, recurring schedules, custom sounds, stats history + CSV, PiP Pro, extension Pro, ad-free content pages; license key stored locally, no accounts; via Polar.sh. Opens with Tier 2 (~week 9). ~62%.
2. Display ads — content pages only (/for, /on, /vs, /guides, /learn); 2–3 fixed-size units + mobile anchor; ads-to-content ≤20%; ≤3 in view; no vignettes/interstitials; scripts after LCP; refresh only network-managed, ≥30 s, in-view; Pro removes. AdSense → Journey → Raptive/Mediavine. Opens when 60 pages are indexed (~week 5). ~14%.
3. Sponsor card — one fixed-fee "Sponsored by" card on the awake screen (idle + held), disclosed, one at a time, $300–1,000/mo; the only monetization that surface ever carries. Opens at 100k visits/mo. ~10%.
4. Business licences — Cook Mode embed (free with attribution; $29/yr per site removes it, adds brand colours + stats); Kiosk/Dashboard $19 one-time per site, $49 for five. Phase 3. ~6%.
5. Donations — BMC on site, GitHub Sponsors on the library; goodwill. Launch. ~4%.
6. Affiliate cards — tablet stands, kitchen tablet holders, phone mounts (Amazon Associates India; Geniuslink elsewhere). With content pages. ~3%.

**Placement rules:** awake screen (lock held) → never Google ads, sponsor card only; tool page idle → Pro card/sponsor; end-of-session prompt → Pro upsell; content pages → ads + affiliate; PiP/extension → never; installed PWA → content pages only.

**Model (USD/mo, net; estimates)** — assumptions: 1.3 pv/visit, 35% content pageviews, 1.6 visits/unique; Pro 0.06–0.35% of monthly uniques × $16 net; donations 0.02–0.04% of visits × $4.50.
- Low: M6 25k visits ≈ $260 (ads 51 · Pro 150); M12 60k ≈ $770 (ads 136 · Pro 480).
- Base: M6 50k ≈ $1,060 (ads 136 · Pro 750); M12 120k ≈ $3,860 (ads 546 · Pro 2,400 · sponsor 400 · business 250).
- High: M6 100k ≈ $3,850; M12 250k ≈ $12,960 (ads 1,706 · Pro 8,750 · sponsor 1,000).
- Google ads on the awake screen would add ≈ $150/mo in the base case at M12 — against a named policy, a permanently lost AdSense account if enforced, slower LCP, and the trust claim.

**Gates:** 0 launch (~wk 2): donate links, no ads, no Pro · 1 (~wk 5): 60 pages indexed → AdSense on content pages + affiliate · 2 (~wk 9): Tier 2 shipped → Pro via Polar, ad-free added · 3 (~month 4–5): 1,000 Tier-1 sessions/30d + domain ≥4 months → Journey, network refresh on content pages · 4 (~month 6–9): 25k pv, ≥50% Tier-1, long-form → Raptive or stay Mediavine (locales may pull Tier-1 share under 50%) · 5: 100k visits → sponsor card, push /embed + /kiosk, price review.

**Guardrails / kill switches:** ad scripts after LCP via requestIdleCallback, fixed slot sizes (CLS 0); CrUX INP >200 ms or CLS >0.1 on content pages → one unit until fixed · never refresh under AdSense; declare refresh with the network · "no ads on the awake screen" published on /about and /privacy · Pro <0.05% of uniques after 60 days → $19 lifetime, one ambient pack free, re-test; >0.4% → lifetime $39 · content RPM <$3 after 90 days → 1–2 units, prioritise Journey · sponsors: product-consistent categories only, disclosed, never jiggler/"stay online" vendors.

**Rails & admin (India, confirm with a CA):** Polar.sh (MoR; alt. Dodo for UPI); BMC + GitHub Sponsors; AdSense USD wire/EFT ≥$100; Amazon Associates India. Exports of services are zero-rated but need GST registration + LUT filed before invoicing; keep MoR/platform payout statements as remittance proof (INR credits often carry no FIRA); Section 44ADA presumptive taxation common; sole-proprietorship + GST registration unlocks Stripe India / Razorpay international later.

## Decisions

- **Decided:** Monetization (section 11).
- **Still needed:** Name (AwakeTab vs NeverDim) · open-source scope (engine+library MIT vs whole repo) · stack (Astro + Cloudflare vs Next.js + Vercel) · launch locales · analytics (Cloudflare Web Analytics vs Plausible).
