# AwakeTab reviewer instructions

Product: AwakeTab: Keep Screen Awake. Candidate version: 1.0.1. Minimum Chrome: 116.

The free features need no account, licence, website login or payment. Pro purchases are unavailable in this release. The settings' licence field and locked schedules/auto-start sections are for licence-based functionality; no reviewer credential is needed for the free functionality submitted here.

## Core flow

1. Install the package and pin the AwakeTab toolbar icon. The welcome page explains Screen and System modes and their limits.
2. Open the popup. It starts in Ready. Select 30 min; the status becomes Screen awake after Chrome accepts `chrome.power.requestKeepAwake('display')`. The toolbar badge shows minutes left.
3. Close the popup and switch tabs. Reopen it: the active timer continues. Click Stop; status returns to Ready and the toolbar badge clears.
4. Choose System, then Until I stop. Status is System awake, the badge is SYS, and the display may dim while the computer remains awake. Stop releases the keep-awake request.
5. Try an until-time session and add 15 minutes to a running session. Alt+Shift+A is the toolbar toggle shortcut; another extension or OS shortcut may occupy it, in which case Chrome's extension shortcut settings can change it.
6. Open Settings. Change a default duration and reopen the popup to verify it persists. End notifications are off until enabled; enabling them requests only the optional notifications permission.
7. Privacy settings show anonymous usage statistics off by default. A free session needs no remote code, page-content access, site permissions or developer service call.

## Limits and permissions

Power, storage and alarms are required. Notifications are optional. Optional HTTPS host access is declared for licence-based per-site auto-start and is requested one chosen site at a time; no hosts are granted on installation. The extension does not inspect page content or simulate keyboard or mouse activity.

The extension operates only while Chrome runs. It cannot override a deliberately locked device, a closed laptop lid or enterprise/OS power policy, and it does not change presence in messaging applications.

Public privacy policy: https://awaketab.com/privacy#extension

Support: support@awaketab.com
