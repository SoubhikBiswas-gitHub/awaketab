---
title: "Keep your iPhone screen on in Safari — AwakeTab"
description: "Safari 16.4 and later can keep an iPhone screen on from a tab after one tap, while the tab stays in front. Low Power Mode can still force a 30-second lock."
h1: "Keep your iPhone screen on in Safari"
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
faq:
  - q: "Why does a shared AwakeTab link still ask me to tap on iPhone?"
    a: "Safari grants a wake lock only after a recent tap on the page. A link such as /30m, or one ending in ?autostart=1, picks the length for you but still needs one tap the first time. Until then the pill stays at \"Ready\"."
  - q: "Can AwakeTab keep the screen on while I read a recipe in another app?"
    a: "No. An iPhone shows one app at a time, and iOS lets go of the wake lock as soon as the AwakeTab tab is off screen. For a recipe in another app, lengthen Auto-Lock while you cook, or use the recipe site's own cook mode if it has one."
  - q: "What happens if I press the side button during a session?"
    a: "The iPhone locks straight away, whatever the tab asked for. A wake lock only holds off the automatic Auto-Lock timer. Open the phone again, go back to Safari and check the pill: if it does not return to \"Screen awake\", tap Start once more."
  - q: "Should I add AwakeTab to my Home Screen?"
    a: "Only on iOS 18.4 or later; before that, a Home Screen web app had no wake lock. On iOS 26, sites added to the Home Screen open as web apps by default. In Safari itself, iOS 16.4 is enough."
honestLimit: "The screen stays on only while Safari and the AwakeTab tab are in front. Open another app or tab, or press the side button, and your iPhone falls back to its normal Auto-Lock time."
related:
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/for/cooking"
  - "/on/ipad"
  - "/learn/browser-support-matrix"
  - "/on/ios-home-screen"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

On iOS 16.4 or later, open AwakeTab in Safari and tap Start. The screen stays on while the tab is in front. Switch apps or tabs and iOS releases it; come back and the pill shows the real state. Low Power Mode sets Auto-Lock to 30 seconds. We are still testing whether a wake lock holds under it, and will post the result here.

## Try the iPhone setting first

To keep the phone lit for everything, change Auto-Lock:

1. Open Settings > Display & Brightness > Auto-Lock.
2. Choose a longer time, or Never.
3. Change it back afterwards, or the battery drains fast.

If Auto-Lock is greyed out, [iPhone Auto-Lock greyed out or stuck at 30 seconds](/guides/iphone-auto-lock-never-greyed-out) covers the two causes: Low Power Mode and a work or school profile.

## When a Safari tab is the better choice

A tab suits the times you would rather leave Auto-Lock alone: a work phone, a borrowed phone, or a task that needs the screen for half an hour and no longer. Pick a length or an "Until…" clock time and tap Start. When the session ends, the phone returns to its usual lock time, with nothing to undo.

## Safari support on iPhone

| Where you open AwakeTab | Can keep the screen on? | What to know |
|---|---|---|
| Safari on iOS 16.4 or later (March 2023) | Yes, after one tap | The tab must stay in front |
| Home Screen web app | iOS 18.4 or later | iOS 26 opens Home Screen sites as web apps by default |
| Safari before iOS 16.4 | No Screen Wake Lock API | AwakeTab offers "Tap to use the fallback" |

Other browsers and versions are in the [wake lock support table](/learn/browser-support-matrix).

## What stops it on an iPhone

- **Leaving the tab.** Going to the Home Screen, opening another app or switching Safari tabs releases the wake lock at once. The pill shows "Paused — tab hidden", and those minutes do not count toward your timer.
- **Low Power Mode.** Apple says it "sets Auto-Lock to 30 seconds" ([Apple Support](https://support.apple.com/en-us/101604), checked 26 September 2026). Safari itself has no Low Power Mode check, but whether the screen stays on with it turned on is not yet tested.
- **No tap yet.** Safari refuses a wake lock that no tap started. If a shared link opens and nothing changes, tap Start.
- **Full screen and the floating window.** Neither is available here: iPhone Safari has no floating window, and element full screen works on iPad only.

## One screen, one app

This is the catch for cooking and reading. If your recipe sits in another app or tab, the AwakeTab tab cannot keep the screen on for it, because it is no longer in front. For a recipe you follow step by step, [cook mode on a propped-up tablet](/for/cooking) works better, and [Keep an iPad display awake](/on/ipad) shows how to put AwakeTab beside the recipe there.

## What we have checked

The sources behind this page (Apple Support, the WebKit source and MDN's compatibility data) were checked on 26 September 2026. There is no iPhone device result yet; it will appear on /learn/how-we-tested when the device run is complete.
