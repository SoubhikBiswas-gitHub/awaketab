---
title: "Keep an iOS Home Screen app awake — AwakeTab"
description: "Keep an iPhone Home Screen web app awake. The wake lock there needs iOS 18.4 or later and one tap; on older iOS, use AwakeTab in Safari."
h1: "Keep an iOS Home Screen app awake"
crumb: "iPhone Home Screen app"
intent: "keep screen on iphone web app"
secondaryQueries:
  - "iphone home screen web app keep screen on"
  - "ios pwa wake lock"
  - "add to home screen keep awake iphone"
preset: pinf
mode: clock
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["safari"]
os: ["ios", "ipados"]
lead: "From iOS 18.4, AwakeTab added to your Home Screen can keep the iPhone screen on while the app is open in front. Tap Start once, because iOS only grants a wake lock after a tap. On iOS 26, sites you add to the Home Screen open as web apps by default. Before iOS 18.4, web apps cannot hold the lock, so use AwakeTab in Safari instead."
facts:
  - label: "Home Screen web app"
    value: "iOS 18.4 or later"
  - label: "Safari instead"
    value: "iOS 16.4 or later"
  - label: "iOS 26"
    value: "added sites open as web apps"
  - label: "Low Power Mode"
    value: "Auto-Lock 30 seconds"
toc:
  set-it-up-on-your-home-screen: "Set it up"
  which-home-screen-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Check your iOS version"
    path: "Settings › General › About"
    text: "Look at the iOS Version row. Home Screen web apps gained the wake lock in iOS 18.4, through a WebKit fix. On anything older, skip the Home Screen and use Safari."
    shot: "the About screen with the iOS Version row"
  - title: "Add AwakeTab to your Home Screen"
    path: "Safari › Share › Add to Home Screen"
    text: "Open awaketab.com in Safari first. The icon opens AwakeTab without the Safari toolbar, and on iOS 26 it opens as a web app by default."
    shot: "the Share sheet with Add to Home Screen"
  - title: "Open the app and tap Start"
    path: "Home Screen › AwakeTab"
    text: "iOS will not grant a wake lock until you touch the page, so the session always starts from your tap. The pill says \"Screen awake\" only once iOS has agreed."
    shot: "the AwakeTab web app with the pill reading Screen awake"
  - title: "Keep the app in front"
    path: "No app switching while it runs"
    text: "Going Home, opening another app or pressing the side button releases the lock, and the pill changes to \"Paused — tab hidden\". Open the app again and AwakeTab asks again by itself."
    shot: "the pill after switching away and back"
matrix:
  label: "Home Screen web app support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Home Screen web app, iOS 18.4 or later, app in front"
      result: works
      label: "Supported"
      text: "Tap Start once. The same rules as Safari apply."
    - what: "Site added to the Home Screen on iOS 26"
      result: works
      label: "Supported"
      text: "iOS 26 opens it as a web app by default, so the web app rules apply."
    - what: "Home Screen web app before iOS 18.4"
      result: "no"
      label: "Not supported"
      text: "Open [AwakeTab in Safari](/on/iphone-safari) instead. Safari 16.4 or later holds the lock."
    - what: "Session started without a tap, for example after a reload"
      result: blocked
      label: "Blocked"
      text: "The pill says \"Blocked — here's the fix\". Tap Retry."
    - what: "Home Screen, another app or the lock screen"
      result: pauses
      label: "Pauses"
      text: "The lock is released. It comes back when you return to the app."
    - what: "Low Power Mode on"
      result: untested
      label: "Not yet tested"
      text: "WebKit has no check for it. It sets Auto-Lock to 30 seconds, which takes over once you leave the app."
    - what: "iPad Home Screen web app, iPadOS 18.4 or later"
      result: works
      label: "Supported"
      text: "The same rules. See [keep an iPad display awake](/on/ipad)."
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
      text: "After iOS reloads the app, it waits for a fresh tap before it grants the lock again."
    - title: "An iOS version before 18.4"
      text: "The web app opens, but it cannot hold a wake lock. Safari can."
      link:
        label: "Keep your iPhone screen on in Safari"
        href: "/on/iphone-safari"
faq:
  - q: "Should I use the Home Screen app or Safari?"
    a: "Either works on iOS 18.4 or later. The Home Screen app opens without the Safari toolbar, which suits a bedside clock. On older iOS, only Safari can keep the screen on."
  - q: "iOS reloaded the app. Do I lose my session?"
    a: "No. AwakeTab remembers how much time you had left and offers to resume. Tap Resume: that tap is also what iOS needs before it grants a new wake lock."
  - q: "Why does the screen go dark after 30 seconds once I leave the app?"
    a: "Low Power Mode is probably on. It sets Auto-Lock to 30 seconds, and once AwakeTab is not in front, Auto-Lock is in charge again. Turn Low Power Mode off in Settings › Battery if you need longer outside the app."
  - q: "Can the screen stay on while I use another app?"
    a: "Not from AwakeTab. iOS releases the wake lock as soon as the app is not in front. For that, change Settings › Display & Brightness › Auto-Lock instead, and set it back afterwards."
honestLimit: "The wake lock in a Home Screen web app needs iOS 18.4 or later, one tap and the app in front. Switching apps or locking the iPhone releases it, and Low Power Mode sets Auto-Lock to 30 seconds. On older iOS, open AwakeTab in Safari instead."
related:
  - "/on/iphone-safari"
  - "/on/ipad"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/learn/low-power-mode-and-wake-locks"
  - "/for/night-clock"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up on your Home Screen

Four steps. The first tells you whether the Home Screen app can hold the lock at all.

::steps

::ad

## Which Home Screen setups keep the screen on

These results come from WebKit's release notes and bug tracker and Apple's support pages, checked 26 September 2026. Real-device results appear once recorded.

::matrix

## What turns the screen off anyway

If the screen still dims with the app open, one of these is usually the reason.

::rows blockers
