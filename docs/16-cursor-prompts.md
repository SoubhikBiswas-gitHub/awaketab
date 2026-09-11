# 16 · Cursor prompts — one per epic, plus utilities

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** Copy-pasteable prompts that turn the specs in `docs/` into code with Cursor, one epic per chat, in dependency order. Each prompt names the documents to read, the files to produce, the identifiers that must be used verbatim, the acceptance criteria to satisfy and the tests to write — and ends with a "stop and report" step so nothing lands unreviewed.

Related docs: `15-implementation-plan.md` (epics and tickets referenced here) · `00-conventions.md` (identifiers) · every spec doc.

---

## 1. How to work with these prompts

1. Open the monorepo in Cursor with `docs/` present; add `docs/00-conventions.md` and the epic's spec docs to the chat context (`@docs/...`). Keep `.cursorrules` (§2) at the repo root — Cursor reads it automatically.
2. One epic per chat. Start with "Plan first": ask for the file list and approach before any code, then approve.
3. Work ticket by ticket (`E#-T##`); commit after each ticket with a Conventional Commit message; run `pnpm test` before every commit.
4. When Cursor needs an identifier the docs don't define, it must write `PROPOSED — add to 00-conventions.md` in a comment and in its report; you decide, then update `00-conventions.md` first.
5. Never let it "simplify" the seven lock states, the pill copy, the storage keys or the ad placement rules — those are contracts.
6. End every session with the report step and paste the summary into the PR description.

---

## 2. `.cursorrules` (repo root)

```
# AwakeTab — Cursor rules
You are working in the AwakeTab monorepo (Astro 5 site + vanilla-TS island, Cloudflare Pages Functions, @awaketab/wake and @awaketab/core packages, WXT extension). Read docs/00-conventions.md before anything else; it is the single source of truth for names, states, keys, routes, plans and budgets.

Hard rules
- Use identifiers from docs/00-conventions.md verbatim: lock states idle|requesting|held|lost|denied|unsupported|fallback; storage keys at.v1.*; routes; preset ids p15…pinf/custom/until; plan ids pro_yearly etc.; feature gates like ambient.packs; event names like session_start. If you need a new identifier, add a code comment `PROPOSED — add to 00-conventions.md` and list it in your final report. Never rename existing ones.
- TypeScript strict everywhere. ESM. No `any` without a comment. No new runtime dependencies in apps/web/src/tool or packages/* without stating why in the report.
- The tool island is vanilla TypeScript (no React/Vue/Preact). Content pages are Astro components. UI components come from shadcn/ui in `src/components/ui/` and are rendered at build time only — never add a `client:*` directive; React is not shipped (docs/03 ADR-013; `pnpm size` fails on `<astro-island>` or a React chunk).
- Never call alert(), confirm() or prompt(). Use the Toast system.
- Never show a running timer or "Screen awake" unless the lock state is held or fallback. The UI is a projection of engine state.
- No third-party scripts, fonts or requests on tool routes (/, presets, /until/*, /pro*, /pip, /embed/*, trust pages). Ads code may only exist in ContentLayout.astro and lib/ads.ts, gated by PUBLIC_ADS_ENABLED, and never auto-refreshes.
- All timing math uses Date.now(); never accumulate setInterval deltas. IStats day keys are LOCAL dates via Intl.DateTimeFormat('en-CA').
- Accessibility: every control keyboard-operable, visible focus, aria-live for the pill, no colour-only state, 44px targets, prefers-reduced-motion respected.
- Performance budgets (docs/00-conventions.md §11) are tests, not aspirations: keep the island's critical chunk ≤ 15 KB gz and total tool-page JS ≤ 40 KB gz.
- Every FR you implement gets a test (Vitest unit/DOM, Miniflare for functions, Playwright e2e). Engine transitions get a T## test.
- i18n: no hard-coded UI strings; use t('dot.case.key') with keys defined in src/i18n/en.json first.
- Security: no eval, no innerHTML with user data, validate every query param against an allow-list, secrets only in Pages Functions.
- Commits: Conventional Commits, one ticket per commit (feat(engine): E1-T03 …). Add a changeset for packages/* and a changelog fragment for user-visible site changes.

Working style
- Before coding an epic, produce a short plan: files to create/modify, risks, questions. Wait for approval.
- Prefer small, reviewable diffs. Explain non-obvious decisions in code comments referencing the doc section (e.g. // see docs/04-engine-spec.md §4 T05).
- When docs conflict, docs/00-conventions.md wins; flag the conflict.
- Finish every task with: summary of changes, tests added and their results, any PROPOSED identifiers, anything left undone.
```

---

## 3. `CLAUDE.md` / `AGENTS.md` (repo root — same content for any coding agent)

```
# AwakeTab — agent guide
Purpose: a browser tab that keeps the screen awake, honestly. Monorepo: apps/web (Astro 5 + vanilla-TS island + Pages Functions), apps/extension (WXT MV3), packages/wake (@awaketab/wake), packages/core (@awaketab/core), docs/.
Start here: docs/00-conventions.md (identifiers, budgets, gates) → docs/02-prd.md (requirements) → the spec for the area you touch.
Commands: pnpm install · pnpm dev · pnpm test · pnpm test:e2e · pnpm build && pnpm test:seo · pnpm -F extension dev.
Contracts you may not change without a docs update: the seven lock states and pill copy (docs/04, docs/05), storage keys (docs/08), routes and slugs (docs/00 §7), ad placement rules (docs/00 §8.3, docs/09), performance budgets (docs/00 §11), `--at-*` tokens and their shadcn aliases (docs/05 §1.1, §1.5), zero hydration / shadcn build-time only (docs/03 ADR-013).
Definition of done: acceptance criteria met, tests green, docs updated (00-conventions.md first for identifiers), changelog fragment when user-visible.
```

---

## 4. Epic prompts

### E0 · Foundation

```
Read docs/00-conventions.md (all), docs/03-architecture.md §1–§7, docs/14-devops.md §1–§7, and docs/15-implementation-plan.md → "E0". 

Goal: scaffold the monorepo exactly as docs/00-conventions.md §4 describes and get a holding page deployed to Cloudflare Pages preview.

Deliverables:
- pnpm workspace (pnpm-workspace.yaml, root package.json with scripts: dev, build, test, test:unit, test:functions, test:e2e, test:seo, lint, typecheck, size, keys:dev), Node 22 engines field, .nvmrc, .editorconfig, .gitignore.
- apps/web: Astro 5 project, TypeScript strict, Tailwind v4 with src/styles/tokens.css (empty token scaffolding using the --at-* namespace), astro.config.mjs with the i18n block from docs/07-i18n.md §2, public/_headers and public/_redirects from docs/14-devops.md §3–§4 (content-route CSP as a generated template — create scripts/headers.mjs), public/robots.txt (allow all, Sitemap line), functions/api/health.ts returning { ok: true, version }.
- packages/wake and packages/core: empty packages with tsup config, vitest config, README stubs, correct package.json fields from docs/12-library-spec.md §3 (wake) and a private core package.
- apps/extension: WXT scaffold with the manifest from docs/10-extension-spec.md §2 (no features yet).
- Tooling: ESLint (typescript-eslint, astro plugin), Prettier, stylelint with a rule forbidding physical CSS properties (docs/07 §6), Vitest, Playwright (chromium/firefox/webkit projects), size-limit config with the budgets in docs/00 §11, Lighthouse CI lighthouserc.json with the budgets, changesets init.
- .github/workflows/ci.yml, e2e.yml, lighthouse.yml, nightly.yml, release.yml as described in docs/14 §6 (release.yml may be a stub that runs changesets version only).
- A holding page at / with the correct <title>, meta description, canonical, OG tags (static placeholder image), JSON-LD WebSite + Organization, and a one-line "Coming soon" — no tool yet.
- .cursorrules and CLAUDE.md from docs/16-cursor-prompts.md §2–§3.

Constraints: no runtime dependencies beyond Astro, Tailwind, tsup, vitest, playwright, wxt and lint tooling. Do not implement engine logic here.

Acceptance: E0-T01…E0-T08 in docs/15. `pnpm install && pnpm build && pnpm test` pass on a clean clone; Lighthouse on the holding page: 100/100/100/100; `_headers` validated by a unit test that parses the file.

Tests: unit test for scripts/headers.mjs output; smoke test for /api/health under Miniflare.

Stop and report: summary, file tree, test output, any PROPOSED identifiers, what E1 will need from this scaffold.
```

### E1 · `@awaketab/wake`

```
Read docs/04-engine-spec.md §1–§5 and §14 (test hooks), docs/12-library-spec.md (all), docs/00-conventions.md §5.1 and §13.1, docs/13-testing-strategy.md §2.

Goal: implement @awaketab/wake — the lock layer with exactly seven states and the transition table in docs/04 §4.

Deliverables (packages/wake/src): index.ts (createWakeLock, classifyDenial, isWakeLockSupported), machine.ts (pure transition function `next(state, event, guards) → { state, reason, advice?, effects[] }` — keep it pure so every row is unit-testable), fallback.ts (hidden muted playsinline loop video, inlined base64 1-frame WebM and MP4 assets in src/assets/*.b64.ts, play() promise handling, 20 s currentTime nudge, pause on hidden), classify.ts (denial → TAdviceCode using visibility, secure context, iframe detection and UA), adapters/react.ts, preact.ts, vue.ts (thin), and the public types exactly as docs/12 §2.

Behaviour contract (do not deviate): states idle|requesting|held|lost|denied|unsupported|fallback. request() never throws; resolves with the resulting state. Sentinel `release` while hidden → lost (released_hidden) and re-request on visibilitychange→visible when reacquireOnVisible; release while visible → lost (released_platform) + one retry. NotAllowedError → denied with advice from classifyDenial; transient (hidden_document) retries on visible; others wait for request(). Missing API or insecure context → unsupported; request() in unsupported with fallback:'video' plays the video; play() rejection keeps unsupported and emits error. fullscreenchange re-requests while held. destroy() releases and removes everything.

Tests (Vitest): one test per transition row named T01…Tnn (docs/13 §2 lists T01–T16 minimum) using an injected fake navigator.wakeLock and document; SSR test; size-limit ≤ 3.4 KB gz for dist/index.js.

Also: README.md per docs/12 §5, CHANGELOG via changeset, tsup build producing ESM/CJS/IIFE (global AwakeTabWake).

Acceptance: E1-T01…E1-T08 in docs/15; all T## tests green; size check green; `pnpm -F @awaketab/wake build` emits d.ts.

Stop and report: transition table coverage (which rows have tests), bundle size, any PROPOSED identifiers.
```

### E2 · `@awaketab/core`

```
Read docs/04-engine-spec.md §6–§13, docs/08-data-storage.md (all), docs/00-conventions.md §5.2, §6, §13.1, docs/13-testing-strategy.md §3.

Goal: implement @awaketab/core — session engine, plans, tick, persistence, stats, capability probe, multi-tab protocol, licence token verification.

Deliverables (packages/core/src): session.ts (createSession engine: TPlan indefinite|duration|until with `wall`, TSessionStatus inactive|active|paused|completed|aborted, TEndReason set, tick as a wall-clock-aligned setTimeout chain using Date.now(), recompute on visibilitychange, LOST_TIMEOUT_MS = 21_600_000, CUSTOM_MAX_MS = 7 days, pause/resume semantics where pause releases the lock but keeps endsAt, end-of-session pipeline hooks: onEnd(reason) → callbacks for chime/notify/titleFlash/extendPrompt), storage.ts (IStorageAdapter, memoryAdapter, createStore with the exact schemas and defaults from docs/08 §2, debounced writes, migrate(), clearAll(), exportCsv()), stats.ts (local-date keys via Intl.DateTimeFormat('en-CA'), midnight splitting, streaks, 365-day pruning), battery.ts (Chromium getBattery with threshold + 2% hysteresis; no-op elsewhere), tabs.ts (BroadcastChannel('awaketab') with TTabMessage types, hello/state/bye, 10 s liveness, single-active-lock election), capability.ts (probe: browser family/version from UA-CH or UA, iOS + standalone detection, secure context, feature detection for Battery/Notifications/Document PiP/Idle Detection; output shape from docs/04 §12; support matrix loaded from src/data/support-matrix.json shape), license.ts (verifyLicenseToken with WebCrypto ECDSA P-256 against LICENSE_PUBLIC_KEYS: Record<number, JsonWebKey>; hasFeature(); re-validation cadence helpers), index.ts exports.

Constraints: framework-agnostic, zero runtime deps, works in browser and extension service worker (no DOM assumptions outside tabs.ts/battery.ts guarded by typeof checks).

Tests (Vitest, fake timers, vi.setSystemTime): tick drift-proofness, until across DST (America/New_York spring/fall), clock jumps, pause/resume coupling and every TEndReason, stats across Asia/Kolkata midnight and America/Los_Angeles DST, streaks, migration idempotence, private-mode adapter fallback, CSV columns, licence valid/expired/tampered/wrong-ver/device-mismatch/grace, BroadcastChannel election with an in-process polyfill.

Acceptance: E2-T01…E2-T10 in docs/15; coverage ≥ 90%.

Stop and report: public API listing, test matrix results, any PROPOSED identifiers.
```

### E3 · Tool island UI (Tier 0 + Tier 1)

```
Read docs/05-frontend-spec.md (all), docs/02-prd.md §4 (FR-ENGINE, FR-TIMER, FR-UI), docs/07-i18n.md §3, docs/00-conventions.md §5, §7, §11, §13.1, docs/13-testing-strategy.md §4–§5.

Goal: build the vanilla-TypeScript tool island in apps/web/src/tool that renders engine state faithfully and ships Tier 0 + Tier 1.

Deliverables: tool/main.ts (bootstrap: read URL params autostart|mode|msg|theme|preset|until|ref|source with allow-list validation; create store, wake lock, session; autostart when visible and settings.autostart — deferred if hidden with pill secondary line tool.pill.idle.deferred), tool/store.ts (tiny reactive store; no framework), tool/ui/Ring.ts (192 px SVG, dasharray math, indefinite solid, reduced motion), StatusPill.ts (seven states → t('tool.pill.*'), colours via --at-* tokens, aria-live=polite, advice secondary line), PresetChips.ts (p15 p30 p45 p60 p120 p240 pinf + Custom + Until; keyboard 1–6, 0, U), CustomDurationDialog.ts (days/hours/minutes, CUSTOM_MAX_MS, inline errors), UntilTimePicker.ts (local time, "Tomorrow"), Timer.ts (tabular-nums, HH:MM:SS, announce every 5 min), Toast.ts (no alert()), ResumeBanner.ts, ExtendPrompt.ts (+15/+30/+60/Stop, auto-stop after 5 min, endBehaviour), CapabilityNotice.ts (TAdviceCode → tool.advice.*), FallbackConsent.ts, SettingsSheet.ts (all fields in at.v1.settings incl. keyboardShortcuts and keyboardHints), ShortcutsOverlay.ts (?), ShareSheet.ts, SecondTabWarning.ts, InstallPrompt.ts (beforeinstallprompt + iOS hint), theme.ts (data-theme on <html>, color-scheme, theme-color meta), i18n.ts (t() with pre-compiled ICU messages; en.json first), styles in tokens.css/base.css.

The state → UI matrix in docs/05 is the spec: only held|fallback show a running timer; lost shows the paused timer and the toast; denied shows advice; unsupported shows the fallback consent.

Constraints: critical chunk ≤ 15 KB gz, total ≤ 40 KB gz (dynamic-import stats/ambient later), zero third-party requests, WCAG 2.2 AA, keyboard map from docs/00 §5.3, single-key shortcuts disabled when settings.keyboardShortcuts=false.

Tests: DOM tests (pill copy per state, ring math, dialog validation, extend prompt defaults, second-tab warning); Playwright journeys 1–7 and 12 from docs/13 §5 with the fake wakeLock init script; axe zero violations; size-limit.

Acceptance: E3-T01…E3-T14 in docs/15.

Stop and report: bundle sizes, journeys passing per browser, any PROPOSED identifiers (especially i18n keys you had to add — list them so en.json stays the source of truth).
```

### E4 · PWA + PiP + fullscreen

```
Read docs/05-frontend-spec.md §8–§10 (PWA, PiP, URL handling), docs/02-prd.md FR-PWA-*, FR-PIP-*, docs/00-conventions.md §7 (routes /pip), docs/14-devops.md §3 (/pip headers).

Goal: installable, offline-capable PWA with manifest shortcuts; Document Picture-in-Picture pill with a popup fallback; fullscreen handling.

Deliverables: @vite-pwa/astro config (manifest: name AwakeTab, short_name AwakeTab, start_url /?source=pwa, display standalone, theme/background colours per theme, icons incl. maskable 512, shortcuts "30 minutes" /30m?autostart=1, "Until I stop" /?preset=pinf&autostart=1, "Clock" /?mode=clock; Workbox: precache app shell + tool routes per locale, stale-while-revalidate for content pages, network-only for /api, offline fallback = the tool; update flow with tool.toast.update that never interrupts an active session; SW-driven notifications for timer end via showNotification), src/pages/pip.astro + tool/pip/ (documentPictureInPicture.requestWindow({width:280,height:120}), move pill+timer, sync via store/BroadcastChannel; fallback window.open('/pip', …) when unsupported), fullscreen toggle (F) with re-request on fullscreenchange, apple-touch-icon and iOS meta.

Tests: Playwright: install prompt event handling, offline reload serves the tool, /pip fallback in webkit, notification permission flow mocked; Lighthouse PWA installable check.

Acceptance: E4-T01…E4-T07 in docs/15.

Stop and report as usual.
```

### E5 · Site shell, home content, SEO plumbing, trust pages

```
Read docs/06-content-seo-spec.md (all), docs/02-prd.md §4 FR-SEO-*, FR-CONTENT-*, docs/00-conventions.md §7, §13.2, docs/14-devops.md §4.

Goal: the Astro site around the island: layouts, SEO head, JSON-LD, OG image generation, sitemaps, hreflang plumbing, hub pages, trust pages, preset deep-link pages, 404.

Deliverables: layouts BaseLayout.astro (tool routes, strict CSP class) and ContentLayout.astro (content routes; ad slot placeholders wired but disabled), components/SeoHead.astro (title formula "{Intent} — AwakeTab" ≤ 60, description ≤ 155, canonical, hreflang from a helper that reads existing translations, OG/Twitter), lib/seo.ts (JSON-LD builders: WebSite+Organization+WebApplication for /, Article+BreadcrumbList for content, Person for /about; aggregateRating only when data/ratings.json has ≥ 25), lib/og.ts + build script (satori + resvg per page/locale, ring + title), content collections with zod frontmatter schemas from docs/06 §3 (incl. author/published/updated, translationOf, lastVerified), src/i18n/slugs.json, src/data/support-matrix.json (initial rows from docs/00 §11 browser support), pages: index.astro (tool + full home content per docs/06 §2: ~1,200–1,800 words, support matrix table, honest limits, 8 FAQs as <details>), preset pages 15m 30m 45m 1h 2h 4h 8h (indexable, self-canonical, preset pre-selected), until/[time].astro (noindex, canonical /), hub pages /for /on /vs /guides /learn, trust pages /about /privacy /terms /changelog (built from changelog/*.md fragments), 404.astro (with the tool), sitemap-index generation with real lastmod, robots.txt, `_redirects` entries for /support-matrix and /how-we-tested.

Tests: the SEO build suite from docs/13 §8 (one h1, title/description lengths, canonical, hreflang reciprocity, JSON-LD validity, sitemap coverage, noindex exclusions, internal links); Lighthouse SEO 100.

Acceptance: E5-T01…E5-T09 in docs/15.

Stop and report; list every page generated and its title.
```

### E6 · i18n

```
Read docs/07-i18n.md (all), docs/06-content-seo-spec.md §5, docs/00-conventions.md §7, §13.5.

Goal: eight launch locales for the UI and the home page; plumbing for translated content pages.

Deliverables: src/i18n/{en,es,pt-br,de,fr,ja,zh,hi}.json with every key used in code (extract with a lint rule that fails on hard-coded strings in tool/), pre-compiled ICU messages (build step), t()/fmt helpers, <html lang> and dir handling, locale switcher in the footer (links to same page in other locales when they exist, else the locale home), Accept-Language one-time suggestion banner (dismiss stored in at.v1.onboarding.dismissedTips as lang-suggest; never auto-redirect), translated home page MDX for the 7 non-English locales (machine first draft clearly marked `reviewed: false` in frontmatter; the build shows a warning list of unreviewed pages and excludes them from the sitemap until reviewed: true), translated slugs map, hreflang for all existing pages.

Tests: missing-key parity, placeholder parity, length lint for pill/chip keys (≤ 1.6× English), hreflang reciprocity across locales, layout screenshots at 320 px per locale (visual).

Acceptance: E6-T01…E6-T06 in docs/15.

Stop and report; include the list of pages still `reviewed: false`.
```

### E7 · Content production

```
Read docs/06-content-seo-spec.md §2–§4, §8–§12 (templates, slug lists with intents, presets and honest limits, editorial workflow), docs/00-conventions.md §7 slug lists, the scenario table in awaketab-blueprint.md §04 if available in docs/.

Goal: produce the English content pages in priority order with the required structure: 18 /for, 12 /on, 8 /guides, then 7 /vs and 6 /learn.

For each page: frontmatter per schema (title ≤ 60 with the formula, description ≤ 155, h1 matching intent, intent, secondaryQueries, preset, mode, lastVerified, browsers/os, faq[3–5], honestLimit, related[≥3], author), body 600–1,000 words of specific, verified substance (versions from src/data/support-matrix.json only; no templated filler; concrete steps with OS menu paths), the tool embedded with the scenario preset (data-preset/data-mode), the honest-limit callout, FAQs as <details>, related links.

Process: write a page, run `pnpm build && pnpm test:seo`, fix, commit as content(for): <slug>. Do them in the order listed in docs/06 §11 (top 10 first).

Never claim: works when the tab is hidden; keeps Teams/Slack available; prevents lid-close sleep; anything not in the support matrix.

Acceptance: E7-T01…E7-T08 in docs/15; every page passes the SEO suite; internal link graph has no orphans.

Stop and report after each batch of 6 pages with titles and word counts.
```

### E8 · Analytics beacon and `/api/e`

```
Read docs/08-data-storage.md §5, docs/18-analytics-kpis.md §3–§4, docs/00-conventions.md §9–§10, §13.4, docs/03-architecture.md (security: rate limiting), docs/13-testing-strategy.md §9.

Goal: first-party, cookieless analytics: client beacon + Pages Function + Analytics Engine mapping + SQL notebook.

Deliverables: apps/web/src/lib/analytics.ts (queue, batch ≤ 20 events/≤ 8 KB, navigator.sendBeacon on pagehide/visibilitychange, per-tab random sid in memory only, ua/viewport classes, honours settings.telemetry, `source` from URL/env, client_error sampled 10%), functions/api/e.ts (schema validation with an allow-list, size limits, IP-hash rate limit using RATE_LIMIT_SALT with KV counters rl:*, write to EVENTS with the exact column mapping in docs/08 §5), functions/api/csp.ts (CSP reports → client_error code csp), docs/metrics/queries.sql (the KPI queries from docs/18 §4), a tiny Worker-side or script-side weekly report generator that fills docs/metrics/YYYY-MM.md.

Tests (Miniflare): valid/invalid batches, 413 on >20 events, unknown fields dropped, rate limit 429, no IP persisted (assert KV/AE payloads). Client: unit tests for batching and the telemetry toggle; e2e asserts the beacon fires lock_state and session_start with correct fields.

Acceptance: E8-T01…E8-T06 in docs/15.

Stop and report.
```

### E9 · Monetization G0–G2

```
Read docs/09-monetization-impl.md (all), docs/00-conventions.md §8, §9, §13.3, docs/08-data-storage.md §2.4, §4, docs/13-testing-strategy.md §9, docs/14-devops.md §2 (secrets).

Goal: donations links (G0), the ads loader + slots + consent for content pages (G1, shipped disabled), and AwakeTab Pro licensing end-to-end (G2).

Deliverables:
- G0: footer/about Buy Me a Coffee link (no widget script); GitHub Sponsors link in packages/wake/README.
- G1: components/AdSlot.astro (fixed sizes, data-size-sm), lib/ads.ts (only imported by ContentLayout; PUBLIC_ADS_ENABLED gate; skip when hasFeature('ads.free'); skip without CMP consent in EEA/UK/CH; load after LCP via PerformanceObserver + requestIdleCallback; IntersectionObserver lazy slots; ad_slot_loaded event; remote kill switch /config/ads.json cached 5 min), public/ads.txt placeholder, CMP integration point (Google-certified CMP / Funding Choices) on content routes only, lint rule + e2e proving no ad code on tool routes.
- G2: functions/_lib/jwt.ts (ES256 sign/verify with WebCrypto, `ver` claim), functions/_lib/polar.ts (license key validate/activate/deactivate client), functions/api/license/activate.ts, validate.ts, deactivate.ts, functions/api/webhooks/polar.ts (HMAC verify, 5-min timestamp window, idempotency wh:{eventId} 30 d, handle order.created, subscription.canceled/revoked, benefit_grant.revoked, refunds → status), functions/api/embed/config.ts, functions/api/rating.ts, KV records exactly as docs/08 §4 (keyEnc with AES-GCM), pages /pro (pricing with PLAN_PRICES, CHECKOUT_LINKS, PRO_LAUNCH_END strike-through logic, refund policy 14 days), /pro/activate (key entry, ?checkout_id and ?ext=1 handling, error UX table), /pro/manage (device list, deactivate), client lib/license.ts using @awaketab/core verifyLicenseToken + re-validation cadence, feature gating affordances (locked badge + Pro sheet; never dark patterns).

Tests: Miniflare tests for all endpoints (happy path, activation_limit on 6th device, revoked, polar_unavailable with no KV write, HMAC failure, idempotent replay); token round-trip; e2e journey 9 (mocked API); e2e journey 11 (ads guard).

Acceptance: E9-T01…E9-T10 in docs/15.

Stop and report; include the exact KV keys written in tests and the list of secrets required in .dev.vars.example.
```

### E10 · Engagement (Tier 2)

```
Read docs/05-frontend-spec.md §3.14–§3.22 (AmbientShell, FocusMode, MessageMode, CookMode, StatsPanel, RatingPrompt, SponsorCard placement), docs/04-engine-spec.md §9–§11 (end pipeline, battery, stats), docs/02-prd.md FR-AMBIENT-*, FR-STATS-*, docs/09-monetization-impl.md §4 (sponsor card, disabled behind PUBLIC_SPONSOR_ENABLED), docs/00-conventions.md §8.2 gates.

Goal: the features that bring people back — as dynamically imported modules so the critical bundle stays ≤ 15 KB gz.

Deliverables: tool/ambient/ (AmbientShell with modes standard|clock|focus|minimal|night|message|cook; auto-hide 3 s; pixel shift ±2 px/60 s; wake on pointer; fullscreen), FocusMode (25/5 × 4, cycle counter), MessageMode (≤ 80 chars, sanitized, gated ambient.message), CookMode (big elapsed timer, tap-anywhere pause, up to 3 kitchen timers in session.modeState.cookTimers), end-of-session pipeline (one free chime via Web Audio; sounds.custom gates more; SW notification when settings.notifications; title flash; ExtendPrompt with session_extend event), battery auto-stop UI (hidden when API absent), StatsPanel (today/week/streak/12-week heatmap; stats.history and stats.export gates; CSV export), theme accent picker + OLED, SecondTabWarning wiring, burn-in guard, RatingPrompt after the 5th completed session (rate/later/never; POST /api/rating on submit; rating_prompt and rating_submitted events), SponsorCard slot reserved in idle/held states and the extend prompt (renders only when PUBLIC_SPONSOR_ENABLED=1 and /config/sponsor.json is valid).

Constraints: every ambient module lazy-loaded; visual regression screenshots per mode × theme; reduced motion disables pixel shift and animations.

Tests: DOM tests for gating (free vs Pro), CookMode pause, heatmap data mapping, RatingPrompt conditions; e2e journey 6; visual regression; size-limit unchanged for the critical chunk.

Acceptance: E10-T01…E10-T09 in docs/15.

Stop and report with bundle sizes per lazy chunk.
```

### E11 · Extension

```
Read docs/10-extension-spec.md (all), docs/08-data-storage.md §3, docs/09-monetization-impl.md §2 (licence reuse), docs/13-testing-strategy.md §10, docs/17-launch-checklist.md (extension submission).

Goal: AwakeTab for Chrome (WXT, MV3, Chromium) with the shared vocabulary and Pro licence reuse.

Deliverables (apps/extension): manifest per docs/10 §2, background.ts (chrome.power requestKeepAwake display|system, session via @awaketab/core with source 'ext', persistence to chrome.storage.local at.v1.*, re-issue on onStartup/onInstalled/alarms, chrome.alarms 0.5-min ticks, commands toggle Alt+Shift+A, badge ON/SYS, schedules (Pro ext.schedules) and auto-start rules (Pro ext.autostart, optional host permissions requested per site), optional notifications with +30 min/Stop buttons), popup (pill, level toggle, presets, until, timer, Open AwakeTab link with ?source=ext), options (all sections in docs/10 §6; licence activation via /api/license/activate with a per-profile deviceId; telemetry opt-in default off), i18n reuse of the web keys, store assets folder with the listing copy from docs/10 §9 and permission justifications.

Constraints: no remote code, no synthetic input, no host permissions by default, licence token never in chrome.storage.sync.

Tests: unit (level mapping, schedule→alarms across DST, matcher); Playwright with the unpacked extension and a chrome.power mock (start/stop, badge, restart persistence, activation against a mocked API).

Acceptance: E11-T01…E11-T08 in docs/15.

Stop and report; include the zip build path and the permission justification text.
```

### E12 · Embed widget, library publishing, `/library`, research page

```
Read docs/11-embed-spec.md (all), docs/12-library-spec.md §5–§8, docs/06-content-seo-spec.md (learn pages), docs/13-testing-strategy.md §11 (device matrix template), docs/14-devops.md §3 (/embed headers), §6 (release.yml).

Goal: ship the Cook Mode embed, publish @awaketab/wake to npm with provenance, build the /library demo, and publish /learn/how-we-tested from the device-matrix results.

Deliverables: public/embed.js loader (≤ 3 KB gz; renders the iframe with allow="screen-wake-lock", sandbox, lazy; window.AwakeTabEmbed helper; postMessage protocol awaketab:ready|state|resize|start|stop|theme with origin checks), src/pages/embed/cook.astro + tool/embed/ (trimmed island ≤ 25 KB gz; attribution link; GET /api/embed/config lookup; iframe_no_allow state; at.v1.embed.settings), /embed sales page, /kiosk page (licence unlocks via #lic= hash and logo= param per docs/09 §7), /library demo page bound to the published package (IIFE build), release.yml completion (changesets + npm publish --provenance), README badges, /learn/how-we-tested MDX generated from docs/metrics/device-matrix.json (PROPOSED path — accepted) with the results table, and updates to src/data/support-matrix.json from those results.

Tests: e2e journey 10 (embed with/without allow), loader size-limit, postMessage origin rejection test, /embed/* headers test (frame-ancestors *, noindex), npm pack dry-run contents check.

Acceptance: E12-T01…E12-T08 in docs/15.

Stop and report; include the npm dry-run file list and the embed snippet exactly as users will paste it.
```

---

## 5. Utility prompts

### U1 · Write a `/for` page from a brief

```
Read docs/06-content-seo-spec.md §2.3 (the /for template), §3 (frontmatter), §9 (quality bar) and the slug row for "<slug>" in §11. Read src/data/support-matrix.json.

Write src/content/for/en/<slug>.mdx for intent "<target query>". Frontmatter complete per schema (title with the "{Intent} — AwakeTab" formula ≤ 60 chars; description ≤ 155; h1 = the intent phrased as the reader would; preset <preset>; mode <mode>; lastVerified today; browsers/os as relevant; 4 FAQs; honestLimit exactly: "<limit text>"; related: 3 existing slugs; author: soubhik). Body 700–900 words: open with the answer in the first 100 words; a "How to" section with concrete steps; a scenario-specific section (what else helps in this situation); the honest-limit callout component; "Works on" section citing versions from the support matrix only; FAQs as <details>. No filler, no claims beyond the matrix, no keyword stuffing. Then run pnpm build && pnpm test:seo and fix any failure. Report title, description, word count and the internal links used.
```

### U2 · Translate a page with native-quality review notes

```
Read docs/07-i18n.md §5, §7, §8 and the English source src/content/<collection>/en/<slug>.mdx. Produce src/content/<collection>/<locale>/<translated-slug>.mdx with translationOf set, reviewed: false, a localized title targeting the <locale> query "<localized query>" (not a translation of the English title), all limits preserved verbatim in meaning, product terms untranslated, and add the slug to src/i18n/slugs.json. Then write a reviewer brief (10 lines) listing the passages a native reviewer must check most carefully (idioms, UI label quotes, units). Do not set reviewed: true.
```

### U3 · Run the pre-launch checklist

```
Read docs/17-launch-checklist.md §<phase>. For each checkbox, verify it against the repository and the preview deployment at <URL> using the available tools (build output, curl the headers, run pnpm test:seo, Lighthouse CI, Playwright). Produce a table: item · status (pass/fail/manual) · evidence (command + result or file path) · fix needed. Do not tick anything you could not verify; mark it manual and say exactly what I need to check by hand.
```

### U4 · Triage a bug report against the engine state machine

```
Read docs/04-engine-spec.md §3–§5 and packages/wake/src/machine.ts. Bug report: "<paste>". Determine: (1) the expected transition row(s) for the reported browser/OS/visibility/battery situation; (2) what the pill should have shown; (3) whether the report indicates a wrong transition, a missing advice code, a UI projection bug, or a platform behaviour we already document as a limit. Write a failing Vitest test (T## style) that reproduces the expected behaviour, then propose the fix. If the root cause is a documented platform limit, propose the copy/advice change instead and say which doc to update.
```

---

## 6. Prompt hygiene reminders

- Paste the epic prompt, then immediately add the doc files with `@`. Cursor's context window is finite: for E7 add only the template section and the slug row you are working on.
- If Cursor proposes a dependency, ask for the size impact against `docs/00-conventions.md §11` before accepting.
- After each epic, update `docs/15-implementation-plan.md` ticket status in the PR, and if any identifier changed, `docs/00-conventions.md` first.
