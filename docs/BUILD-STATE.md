# AwakeTab build state

Current milestone: **M9 complete (local) — ready for launch pending external items.** Every milestone M0–M9 is built on `m6-engagement` (head `eec257e` before this docs commit). `docs/LAUNCH-AUDIT.md`: 70 rows — **45 PASS, 0 FAIL**, 7 MANUAL, 18 EXTERNAL. Everything left needs accounts, a deployed URL, real devices, reviewers or an owner decision. Production builds fail on purpose until the production licence key (N-03) and production checkout links (N-04 step 4) are in.

Next: **Launch — owner actions in `docs/LAUNCH-AUDIT.md`** ("Needs Soubhik" N-01…N-19, "Owner decisions pending" D-01…D-06).

## Final verification (2026-09-26, `eec257e`)

After the served-URL build format, KV backups (F-02) and the F-01/F-03…F-07 + N-03 fixes: `pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm test:seo && pnpm size` all green — unit **565 / 565**, functions **167 pass + 1 todo**, SEO/security **78 / 78**; Playwright chromium + firefox + webkit **607 passed, 116 skipped** (visual-only / engine-specific), **0 failed**; extension e2e **11 / 11**. Budgets: critical JS **14,802** B gz (15,360) · tool total **40,128** (40,960; **832 B headroom**) · CSS **13,311** (20,480) · embed app **14,063** (25,600) · loader **2,356** (3,072). Lighthouse (local, simulated mobile, 3 runs): LCP median **1.05 s** on all five docs/19 §E URLs, CLS 0, Performance/Accessibility/SEO 100 (`/es/` SEO 66 by design while `noindex`).

## Baseline (2026-09-26, `549bffb`)

| Check | Result |
|---|---|
| `pnpm lint` · `pnpm typecheck` | clean · clean (`astro check` 157 files, 0 / 0 / 0) |
| `pnpm test` | unit 501 / 501 (59 files) · functions 152 pass + 1 todo (10 files) |
| `pnpm test:seo` | 59 / 59 over `dist/` |
| Playwright, 3 engines (`PLAYWRIGHT_BASE_URL` on a static preview) | 607 passed · 116 skipped (visual without `VISUAL=1`, Chromium-only checks) · 0 failed |
| `pnpm test:e2e:ext` · `pnpm -F extension zip:check` | 11 / 11 · reproducible (`sha256 f5dba18a…`, 70,340 bytes) |
| Lighthouse (mobile, 3 runs, 5 URLs) | Perf 100 · A11y 100 · SEO 100 (`/es/` 66 by design, noindex) · BP 100 in local mode (96 when `/api/e` 404s on a functions-less origin) · LCP 1.05 s · CLS 0 · TBT 0 · 0 third-party requests |

**Budgets (`pnpm size`).** Critical JS **14,784** B gz (budget 15,360) · tool total JS **40,199** (40,960; **761 B headroom**) · CSS **13,323** (20,480) · embed app **14,062** (25,600) · loader `/embed.js` **2,356** (3,072) · `@awaketab/wake` 3.21 kB gz (3.4) / IIFE 3.45 kB (3.6) / adapters 237–277 B (400) · `@awaketab/core` 6.22 kB br (7) · `hydrated: []` · `reactChunks: []` · `embedHashed: true`.

## Completed

### M0–M1

- pnpm workspace with strict ESM TypeScript projects for the Astro site, WXT extension, `@awaketab/wake`, and `@awaketab/core`.
- Static Astro holding page with canonical metadata, social metadata, JSON-LD, and a static OG placeholder.
- Tailwind CSS v4 token foundation using the `--at-*` namespace and logical CSS properties.
- Generated Cloudflare `_headers` and `_redirects`, canonical robots and sitemap stubs, and `/api/health`.
- Linting, formatting, unit/function/SEO testing, Playwright, axe, size budgets, Lighthouse assertions, Changesets, and GitHub workflows.
- `@awaketab/wake`: seven lock states, `classifyDenial` → `TAdviceCode`, video fallback, T01–T16 transition tests.
- `@awaketab/core`: session engine, `at.v1.*` storage, local-date stats (Asia/Kolkata + America/Los_Angeles fixtures), ES256 licence verify, capability probe, BroadcastChannel protocol.

### M2 (E3 + E4)

- Vanilla-TS tool island in `apps/web/src/tool` projecting the seven lock states via `t('tool.pill.*')`.
- Allow-listed URL params, preset/until/custom plans, resume banner, toasts (no `alert`/`confirm`/`prompt`).
- Settings sheet, shortcuts overlay, share sheet, capability notice, extend prompt, PiP stub (280×120) + `/pip`.
- PWA: `public/manifest.webmanifest`, `public/sw.js` (static; not `@vite-pwa/astro`), install + iOS hint.
- Playwright journeys 1–9, 11–12 on Chromium (mocked Pro activate + ads guard). Beacon intercept for `page_view` / `session_start` / `lock_state`. `ext=1` copy panel on `/pro/activate`.

### Type-naming refactor (post-M2, owner-directed)

- Every interface is now `I` + PascalCase and every type alias `T` + PascalCase across all four workspaces, including the `@awaketab/wake` and `@awaketab/core` public surfaces (46 declarations).
- Exemptions: `Props` in `.astro` (Astro derives `Astro.props` from that name) and `IEnv` in Pages Functions.
- Enforced by `@typescript-eslint/naming-convention`; `enum` is banned by `no-restricted-syntax`.
- Recorded in `docs/00-conventions.md` §2 and `.cursorrules`. Type names only — lock-state strings, `at.v1.*` keys and preset ids are byte-identical.

### M3 (E5 + E6)

- BaseLayout (tool routes) and ContentLayout (ad slots present, `PUBLIC_ADS_ENABLED` off). Ads imports banned from tool routes by ESLint.
- SeoHead: title formula, description, canonical, hreflang `en` + `x-default`, OG/Twitter. Unreviewed locales stay `noindex` and out of hreflang/sitemap.
- JSON-LD: Organization + WebSite + WebApplication on home; `aggregateRating` omitted while `data/ratings.json` count is 0.
- Build-time OG via satori + resvg; support matrix from `src/data/support-matrix.json`; slugs map for all convention collections.
- English home: tool + 1,682 words, seven-state table, honest limits, support matrix, 8 FAQs, hub links, author box.
- Preset pages `/15m`…`/8h`, `/until/*` (noindex, canonical `/`), hubs `/for` `/on` `/vs` `/guides` `/learn`, trust `/about` `/privacy` `/terms` `/changelog`, `/404` with the tool.
- Eight locale JSON files at key/placeholder parity. Footer locale switcher always links to locale homes. Accept-Language banner writes `lang-suggest` to `at.v1.onboarding.dismissedTips`; never auto-redirects.
- Server `t()` is locale-explicit (`createT`) so static builds cannot leak Hindi (or any locale) into English titles.
- PWA boot and language suggestion are lazy island chunks so critical JS stays under 15 KB gz.

### M4 (E8 + E9)

- First-party analytics: `lib/analytics.ts` queues ≤20 events / 8 KB, `sendBeacon` on hide, per-tab `sid` in memory, 10% `client_error`. Island loads it lazily.
- `POST /api/e` allow-list + size limits + IP-hash rate limit (`rl:e:{ipHash}:{bucket}`); Analytics Engine column map from docs/08 §5. `POST /api/csp` → `client_error` / `csp`.
- `docs/metrics/queries.sql` and `apps/web/scripts/metrics-week.mjs`.
- G0: footer + `/about` Buy Me a Coffee (`rel="noopener"`); GitHub Sponsors on `packages/wake/README.md`.
- G1: `AdSlot.astro`, ads loader in ContentLayout only, `/ads.txt`, `/config/ads.json`, `PUBLIC_ADS_ENABLED=0`.
- G2: ES256 JWT, Polar client, licence activate/validate/deactivate, Polar webhooks (Standard Webhooks HMAC, `wh:{eventId}`), embed config, rating. Pages `/pro`, `/pro/activate` (error table + `?ext=1` copy panel), `/pro/manage` (server activations + remove). Dev `LICENSE_PUBLIC_KEYS[1]` pair in `@awaketab/core` + `.dev.vars.example` (rotate before production). `ads.free` skips ContentLayout ads. Client errors sampled 10% per sid. Refund + uptime notes in `docs/17-launch-checklist.md`.

### M5 (E7)

- English content collections: 18 `/for`, 12 `/on`, 8 `/guides`, 7 `/vs`, 6 `/learn` (51 pages). Markdown + Astro wrappers; tool embedded with `autostart=0` and the scenario preset/mode.
- Hubs list live articles. Home spokes point at real slugs. Sitemap-en includes the 51 URLs. SEO suite asserts one h1, unique descriptions (HTML-decoded), and 600–1,000 words in `.at-prose`. Descriptions avoid `&` so escaped meta tags stay ≤155.

### shadcn/ui adoption (post-M5, owner-directed)

- shadcn/ui (new-york, neutral, CSS variables) is the UI component library for `apps/web`, installed via the official Astro path: `@astrojs/react` 4.4.2, `react`/`react-dom` 19.3.0, `class-variance-authority`, `cn`, `radix-ui` (Slot/Separator/Toggle), `lucide-react`, `tw-animate-css`. `components.json` points `tailwind.css` at `src/styles/tokens.css`; `@/*` → `./src/*`, `jsx: react-jsx`.
- Primitives in `apps/web/src/components/ui/`: button, badge, card, table, alert, separator, input, label, kbd, breadcrumb, toggle (`pnpm dlx shadcn@4.21.0 add <name>` from `apps/web` for more).
- **Rule: zero hydration.** Components render in `.astro` at build time or lend their cva class helpers (`buttonVariants()`, `badgeVariants()`, `toggleVariants()`) to plain HTML. No `client:*` directive anywhere; React never ships. Interactive shadcn primitives (Dialog, Sheet, Tabs, Accordion, Tooltip, Select, DropdownMenu) are not used — the island keeps native `<dialog>`, `<details>` and vanilla TS (ADR-002). Runtime-created nodes (toasts) get the look via `@apply` in `tool.css`.
- Enforced by `scripts/size.mjs`: fails on any `<astro-island` in built HTML or any `dist/_astro/*.js` matching `react.*` / `jsx-runtime.*` / `client.*`. Build gained `scripts/prune-unreferenced.mjs` (after `astro build`, before `sitemap.mjs`) to drop the ~224 KB client renderer `@astrojs/react` emits regardless; `scripts/locked.mjs -- <cmd>` serialises concurrent builds; `AT_DIST=<dir>` targets an alternate output dir for size/prune/sitemap/SEO.
- Theme bridge in `tokens.css`: shadcn semantic variables alias the canonical `--at-*` tokens (`--primary` → `--at-accent-text`, `--accent` → the 12% state tint, `--border` → `--at-line`, custom `--success`/`--warning`/`--night`, radius scale onto `--at-r-*`); `@custom-variant dark` follows `data-theme` (`dark`, `oled`) and `prefers-color-scheme`. `--at-*` hex values are byte-identical to docs/05 §1.1.
- Converted surfaces: tool routes (header ghost icon buttons, Pro badge, outline-toggle preset chips on `aria-pressed`, Card/Alert banners and capability notice, `<dialog>` with the Dialog look, `Kbd` shortcuts, `Table` support matrix, Cards for the seven-state list, `Alert` honest limits), content pages (Breadcrumb, Card grids, Alert, link buttons, `<details>` FAQ as cards; ad slots unchanged), Pro pages (plan Cards, error/activation Tables, Input/Label/Button forms, `<template>`-cloned rows), trust pages, `LocaleNav` ghost buttons, footer `Separator` + link buttons.
- Measured after the change: critical JS 14,876 B gz (budget 15,360), total JS 30,428 B gz (budget 40,960), inlined CSS ≈ 7.3 KB gz (budget 20 KB), `hydrated: []`, `reactChunks: []`. No change to behaviour, budgets or third-party requests.
- Tooling: `stylelint.config.mjs` ignores Tailwind at-rules (`custom-variant`, `slot`, `apply`, `utility`, `variant`, `source`, `plugin`) and `@apply` preludes; `.gitignore` adds `apps/web/.build-lock` and `apps/web/dist-*`; `src/lib/og.ts` casts the satori element to `ReactNode`.
- Recorded in `docs/00-conventions.md` §3, §11, §13.7; `docs/03-architecture.md` ADR-013; `docs/05-frontend-spec.md` §1.5, §13; `docs/13`, `docs/14`; `.cursorrules`; `CLAUDE.md`; `changelog/2026-09-shadcn-ui.md`.

### M6 (E10 + remaining E4)

- Engagement layer in `apps/web/src/tool`, all lazy behind one `IToolCtx` (`ctx.ts`): `ambient/` (`shell.ts` modal `<dialog data-ambient>` re-parenting pill/ring/timer, auto-hide 3 s, pixel shift ±2 px / 60 s, night dim 30 s, OLED burn-in dim 30 min; `clock.ts` for `clock`/`night`, `focus.ts`, `message.ts`, `cook.ts`; `logic.ts` pure maths), `end.ts` (chime, SW notification, title flash, extend prompt with grace lock, session count ≥ 5 min, rating hand-off), `signal.ts` (Web Audio oscillator chimes `end`/`focus`/`timer`; notifications via the SW registration), `stats/` (12-week heatmap, today/week/streak/total, CSV), `ui/rating.ts`, `ui/settings.ts` (fill/read round trip, gated accents and message, notification permission on enable), `ui/actions.ts` (custom/until/share dialogs, theme cycle), `accent.ts`, `sponsor.ts`, `fullscreen.ts`.
- Accents `amber`/`indigo`/`teal`/`rose` on `<html data-accent>` (teal/rose = first `ambient.packs` pack), mirrored in `theme-boot.js`; tokens `--at-t-ambient`, `--at-night-digit`, `--at-d-slow`. 55 new i18n keys in all 8 locales.
- PiP: Document PiP moves pill + timer into 280 × 120 with Stop / `+15` (`engine.addTime`), `P` toggles closed. `/pip` popup is a bare page running `pip-mirror.ts` — no engine, no lock; mirrors `state` snapshots over `BroadcastChannel('awaketab')` and posts `intent` messages back.
- PWA: `src/sw.ts` (Workbox runtime modules) bundled by esbuild in `scripts/sw.mjs` after the prune step, manifest injected from `dist/` (58 entries; `sw.js` ≈ 9.7 KB gz); not `@vite-pwa/astro` (ADR-014). `public/sw.js` removed; `/sw.js` served `no-cache` + `Service-Worker-Allowed: /`. `pwa.ts` offers "Update available" only when no session is live and reloads once after `controllerchange`; sticky offline toast. Per-locale manifests already existed (`scripts/manifests.mjs`).
- `@awaketab/core`: `pause({ keepLock })`, `addTime(ms)`, `updateSession({ mode, modeState })`; `state` snapshots on every tick/status/lock change and in reply to `hello`; `TTabMessage` gains snapshot fields and `intent`; battery monitor caches one `BatteryManager`, warns once per session, hysteresis re-arm; `stop()` after completion releases the extend-grace lock (bug fix); `IMeta.ratingPrompt.rearmAt`. Changeset `.changeset/core-m6-engagement.md` (minor).
- Budgets: `src/i18n/critical.json` removed (catalog embedded per page as `data-i18n-catalog`); `vite.build.modulePreload: false`; `scripts/size.mjs` now counts the entry's static-import closure (it previously missed split-out shared chunks). Measured: critical JS 14,415 B gz (budget 15,360), total JS 39,777 B gz (budget 40,960), CSS 12,303 B gz, `hydrated: []`, `reactChunks: []`. Lazy chunks (gz): `shell` 2,582 · `cook` 1,728 · `focus` 1,024 · `message` 710 · `clock` 517 · `tick` 262 · `panel` (stats) 1,878 · `settings` 1,825 · `actions` 1,554 · `rating` 1,130 · `end` 1,092 · `pip` 1,034 · `pwa` 775 · `sponsor` 670 · `signal` 610 · `fullscreen` 280 · `accent` 268 · `ctx` 139.
- Decisions: only `message` is gated (`ambient.packs` gates palettes; docs/05 §3.13 wins over docs/15 E10-T01); night dim is 65% opacity (not 35/40%) to keep digits ≥ 3:1; the "60% opacity" pill with hidden controls is the muted ink colour to stay AA; heatmap tint capped at 40%.
- Tests: `packages/core/test/session-m6.test.ts`; `apps/web/test/tool/{ambient,stats,end,rating,pip-mirror,accent,settings,pwa,sponsor,actions}.test.ts` with `ctx-helper.ts`; `apps/web/scripts/sw.test.ts`; e2e `m6.spec.ts` (ambient, cook, message, stats, rating, `/pip` mirror, offline SW, axe on M6 surfaces), journey 6 extended (chime + title flash), `visual.spec.ts` (36 shots, `VISUAL=1`, run by `nightly.yml` on chromium). Playwright blocks service workers by default (`page.route` cannot see SW fetches); the offline journey opts in.
- Recorded in `docs/00-conventions.md` v1.3 §13.8; `docs/03` ADR-014; `docs/04` §9–§11, §14, §16; `docs/05` §1.1a, §3.13–§3.23, §8.2, §9, §13; `docs/08` §2.1, §2.2, §2.5, §6; `docs/13`; `docs/14`; `changelog/2026-09-m6-engagement.md`.

### Licence and API fixes (integration suites, 2026-09-26)

- `apps/web/test/functions/harness.ts` adds in-memory KV and Analytics Engine fakes. They enforce Cloudflare limits and log every write. It also has a stateful Polar sandbox fake, Standard Webhooks signing, JWT tamper helpers and an IP-trace scanner. Not Miniflare: `@cloudflare/vitest-pool-workers` peers vitest ^4.1 and the repo pins vitest 5. The suites cover activate, validate, deactivate, webhooks/polar (+1 todo), rating, csp, e and health: `pnpm test:functions`, 152 tests.
- Fixes they found:
  - The webhook now writes `wh:{eventId}` only after the event is handled, so a failed delivery is retried.
  - `subscription.canceled` → `canceled` (Pro lasts to the period end); `uncanceled` → `active`.
  - `create` events never overwrite a record.
  - validate returns a fresh token, and answers `deactivated` for a removed device (this closed a 5-device-limit bypass).
  - Lifetime and kiosk tokens get a rolling `exp`.
  - A Polar 404 on deactivate counts as already removed.
  - CSP reports are parsed from Reporting API bodies.
  - A 429 now carries `Retry-After`.
- The client keeps the fresh token only after verifying it offline for this device, re-activates on a 401 or a removed device, and never downgrades on a 5xx or when offline.
- `/pro/activate?ext=1` never activates the browser. With `checkout_id` it uses the non-activating `{ checkoutId, lookup: true }` mode of activate (`00-conventions.md` §13.12).

### M6 follow-ups

- `@awaketab/core`: `IStats.daySessions` / `dayFocus` (local day → sessions ≥ 1 min / completed focus blocks), `countDay()`. The CSV `sessions` column is filled; days recorded before this update stay empty rather than guessed.
- The Stats "Today" row reads "42 min · 2 sessions"; focus mode shows "N focus blocks today".
- `/pip` popup in every locale (`/{lang}/pip`, `PipPage.astro`, `pipPath()`), noindex, disallowed in robots.txt and precached.
- `pip.pro`: a 280 × 160 Document PiP window that mirrors the clock or focus digits (`mirrorAmbient`).
- SponsorCard also sits in the ExtendPrompt (`data-sponsor="extend"`), filled from the same `/config/sponsor.json` fetch.
- Recorded in `00-conventions.md` §13.11; `changelog/2026-09-m6-followups.md`.

### i18n E6-T05 … E6-T07

- **E6-T05:** OG images per locale page, with CJK and Devanagari rendered by satori (fonts at build only); per-locale manifests asserted; JSON-LD `inLanguage` is BCP 47.
- **E6-T06:** the top-10 pages × 7 locales = 70 pages at `/{lang}/{collection}/{translated slug}`, from one route `src/pages/[lang]/[kind]/[slug].astro`. All are `reviewed: false`, so they are `noindex`, not in any sitemap and not in hreflang, and show a "native review pending" badge. `alternatesFor()` in `scripts/translations.mjs` feeds both the HTML alternates and the sitemaps. The `ja` / `zh` / `hi` slugs are romanised ASCII (owner decision D-03).
- **E6-T07:** a pseudo-locale overflow test at 320 px, RTL readiness (`textDirection()` / `RTL_LANGUAGES`, logical-utility ban test, `.at-flip-rtl`), and a per-locale Playwright smoke. `i18n.spec.ts` passes 27 / 27 per engine.
- Recorded in `07-i18n.md` §11, `06-content-seo-spec.md` §19; `changelog/2026-09-i18n-content.md`.

### M8 (E12): embed widget, library, `/library`, research page

- `public/embed.js` loader (2,356 B gz; committed; esbuild from `src/tool/embed/loader.ts`). It creates a lazy sandboxed iframe with `allow="screen-wake-lock"`, exposes `window.AwakeTabEmbed`, and uses an origin-checked postMessage protocol.
- `/embed/cook` iframe app (14,062 B gz). It is bundled outside Astro so it shares no chunk with the tool's critical path, and fingerprinted to `/embed/assets/app.<hash>.js` with an immutable cache. It runs the real wake lock + session engine, the seven-state pill, cook tap-to-pause and three kitchen timers. It shows `iframe_no_allow` as "Ask the site owner", adds attribution unless the domain is licensed, and supports 8 locales.
- `/api/embed/config` resolves subdomains to the registrable domain.
- `/embed` landing (snippet generator, demos) and `/kiosk` landing (URL builder, `logo=`, `#lic=` verified offline and stripped from the address bar). The tool-route CSP `img-src … https:` for the kiosk logo is owner decision D-01.
- `@awaketab/wake` 1.0.0 is publishable: IIFE `dist/awaketab-wake.iife.js`, adapters with the core kept external, CJS + types, README badges, and `pack.test.ts` over `npm pack --dry-run`. `release.yml` → job `publish-wake` (environment `npm`, OIDC provenance, `NPM_TOKEN` fallback). Nothing has been published.
- `/library` has a live seven-state demo on the same-origin IIFE. `/learn/how-we-tested` is generated from `docs/metrics/device-matrix.json` and reads "Results pending"; `pnpm -F web matrix:check` / `matrix:sync` handle the update.
- Size gate: `totalJs` is now the static + dynamic closure of the tool entry. New gates: `embedJs`, `loaderJs`, `embedHashed`.
- Recorded in `00-conventions.md` §13.10, §13.12; `11-embed-spec.md` §11; `12-library-spec.md` §10; `changelog/2026-09-m8-embed-library.md`, `changelog/2026-09-ext-handoff-embed-cache.md`.

### M7 (E11): AwakeTab for Chrome (MV3)

- WXT extension in `apps/extension`. Permissions `power`, `storage`, `alarms`; optional `notifications` and per-site `https://` access (Pro auto-start); no host permissions by default; `minimum_chrome_version` from `support-matrix.json`.
- The worker runs the `@awaketab/core` session (`source: 'ext'`, `channel: null`, `resumeIndefiniteMs: Infinity`) over `chrome.power` and `chrome.storage.local`. It re-issues keep-awake on start, `onStartup`, `onInstalled` and every 0.5-min alarm. Badge `ON` / `SYS` / minutes; Alt+Shift+A; optional end notification with +30 / Stop.
- Pro schedules (two alarms each, DST-safe, merged windows) and auto-start (browser start, per-site). Settings mirror to `storage.sync`; the licence and device id never sync.
- Popup with seven-state pill parity and Screen / System. A held system lock adds `ext.pill.system` "System awake — screen may dim" (owner decision D-02). Options page includes licence activation with a per-profile `at.v1.device` id; telemetry is off by default.
- i18n reuses the web catalogs (93 `ext.*` / `page.extension.*` keys) and generates `_locales`. `/extension` landing and a `/privacy#extension` section.
- Reproducible zip (`scripts/zip.mjs`, `zip:check`). Store listing and 5 × 1280×800 screenshots are in `apps/extension/store/`.
- Tests: unit tests against a fake `chrome.*` (in `pnpm test`), plus the Playwright suite with a recorder `chrome.power` (`pnpm test:e2e:ext`, 11).
- Battery auto-stop is deferred: service workers have no `getBattery()` and no `offscreen` permission, so Options shows it disabled.
- Recorded in `10-extension-spec.md` §13, `00-conventions.md` §13.9 (still **Proposed**), `08-data-storage.md` §3; `changelog/2026-09-m7-extension.md`.

### M9: production hardening and launch readiness

- **LCP ≤ 1.2 s lab** (`549bffb`), down from 1.82 s:
  - The inline boot script `src/boot/boot.js` is allowed by a CSP `sha256-` hash (`BOOT_HASH`). It replaces the render-blocking `public/theme-boot.js`.
  - `scripts/defer-main.mjs` moves the tool entry onto `#awaketab-tool[data-main]`; boot starts it at first contentful paint, capped at 150 ms after DCL. The wake lock is still requested ≤ 300 ms after DCL (journey 1, 3 engines).
  - Analytics, licence re-check, PWA, language suggestion and sponsor wait for load + idle.
  - Tool pages embed only the island's i18n families (`islandCatalog`).
  - Result: 1.05 s median on all five §E URLs, CLS 0.
- **CLS 0 and layout** (`81f9579`): reserved caption and Stop rows, ring-wide pill, header row packed to the end, language suggestion as a fixed bottom banner. Visible focus on `<input type=time>` segments and on `<select>` in WebKit. Card links ≥ 24 px. `tool.advice.learn` is descriptive in 8 locales.
- **Fixes:**
  - The locale prefix is kept when the island cleans the URL (`e493f20`).
  - `D` steps through every theme on quick presses (`7000ccf`).
  - A failed telemetry batch is dropped instead of rejecting (`22325a0`).
  - Tools embedded in content pages start the page's scenario mode, SW registration errors are caught, and English honesty copy is corrected (`cc2317b`).
- **Headers:** every specific `_headers` rule detaches `Cache-Control` before setting its own (`b66b0e7`); before this, Cloudflare joined the two values.
- **Tests** (`39474a3`):
  - `keyboard.spec.ts`: journeys 1–7 keyboard-only, plus shortcuts, ambient, dialogs, extend prompt; 12 per engine.
  - `a11y.spec.ts`: axe on 24 templates × light / dark and 16 tool surfaces × light / dark / oled; 96 per engine.
  - `security.spec.ts`: no cookies on any tool route or after a full session; Chromium installability via CDP.
  - `seo/security.test.ts`: no secret name, value or private key in `dist/`; per-route-class headers resolved the Cloudflare way.
- **Lighthouse CI:** one `lighthouserc.cjs` for local (blocks `*/api/*`) and deployed previews (`42c9d3a`); `lighthouse.yml` runs on PRs, `deployment_status` and manual dispatch.
- **Audit:** `docs/LAUNCH-AUDIT.md` covers docs/17 §2–§3 and docs/19 §E, 70 rows: 37 PASS, 8 FAIL, 7 MANUAL, 18 EXTERNAL. It includes the exact owner steps. `changelog/2026-09-1.0-launch.md` is the "1.0 — launch" fragment.

## Execution model

Contract and island work has a single writer. Parallel subagents in git worktrees were used from M5 on: content pages, M6 follow-ups, i18n E6-T05…T07, M7, M8 and M9 checks, each merged into `m6-engagement`. `docs/00-conventions.md`, `docs/BUILD-STATE.md`, `src/i18n/en.json` and `apps/web/src/tool/**` stay single-writer.

## Proposed identifiers (owner decision D-04)

- `00-conventions.md` §13.9 (extension) is still marked **Proposed**; code carries `// PROPOSED` in `apps/extension/src/{status,storage,settings,schedules,controller}.ts`.
- §13.8, §13.10, §13.11 and §13.12 were written as "Accepted on 2026-09-26" during the build. They need the owner's confirmation.
- Not yet in docs/00:
  - the E6-T05…T07 list in `07-i18n.md` §11: translated route and OG paths, `translations.mjs` helpers, `content-i18n.ts`, `RTL_LANGUAGES` / `textDirection()`, `localeLinks`, `ogImageAlt`, `.at-flip-rtl`, `content.breadcrumb`, `content.translation.*`
  - `EXTENSION_STORE_URLS` (`src/lib/extension.ts`)
  - `EXTENSION_CORS_ROUTES` (`functions/_lib/cors.ts`)
  - the embed loader's `allow-popups-to-escape-sandbox` token (`src/tool/embed/loader.ts`)

## Known gaps

**Repo defects from the launch audit** (not fixed; `docs/LAUNCH-AUDIT.md` → Fails):

- **F-01:** `POST /api/csp` has no rate limit and no body cap.
- **F-02:** the KV backup cron (`backup-kv` → R2), `pnpm kv:restore` and `pnpm kv:reencrypt` are not built.
- **F-03:** there is no middleware adding `X-Robots-Tag: noindex` on non-`main` preview deployments.
- **F-04:** `/about` has no contact. `/privacy` leaves out the 90-day retention of analytics events, ratings, and the KV licence record with how to request deletion, and its ads section is too thin for AdSense.
- **F-05:** IndexNow (key file + ping on deploy) is not built.
- **F-06:** the Polar production switch is not wired. `PUBLIC_POLAR_SERVER` is unused; `POLAR_API_BASE` is undocumented and defaults to the sandbox; `CHECKOUT_LINKS` are hard-coded sandbox URLs.
- **F-07:** `/changelog` prints fragment Markdown literally and sorts by file name, not `date`, so "1.0 — launch" appears last.

**Must happen before Pro sales, and should happen before the public launch:** rotate the ES256 key. `LICENSE_PUBLIC_KEYS[1]` in `@awaketab/core` is the dev key, and its private half is committed in `.dev.vars.example` (N-03).

**Platform and product gaps (verified against the code on 2026-09-26):**

- **Extension battery auto-stop:** a platform limit. MV3 service workers have no `navigator.getBattery()`, and `offscreen` is not in the permission list. Options shows the setting disabled (`ext.options.battery.unavailable`; `10-extension-spec.md` §13, §12 open).
- **Document PiP sentinel:** the PiP document requests no sentinel of its own, so its pill reflects the main tab's lock (honest: `lost` when that tab is hidden). The decision waits on the device matrix (`05-frontend-spec.md` §9).
- **Native review:** 70 translated pages and 7 locale homes are `reviewed: false` (noindex, not in sitemaps or hreflang). The M6 / M7 / M8 strings (55 M6 keys, `ambient.focus.today`, `ext.*`, embed, `content.translation.*`) are unreviewed in every locale, especially `ja` and `hi`. Locale homes are still UI + intro stubs (E6-T04). The stale-translation hash check (`07-i18n.md` §5 step 6) is not built.
- **Visual-regression baselines** are not committed. The first nightly run records them (`--update-snapshots=missing`, `visual-snapshots` artifact).
- **Total tool JS headroom is 832 B gz** (40,128 / 40,960). The next lazy feature on the tool page needs a size plan (move something out of the tool closure, or split it off to its own page).
- **E12-T05 device research:** `docs/metrics/device-matrix.json` has 14 rows, all `pending`; `/learn/how-we-tested` reads "Results pending"; `support-matrix.json` has no `lastVerified` from a real run.
- **WordPress plugin** (`11-embed-spec.md` §5) is not built. The embed host matrix (WordPress, Squarespace, Webflow, Ghost, AMP, Mobile Safari; §9) has not been run.
- **Polar webhooks without a licence key:** resolved by D-06 (2026-09-26). Key-less payloads are matched through Polar ids (`lk:`, `grant:`, `sub:`, `ord:.lks`, then `cus:`; `09-monetization-impl.md` §2.7); only a live sandbox purchase + refund remains (LAUNCH-AUDIT N-04 step 7).
- **Checkout auto-fill (F-08, open):** Polar's `Checkout` has no licence key, so `{ checkoutId }` activation and lookup will 404 in production and `/pro/activate` falls back to the paste field. Proposed fix in LAUNCH-AUDIT F-08.
- **Validate after a key rotation:** `/api/license/validate` verifies only against the current signing key. Old-`ver` tokens get `401` and the client re-activates, which is not the 90-day overlap `14-devops.md` §10 describes.
- **Coverage:** no `@vitest/coverage-*` package is installed, so "core ≥ 90 % lines" is not measured. Transition-row coverage is by named test (T01–T16).
- **Tests:** `sponsor.test.ts` and `actions.test.ts` cover the pure helpers only. The sponsor slot DOM and the dialog binders are covered by e2e.
- **Not built:** `extension-release.yml` (store upload over the APIs), so extension uploads are manual. Also no hub pages for locales (translated breadcrumbs are two levels).
- **Trailing slashes (risk, unverified):** canonicals and sitemaps use `/30m` while Astro emits `30m/index.html`. Check on the first preview whether Cloudflare 308-redirects to `/30m/` (N-13).

## Known external gaps

All of these are in `docs/LAUNCH-AUDIT.md` → Needs Soubhik with exact steps:

- Cloudflare Pages project, custom domains and Bulk Redirects, KV `LICENSES` / `LICENSES_PREVIEW`, Analytics Engine `awaketab_events` / `_preview`, all secrets (+ `POLAR_API_BASE`), R2 `awaketab-backups`, and email routing for `support@`.
- Production ES256 key and the `LICENSE_PUBLIC_KEYS` update; Polar production products, benefits, `LAUNCH19` and webhook; the real-card purchase + refund test.
- Chrome Web Store and Edge Add-ons submission; npm trusted publishing for `@awaketab/wake` (`release.yml`, environment `npm`); Search Console and Bing + sitemap.
- AdSense + Funding Choices CMP (G1); native-speaker review; the real-device matrix + `pnpm -F web matrix:sync`.
- The first nightly (visual baselines); LHCI on a preview URL; `curl -sI` header checks on a deployed preview; uptime monitor; rollback drill.
- Owner decisions D-01…D-05 (kiosk `img-src https:`, extension System-level wording, romanised `ja` / `zh` / `hi` slugs, PROPOSED identifiers, content CSP enforce vs report-only). D-06 (Polar ids on licence records) is decided and implemented; its live check is N-04 step 7.

## Next

**Launch — owner actions in `docs/LAUNCH-AUDIT.md`.** The suggested order:

1. D-01…D-05 (D-06 done), and F-08.
2. Fix F-04, F-06, F-07, F-01, F-03, F-05 and F-02, plus the N-03 key rotation, in one PR.
3. N-01 Cloudflare, then N-13 / N-12 on the first preview.
4. N-05 stores and N-06 npm.
5. N-07 Search Console.
6. N-10 / N-11 review and devices.
7. The launch-day runbook in `17-launch-checklist.md` §6.
