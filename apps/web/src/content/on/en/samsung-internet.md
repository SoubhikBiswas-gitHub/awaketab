---
title: "Keep the screen on in Samsung Internet — AwakeTab"
description: "Samsung Internet 14 and later keep the screen on from a visible tab. Power-saving settings can close the browser after you leave it."
h1: "Keep your screen on in Samsung Internet"
crumb: "Samsung Internet"
intent: "keep screen on samsung internet"
secondaryQueries:
  - "samsung internet wake lock"
  - "stop galaxy screen turning off in browser"
  - "samsung internet screen timeout"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["samsung-internet"]
os: ["android"]
lead: "Samsung Internet 14 and later can keep your Android screen on while the AwakeTab tab is showing. It is built on Chromium 87, so the wake lock works as it does in Chrome. Leave the browser and your normal screen timeout comes back, and Samsung's power-saving settings can close the browser once you have left it."
facts:
  - label: "Samsung Internet"
    value: "14 or later"
  - label: "Built on"
    value: "Chromium 87"
  - label: "Screen timeout"
    value: "one setting for every app"
  - label: "Floating window"
    value: "not on Android"
toc:
  set-it-up-in-samsung-internet: "Set it up"
  which-samsung-internet-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Samsung Internet and tap Start"
    path: "Samsung Internet › awaketab.com"
    text: "Pick a length or an \"Until…\" time, then tap Start. Wait for the pill to say \"Screen awake\" before you put the phone down."
    shot: "AwakeTab in Samsung Internet with the pill reading Screen awake"
  - title: "Keep the tab on screen"
    path: "No Home, Recents or other apps"
    text: "Leaving the browser or switching tabs ends the lock at once, and the pill changes to \"Paused — tab hidden\". Come back and AwakeTab asks again."
    shot: "the pill after leaving Samsung Internet and coming back"
  - title: "Optional: use split screen"
    path: "Recents › app icon › Split screen"
    text: "Put your recipe or notes in one half and AwakeTab in the other, so the tab stays on screen. The exact steps differ between phones and Android versions."
    shot: "split screen with a notes app and AwakeTab"
  - title: "Optional: change the phone's own timeout"
    path: "Settings › Display › Screen timeout"
    text: "This covers every app on the phone, and the longest choice depends on the model. A long timeout also drains the battery in your pocket."
    shot: "the Screen timeout choices in Settings"
matrix:
  label: "Samsung Internet support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Samsung Internet 14 or later, tab on screen"
      result: works
      label: "Supported"
      text: "The screen stays on while you can see the tab."
    - what: "Home, Recents, another app or another tab"
      result: pauses
      label: "Pauses"
      text: "The lock ends at once. AwakeTab asks again when you return."
    - what: "Split screen with AwakeTab in one half"
      result: untested
      label: "Not yet tested"
      text: "The tab stays on screen, so it should keep the display lit beside the other app."
    - what: "Samsung power saving on"
      result: untested
      label: "Not yet tested"
      text: "We have not yet checked on a device whether it changes anything for a visible tab."
    - what: "Samsung Internet before 14"
      result: fallback
      label: "Video fallback"
      text: "No Screen Wake Lock API there. You can choose \"Tap to use the fallback\"."
    - what: "Chrome 84 or later on the same phone"
      result: works
      label: "Supported"
      text: "The same rules. See [keep your Android screen on in Chrome](/on/android-chrome)."
    - what: "AwakeTab browser extension"
      result: "no"
      label: "Not available"
      text: "The extension is for desktop Chrome and Edge. There is no Android version."
rows:
  blockers:
    - title: "Sleeping-apps lists"
      text: "Samsung's \"sleeping apps\" settings can close the browser after you leave it. They do not touch a tab you are looking at."
    - title: "One timeout for the whole phone"
      text: "Android has no per-app timeout, so a long one keeps the screen on for every app."
      link:
        label: "Android screen timeout for one app"
        href: "/guides/android-screen-timeout-one-app"
    - title: "Leaving the browser"
      text: "Home, Recents or a notification that opens another app hides the tab and releases the lock."
    - title: "The power button"
      text: "Pressing it turns the screen off, whatever the tab asked for."
faq:
  - q: "Why was my session gone when I came back to Samsung Internet?"
    a: "Samsung's power-saving settings can close the browser once it is in the background. AwakeTab restores a session after the page reloads, so check the pill. If it keeps happening, look for the list of apps that should never sleep in your phone's battery settings and add Samsung Internet."
  - q: "Is Samsung Internet any different from Chrome here?"
    a: "Not in how the lock works. Both are built on Chromium, and both hold the wake lock only while the tab is on screen. The version floors differ: Samsung Internet 14 and Chrome 84."
  - q: "Does Samsung's power saving stop the screen staying on?"
    a: "We have not tested it on a Galaxy phone yet. Chromium's wake lock code has no battery-saver check, but Samsung's own settings are not covered by that, so the table marks it as not yet tested."
  - q: "Can I use AwakeTab's floating window on my phone?"
    a: "No. The floating window needs a desktop browser feature that Android browsers lack. Split screen is the nearest option, since it keeps the tab on screen beside another app."
honestLimit: "Samsung Internet 14 and later (Chromium 87 base) hold the lock only while the tab is on screen. Leave the browser and your normal timeout returns, and Samsung's sleeping-apps settings can close the browser after you leave it."
related:
  - "/on/android-chrome"
  - "/guides/android-screen-timeout-one-app"
  - "/for/cooking"
  - "/learn/browser-support-matrix"
author: soubhik
published: 2026-09-09
updated: 2026-09-28
---

## Set it up in Samsung Internet

Two steps start a session. The last two are optional ways to keep the tab in view or change the phone's own setting.

::steps

::ad

## Which Samsung Internet setups keep the screen on

These results come from browser documentation and Chromium's source, checked 26 September 2026. Real-device results on a Galaxy phone appear here once recorded.

::matrix

## What turns the screen off anyway

If the screen still goes dark, one of these is usually why.

::rows blockers
