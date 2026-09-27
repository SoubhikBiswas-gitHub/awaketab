# 10 · Browser extension specification — AwakeTab for Chrome

Status: v1.2 · 2026-09-27 (Clear Night redesign, B9: §14) · Owner: Soubhik

**Purpose.** The web tool cannot keep a screen awake once its tab is hidden — the browser releases the wake lock. The extension is the honest answer to that limitation: it uses `chrome.power` to hold a display or system wake lock from a background service worker, shares the web app's vocabulary, settings and Pro licence, and never claims more than it does. This document specifies it for implementation with WXT (Manifest V3).

Related docs: `00-conventions.md` §5, §6, §8, §9 · `04-engine-spec.md` (session layer reused) · `08-data-storage.md` §3 · `09-monetization-impl.md` §2 (licence reuse) · `13-testing-strategy.md` §7 · `17-launch-checklist.md` (store submission).

---

## 1. Scope and non-goals

**In scope (v1):** Chromium browsers — Chrome, Edge, Brave, Arc, Opera (Chrome Web Store + Edge Add-ons). Display or system keep-awake, presets and until-time, schedules and auto-start rules (Pro), badge and keyboard command, Pro licence reuse, opt-in anonymous analytics.

**Out of scope, stated on the listing:** Firefox and Safari (no `power` API — the web app + floating window is the alternative); preventing lid-close sleep; keeping Teams/Slack/Zoom "Available" (presence follows input, which the extension never simulates); running when the browser is closed.

---

## 2. Manifest (WXT `wxt.config.ts` → `manifest`)

```json
{
  "manifest_version": 3,
  "name": "AwakeTab for Chrome",
  "short_name": "AwakeTab",
  "description": "Keep your screen (or your whole computer) awake from a click — with an honest status you can trust.",
  "version": "1.0.0",
  "minimum_chrome_version": "116",
  "permissions": ["power", "storage", "alarms"],
  "optional_permissions": ["notifications"],
  "host_permissions": [],
  "optional_host_permissions": ["https://*/*"],
  "action": { "default_popup": "popup.html", "default_title": "AwakeTab" },
  "options_page": "options.html",
  "background": { "service_worker": "background.js", "type": "module" },
  "commands": { "toggle": { "suggested_key": { "default": "Alt+Shift+A" }, "description": "Toggle keep-awake" } },
  "icons": { "16": "icon-16.png", "32": "icon-32.png", "48": "icon-48.png", "128": "icon-128.png" }
}
```

`optional_host_permissions` are requested only when the user enables auto-start rules for specific sites (Pro `ext.autostart`); the permission prompt names the site. No remote code; all scripts bundled.

---

## 3. States and vocabulary

The extension has three keep-awake levels, mapped onto the shared pill vocabulary so the UI copy and analytics line up with the web app:

| Extension level | `chrome.power` call | Pill (reuses `tool.pill.*`) | Badge |
|---|---|---|---|
| `off` | `releaseKeepAwake()` | `idle` → "Ready" | none |
| `display` | `requestKeepAwake('display')` | `held` → "Screen awake" | `ON`, Aqua `#087B87` |
| `system` | `requestKeepAwake('system')` | `held`, shown as `ext.pill.systemHeld` "System awake" + secondary line `ext.pill.system` "Screen may dim or lock" | `SYS`, indigo `#2B3A67` |

**System level never says "Screen awake"** (decided 2026-09-26, LAUNCH-AUDIT D-02; docs/19 B1, B7). At `system` level `chrome.power` keeps the computer awake but the display may still dim, turn off or lock, so the shared `held` copy "Screen awake" would overclaim. The lock state is still `held` (the seven states of `00-conventions.md` §5.1 are unchanged; `data-lock="held"`, same colour token); only the extension popup's display copy differs: the pill text is the extension-only key `ext.pill.systemHeld` ("System awake") and the secondary line is `ext.pill.system` ("Screen may dim or lock"). The badge tooltip reads "AwakeTab — System awake · Screen may dim or lock". The web tool has no system level and is unaffected. `status.ts` `pillTextKey(lock, level)` picks the key; unit and e2e tests assert that "Screen awake" never shows at system level.

Because `chrome.power` cannot fail asynchronously the way the web API does, the only error states are `unsupported` (API missing — some Chromium forks) and `denied` (enterprise policy). Both use the shared advice codes (`unsupported_browser`, `permissions_policy`). The extension has no video fallback, so an `unsupported` lock reads as Blocked with the fix (`tool.pill.denied`, "Blocked — here's the fix") rather than the web's fallback offer; `data-lock` keeps `unsupported` (B9, ExtEdge canvas).

The session layer is `@awaketab/core` unchanged: plans, presets, `endBehaviour`, stats and the `ISession` shape (`source:'ext'`). Timer end → `releaseKeepAwake()` → optional notification (`chrome.notifications`, only if the optional permission was granted) → extend prompt inside the popup or notification buttons (+30 min / Stop).

---

## 4. Background service worker

- Holds the keep-awake and the session; MV3 workers can be terminated, so the session is persisted to `chrome.storage.local['at.v1.session']` and re-hydrated on wake; the keep-awake request is re-issued on `onStartup`, `onInstalled` and on every alarm tick if a session is `active`.
- Ticks via `chrome.alarms` (minimum period 30 s in MV3; use `periodInMinutes: 0.5`) — the popup renders its own 1 s timer from `endsAt` when open, so coarse background ticks are fine.
- `chrome.commands.onCommand('toggle')` → start with `settings.defaultPreset` or stop.
- `chrome.idle` is **not** used to fake activity; it may be read (Pro, opt-in) only to show "You've been idle for 20 min — still need this?" after 2 h, never to act.
- Battery auto-stop uses `navigator.getBattery()` from the popup/offscreen document when available (Chromium), mirroring the web setting.
- Schedules (Pro `ext.schedules`): `{ days: [1..5], start: '09:00', end: '18:00', level: 'display' }` → two `chrome.alarms` per schedule; DST handled by recomputing at each fire.
- Auto-start rules (Pro `ext.autostart`): `chrome.tabs.onUpdated` filtered to granted hosts → if a matching tab is active, start `display` for the configured duration; stop when the last matching tab closes.

---

## 5. Popup UI (360 wide, content height; see §14)

Mirrors the web tool at small scale: `StatusPill`, level toggle (Screen / System with a one-line explanation of the difference), preset chips `p15`–`pinf` + Until…, timer, "Open AwakeTab" link to `https://awaketab.com/?source=ext`, Settings gear. Keyboard: `Space` toggle, `1`–`6` presets, `Esc` closes. Colours and tokens from `05-frontend-spec.md` (`--at-*`), dark/light following the browser. The Clear Night layout and every state are in §14.

---

## 6. Options page

Sections (B9, ExtOptions canvas): Defaults (level, default duration) · When time is up (end behaviour, notifications (request permission here), end sound) · Look and language (theme, language) · Keyboard · Schedules (Pro) · Auto-start (Pro; requests host permission per site) · Pro licence (enter key / manage devices / open `https://awaketab.com/pro/activate?ext=1`) · Privacy (telemetry toggle, "what we store") · About (version, changelog link). Battery auto-stop is not shown: it cannot work from an MV3 worker (§13), and a control that does nothing is not offered.

Storage: `chrome.storage.local` for `at.v1.settings`, `at.v1.session`, `at.v1.license`, `at.v1.meta`; `chrome.storage.sync` for `ISettings` plus schedules and auto-start domains (≤ 100 KB total, ≤ 8 KB per item). The licence token is never synced.

---

## 7. Pro licence reuse

1. User pastes the key in Options, or clicks "Activate in extension" on `/pro/activate?ext=1` (the page shows the key with a copy button; there is no cross-origin hand-off because extensions cannot read the page without host permission). As built (2026-09-26): with `ext=1` the page does **not** activate the browser — it checks the key's shape client-side (or resolves `checkout_id` through the non-activating lookup, `09-monetization-impl.md` §2.3a) and only shows the copy panel, so the extension's own activation in step 2 is the only one spent.
2. Options calls `POST https://awaketab.com/api/license/activate` with `{ key, deviceId, deviceLabel: 'Chrome extension on <OS>' }`; `deviceId` is a UUID generated once per browser profile and stored in `chrome.storage.local`. This counts as one of the five activations.
3. Token verified offline with `verifyLicenseToken()` from `@awaketab/core` (`LICENSE_PUBLIC_KEYS`), stored in `at.v1.license`; features read via `hasFeature()`.
4. Re-validation cadence and grace identical to the web (`08-data-storage.md` §2.4). Offline → features stay on until `exp`.

---

## 8. Analytics (opt-in)

Off by default in the extension (store review friendliness); the Options toggle enables the same first-party beacon to `POST /api/e` with `source: 'ext'`. Events: `session_start`, `session_end`, `pro_activated`, `client_error`. No URLs, no tab titles, no hostnames — auto-start rules are matched locally and never reported.

---

## 9. Store listing

**Title:** AwakeTab for Chrome — Keep Screen Awake · **Short description (≤ 132):** Keep your screen or computer awake with one click, a timer, or a schedule. Honest status, no tracking, no mouse jiggling. · **Category:** Productivity → Tools.

**Screenshots (1280×800):** 1 popup in `held` state · 2 presets and until-time · 3 options with schedules · 4 web app + extension side by side · 5 the honest limits panel.

**Permission justifications (required by CWS):** `power` — hold the display/system wake lock; `storage` — save settings and session; `alarms` — timers and schedules while the service worker sleeps; `notifications` (optional) — tell you when the timer ends; host permissions (optional, per site) — start automatically on sites you choose.

**Privacy policy URL:** `https://awaketab.com/privacy#extension`. **Single purpose statement:** "Prevent the device from sleeping for a chosen time." Data disclosure: no user data collected by default; optional anonymous usage statistics.

Edge Add-ons: same package, listing copied; Edge reviews are typically slower — submit in the same week.

---

## 10. Compliance

- No remote code, no eval, no analytics SDKs, no ads (Google forbids ads in extensions; we have none anyway).
- No synthetic input events, no `chrome.idle.setDetectionInterval` tricks, no "appear online" claims anywhere in the listing or UI.
- Content Security Policy: WXT default MV3 CSP; no inline scripts.
- Accessibility: popup fully keyboard-operable; pill has `aria-live`; contrast AA in both themes.
- Versioning: semver; changelog entries flow into `/changelog` under an "Extension" heading.

---

## 11. Test plan pointers

Unit: level mapping, schedule → alarms conversion (incl. DST), auto-start matcher. Integration (Playwright with the extension loaded, `chrome.power` mocked via a test build flag): start/stop from popup and command, session persistence across service-worker restart (force via `chrome://serviceworker-internals` in manual runs), licence activation against a mocked API, badge text. Manual: real `chrome.power` on Windows and macOS with display sleep set to 1 minute; verify display stays on for `display`, and that `system` lets the screen dim but not the machine sleep. Results feed `/learn/how-we-tested`.

---

## 12. Open items

- Whether to ship a Firefox version that opens the web app in a pinned tab with `?source=ext` — decide after launch based on requests.
- Offscreen document for battery reading vs. reading only when the popup is open — measure battery-stop reliability first.

---

## 13. As built (M7, 2026-09-26)

Where the implementation settles something this spec left open, or differs from it. Identifiers are listed in `00-conventions.md` §13.9.

**Layout.** `apps/extension/entrypoints/{background.ts, popup/, options/}` are thin; the logic lives in `apps/extension/src/`: `controller.ts` (the worker: session, alarms, badge, schedules, auto-start, sync mirror, notifications), `power.ts` (`IWakeLockHandle` over `chrome.power`), `storage.ts` (the `IStorageAdapter` over `chrome.storage.local`), `settings.ts` (extension settings, host normaliser, auto-start matcher), `schedules.ts`, `status.ts` (level ↔ pill/badge), `license.ts`, `telemetry.ts`, `messages.ts` (popup ↔ worker protocol), `page.ts` (shared page boot), `api.ts` (the narrow `chrome.*` surface; unit tests run against `test/unit/fake-chrome.ts`).

**Session engine.** `createSession()` from `@awaketab/core` with `channel: null`, `source: 'ext'` and `resumeIndefiniteMs: Infinity` (a core option added in M7: the worker restarts many times per session, so the web's 12 h resume window does not apply). The core `channel: null` handling was fixed in the same change — it previously still opened `BroadcastChannel('awaketab')`. The level and the origin of a session are kept in `ISession.modeState` (`{ level, origin }`, origin `user | command | schedule | autostart | startup`), so no extra storage key is needed for them. All worker event handlers run one at a time (a promise queue), so a popup click, an alarm and a tab event cannot interleave half-started sessions.

**Storage (docs/08 §3).** The core layer reads storage synchronously, so `storage.ts` loads every `at.*` key once per worker start and keeps a write-through cache; values are stored as objects. The engine's once-per-second session writes are coalesced to one write per `SESSION_COALESCE_MS` (10 s) when only `awakeSeconds` moved; status, plan and level changes are written at once. Two new local keys: `at.v1.ext` (`IExtSettings`: default `level`, `schedules[]`, `autostart { browserStart, sites[] }`) and `at.v1.device` (`{ v, id }`, random UUID per profile). `at.v1.settings` and `at.v1.ext` are mirrored to `chrome.storage.sync` (2 s debounce; a fresh profile is seeded from sync; remote changes are adopted). `at.v1.license`, `at.v1.device`, `at.v1.session` and `at.v1.stats` are never synced (asserted in unit and e2e tests). Extension defaults differ from the web: `telemetry: false`, `notifications: false`.

**Lifecycle.** Every start of the worker loads storage, verifies the licence offline and re-hydrates: a live session is resumed (keep-awake re-issued); a finite session whose end passed while the worker slept is finalised as `completed` and announced only if it ended < 5 min ago; with no live session `releaseKeepAwake()` is called defensively. `onStartup`, `onInstalled` and every `at.tick` alarm (0.5 min, only while a session is live) re-issue `requestKeepAwake(level)`. `at.end` fires at the session end so completion happens on time even if the worker slept. Stats undercount time while the worker is stopped (the engine only counts seconds while alive); the extension does not show stats.

**Badge.** Only while the lock is `held`: `ON` (display) / `SYS` (system) for ∞, otherwise minutes left (`25m`, `3h` from 100 minutes up). Aqua `#087B87` for display (5.0:1 with white; amber means paused, `DESIGN.md` §2.1), night indigo `#2B3A67` for system, white text; the tooltip (`action.setTitle`) spells out the pill text and time left (at system level "System awake · Screen may dim or lock", §3), so the level is not conveyed by colour alone.

**Popup.** Ring, pill (`tool.pill.*`, or `ext.pill.systemHeld` "System awake" for a held system lock, §3; `aria-live`), timer from `endsAt` and `Date.now()` (runs only while `held`), secondary line `ext.pill.system` "Screen may dim or lock" for a held system lock and `ext.origin.*` for schedule/auto-start/startup sessions, Start/Stop, Screen/System switch with a one-line explanation, chips `p15`…`p240` + ∞ + Until…, the extend prompt (+15/+30/+1 h/Stop) for 5 min after a user session completes with `prompt_extend`. Keyboard: `Space`, `1`–`6`, `0`, `U`, `Esc` (single-key shortcuts follow `settings.keyboardShortcuts`). The pill shows `requesting` until the worker answers; it never shows `held` on the button's say-so. Measured first render ≈ 50 ms after navigation start in headless Chromium (`data-ready` on `<html>`).

**Unsupported / denied.** No `chrome.power` → `unsupported` lock (shown as Blocked, §3), Start disabled, no session is created. A throwing `requestKeepAwake` → `denied` + `ext.advice.denied`. Popup copy for both: §14.

**Notifications and sound.** `chrome.notifications` only when `settings.notifications` is on and the optional permission is granted (requested from the Options checkbox gesture). Id `at-end`; buttons `+30 min` / `Stop` when `endBehaviour` is `prompt_extend`. The extension has no audio of its own: "End sound" maps to the notification's system sound (`none` → `silent: true`).

**Battery auto-stop — deferred.** `navigator.getBattery()` does not exist in service workers and the `offscreen` permission is not in the permission list, so M7 showed the setting disabled; since B9 the Options page leaves it out (no dead control). §12 stays open.

**Schedules (Pro `ext.schedules`).** Weekly windows `{ id, days (0 = Sun … 6 = Sat), start, end, level }`, ≤ 20; overnight windows end the next day; overlapping or touching windows merge, and a merged window uses `display` if any part does. Two alarms per schedule (`at.sched.<id>.start` / `.end`) recomputed on every fire, on licence/settings change and on every worker start (DST-safe: wall times are rebuilt with `Date#setHours`). A window in progress starts an `until` session with origin `schedule` unless a user session is live; stopping it by hand suppresses that window. Without the feature no schedule alarm exists.

**Auto-start (Pro `ext.autostart`).** "Keep awake whenever Chrome starts" starts the default preset on `runtime.onStartup` (FR-EXT-04). Sites: the Options form normalises the input to an https host (`docs.example.com` or `*.example.com`) and calls `chrome.permissions.request({ origins: ['https://<host>/*'] })` inside the submit gesture; removing a site removes the permission. Without the host permission Chrome withholds `tab.url`, so unrelated tab events are dropped before any work. A matching tab that finishes loading starts `pinf` (or the chosen 30/60/120/240 min) with origin `autostart` if nothing is live; when no matching tab remains open the auto-start session stops. Hostnames are never reported.

**Licence.** Options → "Activate" posts `{ key, deviceId: at.v1.device.id, deviceLabel: 'AwakeTab for Chrome · <OS>' }` to `https://awaketab.com/api/license/activate`, verifies the token offline (`verifyLicenseToken`, device hash checked) and stores the `ILicenseRecord` in `chrome.storage.local`. `/pro/activate?ext=1` is linked as "Find your key on awaketab.com". Re-validation follows `needsRevalidation()` on start and hourly (`at.license`); `revoked` drops the record, network failures keep the token until `exp`. "Remove from this browser" calls `/api/license/deactivate` and removes the record even offline (then says so). The extension calls the API cross-origin without host permissions, so `apps/web/functions/api/_middleware.ts` answers CORS for `chrome-extension://<32 a–p>` origins on `/api/e` and `/api/license/{activate,validate,deactivate}` only (no credentials).

**Telemetry.** Off by default; when on, each allow-listed event (`session_start`, `session_end`, `pro_activated`, `client_error`) is posted immediately to `/api/e` with `source: 'ext'`, `path: '/ext'` (`/ext/options` from the options page), `viewport: 'ext'`, a per-worker random `sid`, and only the documented parameters.

**i18n.** No extension string lives in the extension. `scripts/i18n.mjs` picks the needed keys from `apps/web/src/i18n/<locale>.json` into per-locale chunks (`virtual:at-catalog/<locale>`, loaded on demand) and a small worker catalog (`virtual:at-catalogs-bg`), and writes `_locales/{en,es,pt_BR,de,fr,ja,zh_CN,hi}/messages.json` for the manifest name, description and command (`__MSG_ext_name__`, …). The language follows `settings.locale`, else the browser UI language. `--at-*` tokens come from `apps/web/src/styles/tokens.css` (`virtual:at-tokens.css`, the plain-CSS part after the Tailwind preamble). Since B9 the extension also has its own catalog for copy that exists nowhere on the web (§14).

**Manifest.** As §2, plus `default_locale: 'en'`, localised name/description/command, `action.default_icon`, and `minimum_chrome_version` read from `support-matrix.json` → `extension.minimumChromeVersion`. No `content_scripts`, no `externally_connectable`, default MV3 CSP.

**Build, zip, tests.** `pnpm -F extension build` (icons are rasterised in plain JS, `scripts/icons.mjs`), `pnpm -F extension zip` (deterministic zip writer `scripts/zip.mjs`: sorted entries, 1980-01-01 timestamps, fixed modes), `pnpm -F extension zip:check` (builds twice into temp dirs, compares SHA-256; also a unit test). The Playwright suite (`pnpm test:e2e:ext`) builds with `AT_EXT_TEST=1` into `.output-test/`: `__AT_TEST__` swaps `chrome.power` for a recorder (`src/test-hooks.ts`, log in `chrome.storage.session['at.test.power']`); the production bundle contains none of it. Store copy and permission justifications: `apps/extension/store/listing.md`; images `apps/extension/store/images/` from `pnpm -F extension store:assets` (satori + resvg resolved from `apps/web`, byte-reproducible, placeholders). Privacy statement: `/privacy#extension`.

---

## 14. Clear Night redesign (B9, 2026-09-27)

Built from the canvas boards `ExtPopup`, `ExtEdge`, `ExtOptions`, `ExtBadges` and `Welcome` (design/canvas/project) and `DESIGN.md` §2, §3, §11, §12. Identifiers: `00-conventions.md` §13.9 (B9 rows).

**Look.** One stylesheet for the three pages, `src/styles/base.css`: Clear Night `--at-*` tokens from `apps/web/src/styles/tokens.css` (`virtual:at-tokens.css`, one source, DESIGN.md §12.1), extension-local `--ext-*` values for the ground lift, halo and elevation, and Geist and Geist Mono bundled in `public/fonts` with the OFL licence and metric-matched fallbacks (D-R26; MV3 pages load no remote font). Motion is slow and ease-out (16 s sweep, 3.4 s tip halo, 26 s aura, 0.6 s indicators) and stops under reduced motion. Theme follows `settings.theme` (`auto` follows the system live).

**Popup (360 wide, 12 px between blocks, 20 px below the last row).** Header 60: logo lockup whose bead takes the state tone, the "New in {version}" chip after an update (`at.v1.meta.lastSeenVersion`), Settings. Status row: a 124 px ring (60 ticks, track, depleting lamp arc with glow and tip halo, slow sweep while held) with digits per `DESIGN.md` §4 (MM:SS; H:MM:SS at 20 px from an hour; `1d` over HH:MM:SS from a day; ∞ counts up as "Awake for" with "since"), and the S pill (32 tall, 14/600, tone 12 % fill + 38 % border; glyph: hollow dot idle/starting, glowing dot held, half dot for System, triangle for Blocked). Under the pill: "Screen may dim or lock" (`data-pill-extra`, System), the origin line (schedule, auto-start site, Chrome start) and one meta line: the honest limits in Ready, "Asking Chrome…", "Started {time}", "Until {full date}" for multi-day sessions, "No end time" for ∞, "Scheduled until {time}", or the receipt "Held 42 min, 9:12 to 9:54 PM." for 5 min after a session ends. States (`<main data-mode>`):
- **Ready:** full arc at 45 %, the default length on the digits with "ends {time}" (or ∞ "until you stop"), lamp CTA "Start · {length}", level switch with its help line, chips (the default length selected), the Pro row for free users (opens an inline panel, never a modal; no prices in the extension, they change on /pro), and the first-open tips ("Good to know": the real shortcut as keycaps and "Pin it to see time left", dismissed into `at.v1.onboarding.dismissedTips`).
- **Held:** +15 / +30 / +1 h add to the running session (`extend` → `addTime`); Stop is the raised neutral (D-R20). Schedule sessions show the schedule card (days, range, level, Edit → options#schedules), "Stop for today" with "Skips the rest of this window. It starts again {when}.", no chips, and the level help says the schedule keeps its level. Chrome-start sessions note "Auto-start runs this whenever Chrome opens." with Change → options#autostart.
- **Time's up (`extend`):** the card with +15 / +30 / +1 h, Stop (dismiss) and "Offered until {time}"; meta "Time's up. Keep going?" and "Held {span}".
- **Blocked (`denied` / `unsupported`):** the ring shrinks to red dots, pill "Blocked — here's the fix", "Chrome refused the request." / "No power API in this browser." and "Nothing is keeping this device awake.", a fix card, then Retry + Open AwakeTab (denied) or "Open AwakeTab in a tab" (unsupported). No chips, no level switch.
- **Until panel:** replaces the chips and Start in place: a 15-minute stepper (up to 24 h ahead), the summary line, Cancel / Start.
- **Private window:** when the popup runs in Incognito (`extension.inIncognitoContext`), a note that it is the same session everywhere.

**Options (header 60/68, side nav from 1024 px with a sliding indicator, one column below).** Cards with 1 px dividers: level cards with radio marks; default duration as a 7-item segmented bar; end behaviour, theme (Auto / Light / Dark / OLED black) and schedule level as segmented bars; switches (52 × 32 in a 60 × 44 target; real checkboxes with `role="switch"`); the Language row opens inline radio rows (Browser language + the 8 locales in their native names, "Current", "Translation in review") stored as `settings.locale`, and the page switches language in place; the shortcut as keycaps with Change shortcut; Schedules with a week preview (screen blocks solid, system hatched, the unsaved draft dashed, a now marker), the list, and a new-schedule form (day toggles, From / To steppers in 30 min, level, Add schedule); Auto-start (browser-start switch, sites in mono, host + duration form); licence; privacy; about; the shared footer. A "Saved" pill confirms each change.

**Welcome page (`welcome.html`, O-25).** Opened once on install. Hero with the version kicker and the pin steps next to an interactive Chrome toolbar mock (an illustration: an extension cannot pin itself), three moments, Screen or System with the real badge colours and pill copy, the shortcut, what it can't do and what it can see, then Open settings / Open AwakeTab and the footer. Light / Dark / Auto switch in the header (the same setting as Options).

**i18n.** New copy lives in `apps/extension/locales/<locale>.json` (`ext.*`, all 8 locales, merged under the web keys by `scripts/i18n.mjs`); a unit test keeps it disjoint from the web catalog and identical in keys and placeholders across locales. The welcome page names the extension by its real manifest name (`ext.name`).

**Tests.** Unit: `format.test.ts` (digits, words, tomorrow / weekday / full date, spans, keycaps), controller (add time to a live session, welcome on install, `lastSeenVersion`), the `unsupported` pill mapping, catalog and font checks. E2E (`pnpm test:e2e:ext`): Ready copy, ∞ and finite sessions, System (D-02), the until stepper, +15 min, Blocked + Retry (test hook `at.test.deny`), first-open tips and the Pro row, the welcome page on install, options gates and default duration, the language row, licence activation, axe in light and dark (popup Ready / held / until, options with the language list open, welcome, Blocked).

**Follow-ups.** Store name: the canvas shows "AwakeTab: Keep Screen Awake" (O-37); the manifest name is still `ext.name` "AwakeTab for Chrome" (web catalog), so the welcome page shows the real name until that key changes. Icons: unchanged. Move the `apps/extension/locales` keys into the web catalogs when those are next edited.
