# 00 · Conventions, glossary and canonical facts

> **This file is the single source of truth for names, identifiers, states, keys, routes, plans and budgets.** Every other document in `docs/` must use these exact identifiers. If a detail here conflicts with another doc, this file wins and the other doc gets fixed. When a decision changes, change it here first.

Status: v1.4 · 26 Sep 2026 · Owner: Soubhik · Derived from `awaketab-blueprint.md` (strategy) — see that document for the *why*; this set of docs is the *what* and *how*.

---

## 1. Product identity

| Item | Value |
|---|---|
| Product name | **AwakeTab** (one word, capital A and T; never "Awake Tab" or "awaketab" in prose; `awaketab` in code/URLs) |
| Tagline | "The tab that keeps your screen awake." |
| Canonical domain | `https://awaketab.com` (redirect 301 from `awaketab.app`, `awaketab.page`, `awaketab.dev`, `www.awaketab.com`) |
| Company/legal | Sole proprietorship of Soubhik (India) — confirm with CA; placeholder legal name `AwakeTab` |
| GitHub org | `awaketab` — repo `awaketab/awaketab` (monorepo) |
| npm scope | `@awaketab` — package `@awaketab/wake` |
| Extension name | Product name on the website and in running text: **AwakeTab for Chrome**. Store and manifest name on the Chrome Web Store and Edge Add-ons: **AwakeTab: Keep Screen Awake** (`ext.name`, English in every locale; Edge shows the same manifest name). Manifest short name: **AwakeTab**. The licence device label stays "AwakeTab for Chrome · {OS}" |
| Embed product | **AwakeTab Embed** (first widget: Cook Mode) |
| Business tier | **AwakeTab Business** (Embed licence, Kiosk licence) |
| Paid tier | **AwakeTab Pro** |
| Brand accent | The lamp (Clear Night, `DESIGN.md` §2.2): default Aqua `#087B87` (light UI) / `#5BE0E8` (dark UI); night indigo `#2B3A67` / `#9DB0FF`; OLED black `#000000`. Saturated red is reserved for the blocked state and never a lamp; the Amber lamp is a warmer orange than the paused tone, and state is never colour alone (pill text, glyph, ring pattern) |
| Favicon / icon motif | The ring (progress ring with a glowing dot at 12 o'clock) |
| Author page | `/about` — real name, testing setup, contact |

Assumptions carried from the blueprint (not yet confirmed by Soubhik): name = AwakeTab; stack = Astro + Cloudflare; engine + library open source (MIT), site content proprietary; launch locales = 8 below; analytics = first-party beacon (no third-party script). Changing any of these means editing this file and grepping the docs.

---

## 2. Identifier schemes

| Kind | Format | Example |
|---|---|---|
| Business requirement | `BR-##` | `BR-03` |
| Functional requirement | `FR-<AREA>-##` | `FR-ENGINE-04`, `FR-TIMER-02`, `FR-PWA-01` |
| Non-functional requirement | `NFR-<AREA>-##` | `NFR-PERF-01`, `NFR-A11Y-02` |
| Architecture decision | `ADR-###` | `ADR-004` |
| Epic | `E#` | `E3` |
| Ticket | `E#-T##` | `E3-T04` |
| Analytics event | `snake_case` | `session_start` |
| Feature gate (Pro) | `dot.case` | `ambient.packs` |
| Storage key | `at.v1.<name>` | `at.v1.settings` |
| i18n key | `dot.case` grouped by screen | `tool.pill.held` |
| Content slug | `kebab-case` | `keep-screen-on-while-cooking` |
| TypeScript interface | `I` + `PascalCase` | `IWakeLockHandle`, `ISession` |
| TypeScript type alias | `T` + `PascalCase` | `TLockState`, `TPresetId` |
| Runtime constant map | `SCREAMING_SNAKE` + `as const` | `PRESET_MS`, `STORAGE_KEYS` |

The `I`/`T` prefixes are enforced by `@typescript-eslint/naming-convention` and apply to every workspace, including the published `@awaketab/wake` and `@awaketab/core` type surfaces. Two exemptions: `Props` in `.astro` files (Astro derives `Astro.props` from that exact name) and `IEnv` in Pages Functions, which already complies. `enum` is banned by `no-restricted-syntax` — closed sets are string-literal unions (`TLockState`, `TEndReason`) or `as const` maps, because `enum` emits runtime JavaScript and the island is budgeted at 15 KB gz critical. Renaming a *type* never renames a *value*: the seven lock-state strings in §5.1, the storage keys in §6 and the preset ids stay byte-identical.

Areas for FR/NFR: `ENGINE`, `TIMER`, `UI`, `AMBIENT`, `STATS`, `PWA`, `PIP`, `I18N`, `SEO`, `CONTENT`, `PRO`, `ADS`, `EXT`, `EMBED`, `LIB`, `API`, `ANALYTICS`, `PERF`, `A11Y`, `SEC`, `PRIVACY`, `COMPAT`.

Priority labels: `P0` (launch blocker), `P1` (launch), `P2` (post-launch, phase 3), `P3` (later).

---

## 3. Stack (canonical)

| Layer | Choice | Notes |
|---|---|---|
| Site framework | **Astro 5**, static output, content collections (MDX), built-in i18n routing | One vanilla-TypeScript island for the tool; React is a build-time renderer only (`03-architecture.md` ADR-013), never shipped |
| Language | TypeScript, `strict: true`, ESM | Node 22 LTS, pnpm 9 workspaces |
| Styling | Tailwind CSS v4 with design tokens as CSS variables; **shadcn/ui** components rendered at build time (no hydration) | Self-hosted fonts only (D-R26): Geist, Geist Mono, Space Grotesk digits from `/fonts`, metric-matched fallbacks, no third-party font request (`05-frontend-spec.md` §1.2); shadcn's semantic variables alias the `--at-*` tokens (`05-frontend-spec.md` §1.5) |
| PWA | Workbox runtime modules (`workbox-precaching`, `-routing`, `-strategies`, `-expiration`) bundled by esbuild in a post-build step (`scripts/sw.mjs`) — not `@vite-pwa/astro` (`03-architecture.md` ADR-014) | Precache app shell + tool pages; runtime cache for content pages |
| Hosting | **Cloudflare Pages** (+ Pages Functions for `/api/*`) | Preview deploy per PR; `_headers` and `_redirects` files |
| Serverless state | Cloudflare **KV** (licences, embed configs), **Workers Analytics Engine** (events) | No database, no accounts |
| Payments | **Polar.sh** as merchant of record (checkout, licence keys, webhooks) | Alternative: Dodo Payments (UPI) — not in v1 |
| Ads | Google AdSense → Journey by Mediavine → Raptive/Mediavine (content pages only) | Loader module only in content layout |
| Analytics | First-party beacon `POST /api/e` → Analytics Engine; Google Search Console; CrUX | No cookies, no third-party analytics script |
| Extension | **WXT** framework, Manifest V3, Chromium (`chrome.power`) | Firefox has no `power` API → not supported in v1 |
| Library | `@awaketab/wake` — tsup build (ESM + CJS + d.ts), zero deps | Semantic versioning, changesets |
| Testing | Vitest (unit), Playwright (e2e: chromium/firefox/webkit), axe-core, Lighthouse CI | See `13-testing-strategy.md` |
| CI/CD | GitHub Actions → Cloudflare Pages Git integration | See `14-devops.md` |
| OG images | Generated at build (satori + resvg) per page and locale | |
| Errors | Console + first-party `client_error` event (sampled); no Sentry in v1 | |

---

## 4. Repository layout

```
awaketab/
├─ apps/
│  ├─ web/                 # Astro site, PWA, tool island, embed iframe app, PiP page, Pages Functions
│  │  ├─ src/
│  │  │  ├─ pages/         # routes (see §7)
│  │  │  ├─ content/       # MDX collections: for/, on/, vs/, guides/, learn/ (per locale)
│  │  │  ├─ components/    # Astro components (layouts, SEO head, ads slot, sponsor card); ui/ = shadcn/ui primitives, build-time only
│  │  │  ├─ tool/          # the vanilla-TS island: ui/, ambient/, stats/, store.ts, main.ts, ctx.ts, pip.ts, pip-mirror.ts
│  │  │  ├─ sw.ts          # service worker source (bundled to dist/sw.js by scripts/sw.mjs)
│  │  │  ├─ i18n/          # ui strings: en.json, es.json, pt-br.json, de.json, fr.json, ja.json, zh.json, hi.json
│  │  │  ├─ styles/        # tokens.css, base.css
│  │  │  └─ lib/           # seo.ts (JSON-LD), og.ts, analytics.ts, ads.ts, license.ts
│  │  ├─ functions/api/    # Cloudflare Pages Functions: e.ts, license/*.ts, webhooks/polar.ts, embed/config.ts, health.ts
│  │  ├─ public/           # icons, manifest, robots.txt, ads.txt, fallback video, _headers, _redirects
│  │  └─ astro.config.mjs
│  └─ extension/           # WXT project (popup, options, background service worker)
├─ packages/
│  ├─ wake/                # @awaketab/wake — low-level Screen Wake Lock + fallback + status events
│  └─ core/                # @awaketab/core — session engine, plans, stats, storage schema, licence token verification (framework-agnostic; shared by web + extension)
├─ docs/                   # this documentation set
├─ .github/workflows/      # ci.yml, lighthouse.yml, release.yml
├─ pnpm-workspace.yaml · package.json · turbo.json (optional) · CLAUDE.md
```

---

## 5. Engine and session vocabulary

### 5.1 Lock states (`@awaketab/wake`) — exactly seven

| State | Meaning | Status pill (en) | Pill colour token |
|---|---|---|---|
| `idle` | No lock requested | "Ready" | neutral |
| `requesting` | `navigator.wakeLock.request('screen')` in flight | "Starting…" | neutral |
| `held` | Sentinel alive | "Screen awake" | accent (lamp) |
| `lost` | Sentinel released by the browser (tab hidden, OS) — will re-request on `visibilitychange` | "Paused — tab hidden" | warn |
| `denied` | Request rejected (`NotAllowedError`: hidden doc, policy, Safari before a tap, Firefox at ≤ 5 % battery) | "Blocked — here's the fix" | bad |
| `unsupported` | `navigator.wakeLock` absent | "Tap to use the fallback" | neutral |
| `fallback` | Hidden 1-frame video loop active (user gesture given) | "Awake via video fallback" | accent (lamp, muted) |

Only `held` and `fallback` may show a running timer. Transitions are specified in `04-engine-spec.md`.

**Extension system level (display copy only, not a state).** The extension's `system` level holds the same `held` state, but `chrome.power` then keeps only the computer awake and the display may still dim, turn off or lock. So a held system-level lock never shows "Screen awake": the popup pill text is the extension-only key `ext.pill.systemHeld` ("System awake") with the secondary line `ext.pill.system` ("Screen may dim or lock"); the badge stays `SYS`. The seven states above, their `tool.pill.*` copy and the web tool are unchanged (owner decision D-02, `10-extension-spec.md` §3, §13.9 below).

### 5.2 Session (`@awaketab/core`)

| Concept | Values |
|---|---|
| Session status | `inactive` · `active` · `paused` · `completed` · `aborted` |
| Plan type | `indefinite` · `duration` (`ms`) · `until` (`endsAt` epoch ms, local clock) |
| End reason | `completed` · `user` · `lost_timeout` · `denied` · `battery` · `error` |
| Preset IDs | `p15` (15 min) · `p30` · `p45` · `p60` · `p120` · `p240` · `pinf` (∞) · `custom` · `until` |
| Ambient modes | `standard` · `clock` · `focus` · `breathe` · `minimal` · `night` · `message` · `cook` (the `M` order) |
| Theme | `auto` · `light` · `dark` · `oled` |
| End behaviour | `stop` · `prompt_extend` (default) |

Timing rules: ticks every 1000 ms aligned to the wall clock; all arithmetic uses `Date.now()` (never accumulated deltas); an `until` plan re-computes against local time on every tick and on `visibilitychange`.

### 5.3 Keyboard shortcuts (web + PiP)

`Space` toggle · `1`–`6` presets p15…p240 · `0` indefinite · `U` until… · `F` fullscreen · `C` next clock face (`Shift+C` previous) · `D` cycle theme · `M` cycle ambient mode · `P` PiP · `S` Sounds sheet · `Esc` close the innermost layer (dialog → ambient mode → stop the session) · `?` shortcuts overlay.

`Space` toggle · `1`–`6` presets p15…p240 · `0` indefinite · `U` until… · `F` fullscreen · `D` cycle theme · `M` cycle ambient mode · `P` PiP · `N` notes drawer · `Esc` close the innermost layer (dialog → ambient mode → stop the session) · `?` shortcuts overlay.

`Space` toggle · `1`–`6` presets p15…p240 · `0` indefinite · `U` until… · `F` fullscreen · `D` cycle theme · `M` cycle ambient mode · `P` PiP · `S` Sounds sheet · `N` notes drawer · `T` Focus mode on or off · `B` Breathe mode on or off · `I` edit what you're working on · `Esc` close the innermost layer (dialog → ambient mode → stop the session) · `?` shortcuts overlay.

---

## 6. Storage (localStorage, JSON, versioned)

| Key | Contents | Notes |
|---|---|---|
| `at.v1.settings` | `ISettings` object (theme, accent, face, defaultPreset, sound, notifications, endBehaviour, battery, ambient, locale, telemetry, keyboardHints) | Defaults applied on read; schema in `08-data-storage.md` |
| `at.v1.session` | Current/last `ISession` (id, plan, presetId, mode, startedAt, endsAt, status, pausedAt) | Enables resume banner after reload |
| `at.v1.stats` | `{ days: { "YYYY-MM-DD": minutes }, totalMinutes, sessions, longestStreak }` | Day key = **local** date via `Intl.DateTimeFormat('en-CA')`; retained 365 days |
| `at.v1.license` | `{ token, plan, exp, features[], lastValidatedAt, deviceId }` | Token = ES256 JWT signed by our Worker |
| `at.v1.meta` | `{ installedAt, sessionCount, ratingPrompt: { shownAt, action, stars?, rearmAt? }, lastSeenVersion }` | `rearmAt` since v1.3 (§13.8) |
| `at.v1.onboarding` | `{ dismissedTips: [] }` | |
| `at.v1.notes` | IndexedDB, not localStorage: database `awaketab`, store `notes`, this key. `{ v: 1, notes: [{ id, title, doc, createdAt, updatedAt, pinned? }], current?, voiceOk? }` | Never leaves the device; schema in `08-data-storage.md` §2.1a |

`BroadcastChannel('awaketab')` coordinates multiple tabs (second-tab warning, single active lock). Migrations: `migrate(fromVersion)` in `@awaketab/core/storage`; bump prefix to `at.v2.` only for breaking changes.

---

## 7. Routes (English at root; locales under `/{lang}/`)

| Route | Purpose |
|---|---|
| `/` | The tool + full home content |
| `/15m` `/30m` `/45m` `/1h` `/2h` `/4h` `/8h` | Preset deep links (indexable duration pages; canonical self) |
| `/until/HH-MM` | Until-time deep link (noindex, canonical `/`) |
| `/for/{slug}` | 14 scenario pages (tool embedded with scenario preset) |
| `/on/{slug}` | 11 device/browser pages |
| `/vs/{slug}` | 7 comparison pages |
| `/guides/{slug}` | 7 OS how-to pages |
| `/learn/{slug}` | 8 docs pages: how AwakeTab works, honest limits, FAQ, reference and developer pages (§13.24) |
| Retired content URLs (OD-3, §13.20) | `/for/second-monitor` → `/guides/second-monitor-turns-off`, `/on/windows-10` → `/on/windows-11`, `/guides/modern-standby` → `/guides/lock-screen-vs-sleep`, `/learn/nosleep-js-vs-wake-lock` → `/vs/nosleep-js` (all 301, `_redirects`). Cut, no redirect (404): `/for/navigation`, `/for/live-streams`, `/for/exams-proctoring`, `/for/baby-monitor` |
| `/pro` · `/pro/activate` · `/pro/manage` | Pricing, key entry, device list |
| `/extension` · `/embed` · `/kiosk` · `/library` | Product landing pages |
| `/embed/cook` | Iframe app for the Cook Mode widget (noindex) |
| `/pip` · `/{lang}/pip` | Popup fallback for Document Picture-in-Picture, in the opener's language (noindex, `Disallow`ed, not in any sitemap, no cards or ads) |
| `/about` · `/privacy` · `/terms` · `/changelog` · `/support-matrix` · `/how-we-tested` | Trust and freshness pages |
| `/404` | Offers the tool |
| `/api/*` | Pages Functions (see §9) |

Spelling: page URLs have no trailing slash (`/30m`, `/for/cooking`, `/es/for/cocinar`), except `/` and the locale homes `/{lang}/` (`/es/`). Canonicals, hreflang, sitemaps and links use exactly these spellings. The build writes each page where Cloudflare Pages serves it without a redirect (`x.html`, and `{lang}/index.html` for the homes; `14-devops.md` §2.1).

Query params (all optional): `autostart=1`, `mode=`, `msg=` (≤ 80 chars), `theme=`, `preset=`, `until=HH-MM`, `ref=` (attribution source; never stored beyond the event).

Locales and folders: `en` (root), `es`, `pt-br`, `de`, `fr`, `ja`, `zh` (Simplified), `hi`. `x-default` → root. Phase 2 locales: `id`, `tr`, `ko`, `it`, `ru`, `vi`, `ar`.

Content slugs (English canonical; translated slugs for the Latin-script locales `es`, `pt-br`, `de`, `fr` only, with hreflang linking; `ja`, `zh` and `hi` keep the English slug, e.g. `/ja/for/cooking` — `06-content-seo-spec.md` §5, decision D-03):
- `/for/`: cooking · presentations · downloads · ai-agents · dashboards · kiosk · sheet-music · reading · night-clock · video-calls · teleprompter · workouts · work-laptop · classroom
- `/on/`: iphone-safari · ios-home-screen · ipad · android-chrome · samsung-internet · chromebook · windows-11 ("Windows 11 and 10") · macos · linux · firefox · edge
- `/vs/`: caffeine · amphetamine · powertoys-awake · caffeinate-command · nosleep-page · nosleep-js · mouse-jigglers
- `/guides/`: windows-11-screen-turns-off-after-1-minute · mac-prevent-sleep-lid-closed · iphone-auto-lock-never-greyed-out · chrome-energy-saver · android-screen-timeout-one-app · second-monitor-turns-off · lock-screen-vs-sleep
- `/learn/`: how-awaketab-works · honest-limits · faq · screen-wake-lock-api-guide · does-a-wake-lock-keep-teams-green · low-power-mode-and-wake-locks · browser-support-matrix · how-we-tested

---

## 8. Plans, prices, gates

### 8.1 Products (Polar.sh)

| Plan ID | Name | Price | Term | Activations |
|---|---|---|---|---|
| `pro_yearly` | AwakeTab Pro (yearly) | $12 / year | 12 months + 7-day grace | 5 devices |
| `pro_lifetime` | AwakeTab Pro (lifetime) | $29 one-time ($19 for the first 90 days after Pro launch) | perpetual; token re-validates every 90 days | 5 devices |
| `biz_embed_site_yearly` | AwakeTab Embed licence | $29 / year per site (domain) | 12 months | 1 domain (+ staging subdomain) |
| `biz_kiosk_site` | AwakeTab Kiosk licence | $19 one-time per site; `biz_kiosk_5` $49 for five | perpetual | per site |

### 8.2 Feature gates (Pro unless stated)

`ambient.packs` · `ambient.message` · `ambient.logo` · `schedules` · `sounds.custom` · `stats.history` (beyond 7 days) · `stats.export` · `pip.pro` (PiP with ambient modes) · `ext.autostart` · `ext.schedules` · `ads.free` · `embed.noattrib` (Business) · `kiosk.branding` (Business).

Free always includes: the lock, every preset, custom duration, until-time, session restore, standard + clock + minimal + breathe ambient, the Focus timer (one block at a time, with pause and skip), the session intention and the second time zone, one chime, notifications, 7-day stats, PiP basic, keyboard shortcuts, PWA, all languages, the colour themes Clear Night, Paper and Nord, the lamps Aqua, Violet, Amber and Teal, the backgrounds None, Grain, Dots and Grid, and the presets built from them. `ambient.packs` unlocks the other colour themes, lamps (and the custom lamp), backgrounds and presets, and the Focus timer's auto-cycle (§13.27); every one of them previews for 5 minutes first (§13.25).

### 8.3 Monetization gates (from the blueprint)

| Gate | Condition | Turns on |
|---|---|---|
| G0 | Launch (Tier 0 + 1 live) | Donate links (Buy Me a Coffee, GitHub Sponsors). No ads, no Pro |
| G1 | 60 English pages indexed | AdSense on content pages; affiliate cards |
| G2 | Tier 2 shipped | Pro via Polar; `ads.free` |
| G3 | 1,000 Tier-1 sessions / 30 d and domain ≥ 4 months | Journey by Mediavine; network-managed in-view refresh, content pages only |
| G4 | 25k pv/mo, ≥ 50% Tier-1, long-form majority | Raptive application (or stay Mediavine) |
| G5 | 100k visits / mo | Sponsor card on awake screen; push Embed/Kiosk licences |

Ad rules (non-negotiable): Google ads never on the awake screen, `/pip`, `/embed/*`, or in the extension; never auto-refresh under AdSense; ≤ 3 ads in view; ads-to-content ≤ 20%; ad scripts load after LCP; slots have fixed dimensions.

---

## 9. API surface (Cloudflare Pages Functions under `/api`)

| Method · Path | Purpose | Auth |
|---|---|---|
| `POST /api/e` | Analytics events batch (≤ 20 events, ≤ 8 KB) | none; rate-limited by IP hash |
| `POST /api/license/activate` | `{ key, deviceId, deviceLabel }` → `{ token, plan, features, exp, activations }` | licence key |
| `POST /api/license/validate` | `{ token }` → fresh token or `{ revoked: true }` | token |
| `POST /api/license/deactivate` | `{ token, deviceId }` | token |
| `POST /api/webhooks/polar` | Polar events (`order.created`, `subscription.*`, `benefit_grant.*`) → KV | HMAC signature |
| `GET /api/embed/config?domain=` | `{ licensed, attribution, theme, expiresAt }` for the widget | none (public, cached 5 min) |
| `GET /api/health` | `{ ok, version, polar }` (`polar`: `sandbox` \| `production`, §13.14) | none |
| `POST /api/csp` | CSP violation reports (Reporting API or legacy `report-uri` body, ≤ 8 KB) → `client_error {code:'csp'}` | none; rate-limited by IP hash (§13.14) |

Token: JWT, `alg: ES256`, claims `{ sub, plan, features, dev, iat, exp, ver }`; public key shipped in `@awaketab/core`; verified offline in the browser and the extension.

---

## 10. Analytics events (first-party, no PII)

`page_view` · `session_start {planType, presetId, mode, source}` · `session_end {reason, durationMin}` · `lock_state {from, to}` · `lock_denied {reason}` · `fallback_used` · `resume_shown` · `resume_accepted` · `pwa_install` · `pip_open` · `share_click` · `pro_view` · `pro_checkout_click {plan}` · `pro_activated {plan}` · `rating_prompt {action}` · `extension_click` · `ad_slot_loaded {page}` · `sponsor_view` · `sponsor_click` · `client_error {code}` (sampled 10%).

Common fields: `ts`, `path` (no query string), `locale`, `ua` class (browser family + major, OS family), `viewport` class, `sid` (per-tab random session id, not persisted), `ver`. Never: IP (hashed only for rate limiting, not stored), user id, exact UA, referrer beyond origin.

---

## 11. Budgets and thresholds

| Budget | Value |
|---|---|
| Tool pages JS (gz) | ≤ 40 KB total; ≤ 15 KB in the critical path. *Critical* = the page's module entry scripts plus their static-import closure; *total* = the closure over static **and** dynamic `import()` edges from those entries — everything the tool page can ever load, and nothing another page loads (§13.10) |
| Embed widget JS (gz) | `/embed/cook` iframe app ≤ 25 KB (same full-closure rule); loader `/embed.js` ≤ 3 KB |
| Tool pages CSS (gz) | ≤ 20 KB, critical inlined |
| Third-party requests on tool pages | 0 |
| Hydrated framework islands on any page | 0 (`<astro-island>` in built HTML, or a React runtime chunk in `dist/_astro/`, fails the size gate) |
| LCP (lab, mobile emulation) | ≤ 1.2 s; field p75 ≤ 2.0 s |
| INP field p75 | ≤ 100 ms |
| CLS | 0 (fixed slot sizes everywhere) |
| Lighthouse (mobile) | Performance ≥ 95 · Accessibility 100 · Best Practices 100 · SEO 100 |
| Content pages | Ads load after LCP; total JS ≤ 60 KB before ads |
| Wake lock time-to-request | ≤ 300 ms after `DOMContentLoaded` when `autostart` conditions met |
| Availability | 99.9% (static on Cloudflare); `/api/*` 99.5% |
| Browser support | Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen app ≥ 18.4 (native); older → fallback; UI tested on last 2 versions |

**LCP (lab), as measured on 2026-09-27** (`metrics/lighthouse-local-2026-09-27-lcp.md`): nothing may finish before the largest paint except the document, because Lighthouse's simulation (150 ms RTT, 1.6 Mbps) puts every such request on the LCP path, about 150 ms per round trip. What stays there by design: the HTML (inlined CSS, the boot script, minified since 2026-09-27) and the one preloaded font, Geist, which the largest text uses. Module entries, Geist Mono and the ads start after the first paint; Space Grotesk loads only with the Bold face. The budget is not yet met: the open causes and their owners are listed in that report.

---

## 12. Roadmap phases (canonical dates are relative to kickoff)

| Phase | Window | Exit criterion |
|---|---|---|
| P0 Claim | Days 1–3 | Domains resolve to holding page with correct meta/OG/schema |
| P1 Trust core + parity + home | Weeks 1–2 | CWV green, a11y 100, pill never lies |
| P2 Content + launch | Weeks 3–5 | 60 EN URLs indexed; extension approved; AdSense approved (G1) |
| P3 Engagement + authority | Weeks 6–9 | Library published; research live; Pro on sale (G2) |
| P4 Compound | Ongoing | — |

---

## 13. Accepted proposals (v1.1 — consolidated from docs 02–09, 15)

The identifiers below were proposed while writing the other documents and are now canonical. Docs that still say "PROPOSED" for any of these are to be read as accepted.

### 13.1 Engine and session constants

| Identifier | Value / meaning |
|---|---|
| `LOST_TIMEOUT_MS` | 6 h (21,600,000 ms). A session whose lock has been `lost` continuously for longer ends with reason `lost_timeout` and is not offered for resume. Finite plans end at `endsAt` if that comes first |
| `CUSTOM_MAX_MS` | 7 days — upper bound for `custom` durations; zero/negative rejected inline |
| `TLockReason` | `request` · `acquired` · `fallback_started` · `released_hidden` · `released_platform` · `denied` · `unsupported` · `user_release` · `retry` · `destroyed` (see 04 §3) |
| `TAdviceCode` | `hidden_document` · `permissions_policy` · `insecure_context` · `unsupported_browser` · `ios_safari_old` · `firefox_old` · `iframe_no_allow` — UI maps each to `tool.advice.<code>` |
| `Plan.until.wall` | `'HH:MM'` string kept with `endsAt` so the UI can re-derive after clock changes |
| `ISession` extra fields | `pausedMs`, `endedAt`, `endReason`, `awakeSeconds` (seconds in `held` or `fallback`; feeds stats), `modeState` (per-mode data, e.g. `cookTimers[]`) |
| `ISettings` extra fields | `keyboardShortcuts: boolean` (enables single-key shortcuts; WCAG 2.1.4) distinct from `keyboardHints: boolean` (shows hints); `lastCustomMs`; `ambient.message` |
| `TTabMessage` | `{type:'hello'|'lock'|'state'|'intent'|'bye', tabId, ts, …}` on `BroadcastChannel('awaketab')`; `tabId` in `sessionStorage['at.tabId']`; `intent` and the `state` snapshot fields since v1.3 (§13.8) |
| CSS token namespace | `--at-*` (e.g. `--at-accent`, `--at-accent-text`: the lamp's light value, `#087B87` for Aqua, AA for text). Full list: `05-frontend-spec.md` §1.1–§1.3, new names in §13.18 |
| `/8h` route | Maps to a `custom` plan of 480 min; there is no `p480` chip |

### 13.2 Routes and files

| Identifier | Decision |
|---|---|
| Hub routes `/for`, `/on`, `/vs`, `/guides`, `/learn` | Exist as indexable hub pages (breadcrumb level 2) |
| `/support-matrix`, `/how-we-tested` | 301 → `/learn/browser-support-matrix`, `/learn/how-we-tested` (one indexable URL per topic) |
| `source=` query param | Same handling as `ref=` (PWA `start_url`, shortcuts) |
| `logo=` query param (https URL) and `#lic=<token>` hash | Kiosk licence unlocks; hash verified offline, stored to `at.v1.license`, then stripped |
| `/pro/activate?ext=1` | Hand-off from the extension (shows the key to copy; never activates this browser, §13.12) |
| `/pro/activate?checkout=cancelled\|failed\|help` | B7 (O-26): our own checkout-return pages ("Checkout closed", "The payment didn't go through", "Where is my licence key?"). The `checkout_id` auto-fill lands on the same layout: success → "Pro is active", `invalid_key` → failed, still `polar_unavailable` after every retry → help. No request is made for `?checkout=` |
| `src/i18n/slugs.json` | Translated slug map keyed by collection + EN slug; `es`, `pt-br`, `de`, `fr` keys only (`ja` / `zh` / `hi` use the EN slug) |
| `src/data/support-matrix.json` | Single source for every browser/OS support claim (site, docs, tests) |
| `data/ratings.json` | Build input for `aggregateRating` (≥ 25 real ratings); exported from KV by a scheduled Worker |
| `functions/_lib/` | Shared function code (not a route) |
| `/config/ads.json`, `/config/sponsor.json` | Remote flags, `Cache-Control: public, max-age=300` |
| `docs/metrics/YYYY-MM.md` | Monthly KPI notes |
| Frontmatter extra fields | `author`, `published`, `updated` |
| Components | `ContentLayout.astro`, `AdSlot.astro`, `SponsorCard.astro`, `AffiliateCard.astro` |

### 13.3 API, storage (server) and configuration

| Identifier | Decision |
|---|---|
| `POST /api/rating` | `{ stars 1–5, text?, locale, ver }` → KV `rating:{id}`; feeds `data/ratings.json` |
| Activate request/response | adds `checkoutId?`, `embed?: { domain }`; validate response includes `activations`; `{ checkoutId, lookup: true }` → `{ key, plan }` without activating (§13.12) |
| API error codes | `invalid_key` · `activation_limit` · `revoked` · `refunded` · `polar_unavailable` · `rate_limited` · `bad_token` · `bad_request` |
| KV keys | `lic:{keyHash}` · `cus:{customerId}` · `wh:{eventId}` (TTL 30 d) · `ord:{orderId}` · `embed:{domain}` · `rl:{route}:{ipHash}:{bucket}` (TTL 120 s) · `rating:{id}` · D-06: `lk:{polarLicenseKeyId}` · `grant:{benefitGrantId}` · `sub:{subscriptionId}` (§13.15) |
| Kiosk token expiry | `exp = now + 365 d`, re-validate every 30 d when online |
| Secrets (Pages Functions) | `POLAR_ACCESS_TOKEN` · `POLAR_WEBHOOK_SECRET` · `POLAR_ORGANIZATION_ID` · `POLAR_BENEFIT_MAP` (JSON benefit-id → plan) · `LICENSE_SIGNING_KEY` (private JWK, ES256) · `LICENSE_SIGNING_VER` (integer `ver` claim) · `LICENSE_KEY_ENC_KEY` (32-byte base64, AES-GCM for raw key at rest) · `RATE_LIMIT_SALT` · `TURNSTILE_SECRET_KEY` (optional) |
| Bindings | KV `LICENSES` · Analytics Engine `EVENTS` (dataset `awaketab_events`) |
| KV ops (F-02, 2026-09-26) | Workflow `.github/workflows/kv-backup.yml` (weekly, artifact `kv-backup-<run id>` with `{namespace}-YYYY-MM-DD.jsonl.enc`, 84 days) · root scripts `pnpm kv:backup` · `pnpm kv:restore <file>` · `pnpm kv:reencrypt` (code in `apps/web/scripts/kv/`) · GitHub Actions secrets `CLOUDFLARE_API_TOKEN` (KV Read) · `CLOUDFLARE_ACCOUNT_ID` · `KV_LICENSES_ID` · `KV_LICENSES_PREVIEW_ID` (optional) · `BACKUP_ENCRYPTION_KEY` (32-byte base64) · operator-only env for rotation `OLD_LICENSE_KEY_ENC_KEY` · `NEW_LICENSE_KEY_ENC_KEY` · backup format `awaketab-kv-backup` v1 (`14-devops.md` §10–§11) |
| Public build vars | `PUBLIC_SITE_URL` · `PUBLIC_ADS_ENABLED` (`'0'`/`'1'`) · `PUBLIC_SPONSOR_ENABLED` · `PUBLIC_POLAR_SERVER` (`production`/`sandbox`, default `sandbox`; the Functions read the same variable at run time, §13.14) · `INDEXNOW_KEY` (optional, §13.14) |
| Code constants | `LICENSE_PUBLIC_KEYS: Record<number, JsonWebKey>` (in `@awaketab/core`; `PRODUCTION_LICENSE_PUBLIC_KEYS` plus the dev key in sandbox builds only, §13.14) · `PLAN_PRICES` · `PLAN_FEATURES` · `CHECKOUT_LINKS` (`src/lib/checkout.ts`, §13.14) · `PRO_LAUNCH_END` · `AD_UNITS` · `AD_CLIENT` |
| Polar labels | benefits `lk_pro_yearly`, `lk_pro_lifetime`, `lk_embed`, `lk_kiosk_site`, `lk_kiosk_5`; discount `LAUNCH19` ($10 off `pro_lifetime`, 90 days); product `sponsor_month` |
| CMP | Google-certified CMP (Funding Choices) on content pages only, EEA/UK/CH visitors; tool pages never load a CMP or set cookies |

### 13.4 Analytics additions

Events: `session_extend {addedMin}` · `affiliate_click {page, sku}` · `rating_submitted {stars}`. Fields: `sponsorId` on `sponsor_view`/`sponsor_click`; `client_error.code` ∈ `state_mismatch` · `bad_param` · `storage_unavailable` · `sw_update_failed` · `license_verify_failed`.

### 13.5 i18n additions

Groups `pro.*`, `sponsor.label`, `affiliate.disclosure`, `tool.advice.*`; keys `license.info.syncing`, `tool.pill.idle.deferred` ("Starts when you open this tab").

### 13.6 Planning

Risk IDs use `R-##` (see 15-implementation-plan.md).

### 13.7 UI component layer (v1.2 — shadcn/ui, build time only)

Accepted on 2026-09-11 (owner-directed; `03-architecture.md` ADR-013). Proposed in `05-frontend-spec.md` §15.

| Identifier | Decision |
|---|---|
| `apps/web/src/components/ui/*.tsx` | shadcn/ui primitives (new-york style, neutral base, CSS variables): `button` · `badge` (the pages use their `buttonVariants()` and `badgeVariants()` helpers; the unused primitives were removed). Add more with `pnpm dlx shadcn@4.21.0 add <name>` from `apps/web`. Rendered by Astro at build time only — no `client:*` directive anywhere; interactive primitives that need client JS (Dialog, Sheet, Tabs, Accordion, Tooltip, Select, DropdownMenu, …) are not used |
| `@/*` path alias | `./src/*` in `apps/web/tsconfig.json`; `components.json` aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks` |
| shadcn semantic variables | Aliases of `--at-*`, never new colours: `--background`→`--at-ground` · `--foreground`→`--at-ink` · `--card`/`--popover`→`--at-surface` · `--primary`→`--at-accent-text` · `--primary-foreground`→`--at-on-accent` · `--secondary`/`--muted`→`color-mix(in srgb, var(--at-ink) 6%, var(--at-surface))` · `--muted-foreground`→`--at-muted` · `--accent`→`color-mix(in srgb, var(--at-accent) 12%, var(--at-surface))` · `--destructive`→`--at-bad` · `--border`/`--input`→`--at-line` · `--ring`→`--at-focus` · `--radius`→`--at-r-md` · `--font-sans`→`--at-font`. Full table with radius scale in `05-frontend-spec.md` §1.5 |
| `--success` · `--warning` · `--night` | Custom semantic variables (not in stock shadcn) → `--at-good` · `--at-warn` · `--at-night` |
| `@custom-variant dark` | `[data-theme="dark"]`, `[data-theme="oled"]`, and `prefers-color-scheme: dark` when no `data-theme` is set |
| `hydrated` · `reactChunks` | Fields in the `scripts/size.mjs` report; both must be `[]` (§11) |
| `scripts/prune-unreferenced.mjs` · `scripts/locked.mjs` | Build steps in `apps/web`: prune deletes `dist/_astro/*.js` chunks nothing references (runs after `astro build`, before `sitemap.mjs`); `locked.mjs -- <cmd>` holds a `mkdir` lock at `apps/web/.build-lock` so concurrent builds do not race |
| `AT_DIST` | Environment variable: alternate output directory (`apps/web/dist-*`, git-ignored) for `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO tests |

### 13.8 Engagement layer (v1.3 — M6: E10 + remaining E4)

Accepted on 2026-09-26 with the M6 implementation; confirmed by owner decision D-04. Specs: `04-engine-spec.md` §9, §11, §14, §16; `05-frontend-spec.md` §1.1a, §3.13–§3.24, §8.2, §9, §13; `03-architecture.md` ADR-014.

**Engine (`@awaketab/core`)**

| Identifier | Decision |
|---|---|
| `ISessionEngine.pause({ keepLock?: boolean })` | `keepLock: true` pauses the clock but keeps the lock held (cook mode); `resume()` reuses the kept lock if it is still `held`/`fallback`, else re-requests |
| `ISessionEngine.addTime(ms)` | Adds time to a live finite plan in place (PiP `+15`). `duration` → `ms` and `endsAt` grow; `until` → becomes a `duration` plan with the same moved deadline. Ignored for `indefinite`, `ms ≤ 0`, or when remaining + `ms` > `CUSTOM_MAX_MS`. Tracks `session_extend {addedMin}` |
| `ISessionEngine.updateSession({ mode?, modeState? })` | Persists the ambient mode and merges per-mode data into `ISession.modeState` on the live session |
| `TTabMessage` `intent` | `{ type: 'intent', tabId, ts, target, action: 'stop' \| 'add', ms? }` — only the tab whose `tabId === target` acts (`stop()` or `addTime(ms)`) |
| `TTabMessage` `state` snapshot fields | Optional `endsAt`, `planType`, `pausedMs`, `pausedAt`, `wall`; the engine posts a snapshot on every tick, status change and lock change, and in reply to `hello` |
| `ISession.modeState.cookTimers` | `Array<{ id, name, durationMs, endsAt, doneAt: number \| null }>`, ≤ 3 entries (`08-data-storage.md` §2.2) |
| `IMeta.ratingPrompt.rearmAt` | `sessionCount` at which a `later` answer asks again (`sessionCount + 10`) |
| Battery monitor | One cached `BatteryManager` per engine; warn once per session; hysteresis re-arm (`04-engine-spec.md` §11) |

**Tool island (`apps/web/src/tool`)**

| Identifier | Decision |
|---|---|
| `IToolCtx` (`ctx.ts`) | The context `main.ts` passes to every lazy module (`ambient/*`, `stats/*`, `end.ts`, `pip.ts`, `ui/rating.ts`, `ui/settings.ts`, `ui/actions.ts`, `sponsor.ts`): `root`, `store`, `engine`, `lock`, `storage`, `params`, `startPlan`, `stop`, `syncLock`, `track`, `audio`. `hasFeature(ctx, gate)` checks an unexpired licence |
| `TDialogName` | Removed: the open `<dialog>` is the source of truth (`ui/dialog.ts`), so the store no longer mirrors it |
| `TChime` (`signal.ts`) | `end` · `focus` · `timer` — Web Audio oscillator tones, no audio files |
| Notification tags | `at-end` · `at-focus` · `at-cook-{timerId}` |
| Lamp colours (was "accent palettes") | Twelve lamps, keyed by the stored light hex in `LAMPS` (`src/tool/packs/themes/looks.ts`): free `aqua` `#087B87` (default, no attribute) · `violet` `#5A47CF` · `amber` `#A34F00` · `teal` `#0A7565`; `ambient.packs` `mint` `#167A50` · `sky` `#255FBD` · `ice` `#2A6A8A` · `lavender` `#7446B0` · `rose` `#B0366A` · `coral` `#B1452F` · `gold` `#7F6400` · `lime` `#4D7300`; any other valid hex is `custom` (Pro, `--at-custom` on `<html style>`). `settings.accent` stores the hex; the id goes on `<html data-accent>`. `LEGACY_LAMPS` + `lampOf()` migrate the old palette hexes (`08-data-storage.md` §2.1). The inline boot script mirrors both maps so the lamp paints before first frame; `tool/accent.ts` `gateLooks(packs)` drops Pro looks without the licence (it leaves a running preview alone) |
| Ambient gating | Only `message` is gated (`MODE_GATES = { message: 'ambient.message' }`); `ambient.packs` gates palettes, never layouts. `05-frontend-spec.md` §3.13 wins over the E10-T01 wording in `15-implementation-plan.md` |
| `ambient/logic.ts` constants | `AMBIENT_ORDER` (the `M` cycle) · `PIXEL_SHIFT_MS` 60,000 · `PIXEL_SHIFT_PX` 2 · `NIGHT_DIM_AFTER_MS` 30,000 · `BURNIN_DIM_AFTER_MS` 30 min · `FOCUS_LONG_BREAK_MIN` 15 · `COOK_MAX_TIMERS` 3 · `COOK_NAME_MAX` 20 · `COOK_MIN_MS` 1 min · `COOK_MAX_MS` 12 h · `COOK_FLASH_MS` 10,000 |
| `end.ts` constants | `TITLE_FLASH_MS` 1000 · `TITLE_FLASH_MIN_MS` 3000 · `RATING_DELAY_MS` 2000 · `COUNTED_SESSION_S` 300 (a completed session counts toward `meta.sessionCount` only if ≥ 5 min awake) |
| `ui/rating.ts` constants | `RATING_MIN_SESSIONS` 5 · `RATING_REARM_SESSIONS` 10 · `RATING_TEXT_MAX` 280 |
| `stats/heatmap.ts` constants | `HEATMAP_WEEKS` 12 · `FREE_HISTORY_DAYS` 7 |
| `pip.ts` / `pip-mirror.ts` constants | `PIP_SIZE` 280 × 120 · `PIP_ADD_MS` 15 min · `MIRROR_STALE_MS` 4000 (the `/pip` popup shows "Ready" instead of a stale timer after 4 s without a snapshot) |
| `BaseLayout` `bare` prop | Chrome-less page (no shell padding, separator or footer); used by `/pip` |
| `/config/sponsor.json` | `{ enabled, id, name, text, url }`; `id` `[a-z0-9_-]{1,32}`, `url` must be `https:`; validated client-side as untrusted input |

**Tokens (`tokens.css`)**

| Identifier | Value |
|---|---|
| `--at-t-ambient` | `clamp(4.5rem, 22vw, 15rem)` |
| `--at-night-digit` | `#FF5A3C` (night-mode digits) |
| `--at-d-slow` | `320ms` |
| `[data-accent="violet\|mint\|sky"]` blocks | Override `--at-accent`, `--at-accent-text`, `--at-on-accent`, `--at-focus` per lamp, with `dark`/`oled` variants (`05-frontend-spec.md` §1.1a) |

**Build, PWA and budgets**

| Identifier | Decision |
|---|---|
| `apps/web/src/sw.ts` · `apps/web/scripts/sw.mjs` → `dist/sw.js` | Service worker built after `prune-unreferenced.mjs` (ADR-014). Precache manifest injected in place of `self.__WB_MANIFEST`; runtime caches `at-content` · `at-img` · `at-embed`; update message `SKIP_WAITING`. `apps/web/public/sw.js` is removed. Offline fallback: `src/sw-fallback.ts` `offlinePages(pathname)` names the cached shell pages an uncached navigation may open, best first: a `/pip` or `/{lang}/pip` only a cached `/pip` (own language, English, then the other locales), any other page a cached home; none for `/api/*` or `/embed/*` |
| `/sw.js` headers | `Cache-Control: no-cache` · `Service-Worker-Allowed: /` (`scripts/headers.mjs`) |
| `vite.build.modulePreload: false` | In `astro.config.mjs`: Vite emits no `__vite__mapDeps` dependency table and injects no `<link rel="modulepreload">` for lazy chunks, which load on first use. The small `preload-helper` chunk (~0.7 KB gz) is still statically imported by the entry and counted in `criticalJs` |
| `src/i18n/critical.json` | Removed. Each tool page embeds its full locale catalog as `<script type="application/json" data-i18n-catalog>` (`ToolPanel.astro`, `/pip`); `setCatalog()` reads it at boot |
| `criticalJs` in `scripts/size.mjs` | The entry scripts **plus their static-import closure** (shared chunks Rollup splits out). Dynamic `import()` is excluded. Previously only `<script src>` files were counted, which under-reported shared chunks |

**Analytics fields used by M6**

`session_extend {addedMin}` (extend prompt and PiP `+15`) · `rating_prompt {action: 'rate' | 'later' | 'never', stars?}` · `rating_submitted {stars}` · `sponsor_view {sponsorId}` · `sponsor_click {sponsorId}` · `pro_view {from}` (`from: 'message'` from the message-mode Pro card, `'preview'` from a preview chip, `'notes'` from the notes drawer's Pro panel).

**i18n**

55 new keys, present in all 8 locales: groups `ambient.*` (titles, focus, message, cook timers), `stats.*`, `rating.*`, `end.*` (`end.notify.title`, `end.notify.body`, `end.titleFlash`), `settings.accent.*`, `settings.ambient.*` additions, `settings.notifications.unavailable`, `pip.add15.label`, `pip.empty`, `tool.toast.batteryLow`, `tool.toast.proMessage`.

### 13.9 Extension (M7 — E11)

Accepted on 2026-09-26 (owner decision D-04, `LAUNCH-AUDIT.md`), as written with the M7 implementation (`10-extension-spec.md` §13). The `// PROPOSED` markers are gone from the code.

**Storage and sync**

| Identifier | Decision |
|---|---|
| `at.v1.ext` | `IExtSettings { v: 1, level: 'display' \| 'system', schedules: ISchedule[], autostart: { browserStart: boolean, sites: IAutostartSite[] } }` in `chrome.storage.local`, mirrored to `chrome.storage.sync` |
| `at.v1.device` | `{ v: 1, id }` — random UUID per browser profile, `chrome.storage.local` only; the licence `deviceId` |
| `SYNC_KEYS` | `at.v1.settings`, `at.v1.ext` — the only keys copied to `chrome.storage.sync` (never `at.v1.license`, `at.v1.device`, `at.v1.session`, `at.v1.stats`) |
| `EXT_DEFAULT_SETTINGS` | `DEFAULT_SETTINGS` with `telemetry: false`, `notifications: false` (extension defaults) |
| `SESSION_COALESCE_MS` | 10,000 — session writes that only advance `awakeSeconds` are batched |
| `ISession.modeState` in the extension | `{ level, origin, dismissed? }`; `TOrigin` = `user` · `command` · `schedule` · `autostart` · `startup` |
| `ISchedule` | `{ id, days: number[] (0 = Sun … 6 = Sat), start: 'HH:MM', end: 'HH:MM', level }`; `SCHEDULES_MAX` 20 |
| `IAutostartSite` | `{ host ('docs.example.com' \| '*.example.com'), durationMin: number \| null }`; `AUTOSTART_SITES_MAX` 50 |

**Worker, alarms and UI**

| Identifier | Decision |
|---|---|
| Alarm names | `at.tick` (every `TICK_PERIOD_MIN` 0.5 while a session is live) · `at.end` (at the session end) · `at.license` (`LICENSE_PERIOD_MIN` 60) · `at.sched.<id>.start` / `at.sched.<id>.end` (`SCHEDULE_ALARM_PREFIX`) |
| `EXTEND_WINDOW_MS` | 5 min — the popup's extend prompt after a user session completes; `EXTEND_MS` = 15 / 30 / 60 min |
| `STALE_NOTIFY_MS` | 5 min — a session that ended while the worker slept is announced only within this window |
| `SYNC_DEBOUNCE_MS` | 2,000 |
| Notification id | `at-end` (same tag as the web); buttons `+30 min` (index 0) / `Stop` (index 1) |
| `BADGE_COLORS` | `display` `#087B87` (Aqua light, 5.0:1 with white; amber means paused, `DESIGN.md` §2.1) · `system` `#2B3A67`; text `#FFFFFF`; text `ON` / `SYS` / `<n>m` / `<n>h` |
| System-level pill (D-02) | `status.ts` `pillTextKey(lock, level)`: a held `system` lock → `ext.pill.systemHeld` "System awake" (never `tool.pill.held`), secondary line `pillExtraKey()` → `ext.pill.system` "Screen may dim or lock"; badge tooltip `AwakeTab — System awake · Screen may dim or lock`. Display copy only; the lock state stays `held` (§5.1) |
| `EXT_KEYS` | `{ ext: 'at.v1.ext', device: 'at.v1.device' }` (`settings.ts`) |
| Unsupported pill in the extension (B9) | `pillTextKey('unsupported', …)` → `tool.pill.denied` ("Blocked — here's the fix"): the extension has no video fallback, so it never offers one. `data-lock` stays `unsupported`; the seven states and their web copy are unchanged |
| `extend {ms}` on a live session (B9) | Adds the time to the running session (`ISessionEngine.addTime`), except a `schedule` session, which keeps its window; after time is up it starts a new `custom` session of that length as before |
| `WELCOME_PAGE` (B9, O-25) | `welcome.html`, opened once by `onInstalled('install')`, which also writes `at.v1.meta.lastSeenVersion`; an update from a build without it records `previousVersion` |
| Popup UI state in existing keys (B9) | "New in {version}" chip: `at.v1.meta.lastSeenVersion` ≠ manifest version (opening the chip writes the version) · first-open tips: `ext-first-open` in `at.v1.onboarding.dismissedTips` · language: `at.v1.settings.locale` (`null` = browser language). No new storage key |
| Popup states (B9) | `<main data-mode>`: `ready` · `starting` · `held` · `ended` (time's up, `IExtState.extend`) · `blocked` (`denied` or `unsupported`) |
| `TExtRequest` | Popup → worker messages: `state` · `start {presetId}` · `until {wall}` · `stop` · `toggle` · `extend {ms}` · `dismiss` · `level {level}` |
| `ISessionOptions.resumeIndefiniteMs` | `@awaketab/core`: how long an `indefinite` session stays resumable (default 12 h; the extension passes `Infinity`) |
| Extension times | `createTimeFormat()` (`src/format.ts`): 12-hour with AM/PM in English, the locale's own clock elsewhere unless the user picks 12 or 24 h; `hour()` names the week axis `12 AM · 6 AM · Noon · 6 PM · 12 AM` (`ext.time.noon`, 12-hour clocks only); `range(start, end)` writes a schedule window as "9:00 AM to 6:00 PM" (`ext.time.span`, plus `ext.time.nextDay` past midnight) for the popup and options |
| Auto-start and schedule popup lines | A held session started by auto-start (`startup` or `autostart` origin) with no end: caption `tool.timer.elapsedCaption` ("Elapsed"), meta `ext.popup.sinceMeta` ("Since 8:02 AM"), level help shown, no "Awake for" kicker. A scheduled session: `ext.schedule.until` plus a second line with its days (`ext.days.weekdays` "Weekdays" for Mon–Fri, otherwise the day list) |
| `ext.schedules.intro` | The options schedule intro with a `{range}` the extension formats ("such as weekdays 9:00 AM to 6:00 PM"); replaced the web key `ext.schedules.help`, now removed from the locale files |
| `IStorageAdapter` | Now exported from `@awaketab/core` (docs/04 §16) |

**Build and test**

| Identifier | Decision |
|---|---|
| `AT_EXT_TEST` · `__AT_TEST__` | `AT_EXT_TEST=1` builds the Playwright flavour into `apps/extension/.output-test/` with `chrome.power` replaced by a recorder (`src/test-hooks.ts`, `chrome.storage.session['at.test.power']`); `chrome.storage.session['at.test.deny'] = true` makes requests throw like a policy block (`POWER_DENY_KEY`, B9) |
| `AT_EXT_OUT` | Alternate WXT output directory (reproducibility check) |
| `virtual:at-catalog/<locale>` · `virtual:at-catalogs-bg` · `virtual:at-tokens.css` | Build-time modules generated from `apps/web/src/i18n/*.json` (+ `apps/extension/locales/<locale>.json`, B9) and `apps/web/src/styles/tokens.css` (`apps/extension/scripts/i18n.mjs`) |
| `apps/extension/locales/<locale>.json` (B9) | The extension's own copy (Clear Night popup states, options help, welcome page): `ext.*` keys only, never a web key, same keys and placeholders in all 8 locales (unit test). Merged under the web keys; move them to `apps/web/src/i18n` when the web catalog is next edited |
| `apps/extension/public/fonts/` (B9, D-R26) | `geist-latin-wght-normal.woff2`, `geist-mono-latin-wght-normal.woff2`, `OFL-Geist.txt` (copied from `apps/web/public/fonts`); `@font-face` + metric fallbacks in `src/styles/base.css`; no remote font request |
| `--ext-*` (B9) | Extension-local CSS values tokens.css has no name for: `--ext-lift`, `--ext-lift-end` (ground radial lift), `--ext-halo`, `--ext-shadow`, `--ext-float`, `--ext-ease`, `--ext-lamp-{soft,line,tag,faint,glow}` (lamp at 14 / 45 / 12 / 8 / 55 %). Never a replacement for an `--at-*` token |
| Options page type and layout | `options.css` names the board's settings-row text once: `--at-type-ext-row-label` (600 16/normal), `--at-type-ext-row-help` (400 14/normal), `--at-type-ext-field` (600 13/normal) and `--at-type-ext-lead` (400 15/20), used through `.op-tight` where the ExtOptions board sets no line height. `.op-main` is the `op-main` inline-size container; the schedule and site lists, the site form, the licence row and the seven-length bar switch at a 600 px container width (DESIGN.md §12.2), and the welcome page uses 600 / 1024 px viewport queries (no 720) |
| `.at-link-underline` | `base.css`: the underlined text link the boards draw for "Privacy policy" and "What's new" |
| Scripts | `pnpm -F extension zip` → `.output/awaketab-chrome-<version>.zip` · `zip:check` · `store:assets` · `build:test`; root `pnpm test:e2e:ext` |
| `support-matrix.json` → `extension` | `{ minimumChromeVersion, browsers, unsupported, notes }` — the manifest's `minimum_chrome_version` and `/extension` read it |

**Web**

| Identifier | Decision |
|---|---|
| `functions/api/_middleware.ts` · `functions/_lib/cors.ts` | CORS for `chrome-extension://[a-p]{32}` origins on `EXTENSION_CORS_ROUTES` (`/api/e`, `/api/license/activate`, `/api/license/validate`, `/api/license/deactivate`); preflight 204, others 403; no credentials |
| `EXTENSION_STORE_URLS` (`src/lib/extension.ts`) | Store search URLs until the listing ids exist |
| `/privacy#extension` | The extension's privacy statement (store listing URL) |
| `softwareSchema()` (`lib/seo.ts`) | SoftwareApplication + BreadcrumbList for product pages |

**i18n**

94 new keys in all 8 locales (93 with M7, plus `ext.pill.systemHeld` with D-02, when `ext.pill.system` changed from "System awake — screen may dim" to "Screen may dim or lock"): groups `ext.*` (manifest name/description/command, levels, popup, origins, advice, options sections, schedules, auto-start, licence, privacy, about) and `page.extension.*`.

---

### 13.10 M8 — embed widget, library publish, `/library`, research page (E12)

Accepted on 2026-09-26 with the M8 implementation; confirmed by owner decision D-04. Specs: `11-embed-spec.md` §11 (as built), `12-library-spec.md` §10 (as built), `09-monetization-impl.md` §7, `13-testing-strategy.md` §5 journey 10 and §7, `14-devops.md` §3 and §6.

**Embed (`apps/web/src/tool/embed/`)**

| Identifier | Decision |
|---|---|
| `protocol.ts` | The page ↔ widget contract shared by the loader and the iframe app: allow-lists `EMBED_MODES` (`cook` `standard` `clock` `minimal`) · `EMBED_THEMES` · `EMBED_SIZES` · `EMBED_PRESETS` (`p15`…`pinf`, `until`) · `EMBED_LOCALES`; `EMBED_BOX` (compact 320 × 104 radius 16 — O-58, B8; full 100 % × 240 radius 28); `EMBED_NARROW` (`compact: [300, 116]`, `full: [600, 420]`) and `reservedHeight(opts, width)` (the taller box for a compact frame under 300 px, or a full cook frame under 600 px); `EMBED_MIN_HEIGHT` 64 / `EMBED_MAX_HEIGHT` 640 (resize clamp); `EMBED_MAX_MS` 7 days (= `CUSTOM_MAX_MS`); `EMBED_PATH` `/embed/cook`; `EMBED_VERSION` `'1'` (sent in `awaketab:ready`); the O-47 credit: `EMBED_CREDIT_URL` `https://awaketab.com/?ref=embed&source=embed`, `EMBED_CREDIT_CLASS` `awaketab-credit`, `EMBED_CREDIT_STYLE` / `EMBED_CREDIT_LINK_STYLE` (inline styles, shared by the loader and the snippet) |
| Loader attributes | `data-mode` `data-theme` `data-lang` (else the host page's `<html lang>`, BCP 47 → one of the 8 locales) `data-size` `data-preset`, plus `data-until="HH:MM"` with `data-preset="until"`. `data-license` from docs/11 §1 is not read: licensing is decided by the verified domain, and a key never travels in a URL |
| Message shape | `{ type: 'awaketab:<name>', ...payload }` for all six messages of docs/11 §3; anything else is dropped on both sides |
| Origin checks | Loader: accepts a message only when `event.source` is an iframe it created **and** `event.origin` is the loader's own origin (derived from the `<script src>`, so preview deployments work); posts with that origin as `targetOrigin`. Widget: accepts only from `window.parent`, only when `event.origin` equals the verified parent origin (`location.ancestorOrigins[0]`, else the referrer — the loader sets `referrerpolicy="strict-origin"`) **and** that hostname equals the declared `host=` param when one is present; posts to that exact origin, never `*` |
| `EMBED_SANDBOX` | `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox`. The fourth token (C4 decision) lets the "How to fix" link open awaketab.com as a normal tab rather than inheriting the sandbox; it widens nothing for the host page |
| Resize rule | The loader applies `awaketab:resize` but never below the reserved box height (`reservedHeight()`, measured from the container once at mount), so a widget can grow (notice, timers) and never shift the host page by shrinking |
| Host-page credit (O-47, B8) | `loader.ts` `mountCredit(frame, text)` inserts `<div class="awaketab-credit"><a href=EMBED_CREDIT_URL rel="nofollow">` right after the iframe: the host's font and colour, 13 px, underlined, one 24 px line 16 px below the widget. `keepsCredit(win, origin, cache)` asks `GET {origin}/api/embed/config?domain=<location.hostname>` once per origin and removes the line only for `{ licensed: true, attribution: false }`. `ILoaderStrings` `{ titles, credits }` (the 8 `embed.frame.title` / `embed.attribution` strings, build-time `__AT_FRAME_TITLES__` / `__AT_CREDITS__`). There is no credit inside the iframe any more; `snippet.ts` `creditSnippet(text?)` is the same line as plain HTML and `iframeSnippet(opts, title, origin?, credit?)` ends with it |
| `at.v1.embed.settings` | `{ v: 1, cookTimers: ICookTimer[] }` (≤ 3, same shape as §13.8) — the widget's only persistent key. The widget's session engine runs on `memoryAdapter()` and a no-op `BroadcastChannel`, so it never writes `at.v1.session`/`at.v1.stats` or joins the app's tab election (`08-data-storage.md` §2.10) |
| Licence lookup | Widget: `GET /api/embed/config?domain=<verified parent hostname>` only — never the `host=` param. Unknown/failed/timed-out (`EMBED_CONFIG_TIMEOUT_MS` 4000) → free rendering. Loader: the same endpoint with the page's `location.hostname`, for the credit line only (`keepsCredit()`) |
| `--at-embed-brand` · `--at-embed-on-brand` | Private custom properties set on the widget root only for licensed sites (`config.ts` `applyBranding(root, cfg)`): the Start button fill and its black/white label (`onAccent()` picks the higher-contrast one, ≥ 4.5:1 for any colour). Default = the lamp pair `--at-accent` / `--at-on-accent`. B8: the brand no longer overrides `--at-accent`/`--at-focus`, so the pill and focus ring keep the state tones |
| `--at-embed-*` (B8) | Widget-scoped custom properties in `embed.css` for values with no `--at-*` token yet: `--at-embed-pill-xs` 26 / `--at-embed-pill-s` 32 (DESIGN.md §11.4 pill XS/S), `--at-embed-h-primary` 60 (the frame is ≤ 568 tall, where `--at-h-primary` drops to 52), `--at-embed-compact` 104 / `-compact-long` 116 / `-full` 240 / `-full-stacked` 420, `--at-embed-aura` (10 % light, 16 % dark/OLED), `--at-embed-ease`, `--at-embed-digit` |
| Widget markup hooks (B8) | Root `#awaketab-embed` carries `data-size`, `data-mode`, `data-lock` (the state tone), `data-live` (aura) and `data-long` (compact pill on its own row, set by `app.ts` `fitPill()`); `[data-embed-toggle][data-kind="start" \| "stop" \| "retry"]` (no `aria-pressed`: its label changes); `[data-pill-glyph]` path from `app.ts` `PILL_GLYPH`; `[data-embed-note]` (minimal), `[data-embed-hint]` (full meta line), `[data-embed-foot]`, `[data-embed-timers-empty]`, `.at-embed-add`, `.at-embed-timer-remove`. `clock.ts` `formatClock(ms)`: "MM:SS" · "H:MM:SS" · "1d 02:15:00" (DESIGN.md §4) for the digits and kitchen timers |
| iframe_no_allow detection | `policy.ts`: `document.permissionsPolicy ?? document.featurePolicy` `.allowsFeature('screen-wake-lock')` → the "Ask the site owner" notice shows at load in a frame the policy blocks; `embedAdvice()` drops the library's `iframe_no_allow` guess (to `null`, shown as `tool.advice.unknown`) when the policy is known to allow the lock |
| Catalog subset | `catalog.ts` `isEmbedKey()`: `/embed/cook` inlines only `embed.*`, `tool.pill.*`, `tool.advice.*` (incl. `tool.advice.retry`, the Retry label since B8) and a few `ambient.cook.timer.*` keys for all 8 locales (one static page serves every `lang=`) |
| `snippet.ts` | `loaderSnippet()` · `iframeSnippet()` (ends with the credit line since B8) · `creditSnippet()` · `kioskUrl()` · `kioskMsg()` — the /embed and /kiosk generators; `DEFAULT_SNIPPET` renders the tag documented in docs/11 §11 |
| `kiosk.ts` | Tool-side Kiosk licence unlocks (lazy, loaded by `main.ts` only when the URL has `#lic=` or `logo=`): `readLicHash` · `applyKioskHash` (offline verify with no device binding, kiosk plans only — `KIOSK_PLANS` `biz_kiosk_site` `biz_kiosk_5` — store to `at.v1.license` with `deviceId: ''`, `deviceLabel: 'kiosk'`, strip the hash first) · `parseLogo` (https, no credentials, ≤ `KIOSK_LOGO_MAX` 512 chars) · `applyKioskBranding` (`ambient.logo` → logo above the timer and in the ambient dialog; `kiosk.branding` → `<html data-kiosk>` hides the wordmark and `ui/rating.ts` never prompts) |
| Kiosk plan features | `biz_kiosk_site` / `biz_kiosk_5` now include `ambient.message` (docs/09 §7.2 already said so; `PLAN_FEATURES` in `functions/_lib/license.ts` and `src/lib/license.ts` lacked it) |
| Tool-route CSP `img-src` | `'self' data: https:` — the operator's `logo=` image is the only cross-origin resource a tool route may load, and only on a licensed kiosk URL. `script-src`, `connect-src`, `style-src`, `font-src` stay `'self'`; the zero-third-party budget still holds for every default tool page (C4 decision, accepted as shipped by owner decision D-01 on 2026-09-26; `test/e2e/security.spec.ts` asserts that every default tool route, a started session and an unlicensed `logo=` URL make no cross-origin request) |

**Build, budgets and headers**

| Identifier | Decision |
|---|---|
| `apps/web/scripts/embed-loader.mjs` | esbuild: `src/tool/embed/loader-entry.ts` → `public/embed.js` (IIFE, `es2020` since B8, committed, `__AT_FRAME_TITLES__` / `__AT_CREDITS__` = the 8 `embed.frame.title` / `embed.attribution` strings via `catalogStrings(key)`) and `src/tool/embed/app.ts` → `public/embed/app.js` (ESM, git-ignored). First step of `pnpm -F web build` and `dev`; `--fingerprint` runs after `astro build` and ships the app as `/embed/assets/app.<hash>.js` (§13.12). The iframe app is **not** an Astro `<script>`: sharing `@awaketab/core`/`wake` with the tool entry made Rollup split shared chunks onto the tool's critical path (+900 B gz) |
| `apps/web/scripts/library.mjs` | Copies `packages/wake/dist/awaketab-wake.iife.js` (building the package if needed) to `public/library/` (git-ignored) for the `/library` demo |
| `apps/web/scripts/support-matrix.mts` | The support-matrix update hook: `matrix:check` (build step) validates `docs/metrics/device-matrix.json` and that every row names a `support-matrix.json` id; `matrix:sync` writes `lastUpdated` and per-row `lastVerified` only when the run is `complete` |
| `docs/metrics/device-matrix.json` | `{ version: 1, status: 'pending' \| 'complete', updatedAt, method[], rows[] }`; row = `{ id, device, os, browser (support-matrix id), version, power ('plugged' \| 'battery' \| 'battery-saver'), mode, case, expected, observed, evidence, date, verdict ('pending' \| 'pass' \| 'partial' \| 'fail') }`; validated by `src/lib/device-matrix.ts` `parseDeviceMatrix()` (a recorded verdict needs date, version, observed and evidence) |
| `scripts/size.mjs` gates | `criticalJs` ≤ 15,360 (static closure of `index.html`'s module entries) · `totalJs` ≤ 40,960 (static + dynamic closure of the same entries; replaces "every `dist/_astro/*.js`") · `embedJs` ≤ 25,600 (full closure from `embed/cook.html`) · `loaderJs` ≤ 3,072 (`dist/embed.js`) · `totalCss` · `hydrated` · `reactChunks` unchanged. Feature packs (chunks named `pack-<name>` or `pack-<name>-<part>`, such as one chunk per clock face, from `src/tool/packs/<name>/` and the libraries listed in `astro.config.mjs` `PACK_LIBS`) load only on first use and are measured outside `totalJs` with their own gzip budgets: `faces` ≤ 30 KB · `sound` ≤ 110 KB · `notes` ≤ 120 KB (raised from 70 KB on 2026-09-28: Tiptap's core and ProseMirror alone are about 86 KB gz, §13.26) · `themes` ≤ 25 KB · `extras` ≤ 15 KB (report field `packs`). Report fields `files` (critical), `lazyFiles`, `embedFiles`. Closure helpers in `scripts/size-lib.mjs` |
| `_headers` | `/embed` and `/embed/` (the landing page, which `/embed/*` also matches) re-apply the default CSP, `X-Frame-Options: DENY` and drop `X-Robots-Tag`; `/embed.js` `Cache-Control: public, max-age=3600`. Every rule that sets `Cache-Control` or re-sets `X-Frame-Options` now detaches the `/*` value first (`! Header`), because Cloudflare joins a header set by two matching rules. `resolveHeaders(text, path)` in `scripts/headers.mjs` evaluates the file for tests |
| Ads | `pages/embed/**`, `pages/kiosk.astro`, `pages/library.astro` are in the ESLint no-ad-imports list; none of them uses `ContentLayout` |

**Library (`packages/wake`)**

| Identifier | Decision |
|---|---|
| IIFE file name | `dist/awaketab-wake.iife.js` (tsup `outExtension`; it was emitting `.global.js`). `package.json` `unpkg`/`jsdelivr` and `exports["./iife"]` point at it |
| Adapters | Built with `../index.js` external → `@awaketab/wake` (they no longer bundle a second state machine: 271 / 277 / 237 B gz), with `.d.ts`/`.d.cts` types and CJS builds; `exports` uses nested `import`/`require` conditions with matching types |
| Publishing | `publishConfig: { access: 'public', provenance: true }`; `.changeset/config.json` `access: 'public'`; the pre-release wake changesets are folded into `packages/wake/CHANGELOG.md` 1.0.0 so `changeset version` does not bump past 1.0.0. `release.yml` job `publish-wake` runs `npm publish --provenance --access public` when the version is not on npm yet (trusted publishing via OIDC with npm ≥ 11.5.1; `NPM_TOKEN` secret as fallback) and tags `@awaketab/wake@<version>` |
| `size-limit` | Adds the IIFE (≤ 3.6 kB) and each adapter (≤ 400 B) |

**Pages and analytics**

| Identifier | Decision |
|---|---|
| `/embed`, `/kiosk`, `/library` | Indexable English landing pages on `BaseLayout` (no ads), in `sitemap-en.xml`, with OG images `embed-en.png` · `kiosk-en.png` · `library-en.png`. `/embed/cook` stays `noindex` |
| `/learn/how-we-tested` | `ArticlePage` gains a named slot `after` (outside `.at-prose`, so it never counts toward the word band); the learn route fills it with `DeviceMatrix.astro` on this slug |
| Embed analytics | Widget events carry `source: 'embed'`, `path: '/embed/cook'`. `page_view` from the widget sends `host` (hostname) → `blob6`. B8: the credit link lives in the host page (O-47), so the widget no longer sends `share_click { target: 'attribution' }`; the value stays allow-listed in `functions/_lib/events.ts` for cached old widgets, and credit clicks are counted by `?ref=embed&source=embed` on arrival |
| `/api/embed/config` | Unknown domain → `{ licensed: false, attribution: true, theme: null, expiresAt: null }` (was `theme: 'auto'`). Looks up the host and each parent domain down to two labels (so `www.`/`staging.` resolve to `embed:{registrable domain}`), treats an expired `expiresAt` or a non-`active` `lic:{keyHash}` as unlicensed, and returns `theme` only as a validated `{ accent: '#rrggbb' \| null, scheme }`. Helpers in `functions/_lib/embed.ts` |

**i18n** — 56 new keys in all 8 locales: `embed.*` (widget), `page.embed.*` · `page.kiosk.*` · `page.library.*`, `builder.*` (generators), `library.demo.*`, `research.*` (device matrix), `kiosk.license.invalid`. B8 (Clear Night) adds 13 widget keys in all 8 locales: `embed.cook.resume` · `embed.meta.requesting` · `embed.meta.since` · `embed.meta.clock` · `embed.foot` · `embed.minimal.idle` · `embed.minimal.live` · `embed.minimal.liveShort` · `embed.timers.empty` · `embed.digits.pause` · `embed.digits.resume` · `embed.digits.start` · `embed.digits.clock`; `embed.attribution` is now the host-page credit text (inlined in the loader).
### 13.11 M6 follow-ups

Accepted on 2026-09-26 with the M6 follow-up work; confirmed by owner decision D-04. Specs: `05-frontend-spec.md` §3.14, §3.17, §3.23, §9; `08-data-storage.md` §2.2, §2.3, §6; `04-engine-spec.md` §10, §13.

**Storage and engine (`@awaketab/core`)**

| Identifier | Decision |
|---|---|
| `IStats.daySessions?: Record<string, number>` | Local day key → sessions of ≥ 1 min awake that **ended** that day. It is incremented wherever `IStats.sessions` is. Optional and backward-compatible: records written before it have no field, and readers treat a missing day as unknown, never as a guessed 0. It is pruned with `days` (365 days) |
| `IStats.dayFocus?: Record<string, number>` | Local day key → focus blocks that **completed** that day. A focus block is a session whose `modeState.focusBlock === true` that ends with reason `completed`. The "N focus blocks today" line reads it. It is kept apart from `daySessions` so that the common record stays one number per day and `dayFocus` stays empty for people who never use focus mode |
| `ISession.modeState.focusBlock` | `true` on a session started by focus mode's "Start a focus block" (set with `updateSession()`). An extension of a finished block is a plain focus-mode session and does not count |
| `countDay(rec, now, timeZone?)` | Exported from `stats.ts`: adds one to the local day of `now` and creates the record if it is missing |
| `pruneDays()` | Keeps only number values (localStorage is user-editable). `storage.stats()` prunes `daySessions`/`dayFocus` too, and drops either one when it is not an object |
| `exportStatsCsv()` | The header `date,awake_minutes,sessions` is unchanged. Rows are the union of the `days` and `daySessions` keys. The `sessions` cell is `daySessions[date]`, or empty when that day has no count |

**Tool island and pages**

| Identifier | Decision |
|---|---|
| `IStatsSummary.todaySessions` (`stats/heatmap.ts`) | `daySessions[today]` or 0. The Stats panel "Today" row reads "42 min · 2 sessions" (reuses `stats.totalValue`) |
| `[data-focus-today]` | Focus-mode line "N focus blocks today", hidden at 0; re-read from `at.v1.stats` when a block starts or ends |
| `SponsorCard.astro` · `data-sponsor="idle" \| "extend"` | One build-time component for both slots. Both render only when `PUBLIC_SPONSOR_ENABLED=1`, and both are filled from one `/config/sponsor.json` fetch. `extend` sits inside the ExtendPrompt. It is set to `hidden` (`display: none`) before the dialog can open when there is nothing to show (Pro `ads.free`, or no or invalid config). Otherwise it keeps its 300 × 100 box. `sponsor_view` fires once per page view, from whichever slot shows first |
| `mountSponsor(ctx)` | Now finds its slots itself; `main.ts` passes only `ctx` |
| `/{lang}/pip` · `PipPage.astro` | The popup fallback in `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` (and `/pip` for `en`). The page renders its static text at build time and embeds only the strings `pip-mirror.ts` looks up at runtime (`tool.pill.*`, `tool.timer.indefiniteIdle`), not the whole catalog. `X-Robots-Tag: noindex` per route (`scripts/headers.mjs`), `Disallow` per route in `robots.txt`; a shell page in `sw.mjs`, cached at install with the home of the visitor's language (another language's when first opened), so it opens offline in every language |
| `pipPath(htmlLang)` (`pip.ts`) | Maps the opener's `<html lang>` to `/pip` or `/{lang}/pip` through an allow-list of the seven locale folders; anything else → `/pip` |
| `PIP_PRO_SIZE` | 280 × 160 — the Document PiP window size requested with `pip.pro` (free stays `PIP_SIZE` 280 × 120) |
| `mirrorAmbient(ctx, body)` (`pip.ts`) | `pip.pro` only: clones the page's ambient digits into `.at-pip-ambient` in the PiP window through a `MutationObserver`. That means the clock `[data-clock]` in `clock`/`night`, or `[data-focus-label]` + `[data-focus-digits]` while a focus block runs. `body[data-ambient]` hides the session timer; the pill always stays |

**i18n**

1 new key, present in all 8 locales: `ambient.focus.today` (`{n, plural, …}`).

### 13.12 Extension licence hand-off and embed app caching

Accepted on 2026-09-26; confirmed by owner decision D-04. Specs: `09-monetization-impl.md` §2.2, §2.3a; `10-extension-spec.md` §5; `11-embed-spec.md` §11.3, §11.6; `14-devops.md` §3, §6.

| Identifier | Decision |
|---|---|
| `POST /api/license/activate { checkoutId, lookup: true }` | Non-activating lookup → `{ key, plan }`. No `deviceId`, no KV write, no Polar activation; same `license` rate-limit bucket (10/min/IP hash). `checkoutId` must match `^[A-Za-z0-9_-]{1,80}$` (also on the activating path). Unknown, expired, failed and foreign checkouts all answer 404 `invalid_key` (Polar's checkout 404 now maps to `invalid_key`, not `polar_unavailable`); open / confirmed checkouts and keys Polar has not created yet answer 503 `polar_unavailable` + `Retry-After` (§13.16); KV `revoked`/`refunded` → 403 with that code; Polar not granted → 403 `revoked`; unmapped benefit → 404 |
| `/pro/activate?ext=1` | Never activates the browser. A pasted key is normalised (`trim().toUpperCase()`) and checked against `^[A-Z0-9-]{20,80}$` client-side, then shown in `[data-ext-panel]`; with `checkout_id` the page calls the lookup above instead of activate. Without `ext=1` the page is unchanged (activates this browser; `checkout_id` auto-activates) |
| `src/lib/license-lookup.ts` | `LICENSE_KEY_RE`, `normaliseLicenseKey()`, `lookupCheckoutKey()` — kept out of `license.ts`, whose chunk the tool page loads lazily (so `totalJs` does not pay for a page-only flow) |
| `[data-activate-mode="web" \| "ext"]` | Mode-specific copy on `/pro/activate`, pre-rendered for both modes; `activate-page.ts` hides `web` and shows `ext` when `ext=1` |
| `data-state` on `[data-activate-root]` | B7: `idle` · `checking` · `error` · `success` · `ext-success` (activation form) and `checkout-success` · `cancelled` · `failed` · `help` (checkout return); `activate-page.ts` sets it, `pro.css` shows the matching parts. Activation never redirects to `/` (O-26) |
| `data-state` on `[data-manage-root]` | B7: `loading` · `list` · `empty` · `grace` (yearly token inside its last 7 days: renewal did not go through) · `lapsed` (token `exp` passed: devices listed with "Pro off"); `manage-page.ts`. Removing this browser's own row clears `at.v1.license` |
| `data-launch="on\|off"` on the Pro page roots | B7 / O-52 / D-R13: `pro-common.ts` compares `Date.now()` with `PRO_LAUNCH_END` at run time; `[data-launch-only]` / `[data-after-only]` pairs swap the lifetime price and launch lines (never a strike-through) |
| `src/lib/pro-common.ts` | Pro pages only: `deviceLabel()` ("Chrome · macOS", C5), `telemetryOn()` / `trackPro()` (honours `at.v1.settings.telemetry`, O-43), `applyLaunch()`, `POLAR_PORTAL_URL` (`https://polar.sh/awaketab/portal`, sandbox in non-production builds) |
| `/embed/assets/app.<hash>.js` | The `/embed/cook` iframe app in production. `node scripts/embed-loader.mjs --fingerprint` (right after `astro build`) moves `dist/embed/app.js` to `/embed/assets/app.<first 10 hex of sha256>.js` and rewrites every built page that loaded `"/embed/app.js"`; it fails when no page does. `astro dev` still serves `/embed/app.js`. `/embed.js` (the host loader) is never hashed |
| `_headers` `/embed/assets/*` | `Cache-Control: public, max-age=31536000, immutable` (detaches the `/*` value). `/embed/cook` and `/embed.js` keep their caches (`max-age=0, must-revalidate` and `max-age=3600`) |
| SW `at-embed-assets` | `src/sw.ts` serves `/embed/assets/*` cache-first (4 entries, 30 d); other `/embed/*` stays network-first `at-embed`. Nothing under `/embed` is precached |
| `scripts/size.mjs` `embedHashed` | New report field and gate: `embed/cook.html` must load exactly one module entry matching `HASHED_APP_RE` (`scripts/embed-loader.mjs`); `embedEntryHashed()` in `size-lib.mjs` |

**i18n**

3 new keys, English in all 8 locales like the rest of `page.pro.activate.*` (the page is English-only): `page.pro.activate.ext.title`, `page.pro.activate.ext.lead`, `page.pro.activate.ext.submit`.

### 13.13 Served URLs and build output format

Accepted on 2026-09-26 (M9, `LAUNCH-AUDIT.md` N-13). Spec: `14-devops.md` §2.1. The routes in §7 are unchanged. The locale-home canonical changes from `https://awaketab.com/es` to `https://awaketab.com/es/`, its served URL.

| Identifier | Decision |
|---|---|
| `build.format: 'preserve'` | `apps/web/astro.config.mjs`. `x.astro` → `x.html` (served at `/x`), `x/index.astro` → `x/index.html` (served at `/x/`). Was the default `'directory'` (`x/index.html` for every page) |
| Hub page files | `src/pages/{for,on,vs,guides,learn,pro,embed}.astro` (were `…/index.astro`). Only `index.astro` and `[lang]/index.astro` are directory indexes |
| `scripts/served.mjs` | `servedFile(pathname)`, `servedPath(file)`, `isServedPath(pathname)`, `LOCALES`: the one URL ↔ file mapping, used by `sw.mjs`, `size.mjs` and the SEO tests |
| `canonicalPathname()` | `src/tool/params.ts`. `parseToolParams().canonicalPath` keeps a locale home's slash (`/es/`) and strips it everywhere else |
| `_headers` `/embed/` rule | Removed: `/embed/` only 308-redirects to `/embed` now |
| `test/seo/served-urls.test.ts` | Sitemaps, canonicals, hreflang, `og:url`, JSON-LD, internal links and `_headers` / `robots.txt` page routes all use served URLs whose file exists |

### 13.14 Launch-audit fixes (M9: F-01, F-03 to F-07, N-03)

Accepted on 2026-09-26 (`LAUNCH-AUDIT.md`). Specs: `08-data-storage.md` §7, `09-monetization-impl.md` §1 and §2.4, `14-devops.md` §1, §2, §7 and §10, `06-content-seo-spec.md` §15, `17-launch-checklist.md` §2.

| Identifier | Decision |
|---|---|
| `POST /api/csp` limits | `rateLimit(env, 'csp', ip)` (KV `rl:csp:{ipHash}:{bucket}`, `RATE_MAX` per `RATE_WINDOW_S`) → 429 `rate_limited` + `Retry-After`. A body over `MAX_BODY_BYTES` (8 KB) → 413 `too_large`: refused from `Content-Length` before reading, and cut off at the cap when streamed (`readCappedText()` in `functions/_lib/events.ts`) |
| Preview `noindex` | `PREVIEW_HOST_RULES` in `scripts/headers.mjs`: `_headers` rules `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*` → `X-Robots-Tag: noindex`, last in the file. `functions/api/_middleware.ts` sets `X-Robots-Tag: noindex` on every `/api/*` response, because Pages does not apply `_headers` to Functions. No root `functions/_middleware.ts`: it would run Functions for every static file |
| `CONTACT_EMAIL` | `support@awaketab.com` in `src/lib/contact.ts` (with `CONTACT_MAILTO`). Used on `/about#contact`, `/privacy#delete` and `/privacy#contact` |
| `/privacy` anchors | `#server-data` (events 90 days, ratings 2 years, licence record until `exp` + 1 year), `#delete`, `#ads` (the docs/09 §3.7 text, marked "not yet active"), `#contact`. `#extension` is unchanged |
| `changelog` content collection | `src/content.config.ts`: `glob('*.md', base: '../../changelog')`, strict front matter `{ title, date, release?, type? }` (`type`: `new` · `fixed` · `changed`, the /changelog filter tag, default `new`; added in B6). `/changelog` renders each fragment with Astro's Markdown pipeline at build time: the `release` fragment as the hero card (`releaseParts()`: lede + `Heading: text` paragraphs), the others as `li[data-changelog-entry][data-date][data-type]` grouped by date (`groupByDate()`). `sortChangelog()` (`src/lib/changelog.ts`): `date` descending, then fragments with `release` first, then entry id descending |
| Site-page modules (B6) | `src/styles/pages.css` (site pages only; `--at-pg-*` page-scoped sizes and type roles) · `components/pages/Crumbs.astro` · `SegRadio.astro` · `LegalDoc.astro` · `LegalSection.astro` · `src/lib/page-glyphs.ts` (`LOCK_STATES`, `LOCK_GLYPH`) · `kiosk-page.ts` (`bindKiosk`, `readKioskForm`, `urlParts`, `kioskHints`, `kioskTimer`) · `embed-page.ts` (`bindEmbedPage`, `snippetParts`, `readSnippetForm`, `boxLabel`) · `library-code.ts` (`codeTabs`, `highlight`) · `code-tabs.ts` (`bindCodeTabs`). `ToolIsland` takes an optional `kicker` (the 404 page's "Error 404") |
| Site-page hooks (B6) | `/kiosk`: `[data-kiosk-root]` · `[data-kiosk-form]` · `[data-kiosk-screen]` (`data-mode`, `data-ktheme`, `data-on`, `data-licensed`, `data-logo`) · `[data-kiosk-url]` (spans `data-part` = muted · key · value · hash) · `[data-kiosk-copy]` · `[data-kiosk-status]`. `/library`: `[data-wake-demo]` (`data-demo-state`, `data-scenario`) · `[data-demo-pill]` · `[data-demo-pill-text]` · `[data-demo-current]` · `[data-demo-advice]` · `li[data-state][data-pill]` (`aria-current="step"`, `data-visited`) · `[data-edge="from-to"]` (`data-on`) · `[data-demo-log]` · `[data-lib-tabs]`. `/embed`: `[data-embed-root]` · `[data-embed-demo]` · `[data-embed-box]` · `[data-snippet]` · `[data-snippet-form]` · `[data-snippet-copy]` · `[data-snippet-status]` · `[data-mode-note]`. `/changelog`: `input[name="cl-filter"]` |
| `INDEXNOW_KEY` | Build variable (Cloudflare Pages, Production) and GitHub Actions secret, 8–128 characters of `[A-Za-z0-9-]`. Set: the build writes `dist/{key}.txt`, served at `/{key}.txt`. Unset: a build warning, no file, no ping |
| `scripts/indexnow.mjs` | `write-key` (last web build step) and `ping` (`pnpm -F web indexnow [--base <ref>] [--all] [--from live\|dist] [--dry-run]`). URLs come from the sitemaps only and are filtered again by `selectUrls()`. It checks that `/{key}.txt` is live, then sends `POST https://api.indexnow.org/indexnow` in batches of 10,000. Never part of a build |
| `.github/workflows/indexnow.yml` | Runs on a successful production `deployment_status` reported by Cloudflare Pages, or by hand (`all`). Skipped with a notice when the secret is unset |
| `PUBLIC_POLAR_SERVER` | The one Polar switch. Build: `polarServer()` in `scripts/polar-server.mjs` (unset → `sandbox`; any value but `sandbox` or `production` fails the build) → `define` of `__AT_POLAR_SERVER__` and `__AT_LICENSE_DEV_KEY__` in `astro.config.mjs`, `scripts/embed-loader.mjs` and `apps/extension/wxt.config.ts`. Run time: `polarServer(env)` / `apiBase(env)` in `functions/_lib/polar.ts` (`POLAR_API_BASES`: `https://sandbox-api.polar.sh`, `https://api.polar.sh`; only `production` reaches production). `POLAR_API_BASE` is removed |
| `CHECKOUT_LINKS_SANDBOX` · `CHECKOUT_LINKS_PRODUCTION` · `CHECKOUT_PLACEHOLDER` | `src/lib/checkout.ts`; `CHECKOUT_LINKS = checkoutLinks(POLAR_SERVER)`. The production links are owner-data placeholders (`https://buy.polar.sh/PROPOSED-REPLACE-…`, not identifiers) until N-04 |
| `PRODUCTION_LICENSE_PUBLIC_KEYS` · `DEV_LICENSE_KEY_VER` (1) · `TRUSTS_DEV_LICENSE_KEY` | `@awaketab/core`. `LICENSE_PUBLIC_KEYS` adds the dev key (its private half is in `.dev.vars.example`) only when the bundler defines `__AT_LICENSE_DEV_KEY__` as true: sandbox, dev and test builds. Production bundles contain no trace of it. Production keys start at `ver` 2 |
| `scripts/check-keys.mts` · `pnpm keys:check` | Only with `PUBLIC_POLAR_SERVER=production`. Source check (first web build step): fails on no production key, the dev key listed, a private or non-P-256 JWK, or a placeholder or sandbox checkout link. `--dist <dir>` (last web build step; `pnpm -F extension zip`): fails on the dev key's `x` or `y` in any output file, or a production key missing from every file. `AT_ALLOW_MISSING_PRODUCTION_KEY=1` waives only "no production key" and "placeholder link" (CI's production-mode bundle check) |
| `pnpm keys:prod` | `scripts/keys-prod.mts`: prints a fresh ES256 pair (the public JWK line for `PRODUCTION_LICENSE_PUBLIC_KEYS[ver]`, the private JWK for the `LICENSE_SIGNING_KEY` secret, and `LICENSE_SIGNING_VER`). Writes nothing |
| `pnpm -F extension zip` | Builds with `PUBLIC_POLAR_SERVER=production` and runs `check-keys.mts` before and after the build |

### 13.15 Polar ids on licence records (D-06)

Accepted on 2026-09-26 (owner decision D-06, `LAUNCH-AUDIT.md`). Specs: `08-data-storage.md` §4, `09-monetization-impl.md` §2.7 and §2.7.1 (Polar payloads, verified against Polar's OpenAPI 2026-04 / 2026-10).

| Identifier | Decision |
|---|---|
| `lic:{keyHash}` fields | Optional `polarLicenseKeyId` (Polar `LicenseKeyRead.id` = `properties.license_key_id`), `polarSubscriptionId`, `polarGrantId` (benefit grant `id`), `benefitId`. `polarOrderId` is `''` until known; it no longer holds the licence-key id |
| `lk:{polarLicenseKeyId}` | `ILicenseLink` `{ keyHashes, grantId?, orderId?, subscriptionId?, customerId?, benefitId?, pending?, at }`, TTL `LINK_TTL_S` (3 years, restarted on each write). `pending`: a status that arrived before any activation, applied and cleared by `/api/license/activate` |
| `grant:{benefitGrantId}` | Polar licence-key id (string), TTL `LINK_TTL_S` |
| `sub:{subscriptionId}` | `string[]` of Polar licence-key ids, TTL `LINK_TTL_S` |
| `ord:{orderId}.lks` | `string[]` of Polar licence-key ids on the existing order record (`IOrderRecord`, TTL `ORDER_TTL_S` = 2 years); every `ord:` field is now optional |
| `functions/_lib/links.ts` | `linkLicenseKey()`, `applyIds()`, `transition()`, `readLink()`, `mergeOrder()`, `licenseKeyIdsFor()`, `SUBSCRIPTION_PLANS` (`pro_yearly`, `biz_embed_site_yearly`) |
| Webhook resolution order | raw `data.license_key.key` → licence-key id → grant id → subscription id → order id → `cus:{customerId}` fan-out (exact id match wins; else plan kind + benefit filter; all matches changed) |
| Webhook events | Adds `refund.updated` and `benefit_grant.updated` to the subscription list. `order.refunded` with `status: 'partially_refunded'` changes nothing; `refund.*` refunds only when `status === 'succeeded'` and `revoke_benefits` |
| `BACKUP_PREFIXES` | Adds `lk:`, `grant:`, `sub:` (`scripts/kv/lib/format.ts`) |
| Test helper | `polarEvents.{order, subscription, refund, benefitGrant}` in `test/functions/harness.ts`; `IPolarKey` gains `orderId`, `subscriptionId`, `grantId` |

### 13.16 Checkout auto-fill through Polar ids (F-08) and Functions typecheck

Accepted on 2026-09-26 (`LAUNCH-AUDIT.md` F-08). Specs: `09-monetization-impl.md` §2.1, §2.2, §2.3a, §2.3b, §2.10; `13-testing-strategy.md` §1, §9; `14-devops.md` §6.

| Identifier | Decision |
|---|---|
| `functions/_lib/checkout-key.ts` | `resolveCheckoutKey(env, polar, checkoutId)` → `TCheckoutKey`: `{ kind: 'key', key, subscriptionId, orderId, grantId, licenseKeyId }` \| `{ kind: 'syncing' }` \| `{ kind: 'invalid' }`. Checkout → (one-time) order by `checkout_id` → the benefit grant of that order or subscription → `properties.license_key_id` → `GET /v1/license-keys/{id}` → `key` |
| `createPolar()` reads | `checkout()` (404 and 422 → `invalid_key`), `ordersForCheckout()`, `benefitGrants()`, `licenseKey()` (404 → `null`); types `IPolarCheckout` (no `license_key`), `IPolarOrder`, `IPolarBenefitGrant`, `IPolarLicenseKey` |
| Syncing response | `syncing()` in `functions/_lib/http.ts`: HTTP 503, `{ error: 'polar_unavailable' }` (no new error code), `Retry-After: SYNCING_RETRY_S` (5), `no-store` |
| `CHECKOUT_RETRY_MS` | `[3000, 6000, 12000]` in `src/lib/activate-page.ts`: `/pro/activate` re-asks the checkout auto-fill (activate, or the `ext=1` lookup) after each wait while the answer is `polar_unavailable`; a key typed by hand is never retried |
| `POLAR_ACCESS_TOKEN` scopes | Adds `benefits:read` (and relies on `orders:read`, `license_keys:read`, `checkouts:read`) |
| `apps/web/functions/tsconfig.json`, `tsconfig.test.json` | Functions source typechecked with `@cloudflare/workers-types` only (no DOM, no Node); the Functions suites and `test/functions/harness.ts` with Workers + Node + DOM types. Both run in `pnpm -F web typecheck` (`astro check && tsc -p functions/tsconfig.json && tsc -p functions/tsconfig.test.json`) |
| `publicJwk()` | `functions/_lib/jwt.ts`: the signing key's public half, `null` when the JWK has no `x`/`y` (validate and deactivate then answer 502 `polar_unavailable`, as for a missing key) |
| Test helper | `FakePolar.addCheckout(row, { id?, status?, order? })`, `FakePolar.orders`, `failPath`; `IPolarKey` gains `grant` (`ready` \| `missing` \| `keyless`) and `grantedAt`; `IPolarCall` gains `query`. The fake checkout has no `license_key` |

### 13.17 i18n content identifiers (E6-T05…T07) accepted by D-04

Accepted on 2026-09-26 (owner decision D-04, `LAUNCH-AUDIT.md`). They were listed as "PROPOSED — add to `00-conventions.md`" in `07-i18n.md` §11. Slug values themselves stay in `src/i18n/slugs.json` (§7; decision D-03 is separate).

| Identifier | Decision |
|---|---|
| Translated content route | `/{lang}/{collection}/{public slug}` — the translated slug from `src/i18n/slugs.json` for `es` / `pt-br` / `de` / `fr`, the English slug for `ja` / `zh` / `hi` (decision D-03, `06-content-seo-spec.md` §5) |
| Translated OG image path | `/og/{lang}/{collection}/{public slug}.png` |
| `TRANSLATED_SLUG_LOCALES` | `apps/web/scripts/translations.mjs`: `es` · `pt-br` · `de` · `fr` — the only locales whose content slugs are translated; `publicSlug()` returns the English slug for every other locale |
| `apps/web/scripts/translations.mjs` | `alternatesFor` · `isIndexable` · `contentPath` · `publicSlug` · `ogImagePath` · `readContentIndex` · `frontmatterScalars` (hreflang and sitemap alternates share `alternatesFor`) |
| `apps/web/src/lib/content-i18n.ts` | Content-collection helpers for translated pages: `splitEntryId` · `contentIndex` · `pagePath` · `pageSlug` · `pageOgImage` · `pageIndexable` · `pageAlternates` · `pageTranslations` |
| `RTL_LANGUAGES` · `textDirection()` · `TTextDirection` | `src/i18n/locales.ts`: `ar` `fa` `he` `ur`; `textDirection(htmlLang)` → `ltr` \| `rtl` sets `<html dir>` in `BaseLayout.astro` |
| `localeLinks` · `ogImageAlt` | Props: `localeLinks` on `BaseLayout` / `ContentLayout` / `ArticlePage` (per-locale URLs for the footer language switcher, `LocaleNav` until B2, `LangSwitch` since), `ogImageAlt` on `BaseLayout` / `ContentLayout` / `ArticlePage` / `SeoHead` |
| `.at-flip-rtl` | `tokens.css`: mirrors a direction-implying icon under `[dir="rtl"]` |
| i18n keys | `content.breadcrumb` · `content.translation.pending` · `content.translation.original` |

### 13.18 Clear Night foundation (redesign B1)

Accepted on 2026-09-27 with milestone B1 (`docs/redesign/BUILD-PLAN.md`). Values: `DESIGN.md` §2 (colour) and §12 (token system); the full token tables are in `05-frontend-spec.md` §1.1–§1.3. Existing `--at-*` names and their shadcn aliases stay; everything below is an addition, except the three value changes noted.

| Identifier | Decision |
|---|---|
| Colour tokens (new) | `--at-line-strong` · `--at-ink-2` · `--at-track` · `--at-tick` · `--at-raised` · `--at-sunken` · `--at-input-border` (per theme); `--at-horizon-ink` · `--at-night-ink` · `--at-night-ink-2` · `--at-night-muted` · `--at-night-line` · `--at-scrim` (theme-independent) |
| Spacing | Primitives `--at-s-N` = N × 4 px for N in 1 2 3 4 5 6 8 10 12 16 20 24 30. Semantic: `--at-gutter` (16 / 32 / 80 / 120) · `--at-section` (48 / 64 / 96 / 96) · `--at-card-pad` (20 / 24) · `--at-edge-min` 16 · `--at-dock-bottom` 20 · `--at-gap-tight` 8 · `--at-gap-item` 12 · `--at-gap-group` 20 · `--at-gap-group-lg` 24 · `--at-content-max` 1200px · `--at-measure` 68ch |
| Radius | `--at-r-xs` 4 · `--at-r-sm` **8** (was 6) · `--at-r-md` **12** (was 10) · `--at-r-lg` 16 · `--at-r-xl` 20 · `--at-r-2xl` 28 · `--at-r-pill` 999 |
| Type roles | `--at-type-kicker` · `-caption` · `-small` · `-ui` · `-action` · `-body` · `-lead` · `-h3` · `-h2` · `-h1` · `-price`: one `font` shorthand each, in rem; `h2`, `h1` and `price` take the larger step from 600 px. `--at-t-xl` **20px** (was 22) |
| Controls and icons | `--at-h-control` 44 · `--at-h-input` 48 · `--at-h-button` 52 · `--at-h-primary` 60 (52 at height ≤ 568) · `--at-h-cook` 64 · `--at-h-header` 60 / 68 from 600 · `--at-h-row` 56 · `--at-icon-sm` 16 · `--at-icon-md` 20 · `--at-icon-lg` 24 · `--at-border` 1px |
| Fonts (D-R26) | `--at-font` (Geist → "Geist Fallback" → system stack) · `--at-font-mono` (Geist Mono) · `--at-font-display` (Space Grotesk 600 digits, Bold face only). Files in `apps/web/public/fonts/`: `geist-latin-wght-normal.woff2` (preloaded, the only font on the first paint, precached by the service worker), `geist-mono-latin-wght-normal.woff2`, `space-grotesk-digits-600.woff2`, plus `OFL-Geist.txt` and `OFL-SpaceGrotesk.txt` (SIL OFL 1.1). Same origin only; fonts do not count toward the JS/CSS budgets (§11), CLS stays 0. Geist Mono waits behind `<html data-font-hold>` (set by `boot.js`, removed one frame after the page's `[data-main]` modules load; `tokens.css` maps `--at-font-mono` to its metric-matched fallback meanwhile). "Geist Fallback" and "Space Grotesk Fallback" skip U+221E, so ∞ comes from `system-ui`, as on the canvas |
| Breakpoints | `tokens.css` changes semantic tokens on `:root` at `(width >= 600px)`, `(width >= 1024px)`, `(width >= 1600px)` only (plus `(height <= 568px)` for `--at-h-primary`) |
| Stylelint radius guard | `stylelint.config.mjs`: `declaration-property-value-allowed-list` lets `border-*radius` take only `0`, `50%`, `var(--at-r-*)` or `calc()` over them; `tokens.css` is exempt |
| `apps/web/test/e2e/responsive.spec.ts` | Responsive sweep (`DESIGN.md` §5 Gate): `/`, `/30m`, `/until/07-30`, `/for/cooking`, `/pro`, `/embed`, `/extension`, `/about` at every 40 px from 320 to 2560 (Chromium); fails on horizontal page scroll. Known overflow runs as `test.fixme` and is listed in `docs/redesign/B1-token-debt.md` |

### 13.19 Clear Night shared shell (redesign B2)

Accepted on 2026-09-27 with milestone B2 (`docs/redesign/BUILD-PLAN.md`). Specs: `05-frontend-spec.md` §3.2, §3.25–§3.30; values: `DESIGN.md` §6, §11, §12 and `redesign/PRIMITIVES.md`. All additions; no contract (lock states and pill copy, storage keys, routes, ad rules, budgets, `--at-*` names) changes.

| Identifier | Decision |
|---|---|
| Components (`apps/web/src/components/shell/`) | `SiteHeader.astro` (props `locale`, `tool`) · `ThemeSwitch.astro` (`locale`, `compact`) · `SiteFooter.astro` (`locale`, `links`) · `LangSwitch.astro` (`locale`, `links`; replaces `components/LocaleNav.astro`, deleted) · `StatusPill.astro` (`state`, `size` L/M/S/XS, `as` output/button/span, `label`) · `Button.astro` (`variant` primary/stop/secondary/quiet, `size` sm/md/lg/cook, `href`, `kbd`, `glyph`) · `LogoGlyph.astro` |
| Stylesheet | `apps/web/src/styles/shell.css`, imported by `BaseLayout` after `tool.css`; `@layer components` (plus the page ground in `@layer base`) |
| Layout props | `BaseLayout` `header` (default `true`; `false` on tool pages, whose `ToolIsland` renders `SiteHeader` inside `#awaketab-tool` and wraps its `<main>` in `.at-shell`); `BaseLayout` `footer` prop removed (the footer reads `createT(locale)`); `ContentLayout` named slot `header` removed |
| Classes | Header `.at-site-header` · `.at-logo` (+ `.at-wordmark`) · `.at-logo-mark` · `.at-logo-ring` · `.at-logo-halo` · `.at-logo-bead` · `.at-nav` · `.at-nav-link` · `.at-header-end` · `.at-icon-button` · `.at-phone-hide` · `.at-phone-only`. Theme `.at-seg` · `.at-seg-ind` · `.at-seg-item` · `.at-theme` · `.at-theme-item` · `.at-theme-cycle`. Footer `.at-site-footer` (styles in `src/styles/footer.css`, container `at-footer`) · `.at-foot-top` · `.at-foot-brand` · `.at-foot-promise` · `.at-foot-license` · `.at-foot-map` · `.at-foot-col` · `.at-foot-sum` · `.at-foot-h` · `.at-foot-list` · `.at-foot-base` · `.at-footer-line` · `a[data-keys]` (Keyboard shortcuts; `#keys` on a tool page opens the shortcuts sheet) · `.at-lang` · `.at-lang-btn` · `.at-lang-chev` · `.at-lang-scrim` · `.at-lang-panel` · `.at-lang-handle` · `.at-lang-head` · `.at-lang-title` · `.at-lang-close` · `.at-lang-list` · `.at-lang-row` · `.at-lang-mark` · `.at-lang-ring` · `.at-lang-dot` · `.at-lang-name` · `.at-lang-note`. Primitives `.at-pill` (+ `.at-pill-s` · `.at-pill-xs` · `.at-pill-l` · `.at-pill-glyph` · `.at-g-dot` · `.at-g-pause` · `.at-g-tri` · `.at-g-ring` · `.at-pill-extra`) · `.at-button` (+ `-primary` · `-stop` · `-quiet` · `-sm` · `-lg` · `-cook` · `.at-button-glyph`) · `.at-chip` (+ `.at-chip-choose`) · `.at-tag` (+ `.at-tag-tone`) · `.at-kbd` · `.at-kbd-hint` · `.at-card` · `.at-panel` · `.at-row` · `.at-input` (restyled) · `dialog.at-sheet` · `.at-scrim`. Tool: `.at-tool-more`, `.at-tool-embed-bar`. Removed: `.at-header`, `.at-page-header`, `.at-header-actions`, `.at-footer`, `.at-footer-nav`, `.at-locales`, `.at-icon-btn` |

| Classes | Header `.at-site-header` · `.at-logo` (+ `.at-wordmark`) · `.at-logo-mark` · `.at-logo-ring` · `.at-logo-halo` · `.at-logo-bead` · `.at-nav` · `.at-nav-link` (both moved to `header-menus.css` with the menus) · `.at-header-end` · `.at-icon-button` · `.at-phone-hide` · `.at-phone-only`. Theme `.at-seg` · `.at-seg-ind` · `.at-seg-item` · `.at-theme` · `.at-theme-item` · `.at-theme-cycle`. Footer `.at-site-footer` · `.at-footer-line` · `.at-footer-nav` · `.at-lang` · `.at-lang-btn` · `.at-lang-chev` · `.at-lang-scrim` · `.at-lang-panel` · `.at-lang-handle` · `.at-lang-head` · `.at-lang-title` · `.at-lang-close` · `.at-lang-list` · `.at-lang-row` · `.at-lang-mark` · `.at-lang-ring` · `.at-lang-dot` · `.at-lang-name` · `.at-lang-note`. Primitives `.at-pill` (+ `.at-pill-s` · `.at-pill-xs` · `.at-pill-l` · `.at-pill-glyph` · `.at-g-dot` · `.at-g-pause` · `.at-g-tri` · `.at-g-ring` · `.at-pill-extra`) · `.at-button` (+ `-primary` · `-stop` · `-quiet` · `-sm` · `-lg` · `-cook` · `.at-button-glyph`) · `.at-chip` (+ `.at-chip-choose`) · `.at-tag` (+ `.at-tag-tone`) · `.at-kbd` · `.at-kbd-hint` · `.at-card` · `.at-panel` · `.at-row` · `.at-input` (restyled) · `dialog.at-sheet` · `.at-scrim`. Tool: `.at-tool-more`, `.at-tool-embed-bar`. Removed: `.at-header`, `.at-page-header`, `.at-header-actions`, `.at-footer`, `.at-locales`, `.at-icon-btn` |
| Custom properties set by CSS | `--at-bead` (logo bead tone) · `--at-tone` (pill, tag) · `--at-seg-n` · `--at-seg-i` · `--at-seg-dir` (segmented bar); container name `at-header` |
| Tokens (`tokens.css`) | Per theme `--at-lift` · `--at-ground-end` · `--at-elev`; `--at-h-tag` 24 · `--at-h-pill-l` 48 · `--at-h-pill-m` 38 · `--at-h-pill-s` 32 · `--at-h-pill-xs` 26 · `--at-icon-xs` 12 · `--at-d-slide` 600ms · `--at-d-rise` 700ms · `--at-ease` `cubic-bezier(.22,1,.36,1)` · `--at-shadow-float` · `--at-sheet-inline` 26rem · `--at-panel-inline` 360px. Alias change: `--input` → `var(--at-input-border)` (was `--at-line`; O-56) |
| Attributes and events | `<html data-theme-pref="auto|light|dark|oled">` (the stored preference; set by `boot.js` and `applyTheme()`) · `[data-main]` (a module entry `scripts/defer-main.mjs` moved off the parser: `#awaketab-tool` and `main.at-cp`; `boot.js` imports each after the first paint) · `<html data-font-hold>` (Geist Mono held until after the first paint) · radio group name `at-theme` · `[data-theme-cycle]` · `[data-lang]` · `[data-lang-panel]` · `[data-lang-close]` · ids `at-lang-btn`, `at-lang-list`, `at-lang-h` · `document` event `at-theme` (`CustomEvent<TTheme>`, boot script → island) · `<html data-hints="off">` hides button keycaps (wired in B3) |
| i18n keys | `header.home` · `header.nav` · `header.nav.for` · `header.nav.on` · `header.nav.extension` · `header.nav.pro` · `header.theme.auto` · `header.theme.autoTitle` · `header.theme.change` · `footer.honest` · `footer.about` · `footer.nav` · `footer.language` · `footer.language.current` · `footer.language.review` · `footer.language.close` · site map: `footer.promise` · `footer.license` · `footer.col.product` · `footer.col.for` · `footer.col.on` · `footer.col.resources` · `footer.col.about` · `footer.start` · `footer.embed` · `footer.kiosk` · `footer.library` · `footer.for.cooking` · `footer.for.reading` · `footer.for.presentations` · `footer.for.dashboards` · `footer.for.videoCalls` · `footer.for.downloads` · `footer.for.all` · `footer.on.all` · `footer.guides` · `footer.docs` · `footer.compare` · `footer.github` (all eight locales; English values until translated) |

| Classes | Header `.at-site-header` · `.at-logo` (+ `.at-wordmark`) · `.at-logo-mark` · `.at-logo-ring` · `.at-logo-halo` · `.at-logo-bead` · `.at-nav` · `.at-nav-link` · `.at-header-end` · `.at-icon-button` · `.at-phone-hide` · `.at-phone-only`. Theme `.at-seg` · `.at-seg-ind` · `.at-seg-item` · `.at-theme` · `.at-theme-item` · `.at-theme-cycle`. Footer `.at-site-footer` · `.at-footer-line` · `.at-footer-nav` · `.at-lang` · `.at-lang-btn` · `.at-lang-chev` · `.at-lang-panel` · `.at-lang-list` · `.at-lang-row` · `.at-lang-mark` · `.at-lang-ring` · `.at-lang-dot` · `.at-lang-name` · `.at-lang-note`. Primitives `.at-pill` (+ `.at-pill-s` · `.at-pill-xs` · `.at-pill-l` · `.at-pill-glyph` · `.at-g-dot` · `.at-g-pause` · `.at-g-tri` · `.at-g-ring` · `.at-pill-extra`) · `.at-button` (+ `-primary` · `-stop` · `-quiet` · `-sm` · `-lg` · `-cook` · `.at-button-glyph`) · `.at-chip` (+ `.at-chip-choose`) · `.at-tag` (+ `.at-tag-tone`) · `.at-kbd` · `.at-kbd-hint` · `.at-card` · `.at-panel` · `.at-row` · `.at-input` (restyled) · dialog set `.at-dialog` (`data-side` `center` · `bottom` · `end` · `start`, `data-size` `sm` · `md` · `lg`, `data-docked`) · `.at-dialog-header` · `.at-dialog-grab` · `.at-dialog-bar` · `.at-dialog-titles` · `.at-dialog-title` · `.at-dialog-description` · `.at-dialog-close` · `.at-dialog-body` · `.at-dialog-footer` (`components/ui/Dialog.astro`, `Sheet.astro`, `Drawer.astro`). Tool: `.at-tool-more`, `.at-tool-embed-bar`. Removed: `dialog.at-sheet`, `.at-scrim`, `.at-tsheet*`, `.at-float-sheet`, `.at-docked`, `.at-grab`, `.at-fs-titles`, `.at-lang-scrim`, `.at-lang-handle`, `.at-lang-head`, `.at-lang-title`, `.at-lang-close`, `.at-header`, `.at-page-header`, `.at-header-actions`, `.at-footer`, `.at-locales`, `.at-icon-btn` |
| Custom properties set by CSS | `--at-bead` (logo bead tone) · `--at-tone` (pill, tag) · `--at-seg-n` · `--at-seg-i` · `--at-seg-dir` (segmented bar); container name `at-header` |
| Tokens (`tokens.css`) | Per theme `--at-lift` · `--at-ground-end` · `--at-elev`; `--at-h-tag` 24 · `--at-h-pill-l` 48 · `--at-h-pill-m` 38 · `--at-h-pill-s` 32 · `--at-h-pill-xs` 26 · `--at-icon-xs` 12 · `--at-d-slide` 600ms · `--at-d-rise` 700ms · `--at-ease` `cubic-bezier(.22,1,.36,1)` · `--at-shadow-float` · `--at-sheet-inline` 26rem · `--at-panel-inline` 360px. Alias change: `--input` → `var(--at-input-border)` (was `--at-line`; O-56) |
| Attributes and events | `<html data-theme-pref="auto|light|dark|oled">` (the stored preference; set by `boot.js` and `applyTheme()`) · `[data-main]` (a module entry `scripts/defer-main.mjs` moved off the parser: `#awaketab-tool` and `main.at-cp`; `boot.js` imports each after the first paint) · `<html data-font-hold>` (Geist Mono held until after the first paint) · radio group name `at-theme` · `[data-theme-cycle]` · `[data-lang]` · `[data-lang-close]` · `[data-dialog="<name>"]` and `[data-dialog-close]` (every dialog built on `components/ui/Dialog.astro`) · ids `at-lang-btn`, `at-lang-list`, `at-lang-h` · `document` event `at-theme` (`CustomEvent<TTheme>`, boot script → island) · `<html data-hints="off">` hides button keycaps (wired in B3) |
| i18n keys | `header.home` · `header.nav` · `header.nav.for` · `header.nav.on` · `header.nav.extension` · `header.nav.pro` · `header.theme.auto` · `header.theme.autoTitle` · `header.theme.change` · `footer.honest` · `footer.about` · `footer.nav` · `footer.language` · `footer.language.current` · `footer.language.review` · `footer.language.close` (all eight locales) |
| Stylelint | `stylelint.config.mjs` override for `**/styles/shell.css` (later also `content.css`, `pages.css`, `page-404.css`, `pro.css`, `embed.css` and `ambient.css`): padding, margin, gap, `font`, `font-size`, `line-height` and block/inline sizes take tokens only (DESIGN.md §12.8), besides the radius guard. Off-scale sizes are named once per file: `--at-pg-*` in pages.css, `--at-am-*` in ambient.css (the ambient modes and the floating window; type roles `--at-am-type-*`, e.g. the clock, focus, cook and message digits), `--at-embed-*` in embed.css (the widget; type roles `--at-embed-type-*`) |
| Tests | `apps/web/test/e2e/shell.spec.ts` (header, footer, theme switch, language switcher keyboard and axe, pill and bead, Stop); `responsive.spec.ts` also fails on header or footer controls under 44 × 44 or within 16 px of a side edge |

Added on 2026-09-28 with the shell, Pro, extension, ambient and library fixes. All additions; no contract changes.

| Identifier | Decision |
|---|---|
| `.at-install-slot` (`shell.css`) | Wrapper for the header's Install buttons (the phone icon button and the wide labelled one). Both sit in one grid cell, and a hidden `[data-install]` button keeps its box (invisible) instead of collapsing, so showing it after the manifest loads moves nothing in the header. The phone and wide variants still switch at 600 px |
| `header.nav.english` (web, all eight locales) | Screen-reader suffix on each header nav link outside English, for example "(Englisch)": the hubs and product pages are English-only routes, so every locale links to them, and the links also carry `hreflang="en"` |
| `page.pro.manage.loading` (web, all eight locales) | "Checking your devices…": the Manage devices meter label while the device list loads (`data-loading` on `[data-meter-label]`); three placeholder rows hold the table's shape meanwhile |
| `.at-pro-skel` (`pro.css`) | A placeholder bar in those loading rows (name, date and Remove columns; `aria-hidden` rows `.at-pro-dev-skel`). Pulses slowly with the shared ease-out curve; still under reduced motion |
| `.at-pro-key-out` (`pro.css`) | The read-only box on `/pro/activate` that shows the licence key after checkout ("Show my key"): a sunken 48 px field in the key type style, wrapping anywhere so a long key never overflows on phones, select-all on click, with the Copy button beside it |
| `ext.until.summary` (extension, all eight locales) | The summary line under the popup's Until stepper: "{day} at {time}, in {remain}", for example "Tomorrow at 12:15 AM, in 1 h 15 min"; `{day}` is `tool.until.today` or `tool.until.tomorrow` |
| `ext.license.device` (extension, all eight locales) | "Chrome on {os}": how the options page names this browser in the active licence row ("AwakeTab Pro · Chrome on macOS"; the OS is ChromeOS, Windows, macOS, Linux or "desktop"). The activation API keeps its own device label ("AwakeTab for Chrome · macOS") |
| `page.extension.cta.*` (web, all eight locales) | The `/extension` store buttons and their note: `chrome` "Add to Chrome", `edge` "Get it for Edge", `note` "Free. Works in {browsers} (version {version} or later).", and, while `EXTENSION_LISTED` is `false` in `src/lib/extension.ts`, `chromeSearch` "Search the Chrome Web Store", `edgeSearch` "Search Edge Add-ons" and `pending` "The listing is waiting for store review, so for now these buttons open a store search." (the links are store searches until the listing is approved) |
| `@awaketab/wake/video` (package entry) | New export of `@awaketab/wake` (`src/video.ts` → `dist/video.{js,cjs,d.ts,d.cts}`): `webm` and `mp4`, the fallback clips as `data:` URLs, capped at 650 B gz. The core ships only the WebM; pass the MP4 for Safari before 16.4 with `createWakeLock({ videoSources: { mp4 } })`. The embed widget does. Spec: `04-engine-spec.md` §5, `12-library-spec.md` §10.4 |

Added on 2026-09-28 with the header menus (`05-frontend-spec.md` §3.25). All additions; `header.nav.for` now reads "Use it for" in English.

| Identifier | Decision |
|---|---|
| Components (`components/shell/`) | `HeaderMenuGroup.astro` (props `locale`, `kind` `for`/`on`/`res`, `scope`, `path`, `feature`): one menu group, rendered in a desktop panel and again in the Menu sheet · `HeaderAdd.astro` (`locale`, `store`, `class`): the add call to action per browser. Data in `src/lib/header-menu.ts` (`MENU_FOR`, `MENU_ON`, `MENU_RES`, `RES_SECTIONS`, `arc()`, `ring()`); icons from `components/icons/UseCaseIcon.astro` and `DeviceIcon.astro` |
| Stylesheet | `src/styles/header-menus.css` (`@layer components`): the nav bar, the menu panels and the Menu sheet. Content pages inline it from `SiteHeader` (`?raw`, `minifyCss`); tool pages get it through `@import` in `tool-more.css`, the on-demand sheet the tool links after load and idle, so it never counts toward the tool page's inlined CSS (§11). `shell.css` keeps only `:where(.at-hm-panel) svg` (icon size before that sheet arrives) |
| Classes | `.at-nav-list` · `.at-hm-hub` (the hub link shown instead of a trigger where the popover API is missing) · `.at-hm-trigger` · `.at-hm-chev` · `.at-hm-panel` (+ `.at-hm-drop`, `.at-hm-menu`) · `.at-hm-open` (the Menu button) · `.at-hm-head` · `.at-hm-title` · `.at-hm-body` · `.at-hm-group` · `.at-hm-kicker` · `.at-hm-list` · `.at-hm-row` · `.at-hm-tile` · `.at-hm-text` · `.at-hm-label` · `.at-hm-hint` · `.at-hm-len` · `.at-hm-ring` (+ `-track`, `-arc`, `-bead`, `-halo`) · `.at-hm-feature` · `.at-hm-dial` · `.at-hm-dial-ticks` · `.at-hm-go` · `.at-hm-all` · `.at-hm-links` · `.at-hm-link` · `.at-hm-theme` · `.at-hm-theme-v` · `.at-hm-cta` · `.at-hm-add` (+ `.at-hm-add-long`, `.at-hm-add-short`) · `.at-logo-word` |
| Custom properties | `--at-hm-w` (panel width) · `--p` (a ring arc, percent of the dial) · `--i` (stagger index of a menu row) |
| Interactive cards and icons (`DESIGN.md` §8, `05-frontend-spec.md` §3.31) | Attributes `li[data-tilt]` (a card that tilts toward the pointer) · `[data-tilt-z]` (its icon box, lifted above the card). Custom properties `--at-tx` · `--at-ty` (pointer position on the card, −1 to 1, written by `src/lib/tilt.ts` `initTilt()`). Classes `.at-ico-part-*` on icon parts: `steam` · `page` · `notes` · `weight` · `case` · `light` · `screen` · `chart` · `text` · `cap` · `tassel` · `tiles` · `tap` · `arrow` · `tray` · `type` · `star` · `needle` · `apps` · `logo` · `orbit` · `lid` · `flame` · `wave`. Stylesheets `src/styles/tilt.css` · `src/styles/icon-motion.css`. Keyframes `at-ico-*` and `at-hm-sweep` |
| Attributes and ids | Popovers `#at-hm-for` · `#at-hm-on` · `#at-hm-res` · `#at-hm-menu`, opened by `popovertarget` buttons (anchor names `--at-hm-{id}`) · `.at-hm-add[data-v="chrome|edge|ios"]` · `<html data-edge>` (set by `boot.js` on Microsoft Edge, the one browser CSS cannot tell from Chrome) |
| i18n keys (all eight locales, English copies until translated) | `header.nav.res` · `header.menu` · `header.menu.close` · `header.menu.length` · `header.menu.all.for` · `header.menu.all.on` · `header.menu.start` · `header.menu.start.line` · `header.menu.{for,on,res}.{id}` and `.line` · `header.add.chrome` · `header.add.edge` · `header.add.home` · `header.add.homeShort` |

### 13.20 Content routes and the draft gate (redesign B11, OD-3)

Accepted on 2026-09-27 with milestone B11 (`docs/redesign/BUILD-PLAN.md`), applying owner decisions OD-3, OD-2 / O-45 and O-23 (`docs/redesign/DECISIONS.md`, `docs/research/marketing-seo-content.md` §5.3). Spec: `06-content-seo-spec.md` §20.

| Identifier | Decision |
|---|---|
| `/for` hub | 14 scenarios. Cut: `navigation`, `live-streams`, `exams-proctoring`, `baby-monitor` (never indexed; no redirect, 404). New: `/for/classroom` (English only; translated slugs reserved in `slugs.json`: `aula`, `sala-de-aula`, `klassenzimmer`, `salle-de-classe`) |
| 301 merges | `/for/second-monitor` → `/guides/second-monitor-turns-off` · `/on/windows-10` → `/on/windows-11` (retitled "Windows 11 and 10") · `/guides/modern-standby` → `/guides/lock-screen-vs-sleep` · `/learn/nosleep-js-vs-wake-lock` → `/vs/nosleep-js`. Source: `CONTENT_REDIRECTS` in `apps/web/scripts/headers.mjs` (written to `public/_redirects` by the build). No locale redirects: none of these pages had a translation |
| Content counts | 44 English pages: 14 `/for`, 11 `/on`, 7 `/vs`, 7 `/guides`, 5 `/learn` |
| Draft gate | The existing frontmatter field `noindex: true` marks a draft: live, `noindex, follow`, no hreflang, out of the sitemaps and IndexNow. 25 rewritten English pages are indexable; the other 19 are drafts until rewritten (list: `06-content-seo-spec.md` §20). No new schema field |
| `test/lib/content.test.ts` | Source-level guard: the route set above, slug map, redirect targets, the launch set, and the fact-check claims (battery saver refusing the lock, unrecorded testing, em dashes in English prose) never coming back |

### 13.21 Clear Night content pages (redesign B5)

Accepted on 2026-09-27 with milestone B5 (`docs/redesign/BUILD-PLAN.md`). Specs: `05-frontend-spec.md` §3.31, §4.2; `06-content-seo-spec.md` §21; canvas `ContentArticle`, `GuideOn`, `GuideVs`, `GuideGuides`, `GuideLearn`, `HubFor` (`hub` prop), `HomeBelow`. Routes, slugs, storage keys, lock states, budgets and the ad placement rules do not change; the badge copy follows decision O-46.

| Identifier | Decision |
|---|---|
| Components | `ArticlePage.astro` (props unchanged; `after` slot kept) · `HubPage.astro` (prop `kind`; `/for`, `/on`, `/vs`, `/guides`) · `DocsHub.astro` (the `/learn` hub, titled Docs: "Start here" row of featured pages, grouped rows, Guides and Compare tiles, reading time per page) · `HomeBelow.astro` (new; the home page below the tool, rendered inside `ToolIsland`'s slot by `pages/index.astro`) · `DeviceMatrix.astro` (restyled) · `AdSlot.astro` (adds the visible "Advertisement" label; `data-ad-slot` / `data-size` / `data-size-sm` unchanged). `SupportMatrix.tsx` deleted (the home support table is plain markup in `HomeBelow.astro`) |

| Components | `ArticlePage.astro` (props unchanged; `after` slot kept) · `HubPage.astro` (prop `kind`; `/for`, `/on`, `/learn`) · `HubGallery.astro` (prop `kind` `vs` | `guides`: the two hubs as card galleries; default slot = extra intro under the lead) · `HomeBelow.astro` (new; the home page below the tool, rendered inside `ToolIsland`'s slot by `pages/index.astro`) · `DeviceMatrix.astro` (restyled) · `AdSlot.astro` (adds the visible "Advertisement" label; `data-ad-slot` / `data-size` / `data-size-sm` unchanged). `SupportMatrix.tsx` deleted (the home support table is plain markup in `HomeBelow.astro`) |
| `ContentLayout.astro` | Owns the article grid and the ad slots. Props `family` (`for` · `on` · `vs` · `guides` · `learn`, rendered as `data-family`) and `toolFirst` (`/for` and `/on`, rendered as `data-tool="first"`, otherwise `after`); one order for every family (docs/06 §24). Named slots `toc` · `head` · `contents` (the phone "On this page") · default (Markdown) · `after` (page data outside the word band) · `limit` (the honest limit, inside its own `.at-prose`) · `tool` · `tail` (questions, related, author, inside `.at-prose`). The props `toolAt`, `variant` and `notesAfterTool` were removed on 29 Sep 2026 |
| Modules | `src/lib/hubs.ts` (`HUBS` intro copy and groups per hub, `EXTRA`, `PRESET_LABEL`, `MODE_LABEL`) · `src/lib/docs-hub.ts` (`DOCS_FEATURED`, `DOCS_GROUPS`, `DOCS_MORE`, `DOCS_TILES`, `docsIcon()`, `readingMinutes()` at 220 words a minute over the body and the reader-visible frontmatter blocks) · `src/lib/content-nav.ts` (`initContentNav()`: "On this page" and hub jump-bar scroll spy, "Back to the tool" pill mirror) |
| Stylesheet | `src/styles/content.css` in its own cascade layer `content`, declared after `utilities` (`@layer properties, theme, base, components, utilities, content`), scoped under `.at-cp`; the stylelint token override now covers `content.css` as well as `shell.css`. Local roles: `--at-type-row` (500 16/24), `--at-type-count` (300 24/32), `--at-type-count-l` (300 28/36), `--at-type-code` (mono 14/22); geometry `--at-col-toc` 200 · `--at-col-main` 680 · `--at-col-rail` 160 · `--at-col-intro` 360 · `--at-col-list` 664; `--at-gap-article` (48 / 64, guides and learn 96 on desktop); ad boxes `--at-ad-w` / `--at-ad-h` (300 × 250 → 336 × 280 from 600) and `--at-rail-w` / `--at-rail-h` (320 × 50 → 160 × 600 from 1024) |
| Classes | Page `.at-cp` · `.at-art` (`data-tool-at`, `data-variant`) · `.at-head` · `.at-body` · `.at-tail` · `.at-md` · `.at-crumbs` · `.at-crumb-sep` · `.at-h1-page` · `.at-lead` · `.at-kicker` · `.at-meta` (+ `-verified` · `-stale` · `-pending` · `-by`) · `.at-toc` (+ `-list` · `-dot` · `-card` · `-digits` · `-back`) · `.at-pill-bare` · `.at-tool-card` · `.at-tool-area` · `.at-limit-note` · `.at-note` · `.at-related-sec` · `.at-rows` · `.at-link-row` · `.at-go` · `.at-start` · `.at-related-links` · `.at-start-pill` · `.at-faq-sec` · `.at-faq` · `.at-faq-icon` · `.at-author` (+ `-name` · `-role`) · `.at-avatar` · `.at-ad` (+ `-inline` · `-rail` · `-label` · `-box`). Hub `.at-hub` (+ `-intro` · `-note` · `-groups` · `-group` · `-group-head` · `-count` · `-list` · `-item` · `-title` · `-line` · `-meta`) · `.at-try` (+ `-top` · `-digits` · `-cta` · `-note` · `-link`) · `.at-jump` · `.at-jump-ind`. Docs hub (`docs-hub.css`) `.at-docs` (+ `-head` · `-start` · `-cards` · `-card` · `-badge` · `-icon` · `-line` · `-foot` · `-time` · `-go` · `-groups` · `-group` · `-group-head` · `-list` · `-row` · `-text` · `-more` · `-tiles` · `-tile`). Device matrix `.at-dm` (+ `-verified` · `-scroll`). Home `.at-hb*` (component-scoped). The `.at-article` name stays tool.css's prose class for trust pages |

| Classes | Page `.at-cp` · `.at-art` (`data-tool-at`, `data-variant`) · `.at-head` · `.at-body` · `.at-tail` · `.at-md` · `.at-crumbs` · `.at-crumb-sep` · `.at-h1-page` · `.at-lead` · `.at-kicker` · `.at-meta` (+ `-verified` · `-stale` · `-pending` · `-by`) · `.at-toc` (+ `-list` · `-dot` · `-card` · `-digits` · `-back`) · `.at-pill-bare` · `.at-tool-card` · `.at-tool-area` · `.at-limit-note` · `.at-note` · `.at-related-sec` · `.at-rows` · `.at-link-row` · `.at-go` · `.at-start` · `.at-related-links` · `.at-start-pill` · `.at-faq-sec` · `.at-faq` · `.at-faq-icon` · `.at-author` (+ `-name` · `-role`) · `.at-avatar` · `.at-ad` (+ `-inline` · `-rail` · `-label` · `-box`). Hub `.at-hub` (+ `-intro` · `-note` · `-groups` · `-group` · `-group-head` · `-count` · `-list` · `-item` · `-title` · `-line` · `-meta`) · `.at-try` (+ `-top` · `-digits` · `-cta` · `-note` · `-link`) · `.at-jump` · `.at-jump-ind`. Pick gallery (`/vs`, `/guides`) `.at-pick` (+ `-intro` · `-card` · `-title` · `-tags` · `-picks` · `-us` · `-fix` · `-more`), `data-gallery` on the page's `main`, `--at-k` (card stagger index). Device matrix `.at-dm` (+ `-verified` · `-scroll`). Home `.at-hb*` (component-scoped). The `.at-article` name stays tool.css's prose class for trust pages |
| Attributes and custom properties | `[data-spy]` (nav whose `#` links follow the section in view, `aria-current="location"`) · `[data-tool-mirror]` · `[data-mirror-pill]` · `[data-mirror-text]` · `[data-mirror-digits]` · `--at-n` / `--at-i` (jump bar count and index) · `--at-aura` (tool card glow while the lock is held) · Shiki `--astro-code-*` (code colours mapped to Clear Night tokens) |
| Markdown code blocks | `astro.config.mjs` `markdown.shikiConfig.theme: 'css-variables'`; colours come from `content.css`, so both themes keep AA contrast on the sunken well |
| i18n keys | New in all 8 locales: `content.toc` · `content.backToTool` · `content.limit` · `content.ad` · `content.byline` · `content.try.title` · `content.try.body` · `content.skip.title` · `content.skip.body`. Changed (O-46): `content.verified` → "Sources checked {date}" (all locales), `content.stale` (en). English copy: `page.hub.{on,vs,guides,learn}.h1` and `page.hub.{on,guides,learn}.description` follow the canvas and the fact-check; `content.author.role` "Builds AwakeTab." Hub galleries (all 8 locales, English text until translated): `page.hub.vs.pick` · `page.hub.vs.instead` (`{name}`) · `page.hub.vs.more` · `page.hub.guides.more` |
| Responsive sweep | `responsive.spec.ts` also sweeps `/for` and `/guides/iphone-auto-lock-never-greyed-out` |

### 13.22 Structured article blocks

Accepted on 2026-09-27. Spec: `06-content-seo-spec.md` §22; canvas `ContentArticle`, `GuideOn`, `GuideVs`, `GuideGuides`, `GuideLearn`. Routes, slugs, storage keys, lock states and pill copy, budgets and the ad rules do not change.

| Identifier | Decision |
|---|---|
| Block lines | A Markdown body line `::name` or `::name key` places a block: `steps` · `figures` · `pills` · `checklist` · `matrix` · `rows <key>` · `compare` · `picks <key>` · `code <file>` · `note <key>` · `lifecycle` · `ad`. `limit` and `limit inline` were removed on 29 Sep 2026: the template places the honest limit after the body (docs/06 §24) |
| Frontmatter fields | All optional, shared by the five collections: `lead` · `crumb` · `toc` · `facts` · `steps` (`title`, `text`, `path`, `shot`, `short`) · `stepsDone` · `figures` · `pills` · `checklist` · `matrix` · `rows` · `compare` · `picks` · `code` · `notes` · `lifecycle` · `toolNote` |
| Components and modules | `components/article/*` (`ArticleParts`, `Steps`, `Figures`, `PillStates`, `Checklist`, `Matrix`, `Rows`, `Compare`, `Picks`, `CodeBlock`, `Note`, `Lifecycle`, `Limit`) · `src/lib/article.ts` (`splitArticle`, `placedBlocks`, `inline`, `plain`, `tokenize`) · `src/lib/article-css.ts` (`articleCss`, per-page block CSS) · `src/lib/content-nav.ts` gains the checklist, tracked steps and Copy |
| Stylesheets | `src/styles/article/{steps,shots,track,for,box,rows,grid,code,lifecycle}.css`, inlined per page; with `hub.css`, `hub-gallery.css`, `pick-gallery.css` and `device-matrix.css` on the strict token lint. New local roles in `content.css`: `--at-col-key` 112 · `--at-col-state` 144 · `--at-col-pill` 240 · `--at-col-fig` 112 → 160 · `--at-shot-w` / `--at-shot-h` 112 × 224 → 160 × 320 · `--at-code-line` · `--at-type-code-file` (mono 13/18, the code block file name) · `--at-hatch` (placeholder and ad hatching) · `--at-type-diagram` (+ `-mono`, `-node`). The Shiki `--astro-code-*` mapping of §13.21 is gone: code goes through `::code` |
| Classes | `.at-steps` (+ `-shots`, `-track`) · `.at-step-n` · `.at-step-head` · `.at-step-k` · `.at-step-link` · `.at-path` · `.at-rail` · `.at-next` · `.at-done` · `.at-alldone` · `.at-reset` · `.at-bar` (+ `-top`) · `.at-toc-steps` · `.at-prog` · `.at-jump-tool` · `.at-figs` · `.at-fig` (+ `-phone`, `-desktop`) · `.at-shot` (+ `-frame`) · `.at-states` · `.at-check` · `.at-box` · `.at-count` · `.at-sec` · `.at-sec-h` · `.at-facts` · `.at-grid` (+ `-h`) · `.at-mx` · `.at-cmp` (+ `-c`, `-k`) · `.at-dot` (+ `-us`) · `.at-rl` · `.at-kv` · `.at-picks` · `.at-codeb` (+ `-bar`) · `.at-copy` · `.at-code` · `.at-ln` · `.k-*` tokens · `.at-note-lamp` · `.at-lc` (+ `-w`, `-t`, `-n`, `-e`, `-o`, `-edge`) |
| Attributes | `data-check` · `data-counter` · `data-steps` · `data-step` · `data-state` (`next`, `done`) · `data-progress` · `data-prog` · `data-all-done` · `data-reset` · `data-copy` · `data-placeholder` · `data-r` (matrix result) |
| i18n keys | New in all 8 locales: `content.step` · `content.stepLink` · `content.nextUp` · `content.done` · `content.markDone` · `content.clearProgress` · `content.progress` · `content.progressCount` · `content.progressNext` · `content.progressAll` · `content.stepsNav` · `content.jumpTool` · `content.screenshot` · `content.placeholder` · `content.placeholderAlt` · `content.same` · `content.copy` · `content.copied` · `content.copyFile` · `content.codeScroll` · `content.checked` · `content.related.for` |
| Storage | None. Ticks and step progress are not stored |

### 13.23 Clear Night tool page

Accepted on 2026-09-27. Spec: `05-frontend-spec.md` §3.33; canvas `Main`, `Extras`, `PresetPage`, `UntilPage`. The seven lock states and their pill strings, routes, slugs, budgets and ad rules do not change. One storage field is added (`settings.face`, `08-data-storage.md`); the wake library's advice set loses `battery_saver` (below).

| Identifier | Decision |
|---|---|
| Modules | `src/tool/ui/view.ts` (`mountView`, `statusOf`, `liveSession`, `plannedSec`, `TStatus`) · `ui/view-more.ts` (`more()`: the rarer texts) · `ui/actions.ts` (`act`, `open`, `openShare`, `sharePath`, `help`, `pip`, `cycleTheme`, `untilSlots`) · `ui/receipt.ts` (`mountReceipt`) · `ui/why.ts` (`mountWhy`, `whyRows`) · `ui/toast-view.ts` (`mountToasts`) · `ui/more-css.ts` (`moreCss()`: links `tool-more.css`) · `ui/dialog.ts` (`openDialog(dialog, opener?)`: the one controller for the tool's dialogs) · `src/tool/msg.ts` (`sanitizeMsg`). Deleted: `ui/pill.ts`, `ui/ring.ts`, `ui/timer.ts`, `ui/chips.ts`, `ui/dialogs.ts`, `ui/notices.ts`. Build chunks `tool-boot` and `tool-ui` (`astro.config.mjs` `manualChunks`; Terser, 3 passes) |
| Store (`IToolState.ui`) | `open` (`''` · `until` · `custom` · `more`) · `ask` (`{ until, fb }`, the time's-up grace) · `done` (`IDone`: `at`, `reason`, `log`, `total`, `left`) · `why` · `log` (`TLogEntry` = `[0 held \| 1 paused, from, to?]`) · `asked` · `ok` · `rcpt` · `auto` · `past` · `tap` (a refused auto-start, decision D-R30). No dialog field: the open `<dialog>` is the truth |
| Root attributes | `#awaketab-tool`: `data-status` (`ready` · `starting` · `awake` · `paused` · `blocked` · `needtap` · `fallback` · `timesup` · `ended`) · `data-open` · `data-units` (`''` · `h` · `d`) · `data-phase` (`dawn` · `day` · `dusk` · `night`) · `data-auto` (server-rendered on auto-start routes) and `data-settled` (the start's outcome is known) · flags `data-final` `data-inf` `data-deferred` `data-why` `data-toast` `data-batt` `data-fb` `data-cause` `data-past` `data-tomorrow` `data-ig` `data-off` `data-rc-paused`. `<html>`: `data-face` (`bold` · `horizon` · `tide` · `flip` · `rolling` · `analog` · `rings` · `word` · `nixie` · `lcd` · `matrix`; absent = Ring), `data-hints="off"` |

| Modules | `src/tool/ui/view.ts` (`mountView`, `statusOf`, `liveSession`, `plannedSec`, `TStatus`) · `ui/view-more.ts` (`more()`: the rarer texts) · `ui/actions.ts` (`act`, `open`, `openShare`, `sharePath`, `help`, `pip`, `cycleTheme`, `untilSlots`) · `ui/receipt.ts` (`mountReceipt`) · `ui/why.ts` (`mountWhy`, `whyRows`) · `ui/toast-view.ts` (`mountToasts`) · `ui/more-css.ts` (`moreCss()`: links `tool-more.css`) · `src/tool/msg.ts` (`sanitizeMsg`). Deleted: `ui/pill.ts`, `ui/ring.ts`, `ui/timer.ts`, `ui/chips.ts`, `ui/dialogs.ts`, `ui/notices.ts`. Build chunks `tool-boot` and `tool-ui` (`astro.config.mjs` `manualChunks`; Terser, 3 passes) |
| Store (`IToolState.ui`) | `open` (`''` · `until` · `custom` · `more`) · `ask` (`{ until, fb }`, the time's-up grace) · `done` (`IDone`: `at`, `reason`, `log`, `total`, `left`) · `why` · `log` (`TLogEntry` = `[0 held \| 1 paused, from, to?]`) · `asked` · `ok` · `rcpt` · `auto` (the current start was made by the page on load; with no grant yet, `statusOf()` holds Ready) · `past`. `TDialogName` = `settings` · `shortcuts` · `share` · `rating` · `stats` · `pro` · `null` |
| Root attributes | `#awaketab-tool`: `data-status` (`ready` · `starting` · `awake` · `paused` · `blocked` · `needtap` · `fallback` · `timesup` · `ended`) · `data-open` · `data-units` (`''` · `h` · `d`) · `data-phase` (`dawn` · `day` · `dusk` · `night`) · `data-auto` (server-rendered on routes that start on load; the pill line stays invisible until the answer) and `data-settled` (the load-time start has its answer, or 2 s) · build-time first-paint inputs read by `boot.js`: `data-sec`, `data-until`, `data-tmr`, `data-chip`, `data-sky` · flags `data-final` `data-inf` `data-deferred` `data-why` `data-toast` `data-batt` `data-fb` `data-cause` `data-past` `data-tomorrow` `data-ig` `data-off` `data-rc-paused`. `<html>`: `data-face` (`bold` · `horizon` · `tide` · `flip` · `rolling` · `analog` · `rings` · `word` · `nixie` · `lcd` · `matrix`; absent = Ring), `data-hints="off"`, `data-swap` (the instant of a theme swap) |
| Markup hooks | `[data-t="<slot>"]` (text written by the view) · `[data-l="<slot>"]` (`aria-label` written by the view) · `[data-act]` (`start` · `stop` · `extend` · `retry` · `fallback` · `why` · `more` · `close` · `less` · `more5` · `changeTime` · `add15` · `add30` · `add60` · `askStop` · `battSettings`) · `[data-preset]` · `[data-face]` (`role="tab"`) · `[data-slot="0–3"]` · `[data-until-input]` · `[data-pip-slot]` · `[data-timer]` · `[data-pill]` · `[data-pill-text]` · `[data-open-settings]` · `[data-open-stats]` · `[data-open-share]` · `[data-open-shortcuts]` · `[data-open-pip]` · `[data-install]` · `[data-install-card]` · `[data-resume]` · `[data-second-tab]` · `[data-rc-bar]` · `[data-why-list]` · `[data-toasts]` · `dialog[data-dialog="settings" \| "stats" \| "share" \| "rating" \| "shortcuts" \| "pro"]` · `[data-lang-row]` · `#at-lang-set-list [data-code][data-q][data-a]` (each Settings language row carries the suggestion question and button in its own language; `ui/lang-suggest.ts`) · `#awaketab-tool[data-manifest]` (tool pages link the web manifest after the first paint, from `pwa.ts`; `BaseLayout` renders the `<link rel="manifest">` only on pages with the site header) · `.at-install-slot` (wraps the two `[data-install]` buttons) · `section.at-lapse[data-lapse="grace" \| "lapsed"]` with `[data-lapse-for]`, `[data-lapse-date]`, `[data-lapse-dismiss]` (Pro renewal and lapse notice above the header, styled by the on-demand `styles/tool-lapse.css`; dismissal stored as the onboarding tip `pro-lapse-<exp>`) · `.at-lengths [data-len="<presetId>:<minutes>" \| "until"]` (preset pages' length links; during a session they switch it in place) · `.at-time-day[data-t="near0–3"]` (until pages' "later today" / "tomorrow" tile lines) · ToolIsland named slot `top` (under the header, above the first screen) |
| Custom properties | `--at-p` (time left ÷ total, registered `<number>`) · `--at-ask` · `--u` (face unit, registered `<length>`) · `--at-u-max` · `--at-face-min` · `--at-tone` · `--at-face-c` · `--at-halo-a` · `--at-lamp-glow` · `--at-lamp-soft` · `--at-lamp-line` · `--at-tide-ink` · `--at-hz-ink` · `--at-tl-*` (the tool stylesheets' named off-scale sizes and type roles, defined once at the top of `tool.css` and `tool-more.css`; the stylelint token rule accepts `--at-tl-*` for spacing and `--at-tl-type-*` for `font`) |
| Stylesheets | `base.css` (every page, via BaseLayout) · `tool.css` (ToolIsland) · `tool-full.css` (the full tool pages: `/`, presets, `/until`, `[lang]` homes, 404) · `tool-more.css` (lazy) · `tool-page.css` · `tool-until.css` · `tool-embed.css`, all under the strict stylelint token override since B3 |
| Advice codes | `TAdviceCode` drops `battery_saver` and `low_power_ios` (battery savers and Low Power Mode never refuse a wake lock; Chromium and WebKit have no such check). `classifyDenial()` returns `null` for a denial with no known cause; `advice` stays `null` and the blocked card lists the usual causes. `embedAdvice()` maps an allowed frame's `iframe_no_allow` to `null` (`tool.advice.unknown`) |
| i18n keys | About 209 new keys in all 8 locales, in the groups `tool.face.*` · `tool.sky.*` · `tool.kicker.*` · `tool.meta.*` · `tool.when.*` · `tool.len.*` · `tool.note.*` · `tool.cta.*` · `tool.chip.*` · `tool.until.*` · `tool.slot.*` · `tool.custom.*` · `tool.blocked.*` · `tool.battery.*` · `tool.done.*` · `tool.why.*` · `tool.share.*` · `tool.card.*` · `settings.lamp.*` · `settings.clock.*` · `settings.battery.*` · `stats.heat.*` · `stats.unit.*` · `pwa.card.*`, plus `tool.advice.unknown`. Removed: `tool.advice.battery_saver`, `tool.advice.low_power_ios`. Changed: `pro.card` (no schedules), `library.demo.scenario.denied`, `tool.offline` |

### 13.24 The home page's story moves to /learn

Accepted on 2026-09-28. The home page now sells and starts the tool; the explanation that sat below it lives in the Docs section (`/learn`). Spec: `06-content-seo-spec.md` §23. The seven lock states and their pill strings, storage keys, budgets and the ad rules do not change.

| Identifier | Decision |
|---|---|
| New routes | `/learn/how-awaketab-works` (what AwakeTab does, how a session works, the seven states with their exact pill copy) · `/learn/honest-limits` (the six limits and what to use instead) · `/learn/faq` (every question the home page answered). English only; translated slugs reserved in `slugs.json`: `como-funciona-awaketab` / `como-o-awaketab-funciona` / `so-funktioniert-awaketab` / `comment-fonctionne-awaketab`, `limites-honestos` / `limites-honestos` / `ehrliche-grenzen` / `limites-honnetes`, `preguntas-frecuentes` / `perguntas-frequentes` / `haeufige-fragen` / `questions-frequentes` (es / pt-br / de / fr) |
| Content counts | 47 English pages: 14 `/for`, 11 `/on`, 7 `/vs`, 7 `/guides`, 8 `/learn`. 28 are indexable (the 25 of §13.20 plus the three new pages); the 19 drafts are unchanged |
| Hub order | `/learn` lists How AwakeTab works, Honest limits and FAQ first, then the existing pages |
| Merged copy | The home support table and device list join `/learn/browser-support-matrix`; "How AwakeTab is checked" joins `/learn/how-we-tested`; "When something else is the better tool" becomes the `/vs` hub intro; "Or fix the setting itself" becomes the `/guides` hub intro (`src/lib/hubs.ts`) |
| Structured data | None added. `FAQPage` is not emitted anywhere (`06-content-seo-spec.md` §7, §8); `/learn/faq` carries the usual `Article` and `BreadcrumbList` |

### Use case and device hub galleries

Accepted on 2026-09-28. The `/for` and `/on` hubs show their entries as card galleries; `/vs`, `/guides` and `/learn` keep the list. Routes, slugs, schema, breadcrumbs, storage keys, lock states and the ad rules (no ads on hub pages) do not change.

| Identifier | Decision |
|---|---|
| Components | `components/icons/UseCaseIcon.astro` (prop `name` = a `/for` slug) · `components/icons/DeviceIcon.astro` (prop `name` = an `/on` slug): inline 24 px line icons, `currentColor`, stroke 1.8, `aria-hidden` unless a `label` prop is given; an unknown name draws a plain screen. `components/hub/UseCaseGallery.astro` · `components/hub/DeviceGallery.astro`, rendered by `HubPage.astro` for `kind` `for` and `on` |
| Start link | `startHref(preset, mode)` in `src/lib/hubs.ts`: the preset's tool route (`/15m` … `/4h`, `/8h`, `/` for `pinf` and `until`) plus `?mode=` when the entry's mode is not `standard` |
| Support tags | `supportTags(slug, browsers, os)` in `src/lib/device-support.ts`: one tag per entry browser that `support-matrix.json` lists on one of the entry's systems ("Safari 16.4+"); `ios-home-screen` uses the `ios-pwa` context. "Native wake lock" shows only when every tag's mechanism is `native` |
| Stylesheet | `src/styles/hub-gallery.css` (layer `content`, strict token lint), imported by `pages/for.astro` and `pages/on.astro` only |
| Classes | `.at-gal` (+ `-uc`, `-dev`) · `.at-gal-card` · `.at-gal-top` · `.at-gal-icon` · `.at-gal-title` · `.at-gal-line` · `.at-gal-actions` · `.at-gal-start` · `.at-gal-read` · `.at-gal-link` · `.at-gal-native` · `.at-gal-browsers`; tags reuse `.at-tag` / `.at-tag-tone`. `--at-k` is the card index for the staggered rise |
| i18n keys | New in all 8 locales (English values until translated): `page.hub.start` · `page.hub.readGuide` · `page.hub.native` |

### No unstyled flash and no layout shift

Accepted on 2026-09-28. Rules and reasons: `05-frontend-spec.md` §1.2 (fonts) and §13 (first paint, late sheets, layout shift). Budgets unchanged: no critical JS added; the inlined tool CSS is net zero or smaller (the unused `.at-panel` and `.at-scrim` classes and a duplicate backdrop rule were deleted to pay for the new rules).

| Identifier | Decision |
|---|---|
| Icon sizing | Every inline `<svg>` has `width`, `height` and `viewBox` at its design size; `UseCaseIcon` and `DeviceIcon` take `size` (default 24; the header menus pass 20 and 32) |
| `styled(mount)` | `src/tool/ui/more-css.ts`: runs `mount` once `tool-more.css` has loaded and returns its unsubscribe; used by `toast-view.ts` and `banners.ts`. `moreCss()` gates `act()`, `open()`, `help()` and the language banner |
| `<html data-swap>` | Set by `boot.js` for two frames on every theme apply; `base.css` turns transitions off under it, except `.at-seg-ind` |
| `<html style="scrollbar-gutter:stable">` | Set by `BaseLayout` on every non-bare page |
| Late-sheet gates | `.at-hm-open` is `visibility: hidden` in `shell.css` until `header-menus.css` loads; `:where(.at-hb > *)` is `visibility: hidden` in `tool-full.css` until `home.css` (`.at-hb-sec`), `home-extension.css` (`.at-hx`) `home-levels.css` (`.at-hl`) or `home-yours.css` (`.at-hy`) loads |
| Fonts | Geist `font-display: optional`; Geist Mono and Space Grotesk `swap`; "Geist Fallback" 105.8 / 94.99 / 27.88 % (also in the extension's `base.css`) |
| Removed classes | `.at-panel` and `.at-scrim` (never used in markup; `--at-scrim` stays) |

### Eight more clock faces

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §3.33 (Faces) and `DESIGN.md` §7. All twelve faces are free. The seven lock states, the pill copy, storage keys (only `settings.face` values and `settings.faceStyles.analog` are new, `08-data-storage.md` §2.1), routes and the tool's JS budgets do not change: the tool gains a few lines of glue and everything else loads as the `faces` pack.

| Identifier | Decision |
|---|---|
| Face ids | `flip` · `rolling` · `analog` · `rings` · `word` · `nixie` · `lcd` · `matrix` (`TFace`, joining `ring` · `bold` · `horizon` · `tide`); display names Flip · Rolling · Analog · Rings · Words · Nixie · LCD · LED |
| Face styles | `settings.faceStyles.analog`: `minimal` (default) · `luxe`; written by Settings → Analog style (`input[name="analogStyle"]`, shown only while Analog is chosen) |
| Modules | `src/tool/packs/faces/index.ts` (`mountFaces(ctx)`, imported by `ui/view.ts` with `import()` the first time a newer face is chosen; since the face gallery, for any face change, see below) · `kit.ts` (shared helpers, `IFrame`, `IFace`) · one module per face `<id>.ts` with its sheet `<id>.css` (loaded with `?url` before it mounts) · pure tables `word-table.ts` (`WORD_CLOCKS`, `litCells`), `lcd-text.ts` (`ghost`), `matrix-font.ts` (`dotLayout`, `MATRIX_ROWS`) |
| Chunks | `pack-faces` (host) and `pack-faces-<id>` per face (`astro.config.mjs` `manualChunks`; `number-flow` and `esm-env` go to `pack-faces-rolling`). `scripts/size.mjs` counts every `pack-faces-*` chunk toward the `faces` pack budget (30 KB gz) |
| Libraries | `number-flow` 0.6.2 (MIT, Rolling). Flip uses its own four-leaf split-flap on the Web Animations API instead of `@pqina/flip`: that library's core alone is about 16 KB gz, over half of the faces budget |
| Fonts | `public/fonts/nixie-one-latin-400-normal.woff2` (Nixie One, `OFL-NixieOne.txt`) · `public/fonts/dseg7-classic-italic.woff2` (DSEG7 Classic Italic, `OFL-DSEG.txt`), both SIL OFL 1.1, unmodified (the Reserved Font Names forbid a renamed subset), declared in `nixie.css` / `lcd.css` with `font-display: swap` and loaded only with their face; the face waits for its font (at most 1.5 s) before it mounts. Flip uses the existing Space Grotesk digits; LED is an SVG dot grid, no font |
| Markup hooks | `.at-face.at-face-x[data-face-host][role="timer"][data-l="timer"]` (the reserved face box the pack fills; the view writes its `aria-label`) · Settings `.at-face-pick` (radio tiles `.at-face-opt`) and `.at-field-astyle`. The More faces tab and its popovers (`#at-fm-e`, `#at-fm-l`, `.at-fm*`) were removed with the face gallery below |
| `<html>` attributes | `data-face` takes every id but `ring`; `data-still` on the face host while motion is reduced (system setting or `settings.reduceMotion === 'on'`) |
| Custom properties | `--at-fx-*` (face-local: `--at-fx-ink`, `--at-fx-glow` 0–1 by state, `--at-fx-shade`, per-face sizes), defined in the pack sheets only |
| Tool CSS | `:root[data-face] .at-face-ring { display: none }` replaces the three-face list |
| i18n keys | New in all 8 locales (English values until translated): `tool.face.flip` · `tool.face.rolling` · `tool.face.analog` · `tool.face.rings` · `tool.face.word` · `tool.face.nixie` · `tool.face.lcd` · `tool.face.matrix` · `settings.face.analogStyle` · `settings.face.analog.minimal` · `settings.face.analog.luxe` |

### Face gallery, swipe and the redesigned original faces

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §3.33 (Faces) and §5, `DESIGN.md` §7. The seven lock states, the pill copy, storage keys and routes do not change. Budgets (estimated from the changed modules, to be confirmed by `scripts/size.mjs`): critical tool JS about 60 B gz smaller (the view lost the tab and `data-face` code), total tool JS about 110 B gz larger (a few lines of glue in `actions.ts`, `shortcuts.ts` and `extras.ts`), inlined tool CSS about 1.8 KB gz smaller (the Bold, Horizon and Tide art left it); the gallery and the swipe are in the `faces` pack.

| Identifier | Decision |
|---|---|
| Face order and groups | `FACE_GROUPS` / `FACE_ORDER` in `src/tool/packs/faces/order.ts` (read at build time by `ToolPanel` and `ToolIsland`, mirrored in `boot.js`): Classic `ring` · `bold` · `horizon` · `tide`; Retro `flip` · `nixie` · `lcd` · `matrix`; Modern `rolling` · `analog` · `rings` · `word`. `stepFace(face, by)` wraps around; `ART_FACES` = `bold` · `horizon` · `tide` |
| Face switch | `components/FaceSwitch.astro`, rendered in `.at-tabs-early` and `.at-tabs-late` (`#at-tabs-late` kept): `.at-seg.at-fc[role="group"]` with `.at-fc-step[data-act="facePrev"]` · `.at-fc-open[data-act="faces"][aria-haspopup="dialog"]` (holding `[data-t="fn"][aria-live="polite"]`, the face name) · `.at-fc-step[data-act="faceNext"]`. The view writes `fn`; `boot.js` writes it before first paint from the island root's `data-fnames` (the twelve names in `FACE_ORDER`, `\|`-separated) |
| Actions | `faces` · `facePrev` · `faceNext` (`ui/actions.ts` imports the pack and calls `faceAct(ctx, name, el)`); `C` / `Shift+C` in `shortcuts.ts` run `faceNext` / `facePrev` |
| Gallery sheet | `<Sheet name="faces">` in `ToolPanel` (`[data-dialog="faces"]`, `#faces-title`, body `.at-fg`): `.at-fg-group` per group, `.at-fg-pick[data-pick][aria-pressed]` tiles holding `.at-fg-thumb[data-thumb]` > `.at-fg-stage` (the live miniature, `--u: calc(100cqi / 358)`), `.at-fg-name` and `.at-fg-on` ("In use"); the Analog tile adds `.at-fg-style` (`input[name="analogStyle"]`). `data-live` on a thumbnail while it is pointed at or focused; `data-g` replaces `data-t` in the cloned original faces |
| Pack modules | `index.ts` (`mountFaces(ctx): IFaces` with `frame`, `css`, `art`, `set`; `faceAct`; `armSwipe`) · `registry.ts` (`FACES`, the eight face loaders) · `order.ts` · `gallery.ts` (`openGallery`) with `gallery.css` · `swipe.ts` (`mountSwipe`) |
| `<html data-face>` | Written by the faces pack once the face is ready (module, sheet and font; for Bold, Horizon and Tide the art sheet), no longer by the view; `boot.js` still paints the saved one before first frame |
| `public/assets/faces.css` | The Bold, Horizon and Tide art (moved out of `tool-full.css`). URL `/assets/faces.css?v=<10 hex of its sha256>` from `facesHref()` in `scripts/boot-inline.mjs`, which also defines `__AT_FACES__` for Vite. On tool pages (it finds BaseLayout's `link[href="#at-tool-parsed"]`, now placed above the boot script) `boot.js` writes `<link data-at-faces>` when the saved face is one of the three, so the first paint waits for it; the pack links the same URL before it switches to one of them |
| Swipe | `.at-fsw` (Embla viewport over the dial, `aria-hidden`, `touch-action: pan-y pinch-zoom`) > `.at-fsw-strip` > three `.at-fsw-slide` (the neighbours in `.at-fsw-ghost`); the dial carries `--at-sw` (−1 to 1) and `--at-swa` (its size) while dragged, and `data-swap` (`""` hidden, `in` fading in) around a change. Chunk `pack-faces-swipe` (`swipe.ts` and the libraries), loaded by `armSwipe` |
| Libraries | `embla-carousel` 8.6.0 (MIT) and `embla-carousel-wheel-gestures` 8.1.0 (MIT, with `wheel-gestures` 2.3.0, MIT), `astro.config.mjs` `PACK_LIBS` row `faces-swipe` |
| Ring art | `.at-ticks` (60 minute ticks, r 130) and `.at-ticks-h` (12 hour ticks); `.at-sweep` is a one-minute sweep (annulus mask, bright leading edge) shown while starting, held, on the fallback and paused (paused holds it still); `.at-ring::before` (inner lamp glow) |
| Horizon art | `.at-hz-path` (the sun's arc to the horizon, `pathLength="100"`) and `.at-hz-end` (where it sets) in `.at-hz-stars`; `.at-hz-far` / `.at-hz-near` hills; `--hz-hill-2` and `--hz-arc` per phase |
| Tide art | `--tide-deep` (the lamp mixed 26 % with black); keyframes `at-bob` |
| i18n keys | New in all 8 locales (English values until translated): `tool.face.prev` · `tool.face.next` · `tool.gallery.title` · `tool.gallery.lead` · `tool.gallery.classic` · `tool.gallery.retro` · `tool.gallery.modern` · `tool.gallery.current` · `tool.shortcuts.face`. Removed: `tool.face.more` · `tool.face.moreLabel` · `tool.face.moreTitle` |
| Removed | The `.at-faces` tab rules, `--at-tl-tabs`, `--at-tl-tabs-late`, `--at-tl-fm`, the view's `[data-face]` click branch |

### 13.25 Colour themes, lamps, patterns, presets and Pro previews

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §1.1a–§1.1d; storage fields: `08-data-storage.md` §2.1. Budgets: no critical tool JS added and total tool JS about flat (the old lamp code left `settings.ts` and `accent.ts`); the pack has its own budget (`themes` ≤ 25 KB gz) and its own stylesheet; the inlined tool CSS is unchanged and the lazy `tool-more.css` lost the old lamp swatch rules.

| Identifier | Decision |
|---|---|
| `TPalette` ids | `clear-night` (default) · `paper` · `nord` · `solarized` · `midnight` · `forest` · `sunset` · `mono` · `contrast`; free `clear-night`, `paper`, `nord` (`PALETTES` in `looks.ts`) |
| `TPattern` ids | `none` (default) · `grain` · `dots` · `grid` · `topo` · `waves` · `aurora` · `stars` · `drift`; free `none`, `grain`, `dots`, `grid` (`PATTERNS`) |
| Preset ids | `classic` · `library` · `fjord` (free) · `night-desk` · `kitchen` · `focus` · `campfire` · `northern-lights` (`PRESETS`: `[id, palette, lamp, pattern]`; free when all three parts are) |
| `<html data-palette>` / `data-pattern` | Set by `boot.js` from `at.v1.settings` before first paint (absent for `clear-night` / `none`); re-map the `--at-*` tokens and draw the background layer |
| `<html data-preview>` | The kind of the running Pro preview (`palette`, `accent`, `pattern`, `preset`, `mode`, …) |
| `public/assets/themes.css` | The theme layer: palette, lamp (eight lamps plus `custom`) and pattern rules; URL `/assets/themes.css?v=<10 hex of its sha256>` from `themesHref()` in `scripts/boot-inline.mjs`, which also defines `__AT_THEMES__` for Vite; the boot script's `<link data-at-themes>` |
| `public/assets/patterns/` | `dots.svg`, `grid.svg`, `waves.svg` (Hero Patterns, CC BY 4.0) and `topo.svg` (own contour SVG); referenced with `?v=1` |
| Pattern tokens | `--at-pat` (mask image) · `--at-pat-size` · `--at-pat-a` (0.07; 1 for gradient patterns) · `--at-pat-k` (1; 0.6 on OLED) · `--at-pat-bg` · `--at-pat-bg-size` · `--at-pat-anim`; keyframes `at-pat-drift`, `at-pat-rise`, `at-pat-aurora`, `at-pat-twinkle` |
| `--at-custom` | The custom lamp's light hex; dark value `color-mix(in srgb, var(--at-custom) 40%, #fff)` |
| Themes pack modules | `src/tool/packs/themes/`: `looks.ts` (catalogue, `lampOf`, `lookOf`, `ownedLook`, `paintLook`, `themesCss`, `uiCss`) · `fit.ts` (`fitLamp`, `lampOk`, `darkOf`, `WORST_LIGHT` `#F1F3F7`, `WORST_DARK` `#2E3440`, `ON_DARK` `#04232A`) · `preview.ts` · `appearance.ts` (`mountAppearance(ctx, host)` on `[data-appearance]`) · `picker.ts` (`vanilla-colorful`) · `themes-ui.css` |
| `startPreview(ctx, { kind, id, label, apply, revert, back?, said? })` | The shared Pro preview (`preview.ts`): `PREVIEW_MS` 300,000 · `PREVIEW_WARN_MS` 60,000; also `endPreview(revert?, reason?)`, `activePreview()`, `onPreview(fn)`, `previewLine()`. Toast id `preview` |
| `IToastItem.alt` | A second toast action (the one-minute preview toast: Get Pro · End now) |
| `.at-pv` | The preview chip (first child of `[data-toasts]`; `data-min` folds it to the dot; `data-float` when a page has no toast region) |
| i18n keys | `settings.looks.*` (section labels, Pro note) · `settings.palette.<id>` · `settings.accent.<id>` (new lamps and `custom`) · `settings.pattern.<id>` · `settings.preset.<id>` · `settings.preview.*` · `settings.custom.*`. Removed: `settings.lamp.note`, `ambient.message.preview`, `ambient.message.previewShort`, `ambient.message.ended` (the Message mode's shared link now runs the five-minute preview; `MESSAGE_PREVIEW_MS` is gone) |

### Sound pack

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §3.34. The pill, lock states, storage keys (the `settings` fields already existed, `08-data-storage.md` §2.1), routes and the tool's JS budgets do not change: the tool gains a few lines of glue and everything else loads as the `sound` pack.

| Identifier | Decision |
|---|---|
| End sound ids | `settings.sound.id`: `chime` (default, synthesised in `signal.ts`) · `bell` · `soft` · `digital` · `birds` (the pack, Tone.js) · `none`; all free |
| Focus sound ids | `settings.focusSound.kind`: `none` · `brown` · `pink` · `white` · `rain` · `cafe` · `fire` · `lofi` (generated, free) · `track:<id>` (a `TRACKS` entry, Pro `sounds.custom`) |
| Mixer | `settings.focusSound.mix`: level 0–1 per generated sound, Pro `sounds.custom`; non-empty means the mix plays instead of `kind`; a tile pick clears it |
| Keyboard | `S` opens the Sounds sheet (`tool.shortcuts.sound`) |
| Modules | `src/tool/packs/sound/index.ts` (`run(ctx, 'open' \| 'play' \| 'end' \| 'mount', el?)`, imported only through `sound()` in `ui/settings.ts`) · `catalog.ts` (`GENS`, `isGen`, `isChime`, `readFocus`) · `engine.ts` (Tone.js: `init`, `resume`, `levels`, `fadeOut`, `volume`, `chime`, `tick`) · `player.ts` (howler.js: `playTrack`, `pauseTrack`, `trackVolume`) · `tracks.ts` (`ITrack`, `TRACKS`, empty) · `sound.css` (loaded with `?url` by the pack) |
| Chunks | `pack-sound` · `pack-sound-tone` · `pack-sound-howler` (`astro.config.mjs` `manualChunks` and `PACK_LIBS`), counted together toward the `sound` budget (110 KB gz) |
| Libraries | `tone` 15.1.22 (MIT) with its `standardized-audio-context` (MIT), `automation-events` (MIT), `tslib` (0BSD) and `@babel/runtime` (MIT) · `howler` 2.2.4 (MIT) · `@types/howler` (dev, MIT) |
| Tool glue | `ui/settings.ts` `sound()` and the Settings end-sound fields · `ui/actions.ts` action `sound` · `shortcuts.ts` `S` · `end.ts` (pack end sounds, vibration) · `extras.ts` (loads the pack after load + idle when `tick` is on) |
| Markup hooks | Header `.at-snd-btn[data-act="sound"]` · Sheet `[data-dialog="sound"]` with `.at-snd[data-state][data-pro]` (`idle` · `loading` · `playing` · `paused` · `tap` · `error`), `[data-snd="toggle" \| "prev" \| "next" \| "settings"]`, `[data-snd-kind]`, `[data-snd-track]`, `input[data-snd-vol]`, `[data-snd-vol-out]`, `input[data-snd-stop]`, `input[data-snd-mix]`, `.at-snd-lock`, `[data-snd-lib-lock]` · Settings `[data-sound="play" \| "open"]`, `[data-vibrate-row]`, fields `sound`, `soundVolume`, `vibrate`, `tick` · island attributes `data-snd` (the state) and `data-snd-still` (motion off in Settings) |
| Custom properties | `--at-snd-*` (equaliser height, duration, low point, bar colour), in `sound.css` only |
| Toast id | `sound` ("Tap to start sound") |
| i18n keys | New in all 8 locales (English values until translated): `tool.header.sound` · `tool.shortcuts.sound` · `tool.sound.*` (title, honest, pick, state.*, play, pause, tap, tapNote, prev, next, volume, focus, kind.*, sub.*, stopAtEnd, stopAtEnd.help, mix, mix.help, mix.locked, mixTitle, library, library.*, lofi.*, endSettings) · `settings.sound.bell` · `.soft` · `.digital` · `.birds` · `.play` · `.volume` · `.focus` · `settings.vibrate` (+ `.help`) · `settings.tick` (+ `.help`) |

### 13.26 Notes pack: notepad, checklists and voice dictation

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §3.34; storage: `08-data-storage.md` §2.1a. The seven lock states, the pill copy, routes and the tool's JS budgets do not change: the tool gains a few lines of glue (one selector in `main.ts`, `notes()` in `ui/actions.ts`, the `N` key in `shortcuts.ts`) and everything else is the `notes` pack.

| Identifier | Decision |
|---|---|
| Storage | `at.v1.notes` in IndexedDB (`idb-keyval` `createStore('awaketab', 'notes')`), one record. Free: one editable note (the first one written); `ambient.packs` (or a running five-minute preview): any number, with titles, search and pins. A note added in a preview stays, readable, copyable and exportable, and is read only once the preview ends; nothing is deleted silently |
| Modules | `src/tool/packs/notes/index.ts` (`openNotes(ctx, opener?)`, imported by `ui/actions.ts` `notes()` with `import()`) · `editor.ts` (Tiptap: `makeEditor`, `runTool`, `toolOn`, `insertSpoken`, `newLine`, `newItem`; `TTool` `h` · `b` · `i` · `ul` · `ol` · `task`) · `data.ts` (`parseNotes`, `loadNotes`, `saveNotes`, `newNote`, `canEdit`, `noteName`, `listNotes`) · `text.ts` (`toMarkdown`, `toText`, `plainText`, `countWords`) · `voice.ts` (`voiceSupported`, `speechLang`, `createVoice`) · `notes.css` (linked with `?url` before the drawer mounts) |
| Chunk | `pack-notes` (`astro.config.mjs` `PACK_LIBS`: `@tiptap/*`, `prosemirror-*`, `orderedmap`, `rope-sequence`, `w3c-keyname`, `idb-keyval`, `annyang`). About 110 KB gz measured with esbuild; budget 120 KB |
| Libraries | Tiptap 3.31.3 (MIT): `@tiptap/core`, `@tiptap/pm` and StarterKit's own extensions taken one by one (`extension-document`, `-paragraph`, `-text`, `-bold`, `-italic`, `-strike`, `-heading`, `-blockquote`, `-hard-break`, `extension-list` bullet, ordered, item, keymap, task list and task item, `extensions` placeholder and undo-redo), so StarterKit's link (with linkifyjs), code, code block, rule, drop and gap cursor code never ships · `idb-keyval` 6.3.0 (Apache-2.0) · `annyang` 3.0.0 (MIT) |
| Markup hooks | `dialog[data-dialog="notes"].at-notes` (a `Sheet`, only on the full tool, not the embedded card) · `[data-open-notes]` (the dock's Notes button in `.at-dock-tools`, shown from 1024 px, and Settings → Notes) · `[data-notes-*]` inside the drawer: `pad`, `editor`, `title`, `mic`, `listen`, `interim`, `consent`, `ro`, `pv`, `pro`, `all`, `list`, `items`, `search`, `words`, `state`, `said`, `acts`, `confirm`, `clear`, `undo`, `copy`, `export="md"`/`"txt"`, `live` · toolbar `.at-notes-tools[role="toolbar"]` with `button[data-cmd]` |
| Permissions-Policy | `microphone=(self)` (was `microphone=()`), so the page's own dictation can ask for the microphone; camera, geolocation and payment stay off |
| Shortcut | `N` opens the drawer (not while typing or while another dialog is open). In the editor: `Mod+B`, `Mod+I`, `Mod+Shift+S`, `Mod+Alt+1–3`, `Mod+Shift+7/8/9`, `Mod+Z`; Esc stops dictation, then closes |
| i18n keys | Page-rendered `notes.*` (drawer copy, toolbar labels, help, the voice notice) · island `tool.notes.*` (runtime states, voice commands `tool.notes.voice.cmdLine` / `cmdItem` / `cmdStop`) · `tool.notes.open` · `tool.tools` · `tool.shortcuts.notes` · `settings.notes`, `settings.notes.label`, `settings.notes.help`, `settings.notes.open` |

### 13.27 Focus tools (extras pack): Pomodoro auto-cycle, intention, breathing, second time zone

Accepted on 2026-09-28. Spec: `05-frontend-spec.md` §3.14, §3.35; storage: `08-data-storage.md` §2.1, §2.2. The seven lock states, the pill copy, routes and budgets do not change. Focus mode moved out of the ambient chunk into the pack, which should more than pay for the new glue in total JS; critical JS is unchanged.

| Identifier | Decision |
|---|---|
| Ambient mode `breathe` | Free; `AMBIENT_ORDER` and the mode bar: `clock` · `focus` · `breathe` · `minimal` · `night` · `message` · `cook` |
| Settings | `intention` (≤ 80 characters, one plain line) · `worldClock` (IANA zone or `null`) · `pomodoro.autoCycle` (`ambient.packs`) · `pomodoro.longBreakMin` (5–45, default 15; free) · `breathe` (`'478'` \| `'box'`, optional, reads as `'478'`) · `ambient.focus` ranges work 5–90, break 1–30, cycles 1–8 (`FOCUS_LIMITS`) |
| Session `modeState` (focus) | `focusBlock` (a single block; its completion counts) · `focusAuto` · `focusCfg` (`{ workMin, breakMin, cycles, longMin }`, frozen at start) · `focusSkip` · `focusPauseAt` (0 when running) · `focusPaused` · `focusAdded` (ms added to a single block's end while paused) · `focusRounds` (auto-cycle blocks already counted) |
| Plans | A single block: `duration` of `focusPlanMs()`, `presetId: 'custom'`. Auto-cycle: `indefinite`, `presetId: 'pinf'`; each finished block adds one to `at.v1.stats.dayFocus` |
| Preview | `startPreview` kind `pomodoro`, id `auto`, label `settings.focus.autoName`; the running preview lives only in the pack (`setAutoPreview`) |
| Keyboard | `T` Focus on or off · `B` Breathe on or off · `I` edit the intention (`tool.shortcuts.focus`, `.breathe`, `.intention`) |
| Modules | `src/tool/packs/extras/`: `index.ts` (`focus`, `breathe`, `panel`, `lines`, `intention`, `key`) · `focus.ts` (`mountFocus`) · `pomodoro.ts` (`focusConfig`, `focusPhase`, `focusPlanMs`, `focusElapsed`, `readClock`, `frozenConfig`, `FOCUS_LIMITS`) · `breathe.ts` (`mountBreathe`, `breathPhase`, `breathOf`) · `lines.ts` (`mountLines`) · `panel.ts` (`mountPanel`) · `zones.ts` (`allZones`, `searchZones`, `zoneOffset`, `diffMin`, `zoneTime`, `zoneName`) · `common.ts` · `extras.css` (linked with `?url`) |
| Tool glue | `ambient/shell.ts` (`KIT` and the `pack()` mode loader) · `ui/settings.ts` (`[data-focus-tools]`) · `ui/actions.ts` (action `intention`) · `shortcuts.ts` (`B` `I` `T`) · `extras.ts` (lines after load + idle when set). `ambient/focus.ts` and the focus maths in `ambient/logic.ts` are gone (`FOCUS_LONG_BREAK_MIN` is now the default of `pomodoro.longBreakMin`) |
| Libraries | None. `Intl` gives the zone list, offsets and generic names, the session engine's timestamps already give drift-free phases, and `shortcuts.ts` already maps single keys, so `dayjs`, `easytimer.js` and `hotkeys-js` would only add bytes |
| Markup hooks | Dock `[data-act="intention"]` · Settings `section[data-focus-tools]` · `.at-lines[data-lines]` (`.is-float` from 1024 px) with `[data-intent-edit]`, `[data-intent-form]`, `[data-intent-clear]`, `[data-world]` · Focus `[data-focus-pause]`, `[data-focus-intention]`, stage `data-paused` · Breathe `.at-br[data-breathe][data-step][data-still]`, `[data-breath]` |
| i18n keys | `ambient.mode.breathe` · `ambient.breathe.*` · `ambient.focus.` `blockAuto`, `introAuto`, `on`, `paused`, `pausedNote`, `pause`, `resume`, `pausedSaid`, `resumedSaid`, `cycleRound`, `nextRound`, `skipRound` · `tool.intention.*` · `tool.world.*` · `tool.shortcuts.focus`, `.breathe`, `.intention` · `settings.focus` and `settings.focus.*` |

### 13.28 The version on show, update prompts and the release surfaces

Accepted on 2026-09-28. Specs: `05-frontend-spec.md` §3.31 and §4.2 (home), §3.34 (mixer preview) and §8 (update flow). The seven lock states, the pill copy, storage keys, routes and budgets do not change: the version is static HTML, the tool's update prompt stays in `pwa.ts` (a few bytes in the lazy `extras` chunk), the banner script runs only on pages with the site header, and every new stylesheet is a page sheet linked where it is used.

| Identifier | Decision |
|---|---|
| `__AT_VERSION__` | `define` in `astro.config.mjs` from `versionDefines()` in `scripts/build-version.mjs`: `{ date, commit }`, the build date as `YYYY.MM.DD` (UTC) and the first 7 characters of `CF_PAGES_COMMIT_SHA` (the same variable `/api/health` reports), else `git rev-parse HEAD`, else `dev`. Read only through `VERSION` in `src/lib/version.ts` ("2026.09.28 · 1a2b3c4") |
| Version on show | `footer.version` ("Version {version}") in `SiteFooter.astro` under the licence line and at the bottom of the Settings sheet (`p[data-version]`), with `footer.whatsNew` ("What's new") to `/changelog` in the Settings links. Build-time text, no request |
| Tool update toast | `pwa.ts` `watchUpdates`, toast id `sw`: `tool.toast.update.ready` sticky with `tool.toast.update.action` (Reload) when no session is `active`/`paused`; during one, `tool.toast.update.later` once, not sticky, no button, then the Reload toast when it ends. `tool.toast.update` is renamed `tool.toast.update.later` (same meaning, translations kept) |
| Site update banner | `components/shell/UpdateBanner.astro` (only where `BaseLayout` renders the header): `template#at-update` (`.at-upd`, `[data-update-reload]`, `[data-update-close]`, strings `update.banner`, `update.close`) and `lib/update-banner.ts` `watchSiteUpdates()`; skipped on a page with `.at-island`. Sheet `styles/update-banner.css`, linked only when the banner shows |
| Mixer preview | `[data-snd="try"]` in the Sounds sheet's Pro card, `[data-snd-see]` (hidden while a session runs), `[data-snd-pv]` countdown line, `.at-snd[data-pv]`; `startPreview` kind `sound`, id `mixer`, labels `tool.sound.mix.proName`, `tool.sound.mix.proBack`; button `tool.sound.mix.try` |
| Home "Make it yours" | `components/home/HomeYours.astro`, `#home-yours`, classes `.at-hy-*`, sheet `styles/home-yours.css`; strings `page.home.yours.*`. Choose your level adds `page.home.levels.web.g5`, `.pro.g5`, `.pro.g6` |
| /pro | Comparison groups `web` · `looks` · `focus` · `ext` · `ads` (`page.pro.cmp.g.looks`, `.g.focus`, rows `page.pro.cmp.r.` `themes`, `patterns`, `presets`, `preview`, `sounds`, `mixer`, `library`, `notes`, `tools`, `pomo`); "What Pro adds" items `looks` · `sound` · `notes` · `pomo` · `msg` · `stats` · `pip` · `sched` · `ads` (`page.pro.get.lamps.*` removed); `/pro/activate` adds `page.pro.activate.ok.u7` |
| /extension | FAQ adds `page.extension.faq.q5` / `a5`: the faces, sounds, notes and focus tools are in the web app, not the extension |
| Changelog release | `changelog/2026-09-release-1.1.md` (`release: '1.1'`), pinned as the release card above the dated entries |

### 13.29 One article pattern and content icons

Accepted on 2026-09-29. Spec: `06-content-seo-spec.md` §24. Routes, slugs, storage keys, lock states and pill copy, budgets and the ad rules do not change.

| Identifier | Decision |
|---|---|
| i18n keys | New in all 8 locales: `content.family.for` · `content.family.on` · `content.family.vs` · `content.family.guides` · `content.family.learn` · `content.readTime` (`{n}`) · `content.updated` (`{date}`). Removed: `content.backToTool` (the tool now follows the body; the mirror card reads `content.jumpTool`) |
| Classes | `.at-family` (kicker row, with logos on device pages) · `.at-meta-read` · `.at-toc-m` (phone "On this page") · `.at-note-tip` (replaces `.at-note-lamp`) · `.at-logo-in` (a logo before a row or cell name) · `.at-brand-cell` (first table column with a logo) · `.at-gal-logos` (the logo pair on `/on` cards, replacing the device silhouette there). Removed: `.at-related-links` · `.at-start-pill` · `data-tool-at` · `data-variant` |
| Modules | `src/lib/brands.ts` (`browserMark()`, `deviceLogos()`, `brandsIn()`, `rowBrands()`: which SVG Logos mark a browser or system name gets; Apple systems use the Apple mark, Samsung Internet the Phosphor `browser` icon) · `src/lib/logo-svg.ts` (`brandCells()`: logos in the first column of Markdown tables, build time) · `components/icons/Brand.astro` (a `BrandIcon`, or the Phosphor `browser` icon when a brand has no logo) |
| Tests | `test/lib/article-template.test.ts` · `test/seo/article-template.test.ts` |

## 14. Writing conventions for these docs

- Requirements are testable sentences with "must/should/may"; every FR has at least one acceptance criterion in Given/When/Then form.
- Refer to states, keys and routes in backticks exactly as written here.
- Dates absolute (ISO) when they are facts; relative ("week 3") when they are plans.
- Numbers from the blueprint's model are estimates; say so where they appear.
- Each doc starts with: title, status line (version · date · owner), one-paragraph purpose, and "Related docs".
