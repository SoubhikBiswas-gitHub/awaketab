# 17 · Launch checklists and runbooks

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** The lists to tick before each phase exit and each monetization gate, plus the timed launch-day runbook and the first-week watch. Nothing here is aspirational: every item is checkable, and Cursor prompt U3 (`16-cursor-prompts.md`) can verify most of them automatically.

Related docs: `15-implementation-plan.md` (phases, gates) · `13-testing-strategy.md` · `14-devops.md` · `09-monetization-impl.md` · `06-content-seo-spec.md`.

---

## 1. P0 — Claim (days 1–3)

- [ ] `awaketab.com`, `.app`, `.page`, `.dev` registered; auto-renew on; registrar 2FA; DNS on Cloudflare.
- [ ] Trademark screen done (USPTO TESS, EUIPO, IP India; class 9/42) — no conflicting live marks; notes saved in `docs/legal/trademark-screen.md` (PROPOSED path — accepted).
- [ ] GitHub org `awaketab` + repo; npm scope `@awaketab` reserved (publish a `0.0.1` placeholder of `@awaketab/wake` marked private/deprecated, or claim via npm org); handles on X/Bluesky/Product Hunt/Buy Me a Coffee.
- [ ] Holding page live at `https://awaketab.com`: correct `<title>`, description, canonical, OG image, `WebSite` + `Organization` JSON-LD, `robots.txt` (allow), no `noindex`.
- [ ] Bulk redirects `.app/.page/.dev` → `.com` (301) verified with `curl -I`.
- [ ] Search Console (domain property) and Bing Webmaster verified via DNS; IndexNow key file in place.
- [ ] Brand tokens committed (`tokens.css`), icon set exported (favicon, maskable 512, apple-touch-icon), wordmark SVG.

---

## 2. P1 — Trust core + parity + home (weeks 1–2)

**Engine correctness (the pill never lies)**
- [ ] All `T##` transition tests green in `@awaketab/wake`; coverage 100% of rows.
- [ ] E2E journeys 1–7 and 12 green on chromium; nightly green on firefox + webkit.
- [ ] Manual: hide the tab → pill "Paused — tab hidden" with no dialog; show → "Screen awake". Battery saver on Android → "Blocked — here's the fix" with the right advice.
- [ ] Autostart success ≥ 95% in the beacon over a 24-h preview soak (`held` ≤ 300 ms after `DOMContentLoaded`).
- [ ] Stats "Today" rolls over at local midnight (test in `Asia/Kolkata`).

**Performance and quality**
- [ ] Lighthouse mobile on `/`, `/30m`: ≥ 95 / 100 / 100 / 100; LCP lab ≤ 1.2 s; CLS 0; zero third-party requests (network assertion).
- [ ] `size-limit` green: critical chunk ≤ 15 KB gz, total ≤ 40 KB gz.
- [ ] axe: zero violations on every template in both themes; keyboard-only run of journeys 1–7 done; VoiceOver + NVDA smoke checklist done.
- [ ] Visual check of every ambient-ready layout at 320 px, 390 px, 768 px, 1280 px.

**PWA**
- [ ] Installable on Chrome desktop, Android Chrome, iOS Safari (Add to Home Screen icon correct); manifest shortcuts work; offline reload serves the tool; update toast appears and never interrupts an active session.

**Security and headers**
- [ ] `_headers` deployed: CSP (report-only on content routes for 2 weeks, enforced on tool routes), `Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self)`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, COOP, `X-Frame-Options: DENY` except `/embed/*`.
- [ ] `/api/*` `no-store`; rate limiting proven with a burst test; no IP stored (KV/AE inspection).
- [ ] Secrets set in production and preview; `.dev.vars.example` complete.

**Pages and legal**
- [ ] `/about` (real author, testing setup, contact), `/privacy` (matches `08-data-storage.md` §7; extension section; ads section ready but marked "not yet active"), `/terms`, `/changelog` (first entry), `/404` with the tool.
- [ ] Donate links live (Buy Me a Coffee; GitHub Sponsors on the library README).

**Search**
- [ ] Sitemap index submitted in Search Console and Bing; IndexNow ping on deploy verified.
- [ ] OG images render correctly in the X/LinkedIn/Slack debuggers; favicon shows in results preview tools.
- [ ] `/until/*` canonicalises to `/`; `/pip` `noindex`.

**Ops**
- [ ] Uptime check on `/` and `/api/health`; alert email received in a test.
- [ ] KV backup cron ran once; restore dry-run succeeded.
- [ ] Changelog entry "1.0 — launch" written.

---

## 3. P2 — Content + launch (weeks 3–5)

**Content QA (per page, automated by `pnpm test:seo` + manual read)**
- [ ] 18 `/for`, 12 `/on`, 8 `/guides` published in English; hub pages `/for`, `/on`, `/guides` live.
- [ ] Each page: one `<h1>` matching intent; title ≤ 60 with the formula; description 50–155; canonical; hreflang set reciprocal; `Article` + `BreadcrumbList` JSON-LD valid; OG image; `lastVerified`; honest-limit callout present; 3–5 FAQs; ≥ 3 related links; no orphan pages; tool embedded with the right preset/mode.
- [ ] Every browser/OS claim traceable to `src/data/support-matrix.json`.
- [ ] Top-10 pages translated and `reviewed: true` in at least 3 locales; unreviewed translations excluded from the sitemap.
- [ ] Sitemap index lists exactly the indexable set; Search Console shows > 50 indexed URLs before the public launch post.

**Launch assets**
- [ ] Show HN: title "Show HN: AwakeTab – a screen-awake tab that tells you the truth about the lock", first comment drafted (what it is, what it can't do, the library, the honesty angle), posted 14:00–16:00 UTC on a weekday.
- [ ] Product Hunt: tagline (≤ 60 chars), 5 gallery images (1270×760), maker comment, first-day plan; launch same day as Show HN.
- [ ] AlternativeTo listing created (alternative to nosleep.page, Caffeine, Amphetamine, PowerToys Awake).
- [ ] `/vs/nosleep-page` live and fair.

**Extension submission**
- [ ] Zip built from `main`; manifest version 1.0.0; icons 16/32/48/128; screenshots 1280×800 ×5; short description ≤ 132; permission justifications pasted; privacy policy URL `https://awaketab.com/privacy#extension`; single-purpose statement; data-usage form: "no user data collected" + optional anonymous statistics.
- [ ] Edge Add-ons submission in the same week.

**AdSense application (G1)**
- [ ] 60 pages indexed; `/privacy` ads section published; `ads.txt` placeholder ready; CMP configured for content routes (not tool routes); `PUBLIC_ADS_ENABLED=0` in production until approval.
- [ ] Apply; on approval flip `PUBLIC_ADS_ENABLED=1`, deploy, verify: no ad request on `/`, `/30m`, `/pip`, `/embed/*` (e2e journey 11), ads present only on content pages after LCP, CLS still 0.

---

## 4. P3 — Engagement + authority (weeks 6–9)

**Pro launch (G2)**
- [ ] Polar: products `pro_yearly`, `pro_lifetime` (+ `LAUNCH19` discount attached to the lifetime checkout link, ends Pro launch + 90 days), `biz_embed_site_yearly`, `biz_kiosk_site`, `biz_kiosk_5`; benefits `lk_*` with activation limits; webhook endpoint set with the production secret; tax settings confirmed (MoR).
- [ ] Production test purchase in each plan with a real card, refund within 14 days, revocation observed in KV and in the app (`revoked` toast) — screenshots in `docs/metrics/`.
- [ ] Activation on web and extension counts as separate devices; 6th device → `activation_limit`; `/pro/manage` deactivation works.
- [ ] Offline verification: kill network → Pro features remain until `exp`.
- [ ] `/pro` copy: prices in USD, "taxes at checkout" note, refund policy, what Free includes (everything that matters), no dark patterns.
- [ ] `ads.free` verified: Pro user sees no ads on content pages.
- [ ] Beacon events `pro_view`, `pro_checkout_click`, `pro_activated` flowing.

**Refund runbook**
1. Customer emails support@awaketab.com or uses the Polar portal within 14 days.
2. Polar issues `order.refunded` / `refund.created` → `POST /api/webhooks/polar` sets `lic:{keyHash}.status = refunded` (idempotent via `wh:{eventId}`).
3. Next `POST /api/license/validate` returns `{ revoked: true }`; the client removes `at.v1.license` and shows `license.error.revoked`.
4. Do not write IPs. Confirm KV has no `cf-connecting-ip` values. Screenshot Polar refund + KV status into `docs/metrics/`.

**Uptime**
- [ ] Point an uptime monitor at `GET /api/health`. Email on two consecutive failures (Cloudflare notifications or Better Stack).

**Library**
- [ ] `@awaketab/wake` 1.0.0 published with provenance; README badges; `/library` demo bound to the published IIFE; GitHub release notes; size ≤ 3.4 KB gz.
- [ ] `/learn/nosleep-js-vs-wake-lock` and `/learn/screen-wake-lock-api-guide` live and linked from the README.

**Research and embed**
- [ ] Device matrix completed (8 devices + Low Power Mode + battery saver + Modern Standby + lid); `/learn/how-we-tested` published with dates; `support-matrix.json` updated; `/learn/does-a-wake-lock-keep-teams-green` states the tested result plainly.
- [ ] Embed: `/embed/cook` live; loader snippet tested on WordPress, Squarespace, Webflow, plain HTML; `/embed` sales page; licence flow with domain binding tested; attribution link present for free embeds.
- [ ] `/vs` (7) and `/learn` (6) published; remaining locales for the top-10 pages reviewed.

---

## 5. Monetization gate checklists (G3–G5)

**G3 — Journey by Mediavine**
- [ ] Search Console + AE show ≥ 1,000 Tier-1 (US/CA/UK/AU) sessions in the last 30 days; domain ≥ 4 months old.
- [ ] Grow script requirement understood and added only to content routes (CSP host list updated by the headers template).
- [ ] Apply; on acceptance swap `AD_UNITS`/`AD_CLIENT`, keep placement rules; verify network-managed refresh occurs only on content pages, in-view, ≥ 30 s; CWV unchanged after 7 days.

**G4 — Raptive (or stay Mediavine)**
- [ ] ≥ 25k pageviews/month; Tier-1 share computed from AE `blob2`/geo; long-form majority confirmed. If Tier-1 < 50% because of locales, stay with Mediavine and note the decision in `docs/metrics/`.

**G5 — Sponsor card and Business push**
- [ ] ≥ 100k visits/month for 2 consecutive months.
- [ ] `/config/sponsor.json` schema tested; `SponsorCard` renders only in idle/held states and the extend prompt; "Sponsored" label present; `sponsor_view`/`sponsor_click` flowing.
- [ ] Rate card published on `/sponsor` (PROPOSED route — accepted); first sponsor invoiced through Polar `sponsor_month`.
- [ ] `/embed` and `/kiosk` pages linked from relevant `/for` pages; first Business licences sold and domain-bound.

---

## 6. Launch-day runbook (P2 public launch; solo, time-boxed IST)

| Time (IST) | Action | Check |
|---|---|---|
| 09:00 | Freeze `main`; final `pnpm test` + e2e on the production deployment; Lighthouse spot check | all green |
| 09:30 | Purge Cloudflare cache; confirm `/sitemap-index.xml`, `/robots.txt`, `/api/health` | 200s |
| 10:00 | Submit sitemap (re-submit) in Search Console + Bing; IndexNow ping for all URLs | accepted |
| 10:30 | Post `/changelog` "Public launch"; pin the Show HN draft; screenshots ready | — |
| 19:30 (14:00 UTC) | Post Show HN; post Product Hunt; reply to every comment for 3 hours; do not argue, do fix | thread healthy |
| 20:00 | Watch: uptime, 5xx, autostart success, `lock_denied` share, CWV in real time (AE + Cloudflare) | within thresholds |
| 23:00 | Hotfix window if needed (Pages rollback ready); write the day's notes in `docs/metrics/launch-day.md` | — |
| Next morning | Reply backlog; log feature requests as tickets; check Search Console coverage | — |

**Rollback criteria:** autostart success < 80% for 30 min, any dialog/alert appearing, 5xx > 2%, CLS > 0.1 on `/` → roll back to the previous deployment and post a one-line changelog note.

---

## 7. Post-launch 7-day watch

- Daily: uptime, 5xx, autostart success, denied share by OS, CWV p75, Search Console indexing count, referring domains (Ahrefs free/Search Console links), Show HN/PH comments, GitHub issues.
- Day 3: first content fixes from comments; update `support-matrix.json` if any new browser behaviour surfaced.
- Day 7: write `docs/metrics/2026-MM.md` (PROPOSED cadence file — accepted): traffic, top queries, engine reliability, install rate, donations; decide the next 6 content pages from Search Console impressions without a page.
