# 01 · Business Requirements Document (BRD)

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** This document states *why* AwakeTab exists, what the business must get out of it, and the boundaries (scope, budget, constraints, gates) inside which every later document operates. It is the contract between the strategy in `awaketab-blueprint.md` and the specifications that follow. Identifiers, state names, keys, routes, plan IDs and budgets are used exactly as defined in `00-conventions.md`; where this document and that one disagree, `00-conventions.md` wins.

**Related docs:** `00-conventions.md` (canonical identifiers) · `awaketab-blueprint.md` (research, teardown, monetization decision) · `02-prd.md` (product requirements) · `06-content-seo-spec.md` · `09-monetization-impl.md` · `13-testing-strategy.md` · `14-devops.md` · `15-implementation-plan.md`.

---

## 1 Executive summary

AwakeTab is a free, account-less web tool that keeps a device's screen awake through the native Screen Wake Lock API, with a status indicator that never claims more than the browser has actually granted. Around the tool sit roughly 60 English content pages (scenarios, devices, alternatives, OS guides, research) in 8 languages, a Chromium extension for hidden-tab use, an embeddable Cook Mode widget, and an open-source TypeScript wake-lock library.

The incumbent, nosleep.page, and about nine clones ship the same five features and share the same defects: the interface reports "awake" without checking whether the lock succeeded, they depend on a library abandoned in December 2020, they are silent at timer end and on failure, and several run Google ads on a screen nobody is looking at. Trust, scenario coverage, content depth and authority assets are the open lane.

The business bet has three parts: (1) win the "keep screen awake" query cluster in English within 180 days and in three further locales within 90 days; (2) make **AwakeTab Pro** (`pro_yearly` $12/yr, `pro_lifetime` $29 one-time, sold through Polar.sh as merchant of record) the primary revenue line, with display ads confined to content pages and never on the awake screen; (3) keep year-1 cash outlay near $500–1,700 by running on Cloudflare's free tiers and the founder's own time. Base-case revenue estimate: ≈ $1,060/month net at month 6 and ≈ $3,860/month at month 12 (blueprint §11, estimates).

---

## 2 Business context and problem

### 2.1 Market

- **Demand exists and is under-served.** nosleep.page attracts roughly 90k visits/month (SimilarWeb; low-reliability estimate for a site this size). Google's own Keep Awake extension reports about 1M users on the Chrome Web Store, evidence that the "hidden tab / background" need is real and unaddressed by web tools. The top use case in the Show HN thread (Apr 2022, 252 points, 130 comments) is a locked corporate 5-minute sleep policy; the top feature request is "keep awake until 6:18 pm", which no web tool ships.
- **Ten sites torn down, one pattern.** Every competitor offers a toggle, 15m–2h presets, a "keep the tab visible" disclaimer, a dark theme and a short FAQ. The SEO leaders (screenalwayson.com 91 URLs, keep-screen-on.com 135 URLs) win on page count with 220–360 words per page and boilerplate leaks ("John Doe" on the changelog). One clone fabricates a "stealth F15 key" and testimonials.
- **Incumbent flaws (verified in shipped source).** nosleep.page sets the session active before the `enable()` promise resolves, so the UI can say "awake" while the lock failed; it loads NoSleep.js 0.12.0 (last release 16 Dec 2020, ~49 open issues) render-blocking from a CDN; it fires a blocking `alert()` exactly when the tab is hidden; stats roll over at UTC midnight (05:30 IST); the timer caps at 23:59; there is no session persistence, manifest or service worker; it is silent at timer end and when unsupported; it has one URL, one language, no `<h1>`, no `og:image`, and no deploy since 3 Oct 2025.
- **Why now.** Google removed FAQ rich results on 7 May 2026 (HowTo in Sept 2023), so competitors' schema stacks are dead weight and `WebApplication` with a genuine `aggregateRating` is what remains. Safari 16.4+ and iOS Home-Screen apps 18.4+ now support the Wake Lock API, so a native-first tool finally covers iPhone. The maintained-library gap (NoSleep.js) has been open for almost six years.

### 2.2 Problem statement

People who need a screen to stay on (locked-down work laptops, kitchens, presentations, dashboards, long downloads and AI-agent runs) are served by tools that cannot be trusted to report their own state, cannot end a session at a clock time, lose everything on reload, say nothing when they fail, and make claims ("works in background", "keeps Teams green") the browser cannot honour. Nobody publishes tested answers to the questions users actually ask.

---

## 3 Vision and positioning

**Vision.** AwakeTab is the reference implementation of "keep my screen awake" on the web: the tool people link to, the library developers import, and the page search engines rank first, because it is the only one that tells the truth about what the browser is doing.

**Positioning statement.** For anyone who needs a screen to stay on without changing system settings, AwakeTab is the browser tool that keeps your screen awake and shows you, honestly, whether it is working. Unlike nosleep.page and its clones, it ends sessions at a clock time, survives reloads, alerts you when time is up, works installed and offline in 8 languages, and never runs ads on the awake screen.

**Tagline.** "The tab that keeps your screen awake."

**Non-goals (business level).** Synthetic input or "stealth" tricks; Google ads on the awake screen, ever; user accounts; a native desktop or mobile app in year 1; Firefox extension in v1 (no `power` API).

---

## 4 Business objectives

All dates are relative to kickoff (see §11). Revenue figures are model estimates from `awaketab-blueprint.md` §11, not commitments.

| # | Objective | Metric | Target | By when |
|---|---|---|---|---|
| O1 | Be indexed and technically flawless | English URLs indexed (GSC) · Core Web Vitals · Lighthouse a11y | 60 URLs · CWV green (LCP p75 ≤ 2.0 s, INP ≤ 100 ms, CLS 0) · 100 | Day 30 |
| O2 | Ship the reach channels | Extension status · library published | Extension in review by Day 30, approved by Day 45 · `@awaketab/wake` on npm by week 9 | Day 30 / week 9 |
| O3 | Rank in three locales | Position for head terms ("keep screen awake", "keep screen on", local equivalents) | Top 10 in `en` plus 2 of `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` | Day 90 |
| O4 | Earn authority | Referring domains (Ahrefs/GSC) | ≥ 20 | Day 90 |
| O5 | Retain users | Return-visit rate (first-party `page_view` with prior `at.v1.meta.installedAt`) | ≥ 25 % | Day 90 |
| O6 | Own the head term | Position for "keep screen awake" (EN) · long-tail #1s | Top 3, trending to #1 · #1 on ≥ 15 long-tail queries | Day 180 |
| O7 | Library adoption | GitHub stars on `awaketab/awaketab` | ≥ 200 | Day 180 |
| O8 | Brand demand | Branded queries in GSC | Visible (≥ 100 impressions/month for "awaketab") | Day 180 |
| O9 | Revenue, base case (estimate) | Net USD/month | ≈ $1,060 at month 6 · ≈ $3,860 at month 12 | Month 6 / 12 |
| O10 | Pro conversion (estimate) | Pro purchases ÷ monthly uniques | 0.06–0.35 %; review pricing if < 0.05 % after 60 days | Month 5 onward |
| O11 | Stay within budget | Year-1 cash outlay (fixed) | ≤ $1,700 | Month 12 |

---

## 5 Stakeholders and roles

| Role | Who | Responsibilities | Decision rights |
|---|---|---|---|
| Founder / product / engineering / content / support | Soubhik | Everything not listed below; implements with Cursor; owns `00-conventions.md` | All product, technical and pricing decisions |
| Native-speaker reviewers (contractors) | 7 reviewers covering `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` | Review machine-drafted UI strings and content; localize keywords, not sentences; flag cultural mismatches | Approve/reject a locale for publication |
| Chartered Accountant (India) | TBD | Confirm legal form, GST registration and LUT before first invoice, Section 44ADA applicability, treatment of MoR payouts, AdSense USD receipts | Sign-off on tax filings |
| Designer (optional, contractor) | TBD | Icon (the ring), OG image templates, ambient theme packs | Visual polish only; tokens in `00-conventions.md` §1 are fixed |
| Platform partners | Polar.sh, Cloudflare, Google (Search Console, AdSense, Chrome Web Store), Microsoft (Edge Add-ons), later Journey by Mediavine / Raptive | Payments/MoR, hosting, indexing, ads, distribution | Their policies constrain BR-08, BR-11, BR-16 |
| Users (personas in `02-prd.md` §2) | Locked-down office worker, home cook, presenter, dashboard operator, developer | Source of ratings (`aggregateRating`), feedback via `/about` contact | None formal; feedback drives P4 |

---

## 6 Scope

### 6.1 In scope — v1 (phases P0–P3, weeks 0–9)

- The tool at `/` with native Wake Lock, own video fallback, the seven-state status pill, presets `p15`…`pinf`, `custom`, `until`, session persistence, resume, end-of-session prompt.
- Deep links (`/15m`…`/8h`, `/until/HH-MM`), keyboard shortcuts, themes `auto`/`light`/`dark`/`oled`, fullscreen, installable PWA with offline and manifest shortcuts.
- Ambient modes `standard`, `clock`, `focus`, `minimal`, `night`, `message`, `cook`; end alerts (chime, notification, title flash); battery-aware auto-stop (Chromium); stats with local-midnight keys, streaks, heatmap, CSV; Document PiP pill; burn-in guard; second-tab detector; rating prompt.
- ~60 English content URLs (`/for/` 18, `/on/` 12, `/vs/` 7, `/guides/` 8, `/learn/` 6, plus trust pages) and 8 launch locales.
- **AwakeTab for Chrome** (Chromium, Manifest V3, `chrome.power`), also on Edge Add-ons.
- **AwakeTab Embed** Cook Mode widget with attribution; `biz_embed_site_yearly` and `biz_kiosk_site`/`biz_kiosk_5` licences.
- `@awaketab/wake` and `@awaketab/core` published under MIT.
- **AwakeTab Pro** via Polar.sh from gate G2; donations from G0; AdSense on content pages from G1.
- First-party, cookie-less analytics (`POST /api/e`).

### 6.2 In scope — later (phase P4, gated)

- Journey by Mediavine (G3), Raptive/Mediavine (G4), sponsor card on the awake screen (G5).
- Phase-2 locales `id`, `tr`, `ko`, `it`, `ru`, `vi`, `ar`.
- Pro `schedules`, `ext.schedules`, `sounds.custom`; Kiosk branding; Dodo Payments (UPI) as a second rail.
- GSC-driven new pages; support-matrix refresh per browser release; monthly changelog.

### 6.3 Out of scope

- Synthetic mouse/keyboard events, "stealth key" tricks, or any claim of keeping Teams/Slack presence green.
- Google ads on `/`, preset pages, `/pip`, `/embed/*` or inside the extension; auto-refreshing ads under AdSense.
- User accounts, server-side user data, third-party analytics or tag managers.
- Firefox extension (no `power` API), native apps, paid acquisition.
- Anything that stops lid-close sleep or overrides OS power policy.

---

## 7 Business requirements

Priority: `P0` launch blocker · `P1` launch · `P2` phase P3 · `P3` later.

| ID | Requirement | Rationale | Priority | Success measure |
|---|---|---|---|---|
| BR-01 | The product must never report a screen as awake unless a `WakeLockSentinel` is held (`held`) or the video fallback is confirmed playing (`fallback`), and must publish its limits (tab hidden, lid close, Low Power Mode, Teams presence) on the tool page and `/about`. | Trust is the open lane; nosleep.page's core defect is a lying indicator. | P0 | Zero e2e cases where pill copy is "Screen awake" without a live sentinel; limits text present on `/`, `/about`, `/learn/does-a-wake-lock-keep-teams-green`. |
| BR-02 | Each of the 18 scenarios in `00-conventions.md` §7 (`/for/{slug}`) must have a behaviour (preset + mode), a landing page and a stated limit. | Scenario coverage is where competitors are thin and where long-tail intent lives. | P1 | 18 `/for/` pages live with the tool embedded and a "What it can't do" section. |
| BR-03 | v1 must include every feature nosleep.page is kept for (auto-start, no account/ads/tracking on the tool, tiny and fast, usage stats, the ring) and fix every defect listed in §2.1. | Parity is the floor; fixing the defects is the differentiation story for `/vs/nosleep-page`. | P0 | Defect checklist in `13-testing-strategy.md` all green; `/vs/nosleep-page` claims each verifiable. |
| BR-04 | The site must reach the SEO targets in §4 (O1, O3, O6): 60 EN URLs indexed by Day 30, top 10 in 3 locales by Day 90, top 3 for "keep screen awake" by Day 180. | Organic search is the only acquisition channel; no paid budget. | P1 | GSC and rank tracking (25 queries × 8 locales) reports at Day 30/90/180. |
| BR-05 | Content pages must carry 600–1,000 words of substance each (home 1,200–1,800), a "last verified" line, an author page with a real name, and original research (`/learn/`, `/how-we-tested`) rather than templated copy. | AdSense rejects "low value content" tool sites; page depth is the competitors' weakest point; freshness signals rank. | P1 | Word counts enforced in build; `/how-we-tested` covers ≥ 14 browser/OS combos; changelog updated monthly. |
| BR-06 | The product must earn repeat use: session restore, presets remembered, PWA install, and a rating prompt after the 5th completed session whose results are the only source of `aggregateRating`. | Return rate is an objective (O5) and honest ratings are the only schema that still shows. | P1 | Return-visit rate ≥ 25 % by Day 90; `aggregateRating` count equals stored in-app ratings. |
| BR-07 | AwakeTab Pro must be the primary revenue line: `pro_yearly` $12/yr and `pro_lifetime` $29 ($19 for the first 90 days after Pro launch), 5 activations, sold via Polar.sh, licence key stored locally, no accounts; on sale only after gate G2 (Tier 2 shipped). Free must always include everything in `00-conventions.md` §8.2 "Free always includes". | Premium earned 3× tips in the head-to-head found; long-dwell tools price $12–24/yr; gating the lock itself would destroy trust. | P2 | Pro live by week 9; Pro share of month-12 revenue ≈ 62 % in the base case; free feature list unchanged. |
| BR-08 | Display ads must appear only on content pages (`/for`, `/on`, `/vs`, `/guides`, `/learn`), only after gate G1, and must obey the ad rules in `00-conventions.md` §8.3: never on the awake screen, `/pip`, `/embed/*` or the extension; no refresh under AdSense; ≤ 3 in view; ads-to-content ≤ 20 %; scripts after LCP; fixed slot sizes; `ads.free` removes them for Pro. | Google's "Out of context ads" policy bans ads where attention is elsewhere; enforcement would cost the AdSense account permanently; CLS 0 protects rankings. | P2 | Ad loader absent from tool-page bundles (build assertion); CrUX CLS 0 and INP ≤ 100 ms on content pages after ads go live. |
| BR-09 | The awake screen may carry exactly one disclosed, fixed-fee sponsor card, one sponsor at a time, only after gate G5 (100k visits/month), from product-consistent categories, never from mouse-jiggler or "stay online" vendors, and never loaded via third-party script. | The only monetization that surface can carry without breaking BR-01 or BR-08. | P3 | Sponsor card served as first-party static asset; `sponsor_view`/`sponsor_click` tracked; "no ads on the awake screen" text on `/about` and `/privacy` remains true. |
| BR-10 | `@awaketab/wake` (and `@awaketab/core`) must be published under MIT with types, zero dependencies, semantic versioning and a public support matrix, and be the engine used by the site, PiP, embed and extension. | Authority and links: NoSleep.js has not shipped since Dec 2020; a maintained library is un-clonable by page-farm competitors. | P2 | Published by week 9; ≥ 200 stars by Day 180; single engine package consumed by all four surfaces. |
| BR-11 | **AwakeTab for Chrome** must keep the display awake while the tab is hidden or the browser is minimised using `chrome.power`, state that limit precisely, carry no ads or tracking, and be submitted by Day 30. | The hidden-tab need is the single biggest gap web tools cannot fill; 1M users of Google's Keep Awake prove demand. | P1 | Listed on Chrome Web Store and Edge Add-ons; `/extension` page describes exactly when it works. |
| BR-12 | **AwakeTab Embed** (Cook Mode) must be free with attribution, licensable per domain (`biz_embed_site_yearly`, $29/yr) to remove attribution and add brand colours, and must show a fix instead of a fake state when the host omits `allow="screen-wake-lock"`. Kiosk licences (`biz_kiosk_site` $19, `biz_kiosk_5` $49) cover dashboards. | Recipe plugins gate Cook Mode behind $49–149/yr; no standalone widget exists; every embed is an attributed backlink. | P2 | Widget live by week 9 with `/embed` docs; first licensed domain by month 6 (base case ≈ $250/month business revenue at month 12, estimate). |
| BR-13 | The product must run with no accounts, no cookies on tool pages, no PII, no third-party scripts on tool pages, all user state in `localStorage` under `at.v1.*`, and first-party analytics with a user-facing telemetry toggle. | Privacy is part of the trust claim and removes consent friction on the tool; competitors' tracking is a differentiator in `/vs/`. | P0 | Zero third-party requests on tool pages (Lighthouse/CI assertion); `/privacy` describes every key and event; telemetry toggle in settings. |
| BR-14 | Launch in 8 locales (`en`, `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi`) with native-speaker review of UI strings and top pages, localized keywords, reciprocal hreflang and `x-default`. | Head terms in non-English locales are less contested; competitor with 9 languages has no JSON-LD or review. | P1 | Home in 8 locales at P1 exit; each locale signed off by its reviewer before indexing. |
| BR-15 | Brand and domain protection: register `awaketab.com`, `.app`, `.page`, `.dev` with 301s to `.com`; claim GitHub org `awaketab`, npm scope `@awaketab` and social handles on day 1; run a trademark screen (USPTO, EUIPO, IP India; classes 9/42) before public launch. | Cloning is a named risk; the brand, library and extension are what page farms cannot copy. | P0 | All four domains resolve to the holding page by day 3; screen report filed in repo. |
| BR-16 | Legal and tax: sell through a merchant of record (Polar.sh; Dodo Payments as alternative) so AwakeTab never handles card data or foreign VAT; obtain GST registration and file a LUT before the first invoice; publish `/privacy` and `/terms`; keep MoR payout statements as export remittance proof. All to be confirmed with the CA. | Indian individuals cannot use Stripe for international payments; zero-rated exports still require GST + LUT. | P1 | CA confirmation on file before G2; `/privacy` and `/terms` live at launch. |
| BR-17 | Year-1 fixed cash outlay must not exceed $1,700 (target $500–1,000) with no paid acquisition; variable costs limited to MoR fees (5 % + $0.50 per transaction). | Solo, self-funded; the model has to work on free tiers. | P1 | Budget tracker in §9 reconciled monthly. |
| BR-18 | Performance and accessibility are launch gates: tool pages ≤ 40 KB JS (gz), 0 third-party requests, LCP ≤ 1.2 s lab, Lighthouse Performance ≥ 95 and Accessibility/Best Practices/SEO 100, WCAG 2.2 AA. | Speed and a11y are ranking and trust signals; the incumbent's a11y is colour-and-emoji only. | P0 | Lighthouse CI thresholds block merge; axe-core zero violations; manual screen-reader pass recorded in `13-testing-strategy.md`. |

---

## 8 Constraints and assumptions

### 8.1 Constraints

- **Browser API limits (must be published, not worked around).** The Screen Wake Lock releases when the tab is hidden, the window is minimised or the device is locked; it keeps the *display* on, while whether idle *system* sleep is also held varies by OS (only what the test matrix confirms may be published); it cannot stop lid-close sleep; it cannot keep Teams or Slack presence "available" (presence follows input idle); iOS Low Power Mode forces a 30-second Auto-Lock and battery savers can raise `NotAllowedError`; Firefox < 126 and Safari < 16.4 need the fallback; the Battery API is Chromium-only; notifications on iOS work only in installed web apps.
- **Payment rails for an Indian individual.** Stripe India excludes individuals from international payments; the MoR route (Polar.sh, Dodo Payments) is mandatory. AdSense pays India in USD by wire/EFT at a $100 threshold.
- **Ad-network eligibility.** AdSense approval depends on the content pages; Journey by Mediavine needs 1,000 Tier-1 sessions/30 days and a domain ≈ 4 months old; Raptive needs 25k pageviews/month with ≥ 50 % Tier-1 traffic. Locales may pull Tier-1 share below 50 %.
- **Extension platform.** Manifest V3; Firefox has no `power` API; Chrome Web Store review times are outside our control.
- **Stack decisions** are fixed in `00-conventions.md` §3 (Astro 5, Cloudflare Pages, Polar.sh, WXT).

### 8.2 Assumptions (to be confirmed by Soubhik or the CA)

- Founder capacity is part-time, **≈ 20–25 hours/week**; the P1–P3 windows in §11 assume this and slip proportionally otherwise.
- Product name is AwakeTab (fallback NeverDim); all four domains still unregistered at the time of registration (RDAP check 6 Sep 2026).
- Engine and library are MIT; site content is proprietary.
- Test devices (Windows 11, macOS, Android, iPhone/iPad, Chromebook) are available to the founder at no cost; where not, BrowserStack or a used device is a budget line.
- Cloudflare free tiers cover Pages, KV and Workers Analytics Engine at launch volumes; the $20/month Workers paid plan is needed only past ~100k visits/month.
- Legal form is a sole proprietorship; Section 44ADA presumptive taxation applies.

---

## 9 Budget and revenue scenarios

### 9.1 Year-1 cash budget (fixed costs, USD)

| Item | Low | High | Notes |
|---|---|---|---|
| Domains `.com` `.app` `.page` `.dev` | 50 | 60 | Per year; `.com` canonical, three 301 redirects |
| Cloudflare Pages / KV / Analytics Engine | 0 | 240 | Free tier → $20/month Workers paid if limits are hit |
| Chrome Web Store developer registration | 5 | 5 | One-time; Edge Add-ons is free |
| Native-speaker translation review (7 locales) | 300 | 800 | UI strings + home + top 10 pages per locale |
| CA: GST registration, LUT, annual filing | 100 | 250 | ₹8k–20k estimate; confirm quote |
| Trademark: self-service screen; optional IP India filing (class 9 and 42) | 0 | 130 | ≈ ₹4,500 per class if filed |
| Design (optional): icon polish, OG templates, theme packs | 0 | 300 | Founder does it otherwise |
| Test devices / BrowserStack | 0 | 150 | Assumes owned devices |
| Misc: email on domain, screenshots, stock assets | 25 | 50 | |
| **Total fixed** | **≈ 480** | **≈ 1,985** | Target ≤ $1,700 (BR-17); cut design and devices first if over |

**Variable costs.** Polar.sh 5 % + $0.50 per transaction (≈ 9 % effective on a $12 sale, ≈ 7 % on $29); Stripe Connect payout fees to India included in Polar's cut; AdSense and networks take their share before payout (no cash cost). No paid acquisition.

### 9.2 Revenue scenarios (net USD/month; estimates from `awaketab-blueprint.md` §11)

Assumptions: 1.3 pageviews/visit, 35 % content pageviews, 1.6 visits/unique; Pro converts 0.06–0.35 % of monthly uniques at $16 net; donations 0.02–0.04 % of visits at $4.50.

| Scenario | Month 6 visits | Month 6 net | Month 12 visits | Month 12 net | Month-12 composition |
|---|---|---|---|---|---|
| Low | 25k | ≈ $260 | 60k | ≈ $770 | Ads 136 · Pro 480 · rest donations/affiliate |
| Base | 50k | ≈ $1,060 | 120k | ≈ $3,860 | Ads 546 · Pro 2,400 · sponsor 400 · business 250 · rest |
| High | 100k | ≈ $3,850 | 250k | ≈ $12,960 | Ads 1,706 · Pro 8,750 · sponsor 1,000 · rest |

For comparison, Google ads on the awake screen would add only ≈ $150/month in the base case at month 12, against a named policy violation and the trust claim. Rejected (BR-08).

---

## 10 Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Google ranking volatility or a core update demotes thin-tool sites | Medium | High | Substance per page (BR-05), original research, library/extension traffic that does not depend on search; track 25 queries × 8 locales weekly | Soubhik |
| R2 | Competitors clone features and copy within weeks | High | Medium | Compete on assets that do not copy: library, research, extension, brand, ratings; ship Tier 2 before publicising the roadmap | Soubhik |
| R3 | Browser policy change (e.g., wake lock gated behind user activation or battery heuristics) | Low–Medium | High | Engine abstracted in `@awaketab/wake`; status pill already models `denied`; support-matrix page refreshed per browser release | Soubhik |
| R4 | AdSense rejects the site or later flags a policy issue | Medium | Medium | Apply only after 60 indexed pages; never place ads on tool pages; keep one-unit kill switch; Pro is primary revenue anyway | Soubhik |
| R5 | Pro conversion below 0.05 % of uniques after 60 days | Medium | Medium | Pre-agreed levers: `pro_lifetime` at $19, one ambient pack free, re-test at 60 days; above 0.4 % raise lifetime to $39 | Soubhik |
| R6 | Translation quality damages trust in a locale | Medium | Medium | Native reviewer sign-off before indexing; glossary of technical terms; localize keywords not sentences | Reviewers |
| R7 | Tier 2 scope creep delays launch | High | Medium | Tier 0 + 1 ship at P1 exit with fixed feature list; Tier 2 cannot start before content P2 is 80 % drafted | Soubhik |
| R8 | Founder capacity below 20 h/week for several weeks | Medium | High | Phases are relative; gates are conditions not dates; P4 absorbs slack; nothing in v1 needs synchronous support | Soubhik |
| R9 | Domain or trademark conflict surfaces after launch | Low | High | Register all four TLDs on day 1; screen before public launch; NeverDim reserved as fallback brand | Soubhik |
| R10 | Polar.sh changes India payout terms or fees | Low | Medium | Dodo Payments (4 % + $0.40, UPI) evaluated as second rail; licence tokens are ours (ES256 JWT), so a rail switch does not strand customers | Soubhik |
| R11 | Chrome Web Store review rejects or delays the extension | Medium | Low | Minimal permissions (`power` only), clear single purpose, no remote code; submit by week 3 to absorb review time | Soubhik |
| R12 | Tax non-compliance (GST/LUT missing before first invoice) | Low | High | CA engaged before G2; no Pro sale until GST + LUT confirmed | CA / Soubhik |

---

## 11 Timeline and milestones

Windows are relative to kickoff; gates are conditions and may fall earlier or later than the indicative week.

| Phase | Window | Scope | Exit criterion | Gate reached |
|---|---|---|---|---|
| P0 Claim | Days 1–3 | Domains, trademark screen, handles, brand tokens, repo, Cloudflare Pages, Search Console | Domains resolve to a holding page with correct meta/OG/schema | — |
| P1 Trust core + parity + home | Weeks 1–2 | Tier 0 + Tier 1, full home page, 8 locales (home only), cross-browser test matrix | CWV green, a11y 100, pill never lies | **G0** — donate links live; no ads, no Pro |
| P2 Content + launch | Weeks 3–5 | `/for`, `/on`, `/guides`, hreflang for top 10 pages, extension MVP, Show HN + Product Hunt, AlternativeTo, `/vs/nosleep-page` | 60 EN URLs indexed; extension approved; 10 referring domains | **G1** — AdSense on content pages; affiliate cards |
| P3 Engagement + authority | Weeks 6–9 | Tier 2, library, `/vs`, `/learn`, embed, remaining locale content | Library published; research live; return rate measured; Pro on sale | **G2** — Pro via Polar; `ads.free` |
| P4 Compound | Ongoing | GSC-driven pages, support-matrix refresh, more locales, monthly changelog | — | **G3** (≈ month 4–5) Journey by Mediavine · **G4** (≈ month 6–9) Raptive/Mediavine · **G5** (100k visits/month) sponsor card, push Embed/Kiosk |

Checkpoints against §4: Day 30 (O1, O2), Day 90 (O3, O4, O5), Day 180 (O6, O7, O8), months 6 and 12 (O9, O10, O11).

---

## 12 Approval and change control

- **Approval.** This BRD is approved when Soubhik marks the status line "Approved" and the open assumptions in §8.2 are either confirmed or converted to risks in §10. Until then the document is a working draft that `02-prd.md` may build on.
- **Changing a business requirement.** (1) If the change touches a name, identifier, state, key, route, plan, price, gate or budget, edit `00-conventions.md` first and grep every doc for the old value. (2) Update the BR row here, bump the version (minor for wording, major for scope), and add a line to the change log below. (3) Propagate to `02-prd.md` and the affected spec; `15-implementation-plan.md` re-estimates.
- **Who can change what.** Soubhik decides all changes. Reviewers may propose locale-specific wording; the CA may impose legal/tax requirements (recorded as BR amendments, not silent edits). Platform policy changes are recorded as constraints in §8.1 with the date observed.
- **Cadence.** Review BRs at each gate (G0–G5) and at Day 30/90/180 checkpoints; revenue scenarios are re-baselined at month 6 with actuals.

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-07 | Initial BRD derived from `awaketab-blueprint.md` and `00-conventions.md` |

---

## Appendix — Glossary pointers

Definitions live in `00-conventions.md`; this list only says where to look.

| Term | Where defined |
|---|---|
| Lock states `idle` `requesting` `held` `lost` `denied` `unsupported` `fallback` | `00-conventions.md` §5.1; transitions in `04-engine-spec.md` |
| Session status, plan types, end reasons, preset IDs, ambient modes, themes | `00-conventions.md` §5.2 |
| Storage keys `at.v1.*` | `00-conventions.md` §6; schema in `08-data-storage.md` |
| Routes and content slugs | `00-conventions.md` §7; page specs in `06-content-seo-spec.md` |
| Plan IDs, prices, feature gates, monetization gates G0–G5, ad rules | `00-conventions.md` §8; implementation in `09-monetization-impl.md` |
| API endpoints and licence token | `00-conventions.md` §9; `03-architecture.md` |
| Analytics events | `00-conventions.md` §10 |
| Performance budgets and browser support | `00-conventions.md` §11 |
| Phases P0–P4 | `00-conventions.md` §12; `15-implementation-plan.md` |
| Tier 0–3 feature tiers, competitor teardown, revenue model | `awaketab-blueprint.md` §01, §05, §11 |
