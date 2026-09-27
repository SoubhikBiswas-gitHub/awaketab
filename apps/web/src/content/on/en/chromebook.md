---
title: "Keep a Chromebook screen on — AwakeTab"
description: "Keep a Chromebook screen on from a Chrome tab. School or work policies can still force sleep; closing the lid sleeps unless that setting is off."
h1: "Keep a Chromebook screen on"
crumb: "Chromebook"
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
lead: "Chrome on a Chromebook keeps the screen on from a visible AwakeTab tab. Tap Start and the display stays lit while the tab is showing, then the Chromebook goes back to its own setting when you stop. School and work Chromebooks follow their administrator's power rules, and closing the lid sleeps unless \"Sleep when cover is closed\" is off."
facts:
  - label: "Chrome"
    value: "84 or later"
  - label: "Extension"
    value: "AwakeTab for Chrome"
  - label: "Managed Chromebook"
    value: "admin rules apply"
toc:
  set-it-up-on-your-chromebook: "Set it up"
  which-chromebook-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Chrome and tap Start"
    path: "Chrome › awaketab.com"
    text: "Pick a length, an \"Until…\" time or ∞, then tap Start. Wait for the pill to say \"Screen awake\"."
    shot: "AwakeTab in Chrome on a Chromebook with the pill reading Screen awake"
  - title: "Keep the tab showing"
    path: "No minimising while it runs"
    text: "To work at the same time, drag another window to the edge of the display to snap the two side by side. Switch tabs or minimise, and the pill changes to \"Paused — tab hidden\"."
    shot: "two snapped windows with AwakeTab on one side"
  - title: "Optional: change the ChromeOS setting"
    path: "Clock › Settings › System preferences › Power"
    text: "Older versions list Power under Device. Under the idle option, choose to keep the display on. Labels differ slightly between versions, and a managed Chromebook may grey them out."
    shot: "the Power settings with the idle option"
matrix:
  label: "Chromebook support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Chrome 84 or later, tab showing"
      result: works
      label: "Supported"
      text: "Chromebooks receive Chrome updates with ChromeOS."
    - what: "Another tab in front, or the window minimised"
      result: pauses
      label: "Pauses"
      text: "The lock is let go until the tab is back."
    - what: "A plain http page"
      result: fallback
      label: "Video fallback"
      text: "There is no wake lock there, so AwakeTab suggests \"Tap to use the fallback\"."
    - what: "Managed school or work Chromebook"
      result: untested
      label: "Not yet tested"
      text: "Admin rules can force the screen off, force sleep or block extensions. AwakeTab does not work around them."
    - what: "AwakeTab for Chrome extension"
      result: works
      label: "Supported"
      text: "[AwakeTab for Chrome](/extension) uses Chrome's own power setting, so it keeps the display on (Screen) or only the Chromebook awake (System) with the tab hidden."
    - what: "Google's Keep Awake extension"
      result: works
      label: "Supported"
      text: "A separate extension from Google. In September 2026 its listing shows about 1,000,000 users and a last update on 4 August 2023 (version 1.9)."
rows:
  blockers:
    - title: "Closing the lid"
      text: "The Chromebook sleeps unless \"Sleep when cover is closed\" is off in the Power settings. The tab and the extension cannot stop lid sleep."
    - title: "An administrator's policy"
      text: "If the pill never reaches \"Screen awake\", or the screen still sleeps, the school or work policy is in charge. Only the administrator can change it."
      link:
        label: "Keep the classroom screen on"
        href: "/for/classroom"
    - title: "Battery saver"
      text: "It may dim the screen, but Chrome has no battery-saver check on the wake lock."
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

## Set it up on your Chromebook

Three steps. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which Chromebook setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the screen still goes dark, one of these is usually the reason.

::rows blockers
