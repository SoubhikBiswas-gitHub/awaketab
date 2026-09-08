# 10 · Browser extension specification — AwakeTab for Chrome

Status: v1.0 · 2026-09-07 · Owner: Soubhik

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
| `display` | `requestKeepAwake('display')` | `held` → "Screen awake" | `ON`, amber |
| `system` | `requestKeepAwake('system')` | `held` + secondary line "System awake — screen may dim" | `SYS`, indigo |

Because `chrome.power` cannot fail asynchronously the way the web API does, the only error states are `unsupported` (API missing — some Chromium forks) and `denied` (enterprise policy). Both use the shared advice codes (`unsupported_browser`, `permissions_policy`).

The session layer is `@awaketab/core` unchanged: plans, presets, `endBehaviour`, stats and the `Session` shape (`source:'ext'`). Timer end → `releaseKeepAwake()` → optional notification (`chrome.notifications`, only if the optional permission was granted) → extend prompt inside the popup or notification buttons (+30 min / Stop).

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

## 5. Popup UI (≈ 320 × 420 px)

Mirrors the web tool at small scale: `StatusPill`, level toggle (Screen / System with a one-line explanation of the difference), preset chips `p15`–`pinf` + Until…, timer, "Open AwakeTab" link to `https://awaketab.com/?source=ext`, Settings gear. Keyboard: `Space` toggle, `1`–`6` presets, `Esc` closes. Colours and tokens from `05-frontend-spec.md` (`--at-*`), dark/light following the browser.

---

## 6. Options page

Sections: Default level · Default preset · End behaviour and sound · Notifications (request permission here) · Battery auto-stop (Chromium only) · Schedules (Pro) · Auto-start sites (Pro; requests host permission per site) · Pro licence (enter key / manage devices / open `https://awaketab.com/pro/activate?ext=1`) · Privacy (telemetry toggle, "what we store") · About (version, changelog link).

Storage: `chrome.storage.local` for `at.v1.settings`, `at.v1.session`, `at.v1.license`, `at.v1.meta`; `chrome.storage.sync` for `Settings` plus schedules and auto-start domains (≤ 100 KB total, ≤ 8 KB per item). The licence token is never synced.

---

## 7. Pro licence reuse

1. User pastes the key in Options, or clicks "Activate in extension" on `/pro/activate?ext=1` (the page shows the key with a copy button; there is no cross-origin hand-off because extensions cannot read the page without host permission).
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
