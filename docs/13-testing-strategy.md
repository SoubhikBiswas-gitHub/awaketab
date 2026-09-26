# 13 · Testing strategy

Status: v1.3 · 2026-09-26 · Owner: Soubhik

**Purpose.** The product's one promise is "the pill never lies". This document defines the tests that prove it — from the state machine to real devices — plus the SEO, performance, accessibility and API checks that protect the other goals. Everything here is automated except the device matrix, whose results are published as `/learn/how-we-tested`.

Related docs: `04-engine-spec.md` (what is being tested) · `08-data-storage.md` §8 (fixtures) · `06-content-seo-spec.md` (SEO rules) · `09-monetization-impl.md` (licence/ads) · `14-devops.md` (CI gating) · `00-conventions.md` §11 (budgets).

---

## 1. Pyramid and tooling

| Layer | Tool | Runs on | Blocks merge? |
|---|---|---|---|
| Unit (`packages/*`, `apps/web/src/lib`) | Vitest + fake timers | every PR | yes |
| DOM/component (`apps/web/src/tool`) | Vitest + happy-dom | every PR | yes |
| Pages Functions | Vitest (node) against the handlers with in-memory KV / Analytics Engine / Polar fakes (`apps/web/test/functions/harness.ts`; §9 says why not Miniflare) | every PR | yes |
| E2E (chromium) | Playwright | every PR (preview URL) | yes |
| E2E (firefox, webkit) + visual regression | Playwright | nightly + release | release only |
| Accessibility | axe-core in Playwright + manual SR checklist | every PR (axe) | yes (axe) |
| Performance | Lighthouse CI + `size-limit` (packages) + `pnpm size` (`apps/web/scripts/size.mjs` over `dist/`, incl. the zero-hydration check) | every PR (size) / preview (LHCI) | yes |
| SEO build checks | custom Vitest suite over `dist/` | every PR | yes |
| Extension | Vitest + Playwright (extension loaded) | PR touching `apps/extension` | yes |
| Device matrix | manual, templated | before each phase exit and each browser major | gate |

Coverage targets: `@awaketab/wake` 100% of transition rows; `@awaketab/core` ≥ 90% lines; functions ≥ 90%; UI components ≥ 70%.

---

## 2. `@awaketab/wake` unit tests

Fake `navigator.wakeLock` injected via `navigatorLike`; fake `document` with controllable `visibilityState` via `documentLike`.

```ts
class FakeSentinel extends EventTarget { released = false; type = 'screen'; release = async () => { this.released = true; this.dispatchEvent(new Event('release')); } }
const fakeWakeLock = { request: vi.fn(async () => new FakeSentinel()) };
```

| ID | Scenario | Expect |
|---|---|---|
| T01 | `request()` resolves | `idle → requesting → held`, reason `acquired` |
| T02 | `request()` rejects `NotAllowedError` while visible & plugged | `denied`, advice `battery_saver` (UA-agnostic default), one retry after `baseMs` |
| T03 | rejects `NotAllowedError` while `hidden` | `denied`, advice `hidden_document`; auto re-request on visible → `held` |
| T04 | rejects `SecurityError`/insecure context | `unsupported` with `insecure_context` |
| T05 | sentinel `release` while hidden | `held → lost` (`released_hidden`); visible → `requesting → held` |
| T06 | sentinel `release` while visible | `lost` (`released_platform`) → single retry → `held` or `denied` |
| T07 | `navigator.wakeLock` undefined | `unsupported` at creation; `request()` → fallback path |
| T08 | fallback `play()` resolves | `unsupported → fallback`, video element attached, nudge timer armed |
| T09 | fallback `play()` rejects (autoplay) | stays `unsupported`, `error` emitted, no video left attached |
| T10 | `release()` from `held` / `fallback` | `idle` (`user_release`); sentinel released; video paused and removed |
| T11 | `destroy()` | listeners removed; further `request()` is a no-op resolving `idle` |
| T12 | `fullscreenchange` while `held` | re-request issued exactly once |
| T13 | in iframe without `allow` (`permissions policy` rejection) | `denied`, advice `iframe_no_allow` |
| T14 | UA iOS 16.0 Safari | `classifyDenial` → `ios_safari_old`; UA Firefox 120 → `firefox_old` |
| T15 | retry exhaustion | 3 attempts then `denied` stays until `request()` |
| T16 | SSR (`window` undefined) | inert handle, `supported=false`, no throw |

---

## 3. `@awaketab/core` unit tests

### 3.1 Tick algorithm (fake timers + `vi.setSystemTime`)

- Duration plan 90 min: after 90 min of wall time (advanced in 1 s steps and in one 5 min jump) `status='completed'`, `endReason='completed'`; timer never drifts (compare against `endsAt`).
- Clock jumps forward 1 h during `until` → session ends immediately if past `endsAt`; jumps backward → continues, `wall` unchanged.
- DST: `until 02:30` on the spring-forward night in `America/New_York` resolves to 03:30 wall time; the fall-back night ends at the first 01:30.
- `visibilitychange` after 40 min hidden → one recompute, no burst of ticks.

### 3.2 Pause/resume and coupling

Lock `lost` → `paused` with `pausedAt`; re-`held` → `active`, `pausedMs` accumulated, `endsAt` unchanged; paused ≥ `LOST_TIMEOUT_MS` → `aborted` `lost_timeout`; `denied` mid-session → `aborted` `denied`; battery threshold crossed (fake `getBattery`) → `battery`, hysteresis prevents flapping at ±2%.

**M6 additions** (`packages/core/test/session-m6.test.ts`): `pause({ keepLock: true })` freezes the clock but keeps the lock `held`, while a plain `pause()` still releases; `addTime` grows a `duration` plan in place, turns an `until` plan into a `duration` with the same moved deadline, and ignores `indefinite`, non-positive and over-`CUSTOM_MAX_MS` values; `updateSession` persists `mode` and `modeState`; `stop()` after completion releases the extend-prompt grace lock; state snapshots are broadcast and an `intent` addressed to the engine's `tabId` is obeyed (others ignored); a `hello` is answered with a snapshot; battery at 14% with a 15% threshold ends the session once, warning first.

### 3.3 Stats

Fixtures `stats.kolkata-midnight.json` and `stats.la-dst.json`: a session 23:30–00:30 in `Asia/Kolkata` writes 30 min to each local day (never to the UTC day); streak counts consecutive local days with ≥ 1 min; 365-day pruning; CSV export matches columns.

### 3.4 Storage

Defaults applied for missing fields; corrupt JSON → defaults + one `client_error storage_unavailable`? (no — corrupt value → defaults silently; only a throwing adapter emits the error); private-mode adapter → memory fallback; `migrate()` idempotent; `clearAll()` removes every `at.*` key.

### 3.5 Licence verification

Valid token → features; expired → none; tampered payload → none; unknown `ver` → none; device mismatch → none; grace: yearly token 3 days past `exp` with `lastValidatedAt` recent → still valid; kiosk token verified offline for 365 d.

### 3.6 i18n and content

Missing-key parity across 8 locales; placeholder parity; frontmatter zod schemas accept fixtures and reject bad `lastVerified`; `slugs.json` uniqueness per locale.

E6 additions (as built, 2026-09-26):

| File | Covers |
|---|---|
| `apps/web/scripts/translations.test.ts` | `frontmatterScalars` (top-level scalars only), `publicSlug`/`contentPath` with the EN-slug fallback, `ogImagePath`, `isIndexable` (EN always; translations only with `reviewed: true`; `noindex` wins), `alternatesFor` reciprocity on a fixture (every indexable member lists the same set incl. self; an unreviewed page emits nothing and is never listed), BCP 47 hreflang (`pt-BR`, `zh-Hans`), `readContentIndex` over a temp tree |
| `apps/web/test/i18n/rtl.test.ts` | RTL readiness for phase-2 `ar` (07 §6): `textDirection()` → `rtl` for `ar`/`he`/`fa`/`ur`, `ltr` for all 8 launch locales; `BaseLayout.astro` plumbs `dir` through `textDirection(htmlLang)` and no page renders its own `<html>`; no physical-direction Tailwind utilities (`ml-`/`pr-`/`left-`/`border-l`/`rounded-r`/`text-left`…) in `src/components`, `src/layouts`, `src/pages`, `src/tool` (CSS files are covered by stylelint `liberty/use-logical-spec`); the `[dir="rtl"]` icon-mirroring rule exists in `tokens.css` |

---

## 4. DOM/component tests (happy-dom)

Pill copy for each of the seven states equals `en.json`; ring `stroke-dashoffset` math for 0/50/100% and indefinite; `CustomDurationDialog` validation (0 → error; 7 d + 1 min → max error); `UntilTimePicker` shows "Tomorrow" when the wall time already passed; `ExtendPrompt` default 30 min and auto-stop after 5 min; `SecondTabWarning` appears when a fake `BroadcastChannel` peer says `held`; `RatingPrompt` shows only when `meta.sessionCount ≥ 5` and `ratingPrompt.action` is null.

M6 engagement-layer files (Vitest + happy-dom; `apps/web/test/tool/ctx-helper.ts` builds a fake `IToolCtx`; `vitest.setup.ts` loads the English catalog into `setCatalog()` because the island no longer bundles strings):

| File | Covers |
|---|---|
| `apps/web/test/tool/ambient.test.ts` | Gating (only `message`), `M` cycle order and skip toast, focus maths (130 min block, phases, pause-aware elapsed), cook timers (add/limits/name sanitising/settle, defensive read), message resolution, pixel shift bounds, `shouldDim` (night 30 s, OLED 30 min), shell mount/exit |
| `apps/web/test/tool/stats.test.ts` | Heatmap 7 × 12 Monday-first, local-date keys (not UTC), future and locked cells, quartile levels, `summarise` |
| `apps/web/test/tool/end.test.ts` | `onEnded` skips `user`/`denied`; completed → chime, notification, title flash, session count only ≥ 5 min; extend prompt and grace lock; `flashTitle` cadence and minimum |
| `apps/web/test/tool/rating.test.ts` | `ratingEligible` (5 sessions, `later` re-arm at +10, `never`/`rated` final); `maybeShowRating` busy guards, events, `Esc` = later |
| `apps/web/test/tool/pip-mirror.test.ts` | `PIP_ADD_MS` kept equal in `pip.ts` and `pip-mirror.ts`; `pickOwner`; `mirrorTime` for each plan type and pauses; `mountMirror` stale fallback and `intent` posting |
| `apps/web/test/tool/accent.test.ts` | `accentId`/`applyAccent` incl. pack fallback; every palette in `tokens.css` meets the §1.1a contrast rules (AA) |
| `apps/web/test/tool/settings.test.ts` | `fillSettings` → `readSettings` round trip; gated values (pack accents, message) keep stored values; `openSettings` |
| `apps/web/test/tool/pwa.test.ts` | `sessionBusy`; `watchUpdates` (FR-PWA-01): offered at once when idle, never during a live session and offered when it ends, Reload posts `SKIP_WAITING` and reloads once after `controllerchange`, no reload on an unrequested `controllerchange`, a worker that finishes installing later is offered |
| `apps/web/test/tool/sponsor.test.ts` | `parseSponsor`: valid config, trimming and caps, rejects bad ids/markup/non-`https` URLs and disabled configs |
| `apps/web/test/tool/actions.test.ts` | `sharePath` (§3.20): preset routes, running session wins over the selected chip, `/until/HH-MM`, never a query string or `ref` |
| `apps/web/scripts/sw.test.ts` | `precacheManifest()` (§8.2 of 05): shell pages by navigation URL with content revisions, static files, locale manifests and icons, hashed `_astro` JS/CSS with `revision: null` and nothing else, sorted without duplicates, fails loudly on a missing shell page; `_headers` serves `/sw.js` with `Cache-Control: no-cache` |

M8 (E12) files — embed widget, loader, kiosk unlocks, library demo, research page, build gates:

| File | Covers |
|---|---|
| `apps/web/test/tool/embed-protocol.test.ts` | Loader attribute defaults and allow-lists, BCP 47 → locale mapping, `until` validation, iframe query order and round trip, hostname validation, every page command accepted/rejected (bad preset, fractional/out-of-range `ms`, bad `until`, unknown types), widget events and the resize clamp |
| `apps/web/test/tool/embed-loader.test.ts` | The loader replaces its tag with an iframe carrying `allow="screen-wake-lock"`, `loading="lazy"`, `referrerpolicy`, `EMBED_SANDBOX`, the localized title and box; origin taken from the script `src`; `<head>` tags moved to `<body>`; one `window.AwakeTabEmbed`; commands queued until `ready` and posted only to the widget origin; malformed commands dropped; **state/resize from a wrong origin, a wrong source or no source ignored**; resize never below the reserved box |
| `apps/web/test/tool/embed-bridge.test.ts` | `parentOrigin()` (ancestorOrigins, referrer fallback, opaque/unknown → null); **the widget accepts commands only from `window.parent` at the verified origin, rejects a parent whose origin mismatches the declared `host`**, posts to the exact origin, inert when unembedded; Permissions-Policy detection; `embedAdvice()` |
| `apps/web/test/tool/embed-app.test.ts` | `planFor`, `digitsFor` (running only in `held`/`fallback` and unpaused), boot in the requested locale, Start → `held`, tap-to-pause keeps the lock, denied → power advice, no licence request without a verified parent, analytics `source`/`path`, no writes to the app's `at.v1.*` keys (uses the real `cook.astro` markup) |
| `apps/web/test/tool/embed-config.test.ts` | Config parsing (attribution removed only for licensed + `attribution: false`, unsafe brand values ignored), fetch failure/500/timeout → free, black/white label ≥ 4.5:1 for a colour sweep, branding on the root only; `at.v1.embed.settings` round trip and defensive reads |
| `apps/web/test/tool/embed-timers.test.ts` | Quick-add labels, three-timer cap, session started, wall-clock finish with flash/chime/announcement, remove, resume after reload |
| `apps/web/test/tool/embed-kiosk.test.ts` | `#lic=` parsing; kiosk-plan tokens stored without device binding and the hash stripped; Pro tokens and bad signatures rejected with a toast; `logo=` https-only/credential-free/length-capped; logo and `data-kiosk` only with the licence features |
| `apps/web/test/tool/embed-snippet.test.ts` | The default snippet string exactly as sites paste it, generator output parsed back by the loader, bare-iframe snippet keeps `allow`, kiosk URL builder (token in the hash only), the widget catalog subset covers every `t()` key the widget uses |
| `apps/web/test/lib/library-demo.test.ts` | Demo scenarios over the real library: simulated hide → `lost` → `held`, denied + advice, unsupported; `bindDemo` waits for the IIFE and marks visited states |
| `apps/web/test/lib/device-matrix.test.ts` | The example `docs/metrics/device-matrix.json` is valid and pending (14 rows, no outcomes), ids exist in `support-matrix.json`, schema rejections, `verifiedDates`, the sync hook writes nothing while pending and stamps `lastVerified` only for passing rows |
| `apps/web/scripts/size.test.ts` | Closure semantics on a fixture dist: critical = static closure, total = static + dynamic, other pages never counted, embed page measured from its own entry, cycles |
| `apps/web/scripts/embed-loader.test.ts` | Committed `public/embed.js` equals the build of `loader.ts`; loader ≤ 3 KB gz, no imports, 8 frame titles inlined; the iframe app bundle is self-contained and ≤ 25 KB gz |
| `apps/web/scripts/headers.test.ts` (extended) | `resolveHeaders()` over the generated **and the shipped** `_headers`: `/embed/cook` frameable (`frame-ancestors *`, no `X-Frame-Options`, `noindex`), `/embed` and `/embed/` and every other route `DENY` + `frame-ancestors 'none'`, no joined duplicate `Cache-Control`, tool CSP scripts/connections `'self'` |
| `packages/wake/test/pack.test.ts` | `npm pack --dry-run --json`: 1.0.0, public + provenance, exact file list, every `exports`/`unpkg` target packed, no `src`/`test`/config files, adapters import the core |
| `apps/web/functions/api/embed/config.test.ts` (extended) | Unknown → free and cached; licensed → theme validated; `www.`/`staging.`/deeper subdomains covered, look-alike domains not; expired and revoked/refunded → free; malformed domains never read KV; embed analytics columns (`host` → blob6, `target` → blob7) |

---

## 5. End-to-end (Playwright)

Setup: `playwright.config.ts` sets `serviceWorkers: 'block'` for every test, because `page.route()` cannot see requests a service worker makes and an active SW would silently bypass every API mock; the offline journey opts back in with `test.use({ serviceWorkers: 'allow' })`. `page.addInitScript` installs a controllable fake `navigator.wakeLock` (exposes `window.__at.releaseAll()`, `window.__at.rejectNext('NotAllowedError')`) and a `document.visibilityState` override with a `window.__at.setVisibility('hidden')` helper that also dispatches `visibilitychange`.

Journeys (chromium on every PR; all three engines nightly):

1. **Auto-start** — open `/` → pill "Screen awake" within 300 ms of `DOMContentLoaded` (`lock_state` event asserted via a beacon interceptor).
2. **Preset** — click `2 h` → timer shows `02:00:00`, ring animates, `at.v1.session` written with `plan.type='duration'`.
3. **Until** — `U` → pick 17:30 → timer "Until 17:30"; if past, "Tomorrow" shown.
4. **Hidden → lost → re-acquire** — `setVisibility('hidden')` → pill "Paused — tab hidden", no `alert()` (dialog listener fails the test); `setVisibility('visible')` → "Screen awake", toast "Screen awake again".
5. **Denied** — `rejectNext` → pill "Blocked — here's the fix", advice text present, ring not active, timer hidden.
6. **Timer end → extend** — 1-minute custom with fast-forwarded clock → chime (a stub `AudioContext` counts `createOscillator()` calls after a priming `pointerdown`), title flash, extend prompt; `+30 min` → session continues.
7. **Reload → resume** — mid-session reload → resume banner with remaining time; accept → lock re-requested.
8. **PiP** — `P` in chromium → `documentPictureInPicture` stub called; in webkit → popup fallback opened.
9. **Pro activation** — mock `/api/license/activate` → badge "Pro", `ambient.packs` unlocked; mock `revoked` on validate → gated again with toast.
10. **Embed** — test page with the loader (`allow` present) → iframe `held`; without `allow` → "Ask the site owner" state. *As built (M8, `apps/web/test/e2e/m8.spec.ts`):* the host page is served by `page.route` on `http://localhost:<port>` while the widget comes from `http://127.0.0.1:<port>` — two origins, both secure contexts — so the widget is genuinely cross-origin; Chromium's Local Network Access checks are disabled for that file only (they block a route-fulfilled document from reaching the loopback server). Headless Chromium denies real wake locks, so every frame gets a fake that, like the browser, rejects with `NotAllowedError` when `document.featurePolicy` disallows `screen-wake-lock`. The file also covers the `AwakeTabEmbed` API (start/state/stop), **origin rejection both ways** (declared-host mismatch, a sibling window posting to the widget, same-window forgeries to the loader), licensed branding via a mocked `/api/embed/config`, full-size kitchen timers, the `/embed` snippet and generator, the `/kiosk` URL builder, an invalid `#lic=` stripped and reported, the `/library` demo through all seven states on the published IIFE (media element stubbed — headless Chromium never settles `play()` on the inlined videos), and axe on `/embed/cook` (light, dark), `/embed`, `/kiosk`, `/library`.
11. **Ads guard** — on `/`, `/30m`, `/pip` no request to any ad host (network assertion); on `/for/cooking` with `PUBLIC_ADS_ENABLED=1` the ad script loads only after the LCP entry.
12. **Second tab** — two pages on the same context → second shows the warning.

M6 journeys (`apps/web/test/e2e/m6.spec.ts`; a `dialog` listener fails any test that opens a native dialog):

13. **Ambient** — `M` from `standard` opens `clock`; `Esc` leaves the mode without stopping the session; `?mode=night` opens night mode on the `oled` palette.
14. **Cook** — tap pauses the clock while the pill still reads "Screen awake"; a kitchen timer is stored in `modeState.cookTimers` and finishes with a toast.
15. **Message** — a shared `msg=` previews for 60 s (fake clock) then falls back to `clock`; without `msg=` the sample text and Pro card show.
16. **Stats** — the panel shows today, a 7-row heatmap and the free-tier limits.
17. **Rating** — prompt after the 5th counted session, once only; the answer is stored in `at.v1.meta.ratingPrompt`.
18. **`/pip` mirror** — the popup mirrors the owning tab and its Stop reaches the owner over `BroadcastChannel('awaketab')`.
19. **Offline** (chromium only, service workers allowed) — after the worker controls the page and `/30m` is precached, `context.setOffline(true)` → `/30m` loads, the pill reads "Screen awake", and the offline toast shows.
20. **axe on M6 surfaces** — ambient clock mode, stats dialog and settings dialog in each theme: zero violations.

i18n QA (E6-T07, `apps/web/test/e2e/i18n.spec.ts`, chromium on every PR):

21. **Per-locale smoke** — for each of `es` `pt-br` `de` `fr` `ja` `zh` `hi`: the locale home has `lang` = the BCP 47 tag and `dir="ltr"`, the localized `h1`, and autostarts to the locale's `tool.pill.held`; the translated `/on/iphone-safari` page has one `h1`, `noindex`, the "translation pending" badge, a locale-switcher link to its English version, and a preset chip starts the lock (pill = localized held copy). Zero console errors and page errors throughout. An English top-10 page links its translations in the switcher and emits only self + `x-default` hreflang while no translation is reviewed.
22. **Pseudo-locale overflow at 320 px** — the HTML response's `data-i18n-catalog` JSON is rewritten so every string is accented and ~40 % longer (ICU arguments untouched), then every static text node is expanded the same way; on `/`, `/15m`, `/on/iphone-safari` and `/es/on/iphone-safari`, idle and after starting a session: no horizontal page scroll, no text-bearing element outside the viewport (unless inside a horizontal scroller) and no element that hides overflowing text (`overflow: hidden|clip` or `text-overflow: ellipsis` with `scrollWidth > clientWidth`). The same checks run without pseudo text on each locale home and its translated cooking page.
23. **RTL readiness** — `/es/for/cocinar` at 320 px with `document.documentElement.dir = 'rtl'`: no overflow, the breadcrumb chevron mirrors (`matrix(-1, 0, 0, 1, 0, 0)`), the honest-limit bar is on the right (`border-inline-start`), `h1` computes `direction: rtl`.

Findings the pseudo-locale test caught and fixed in E6-T07: related-link and hub-link chips (shadcn `buttonVariants` carries `h-9 shrink-0`) overflowed at 320 px once anchors were translated `h1`s → `h-auto max-w-full shrink whitespace-normal`; inline `code` (`navigator.wakeLock.request('screen')`) overflowed CJK/Devanagari pages → `overflow-wrap: anywhere` in `content.css`.

Visual regression (nightly): screenshots of the awake screen in each ambient mode × theme at 390 px and 1280 px; threshold 0.2%. Implemented in `apps/web/test/e2e/visual.spec.ts`: 6 modes × `light`/`dark`/`oled` × 2 widths = 36 shots with a frozen clock, taken once the controls have auto-hidden (`maxDiffPixelRatio: 0.002`, animations disabled). The file runs only with `VISUAL=1` (skipped on PRs); `nightly.yml` runs it on chromium with `--update-snapshots=missing` and uploads the snapshots and `test-results` as the `visual-snapshots` artifact. Baselines are not committed yet, so the first nightly run records them.

---

## 6. Accessibility

axe-core on every template (home, preset page, one per collection, `/pro`, `/embed/cook`, `/pip`) in both themes — zero violations. Keyboard-only run through journeys 1–7. Manual screen-reader checklist per release (VoiceOver + Safari, NVDA + Chrome): ring announced as "Keep screen awake. Screen awake", pill changes announced once (no double announcements), timer milestones every 5 min, dialogs trap focus and restore it, shortcuts overlay readable, `keyboardShortcuts=false` disables single keys.

---

## 7. Performance

- `size-limit`: `@awaketab/wake` ≤ 3.4 KB gz; tool island critical path ≤ 15 KB gz; total JS on `/` ≤ 40 KB gz; content pages ≤ 60 KB before ads.
- `pnpm size` (`apps/web/scripts/size.mjs`, after `pnpm -F web build`) prints one JSON report and exits non-zero on any breach: `criticalJs` ≤ 15,360 B gz (the `<script src>` chunks `index.html` loads), `totalJs` ≤ 40,960 B gz (every `dist/_astro/*.js`), `totalCss` ≤ 20,480 B gz (inlined `<style>`), and — since `03-architecture.md` ADR-013 — `hydrated: []` (no built HTML anywhere under `dist/` contains `<astro-island`) and `reactChunks: []` (no `dist/_astro/` file matches `react.*.js`, `jsx-runtime.*.js` or `client.*.js`). A non-empty `hydrated` or `reactChunks` list is a failure even when the byte budgets pass: shadcn/ui is a build-time renderer and React must never ship. Reference values after adoption: `criticalJs` 14,876, `totalJs` 30,428, `totalCss` ≈ 7,300. Since M6 `criticalJs` is the entry scripts **plus their static-import closure** (`from"./x.js"` / `import"./x.js"`; dynamic `import()` excluded), and the report's `files` lists that closure — previously split-out shared chunks were not counted. Values at M6 close: `criticalJs` 14,415, `totalJs` 39,777, `totalCss` 12,303.
- **Since M8** (`00-conventions.md` §13.10) the gate measures pages, not the chunk folder. Entries are a page's same-origin `<script type="module" src>` tags. `totalJs` ≤ 40,960 is the closure over static **and** dynamic `import("./x.js")` edges from `index.html`'s entries — everything the tool page can ever load — instead of every `dist/_astro/*.js` (which charged `/pro` scripts, and would have charged the embed app, to the tool page). New gates: `embedJs` ≤ 25,600 (full closure from `embed/cook/index.html`) and `loaderJs` ≤ 3,072 (`dist/embed.js`). The report adds `lazyFiles` and `embedFiles`; closure helpers live in `scripts/size-lib.mjs` (tested by `scripts/size.test.ts`). Old vs new on the M8 build: `totalJs` 39,805 (old rule, pre-M8 build) → 37,877 (new rule, same pre-M8 build) → 39,111 (M8: + the lazy kiosk module and the core licence verifier it shares); `criticalJs` 14,453 → 14,508 (+55 B: the lazy `#lic=`/`logo=` hook in `main.ts`); `embedJs` 13,843; `loaderJs` 2,356; `totalCss` 12,679.
- `AT_DIST=<dir>` makes `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO suite read an alternate output directory (`apps/web/dist-*`, git-ignored), so parallel verification builds can be measured without clobbering `dist/`; wrap concurrent builds in `node scripts/locked.mjs -- <cmd>` (`14-devops.md` §6).
- Lighthouse CI (mobile, `--preset=desktop` also) on the preview URL for `/`, `/30m`, `/for/cooking`, `/guides/lock-screen-vs-sleep`, `/es/`: performance ≥ 95, a11y 100, best practices 100, SEO 100; budgets JSON asserts LCP ≤ 1.2 s (lab), TBT ≤ 100 ms, CLS = 0, zero third-party requests on tool routes.
- Weekly CrUX pull (`14-devops.md`) alerts when INP p75 > 200 ms or CLS > 0.1 on any route class.

---

## 8. SEO build checks (run over `dist/`)

Every indexable HTML file has exactly one `<h1>`; `<title>` ≤ 60 chars (CJK ≤ 30), description 50–155; one canonical; hreflang set is reciprocal and includes self + `x-default`; JSON-LD parses and matches `schema-dts` types for the page type; `aggregateRating` present only when `data/ratings.json` has ≥ 25 ratings; `sitemap-index.xml` lists every indexable URL and no `noindex` URL; `robots.txt` has the Sitemap line; no page links to a 404 (internal link check); `/until/*` canonicalises to `/`; `/pip`, `/embed/*` carry `noindex`.

Translated content (E6-T05/T06, `apps/web/test/seo/i18n-content.test.ts`): 70 localized pages exist — the 10 top pages × 7 locales at the `slugs.json` slugs, and no other `/{lang}/{collection}/*` page; each has `lang`/`dir`, one `h1`, a self canonical, a title ≤ 60 ending " — AwakeTab" (ja/zh display width ≤ 60, full-width = 2), a description of 70–155 characters (ja/zh ≤ 80) that is unique within the locale and differs from the English page; while `reviewed: false` it is `noindex`, emits no hreflang and is absent from every sitemap; its `og:image` is `/og/{lang}/{collection}/{slug}.png`, exists in `dist/` and is a 1200 × 630 PNG, with `og:image:alt`; the JSON-LD `Article` has `inLanguage` = the page's BCP 47 tag and `image` = the OG URL; the tool embed carries `data-preset`, the honest-limit `role="note"` callout and ≥ 3 FAQs render; every internal link resolves, and links marked English (`hreflang="en"`) only point at pages with no same-locale translation. Every localized page (homes included) sets `inLanguage` to its own tag; each `/{lang}/manifest.webmanifest` has the locale `lang`, a localized `name`/`description`, `id`/`scope`/`start_url` under `/{lang}/`, and is linked from the locale home; no font file (`.woff`, `.woff2`, `.ttf`, `.otf`) exists anywhere in `dist/`. Across every indexable page the hreflang graph is reciprocal (each alternate lists exactly the same set, self included) and every sitemap `<url>` is an indexable page whose `xhtml:link` set equals the page's HTML.

---

## 9. Pages Functions tests (`pnpm test:functions`)

**Approach.** `@cloudflare/vitest-pool-workers` (0.22.0, latest as of 2026-09-26) peers `vitest ^4.1`; the repo pins vitest 5.0.0, so the suites call each `onRequest*` handler in Node with a realistic `EventContext` and faithful fakes from `apps/web/test/functions/harness.ts`: `MemoryKv` (Cloudflare validation — `expirationTtl ≥ 60`, key ≤ 512 bytes, string values, TTL expiry on the fake clock, injectable put failures, full write log), `MemoryAnalytics` (1 index ≤ 96 B, ≤ 20 blobs ≤ 16 KB total, ≤ 20 doubles), and `FakePolar` (stateful sandbox: validate / activate with the activation limit / deactivate / checkouts, bearer + organisation checks, HTTP and network outages) behind a stubbed `fetch`. Secrets come from `apps/web/.dev.vars.example`; its signing pair matches `LICENSE_PUBLIC_KEYS[1]`, so minted tokens are verified with `verifyLicenseToken` from `@awaketab/core`. `ipTraces()` scans every KV key/value written (including overwritten ones) and every AE point for the request IP and its unsalted SHA-256. Revisit Miniflare when the pool supports vitest 5. No devDependencies were added.

| Route | File | Covered |
|---|---|---|
| `POST /api/e` | `api/e.test.ts` | valid batch 200; unknown event and fields dropped; > 20 events 413; > 8 KB 413; non-array / non-JSON 400; 429 at `RATE_MAX` per salted IP hash with `Retry-After`; counter key `rl:e:{ipHash}:{bucket}` TTL 240 s; no request IP (IPv4, IPv6, `x-forwarded-for`) or unsalted IP hash in any KV or AE write; points inside AE limits |
| `POST /api/csp` | `api/csp.test.ts` | Reporting API (`application/reports+json`) and legacy `csp-report` bodies → one `client_error` point, `code = csp`, pathname only; malformed bodies still counted; no IP / UA / blocked URL / query stored; no KV writes |
| `POST /api/rating` | `api/rating.test.ts` | `rating:{uuid}` = `{ stars, text?, locale, ver, at }` TTL 2 y; text ≤ 500, locale ≤ 16; stars outside integer 1–5, non-JSON → 400 with no write; allow-list only; 11th per window 429 + `Retry-After`; no IP stored |
| `POST /api/license/activate` | `api/license/activate.test.ts` | token verifies with the shipped public key, claims and header exact, yearly `exp = periodEnd + 7 d` (LIC-05), lifetime rolling 90 d also on re-activation (LIC-06); `lic:` / `cus:` per docs/08 §4, key only as AES-GCM `keyEnc`; Polar call sequence and auth; key normalisation; same device → no Polar call (LIC-02); 6th device 409 with 5 labels (LIC-03); > 90-day device evicted on Polar (LIC-04); Polar 403 → `activation_limit`; unknown key / unmapped benefit 404 with no licence write (LIC-01); Polar not granted, KV revoked/refunded 403; Polar HTTP and network outage 502 with no KV write; missing fields / bad UUID / bad key / non-JSON 400; label sanitising; 11th call 429 + `Retry-After` (LIC-15); `checkoutId` flow; yearly `exp` refreshed from Polar |
| `POST /api/license/validate` | `api/license/validate.test.ts` | fresh token (docs/00 §9) verified by core; last-seen refresh protects active devices from eviction; expired-but-signed lifetime token re-minted (LIC-07); revoked / refunded / missing record → `{ revoked: true, reason }` (LIC-08); `canceled` still valid; deactivated device → `{ revoked: true, reason: 'deactivated' }`; tampered payload, foreign signing key, malformed tokens 401; non-JSON 400; shared licence rate limit |
| `POST /api/license/deactivate` | `api/license/deactivate.test.ts` | self and other device (by `devHash`, LIC-12) removed on Polar with the decrypted key and in KV; slot freed at the limit; expired token accepted; Polar 404 (already gone) still removes; Polar down 502 with KV unchanged; unknown device 400; bad token 401; unknown licence 404; rate limit |
| `POST /api/webhooks/polar` | `api/webhooks/polar.test.ts` | valid Standard Webhooks HMAC 200 and `wh:{id}` TTL 30 d; multi-signature header; bad / foreign-secret / altered-body signature 401 with no writes; timestamp outside ±300 s and missing headers 400 with no writes (LIC-09); replay is a no-op (LIC-10); failed delivery is re-processed on retry (marker written last); `order.created` → `ord:` (2 y), `lic:`, `cus:`; late create events keep activations/status; embed domain record; `subscription.canceled` → `canceled`, `uncanceled` → `active`; `subscription.revoked` / `benefit_grant.revoked` → `revoked` and validate/activate follow; `order.refunded` / `refund.created` → `refunded`, activate 403 (LIC-11); terminal states never re-opened; unknown types and bad JSON ignored |
| `GET /api/health` | `api/health.test.ts` | `{ ok, version }`, `no-store` |
| `GET /api/embed/config` | `api/embed/config.test.ts` | owned by the embed suite (unknown domain → `{ licensed: false }` cached) |

**Known gap (tracked as `it.todo`).** The webhook handler matches licences by `data.license_key.key`. Polar's subscription / refund / benefit-grant payloads carry `customer_id`, `subscription_id`, `order_id` and `properties.license_key_id` instead, and docs/09 §2.7's `cus:{customerId}` fan-out needs subscription and licence-key ids that `lic:` records (docs/08 §4) do not hold yet. Until that lands, revocation in production relies on a key-bearing payload.

---

## 10. Extension tests

Unit: level ↔ pill mapping; schedule → alarm times across DST; auto-start matcher. Playwright with the unpacked extension: popup start/stop, badge text, `chrome.power` mock recording calls, session survives a forced service-worker restart (`chrome.runtime.reload` in test build), licence activation against a mocked API.

---

## 11. Device matrix (manual, before each phase exit)

| # | Device / browser | Cases |
|---|---|---|
| 1 | Windows 11 · Chrome, Edge, Firefox (display sleep 1 min) | native lock holds ≥ 10 min; hidden tab releases; extension `display` vs `system` |
| 2 | macOS · Safari, Chrome (display sleep 1 min; lid) | lock holds; lid close sleeps regardless (documented) |
| 3 | iPhone · Safari 17/18 (Auto-Lock 30 s) | holds; Low Power Mode behaviour recorded; Home-Screen app on iOS 18.4+ |
| 4 | iPad · Safari | same as 3; sheet-music scenario |
| 5 | Android · Chrome, Samsung Internet (timeout 30 s) | holds; battery saver → `denied` advice; PWA install |
| 6 | Chromebook · Chrome | holds; extension |
| 7 | Windows laptop · Modern Standby | screen vs system behaviour for `/for/downloads` copy |
| 8 | Linux · Firefox 126+ | native lock |

Template (one row per case): date, OS/browser/version, plugged/battery, mode, expected, observed, screenshot, verdict. Results become `/learn/how-we-tested` and update `src/data/support-matrix.json`.

---

## 12. Policies

- **Merge gate:** unit + DOM + functions + chromium e2e + axe + size-limit + `pnpm size` (byte budgets, `hydrated: []`, `reactChunks: []`) + SEO checks green; LHCI budgets green on the preview.
- **Nightly:** firefox/webkit e2e, visual regression (`VISUAL=1`), link check across all locales.
- **Flaky tests:** quarantine with `test.fixme` + issue within 24 h; no retries above 1 in CI; a test flaky twice in a week is rewritten or deleted.
- **Definition of done (per ticket):** acceptance criteria automated where feasible; new engine transitions have a `T##` test; user-visible change has a changelog fragment; docs updated if an identifier changed (and `00-conventions.md` first).
