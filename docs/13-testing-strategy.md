# 13 · Testing strategy

Status: v1.1 · 2026-09-11 · Owner: Soubhik

**Purpose.** The product's one promise is "the pill never lies". This document defines the tests that prove it — from the state machine to real devices — plus the SEO, performance, accessibility and API checks that protect the other goals. Everything here is automated except the device matrix, whose results are published as `/learn/how-we-tested`.

Related docs: `04-engine-spec.md` (what is being tested) · `08-data-storage.md` §8 (fixtures) · `06-content-seo-spec.md` (SEO rules) · `09-monetization-impl.md` (licence/ads) · `14-devops.md` (CI gating) · `00-conventions.md` §11 (budgets).

---

## 1. Pyramid and tooling

| Layer | Tool | Runs on | Blocks merge? |
|---|---|---|---|
| Unit (`packages/*`, `apps/web/src/lib`) | Vitest + fake timers | every PR | yes |
| DOM/component (`apps/web/src/tool`) | Vitest + happy-dom | every PR | yes |
| Pages Functions | Vitest with `@cloudflare/vitest-pool-workers` (Miniflare) | every PR | yes |
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

### 3.3 Stats

Fixtures `stats.kolkata-midnight.json` and `stats.la-dst.json`: a session 23:30–00:30 in `Asia/Kolkata` writes 30 min to each local day (never to the UTC day); streak counts consecutive local days with ≥ 1 min; 365-day pruning; CSV export matches columns.

### 3.4 Storage

Defaults applied for missing fields; corrupt JSON → defaults + one `client_error storage_unavailable`? (no — corrupt value → defaults silently; only a throwing adapter emits the error); private-mode adapter → memory fallback; `migrate()` idempotent; `clearAll()` removes every `at.*` key.

### 3.5 Licence verification

Valid token → features; expired → none; tampered payload → none; unknown `ver` → none; device mismatch → none; grace: yearly token 3 days past `exp` with `lastValidatedAt` recent → still valid; kiosk token verified offline for 365 d.

### 3.6 i18n and content

Missing-key parity across 8 locales; placeholder parity; frontmatter zod schemas accept fixtures and reject bad `lastVerified`; `slugs.json` uniqueness per locale.

---

## 4. DOM/component tests (happy-dom)

Pill copy for each of the seven states equals `en.json`; ring `stroke-dashoffset` math for 0/50/100% and indefinite; `CustomDurationDialog` validation (0 → error; 7 d + 1 min → max error); `UntilTimePicker` shows "Tomorrow" when the wall time already passed; `ExtendPrompt` default 30 min and auto-stop after 5 min; `SecondTabWarning` appears when a fake `BroadcastChannel` peer says `held`; `RatingPrompt` shows only when `meta.sessionCount ≥ 5` and `ratingPrompt.action` is null.

---

## 5. End-to-end (Playwright)

Setup: `page.addInitScript` installs a controllable fake `navigator.wakeLock` (exposes `window.__at.releaseAll()`, `window.__at.rejectNext('NotAllowedError')`) and a `document.visibilityState` override with a `window.__at.setVisibility('hidden')` helper that also dispatches `visibilitychange`.

Journeys (chromium on every PR; all three engines nightly):

1. **Auto-start** — open `/` → pill "Screen awake" within 300 ms of `DOMContentLoaded` (`lock_state` event asserted via a beacon interceptor).
2. **Preset** — click `2 h` → timer shows `02:00:00`, ring animates, `at.v1.session` written with `plan.type='duration'`.
3. **Until** — `U` → pick 17:30 → timer "Until 17:30"; if past, "Tomorrow" shown.
4. **Hidden → lost → re-acquire** — `setVisibility('hidden')` → pill "Paused — tab hidden", no `alert()` (dialog listener fails the test); `setVisibility('visible')` → "Screen awake", toast "Screen awake again".
5. **Denied** — `rejectNext` → pill "Blocked — here's the fix", advice text present, ring not active, timer hidden.
6. **Timer end → extend** — 1-minute custom with fast-forwarded clock → chime call, title flash, extend prompt; `+30 min` → session continues.
7. **Reload → resume** — mid-session reload → resume banner with remaining time; accept → lock re-requested.
8. **PiP** — `P` in chromium → `documentPictureInPicture` stub called; in webkit → popup fallback opened.
9. **Pro activation** — mock `/api/license/activate` → badge "Pro", `ambient.packs` unlocked; mock `revoked` on validate → gated again with toast.
10. **Embed** — test page with the loader (`allow` present) → iframe `held`; without `allow` → "Ask the site owner" state.
11. **Ads guard** — on `/`, `/30m`, `/pip` no request to any ad host (network assertion); on `/for/cooking` with `PUBLIC_ADS_ENABLED=1` the ad script loads only after the LCP entry.
12. **Second tab** — two pages on the same context → second shows the warning.

Visual regression (nightly): screenshots of the awake screen in each ambient mode × theme at 390 px and 1280 px; threshold 0.2%.

---

## 6. Accessibility

axe-core on every template (home, preset page, one per collection, `/pro`, `/embed/cook`, `/pip`) in both themes — zero violations. Keyboard-only run through journeys 1–7. Manual screen-reader checklist per release (VoiceOver + Safari, NVDA + Chrome): ring announced as "Keep screen awake. Screen awake", pill changes announced once (no double announcements), timer milestones every 5 min, dialogs trap focus and restore it, shortcuts overlay readable, `keyboardShortcuts=false` disables single keys.

---

## 7. Performance

- `size-limit`: `@awaketab/wake` ≤ 2 KB gz; tool island critical chunk ≤ 15 KB gz; total JS on `/` ≤ 40 KB gz; content pages ≤ 60 KB before ads.
- `pnpm size` (`apps/web/scripts/size.mjs`, after `pnpm -F web build`) prints one JSON report and exits non-zero on any breach: `criticalJs` ≤ 15,360 B gz (the `<script src>` chunks `index.html` loads), `totalJs` ≤ 40,960 B gz (every `dist/_astro/*.js`), `totalCss` ≤ 20,480 B gz (inlined `<style>`), and — since `03-architecture.md` ADR-013 — `hydrated: []` (no built HTML anywhere under `dist/` contains `<astro-island`) and `reactChunks: []` (no `dist/_astro/` file matches `react.*.js`, `jsx-runtime.*.js` or `client.*.js`). A non-empty `hydrated` or `reactChunks` list is a failure even when the byte budgets pass: shadcn/ui is a build-time renderer and React must never ship. Reference values after adoption: `criticalJs` 14,876, `totalJs` 30,428, `totalCss` ≈ 7,300.
- `AT_DIST=<dir>` makes `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO suite read an alternate output directory (`apps/web/dist-*`, git-ignored), so parallel verification builds can be measured without clobbering `dist/`; wrap concurrent builds in `node scripts/locked.mjs -- <cmd>` (`14-devops.md` §6).
- Lighthouse CI (mobile, `--preset=desktop` also) on the preview URL for `/`, `/30m`, `/for/cooking`, `/guides/lock-screen-vs-sleep`, `/es/`: performance ≥ 95, a11y 100, best practices 100, SEO 100; budgets JSON asserts LCP ≤ 1.2 s (lab), TBT ≤ 100 ms, CLS = 0, zero third-party requests on tool routes.
- Weekly CrUX pull (`14-devops.md`) alerts when INP p75 > 200 ms or CLS > 0.1 on any route class.

---

## 8. SEO build checks (run over `dist/`)

Every indexable HTML file has exactly one `<h1>`; `<title>` ≤ 60 chars (CJK ≤ 30), description 50–155; one canonical; hreflang set is reciprocal and includes self + `x-default`; JSON-LD parses and matches `schema-dts` types for the page type; `aggregateRating` present only when `data/ratings.json` has ≥ 25 ratings; `sitemap-index.xml` lists every indexable URL and no `noindex` URL; `robots.txt` has the Sitemap line; no page links to a 404 (internal link check); `/until/*` canonicalises to `/`; `/pip`, `/embed/*` carry `noindex`.

---

## 9. Pages Functions tests (Miniflare)

`/api/e`: valid batch 200; > 20 events 413; unknown field dropped; rate limit 429 after 60 req/min per IP hash; nothing written contains an IP. `/api/license/activate`: happy path mints a verifiable ES256 token; sixth device → `activation_limit`; revoked → `revoked`; Polar 5xx → `polar_unavailable` with no KV write. `/api/license/validate`: revoked in KV → `{ revoked:true }`. `/api/webhooks/polar`: bad HMAC 401; duplicate `eventId` 200 no-op; `subscription.revoked` flips status. `/api/embed/config`: unknown domain → `{ licensed:false }` cached; `/api/rating`: stars outside 1–5 → 400.

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
- **Nightly:** firefox/webkit e2e, visual regression, link check across all locales.
- **Flaky tests:** quarantine with `test.fixme` + issue within 24 h; no retries above 1 in CI; a test flaky twice in a week is rewritten or deleted.
- **Definition of done (per ticket):** acceptance criteria automated where feasible; new engine transitions have a `T##` test; user-visible change has a changelog fragment; docs updated if an identifier changed (and `00-conventions.md` first).
