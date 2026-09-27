---
title: "Keep your Android screen on in Chrome — AwakeTab"
description: "Chrome on Android keeps the screen on from a visible tab. Leaving Chrome releases it, and some phone makers' sleep lists can close Chrome after you leave."
h1: "Keep your Android screen on in Chrome"
crumb: "Android in Chrome"
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
lead: "Chrome 84 and later can keep your Android screen on while the AwakeTab tab is showing. Start a session and the screen stays lit for as long as you can see the tab. Leave Chrome and your normal screen timeout comes back, with nothing to undo and no app to install."
facts:
  - label: "Chrome"
    value: "84 or later"
  - label: "Samsung Internet"
    value: "14 or later"
  - label: "Screen timeout"
    value: "one setting for every app"
  - label: "Floating window"
    value: "not on Android"
toc:
  set-it-up-on-your-android-phone: "Set it up"
  which-android-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Chrome and tap Start"
    path: "Chrome › awaketab.com"
    text: "Pick a length or an \"Until…\" time, then tap Start. Wait for the pill to say \"Screen awake\"."
    shot: "AwakeTab in Chrome on Android with the pill reading Screen awake"
  - title: "Keep the tab on screen"
    path: "No Home, Recents or other apps"
    text: "Leaving Chrome or the tab ends the lock straight away, and the pill changes to \"Paused — tab hidden\". Come back and AwakeTab asks again."
    shot: "the pill after leaving Chrome and coming back"
  - title: "Optional: use split screen"
    path: "Recents › app icon › Split screen"
    text: "Put your recipe or notes in one half and AwakeTab in the other, so the tab stays on screen. The steps differ by phone maker."
    shot: "split screen with a recipe app and AwakeTab"
  - title: "Optional: change the phone's own timeout"
    path: "Settings › Display › Screen timeout"
    text: "On a Pixel with Android 16, the path is Settings › Display & touch › Screen timeout. It covers every app, and the longest choice depends on your phone."
    shot: "the Screen timeout choices in Settings"
matrix:
  label: "Android support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Chrome 84 or later, tab on screen"
      result: works
      label: "Supported"
      text: "The screen stays on while you can see the tab."
    - what: "Samsung Internet 14 or later"
      result: works
      label: "Supported"
      text: "Built on Chromium 87. See [keep screen on in Samsung Internet](/on/samsung-internet)."
    - what: "Home, Recents, another app or another tab"
      result: pauses
      label: "Pauses"
      text: "The lock ends at once. AwakeTab asks again when you return."
    - what: "Split screen with AwakeTab in one half"
      result: untested
      label: "Not yet tested"
      text: "The tab stays on screen, so it can keep the display lit while you read the other app."
    - what: "Older browser, or a plain http page"
      result: fallback
      label: "Video fallback"
      text: "No Screen Wake Lock API there. You can choose \"Tap to use the fallback\"."
rows:
  blockers:
    - title: "Sleeping-apps lists"
      text: "Some makers, Samsung's \"sleeping apps\" for example, can close Chrome after you leave it. They do not touch a tab you are looking at."
    - title: "Battery Saver"
      text: "Chrome does not refuse the wake lock because of it. It may shorten your timeout or dim the screen once you leave the tab."
    - title: "One timeout for the whole phone"
      text: "Stock Android has no per-app timeout, so a long one also drains the battery in your pocket."
      link:
        label: "Android screen timeout for one app"
        href: "/guides/android-screen-timeout-one-app"
    - title: "The power button"
      text: "Pressing it turns the screen off, whatever the tab asked for."
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

## Set it up on your Android phone

Four steps. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which Android setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the screen still goes dark, one of these is usually the reason.

::rows blockers
