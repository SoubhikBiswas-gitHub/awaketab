# 11 · Embed widget specification — AwakeTab Embed (Cook Mode)

Status: v1.1 · 2026-09-26 (as built in M8, §11) · Owner: Soubhik

**Purpose.** Recipe blogs, dashboards and documentation sites can drop one script tag on a page and give their readers a "keep my screen on" control. The widget is a sandboxed iframe of our own app, so it inherits the engine, the honest status and the locales. Free embeds carry an attribution link (a contextual backlink from the pages that rank for the use case); a Business licence removes it and unlocks branding.

Related docs: `00-conventions.md` §7, §8, §9 · `04-engine-spec.md` (engine reused) · `05-frontend-spec.md` §3.16 (Cook Mode) · `09-monetization-impl.md` §7 (Embed licence) · `14-devops.md` (headers for `/embed/*`).

**Redesign changes (Clear Night, decided 2026-09-27, applied in the build phase).** The sections below describe what is built today. The redesign changes two things, and the build must update this spec, the loader, the widget and their tests together:

- **O-58: compact size is 320 × 104** (was 320 × 96). At 96 px the Start button and pill cannot both keep 44 px targets with 16 px padding. Every `96` below (§1, §2, §11.1 iframe style, §11.2 reserved box) becomes `104`.
- **O-47: the credit sits outside the widget.** The loader inserts a visible link "Keep awake by AwakeTab" (`rel="nofollow"`, same URL and `ref`/`source` params as today) into the host page's own HTML, directly below the iframe. The attribution line inside the iframe is removed. A licensed domain (`{ licensed: true, attribution: false }`) gets no link: the loader asks the same config endpoint. If the lookup fails, the link stays, which matches today's "free by default" rule (§11.3). With the iframe-only install (§11.1), the snippet includes the link as plain HTML after the `<iframe>`.

Design boards: `EmbedWidget`, `EmbedCook*`, `EmbedCompactLight`, `EmbedEdge*` and `EmbedShowcase*` on the redesign canvas (`design/canvas/project/`).

---

## 1. Integration

```html
<script async src="https://awaketab.com/embed.js"
        data-mode="cook"            <!-- cook | standard | clock | minimal -->
        data-theme="auto"           <!-- auto | light | dark | oled -->
        data-lang="en"              <!-- one of the 8 locales; defaults to the page's <html lang> -->
        data-size="compact"         <!-- compact (320×96) | full (100% × 240) -->
        data-preset="pinf"          <!-- p15 … pinf | until -->
        data-license="AT-EMBED-…">  <!-- optional Business licence key (domain-bound) -->
</script>
```

The loader (≤ 3 KB gz, no dependencies) replaces itself with:

```html
<iframe src="https://awaketab.com/embed/cook?theme=auto&lang=en&size=compact&preset=pinf&host=example.com"
        title="Keep screen awake"
        allow="screen-wake-lock"
        loading="lazy"
        referrerpolicy="strict-origin"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style="width:320px;height:96px;border:0;border-radius:12px;color-scheme:light dark"></iframe>
```

Why the `allow` attribute matters: the Screen Wake Lock API is governed by Permissions-Policy with a default allowlist of `self`. A cross-origin iframe may use it only when the embedding document delegates the feature via `allow="screen-wake-lock"`. Our loader always sets it; if a site copies only the iframe and drops the attribute, the widget detects `NotAllowedError` with `advice: 'iframe_no_allow'` and renders the "Ask the site owner" state with a link to the fix.

`host` is the embedding page's hostname (from `location.hostname`), used for the licence lookup and analytics; the full URL is never sent.

---

## 2. Widget UI (`/embed/cook`)

A trimmed build of the tool island (≤ 25 KB gz): `StatusPill`, big elapsed/remaining timer, start/stop, in `cook` mode a tap-anywhere pause and up to three kitchen timers, and the attribution line "Keep awake by AwakeTab" linking to `https://awaketab.com/?ref=embed&source=embed` (plain link, no `nofollow`, `utm_source=embed`). Ambient modes beyond `cook`, `standard`, `clock`, `minimal` are not available in embeds. Themes follow `data-theme`; `auto` uses `prefers-color-scheme` inside the iframe.

Sizes: `compact` 320×96 (mobile-first; scales to the container width with `max-width:100%`), `full` 100%×240 (shows kitchen timers inline). The iframe never grows on its own; the widget posts its preferred height (§3) and the loader applies it.

Free vs licensed rendering is decided by `GET /api/embed/config?domain=<host>` (cached 5 min at the edge): `{ licensed: true, attribution: false, theme: { accent, scheme }, expiresAt }` removes the attribution and applies brand colours; anything else renders the free variant. The request is made from the iframe (same origin as the API), so the widget works even when the embedding page blocks third-party requests.

---

## 3. postMessage API

Origin-checked both ways (the widget only accepts messages from `window.parent` whose origin matches `host`; the loader only accepts messages from `https://awaketab.com`).

| Direction | Message | Payload |
|---|---|---|
| widget → page | `awaketab:ready` | `{ version }` |
| widget → page | `awaketab:state` | `{ lock: LockState, status: SessionStatus, endsAt, mode }` on every change |
| widget → page | `awaketab:resize` | `{ height }` |
| page → widget | `awaketab:start` | `{ preset?: PresetId, ms?: number, until?: 'HH:MM' }` — requires a user gesture in the page; the widget forwards it as a programmatic start, which the native API allows (no gesture needed) but the video fallback does not (then the widget shows "Tap to start") |
| page → widget | `awaketab:stop` | — |
| page → widget | `awaketab:theme` | `{ theme }` |

A tiny page-side helper is exposed as `window.AwakeTabEmbed` by the loader: `.on('state', cb)`, `.start(opts)`, `.stop()`, `.setTheme(t)`.

---

## 4. Licence and domain binding

- Licence plan `biz_embed_site_yearly` ($29/year per site). Activation via `POST /api/license/activate` with `embed: { domain }` binds the key to one registered domain plus its `www.` and one `staging.`/`dev.` subdomain. KV `embed:{domain}` is created; the widget looks it up by `host`.
- Attribution removal is the only behavioural difference; the wake lock and all modes are identical for free embeds — we never degrade the reader's experience to sell a licence.
- Expiry: `expiresAt` + 30-day grace → the attribution line returns silently; the site owner receives Polar's renewal emails.

---

## 5. WordPress plugin (phase 3 deliverable)

`awaketab-cook-mode` on wordpress.org: shortcode `[awaketab mode="cook" size="compact"]`, a Gutenberg block "AwakeTab — Keep screen on", a settings page for the licence key and default theme, and automatic injection below the recipe card for WP Recipe Maker / Tasty Recipes when their Cook Mode is disabled. The plugin only outputs the loader tag; no PHP calls to our API.

---

## 6. Performance

Loader ≤ 3 KB gz, `async`, no blocking; iframe `loading="lazy"` so below-the-fold embeds cost nothing until scrolled; widget bundle ≤ 25 KB gz, no fonts, no third-party requests, no ads ever (`00-conventions.md` §8.3). The iframe reserves its box before load (fixed height per size) so it adds no CLS to the host page.

---

## 7. Security

- `/embed/*` responses: `Content-Security-Policy: frame-ancestors *` (embeddable anywhere), `X-Frame-Options` omitted; everywhere else `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- `sandbox="allow-scripts allow-same-origin allow-popups"` — same-origin is needed for localStorage of the widget's own settings; popups for the attribution link and Pro page.
- All query params validated (`theme`, `lang`, `size`, `preset`, `mode` from allow-lists; `host` matched against a hostname regex); the widget never renders host-supplied text.
- No cookies; the widget's settings live in its own origin's localStorage (`at.v1.embed.*` — PROPOSED prefix for embed-scoped settings so they never collide with the main app's) — accepted: use `at.v1.embed.settings`.

---

## 8. Analytics

Events from the widget carry `source: 'embed'` and `blob1 = '/embed/cook'`; `host` is stored as the `path`'s companion in `blob6` (hostname only). Used for: embeds by domain, sessions per embed, attribution clicks (`share_click` with `blob7 = 'attribution'`).

---

## 9. Testing matrix

| Host | Check |
|---|---|
| Plain HTML page over HTTPS | loader → iframe → `held` within 300 ms of tap |
| WordPress (Twenty Twenty-Four, WPRM installed) | shortcode renders; Cook Mode coexistence rule |
| Squarespace / Webflow / Ghost | code-injection blocks accept the tag; CSS containment |
| HTTP page | widget shows `insecure_context` advice (wake lock needs a secure top-level context too) |
| Iframe without `allow` | `iframe_no_allow` state with fix text |
| AMP | unsupported (`amp-iframe` sandbox restrictions) — documented |
| Mobile Safari 17 | native lock in iframe works with `allow`; Low Power Mode caveat shown |

---

## 10. Sales page `/embed`

Live demo of both sizes, the one-line install, the "why the allow attribute" explainer, the licence pitch (remove attribution, brand colours, priority support — $29/year per site), FAQ (does it slow my page? no third-party requests; does it work on AMP? no), and the WordPress plugin link when live.

---

## 11. As built (M8, 2026-09-26)

Identifiers are canonical in `00-conventions.md` §13.10. Source: `apps/web/src/tool/embed/` (`protocol.ts` shared contract, `loader.ts` + `loader-entry.ts`, `app.ts`, `bridge.ts`, `policy.ts`, `config.ts`, `settings.ts`, `timers.ts`, `catalog.ts`, `snippet.ts`), `apps/web/src/pages/embed/cook.astro`, `apps/web/src/pages/embed.astro`, `apps/web/scripts/embed-loader.mjs`, `apps/web/functions/api/embed/config.ts`.

### 11.1 The snippet, exactly as users paste it

The §1 block shows every attribute with inline comments (not valid inside a tag). What `/embed` renders and what sites paste:

```html
<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>
```

Optional attributes: `data-lang="de"` (default: the host page's `<html lang>`, mapped to one of the 8 locales; `pt-BR` → `pt-br`, `zh-CN`/`zh-Hans` → `zh`, anything unknown → `en`), `data-preset="p60"` (default `pinf`), `data-preset="until" data-until="18:30"`. Unknown values fall back to the defaults. `data-license` is **not** read: licensing is decided by the verified embedding domain (§11.4), and a licence key never travels in a URL.

For platforms that strip `<script>` (the `#allow` section of `/embed`):

```html
<iframe src="https://awaketab.com/embed/cook?mode=cook&theme=auto&lang=en&size=compact&preset=pinf"
  title="Keep screen awake"
  allow="screen-wake-lock"
  loading="lazy"
  referrerpolicy="strict-origin"
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  style="width:320px;max-width:100%;height:96px;border:0;border-radius:12px"></iframe>
```

### 11.2 Loader (`/embed.js`, 2,356 B gz)

- Built by esbuild from `loader.ts` into `apps/web/public/embed.js` (committed; a unit test fails when it is stale). No dependencies, no `import`, IIFE; the iframe `title` comes from the 8 `embed.frame.title` strings inlined at build.
- Replaces its own tag with the iframe (a tag in `<head>` is moved to `<body>`); the iframe origin is the loader's own origin, so preview deployments embed themselves. `host=` is `location.hostname`.
- `sandbox` adds `allow-popups-to-escape-sandbox` to §7's three tokens (docs/19 C4): without it the attribution and "How to fix" links open awaketab.com as a sandboxed tab where forms (checkout) are blocked.
- `awaketab:resize` is applied but never below the reserved box (96 / 240 px), so the widget can grow for a notice or timers without ever shifting the host page by shrinking.
- `window.AwakeTabEmbed` = `{ version, on('ready' | 'state', cb) → off, start(opts), stop(), setTheme(theme) }`; one registry for every tag on the page. Commands issued before a widget is ready are queued and flushed on `awaketab:ready`. `start()` should be called from a click in the page (the video fallback needs a gesture; without one the widget shows "Tap Start to keep the screen awake.").
- Origin checks: a message counts only when `event.source` is an iframe this loader created **and** `event.origin` is the loader's origin; every command is re-validated (`parsePageMessage`) and posted with that origin as `targetOrigin`.

### 11.3 Widget (`/embed/cook`, 13,843 B gz)

- Its script is `public/embed/app.js` in development and `/embed/assets/app.<hash>.js` in production (see §11.6), an esbuild bundle of `app.ts` (not an Astro `<script>`, so it shares no Rollup chunk with the tool island — `14-devops.md` §6). It runs the real `@awaketab/wake` lock and `@awaketab/core` session engine (in-memory storage, no `BroadcastChannel`), and projects the lock state onto the pill; the digits run only while the lock is `held`/`fallback` and the clock is not paused.
- Modes: `cook` (Start/Stop, tap the timer = `pause({ keepLock: true })`, "Tap the timer to pause" hint; in `full` size up to three kitchen timers — quick-add 5/10/15/30/60 min — persisted in `at.v1.embed.settings`, chime on finish via `signal.ts`), `standard` (remaining or elapsed), `clock` (wall clock), `minimal` (pill and Start only).
- `iframe_no_allow`: when `document.permissionsPolicy`/`featurePolicy` says the frame may not use `screen-wake-lock`, the notice "Ask the site owner to allow screen wake lock for this widget." + "How to fix" (`https://awaketab.com/embed#allow`) shows at load; a Start then yields the honest `denied` pill with the same notice. Where the policy is known to allow the lock, a denial shows the power advice instead (`embedAdvice`).
- Every visible string comes from the page's inlined catalog subset for the `lang=` locale; `<html lang>` and `document.title` follow it.
- The attribution line is server-rendered (free by default, so a failed lookup never hides it) and hidden only for `{ licensed: true, attribution: false }`.

### 11.4 Licence lookup

`GET /api/embed/config?domain=` is called with the **verified** parent hostname (`location.ancestorOrigins[0]`, else the referrer origin) — never the `host=` param, which the embedding page controls. No verified parent → no request, attribution shown. The function walks from the hostname up to its registrable domain (`www.`/`staging.` covered), ignores records whose `expiresAt` (grace included) has passed or whose `lic:{keyHash}` is not `active` (webhook revocation takes effect within the 5-minute cache), and returns `theme` only as a validated `{ accent: '#rrggbb' | null, scheme }`. The widget applies a licensed accent to the Start button with a computed black/white label (≥ 4.5:1) and to the pill border/focus ring; text keeps `--at-accent-text`.

### 11.5 postMessage as built

| Direction | Message | Payload / rule |
|---|---|---|
| widget → page | `awaketab:ready` | `{ version: '1' }` once booted |
| widget → page | `awaketab:state` | `{ lock, status, endsAt, mode }` whenever lock, status or `endsAt` changes (not every tick) |
| widget → page | `awaketab:resize` | `{ height }` from a `ResizeObserver` on the widget root; clamped 64–640 by the loader and never below the reserved box |
| page → widget | `awaketab:start` | `{ preset?: 'p15'…'pinf', ms?: integer 60,000–604,800,000, until?: 'HH:MM' \| 'HH-MM' }`; `ms` wins, then `until`, then `preset`, then the widget's `data-preset` |
| page → widget | `awaketab:stop` | — |
| page → widget | `awaketab:theme` | `{ theme: 'auto' \| 'light' \| 'dark' \| 'oled' }` |

The widget accepts a command only from `window.parent`, only when `event.origin` equals the verified parent origin, and — when the loader declared `host=` — only when that hostname matches it. It posts to that exact origin, never `*`; unembedded (opened directly) it posts nothing.

### 11.6 Headers, analytics, tests

- `_headers`: `/embed/*` keeps `frame-ancestors *`, no `X-Frame-Options`, `X-Robots-Tag: noindex`; because `/embed/*` also matches the landing page, `/embed` and `/embed/` re-apply the default CSP (`frame-ancestors 'none'`), `X-Frame-Options: DENY` and drop `noindex`. `/embed.js` is `Cache-Control: public, max-age=3600`.
- Iframe app caching (2026-09-26): the app used to ship as `/embed/app.js` with the site-wide `max-age=0, must-revalidate`, so every widget load revalidated it. `node scripts/embed-loader.mjs --fingerprint` now runs right after `astro build`: it moves `dist/embed/app.js` to `/embed/assets/app.<first 10 hex of sha256>.js`, rewrites `embed/cook.html` (every built page that loaded `"/embed/app.js"`; the build fails if none did) and `_headers` serves `/embed/assets/*` as `public, max-age=31536000, immutable`. `/embed/cook` itself keeps `max-age=0, must-revalidate` (so a deploy switches the app URL at once) and `/embed.js` keeps its stable URL and one-hour cache, because host sites paste it. The service worker serves `/embed/assets/*` cache-first (`at-embed-assets`) and never precaches anything under `/embed`. `pnpm size` measures `embedJs` from the rewritten page and fails unless its single module entry is fingerprinted (`embedHashed`).
- Analytics: `source: 'embed'`, `path: '/embed/cook'`; the widget's `page_view` carries `host` (→ `blob6`), the attribution click is `share_click { target: 'attribution' }` (→ `blob7`). Telemetry follows `at.v1.settings.telemetry` when readable.
- Tests: `apps/web/test/tool/embed-*.test.ts`, `apps/web/scripts/embed-loader.test.ts` (freshness and the 3 KB gate), `apps/web/scripts/headers.test.ts`, `apps/web/functions/api/embed/config.test.ts`, e2e `apps/web/test/e2e/m8.spec.ts` (journey 10 cross-origin with and without `allow`, origin rejection both ways, licensed branding, kitchen timers, axe) — `13-testing-strategy.md` §5, §7.
- Not built yet: the WordPress plugin (§5) and the §9 manual host matrix (WordPress, Squarespace, Webflow, Ghost, AMP, Mobile Safari) — both need real accounts/devices.
