---
title: "Do battery savers block a wake lock? — AwakeTab"
description: "No browser engine refuses a wake lock for battery saver; Firefox stops at 5 % battery. iPhone Low Power Mode does cap Auto-Lock at 30 seconds."
h1: "Do battery savers block a wake lock? Mostly, no"
intent: "low power mode wake lock"
secondaryQueries:
  - "battery saver wake lock"
  - "low power mode keep screen on"
  - "energy saver wake lock"
  - "wake lock notallowederror battery"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet"]
os: ["ios", "android", "windows"]
faq:
  - q: "Should I turn off Low Power Mode to keep my iPhone screen on?"
    a: "If the screen must stay on for more than 30 seconds without a touch, yes, at least until our device test shows whether Safari's wake lock holds under it. Turn it off in Settings > Battery, then set Auto-Lock in Settings > Display & Brightness."
  - q: "Does Chrome's Energy Saver stop a wake lock?"
    a: "No. Energy Saver limits background activity and some visual effects to save battery, and Chromium's wake lock code has no check for it. A visible tab can still keep the screen on while Energy Saver is active."
  - q: "My Firefox lock stopped with the battery nearly flat. Is that a bug?"
    a: "No, it's by design. Firefox refuses a new lock, and releases a held one, at 5 % battery or less while unplugged. Plug in, then start the session again so AwakeTab can ask the browser afresh."
honestLimit: "On iPhone, Low Power Mode sets Auto-Lock to 30 seconds. We have not yet recorded whether a Safari wake lock still keeps the screen on under it, so turn Low Power Mode off if the screen must stay on."
related:
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/learn/browser-support-matrix"
  - "/learn/screen-wake-lock-api-guide"
  - "/on/android-chrome"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

Mostly, no. Chrome, Edge, Samsung Internet and Safari never refuse a wake lock because a battery saver is on: their code has no such check. Firefox is the one exception, and only at 5 % battery or less while unplugged. Savers work on the device's own timeout instead: on an iPhone, Low Power Mode drops Auto-Lock to 30 seconds.

## A correction first

Earlier versions of this page said Low Power Mode and battery savers deny the wake lock. That was wrong, and the same claim is repeated across much of the web. On 26 September 2026 we read the wake lock code in all three browser engines, and none of them checks for a saver mode.

## What each browser engine checks

- **Chromium** (Chrome, Edge, Opera, Samsung Internet) refuses only when the page is hidden or inactive, or a Permissions-Policy blocks the feature. The permission is granted without a prompt, and nothing in that code reads the state of a saver mode, whether it is Battery Saver on a phone, Energy saver on Windows or Energy Saver inside Chrome ([wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc)).
- **WebKit** (Safari on Mac, iPhone and iPad) wants a recent tap, or an earlier one it remembers. There is no Low Power Mode check ([WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp)).
- **Gecko** (Firefox) refuses a new lock, and releases one it holds, when the battery is at 5 % or less and not charging. It has no other battery-saver check ([WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp)).

## What the operating system does

A saver mode works one level below the browser, on the operating system's own settings.

- **On iPhone, Low Power Mode** fixes Auto-Lock at 30 seconds and greys out the longer choices until you turn it off ([Apple Support](https://support.apple.com/en-us/101604), checked 26 September 2026). If Auto-Lock is stuck and Low Power Mode is off, a work or school profile may be setting it: see [iPhone Auto-Lock greyed out or stuck at 30 seconds](/guides/iphone-auto-lock-never-greyed-out).
- **Android Battery Saver** may shorten the screen timeout or dim the display, depending on the phone.
- **Windows Energy saver** (called Battery saver before Windows 11 24H2) may dim the screen or shorten timeouts to save power.

None of these is a refused request, so AwakeTab's pill would not show "Blocked — here's the fix" for them. If a saver overrides the screen timeout while the browser still holds the lock, the pill can say "Screen awake" while the screen dims. That is the case we most want to measure.

## What we have not tested yet

We have not yet recorded a device test for any of these; the results will appear on How we tested.

- Whether Safari's wake lock keeps an iPhone screen on while Low Power Mode is active.
- Whether Android Battery Saver, on Pixel and Samsung phones, turns the screen off despite a lock Chrome still holds.
- Whether Windows Energy saver dims or turns off a display that Chrome or Edge has asked to keep on.
- Whether Samsung Internet's and Edge's own efficiency modes change anything for a visible tab.

## What to do today

On iPhone, turn Low Power Mode off when the screen must stay on, then open AwakeTab in Safari and tap Start. On Android and Windows, keep the tab visible and watch the screen for the first few minutes; if it dims while the pill says "Screen awake", turn the saver off for that session. In Firefox, plug in before the battery reaches 5 %. [Keep your iPhone screen on in Safari](/on/iphone-safari) has the full iPhone steps.
