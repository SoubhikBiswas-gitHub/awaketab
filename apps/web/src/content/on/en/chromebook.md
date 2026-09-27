---
title: "Keep a Chromebook screen on — AwakeTab"
description: "Keep a Chromebook screen on from a Chrome tab. School or work policies can still force sleep; closing the lid sleeps unless that setting is off."
h1: "Keep a Chromebook screen on"
intent: "keep chromebook screen on"
secondaryQueries:
  - "stop chromebook screen turning off"
  - "chromebook keep awake extension"
  - "keep awake extension alternative"
  - "chromebook sleep when cover is closed"
preset: pinf
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome"]
os: ["chromeos"]
faq:
  - q: "Why are the power settings greyed out on my school Chromebook?"
    a: "Your school or employer manages the device, and its administrator sets the power rules from the Google Admin console. You cannot change them from the Chromebook. A visible AwakeTab tab may still help within those rules, but if the screen keeps going dark, ask the administrator."
  - q: "Is AwakeTab for Chrome the same as Google's Keep Awake extension?"
    a: "No. They are separate extensions from different developers that do a similar job. AwakeTab for Chrome has timers and a toolbar badge, and it also works in Edge on Windows and macOS. If Keep Awake already does what you need, there is no reason to switch."
  - q: "Can I work in another window while the tab keeps the screen on?"
    a: "Yes, if the AwakeTab window stays on screen. Snap two windows side by side by dragging one to the edge of the display, and work in the other."
  - q: "How do I keep the Chromebook running with the lid closed?"
    a: "Turn off \"Sleep when cover is closed\" in the Power settings, if your Chromebook is not managed. Neither the tab nor the extension can stop lid sleep on its own."
honestLimit: "A managed school or work Chromebook follows its administrator's power policy, which you cannot change. If that policy forces sleep or blocks extensions, neither the tab nor the extension can override it."
related:
  - "/for/classroom"
  - "/extension"
  - "/for/dashboards"
  - "/learn/browser-support-matrix"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

ChromeOS has its own switch: in Settings, the Power section can keep the display on while the Chromebook is idle. If you'd rather leave that alone, open AwakeTab in Chrome and tap Start: the display stays lit while that tab is showing. School and work Chromebooks may lock these settings. Closing the lid sleeps unless "Sleep when cover is closed" is turned off.

## ChromeOS power settings

1. Select the clock at the bottom right, then the gear icon to open Settings.
2. Find Power. On recent ChromeOS versions it sits under System preferences; older versions list it under Device.
3. Under the idle option, choose to keep the display on. Some versions offer separate choices for charging and for battery.
4. If you want the Chromebook to keep running when you close it, turn off "Sleep when cover is closed".

Labels can differ slightly between versions, and a managed Chromebook may grey them out.

## Why a tab instead of the setting

The ChromeOS setting stays until you change it back. A tab suits one task with an end: a lesson on the projector until 11:30, or a status board for a shift. Pick a length, an "Until…" time or ∞; the Chromebook returns to its own setting when you stop. [Keeping teacher laptops awake in class](/for/classroom) covers the classroom case, and [keeping a dashboard screen on](/for/dashboards) covers wall displays.

## Browser support on ChromeOS

Chrome has supported the Screen Wake Lock API since version 84 (July 2020), and Chromebooks receive Chrome updates with ChromeOS. A plain http page has no wake lock, so AwakeTab suggests its video fallback there ("Tap to use the fallback"). See the [browser support matrix](/learn/browser-support-matrix) for version details.

## Managed Chromebooks

Schools and companies set power and extension rules centrally. Those rules can force the screen off, force sleep or block extensions. AwakeTab does not work around them. If the pill never reaches "Screen awake", or the screen still sleeps, the policy is in charge.

## AwakeTab for Chrome on a Chromebook

A tab has to stay visible. AwakeTab for Chrome, the [extension](/extension), uses Chrome's own power setting instead, so it keeps the display on (Screen) or only the Chromebook awake (System) with the tab hidden, for as long as Chrome is running. It cannot stop sleep when the lid closes.

Google publishes its own Keep Awake extension for ChromeOS. As of September 2026 its Chrome Web Store listing shows about 1,000,000 users, and its last update was on 4 August 2023 (version 1.9). AwakeTab for Chrome is an actively maintained alternative with timers and a status badge. Both do the core job; choose the one that fits.

## What stops it on a Chromebook

- **Leaving the tab.** Open another tab in that window, or minimise it, and the lock is let go; the pill changes to "Paused — tab hidden".
- **Closing the lid.** The Chromebook sleeps unless "Sleep when cover is closed" is off.
- **Battery saver.** It may dim the screen, but Chrome has no battery-saver check on the wake lock.

## What we have checked

The Chromium source and the Chrome Web Store listing behind this page date from 26 September 2026. No Chromebook has been through our device run yet, so there is no result to show; /learn/how-we-tested will carry it.
