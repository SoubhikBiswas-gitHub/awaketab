# Launch audit — M9

Status: v1.0 · 2026-09-26 · Owner: Soubhik · Audited build: `m6-engagement` @ `549bffb` (`apps/web/dist` from that commit)

**Purpose.** Every item of `17-launch-checklist.md` §2 (P1) and §3 (P2) and every clause of the production-readiness definition in `19-master-build-prompt.md` §E, with a status and the evidence behind it. Automatable checks were run locally on 2026-09-26. Items that need an account, a deployed URL, a real device or a person are listed with exact steps under [Needs Soubhik](#needs-soubhik).

**Statuses.** **PASS**: verified in this run, with the command or test as evidence. **FAIL**: repo work (code, config or copy) that is missing or wrong; each one is written up under [Fails](#fails). None was fixed in this pass, which changed docs only. **MANUAL**: a person has to check it, but no account is needed. **EXTERNAL**: needs Soubhik's accounts, a deployed URL, real devices or reviewers.

**Machine.** Apple M4 Pro, macOS 26.6, Node 22.22.2, pnpm 9.15.9. The Playwright and Lighthouse runs used a static preview of the current `dist/` on `http://127.0.0.1:4500`. That preview serves the built files with gzip but has no Pages Functions (`/api/*` returns 404) and does not apply `_headers`.

---

## 1. Automated checks run for this audit

| Check | Command | Result |
|---|---|---|
| Lint | `pnpm lint` (ESLint + stylelint) | exit 0, no findings |
| Types | `pnpm typecheck` | exit 0. `astro check`: 157 files, 0 errors / 0 warnings / 0 hints. `wake`, `core` and `extension` `tsc --noEmit` clean |
| Unit + DOM | `pnpm test` (runs `test:unit` then `test:functions`) | unit: 59 files, **501 / 501** pass. functions: 10 files, **152 pass, 1 todo** (the todo is decision D-06) |
| Functions | `pnpm test:functions` | 10 files, **152 pass, 1 todo**, 0 fail |
| SEO + security over `dist/` | `pnpm test:seo` | 3 files, **59 / 59** pass (`holding-page.test.ts`, `i18n-content.test.ts`, `security.test.ts`) |
| Size budgets | `pnpm size` | all green; see §1.1 |
| Web e2e, 3 engines | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4500 pnpm exec playwright test` | **607 passed, 116 skipped, 0 failed** (1.6 min). chromium 205 pass / 36 skip, firefox 201 / 40, webkit 201 / 40. Skips: 36 visual shots per engine (`visual.spec.ts` needs `VISUAL=1`), 2 Chromium-only PWA installability checks, the SW offline journey on firefox/webkit, and journey 10's `iframe_no_allow` case on firefox/webkit |
| Extension e2e | `pnpm test:e2e:ext` | **11 / 11** pass (manifest permissions, popup, badge, System level, SW restart, licence, axe light + dark) |
| Extension zip | `pnpm -F extension zip:check` | `{"same":true,"first":"f5dba18a…ef0b","second":"f5dba18a…ef0b","bytes":70340}`: reproducible |
| Lighthouse | `LHCI_BASE_URL=http://127.0.0.1:4500 LHCI_RUNS=3 LHCI_UPLOAD_TARGET=filesystem pnpm lighthouse` | see §1.2. Exit 1 **only** because Best Practices is 96. That is expected on this origin (explained in §1.2) |
| Secrets in `dist/` | `grep -rl` for each secret name and key marker | 0 files for each of `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, `TURNSTILE_SECRET_KEY`, `ALERT_WEBHOOK_URL`, `NPM_TOKEN`, `BEGIN PRIVATE KEY`, `"d":"` (617 files scanned). `security.test.ts` checks the same names plus every value in `.dev.vars.example` |
| `_headers` per route class | Cloudflare merge simulated over `dist/_headers` (every matching rule applied in order, `! Name` detaches, repeats join with `, `) | 19 paths, no joined `Cache-Control` or CSP; see §1.3 |

### 1.1 Budgets (`pnpm size`, 2026-09-26)

| Budget (docs/00 §11) | Measured | Limit | Headroom |
|---|---|---|---|
| Tool critical JS (entry + static closure) | **14,784 B gz** | 15,360 | 576 B |
| Tool total JS (static + dynamic closure) | **40,199 B gz** | 40,960 | **761 B** |
| Tool CSS | **13,323 B gz** | 20,480 | 7,157 B |
| Embed iframe app `/embed/cook` | **14,062 B gz** | 25,600 | 11,538 B |
| Loader `/embed.js` | **2,356 B gz** | 3,072 | 716 B |
| `@awaketab/wake` core / IIFE | 3.21 kB / 3.45 kB gz | 3.4 / 3.6 kB | |
| `@awaketab/wake` react / preact / vue | 271 / 277 / 237 B gz | 400 B each | |
| `@awaketab/core` | 6.22 kB br | 7 kB | |
| Hydrated islands / React chunks | `hydrated: []`, `reactChunks: []` | 0 | |
| Embed app fingerprinted | `embedHashed: true` (`/embed/assets/app.295d026faf.js`) | required | |

### 1.2 Lighthouse (mobile, simulated throttling, median of 3)

| URL | Perf | A11y | BP | SEO | FCP | LCP (≤ 1.2 s) | TBT | CLS | 3rd-party req. |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 96 ‡ | 100 | 0.81 s | **1.05 s** | 0 ms | 0 | 0 |
| `/30m` | 100 | 100 | 96 ‡ | 100 | 0.80 s | **1.05 s** | 0 ms | 0 | 0 |
| `/for/cooking` | 100 | 100 | 96 ‡ | 100 | 0.81 s | **1.05 s** | 0 ms | 0 | 0 |
| `/guides/lock-screen-vs-sleep` | 100 | 100 | 96 ‡ | 100 | 0.81 s | **1.05 s** | 0 ms | 0 | 0 |
| `/es/` | 100 | 100 | 96 ‡ | 66 † | 0.80 s | **1.05 s** | 0 ms | 0 | 0 |

‡ **Best Practices 96 happens only on a local run.** The single failing audit is `errors-in-console`: `Failed to load resource: 404 … http://127.0.0.1:4500/api/e`. That is the first-party beacon, and a static preview has no Pages Functions to answer it. `lighthouserc.cjs` has two modes. In **local mode** (no `LHCI_BASE_URL`, preview on `127.0.0.1:4321`) it sets `blockedUrlPatterns: ['*/api/*']`, and Best Practices is 100 (`metrics/lighthouse-local-2026-09-26.md`). Any `LHCI_BASE_URL`, including this `:4500` origin, counts as **remote mode**, which blocks nothing because a deployed preview has the real functions. This run used remote mode against a server with no functions, so the 404 shows up. Every other assertion passed: Performance ≥ 0.95, Accessibility 1, LCP ≤ 1200 ms, TBT ≤ 100 ms, CLS 0, SEO 1 on indexable URLs, the nine non-crawlability SEO audits on `/es/`, and 0 third-party requests on `/`, `/30m` and `/es/`. The confirming run is LHCI on a deployed preview (N-12).

† `/es/` is `noindex, follow` while its translation is `reviewed: false`, so the `is-crawlable` audit fails by design. It reaches 100 once a native reviewer approves it (N-10).

### 1.3 `_headers` (simulated Cloudflare merge over `dist/_headers`)

| Path | Cache-Control | CSP class | X-Frame-Options | X-Robots-Tag |
|---|---|---|---|---|
| `/`, `/30m`, `/until/17-30`, `/es/`, `/pro` | `public, max-age=0, must-revalidate` | tool (strict, `'self'` + boot hash) | DENY | none |
| `/for/cooking`, `/es/for/cocinar`, `/guides/…` | `public, max-age=0, must-revalidate` | content (ad hosts pre-listed) | DENY | none |
| `/embed`, `/embed/` | `public, max-age=0, must-revalidate` | tool | DENY | none |
| `/embed/cook` | `public, max-age=0, must-revalidate` | embed (`frame-ancestors *`) | not set | noindex |
| `/embed/assets/app.<hash>.js` | `public, max-age=31536000, immutable` | embed | not set | noindex |
| `/embed.js` | `public, max-age=3600` | tool | DENY | none |
| `/pip`, `/ja/pip` | `public, max-age=0, must-revalidate` | tool | DENY | noindex |
| `/config/ads.json` | `public, max-age=300` | tool | DENY | none |
| `/sw.js` | `no-cache` (+ `Service-Worker-Allowed: /`) | tool | DENY | none |
| `/_astro/*` | `public, max-age=31536000, immutable` | tool | DENY | none |
| `/api/health` | `no-store` | tool | DENY | noindex |

Every path has `Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self), …`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. None has a doubled `Cache-Control` or CSP; the detach fix from `b66b0e7` holds. The real edge response still needs one `curl -sI` per class on a deployed preview (N-13).

---

## 2. `17-launch-checklist.md` §2 — P1 (trust core, parity, home)

| # | Item | Status | Evidence |
|---|---|---|---|
| P1-01 | All `T##` transition tests green; 100 % of rows covered | PASS | `packages/wake/test/transitions.test.ts` T01–T15 + `ssr.test.ts` T16: 16 / 16 green (`vitest --reporter=verbose`). One named test per transition row. Line coverage is not measured: no `@vitest/coverage-*` package is installed (known gap) |
| P1-02 | E2E journeys 1–7 and 12 green on chromium; firefox + webkit green | PASS | `tool.spec.ts` 15 / 15 in **each** of chromium, firefox and webkit (journeys 1–9, 11, 12, beacon, `ext=1`, axe). Journey 10 is in `m8.spec.ts` |
| P1-03 | Manual: hide → "Paused — tab hidden", show → "Screen awake"; Android battery saver → "Blocked — here's the fix" with the right advice | MANUAL | Automated with a fake wake lock: journey 4 + keyboard journey 4, all three engines. Real-device run: `device-matrix.json` rows `android-chrome-battery-saver` and others (N-11) |
| P1-04 | Autostart success ≥ 95 % in the beacon over a 24-h preview soak | EXTERNAL | Needs a deployed preview with the `EVENTS` binding and `queries.sql` (N-01, N-12). Lab: wake lock requested ≤ 300 ms after DOMContentLoaded (journey 1, 3 engines) |
| P1-05 | Stats "Today" rolls over at local midnight (`Asia/Kolkata`) | PASS | `packages/core/test/stats.test.ts` and `stats-per-day.test.ts` with the `stats.kolkata-midnight.json` fixture (in `pnpm test`, 501 / 501) |
| P1-06 | Lighthouse mobile `/`, `/30m` ≥ 95/100/100/100; LCP ≤ 1.2 s; CLS 0; 0 third-party | PASS (local) | §1.2: Perf 100, A11y 100, SEO 100, LCP 1.05 s, CLS 0, 0 third-party requests. Best Practices is 100 in local mode and 96 on the `:4500` remote-mode run, only because of the `/api/e` 404 (explained under §1.2). The deployed-preview run is N-12 |
| P1-07 | `size-limit` green: critical ≤ 15 KB gz, total ≤ 40 KB gz | PASS | §1.1: 14,784 / 40,199 B gz |
| P1-08a | axe: zero violations on every template in both themes | PASS | `a11y.spec.ts` 96 / 96 per engine (every page template light + dark; every tool surface light + dark + oled); `m6.spec.ts` and `m8.spec.ts` axe cases; extension popup + options axe (light + dark) in `pnpm test:e2e:ext` |
| P1-08b | Keyboard-only run of journeys 1–7 | PASS | `keyboard.spec.ts` 12 / 12 in chromium, firefox and webkit (recorded in §4) |
| P1-08c | VoiceOver + NVDA smoke checklist | MANUAL | N-14 |
| P1-09 | Visual check of every ambient layout at 320 / 390 / 768 / 1280 px | MANUAL | `i18n.spec.ts` checks for clipped or off-viewport text at 320 px in every locale plus a pseudo-locale (27 / 27 per engine). Visual baselines are recorded by the first nightly run (N-15); a human look at 768 px is still needed (N-14) |
| P1-10a | PWA installable (Chrome desktop); manifest shortcuts; offline reload; update toast never interrupts a session | PASS | `security.spec.ts` → `Page.getInstallabilityErrors` empty on `/` and `/es/` (chromium); offline journey `m6.spec.ts:268` (chromium); `test/tool/pwa.test.ts` (update toast only with no live session) |
| P1-10b | Installable on Android Chrome and iOS Safari (icon correct) | MANUAL | Real devices (N-11) |
| P1-11a | `_headers`: CSP, Permissions-Policy, HSTS, nosniff, Referrer-Policy, COOP, XFO DENY except `/embed/*` | PASS | `security.test.ts` (per route class, single CSP, inline-script hashes allowed) + §1.3 simulation. Note: content-route CSP is **enforced**, as in `14-devops.md` §3, not report-only for two weeks as this checklist line says (decision D-05) |
| P1-11b | `_headers` verified on the deployed response (`curl -sI` per class) | EXTERNAL | N-13 |
| P1-12a | `/api/*` `no-store`; burst → 429 + `Retry-After`; no IP stored | PASS | `e.test.ts` (burst → 429, `ipTraces()` over every KV/AE write), licence and rating suites (`pnpm test:functions` 152 pass); `/api/*` → `no-store` in §1.3 |
| P1-12b | Every `/api/*` write path rate-limited | FAIL | **F-01**: `POST /api/csp` has no rate limit and no body-size cap |
| P1-12c | Spot-check production KV / AE for IPs | EXTERNAL | N-01 after launch |
| P1-13a | No secret name, value or private key in any client file | PASS | §1 secret grep (0 hits) + `security.test.ts` (3 tests) |
| P1-13b | `.dev.vars.example` complete | FAIL | Lists the 9 secrets and 4 public vars, but not `POLAR_API_BASE`, which `functions/_lib/polar.ts` reads with a **sandbox default**. See **F-06** |
| P1-13c | Secrets set in production and preview | EXTERNAL | N-01 |
| P1-14a | No cookies on tool routes (every route + after a full session) | PASS | `security.spec.ts` 14 cookie tests per engine, 3 engines |
| P1-14b | Same check on the production deployment | EXTERNAL | `PLAYWRIGHT_BASE_URL=https://awaketab.com pnpm exec playwright test apps/web/test/e2e/security.spec.ts` (N-13) |
| P1-15 | `/about` (author, testing setup, contact), `/privacy` (matches docs/08 §7; extension section; ads "not yet active"), `/terms`, `/changelog`, `/404` with the tool | FAIL | All pages are built and pass axe. **F-04**: `/about` has no contact, and `/privacy` leaves out three docs/08 §7 rows (90-day retention of analytics events, ratings, the licence record in KV with how to ask for deletion) |
| P1-16 | Donate links live (Buy Me a Coffee; GitHub Sponsors on the library README) | PASS | `buymeacoffee.com/awaketab` in the footer (`dist/index.html`) and `/about`; `packages/wake/README.md:134` GitHub Sponsors |
| P1-17a | Sitemap index submitted in Search Console and Bing | EXTERNAL | N-07 |
| P1-17b | IndexNow key file and ping on deploy | FAIL | **F-05**: neither exists in the repo |
| P1-18 | OG images render in the X / LinkedIn / Slack debuggers; favicon in result previews | MANUAL | Per-page OG images exist and are asserted by `holding-page.test.ts` and `i18n-content.test.ts`. The debuggers need a public URL (N-13) |
| P1-19 | `/until/*` canonical `/`; `/pip` `noindex` | PASS | `holding-page.test.ts` "keeps nonindexable routes honest" and "/pip popup in every locale, noindex…"; §1.3 |
| P1-20 | Uptime check on `/` and `/api/health`; alert email received | EXTERNAL | N-16 |
| P1-21 | KV backup cron ran once; restore dry-run succeeded | PASS (code) / EXTERNAL (run) | **F-02 fixed**: `.github/workflows/kv-backup.yml` + `pnpm kv:backup` / `kv:restore` / `kv:reencrypt` (`14-devops.md` §10–§11). The backup → restore drill passes against a fake Cloudflare API (`apps/web/scripts/kv/test/`). The first real run and dry-run restore need the secrets: N-18 |
| P1-22 | Changelog entry "1.0 — launch" | PASS | `changelog/2026-09-1.0-launch.md` (this commit) |

---

## 3. `17-launch-checklist.md` §3 — P2 (content and launch)

| # | Item | Status | Evidence |
|---|---|---|---|
| P2-01 | 18 `/for`, 12 `/on`, 8 `/guides` in English; hubs `/for`, `/on`, `/guides` | PASS | `holding-page.test.ts` "publishes fifty-one English content pages in the 600–1,000 word band" (18 + 12 + 8 + 7 `/vs` + 6 `/learn`); hubs built and linked ("does not leave indexable pages linking to missing routes") |
| P2-02a | Per page: one `h1`, title ≤ 60 by the formula, description 50–155, canonical, reciprocal hreflang, Article + BreadcrumbList, OG, `lastVerified`, honest-limit callout, 3–5 FAQs, ≥ 3 related links, no orphans, tool with the right preset/mode | PASS | `pnpm test:seo` 59 / 59 ("ships complete metadata on every indexable page", word band, link check, hreflang reciprocity + sitemap match in `i18n-content.test.ts`); axe per template in `a11y.spec.ts`; Lighthouse per template in §1.2 |
| P2-02b | Manual read of each page | MANUAL | N-14 |
| P2-03 | Every browser / OS claim traceable to `support-matrix.json` | MANUAL | The build validates `device-matrix.json` ids against `support-matrix.json` (`scripts/support-matrix.mts`). Page prose was fact-checked against the matrix when drafted (docs/06 §19); no automated claim tracer exists |
| P2-04a | Top-10 pages translated and `reviewed: true` in at least 3 locales | EXTERNAL | 70 translated pages are built, all `reviewed: false`. Native review: N-10 |
| P2-04b | Unreviewed translations excluded from the sitemap | PASS | `i18n-content.test.ts` "publishes 70 localized pages… noindex" and "is reciprocal across indexable pages and matches the sitemaps"; `dist/sitemap-{es,…,hi}.xml` hold 0 URLs |
| P2-05a | Sitemap index lists exactly the indexable set | PASS | `holding-page.test.ts` "publishes canonical robots and locale sitemaps" + the hreflang / sitemap test above |
| P2-05b | Search Console shows > 50 indexed URLs before the launch post | EXTERNAL | N-07 |
| P2-06 | Show HN post (title, first comment, 14:00–16:00 UTC weekday) | EXTERNAL | Owner (docs/17 §6) |
| P2-07 | Product Hunt (tagline, 5 gallery images 1270×760, maker comment) | EXTERNAL | Owner |
| P2-08 | AlternativeTo listing | EXTERNAL | Owner |
| P2-09 | `/vs/nosleep-page` live and fair | PASS | Built (`dist/vs/nosleep-page/`), in the SEO suite and `sitemap-en.xml`. Whether it is fair is an owner read (N-14) |
| P2-10a | Store package: manifest 1.0.0, icons 16/32/48/128, 5 × 1280×800 screenshots, short description ≤ 132, permission justifications, privacy URL `…/privacy#extension`, single purpose, data-usage answers | PASS | `apps/extension/wxt.config.ts` `version: '1.0.0'`, permissions `power, storage, alarms`, no host permissions (asserted in `pnpm test:e2e:ext`); `apps/extension/store/images/` 5 × 1280×800 + promo 440×280 (`sips`); `apps/extension/store/listing.md` (short description 121 chars, single purpose, justifications, privacy URL); `zip:check` reproducible |
| P2-10b | Zip built from `main` and submitted to the Chrome Web Store | EXTERNAL | N-05 (after this branch merges) |
| P2-11 | Edge Add-ons submission in the same week | EXTERNAL | N-05 |
| P2-12a | AdSense prerequisites in the repo: `ads.txt` placeholder, `PUBLIC_ADS_ENABLED=0`, CMP only on content routes, no ad code on tool routes | PASS | `dist/ads.txt` (`pub-0000000000000000` placeholder), `dist/config/ads.json` `{"enabled":false}`, `.dev.vars.example` `PUBLIC_ADS_ENABLED=0`; journey 11 (3 engines); ESLint bans ads imports on tool routes |
| P2-12b | 60 pages indexed; `/privacy` ads section; CMP configured | EXTERNAL | N-07, N-09. The `/privacy` ads section needs the F-04 copy first |
| P2-13 | Apply to AdSense; flip `PUBLIC_ADS_ENABLED=1` on approval; verify no ad request on `/`, `/30m`, `/pip`, `/embed/*` and CLS still 0 | EXTERNAL | N-09 |

---

## 4. `19-master-build-prompt.md` §E — production-readiness definition

| # | Clause | Status | Evidence |
|---|---|---|---|
| E-01 | The pill never lies: every transition row has a green T## test; hide/show and denied journeys green in chromium, firefox, webkit | PASS | P1-01; journeys 4 and 5 (`tool.spec.ts`) and keyboard journeys 4 and 5 green in all three engines |
| E-02 | Budgets green on the production build: ≤ 40 / 15 KB gz, 0 third-party on tool routes, LCP ≤ 1.2 s, CLS 0, Lighthouse ≥ 95/100/100/100 on the five URLs | PASS (local) | §1.1, §1.2. CI on a deployed preview: N-12 |
| E-03a | Security headers on every route class as docs/14 §3 | PASS | P1-11a (generated file); deployed check N-13 |
| E-03b | `/api/*` rate-limited | FAIL | F-01 (`/api/csp`) |
| E-03c | No secret in any client bundle (grep dist) | PASS | §1 grep |
| E-04a | No cookies on any tool route (e2e) | PASS | P1-14a |
| E-04b | Telemetry toggle works | PASS | `test/lib/analytics.test.ts`, `test/tool/settings.test.ts` (in `pnpm test`) |
| E-04c | `/privacy` matches docs/08 §7 | FAIL | F-04 |
| E-05 | i18n: 8 locale files complete; each translated page `reviewed: true` or out of sitemap and hreflang | PASS | i18n parity tests in `test/i18n/` (`pnpm test`); P2-04b |
| E-06 | SEO: `pnpm test:seo` green over the full dist; sitemap = indexable; hreflang reciprocal; JSON-LD valid; per-page OG | PASS | 59 / 59 (§1) |
| E-07a | Production config `PUBLIC_ADS_ENABLED=0`, `PUBLIC_SPONSOR_ENABLED=0` | PASS | `.dev.vars.example`; `dist/config/ads.json` and `dist/config/sponsor.json` both `{"enabled":false}`. The production values are set in Cloudflare (N-01) |
| E-07b | Pro flow end-to-end against the Polar sandbox, including revocation via webhook | PASS (mocked) / EXTERNAL (live) | Function suites with a mocked Polar API: activate / validate / deactivate / webhook (LIC-02…LIC-12, `wh:` idempotency, refund → `refunded`), journey 9 (mocked activation → revoke). A live run against the sandbox needs the Polar account and a deployed preview (N-04). Webhooks that carry no licence key: decision D-06 |
| E-07c | Offline verification works with the network off | PASS | `packages/core/test/license.test.ts` (WebCrypto ES256 verify, expiry, grace, tampered fixture); extension licence e2e verifies offline |
| E-08a | Uptime check on `/` and `/api/health` | EXTERNAL | N-16 (`health.test.ts` covers the endpoint) |
| E-08b | KV backup cron deployed | PASS (code) / EXTERNAL (secrets) | F-02 fixed: `kv-backup.yml` (weekly + manual, encrypted 12-week artifact); N-18 |
| E-08c | Rollback documented (docs/14 §11) and tested once on a preview | PASS (doc) / EXTERNAL (test) | `14-devops.md` §11–§12; rollback drill N-17 |
| E-09a | axe zero on all templates in both themes | PASS | P1-08a |
| E-09b | Keyboard-only run of journeys 1–7 recorded here | PASS | `keyboard.spec.ts`, 3 engines, 12 / 12 each: J1 autostart + skip link + whole page tabs without a trap; J2 Tab to 2 h chip + Enter, and the `5` key; J3 `U` opens the until picker with focus inside; J4 hide → Paused, show → Screen awake, focus kept; J5 denied → Tab to Retry → Enter; J6 extend prompt (Stop focused, Esc stops; Shift+Tab to +30, Enter extends); J7 reload → Tab to Resume → Enter; shortcuts 1–6 / 0 / D / F / P / ?; ambient (M) focus trap and Esc; settings and stats dialogs restore focus |
| E-10a | `docs/BUILD-STATE.md` and CHANGELOG current | PASS | This commit |
| E-10b | Every PROPOSED identifier accepted into docs/00 by the owner, or removed | EXTERNAL | Owner decision D-04 |

---

## 5. Totals

| Status | §2 (P1) | §3 (P2) | §E | Total |
|---|---|---|---|---|
| PASS | 15 | 7 | 15 | **37** |
| FAIL | 5 | 0 | 3 | **8** |
| MANUAL | 5 | 2 | 0 | **7** |
| EXTERNAL | 7 | 9 | 2 | **18** |
| **Rows** | 32 | 18 | 20 | **70** |

Rows marked "PASS (local)" count as PASS, and "PASS (mocked) / EXTERNAL (live)" and "PASS (doc) / EXTERNAL (test)" also count as PASS; the EXTERNAL half of each is tracked in Needs Soubhik. Every automatable item passes except the 6 FAIL rows. Those rows trace to 4 defects: F-01 (P1-12b, E-03b), F-04 (P1-15, E-04c), F-05 (P1-17b) and F-06 (P1-13b). F-02 (P1-21, E-08b) has since been fixed in code; its first live run is N-18. Two more defects have no row. F-03 comes from `14-devops.md` §1, and F-07 (`/changelog` rendering) turned up while writing the 1.0 entry, so P1-22 stays PASS. Both are listed under Fails with the others.

---

## Fails

None of these was fixed in this pass, which changed docs only. F-02 has been fixed in code since then; its row is marked.

| ID | Defect | Evidence | Severity / blocks |
|---|---|---|---|
| **F-01** | `POST /api/csp` has no rate limit and no body cap. Every request writes one Analytics Engine point (`client_error {code:'csp'}`), and `request.text()` reads the whole body | `apps/web/functions/api/csp.ts` (no `rateLimit()` call; compare `api/e.ts`, which enforces `MAX_BODY_BYTES` and `rateLimit`). `grep -l rateLimit functions/api` → `e.ts`, `rating.ts`, `license/{activate,validate,deactivate}.ts` only | Low. It can inflate AE usage and cost. `/api/embed/config` (read-only, cached 5 min), `/api/health` and the HMAC webhook are unlimited by design |
| **F-02** · **PASS (code)** | KV backup and restore were not built: no `backup-kv` Worker cron, no R2 export, no `pnpm kv:restore` / `kv:reencrypt` | **Fixed:** `.github/workflows/kv-backup.yml` (GitHub Actions instead of a Worker cron, encrypted artifact instead of R2; the reasons are in `14-devops.md` §11) and `pnpm kv:backup` / `kv:restore` (dry run by default, `--apply`, `--yes-production` for production, keeps `expiration` and metadata) / `kv:reencrypt` (dry run by default, idempotent, resumable, progress output). Code is in `apps/web/scripts/kv/`, with 37 unit tests and a functions interop test, no network. The secrets and the first run are owner steps: N-18 | Was Medium, blocked §E Ops. Nothing blocks now in code; E-08b waits on N-18 |
| **F-03** | Preview deployments are not `noindex`. `14-devops.md` §1 specifies a middleware that adds `X-Robots-Tag: noindex` when `CF_PAGES_BRANCH !== 'main'`, but the only middleware is `functions/api/_middleware.ts` (CORS, `/api/*` only) | `find apps/web/functions` shows no root `_middleware.ts`; `grep -r CF_PAGES_BRANCH` → nothing | Low. Canonicals point to `https://awaketab.com`, which limits the damage, but `*.pages.dev` previews can still be crawled |
| **F-04** | `/about` has no contact. `/privacy` leaves out three `08-data-storage.md` §7 rows: the 90-day retention of anonymous events in Analytics Engine; ratings (stars + optional text in KV); and the licence record in KV, including how to ask for deletion (`14-devops.md` §10: "delete my licence data… documented on /privacy"). The ads section says only "remains disabled until its documented launch gate", which is not enough for AdSense | `apps/web/src/pages/about.astro` (no `mailto:` / `support@`); `apps/web/src/pages/privacy.astro` (no "90", "rating", "delet", "support@") | Medium. Legal copy. Must be fixed before launch and before applying to AdSense |
| **F-05** | IndexNow is not built: no key file in `public/`, no ping after deploy | `grep -ri indexnow apps/web/scripts apps/web/src .github` → nothing | Low. Bing / Yandex discover pages more slowly |
| **F-06** | The switch from Polar sandbox to production is not wired. `PUBLIC_POLAR_SERVER` (docs/00 §13.3) is read nowhere. The functions use `POLAR_API_BASE`, which is undocumented and defaults to `https://sandbox-api.polar.sh`. `CHECKOUT_LINKS` in `src/lib/license.ts` are hard-coded `sandbox.polar.sh` URLs | `apps/web/functions/_lib/polar.ts:29`; `apps/web/functions/_lib/env.ts` (`POLAR_API_BASE?`); `apps/web/src/lib/license.ts:15–21`; `grep -r POLAR_API_BASE docs` → nothing | High for G2 (Pro sales); nothing at G0. Forgetting one of the two would send production activations to the sandbox, or send buyers to sandbox checkout |
| **F-07** | `/changelog` prints fragment Markdown literally, and it orders fragments by file name (`readdir().sort().reverse()`), not by their `date` | `apps/web/src/pages/changelog.astro:23–33` renders each paragraph as `<p>{paragraph}</p>`. In `dist/changelog/index.html` the M6 entry shows ``Press `M` to…`` and the M8 entry shows `[/embed](/embed)` literally. `2026-09-1.0-launch.md` sorts **last** (`1` < letters), so "1.0 — launch" appears at the bottom. The 1.0 fragment is written in plain prose so it renders cleanly | Low, cosmetic. It is visible on a trust page at launch. Fix: render the Markdown at build time and sort by `date`, then file name |

**Risks to check on the first deployed preview. Not failures yet:**

- **Trailing slashes.** Astro writes `dist/<route>/index.html`, while canonicals, sitemaps and hreflang use paths with no trailing slash (`/30m`, `/embed`). Cloudflare Pages may answer `/30m` with a 308 to `/30m/`. If it does, every canonical points at a redirect, and `robots.txt` `Disallow: /embed/` would block the `/embed` landing page after the redirect. Check with `curl -sI https://<preview>/30m` (N-13).
- **Dev signing key.** `LICENSE_PUBLIC_KEYS[1]` in `packages/core/src/license.ts` is the dev key, and its **private half is committed** in `apps/web/.dev.vars.example`. Anyone could mint a Pro token that the web app and the extension accept offline. Rotating the key (N-03) is a hard prerequisite for G2 and should happen before the public launch.

---

## Needs Soubhik

The steps are in order. Anything that changes code is marked **(code change, PR)**.

### N-01 · Cloudflare Pages, domains, KV, Analytics Engine, secrets

1. **Pages project.** Dashboard → Workers & Pages → Create → Pages → connect GitHub `awaketab/awaketab`, production branch `main`. Pages only finds Functions inside the project's root directory, and they live in `apps/web/functions`. So set **Root directory `apps/web`**, **Build command `pnpm build`** (pnpm runs the workspace from there) and **Output `dist`**. `14-devops.md` §2 says `pnpm -F web build` from the repo root, but that would not pick up the Functions. Env var `NODE_VERSION=22`. If the build log shows a pnpm other than 9, add `PNPM_VERSION=9.15.9`. First check: `curl -s https://<hash>.awaketab.pages.dev/api/health` must return `{"ok":true,…}`.
2. **Custom domains.** Pages → Custom domains → add `awaketab.com` (apex; CNAME flattening) and `www.awaketab.com` (`_redirects` sends www to the apex). Add `awaketab.app`, `.page` and `.dev` as zones with one Bulk Redirect rule → `https://awaketab.com/$1`, 301, keep path and query. Check each: `curl -sI https://awaketab.app/30m` → `301` + `location: https://awaketab.com/30m`.
3. **KV.** `pnpm dlx wrangler kv namespace create LICENSES` and `pnpm dlx wrangler kv namespace create LICENSES_PREVIEW`. Pages → Settings → Bindings → KV namespace, variable name **`LICENSES`**: Production → `LICENSES`, Preview → `LICENSES_PREVIEW`.
4. **Analytics Engine.** Pages → Settings → Bindings → Analytics Engine, variable name **`EVENTS`**: Production dataset `awaketab_events`, Preview dataset `awaketab_events_preview`. A dataset is created on its first write. After one page view on the preview, check with the SQL API (`docs/metrics/queries.sql`).
5. **Secrets.** Set each one separately for **Production and for Preview**: Pages → Settings → Variables and Secrets → type "Secret", or `pnpm dlx wrangler pages secret put <NAME> --project-name awaketab` for production.
   | Name | Value |
   |---|---|
   | `POLAR_ACCESS_TOKEN` | Polar → Settings → Developers → new organization access token (production org for Production, sandbox org for Preview) |
   | `POLAR_WEBHOOK_SECRET` | from the Polar webhook endpoint (N-04) |
   | `POLAR_ORGANIZATION_ID` | Polar → Settings → Organization ID |
   | `POLAR_BENEFIT_MAP` | JSON, one line: `{"<benefit id of lk_pro_yearly>":"pro_yearly","<lk_pro_lifetime>":"pro_lifetime","<lk_embed>":"biz_embed_site_yearly","<lk_kiosk_site>":"biz_kiosk_site","<lk_kiosk_5>":"biz_kiosk_5"}` |
   | `LICENSE_SIGNING_KEY` | production private JWK, one line (N-03) |
   | `LICENSE_SIGNING_VER` | `2` (N-03) |
   | `LICENSE_KEY_ENC_KEY` | `openssl rand -base64 32`. Never rotate without re-encrypting KV |
   | `RATE_LIMIT_SALT` | `openssl rand -hex 32` (rotate quarterly) |
   | `TURNSTILE_SECRET_KEY` | optional; only if activation abuse appears |
   | `POLAR_API_BASE` | **Production: `https://api.polar.sh`**; Preview: `https://sandbox-api.polar.sh`. Undocumented (F-06); without it the functions call the sandbox |
   | `ALERT_WEBHOOK_URL` | optional Slack webhook (`14-devops.md` §9) |
   Plain (non-secret) variables for both environments: `PUBLIC_SITE_URL=https://awaketab.com`, `PUBLIC_ADS_ENABLED=0`, `PUBLIC_SPONSOR_ENABLED=0`, `PUBLIC_POLAR_SERVER=production` (Preview: `sandbox`). The last one is read nowhere yet (F-06).
6. **KV backup.** No R2 bucket is needed. The backup is a GitHub Actions artifact (F-02, as built). Set it up with N-18.
7. **Email.** Cloudflare Email Routing: forward `support@awaketab.com` (used on `/pro`, the refund runbook and the store listing) to your inbox and send a test message.
8. **GitHub secrets.** `LHCI_GITHUB_APP_TOKEN` (optional status checks on PRs), and `NPM_TOKEN` only as the fallback for N-06.

### N-02 · Headers and privacy checks on the deployed preview

See N-13. Also spot-check KV once after a few activations: `pnpm dlx wrangler kv key list --namespace-id <LICENSES id>` shows only `lic:*`, `cus:*`, `wh:*`, `ord:*`, `embed:*`, `rating:*` and short-lived `rl:*` keys. No value may contain an IP address.

### N-03 · Production ES256 key rotation (code change, PR)

1. On a trusted machine: `pnpm keys:dev > ~/awaketab-es256-prod.json`. This is the same generator: `{ privateKey, publicKey }` as P-256 JWKs. Never commit the file; store it in your password manager.
2. `LICENSE_SIGNING_KEY` = the `privateKey` object as one line of JSON (`jq -c .privateKey ~/awaketab-es256-prod.json`); `LICENSE_SIGNING_VER=2`. Production only; Preview may keep a separate pair.
3. **(code change)** In `packages/core/src/license.ts` add `2: { kty, crv, x, y }` from `publicKey` to `LICENSE_PUBLIC_KEYS`, and **delete entry `1`**: its private half is public in `.dev.vars.example`. For local dev, generate your own pair with `pnpm keys:dev`, put it in your untracked `.dev.vars`, and update `.dev.vars.example`, the core test fixtures and the functions harness to a test-only `ver` that production builds do not ship. Add a changeset for `@awaketab/core`.
4. Deploy the web app, then rebuild the extension zip (it bundles `@awaketab/core`) **before** submitting to the stores (N-05).
5. Yearly rotation, per `14-devops.md` §10: ship `LICENSE_PUBLIC_KEYS[ver+1]` first, then switch the secrets, and keep the old public key for 90 days. Known gap: `/api/license/validate` verifies only against the current signing key, so old-`ver` tokens get `401 bad_token` and the client re-activates. That costs no activation for the same device, but it is not the 90-day overlap the doc describes.

### N-04 · Polar production

1. Polar production org. Products per `00-conventions.md` §8.1: `pro_yearly` $12/yr, `pro_lifetime` $29, `biz_embed_site_yearly` $29/yr, `biz_kiosk_site` $19, `biz_kiosk_5` $49; `sponsor_month` later (G5).
2. License Key benefits `lk_pro_yearly`, `lk_pro_lifetime` (activation limit 5), `lk_embed`, `lk_kiosk_site`, `lk_kiosk_5`. Copy their ids into `POLAR_BENEFIT_MAP`.
3. Discount `LAUNCH19`: $10 off, `pro_lifetime` only, ends Pro launch + 90 days. Then **(code change)** set `PRO_LAUNCH_END` in `apps/web/src/lib/license.ts`; it is currently `2026-12-08`.
4. Checkout links per product, success URL `https://awaketab.com/pro/activate?checkout_id={CHECKOUT_ID}`. **(code change, F-06)** Replace the `sandbox.polar.sh` entries in `CHECKOUT_LINKS` (`apps/web/src/lib/license.ts`), or wire them to `PUBLIC_POLAR_SERVER`.
5. Webhook endpoint `https://awaketab.com/api/webhooks/polar` (Standard Webhooks) with the events the handler acts on: `order.created`, `order.refunded`, `refund.created`, `subscription.canceled`, `subscription.uncanceled`, `subscription.revoked`, `benefit_grant.created`, `benefit_grant.revoked` (`functions/api/webhooks/polar.ts`). Copy its secret into `POLAR_WEBHOOK_SECRET`. Confirm the tax / merchant-of-record settings.
6. **Real-card test** (docs/17 §4). Buy `pro_yearly` and `pro_lifetime` on production. Activate on the web and in the extension (2 devices); `/pro/manage` lists both; remove one. Kill the network and check that Pro stays until `exp`. Refund both within 14 days in Polar. Then check: `lic:{keyHash}.status` is `refunded` in KV, the next validate returns `{ revoked: true }`, and the app shows the `revoked` toast. Save screenshots to `docs/metrics/pro-launch.md`.
7. **Open decision D-06 (code change).** Live `subscription.revoked` and `order.refunded` payloads may carry only customer, subscription and order ids, not the licence key. Today the webhook can only match key-bearing payloads (`polar.test.ts:256` is `it.todo`; `13-testing-strategy.md` §9 known gap). Proposal: store `customerId`, `subscriptionId` and `orderId` on `lic:{keyHash}` at activation, and keep the `cus:{customerId}` / `ord:{orderId}` index keys up to date, so the webhook can fan out. Decide before G2. Step 6 shows whether production payloads need it.

### N-05 · Chrome Web Store and Edge Add-ons

1. Merge to `main` (after N-03), then `pnpm -F extension zip` → `apps/extension/.output/awaketab-chrome-1.0.0.zip`. `pnpm -F extension zip:check` should print `"same":true`.
2. Chrome Web Store developer account (one-time fee), 2-step verification on. New item → upload the zip. Paste the fields from `apps/extension/store/listing.md`: title, short description, detailed description, category, single purpose, permission justifications (`power`, `storage`, `alarms`, optional `notifications`, optional host access), privacy URL `https://awaketab.com/privacy#extension`, and the data-usage form ("no user data collected" + optional anonymous statistics). Upload `store/images/screenshot-1…5` (1280×800) and `promo-440x280.png`. Submit for review.
3. Edge Partner Center → Extensions → new → the same zip and listing, display name "AwakeTab".
4. After approval, **(code change)** replace the store-search URLs in `EXTENSION_STORE_URLS` (`apps/web/src/lib/extension.ts`) with the real listing URLs.
5. Optional: `extension-release.yml` (`14-devops.md` §6) is not built. Uploads are manual until it is.

### N-06 · npm trusted publishing for `@awaketab/wake`

1. npm → create or claim the org `awaketab` (scope `@awaketab`), 2FA on.
2. For the first publish: npmjs.com → package settings → Trusted Publisher → GitHub Actions, repository `awaketab/awaketab`, workflow `release.yml`, environment **`npm`**. If the package does not exist yet, either publish once with a granular automation token in the repo secret `NPM_TOKEN` (the workflow falls back to it and still adds provenance), or pre-register the trusted publisher if npm offers it for new packages.
3. GitHub → Settings → Environments → create **`npm`** (optionally with required reviewers).
4. Merge to `main` with no pending changesets. `release.yml` → job `publish-wake` runs tests, build and size, then `npm pack --dry-run` and `npm publish --provenance --access public`, and pushes tag `@awaketab/wake@1.0.0`. Check: `npm view @awaketab/wake version` → `1.0.0`, and the npm page shows the provenance badge. Then create the GitHub release notes (docs/17 §4).

### N-07 · Search Console, Bing, sitemap (P1-17a, P2-05b)

1. Search Console → Domain property `awaketab.com` → verify by DNS TXT in Cloudflare. Bing Webmaster → import from Search Console.
2. Submit `https://awaketab.com/sitemap-index.xml` in both.
3. IndexNow needs F-05 first: generate a key, put `public/<key>.txt` in the repo, and ping after deploy.
4. Weekly: coverage. Launch needs > 50 indexed URLs (P2-05b).

### N-08 · Domain hygiene

Auto-renew on all four TLDs, registrar 2FA, expiry alerts (docs/17 §1).

### N-09 · AdSense and the Funding Choices CMP (G1)

1. Prerequisites: F-04 fixed (full ads section on `/privacy`), 60 English pages indexed (N-07).
2. Apply at adsense.google.com for `awaketab.com`. Replace the placeholder in `apps/web/public/ads.txt` with the real `pub-…` line and set `AD_CLIENT` / `AD_UNITS` in `src/lib/ads.ts` **(code change)**.
3. AdSense → Privacy & messaging → create a European regulations (GDPR) message for EEA / UK / CH, and publish it. Its script host is already in the content-route CSP.
4. On approval: `PUBLIC_ADS_ENABLED=1` in Production, deploy, then check `curl -s https://awaketab.com/config/ads.json` → enabled, and run journey 11 against production: `PLAYWRIGHT_BASE_URL=https://awaketab.com pnpm exec playwright test -g "journey 11"` (no ad request on `/`, `/30m`, `/pip`, `/embed/*`). Run Lighthouse on a `/for` page: CLS must still be 0.
5. Kill switch: `/config/ads.json` `{"enabled":false}` (5-min cache).

### N-10 · Native-speaker review

The QA checklist is `07-i18n.md` §8. Flip `reviewed: true` per page in `src/content/{collection}/{locale}/*.md` and per locale home in `LOCALE_META` (`src/i18n/locales.ts`) **(content change, PR)**. The sitemap, hreflang and the `noindex` removal follow automatically. Priorities:

1. **Windows 11** setting names in each locale ("Power & battery", "Screen and sleep", Energy / battery saver) on `/on/windows-11`.
2. **Android OEM** app-sleep and battery list names (Samsung "Sleeping apps", Xiaomi, OnePlus…) on `/on/android-chrome`.
3. **macOS** pane names (Lock Screen, Energy / Battery, Displays) on `/on/macos`.
4. **Hindi iOS labels**: Auto-Lock and "Never" exactly as iOS shows them in Hindi, on `/on/iphone-safari` and `/guides/iphone-auto-lock-never-greyed-out`.
5. **Keyword choices**: the local head query in each page's `intent` / `h1` and `secondaryQueries`.
6. **`/for/downloads`** in every locale. The local head queries target *system* sleep, but the web tool holds the *display* only; the honest limit must survive translation.
7. **French capitalisation**: sentence case in titles and headings, not English title case.
8. **M6 / M7 / M8 strings**: 55 M6 keys (ambient, stats, end-of-session, rating, accents), `ambient.focus.today`, the `ext.*` extension catalog and store `_locales`, the embed widget states (`embed.*`, including "Ask the site owner"), and `content.translation.*` / `content.breadcrumb`. Especially `ja` and `hi`.
9. Locale homes `/es/` … `/hi/`, still UI + intro stubs (E6-T04).

### N-11 · Real-device matrix

1. Run the 14 rows in `docs/metrics/device-matrix.json` using its `method` (Windows 11 Chrome / Edge efficiency mode / Firefox / Teams presence / Modern Standby, macOS Safari and Chrome lid, iPhone Safari Auto-Lock and Low Power Mode, iPhone Home Screen app, iPad, Android Chrome battery saver, Samsung Internet, Linux Firefox).
2. Fill each row: `version`, `observed`, `evidence` (a file name under `docs/metrics/`), `date` (YYYY-MM-DD), and `verdict` (`pass` | `partial` | `fail`). Then set the top-level `status: "complete"` and `updatedAt`.
3. `pnpm -F web matrix:sync`. This writes `lastVerified` / `lastUpdated` into `src/data/support-matrix.json`. `pnpm build` then renders `/learn/how-we-tested` without "Results pending". Commit both files.
4. The same run decides two other things: whether the Document PiP window should request its own sentinel (known gap), and whether `/learn/does-a-wake-lock-keep-teams-green` states the tested result.
5. Also check Android and iOS PWA install (icon, shortcuts) and the battery-saver advice (P1-03, P1-10b).

### N-12 · Lighthouse CI on a preview URL

`LHCI_BASE_URL=https://<hash>.awaketab.pages.dev LHCI_RUNS=3 pnpm lighthouse`, or GitHub → Actions → lighthouse → Run workflow with `base_url`. Expected: every assertion green, Best Practices 100 (the real `/api/e` answers), `/es/` SEO 66 by design. Save the table as `docs/metrics/lighthouse-preview-<date>.md`.

### N-13 · `curl -sI` checks on a deployed preview

Replace `$P` with the preview origin:

```
for p in / /30m /es/ /for/cooking /embed /embed/cook /embed.js /pip /config/ads.json /sw.js /api/health; do echo "== $p"; curl -sI "$P$p" | grep -iE '^(HTTP|location|cache-control|content-security-policy|x-frame-options|x-robots-tag|permissions-policy|strict-transport|cross-origin-opener)'; done
curl -sI "$P$(curl -s $P/ | grep -o '/_astro/[^"]*\.js' | head -1)" | grep -i cache-control
```

Pass when:

- Each response has exactly **one** `cache-control` line with a single value: no `max-age=0, must-revalidate, public, max-age=31536000` joins.
- `/_astro/*` and `/embed/assets/*` are `immutable`; `/api/*` is `no-store`; `/embed/cook` has no `x-frame-options` and `frame-ancestors *`.
- Tool pages have one CSP, with no ad hosts; `/pip` and `/embed/cook` are `noindex`.
- **Tool routes answer `200`, not `308`** (trailing-slash risk above).

Then run the cookie check against the deployment (P1-14b) and paste an OG URL into the X, LinkedIn and Slack debuggers (P1-18).

### N-14 · Human checks

VoiceOver (macOS + iOS) and NVDA smoke of journeys 1–7. Look at every ambient layout at 768 px. Read each English page once (P2-02b), including whether `/vs/nosleep-page` is fair.

### N-15 · First nightly run → visual baselines

GitHub → Actions → nightly → Run workflow. It runs `VISUAL=1 … visual.spec.ts --project=chromium --update-snapshots=missing` and uploads the `visual-snapshots` artifact. Download it, review the 36 shots (6 modes × 3 themes × 390 / 1280 px), and commit `apps/web/test/e2e/visual.spec.ts-snapshots/`. Later nightlies then compare against them.

### N-16 · Uptime

Cloudflare Health Checks (or UptimeRobot / Better Stack free): `GET https://awaketab.com/` and `GET https://awaketab.com/api/health` every 5 min, alert on 2 consecutive failures to your email. Pause one check once to confirm the alert email arrives.

### N-17 · Rollback drill

Deploy a trivial change to a preview branch, then Pages → Deployments → pick the previous deployment → "Rollback to this deployment". Confirm `/api/health` `version` changes back. Note the time taken in `docs/metrics/`.


### N-18 · KV backup secrets and first run (F-02)

1. **Encryption key.** Run `openssl rand -base64 32`. Store the value in the password manager as "AwakeTab BACKUP_ENCRYPTION_KEY". **Without it no backup can be restored**, and it cannot be recovered from GitHub.
2. **Cloudflare API token (read-only).** Dashboard → My Profile → API Tokens → Create → Custom token "awaketab-kv-backup". Permission: **Account → Workers KV Storage → Read**, for your account only, with no zone permissions. Copy your **Account ID** from Workers & Pages → Overview (right sidebar).
3. **Namespace ids.** Run `pnpm dlx wrangler kv namespace list`, or open Workers & Pages → KV. You need the ids of `LICENSES` and, optionally, `LICENSES_PREVIEW`.
4. **GitHub secrets.** Repository → Settings → Secrets and variables → Actions → New repository secret. Add these:
   | Name | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 2 |
   | `CLOUDFLARE_ACCOUNT_ID` | the account id |
   | `KV_LICENSES_ID` | the id of `LICENSES` |
   | `KV_LICENSES_PREVIEW_ID` | optional: the id of `LICENSES_PREVIEW` |
   | `BACKUP_ENCRYPTION_KEY` | the value from step 1 |
   If the repository is private, check Settings → Actions → General → Artifact and log retention: it must be at least 84 days.
5. **First run (P1-21, E-08b).** Actions → KV backup → Run workflow. It must be green and show the artifact `kv-backup-<run id>` containing `LICENSES-<date>.jsonl.enc`. A run with the notice "KV backup skipped" means no secret is visible to the job. A red run that names missing secrets means some are set and some are not.
6. **Restore dry run.** Download and unzip the artifact. Then:
   - `BACKUP_ENCRYPTION_KEY=… pnpm kv:restore LICENSES-<date>.jsonl.enc` must print the header and counts.
   - `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… BACKUP_ENCRYPTION_KEY=… pnpm kv:restore LICENSES-<date>.jsonl.enc --namespace-id <LICENSES_PREVIEW id>` must print `dryRun: true` and write nothing.
   Note the date in `docs/metrics/` and tick docs/17 §2 "KV backup cron ran once; restore dry-run succeeded".
7. **Later.** A failed scheduled run emails you. Once a month, download one artifact and keep it offline, because artifacts expire after 12 weeks. To rotate `LICENSE_KEY_ENC_KEY`, follow `14-devops.md` §10 (`pnpm kv:reencrypt`, dry run first). It needs a separate short-lived token with KV **Edit**.
---

## Owner decisions pending

| ID | Decision | Where | Current state |
|---|---|---|---|
| D-01 | Tool-route CSP `img-src 'self' data: https:` so a licensed kiosk's `logo=` image can load | `00-conventions.md` §13.10 ("C4 decision — needs owner sign-off"), `apps/web/scripts/headers.mjs` | Shipped. The zero-third-party budget still holds on every default tool page, but any `https:` image is allowed by policy |
| D-02 | Extension System-level wording. A held `system` lock shows the shared `held` pill "Screen awake" plus the secondary line `ext.pill.system` "System awake — screen may dim". Options: accept, or add an extension-only pill for system level (no new lock state) | `apps/extension/src/status.ts`, `10-extension-spec.md` §13 | Accept as is, or ask for a new key |
| D-03 | Romanised ASCII slugs for `ja` / `zh` / `hi` (`/ja/for/ryouri`, `/zh/for/pengren`, `/hi/for/khana-banana`) instead of the English slug that `06-content-seo-spec.md` §5 prescribes | `06-content-seo-spec.md` §19, `src/i18n/slugs.json` | Confirm, or replace them with the EN slug in `slugs.json` (no code change). Decide before those pages are reviewed and indexed, because changing a slug later needs redirects |
| D-04 | Accept the PROPOSED identifiers in `00-conventions.md` §13.8–§13.12 | §13.9 (extension) is still marked "Proposed", and code carries `// PROPOSED` in `apps/extension/src/{status,storage,settings,schedules,controller}.ts`. §13.8, §13.10, §13.11 and §13.12 were written as "Accepted on 2026-09-26" during the build and need your confirmation. Also not yet in docs/00: the E6-T05…T07 list in `07-i18n.md` §11 (`RTL_LANGUAGES` / `textDirection()`, `translations.mjs` helpers, `localeLinks`, `.at-flip-rtl`, `content.translation.*`), `EXTENSION_STORE_URLS` (`src/lib/extension.ts`), `EXTENSION_CORS_ROUTES` (`functions/_lib/cors.ts`) and the embed loader's `sandbox` token (`src/tool/embed/loader.ts`, `11-embed-spec.md` §11) | Accept (then remove the code markers), or rename before 1.0 |
| D-05 | Content-route CSP enforced from day one (as generated per `14-devops.md` §3) vs "report-only for two weeks" (`17-launch-checklist.md` §2) | `apps/web/scripts/headers.mjs` | Enforced. No third party loads on content pages while ads are off, so enforcing is safe. Revisit when G1 adds ad hosts |
| D-06 | Store Polar customer, subscription and order ids on licence records so key-less webhooks match | N-04 step 7 | Open |

---

## Pointers

- Local Lighthouse history and the LCP fix: `metrics/lighthouse-local-2026-09-26.md`.
- Build state and known gaps: `BUILD-STATE.md`.
- Test strategy and suite inventory: `13-testing-strategy.md`.
- Runbooks: `17-launch-checklist.md` §4 (refund), §6 (launch day), §7 (first week); `14-devops.md` §11–§12.
