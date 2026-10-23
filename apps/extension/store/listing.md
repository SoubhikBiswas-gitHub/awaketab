# Store listing — AwakeTab: Keep Screen Awake

Copy for the first Chrome Web Store release. Use with [the release guide](PUBLISHING.md), [reviewer instructions](reviewer-instructions.md) and [privacy disclosures](privacy-disclosures.md). Store form fields use plain text; preserve paragraph spacing and remove Markdown formatting when pasting. No submission or approval is claimed here.

## Identity

| Field | Value |
|---|---|
| Name (manifest, all locales) | AwakeTab: Keep Screen Awake, in English in every locale (`_locales/*/messages.json` → `ext_name`, generated from `ext.name`) |
| Edge Add-ons display name | AwakeTab: Keep Screen Awake (Edge reads the name from the same package's manifest) |
| Store title | AwakeTab: Keep Screen Awake (the manifest name; the store shows it as the title) |
| Short description (manifest, ≤ 132) | Keep your screen (or your whole computer) awake from a click — with an honest status you can trust. |
| Category | Productivity → Tools |
| Language | English (the extension UI itself ships en, es, pt-BR, de, fr, ja, zh-CN, hi) |
| Homepage | https://awaketab.com/extension |
| Support | support@awaketab.com |
| Privacy policy URL | https://awaketab.com/privacy#extension |
| Minimum version | Chrome 116 (manifest `minimum_chrome_version`, from the support matrix) |
| Price | Free. Pro purchases are unavailable at launch. |

## Detailed description

AwakeTab keeps your display — or just your computer — awake while Chrome is running, using Chrome's own power API. Unlike a web page, it keeps working when its tab is hidden or the window is minimised.

- Screen or System: keep the display on, or keep only the computer awake and let the screen dim.
- The same presets as the AwakeTab web app: 15 minutes to 4 hours, until a time, or until you stop.
- The toolbar badge shows ON, SYS or the minutes left. Alt+Shift+A toggles it from any tab.
- An honest status: the popup says "Screen awake" only after Chrome has accepted the request, and "System awake" when only the computer is kept awake.
- Optional notification when a timer ends, with +30 min and Stop buttons.

The keep-awake features above are free and require no account or licence. Pro purchases are not available at launch. Weekly schedules and auto-start are licence-gated extras, not included in the free feature set. The settings include a licence field for activation when Pro becomes available.

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

Generated reproducibly by `pnpm -F extension store:assets` into `store/images/` from `scripts/store-assets.mts`. Upload the first four screenshots for the free launch, followed by the optional promo tile and the store icon:

| File | Size | Screenshot (docs/10 §9) |
|---|---|---|
| `screenshot-1-popup.png` | 1280×800 | The active popup with an enlarged toolbar badge |
| `screenshot-2-screen-or-system.png` | 1280×800 | Screen or System, side by side |
| `screenshot-3-toolbar-badge.png` | 1280×800 | The five toolbar badge states |
| `screenshot-4-lengths.png` | 1280×800 | A 2 h session and an end time past midnight |
| `promo-440x280.png` | 440×280 | Small promotional tile |
| `public/icon-128.png` | 128×128 | Store icon (also 16/32/48 in the package) |

Keep `screenshot-5-pro-auto-start.png` for a later Pro release. Do not upload it as a free-launch feature screenshot.

## Package

Use `pnpm -F extension publish:package --current` for the first unpublished version, or `pnpm -F extension publish:package` to choose a later version bump. It validates and builds with purchases disabled, then writes `AwakeTab-v<version>.zip` to the Desktop. It does not submit to a store. See [packaging and recovery](PUBLISHING.md#packaging-and-recovery).
