---
title: "Keep an iPad display awake — AwakeTab"
description: "Safari on iPadOS 16.4 or later keeps an iPad display on from a visible tab after one tap. Low Power Mode sets Auto-Lock to 30 seconds."
h1: "Keep an iPad display awake"
crumb: "iPad in Safari"
intent: "keep ipad screen on"
secondaryQueries:
  - "ipad auto-lock never"
  - "keep ipad awake for sheet music"
  - "stop ipad screen turning off safari"
preset: p60
mode: minimal
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["safari"]
os: ["ipados"]
lead: "Safari on iPadOS 16.4 or later can keep your iPad display on while the AwakeTab tab is visible. Tap Start once, because Safari only grants a wake lock after a tap. When you stop, switch tabs or leave Safari, the iPad goes back to its Auto-Lock time."
facts:
  - label: "Safari"
    value: "iPadOS 16.4 or later"
  - label: "Home Screen web app"
    value: "iPadOS 18.4 or later"
  - label: "Full screen"
    value: "iPad only, not iPhone"
  - label: "Low Power Mode"
    value: "Auto-Lock 30 seconds"
toc:
  set-it-up-on-your-ipad: "Set it up"
  which-ipad-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Safari and tap Start"
    path: "Safari › awaketab.com"
    text: "Safari will not grant a wake lock until you tap, even from a shared /1h link. Wait for the pill to say \"Screen awake\"."
    shot: "AwakeTab in Safari on iPad with the pill reading Screen awake"
  - title: "Keep AwakeTab beside your score or recipe"
    path: "Windowed apps › tile Safari beside the other app"
    text: "On iPadOS 26, tile Safari next to the other app, or use Slide Over, back in iPadOS 26.1. On iPadOS 18 and earlier, use Split View. The AwakeTab window can be small; it only needs to be on screen."
    shot: "Safari tiled beside a score app"
  - title: "Optional: go full screen"
    path: "AwakeTab header › Fullscreen"
    text: "Safari on iPad lets a page go full screen, which iPhone Safari does not. The clock or countdown fills the display, readable from across the room."
    shot: "a full-screen AwakeTab clock on iPad"
  - title: "Optional: change Auto-Lock instead"
    path: "Settings › Display & Brightness › Auto-Lock"
    text: "Pick a longer time or Never. On a shared iPad, a changed setting is easy to forget, which is why a tab suits one rehearsal or one recipe."
    shot: "the Auto-Lock choices in Settings"
matrix:
  label: "iPad Safari support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Safari on iPadOS 16.4 or later, tab visible"
      result: works
      label: "Supported"
      text: "Tap Start once. Safari needs that tap before it grants the lock."
    - what: "Safari tiled beside another app, or in Slide Over"
      result: untested
      label: "Not yet tested"
      text: "The tab stays on screen. We have not yet recorded which layouts keep the lock on a real iPad."
    - what: "Another app fills the screen, or another Safari tab"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is visible again."
    - what: "Low Power Mode on"
      result: untested
      label: "Not yet tested"
      text: "It sets Auto-Lock to 30 seconds."
    - what: "Home Screen web app, iPadOS 18.4 or later"
      result: works
      label: "Supported"
      text: "Earlier versions have no wake lock there, so use Safari."
    - what: "Safari before iPadOS 16.4"
      result: fallback
      label: "Video fallback"
      text: "No Screen Wake Lock API. You will see \"Tap to use the fallback\"."
rows:
  blockers:
    - title: "Low Power Mode"
      text: "It sets Auto-Lock to 30 seconds and greys out the longer choices."
      link:
        label: "Fix a greyed-out Auto-Lock"
        href: "/guides/iphone-auto-lock-never-greyed-out"
    - title: "A work or school profile"
      text: "It can cap Auto-Lock, and only its administrator can change it."
      link:
        label: "Check for a profile"
        href: "/guides/iphone-auto-lock-never-greyed-out#step-3"
    - title: "No tap yet"
      text: "Safari waits for a tap before it grants the lock."
    - title: "Closing the cover or pressing the top button"
      text: "Either locks the iPad straight away."
faq:
  - q: "Which layout keeps AwakeTab beside my music on iPadOS 26?"
    a: "Use windowed apps and tile Safari next to your score app, or open Safari in Slide Over, which returned in iPadOS 26.1. Split View is the name on iPadOS 18 and earlier."
  - q: "Why does my school iPad still lock after two minutes?"
    a: "A school or work profile can cap Auto-Lock, and only its administrator can change it. You can see installed profiles in Settings > General > VPN & Device Management. A visible AwakeTab tab may help within those rules, but it does not change them."
  - q: "Does the screen stay on if my score app fills the whole screen?"
    a: "No. If the score app covers the display, Safari is no longer visible and iPadOS releases the wake lock. Keep a small AwakeTab window on screen beside it, or change Auto-Lock for the length of the rehearsal."
  - q: "Is the iPad any different from an iPhone here?"
    a: "Two things. An iPad can show more than one app, so AwakeTab can stay visible next to a recipe or score. And Safari on iPad lets a page go full screen, which iPhone Safari does not allow for page elements."
honestLimit: "The display stays on only while the AwakeTab tab is visible. If another app fills the screen or you switch Safari tabs, the iPad falls back to its Auto-Lock time, which Low Power Mode cuts to 30 seconds."
related:
  - "/for/cooking"
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/for/sheet-music"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up on your iPad

Four steps. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which iPad setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the display still goes dark, one of these is usually the reason.

::rows blockers
