# AwakeTab privacy form preparation

Use these implementation facts when completing the store's current form. Opt-in collection must still be disclosed. Checkboxes and account certifications must match both the final package and the public privacy policy; do not select "no data" merely because usage statistics start off.

## Single purpose

Keep the user's screen or computer awake for a chosen time, with clear controls and status.

## Permission explanations

| Permission | Purpose |
| --- | --- |
| power | Request and release Chrome's display or system keep-awake API after the user starts a session. |
| storage | Store settings and session state locally. Chrome sync can copy settings, schedules and chosen auto-start sites between profiles; licence tokens and device identifiers never sync. |
| alarms | End timers, restore session checks while the service worker sleeps, and run licence-gated schedules. |
| notifications (optional) | Notify the user when a timer ends, only after the user enables the feature and grants permission. |
| https://*/* (optional host access) | Licence-gated site auto-start requests one chosen origin at a time. No site is granted on install and page content is not read. |

Remote code: No. Scripts, styles, fonts and icons are bundled. API responses supply data, not executable code.

## Data inventory

Local records: preferences, sessions, minute totals, install/update metadata, Screen/System choice, schedules, chosen auto-start sites and a random device identifier. An activated licence token is local-only. The browser may sync settings, schedules and chosen auto-start sites through Chrome sync; the developer does not receive those site choices.

Optional usage statistics: if enabled, only session start/end, activation and error events go to `https://awaketab.com/api/e`. Payloads include plan/preset or duration/end reason, error code, locale, coarse browser/OS class, extension version, timestamp and a random in-memory session identifier. They exclude URLs, page titles, site names and page content. Map this behavior to the dashboard's current user-activity categories.

Licence actions: user-entered licence keys, random device ID and operating-system label go to `https://awaketab.com/api/license/activate`. Token validation and deactivation use the matching first-party API endpoints. Map keys/tokens and identifiers to the current authentication/identifier definitions in the form. New purchases are disabled; the licence controls remain implemented.

Ordinary network requests expose IP addresses to the first-party hosting service. The public policy describes server and network handling. No data is sold or used for advertising, creditworthiness or lending. Limited Use certifications should be affirmed only after reviewing the live form and these facts.

Public policy: https://awaketab.com/privacy#extension

Account: verify the existing publisher email `soubhik481@gmail.com`, contact verification, 2-Step Verification and trader/legal status. No registration or account verification is claimed by this document.

Sources: [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq).
