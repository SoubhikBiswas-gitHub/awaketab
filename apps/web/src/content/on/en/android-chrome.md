---
title: "Keep your Android screen on in Chrome — AwakeTab"
description: "Chrome on Android keeps the screen on from a visible tab. Leaving Chrome releases it, and some phone makers' sleep lists can close Chrome after you leave."
h1: "Keep your Android screen on in Chrome"
intent: "keep android screen on chrome"
secondaryQueries:
  - "stop android screen turning off"
  - "android keep screen on while browsing"
  - "chrome android screen timeout"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome"]
os: ["android"]
faq:
  - q: "Can I set a longer screen timeout for Chrome only?"
    a: "Not on stock Android: Screen timeout is one setting for the whole phone. AwakeTab gets close to a per-app timeout for the browser, because the screen stays on only while its Chrome tab is on screen and your normal timeout returns when you leave."
  - q: "Does Battery Saver stop Chrome keeping the screen on?"
    a: "No. Chrome has no Battery Saver check on the wake lock, so it is not refused. Battery Saver may still shorten your timeout or dim the display, which changes what happens after the session ends or once you leave the tab."
  - q: "Why was my session gone when I came back to Chrome?"
    a: "Some phones close apps they think you have stopped using, and Chrome can be one of them once it is in the background. AwakeTab restores a session after the page reloads, so check the pill. If it keeps happening, look for your phone maker's list of apps that should never sleep and add Chrome."
  - q: "Can I use AwakeTab's floating window on Android?"
    a: "No. The floating window needs a desktop browser feature that Chrome for Android lacks. Split screen is the nearest option, since it keeps the tab on screen beside another app."
honestLimit: "The screen stays on only while Chrome, with the AwakeTab tab showing, is on screen. Press Home or open another app and your phone goes back to its normal screen timeout."
related:
  - "/for/cooking"
  - "/learn/browser-support-matrix"
  - "/on/iphone-safari"
  - "/guides/android-screen-timeout-one-app"
  - "/on/samsung-internet"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

Android's own control is Settings > Display > Screen timeout (on a Pixel with Android 16, Settings > Display & touch > Screen timeout), and it applies to every app. For one task, open AwakeTab in Chrome 84 or later and start a session: your phone keeps the screen on for as long as that tab is showing, and your normal timeout comes back when you leave Chrome.

## Change the screen timeout

1. Open Settings.
2. Tap Display. On a Pixel with Android 16, tap Display & touch.
3. Tap Screen timeout and choose a longer time. The longest choice depends on your phone.

Stock Android has one timeout for the whole phone, not one per app. A long timeout also drains the battery in your pocket, which is why many people set it back.

## When a Chrome tab is the better choice

A tab helps when you want the screen on for one job and your usual timeout everywhere else: a countdown while you cook, a clock face across the room, a dashboard during a shift. Pick a length or an "Until…" time. When the session ends, the phone goes back to its own setting with nothing for you to undo, and there is no app to install.

## Browser support on Android

| Browser | Keeps the screen on from a tab? | What to know |
|---|---|---|
| Chrome 84 or later (July 2020) | Yes | The tab must be on screen |
| Samsung Internet 14 or later | Yes | Built on Chromium 87 |
| Older browsers, or a plain http page | No Screen Wake Lock API | You can choose "Tap to use the fallback" |

The [support matrix for every browser](/learn/browser-support-matrix) has the sources.

## Use split screen to keep another app in view

Android can show two apps at once. Put your recipe or notes app in one half and Chrome, with AwakeTab, in the other. The tab stays on screen, so it can keep the display lit while you read the other app. How you open split screen differs by maker: usually from the Recents view, by tapping an app's icon and choosing split screen. We have not yet recorded a device test of split screen, and will add it to the device results when we do.

For kitchen use on a phone, [cook mode: keep your screen on while you cook](/for/cooking) explains the one-screen catch and what to do about it.

## What stops it on Android

- **Leaving Chrome or the tab.** Home, Recents, another app or another tab end the wake lock straight away. You will see "Paused — tab hidden" until you return, and AwakeTab asks again then.
- **Sleeping-apps lists.** Some makers, Samsung's "sleeping apps" for example, can close Chrome in the background after you leave it. They do not touch a tab you are looking at.
- **Battery Saver.** Chrome does not refuse the wake lock because of it. Battery Saver may shorten the timeout or dim the screen.
- **The power button.** Pressing it turns the screen off, whatever the tab asked for.

## What we have checked

Chromium's wake lock source and Google's Android settings names were checked on 26 September 2026. No Android phone result is on record yet. Device results will be posted on /learn/how-we-tested.
