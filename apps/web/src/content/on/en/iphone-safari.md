---
title: "Keep your iPhone screen on in Safari — AwakeTab"
description: "Safari 16.4 and later can keep an iPhone screen on from a tab after one tap, while the tab stays in front. Low Power Mode can still force a 30-second lock."
h1: "Keep your iPhone screen on in Safari"
crumb: "iPhone in Safari"
intent: "keep iphone screen on safari"
secondaryQueries:
  - "keep iphone screen on without changing auto-lock"
  - "stop iphone screen turning off in safari"
  - "iphone safari wake lock"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["safari"]
os: ["ios"]
lead: "Safari 16.4 and later can keep your iPhone screen on while the AwakeTab tab is in front. Tap Keep awake once, because Safari only grants a wake lock after a tap. Switch apps and the lock is released until you come back."
facts:
  - label: "Safari"
    value: "16.4 or later"
  - label: "Home Screen web app"
    value: "iOS 18.4 or later"
  - label: "Extension"
    value: "not on iPhone"
toc:
  set-it-up-on-your-iphone: "Set it up"
  which-iphone-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Check your iOS version"
    path: "Settings › General › About"
    text: "Look at the iOS Version row. Safari gained the wake lock in iOS 16.4 (March 2023). On anything older, AwakeTab offers a video fallback after one tap instead."
    shot: "the About screen with the iOS Version row"
  - title: "Open AwakeTab in Safari and tap Keep awake"
    path: "Safari › awaketab.com"
    text: "Safari will not grant a wake lock until you touch the page, so the session always starts from your tap. Then watch the pill. It says \"Screen awake\" only once Safari has agreed."
    shot: "AwakeTab in Safari with the pill reading Screen awake"
  - title: "Keep the tab in front"
    path: "No app switching while it runs"
    text: "Going to the Home Screen, opening another app or pressing the side button hides the page. The pill changes to \"Paused — tab hidden\". Come back and AwakeTab asks Safari again by itself."
    shot: "the pill after switching away and back"
  - title: "Optional: add it to your Home Screen"
    path: "Share › Add to Home Screen"
    text: "From iOS 18.4 the Home Screen web app can hold the wake lock too, and it opens without the Safari toolbar. On iOS 26, sites you add open as web apps by default."
    shot: "the Share sheet with Add to Home Screen"
matrix:
  label: "iPhone Safari support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Safari 16.4 or later, tab in front"
      result: works
      label: "Supported"
      text: "Tap Keep awake once. Safari needs that tap before it grants the lock."
    - what: "Session started without a tap, for example after a reload"
      result: blocked
      label: "Blocked"
      text: "The pill says \"Blocked — here's the fix\". Tap Retry."
    - what: "Another app, another tab or the lock screen"
      result: pauses
      label: "Pauses"
      text: "The lock is released. It comes back when you return to the tab."
    - what: "Low Power Mode on"
      result: untested
      label: "Not yet tested"
      text: "Low Power Mode sets Auto-Lock to 30 seconds ([Apple support article 101604](https://support.apple.com/en-us/101604))."
    - what: "Home Screen web app, iOS 18.4 or later"
      result: works
      label: "Supported"
      text: "Same rules as Safari. The fix shipped in WebKit for iOS 18.4."
    - what: "Home Screen web app before iOS 18.4"
      result: "no"
      label: "Not supported"
      text: "Open AwakeTab in Safari instead."
    - what: "Site added to the Home Screen on iOS 26"
      result: works
      label: "Supported"
      text: "iOS 26 opens it as a web app by default, so the web app rules apply."
    - what: "Safari before 16.4"
      result: fallback
      label: "Video fallback"
      text: "Tap once to start it. It needs this tab visible and uses a little more battery."
    - what: "AwakeTab browser extension"
      result: "no"
      label: "Not available"
      text: "The extension is for desktop Chrome and Edge. There is no iPhone version."
rows:
  blockers:
    - title: "Low Power Mode"
      text: "It sets Auto-Lock to 30 seconds and greys out the longer choices, including Never."
      link:
        label: "Fix a greyed-out Auto-Lock"
        href: "/guides/iphone-auto-lock-never-greyed-out"
    - title: "A work or school profile"
      text: "A management profile can set a maximum Auto-Lock time that you cannot change."
      link:
        label: "Check for a profile"
        href: "/guides/iphone-auto-lock-never-greyed-out#step-3"
    - title: "No tap yet"
      text: "After a reload or a restored tab, Safari waits for a fresh tap before it grants the lock again."
    - title: "An old Home Screen web app"
      text: "Before iOS 18.4, web apps opened from the Home Screen cannot hold a wake lock."
      link:
        label: "Home Screen web apps"
        href: "/on/ios-home-screen"
faq:
  - q: "Why does my screen go dark after 30 seconds once I leave Safari?"
    a: "Low Power Mode is probably on. It sets Auto-Lock to 30 seconds, and once AwakeTab is not in front, Auto-Lock is in charge again. Turn Low Power Mode off in Settings › Battery if you need longer outside the tab."
  - q: "iOS reloaded the tab. Do I lose my session?"
    a: "No. AwakeTab remembers how much time you had left and offers to resume. Tap Resume: that tap is also what Safari needs before it grants a new wake lock."
  - q: "Should I use Safari or the Home Screen web app?"
    a: "Either works on iOS 18.4 or later. The web app opens full screen without the Safari toolbar, so there is less to tap by mistake. On older iOS, stay in Safari."
  - q: "How much battery does it use?"
    a: "Almost all of the cost is the lit screen itself. AwakeTab does very little while it waits. For a long session, plug in or turn the brightness down."
honestLimit: "AwakeTab needs Safari 16.4 or later and its tab in front. Opening another app, another tab or the lock screen releases the wake lock. Low Power Mode sets Auto-Lock to 30 seconds, and we have not yet confirmed on a real iPhone whether the tab holds past that."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/ios-home-screen"
  - "/learn/low-power-mode-and-wake-locks"
  - "/learn/screen-wake-lock-api-guide"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up on your iPhone

Four steps. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which iPhone setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the screen still dims, one of these is usually the reason. Each has its own fix.

::rows blockers
