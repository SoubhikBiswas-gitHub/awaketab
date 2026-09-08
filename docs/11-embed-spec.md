# 11 · Embed widget specification — AwakeTab Embed (Cook Mode)

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** Recipe blogs, dashboards and documentation sites can drop one script tag on a page and give their readers a "keep my screen on" control. The widget is a sandboxed iframe of our own app, so it inherits the engine, the honest status and the locales. Free embeds carry an attribution link (a contextual backlink from the pages that rank for the use case); a Business licence removes it and unlocks branding.

Related docs: `00-conventions.md` §7, §8, §9 · `04-engine-spec.md` (engine reused) · `05-frontend-spec.md` §3.16 (Cook Mode) · `09-monetization-impl.md` §7 (Embed licence) · `14-devops.md` (headers for `/embed/*`).

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
