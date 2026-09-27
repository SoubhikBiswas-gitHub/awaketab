# 11 · Embed widget specification — AwakeTab Embed (Cook Mode)

Status: v1.2 · 2026-09-27 (as built in M8, redesigned in Clear Night milestone B8, §11) · Owner: Soubhik

**Purpose.** Recipe blogs, dashboards and documentation sites can drop one script tag on a page and give their readers a "keep my screen on" control. The widget is a sandboxed iframe of our own app, so it inherits the engine, the honest status and the locales. Free embeds carry a credit link in the host page (a contextual link from the pages that rank for the use case); a Business licence removes it and unlocks branding.

Related docs: `00-conventions.md` §7, §8, §9, §13.10 · `04-engine-spec.md` (engine reused) · `05-frontend-spec.md` §3.16 (Cook Mode) · `09-monetization-impl.md` §7 (Embed licence) · `14-devops.md` (headers for `/embed/*`) · `DESIGN.md` §11 (sizes, pill XS/S, Stop D-R20).

**Clear Night (B8, 2026-09-27).** Two redesign decisions are built and folded into the sections below: **O-58**, the compact size is 320 × 104 (at 96 px the Start button and the pill could not both keep 44 px targets with 16 px padding), and **O-47**, the credit sits outside the widget, as a `nofollow` link in the host page's own HTML that the loader inserts after the iframe (§1, §11.2). Design boards: `EmbedWidget`, `EmbedCook*`, `EmbedCompactLight`, `EmbedFullDark`, `EmbedEdge*` and `EmbedShowcase*` (`design/canvas/project/`).

---

## 1. Integration

```html
<script async src="https://awaketab.com/embed.js"
        data-mode="cook"            <!-- cook | standard | clock | minimal -->
        data-theme="auto"           <!-- auto | light | dark | oled -->
        data-lang="en"              <!-- one of the 8 locales; defaults to the page's <html lang> -->
        data-size="compact"         <!-- compact (320×104) | full (100% × 240) -->
        data-preset="pinf"          <!-- p15 … pinf | until -->
        data-license="AT-EMBED-…">  <!-- optional Business licence key (domain-bound) -->
</script>
```

The loader (≤ 3 KB gz, no dependencies) replaces itself with the iframe and, directly after it in the host page's own HTML, the credit line (O-47):

```html
<iframe src="https://awaketab.com/embed/cook?mode=cook&theme=auto&lang=en&size=compact&preset=pinf&host=example.com"
        title="Keep screen awake"
        allow="screen-wake-lock"
        loading="lazy"
        referrerpolicy="strict-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        style="width:320px;max-width:100%;height:104px;border:0;border-radius:16px;color-scheme:light dark;display:block"></iframe>
<div class="awaketab-credit" style="margin:16px 0 0;height:24px;font-size:13px;line-height:24px;…"><a
  href="https://awaketab.com/?ref=embed&source=embed" rel="nofollow" style="color:inherit;font:inherit;…">Keep awake by AwakeTab</a></div>
```

The credit is a plain link in the page's own font and colour (13 px, underlined) on a reserved 24 px line, so it suits any site and never shifts the page. A licensed domain (`{ licensed: true, attribution: false }` from the config endpoint, §2) gets no credit: the loader removes the line when the lookup answers. If the lookup fails, the line stays (free by default).

Why the `allow` attribute matters: the Screen Wake Lock API is governed by Permissions-Policy with a default allowlist of `self`. A cross-origin iframe may use it only when the embedding document delegates the feature via `allow="screen-wake-lock"`. Our loader always sets it; if a site copies only the iframe and drops the attribute, the widget detects `NotAllowedError` with `advice: 'iframe_no_allow'` and renders the "Ask the site owner" state with a link to the fix.

`host` is the embedding page's hostname (from `location.hostname`), used for the licence lookup and analytics; the full URL is never sent.

---

## 2. Widget UI (`/embed/cook`)

A trimmed build of the tool island (≤ 25 KB gz): the status pill (seven states, exact copy, a glyph per state), big elapsed/remaining digits, Start/Stop (Retry after a denial), in `cook` mode a tap-the-timer pause and up to three kitchen timers. There is no credit inside the frame (O-47): the loader puts it in the host page (§1). Ambient modes beyond `cook`, `standard`, `clock`, `minimal` are not available in embeds. Themes follow `data-theme`; `auto` follows `prefers-color-scheme` inside the iframe, live.

Sizes: `compact` 320 × 104 (O-58; mobile-first, scales to the container with `max-width:100%`; pill XS 26, Start/Stop 96 × 44, radius 16, padding 16); a state that does not fit beside Start/Stop, or a frame under 300 px, puts the pill on its own row and the widget is 116 tall. `full` 100 % × 240 (pill S 32, logo and title, digits 28/48/64 by width, Start/Stop 120 × 60, 64 in cook mode, radius 28, padding 16 24; kitchen timers in a 264 px column), 420 tall for a cook widget under 600 px, which stacks the timers under the main control. The loader reserves these boxes when it can measure the container; the iframe never grows on its own, the widget posts its preferred height (§3) and the loader applies it.

Licensed rendering is decided by `GET /api/embed/config?domain=<host>` (cached 5 min at the edge): `{ licensed: true, attribution: false, theme: { accent, scheme }, expiresAt }` removes the credit line and applies the brand colour to the Start button; anything else renders the free variant. The iframe asks with its verified parent hostname (brand colour and scheme; it is same-origin with the API, so it works even when the embedding page blocks third-party requests), and the loader asks with the page's hostname (the credit line; the endpoint sends `access-control-allow-origin: *`).

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
- Credit removal (and the brand colour on Start) is the only difference; the wake lock and all modes are identical for free embeds — we never degrade the reader's experience to sell a licence.
- Expiry: `expiresAt` + 30-day grace → the credit line returns silently; the site owner receives Polar's renewal emails.

---

## 5. WordPress plugin (phase 3 deliverable)

`awaketab-cook-mode` on wordpress.org: shortcode `[awaketab mode="cook" size="compact"]`, a Gutenberg block "AwakeTab — Keep screen on", a settings page for the licence key and default theme, and automatic injection below the recipe card for WP Recipe Maker / Tasty Recipes when their Cook Mode is disabled. The plugin only outputs the loader tag; no PHP calls to our API.

---

## 6. Performance

Loader ≤ 3 KB gz, `async`, no blocking; iframe `loading="lazy"` so below-the-fold embeds cost nothing until scrolled; widget bundle ≤ 25 KB gz, no third-party requests, no ads ever (`00-conventions.md` §8.3). The only font is the site's own self-hosted Geist (same origin, preloaded, `font-display: swap` with a metric-matched fallback; DESIGN.md §3, D-R26). The iframe reserves its box before load (fixed height per size and container width) and the credit line its 24 px line, so neither adds CLS to the host page. The one exception: on a licensed domain the credit line is removed when the lookup answers (a single 40 px collapse, early, from an edge-cached response).

---

## 7. Security

- `/embed/*` responses: `Content-Security-Policy: frame-ancestors *` (embeddable anywhere), `X-Frame-Options` omitted; everywhere else `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- `sandbox="allow-scripts allow-same-origin allow-popups"` — same-origin is needed for localStorage of the widget's own settings; popups for the "How to fix" link. (The credit link is in the host page, outside the sandbox.)
- All query params validated (`theme`, `lang`, `size`, `preset`, `mode` from allow-lists; `host` matched against a hostname regex); the widget never renders host-supplied text.
- No cookies; the widget's settings live in its own origin's localStorage (`at.v1.embed.*` — PROPOSED prefix for embed-scoped settings so they never collide with the main app's) — accepted: use `at.v1.embed.settings`.

---

## 8. Analytics

Events from the widget carry `source: 'embed'` and `blob1 = '/embed/cook'`; `host` is stored as the `path`'s companion in `blob6` (hostname only). Used for: embeds by domain, sessions per embed. Credit clicks happen in the host page, where we run no analytics: they arrive on awaketab.com with `?ref=embed&source=embed`. (The in-frame `share_click { target: 'attribution' }` event is retired with O-47; its `blob7` value stays allow-listed for old widgets still cached.)

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

Live demo of both sizes, the one-line install, the "why the allow attribute" explainer, the licence pitch (remove the credit line, brand colour, priority support — $29/year per site), FAQ (does it slow my page? no third-party requests; does it work on AMP? no), and the WordPress plugin link when live.

**As rebuilt in Clear Night B6 (2026-09-27, board `EmbedShowcase`).** One live widget, on a placeholder recipe page: the real loader tag, which the snippet builder removes and re-adds (`src/lib/embed-page.ts`) whenever the mode, theme, size, language or start length changes, so the demo always matches the copied tag, and the loader's credit line appears under it as it would on a host site. "Install: one line" shows the tag with its attributes coloured (`[data-snippet]`, textContent = the exact tag) and a Copy button; the note says the loader adds the credit link itself (§1), so the snippet stays one line. The builder: Mode · Theme · Size as segmented bars of native radios, Language and start length as selects. The licence pitch now reads "Licences open soon" with no checkout link (decision O-29: Embed sales are held until a sandbox purchase ends with a licensed domain), and "Activate your domain" is gone until then. The FAQ and the AMP line are gone (decision O-41: the AMP claim is unverified); `#allow` (the widget's "How to fix" target, §4) and the JavaScript API stay below the board's sections. No ads.

---

## 11. As built (M8, 2026-09-26; Clear Night B8, 2026-09-27)

Identifiers are canonical in `00-conventions.md` §13.10. Source: `apps/web/src/tool/embed/` (`protocol.ts` shared contract, `loader.ts` + `loader-entry.ts`, `app.ts`, `clock.ts`, `bridge.ts`, `policy.ts`, `config.ts`, `settings.ts`, `timers.ts`, `catalog.ts`, `snippet.ts`), `apps/web/src/pages/embed/cook.astro`, `apps/web/src/styles/embed.css`, `apps/web/src/pages/embed.astro`, `apps/web/scripts/embed-loader.mjs`, `apps/web/functions/api/embed/config.ts`.

### 11.1 The snippet, exactly as users paste it

The §1 block shows every attribute with inline comments (not valid inside a tag). What `/embed` renders and what sites paste:

```html
<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>
```

Optional attributes: `data-lang="de"` (default: the host page's `<html lang>`, mapped to one of the 8 locales; `pt-BR` → `pt-br`, `zh-CN`/`zh-Hans` → `zh`, anything unknown → `en`), `data-preset="p60"` (default `pinf`), `data-preset="until" data-until="18:30"`. Unknown values fall back to the defaults. `data-license` is **not** read: licensing is decided by the verified embedding domain (§11.4), and a licence key never travels in a URL.

For platforms that strip `<script>` (the `#allow` section of `/embed`), `snippet.ts` `iframeSnippet()` gives the bare iframe followed by the credit line as plain HTML (`creditSnippet()`, the same markup the loader inserts; a site with an Embed licence may leave that last line out):

```html
<iframe src="https://awaketab.com/embed/cook?mode=cook&theme=auto&lang=en&size=compact&preset=pinf"
  title="Keep screen awake"
  allow="screen-wake-lock"
  loading="lazy"
  referrerpolicy="strict-origin"
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  style="width:320px;max-width:100%;height:104px;border:0;border-radius:16px;display:block"></iframe>
<div class="awaketab-credit" style="display:block;margin:16px 0 0;height:24px;font-size:13px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><a href="https://awaketab.com/?ref=embed&source=embed" rel="nofollow" style="color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px">Keep awake by AwakeTab</a></div>
```

`full` uses `width:100%;…;height:240px;…;border-radius:28px`.

### 11.2 Loader (`/embed.js`, 2,969 B gz; was 2,356 before the credit line)

- Built by esbuild (`target: es2020`) from `loader.ts` into `apps/web/public/embed.js` (committed; a unit test fails when it is stale). No dependencies, no `import`, IIFE; the iframe `title` and the credit text come from the 8 `embed.frame.title` and `embed.attribution` strings inlined at build (`__AT_FRAME_TITLES__`, `__AT_CREDITS__`).
- Replaces its own tag with the iframe (a tag in `<head>` is moved to `<body>`); the iframe origin is the loader's own origin, so preview deployments embed themselves. `host=` is `location.hostname`. The iframe's `border-radius` matches the widget's corner (16 compact, 28 full, `EMBED_BOX.radius`).
- Reserved box: 320 × 104 (compact) or 100 % × 240 (full). After inserting the iframe it reads the container width once (`offsetWidth`) and reserves the taller layout up front when it applies (`reservedHeight()`: compact under 300 px → 116, full cook under 600 px → 420), so a sidebar or phone column does not jump after load.
- Credit (O-47, `mountCredit()`): `<div class="awaketab-credit">` with `<a href="https://awaketab.com/?ref=embed&source=embed" rel="nofollow">` and the localized `embed.attribution` text, inserted directly after the iframe. Inline styles only, minimal and neutral: the host's font family and text colour (`font:inherit; color:inherit`), 13 px, underlined (offset 3 px), one line (`nowrap`, ellipsis), a fixed 24 px line with 16 px above it, so it never wraps or shifts the page. Hosts may restyle it through the class (inline styles win unless they use `!important`); licensed hosts need not.
- Credit lookup (`keepsCredit()`): one `GET {origin}/api/embed/config?domain=<location.hostname>` per widget origin per page. Only `{ licensed: true, attribution: false }` removes the credit lines; an error, a blocked request (CSP `connect-src`, offline), a non-JSON body or any other shape keeps them.
- `sandbox` adds `allow-popups-to-escape-sandbox` to §7's three tokens (docs/19 C4): without it the "How to fix" link opens awaketab.com as a sandboxed tab where forms (checkout) are blocked.
- `awaketab:resize` is applied but never below the reserved box (104 / 116 / 240 / 420 px), so the widget can grow for a notice or timers without ever shifting the host page by shrinking.
- `window.AwakeTabEmbed` = `{ version, on('ready' | 'state', cb) → off, start(opts), stop(), setTheme(theme) }`; one registry for every tag on the page. Commands issued before a widget is ready are queued and flushed on `awaketab:ready`. `start()` should be called from a click in the page (the video fallback needs a gesture; without one the widget shows "Tap Start to keep the screen awake.").
- Origin checks: a message counts only when `event.source` is an iframe this loader created **and** `event.origin` is the loader's origin; every command is re-validated (`parsePageMessage`) and posted with that origin as `targetOrigin`.

### 11.3 Widget (`/embed/cook`, 14,851 B gz; was 13,843 before Clear Night)

- Its script is `public/embed/app.js` in development and `/embed/assets/app.<hash>.js` in production (see §11.6), an esbuild bundle of `app.ts` (not an Astro `<script>`, so it shares no Rollup chunk with the tool island — `14-devops.md` §6). It runs the real `@awaketab/wake` lock and `@awaketab/core` session engine (in-memory storage, no `BroadcastChannel`), and projects the lock state onto the pill; the digits run only while the lock is `held`/`fallback` and the clock is not paused.
- Look (Clear Night, boards `EmbedWidget`/`EmbedCook`/`EmbedEdge`): a `surface` card with a 1 px `line` border, radius 16 (compact) / 28 (full), and one faint radial aura from the top-start corner (lamp at 10 % light / 16 % dark while `held`/`requesting`/`fallback`, muted 4 % otherwise). The pill is `<output aria-live="polite">` with a 12 px glyph per state (hollow dot idle/requesting, dot with a glow held, two bars lost, triangle denied, dot in a ring fallback), tone 12 % fill + 38 % border, text `ink` 600 (XS 26 / 13 px in compact, S 32 / 14 px in full). Digits are Geist 300 (200 from 48 px), tabular, "MM:SS", "H:MM:SS", "1d 02:15:00" (DESIGN.md §4, `clock.ts` `formatClock()`), `muted` unless running. Start is the lamp fill with the logo glyph and `on-accent` label; Stop and Retry are the strong neutral (`raised` fill, 1 px `line-strong`, `ink`; D-R20). The iframe document uses the site's `tokens.css`; widget-only values without a token (pill heights 26/32, reserved heights 104/116/240/420, the 60 px primary height, the aura alpha) are `--at-embed-*` custom properties in `embed.css`.
- Layout: compact is a 2 × 2 grid (pill over digits, Start/Stop 96 × 44 on the end side, 20 px from the bottom edge); `app.ts` `fitPill()` measures the pill against the room beside the button and sets `data-long` when it does not fit (any locale) or the frame is under 300 px, which moves the pill to its own row (116 tall). Full: header (logo whose bead takes the state tone, title "Keep screen awake", pill), digits with a 13 px line under them ("Tap Start to keep the screen awake." / "Asking your browser…" / "Tap the timer to pause" / "Since 9:04 PM"), Start/Stop 120 × 60 (104 under 600 px; 64 tall in cook), a footer line ("Works while this page is visible", or the date in clock mode), and in cook the kitchen timers in a 264 px column behind a 1 px divider (stacked under 600 px). Digit steps (28 / 48 / 64) and the title follow the board's fit rule by frame width (media queries, since the frame's viewport is the widget).
- Modes: `cook` (Start/Stop, tap the timer = `pause({ keepLock: true })`, its accessible name "Pause the timer, 12:34" / "Resume the timer, 12:34"; in `full` size up to three kitchen timers — quick-add 5/10/15/30/60 min as dashed chips, "Add up to three…" while empty, 46 px rows with a remove button, a lamp-tinted row and a 1 s flash (×3) when one finishes — persisted in `at.v1.embed.settings`, chime on finish via `signal.ts`), `standard` (remaining or elapsed), `clock` (wall clock), `minimal` (pill, a one-line note and Start only).
- `iframe_no_allow`: when `document.permissionsPolicy`/`featurePolicy` says the frame may not use `screen-wake-lock`, the notice "Ask the site owner to allow screen wake lock for this widget." + "How to fix" (`https://awaketab.com/embed#allow`) shows at load; a Start then yields the honest `denied` pill with the same notice. Where the policy is known to allow the lock, a denial shows the power advice instead (`embedAdvice`). The notice is a full-bleed band along the bottom edge (bad 8 % for iframe_no_allow and denied, lamp 8 % for the fallback advice); the widget asks the loader for the extra height. After a denial the button reads Retry.
- Every visible string comes from the page's inlined catalog subset for the `lang=` locale; `<html lang>` and `document.title` follow it. `auto` follows the reader's colour scheme live (`matchMedia` listener).
- No credit line in the frame (O-47): the loader owns it (§11.2).

### 11.4 Licence lookup

The iframe calls `GET /api/embed/config?domain=` with the **verified** parent hostname (`location.ancestorOrigins[0]`, else the referrer origin) — never the `host=` param, which the embedding page controls. No verified parent → no request, free rendering. The function walks from the hostname up to its registrable domain (`www.`/`staging.` covered), ignores records whose `expiresAt` (grace included) has passed or whose `lic:{keyHash}` is not `active` (webhook revocation takes effect within the 5-minute cache), and returns `theme` only as a validated `{ accent: '#rrggbb' | null, scheme }`. The widget applies a licensed accent to the Start button only, with a computed black/white label (≥ 4.5:1); the pill, glyphs, bead and focus ring keep the lamp and state tones, so a state never changes meaning (board `EmbedEdge`, licensed).

The loader asks the same endpoint for the credit line with `location.hostname` of the page it runs on (§11.2). That hostname is not verified, and does not need to be: the credit is in the host's own HTML, which the host controls anyway.

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
- Analytics: `source: 'embed'`, `path: '/embed/cook'`; the widget's `page_view` carries `host` (→ `blob6`). Credit clicks arrive with `?ref=embed&source=embed` (§8). Telemetry follows `at.v1.settings.telemetry` when readable.
- Tests: `apps/web/test/tool/embed-*.test.ts` (incl. the reserved boxes, the credit line and its lookup, the snippet's credit, `formatClock`, Retry and the full-size meta line), `apps/web/scripts/embed-loader.test.ts` (freshness, inlined titles and credit texts, the 3 KB gate), `apps/web/scripts/headers.test.ts`, `apps/web/functions/api/embed/config.test.ts`, e2e `apps/web/test/e2e/m8.spec.ts` (journey 10 cross-origin with and without `allow`, the credit line in the host page, origin rejection both ways, licensed branding and no credit, kitchen timers, axe) — `13-testing-strategy.md` §5, §7.
- Not built yet: the WordPress plugin (§5) and the §9 manual host matrix (WordPress, Squarespace, Webflow, Ghost, AMP, Mobile Safari) — both need real accounts/devices.
