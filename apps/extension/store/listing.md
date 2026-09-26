# Store listing — AwakeTab for Chrome

Source for the Chrome Web Store and Edge Add-ons dashboards (docs/10 §9, docs/17 "Extension submission"). Paste the fields as written. Every claim here is bounded by docs/19 B7 (no background-tab, Teams/Slack or lid-close claims beyond what is stated) and by `apps/web/src/data/support-matrix.json` (`extension`).

## Identity

| Field | Value |
|---|---|
| Name (manifest, all locales) | AwakeTab for Chrome (`_locales/*/messages.json` → `ext_name`, generated from `ext.name`) |
| Edge Add-ons display name | AwakeTab |
| Store title | AwakeTab for Chrome — Keep Screen Awake |
| Short description (≤ 132) | Keep your screen or computer awake with one click, a timer, or a schedule. Honest status, no tracking, no mouse jiggling. |
| Category | Productivity → Tools |
| Language | English (the extension UI itself ships en, es, pt-BR, de, fr, ja, zh-CN, hi) |
| Homepage | https://awaketab.com/extension |
| Support | support@awaketab.com |
| Privacy policy URL | https://awaketab.com/privacy#extension |
| Minimum version | Chrome 116 (manifest `minimum_chrome_version`, from the support matrix) |

## Detailed description

AwakeTab for Chrome keeps your display — or just your computer — awake while Chrome is running, using Chrome's own power API. Unlike a web page, it keeps working when its tab is hidden or the window is minimised.

- Screen or System: keep the display on, or keep only the computer awake and let the screen dim.
- The same presets as the AwakeTab web app: 15 minutes to 4 hours, until a time, or until you stop.
- The toolbar badge shows ON, SYS or the minutes left. Alt+Shift+A toggles it from any tab.
- An honest status: the popup says "Screen awake" only after Chrome has accepted the request, and "System awake" when only the computer is kept awake.
- Optional notification when a timer ends, with +30 min and Stop buttons.
- With AwakeTab Pro: weekly schedules, and auto-start when Chrome opens or when you visit a site you choose. Your Pro key works on five devices across the web app and the extension.

What it does not do:
- It works only while Chrome is running.
- It cannot stop sleep when you close a laptop lid.
- It does not keep Teams or Slack showing you as available: presence follows your keyboard and mouse, and AwakeTab never simulates input.
- Firefox and Safari have no power API for extensions, so there is no version for them.

Privacy: no account, no ads, no remote code. Anonymous usage statistics are off by default; if you turn them on, the extension sends only session start/end, Pro activation and error counts to awaketab.com — never URLs, tab titles or site names.

## Single purpose

Prevent the device from sleeping for a chosen time.

## Permission justifications

| Permission | Justification |
|---|---|
| `power` | Hold the display or system keep-awake the user starts (`chrome.power.requestKeepAwake`). |
| `storage` | Save the user's settings, the current session and an optional Pro licence in `chrome.storage.local`; settings, schedules and auto-start sites also sync through `chrome.storage.sync`. The licence never syncs. |
| `alarms` | Run timers, the 30-second keep-alive check and weekly schedules while the service worker sleeps. |
| `notifications` (optional) | Tell the user a timer ended, with +30 min / Stop buttons. Requested only when the user turns notifications on. |
| Host permissions (optional, `https://*/*` declared, one site requested at a time) | Start automatically when a tab on a site the user adds loads, and stop when the last one closes (Pro auto-start). No host access is granted at install; the prompt names the one site. Page content is never read. |

Remote code: none. All scripts are bundled in the package.

## Data usage disclosure

- Data collected by default: none.
- Optional (user opt-in in Settings → Privacy): anonymous usage statistics — session start/end (plan type, preset, end reason, minutes), Pro activation (plan) and error codes, with a random per-worker id held in memory only.
- Pro activation (user action): licence key, a random device id and the label "AwakeTab for Chrome · {OS}" sent to awaketab.com to count one of five activations.
- Not sold, not used for advertising, not used for creditworthiness.

## Images

Generated reproducibly by `pnpm -F extension store:assets` into `store/images/` (placeholders until real captures replace them):

| File | Size | Screenshot (docs/10 §9) |
|---|---|---|
| `screenshot-1-held.png` | 1280×800 | Popup in the `held` state |
| `screenshot-2-presets.png` | 1280×800 | Presets and until-time |
| `screenshot-3-schedules.png` | 1280×800 | Options with schedules |
| `screenshot-4-web-and-extension.png` | 1280×800 | Web app and extension side by side |
| `screenshot-5-honest-limits.png` | 1280×800 | The honest limits |
| `promo-440x280.png` | 440×280 | Small promotional tile |
| `public/icon-128.png` | 128×128 | Store icon (also 16/32/48 in the package) |

## Package

`pnpm -F extension zip` → `apps/extension/.output/awaketab-chrome-<version>.zip` (sorted entries, fixed timestamps; `pnpm -F extension zip:check` builds twice and compares SHA-256). The same zip goes to Edge Add-ons.
