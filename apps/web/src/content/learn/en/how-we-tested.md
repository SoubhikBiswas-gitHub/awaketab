---
title: "How AwakeTab is checked — AwakeTab"
description: "What each AwakeTab support claim rests on today: browser documentation, engine source and automated tests. Device results appear as they are recorded."
h1: "How AwakeTab is checked"
crumb: "How we tested"
intent: "how awaketab was tested"
preset: p15
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "Every support claim on AwakeTab rests today on four kinds of source: browser documentation, the wake lock code inside the browser engines, vendor support pages and automated tests. None rests on a real-device run yet. The device matrix at the end of this page lists the planned cases. Each one says \"Results pending\" until it is recorded, and no page cites a device before then. Sources last checked 26 September 2026."
toc:
  what-does-each-claim-rest-on-today: "What claims rest on"
  what-did-the-source-check-find: "What the check found"
  what-did-the-check-correct: "What it corrected"
  what-still-needs-a-real-device: "Still needs a device"
  sources: "Sources"
  what-this-page-does-not-tell-you: "Limits"
rows:
  basis:
    - title: "Browser documentation"
      text: "Version floors come from MDN's browser compatibility data and each vendor's release notes."
    - title: "Engine source code"
      text: "Why a lock is refused comes from reading the wake lock code in Chromium, WebKit and Firefox."
    - title: "Vendor support pages"
      text: "Operating-system behaviour, such as Low Power Mode's 30-second Auto-Lock, comes from Apple, Microsoft and Google."
    - title: "Automated tests"
      text: "The tool runs in a browser against a simulated wake lock that can grant, refuse or take back the lock. Other tests fail if a claim the source check removed comes back."
  fixes:
    - title: "Battery savers"
      text: "No engine checks them. Every page that said otherwise was corrected."
    - title: "Caffeine for Mac"
      text: "It holds a macOS power assertion. The F15 key press belongs to Caffeine for Windows."
    - title: "NoSleep.js"
      text: "It uses the Wake Lock API where present, and a video only as a fallback."
    - title: "PowerToys Awake"
      text: "It has a \"Keep screen on\" switch, and it does not work at the lock screen."
    - title: "macOS idle sleep"
      text: "While Chrome holds the display on, the Mac does not idle-sleep, per Apple's IOKit documentation."
    - title: "Names and versions"
      text: "Windows 11 24H2 renamed Battery saver to Energy saver, and iPadOS 26 removed Split View."
  pending:
    - title: "Safari under iPhone Low Power Mode"
      text: "WebKit has no check for it, but only a device shows whether the screen stays on."
    - title: "Operating-system savers"
      text: "Whether Android Battery Saver or Windows Energy saver dims or turns off a display the browser asked to keep on."
    - title: "Edge and Samsung Internet efficiency modes"
      text: "How their own power features treat a visible tab."
    - title: "The video fallback on current iOS"
      text: "It has not been re-checked."
    - title: "The floating window with its tab hidden"
      text: "Whether it keeps the screen on while its tab is hidden."
    - title: "Mac clamshell mode"
      text: "What each MacBook needs to stay awake with the lid closed."
notes:
  savers:
    kicker: "Good to know"
    text: "Battery savers are not on that list. Chromium's code has no check for Android Battery Saver, Windows Energy saver or Chrome's Energy Saver, and WebKit has no check for Low Power Mode. A saver can still shorten the operating system's own timeout."
faq:
  - q: "Does a Pending row mean the feature doesn't work?"
    a: "No. It means our own run on that device has not been recorded yet. The support claim itself comes from browser documentation and engine source."
  - q: "Why is there no device result yet?"
    a: "The manual device run has not been recorded. Each row in the matrix is a planned case, and its outcome, date and evidence appear there once it has been run."
  - q: "How can I check a claim on my own device?"
    a: "Open AwakeTab, press Start and read the pill. \"Screen awake\" appears only once your browser grants the lock, so the pill is the check."
honestLimit: "Device results are pending: every row in the matrix is planned, not done. Until a row is recorded, claims rest on documentation, engine source and automated tests."
related:
  - "/learn/browser-support-matrix"
  - "/learn/screen-wake-lock-api-guide"
  - "/learn/low-power-mode-and-wake-locks"
  - "/about"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## What does each claim rest on today?

Each fact comes from one of four places, and its page says when it was last checked.

::rows basis

When a browser changes, the matrix and the affected pages change with it, and the change is dated in the [changelog](/changelog).

## What did the source check find?

The version floors hold: Chrome and Edge 84, Opera 70, Samsung Internet 14, Firefox 126 and Safari 16.4. iPhone and iPad Home Screen web apps need iOS or iPadOS 18.4. In every engine the lock lasts only while the tab is visible, and a browser refuses it or takes it back for four reasons only: the page is hidden or inactive, a Permissions-Policy blocks it, Safari has had no recent tap, or Firefox is at 5 % battery or less and not charging. A page served over plain http has no wake lock at all, which is "unsupported" rather than a refusal.

::note savers

## What did the check correct?

The 26 September 2026 check found claims the sources did not support. They are fixed on every English page and in the translations.

::rows fixes

::ad

## What still needs a real device?

No document or source file can answer these. Until the device run, no page claims an answer.

::rows pending

A recorded row carries the date, the exact OS and browser version, the power state, the outcome and an evidence note.

## Sources

All checked 26 September 2026.

- [MDN browser-compat-data, WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json): version floors for every browser.
- [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/): Home Screen web apps.
- [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc): the only refusal checks in Chrome, Edge, Opera and Samsung Internet.
- [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp): Safari's tap rule.
- [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp): the 5 % battery rule.
- [Apple IOKit, kIOPMAssertionTypeNoDisplaySleep](https://developer.apple.com/documentation/iokit/kiopmassertiontypenodisplaysleep): no idle sleep while the display is held.
- [Apple Support, Low Power Mode](https://support.apple.com/en-us/101604): Auto-Lock set to 30 seconds.
- [Microsoft Learn, Energy saver](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/energy-saver): the Windows 11 24H2 rename.

## What this page does not tell you

A source check says what the browser is built to do, not what your device did today. Every browser still releases the lock when the tab is hidden, a closed laptop lid usually still sleeps the computer, and the device matrix below is still pending.

