# 13 · Testing strategy

Status: v1.4 · 2026-09-28 · Owner: Soubhik

**Purpose.** The product's one promise is "the pill never lies". This document defines the tests that prove it — from the state machine to real devices — plus the SEO, performance, accessibility and API checks that protect the other goals. Everything here is automated except the device matrix, whose results are published as `/learn/how-we-tested`.

Related docs: `04-engine-spec.md` (what is being tested) · `08-data-storage.md` §8 (fixtures) · `06-content-seo-spec.md` (SEO rules) · `09-monetization-impl.md` (licence/ads) · `14-devops.md` (CI gating) · `00-conventions.md` §11 (budgets).

---

## 1. Pyramid and tooling

| Layer | Tool | Runs on | Blocks merge? |
|---|---|---|---|
| Types | `pnpm typecheck` (`pnpm -r typecheck`): `tsc --noEmit` per package; for `apps/web`, `astro check` plus `tsc -p functions/tsconfig.json` (Pages Functions against `@cloudflare/workers-types` only, no DOM or Node) and `tsc -p functions/tsconfig.test.json` (the Functions suites and `test/functions/harness.ts`, Workers + Node + DOM) | every PR | yes |
| Dead code | `pnpm knip` (Knip, config in `knip.json`; part of `pnpm lint`): unused files, exports, types and dependencies in every workspace. Entry points are the Astro pages, the Pages Functions, the build scripts, the tests and the published package exports; files read by path (the OG fonts) and the vendored shadcn/ui and ad-config exports are the only ignores | every PR | yes |
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
| T02 | `request()` rejects `NotAllowedError` while visible & plugged | `denied`, advice `null` (cause unknown; UA-agnostic default), one retry after `baseMs` |
| T03 | rejects `NotAllowedError` while `hidden` | `denied`, advice `hidden_document`; auto re-request on visible → `held` |
| T04 | rejects `SecurityError`/insecure context | `unsupported` with `insecure_context` |
| T05 | sentinel `release` while hidden | `held → lost` (`released_hidden`); visible → `requesting → held` |
| T06 | sentinel `release` while visible | `lost` (`released_platform`) → single retry → `held` or `denied` |
| T07 | `navigator.wakeLock` undefined | `unsupported` at creation; `request()` → fallback path |
| T08 | fallback `play()` resolves | `unsupported → fallback`, video element attached, nudge timer armed |
| T09 | fallback `play()` rejects (autoplay) | stays `unsupported`, `error` emitted, no video left attached |
| T09b | fallback `play()` never settles and the last `<source>` fires `error` | `request()` resolves to `unsupported` at once (advice `unsupported_browser`), no video left attached |
| T09c | default sources vs `videoSources: { mp4 }` | one `video/webm` source by default; `video/webm` then `video/mp4` only when the MP4 is passed |
| T09d | the inlined clips | the WebM is real (EBML header, `webm`, `V_VP8`, two VP8 keyframes); the MP4 has `ftyp`, `moov`, `mvhd`, `trak`, `stsd`, `avc1`, `avcC`, `stts`, `stsz`, `stco`, `mdat` and two samples |
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
| `apps/web/test/tool/toast.test.ts` | Toast queue (docs/05 §3.7): same id replaces, text as the default id, at most 3 with persistent notices kept longest, `dismiss` by id |
| `apps/web/test/tool/pip-mirror.test.ts` | `PIP_ADD_MS` kept equal in `pip.ts` and `pip-mirror.ts`; `pickOwner`; `mirrorTime` for each plan type and pauses; `mountMirror` stale fallback and `intent` posting |
| `apps/web/test/tool/accent.test.ts` | `accentId`/`applyAccent` incl. pack fallback; every palette in `tokens.css` meets the §1.1a contrast rules (AA) |
| `apps/web/test/tool/settings.test.ts` | `fillSettings` → `readSettings` round trip; gated values (pack accents, message) keep stored values; `openSettings` |
| `apps/web/test/tool/pwa.test.ts` | `sessionBusy`; `watchUpdates` (FR-PWA-01): offered at once when idle; during a live session one "Reload when you're done" note with no button, then Reload offered when it ends; Reload posts `SKIP_WAITING` and reloads once after `controllerchange`, no reload on an unrequested `controllerchange`, a worker that finishes installing later is offered |
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
| `packages/wake/test/pack.test.ts` | `npm pack --dry-run --json`: 1.0.0, public + provenance, exact file list (including `dist/video.{js,cjs,d.ts,d.cts}` for `@awaketab/wake/video`), every `exports`/`unpkg` target packed, no `src`/`test`/config files, adapters import the core |
| `apps/web/functions/api/embed/config.test.ts` (extended) | Unknown → free and cached; licensed → theme validated; `www.`/`staging.`/deeper subdomains covered, look-alike domains not; expired and revoked/refunded → free; malformed domains never read KV; embed analytics columns (`host` → blob6, `target` → blob7) |

Pro pages (`/pro/activate`, `/pro/manage`; Vitest + happy-dom over the pages' markup):

| File | Covers |
|---|---|
| `apps/web/test/lib/manage-page.test.ts` | Loading: while the list is on its way the meter reads "Checking your devices…" (`page.pro.manage.loading`) and the devices card stays shown. Focus never falls to `<body>`: after removing a device it moves to the Remove button of the row now in its place; removing this device clears `at.v1.license`, shows the empty card and focuses it; a Retry that fails again focuses the offline card. Also the offline card and Retry, the meter and "activations left" copy, and the lapse lines |
| `apps/web/test/lib/activate-page.test.ts` | After a successful activation the form hides and focus lands on the success heading. After checkout, "Show my key" reveals the key as text in its box (`.at-pro-key-out`), plus the checkout retries (`CHECKOUT_RETRY_MS`) and the failed page |

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
10. **Embed** — test page with the loader (`allow` present) → iframe `held`; without `allow` → "Ask the site owner" state. *As built (M8, `apps/web/test/e2e/m8.spec.ts`):* the host page is served by `page.route` on `http://localhost:<port>` while the widget comes from `http://127.0.0.1:<port>` — two origins, both secure contexts — so the widget is genuinely cross-origin; Chromium's Local Network Access checks are disabled for that file only (they block a route-fulfilled document from reaching the loopback server). Headless Chromium denies real wake locks, so every frame gets a fake that, like the browser, rejects with `NotAllowedError` when `document.featurePolicy` disallows `screen-wake-lock`. The file also covers the `AwakeTabEmbed` API (start/state/stop), **origin rejection both ways** (declared-host mismatch, a sibling window posting to the widget, same-window forgeries to the loader), licensed branding via a mocked `/api/embed/config`, full-size kitchen timers, the `/embed` snippet and generator, the `/kiosk` URL builder, an invalid `#lic=` stripped and reported, the `/library` demo through all seven states on the published IIFE (the real inlined WebM plays; no media stub since the fallback fix, `12-library-spec.md` §10.4), the widget with no Wake Lock API reaching the real video fallback (`/embed/cook` at full size: after Start the pill reads "Awake via video fallback", the `<video>` is not paused and the hint reads "Until …"), and axe on `/embed/cook` (light, dark), `/embed`, `/kiosk`, `/library`.
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

M9 launch-readiness specs (all three engines; a `dialog` listener fails any native dialog):

24. **Keyboard-only journeys 1–7** (`apps/web/test/e2e/keyboard.spec.ts`, 12 tests) — only `page.keyboard`: Tab / Shift+Tab (WebKit: Option+Tab, Safari's path to links and buttons) / Enter / Space / Esc and the single-key shortcuts. Every focus stop must match `:focus-visible` (text fields: `:focus-within`) and draw an outline or a box-shadow ring with a spread; transitions are finished before reading styles. Covers: skip link → `#content`, a full forward walk of `/` that must reach the page's last focusable element with no trap, Shift+Tab back; journey 2 by Tab + Enter on `2 h` and by `5`, Esc stops; journey 3 `U` → focus inside the until dialog, "Tomorrow" for the pre-filled now, Tab through the time segments to Start; journey 4 focus stays on the chip across hide/show; journey 5 denied → the pill becomes a button, Tab to Retry, Enter re-acquires; journey 6 Custom… by keyboard (Ctrl/Cmd+A, type), the extend prompt opens with **Stop focused** and **Esc stops**, Shift+Tab to +30 min extends; journey 7 Tab to Resume, Enter re-acquires; `1`–`6`/`0` presets, `D` ×3 → dark → oled, `F` and `P` reach stubbed fullscreen / Document PiP, `?` opens and Esc closes the overlay; `M` ambient: focus never lands behind the modal layer, controls never auto-hide for a keyboard user, Enter on Next → focus mode, Esc exits with the session still active; settings and stats dialogs open from the header, every control shows focus, Esc closes and focus returns to the opener.
25. **axe on every template and surface** (`apps/web/test/e2e/a11y.spec.ts`, 96 tests per engine) — the theme is stored in `at.v1.settings` (as theme-boot and the island read it) with the matching `prefers-color-scheme`, and the test asserts `html[data-theme]` before scanning. Pages in light + dark: `/`, `/30m`, `/until/17-30`, `/pip`, hub + article for `/for`, `/on`, `/vs`, `/guides`, `/learn`, `/pro`, `/pro/activate`, `/pro/manage`, `/about`, `/privacy`, `/terms`, `/changelog`, a real 404 (status asserted), `/es/` and `/es/for/cocinar`. Tool surfaces in light + dark + oled: settings, Pro sheet, stats, shortcuts, custom, until, share, extend (1-min session, fake clock), rating (5 counted sessions seeded), denied notice, resume banner, ambient clock / focus / cook / message / night. Zero violations; failures print rule id, impact and the first five targets. `/embed`, `/extension`, `/kiosk`, `/library` join when M8 ships them.
26. **Privacy and install** (`apps/web/test/e2e/security.spec.ts`) — no `Set-Cookie` response, empty cookie jar and empty `document.cookie` on every tool route (`/`, the seven preset routes, `/until/17-30`, `/pip`, `/es/`, `/ja/`, `/es/pip`) and after a full session with preset, theme, ambient and settings changes plus a reload; only the six documented `at.v1.*` localStorage keys exist. Chromium only (CDP): `Page.getInstallabilityErrors` is empty on `/` (service worker allowed) and `/es/`, with `/manifest.webmanifest` and `/es/manifest.webmanifest` as their manifests — Lighthouse 12 no longer has a PWA category, so this is the installability gate. Point `PLAYWRIGHT_BASE_URL` at a deployed preview to include whatever the edge adds (bot-management cookies would fail it).
27. **Layout stability** (`apps/web/test/e2e/stability.spec.ts`, tag `@stability`; run alone with `pnpm test:e2e --project=chromium --grep @stability`) — the rule is no flicker and no layout shift on any page at any moment. Each test opens its own context, at a 390 × 844 phone (mobile emulation outside Firefox) and a 1440 × 900 desktop, with the fake wake lock. Chromium throttles the network through CDP to a slow 3G profile (400 ms round trip, 400 kbit/s); other engines run unthrottled.
    - **Load CLS** — a buffered `layout-shift` observer (Chromium only; the tests skip where the entry type is missing) on `/`, `/30m`, `/until/22-30`, `/es/`, the four hubs, `/learn`, `/learn/how-awaketab-works`, one article per collection, `/extension`, `/pro`, `/about`, `/changelog`, `/privacy`, `/embed`, `/kiosk`, `/library` and a real 404. The spec waits for fonts, the auto-start hold (`data-settled`), finite entrance animations and 1.5 s, then asserts the non-input shift total is at most 0.001; a failure prints every shift with its source nodes and their rectangles before and after.
    - **Interaction CLS** on `/?autostart=0` (so Space starts rather than stops): start and stop with Space, each face (Bold, Horizon, Tide, Ring), the 1 h preset, theme Dark then Light (the segmented switch, or the compact cycle button on phones), open and close the header Menu, scroll 4,200 px, resize to 1024 × 768. After each step, no shift that the browser did not attribute to recent input may add up to more than 0.001 (soft assertions, so one run names every failing step).
    - **First frame** on `/` and `/?autostart=0` with a frozen wall clock: a `requestAnimationFrame` probe injected with `addInitScript` records the tool's visible state on every frame from first paint until 2 s after it settles: the face shown and its digits, the selected face tab and preset with their indicators' offset, width and opacity, the pill text, and whether the primary button (Keep awake or Stop) is visible and fully opaque. Face, digits, tab and preset must never change; the primary button must be opaque on every frame (no fade-in); the pill may wait for the browser's answer on an auto-start route, but once shown it never changes or hides.
    - **No unstyled icon flash** on `/`, `/extension` and `/pro`: a frame probe keeps the largest size each outer `<svg>` reaches; none may exceed its `width`/`height` attributes, nor draw more than 25 % larger than the size it settles at.

`i18n.spec.ts` answers `/api/e` with 204 through `page.route`: `astro preview` has no Pages Functions, and WebKit logs the pagehide beacon's 404 as a console error, which failed its zero-errors check on WebKit only.

Visual regression (nightly): screenshots of the awake screen in each ambient mode × theme at 390 px and 1280 px; threshold 0.2%. Implemented in `apps/web/test/e2e/visual.spec.ts`: 6 modes × `light`/`dark`/`oled` × 2 widths = 36 shots with a frozen clock, taken once the controls have auto-hidden (`maxDiffPixelRatio: 0.002`, animations disabled). The file runs only with `VISUAL=1` (skipped on PRs); `nightly.yml` runs it on chromium with `--update-snapshots=missing` and uploads the snapshots and `test-results` as the `visual-snapshots` artifact. Baselines are not committed yet, so the first nightly run records them.

---

## 6. Accessibility

axe-core on every template (home, preset page, one per collection, `/pro`, `/embed/cook`, `/pip`) in both themes — zero violations: automated in `apps/web/test/e2e/a11y.spec.ts` (§5 item 25; `/embed/cook` joins with M8). Keyboard-only run through journeys 1–7: automated in `apps/web/test/e2e/keyboard.spec.ts` (§5 item 24), which also asserts a visible focus indicator on every stop and no focus trap. Lighthouse accessibility 100 on the five LHCI URLs (§7). Findings fixed at M9: Lighthouse `target-size` on the home page's card links (now ≥ 24 px blocks); no focus ring on `<input type="time">` segments in Chromium/WebKit and on `<select>` in WebKit (`.at-input` rings on `:focus-within`, selects get an outline); the capability notice's generic "Learn more" link (`tool.advice.learn` is now "Why this happens and how to fix it" in all eight locales). Manual screen-reader checklist per release (VoiceOver + Safari, NVDA + Chrome): ring announced as "Keep screen awake. Screen awake", pill changes announced once (no double announcements), timer milestones every 5 min, dialogs trap focus and restore it, shortcuts overlay readable, `keyboardShortcuts=false` disables single keys.

---

## 7. Performance

- `size-limit`: `@awaketab/wake` ≤ 3.4 KB gz; tool island critical path ≤ 15 KB gz; total JS on `/` ≤ 40 KB gz; content pages ≤ 60 KB before ads.
- `pnpm size` (`apps/web/scripts/size.mjs`, after `pnpm -F web build`) prints one JSON report and exits non-zero on any breach: `criticalJs` ≤ 15,360 B gz (the `<script src>` chunks `index.html` loads), `totalJs` ≤ 40,960 B gz (every `dist/_astro/*.js`), `totalCss` ≤ 20,480 B gz (inlined `<style>`), and — since `03-architecture.md` ADR-013 — `hydrated: []` (no built HTML anywhere under `dist/` contains `<astro-island`) and `reactChunks: []` (no `dist/_astro/` file matches `react.*.js`, `jsx-runtime.*.js` or `client.*.js`). A non-empty `hydrated` or `reactChunks` list is a failure even when the byte budgets pass: shadcn/ui is a build-time renderer and React must never ship. Reference values after adoption: `criticalJs` 14,876, `totalJs` 30,428, `totalCss` ≈ 7,300. Since M6 `criticalJs` is the entry scripts **plus their static-import closure** (`from"./x.js"` / `import"./x.js"`; dynamic `import()` excluded), and the report's `files` lists that closure — previously split-out shared chunks were not counted. Values at M6 close: `criticalJs` 14,415, `totalJs` 39,777, `totalCss` 12,303.
- **Since M8** (`00-conventions.md` §13.10) the gate measures pages, not the chunk folder. Entries are a page's same-origin `<script type="module" src>` tags. `totalJs` ≤ 40,960 is the closure over static **and** dynamic `import("./x.js")` edges from `index.html`'s entries — everything the tool page can ever load — instead of every `dist/_astro/*.js` (which charged `/pro` scripts, and would have charged the embed app, to the tool page). New gates: `embedJs` ≤ 25,600 (full closure from `embed/cook.html`) and `loaderJs` ≤ 3,072 (`dist/embed.js`). The report adds `lazyFiles` and `embedFiles`; closure helpers live in `scripts/size-lib.mjs` (tested by `scripts/size.test.ts`). Old vs new on the M8 build: `totalJs` 39,805 (old rule, pre-M8 build) → 37,877 (new rule, same pre-M8 build) → 39,111 (M8: + the lazy kiosk module and the core licence verifier it shares); `criticalJs` 14,453 → 14,508 (+55 B: the lazy `#lic=`/`logo=` hook in `main.ts`); `embedJs` 13,843; `loaderJs` 2,356; `totalCss` 12,679.
- `AT_DIST=<dir>` makes `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO suite read an alternate output directory (`apps/web/dist-*`, git-ignored), so parallel verification builds can be measured without clobbering `dist/`; wrap concurrent builds in `node scripts/locked.mjs -- <cmd>` (`14-devops.md` §6).
- Lighthouse CI (mobile, `--preset=desktop` also) on the preview URL for `/`, `/30m`, `/for/cooking`, `/guides/lock-screen-vs-sleep`, `/es/`: performance ≥ 95, a11y 100, best practices 100, SEO 100; budgets JSON asserts LCP ≤ 1.2 s (lab), TBT ≤ 100 ms, CLS = 0, zero third-party requests on tool routes.
  - **One config, two targets** (`lighthouserc.cjs`, replacing `lighthouserc.json`): `pnpm build && pnpm lighthouse` starts `pnpm --filter web preview` and audits `http://127.0.0.1:4321`; with `LHCI_BASE_URL=https://<preview>.pages.dev` it starts nothing and audits the deployed preview (real `_headers` and Functions). `LHCI_RUNS` (default 3) and `LHCI_UPLOAD_TARGET` (default `temporary-public-storage` in CI, `filesystem` → `.lighthouseci/` locally) are optional. Assertions are an `assertMatrix`: every URL gets perf ≥ 0.95, a11y 1, best practices 1, LCP ≤ 1200 ms, TBT ≤ 100 ms, CLS ≤ 0; indexable URLs get SEO 1; `/es/` (`noindex` while `reviewed: false`) instead asserts every SEO audit except `is-crawlable` (SEO category 66 by design); tool routes (`/`, `/30m`, `/es/`) assert `resource-summary:third-party:count` = 0.
  - Local runs block `*/api/*` (`blockedUrlPatterns`): `astro preview` has no Functions, so the beacon's 404 would fail `errors-in-console` only locally; blocked requests log `ERR_BLOCKED_BY_CLIENT.Inspector`, which that audit ignores. Remote runs block nothing.
  - Lighthouse 12 removed the PWA category: installability is asserted in Playwright (`security.spec.ts`, §5 item 26).
  - Latest local numbers, with the LCP fix (the island's module chain now starts after first paint), are in `docs/metrics/lighthouse-local-2026-09-27-lcp.md`; `docs/metrics/lighthouse-production-2026-09-27.md` records how to measure production.
- Weekly CrUX pull (`14-devops.md`) alerts when INP p75 > 200 ms or CLS > 0.1 on any route class.

---

## 8. SEO build checks (run over `dist/`)

Every indexable HTML file has exactly one `<h1>`; `<title>` ≤ 60 chars (CJK ≤ 30), description 50–155; one canonical; hreflang set is reciprocal and includes self + `x-default`; JSON-LD parses and matches `schema-dts` types for the page type; `aggregateRating` present only when `data/ratings.json` has ≥ 25 ratings; `sitemap-index.xml` lists every indexable URL and no `noindex` URL; `robots.txt` has the Sitemap line; no page links to a 404 (internal link check); `/until/*` canonicalises to `/`; `/pip`, `/embed/*` carry `noindex`.

Served URLs (M9, `apps/web/test/seo/served-urls.test.ts`, `14-devops.md` §2.1): the only directory indexes in `dist/` are `index.html` and the seven `{lang}/index.html`. Every URL in every sitemap (`<loc>` and alternates) is served by Cloudflare Pages without a redirect: `/x` → `x.html`, `/{lang}/` → `{lang}/index.html`, `/` → `index.html`, and that file exists. The same holds for every canonical, hreflang, `og:url`, JSON-LD URL, internal `<a href>`, and exact page route in `_headers` and `robots.txt`. Each page (except `/until/*` and the canonical-less `/embed/cook`) is canonical at its own served URL. `robots.txt` never blocks the `/embed` landing page.

Security over `dist/` (M9, `apps/web/test/seo/security.test.ts`, runs in `pnpm test:seo`): no server secret name (`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`, `LICENSE_SIGNING_KEY`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, `TURNSTILE_SECRET_KEY`) and none of their `.dev.vars.example` values (nor a JWK's private `d` on its own) in any text file of `dist/`; no JWK — JSON or minified object literal — with a `d` member and no PEM private key (the licence verifier's public JWK must be found, so the scan is not vacuous). The generated `_headers` is resolved per path the way Cloudflare Pages applies it (every matching rule in order, `! Name` detaches, a header set twice is joined with ", ") and each route class is checked against `14-devops.md` §3: tool/app routes (strict CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`), content routes in every locale (one network CSP, never two joined), `/embed/*` (`frame-ancestors *`, no XFO, noindex), `/pip` in every locale (noindex), HSTS / `nosniff` / Referrer-Policy / COOP / Permissions-Policy with `screen-wake-lock=(self), picture-in-picture=(self)` / Reporting-Endpoints everywhere, and exactly one `Cache-Control` per class (`/_astro/*`, `/assets/*`, `/sw.js`, `/config/*`, `/api/*`). That last check caught a real bug: without `! Cache-Control` those rules were joined with the `/*` default into "public, max-age=0, must-revalidate, public, max-age=31536000, immutable".

Launch-audit fixes (M9, `apps/web/test/seo/launch-audit.test.ts`, runs in `pnpm test:seo`; `LAUNCH-AUDIT.md` F-03 to F-07, N-03). `/about` has the `mailto:` contact. `/privacy` has each `08-data-storage.md` §7 row with its retention, the deletion route, the "not yet active" ads section and every event name. `/changelog` renders Markdown (`<code>`, links, no literal backticks or front matter), puts "1.0 launch" first and dates in descending order. IndexNow selection over the built sitemaps picks only served, non-`noindex` pages, and a key file exists only when `INDEXNOW_KEY` was set. All checkout links on `/pro`, `/embed` and `/kiosk` come from one Polar server. The dev licence key's coordinates are absent from every file of a production-mode `dist/`, and present in a sandbox one (so the scan is not vacuous). The same file runs in CI's closing production-mode build (`PUBLIC_POLAR_SERVER=production AT_ALLOW_MISSING_PRODUCTION_KEY=1`). Unit and functions side: `functions/api/csp.test.ts` (429 + `Retry-After`, 413 by header and by stream, no IP), `functions/_lib/polar.test.ts` and `health.test.ts` (API base per `PUBLIC_POLAR_SERVER`), `functions/_lib/cors.test.ts` (`/api/*` noindex), `scripts/headers.test.ts` (`*.pages.dev` hosts noindex, production host not), `scripts/check-keys.test.ts` (key and link checks, an esbuild bundle of `src/lib/license.ts` with and without the dev key, `pnpm keys:prod` output), `scripts/indexnow.test.ts`, `test/lib/checkout.test.ts`, `test/lib/changelog.test.ts`.

Translated content (E6-T05/T06, `apps/web/test/seo/i18n-content.test.ts`): 70 localized pages exist — the 10 top pages × 7 locales at the `slugs.json` slugs, and no other `/{lang}/{collection}/*` page; each has `lang`/`dir`, one `h1`, a self canonical, a title ≤ 60 ending " — AwakeTab" (ja/zh display width ≤ 60, full-width = 2), a description of 70–155 characters (ja/zh ≤ 80) that is unique within the locale and differs from the English page; while `reviewed: false` it is `noindex`, emits no hreflang and is absent from every sitemap; its `og:image` is `/og/{lang}/{collection}/{slug}.png`, exists in `dist/` and is a 1200 × 630 PNG, with `og:image:alt`; the JSON-LD `Article` has `inLanguage` = the page's BCP 47 tag and `image` = the OG URL; the tool embed carries `data-preset`, the honest-limit `role="note"` callout and ≥ 3 FAQs render; every internal link resolves, and links marked English (`hreflang="en"`) only point at pages with no same-locale translation. Every localized page (homes included) sets `inLanguage` to its own tag; each `/{lang}/manifest.webmanifest` has the locale `lang`, a localized `name`/`description`, `id`/`scope`/`start_url` under `/{lang}/`, and is linked from the locale home; no font file (`.woff`, `.woff2`, `.ttf`, `.otf`) exists anywhere in `dist/`. Across every indexable page the hreflang graph is reciprocal (each alternate lists exactly the same set, self included) and every sitemap `<url>` is an indexable page whose `xhtml:link` set equals the page's HTML.

---

## 9. Pages Functions tests (`pnpm test:functions`)

**Approach.** `@cloudflare/vitest-pool-workers` (0.22.0, latest as of 2026-09-26) peers `vitest ^4.1`; the repo pins vitest 5.0.0, so the suites call each `onRequest*` handler in Node with a realistic `EventContext` and faithful fakes from `apps/web/test/functions/harness.ts`: `MemoryKv` (Cloudflare validation — `expirationTtl ≥ 60`, key ≤ 512 bytes, string values, TTL expiry on the fake clock, injectable put failures, full write log), `MemoryAnalytics` (1 index ≤ 96 B, ≤ 20 blobs ≤ 16 KB total, ≤ 20 doubles), and `FakePolar` (stateful sandbox: validate / activate with the activation limit / deactivate; checkouts shaped like Polar's `Checkout`, with no licence key; `GET /v1/orders/?checkout_id=`, `GET /v1/benefit-grants/?customer_id=`, `GET /v1/license-keys/{id}` as `ListResource` / `LicenseKeyWithActivations`; grants that are `missing` or `keyless` until Polar "catches up"; bearer + organisation checks; HTTP and network outages, or a 5xx on one path via `failPath`) behind a stubbed `fetch`. Secrets come from `apps/web/.dev.vars.example`; its signing pair matches `LICENSE_PUBLIC_KEYS[1]`, so minted tokens are verified with `verifyLicenseToken` from `@awaketab/core`. `ipTraces()` scans every KV key/value written (including overwritten ones) and every AE point for the request IP and its unsalted SHA-256. Revisit Miniflare when the pool supports vitest 5. No devDependencies were added.

| Route | File | Covered |
|---|---|---|
| `POST /api/e` | `api/e.test.ts` | valid batch 200; unknown event and fields dropped; > 20 events 413; > 8 KB 413; non-array / non-JSON 400; 429 at `RATE_MAX` per salted IP hash with `Retry-After`; counter key `rl:e:{ipHash}:{bucket}` TTL 240 s; no request IP (IPv4, IPv6, `x-forwarded-for`) or unsalted IP hash in any KV or AE write; points inside AE limits |
| `POST /api/csp` | `api/csp.test.ts` | Reporting API (`application/reports+json`) and legacy `csp-report` bodies → one `client_error` point, `code = csp`, pathname only; malformed bodies still counted; no IP / UA / blocked URL / query stored; no KV writes |
| `POST /api/rating` | `api/rating.test.ts` | `rating:{uuid}` = `{ stars, text?, locale, ver, at }` TTL 2 y; text ≤ 500, locale ≤ 16; stars outside integer 1–5, non-JSON → 400 with no write; allow-list only; 11th per window 429 + `Retry-After`; no IP stored |
| `POST /api/license/activate` | `api/license/activate.test.ts` | token verifies with the shipped public key, claims and header exact, yearly `exp = periodEnd + 7 d` (LIC-05), lifetime rolling 90 d also on re-activation (LIC-06); `lic:` / `cus:` per docs/08 §4, key only as AES-GCM `keyEnc`; Polar call sequence and auth; key normalisation; same device → no Polar call (LIC-02); 6th device 409 with 5 labels (LIC-03); > 90-day device evicted on Polar (LIC-04); Polar 403 → `activation_limit`; unknown key / unmapped benefit 404 with no licence write (LIC-01); Polar not granted, KV revoked/refunded 403; Polar HTTP and network outage 502 with no KV write; missing fields / bad UUID / bad key / non-JSON 400; label sanitising; 11th call 429 + `Retry-After` (LIC-15); `checkoutId` flow; yearly `exp` refreshed from Polar; `{ checkoutId, lookup: true }` returns `{ key, plan }` with no Polar activate and no KV write, one 404 for unknown/unpaid/keyless checkouts, shared rate-limit bucket (docs/09 §2.3a); D-06 Polar ids on `lic:` and `lk:`, checkout `subscription_id`, ids a grant linked first, a pending refund/revoke → 403 with no Polar activate, pre-D-06 record back-fill |
| `POST /api/license/validate` | `api/license/validate.test.ts` | fresh token (docs/00 §9) verified by core; last-seen refresh protects active devices from eviction; expired-but-signed lifetime token re-minted (LIC-07); revoked / refunded / missing record → `{ revoked: true, reason }` (LIC-08); `canceled` still valid; deactivated device → `{ revoked: true, reason: 'deactivated' }`; tampered payload, foreign signing key, malformed tokens 401; non-JSON 400; shared licence rate limit |
| `POST /api/license/deactivate` | `api/license/deactivate.test.ts` | self and other device (by `devHash`, LIC-12) removed on Polar with the decrypted key and in KV; slot freed at the limit; expired token accepted; Polar 404 (already gone) still removes; Polar down 502 with KV unchanged; unknown device 400; bad token 401; unknown licence 404; rate limit |
| `POST /api/webhooks/polar` | `api/webhooks/polar.test.ts` | valid Standard Webhooks HMAC 200 and `wh:{id}` TTL 30 d; multi-signature header; bad / foreign-secret / altered-body signature 401 with no writes; timestamp outside ±300 s and missing headers 400 with no writes (LIC-09); replay is a no-op (LIC-10); failed delivery is re-processed on retry (marker written last); `order.created` → `ord:` (2 y), `lic:`, `cus:`; late create events keep activations/status; embed domain record; `subscription.canceled` → `canceled`, `uncanceled` → `active`; `subscription.revoked` / `benefit_grant.revoked` → `revoked` and validate/activate follow; `order.refunded` / `refund.created` → `refunded`, activate 403 (LIC-11); terminal states never re-opened; unknown types and bad JSON ignored; key-less production payloads resolved by Polar ids (D-06, below) |
| `GET /api/health` | `api/health.test.ts` | `{ ok, version }`, `no-store` |
| `GET /api/embed/config` | `api/embed/config.test.ts` | owned by the embed suite (unknown domain → `{ licensed: false }` cached) |

**KV ops scripts (F-02).** `apps/web/scripts/kv/test/kv-ops.test.ts` and `cloudflare.test.ts` (in `pnpm test:unit`, node environment) cover the backup format (round-trip, truncated / duplicate / malformed rejection), the AES-GCM backup envelope (wrong key and tampering fail closed, no plaintext in the bytes), the export across listing pages (durable prefixes only, `expiration` and metadata kept, verified after encryption), the restore plan (create / same / conflict / expired / prefix filter; writes only missing keys unless `--overwrite`; never deletes), `kv:reencrypt` (dry run writes nothing; only `keyEnc` changes; second run is a no-op; resumes after an interrupted batch; unknown-key and non-JSON records never written; a record changed between read and write is skipped), the CLI guards (dry run by default, production refused without `--yes-production`, `KV_LICENSES_ID` is always production, exit codes 0/1/2, no record counts in backup logs) and the REST client against a fake Cloudflare API (cursor pages, bulk reads with per-key fallback, key encoding, 429 `Retry-After` / 5xx / network retries, a missing namespace is an error and never an empty KV, rejected bulk writes, backup → restore drill). They use their own in-memory store (`test/memory-store.ts`) rather than the harness `MemoryKv`, which fakes the Workers binding and keeps no metadata or expirations in its listing. `apps/web/functions/_lib/kv-ops-interop.test.ts` (in `pnpm test:functions`) checks that the script's `keyEnc` format and the functions' `encryptUtf8` / `decryptUtf8` open each other's output.

**Typecheck (F-08 follow-up).** Until 2026-09-26 `astro check` excluded `functions/` and nothing else typechecked it, which is how the fictional `checkout.license_key` (F-08) and two `exactOptionalPropertyTypes` errors in `validate.ts` / `deactivate.ts` went unnoticed. `apps/web/functions/tsconfig.json` and `tsconfig.test.json` now run in `pnpm -F web typecheck` and so in CI (§1).

**Checkout auto-fill (F-08).** `activate.test.ts` "checkout auto-fill resolves the key through order → benefit grant → licence key (F-08)": the one-time path (order by `checkout_id`, grant by `order_id`, key by id; the exact Polar calls and query filters; grant, order and licence-key ids stored for D-06), the subscription path (grant by `subscription_id`, no order read), `open` / `confirmed` → 503 `polar_unavailable` + `Retry-After: 5` for activate and lookup, order / grant / `license_key_id` not created yet → 503 then success once the fake catches up, a customer with four purchases (each checkout returns its own key), another customer's grant on the same order id (never returned), a revoked and a re-granted grant on one subscription (the live one wins), revoked and KV-refunded keys → 403, 5xx on the orders, grants or licence-key read → 502. With the pre-F-08 route these suites fail 20 tests. `test/lib/activate-page.test.ts` covers the page's retries (`CHECKOUT_RETRY_MS`).

**Key-less Polar payloads (D-06, closed the former `it.todo`).** Polar's order, refund and subscription payloads carry ids, never the key, and benefit grants carry `properties.license_key_id` (docs/09 §2.7.1). `polar.test.ts` "key-less Polar payloads (D-06)" sends production-shaped bodies built by `polarEvents.*` in `test/functions/harness.ts`: grant before and after activation (ids on `lic:`, `lk:` / `grant:` / `sub:` / `ord:.lks` with their TTLs); `subscription.canceled` / `uncanceled` / `revoked` through `sub:` with validate following; `subscription.created` / `active` / `updated` change nothing; `benefit_grant.revoked` by licence-key id and by `grant:` with empty properties; one-time `order.refunded` through `ord:.lks` (activate 403); partial refund keeps the licence; renewal-order refund through the subscription; `refund.created` succeeded / pending / failed / no `revoke_benefits`, and `refund.updated`; a customer with a yearly and a lifetime licence (each event reaches only its own); out-of-order delivery (refund before activation → `lk:.pending` → activate 403 with no Polar activation; cancel before activation applied once; revoke before grant; reverse-order revoked → canceled → uncanceled); the `cus:` fallback for pre-D-06 records (plan filter, two matching licences both changed, untrusted old `polarOrderId`, a grant for a pre-D-06 activation, never a D-06 record with different ids); unknown ids 200 with no licence write; replay and retry. `activate.test.ts` "Polar ids (D-06)" and `validate.test.ts` "after key-less Polar webhooks (D-06)" cover the other side. What only a live run can show is listed in docs/09 §2.7.1 (N-04 step 6).

---

## 10. Extension tests

Unit: level ↔ pill mapping; schedule → alarm times across DST; auto-start matcher. Playwright with the unpacked extension: popup start/stop, badge text, `chrome.power` mock recording calls, session survives a forced service-worker restart (`chrome.runtime.reload` in test build), licence activation against a mocked API.

As built (M7):

- **Unit** (`apps/extension/test/unit/*.test.ts`, in `pnpm test:unit`): the background controller against an in-memory `chrome.*` fake (`fake-chrome.ts`: storage areas firing `onChanged`, recorded `chrome.power`, alarms, badge, notifications, permissions, tabs) — start/stop/level/command, badge `ON`/`SYS`/minutes, `at.tick`/`at.end` alarms, worker restart re-hydration and keep-awake re-issue, sessions finalised while the worker slept, completion + notification `+30`, sync mirror never carrying `at.v1.license`, telemetry off by default and allow-listed when on, schedules and auto-start gated by `ext.schedules`/`ext.autostart`, revoked licence; the power adapter, the storage adapter (coalescing), level ↔ pill mapping, schedules → alarms including the US spring-forward and fall-back weeks (`TZ=America/Los_Angeles`), overnight/merged windows, the host normaliser and auto-start matcher, message validation, licence activate/revalidate/deactivate with signed test tokens, manifest permissions, i18n key coverage in all 8 catalogs, `_locales` limits, token extraction, byte-identical icons.
- **Build** (`apps/extension/test/build/*.test.ts`): the zip writer ignores mtimes and order; the extension is built twice from the same sources and the two zips have the same SHA-256 (`pnpm -F extension zip:check` does the same in CI); the store images regenerate byte for byte.
- **Playwright** (`pnpm test:e2e:ext`, `apps/extension/playwright.config.ts`): the `AT_EXT_TEST=1` build loaded unpacked in Chromium (new headless, persistent profile per test). `chrome.power` is replaced by a recorder in that build (`chrome.storage.session['at.test.power']`). Journeys: built manifest permissions; popup Ready state and first-render time; start ∞ → `held`, `ON`, `request:display`, stop → `release`; `p30` via keyboard → `30m`; System level → `SYS`, `request:system`, secondary line; until-time; forced worker restart via CDP `ServiceWorker.stopAllWorkers` → same session id, keep-awake re-issued; options defaults (telemetry off, gated Pro sections, battery unavailable); licence activation against a mocked `/api/license/activate` (CORS like the Pages middleware, token signed with the dev key) → local record, never in `chrome.storage.sync`, schedules unlocked; axe on popup (idle and held) and options in light and dark. A dialog listener fails the run.
  - **Popup frame per state.** Chrome caps a popup at 600 px and scrolls anything taller, so `expectPopupFits()` checks, in every state, that the frame is exactly 600 tall, the document and the lowest visible block end at or above 600 and the popup root does not scroll. States: first open with the tips card, Ready with the Pro row, the Pro panel (price line "$12 a year"), the Until stepper (primary block hidden), awake for 1 h, System awake, no limit ("Awake for"), the receipt after Stop, Blocked, the "New in {major.minor}" update chip, Starting (Stop, the pressed chip, the picked length and the "Starting" caption, kept after a second's redraw), a private window (no add-time row) and Time's up.
- **Web:** `functions/_lib/cors.test.ts` (extension CORS); `test/lib/extension.test.ts`; `test/e2e/extension-page.spec.ts` (`/extension` axe, `extension_click`, install hidden in Firefox/WebKit); the SEO suite asserts `/extension` in `sitemap-en.xml` and `/privacy#extension`.
- The global-shortcut command cannot be pressed in headless Chromium; `commands.onCommand('toggle')` is covered by the controller unit test. Real `chrome.power` on Windows/macOS stays in the manual matrix (§11).

---

## 11. Device matrix (manual, before each phase exit)

| # | Device / browser | Cases |
|---|---|---|
| 1 | Windows 11 · Chrome, Edge, Firefox (display sleep 1 min) | native lock holds ≥ 10 min; hidden tab releases; extension `display` vs `system` |
| 2 | macOS · Safari, Chrome (display sleep 1 min; lid) | lock holds; lid close sleeps regardless (documented) |
| 3 | iPhone · Safari 17/18 (Auto-Lock 30 s) | holds; Low Power Mode behaviour recorded; Home-Screen app on iOS 18.4+ |
| 4 | iPad · Safari | same as 3; sheet-music scenario |
| 5 | Android · Chrome, Samsung Internet (timeout 30 s) | holds with Battery Saver on (it never refuses the lock); PWA install |
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
