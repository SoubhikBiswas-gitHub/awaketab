---
title: "Keep the screen on in Microsoft Edge — AwakeTab"
description: "Edge 84 and later keep the screen on from a visible tab, like Chrome. Sleeping tabs only affect tabs in the background, not the one you see."
h1: "Keep the screen on in Microsoft Edge"
crumb: "Microsoft Edge"
intent: "keep screen on edge"
secondaryQueries:
  - "stop edge screen turning off"
  - "edge sleeping tabs keep screen on"
  - "microsoft edge wake lock"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["edge"]
os: ["windows", "macos", "linux", "android"]
lead: "Edge 84 and later keep the screen on from a visible tab, on Windows, macOS, Linux and Android. Edge shares Chrome's engine, so the wake lock behaves the same way. Sleeping tabs only put background tabs to sleep, never the AwakeTab tab you can see. To keep the screen on with the tab hidden, the AwakeTab extension also runs in Edge."
facts:
  - label: "Edge"
    value: "84 or later"
  - label: "Sleeping tabs"
    value: "background tabs only"
  - label: "Energy saver"
    value: "does not refuse the lock"
  - label: "Extension"
    value: "Edge 116 or later"
toc:
  set-it-up-in-edge: "Set it up"
  which-edge-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Edge and press Start"
    path: "Edge › awaketab.com"
    text: "Pick a length or an \"Until…\" time, then press Start. The pill reads \"Starting…\" while Edge answers, then \"Screen awake\" once it has agreed."
    shot: "AwakeTab in Edge with the pill reading Screen awake"
  - title: "Keep the tab visible"
    path: "No minimising while it runs"
    text: "The window does not need focus, so a small one on a second monitor works while you type on the first. Minimise it or switch tabs and the pill changes to \"Paused — tab hidden\"."
    shot: "a small Edge window with AwakeTab on a second monitor"
  - title: "Check it on Windows"
    path: "Right-click Start › Terminal (Admin)"
    text: "Run `powercfg /requests` and look for Edge under DISPLAY. On a Mac, run `pmset -g assertions` in Terminal and look for a display-sleep line that names Edge. Hide the tab, run it again, and the entry is gone."
    shot: "powercfg output with Edge listed under DISPLAY"
  - title: "Optional: keep it on with the tab hidden"
    path: "awaketab.com/extension › Get it for Edge"
    text: "AwakeTab for Chrome also installs in Edge 116 or later. It asks the browser itself to keep the display on, so it carries on with the tab hidden or the window minimised."
    shot: "the AwakeTab extension popup in the Edge toolbar"
matrix:
  label: "Edge support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Edge 84 or later on Windows, macOS or Linux, window visible"
      result: works
      label: "Supported"
      text: "The same version floor as Chrome. The window can be visible without focus."
    - what: "Sleeping tabs turned on"
      result: works
      label: "Supported"
      text: "Only tabs in the background sleep. The tab you can see keeps its lock."
    - what: "Windows Energy saver on"
      result: works
      label: "Supported"
      text: "Chromium has no Energy saver check, so the lock is not refused. The screen may still dim."
    - what: "Efficiency mode on"
      result: untested
      label: "Not yet tested"
      text: "We have not yet checked whether it changes anything for a visible tab."
    - what: "Window minimised or another tab in front"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is back in front."
    - what: "Edge on Android, tab on screen"
      result: works
      label: "Supported"
      text: "Leaving Edge releases the lock, as it does in Chrome."
    - what: "AwakeTab browser extension, Edge 116 or later"
      result: works
      label: "Supported"
      text: "[AwakeTab for Chrome](/extension) keeps the screen on with the tab hidden or the window minimised."
rows:
  blockers:
    - title: "Locking the PC"
      text: "A locked Windows PC hides the tab and uses its own 60-second monitor timeout."
      link:
        label: "Windows 11 screen turns off after 1 minute"
        href: "/guides/windows-11-screen-turns-off-after-1-minute"
    - title: "Closing the lid"
      text: "Windows follows its lid-close setting, and a Mac sleeps unless it runs in clamshell mode. No tab changes that."
    - title: "A work screen lock policy"
      text: "A managed PC can lock the screen on its own schedule, separate from display sleep."
      link:
        label: "Lock screen versus display sleep"
        href: "/guides/lock-screen-vs-sleep"
    - title: "A hidden tab"
      text: "A minimised window or another tab in front lets the display go. Bring the tab back and AwakeTab asks again."
faq:
  - q: "Will sleeping tabs put the AwakeTab tab to sleep?"
    a: "Not while you can see it. Sleeping tabs only affect background tabs, and once you switch away, Edge releases the wake lock anyway. AwakeTab asks again when you come back."
  - q: "Does Energy saver stop Edge keeping the screen on?"
    a: "No. Chromium's wake lock code has no Energy saver check, so the lock is not refused. Energy saver, called Battery saver before Windows 11 24H2, may still dim the screen."
  - q: "Can AwakeTab stop by itself when my battery runs low in Edge?"
    a: "Yes. Edge tells pages the battery level, so you can pick a level in AwakeTab's settings and the session ends there. Firefox and Safari do not share the battery level with pages."
  - q: "Will this keep Teams showing me as Available?"
    a: "No. Teams sets you to Away after about 5 minutes without keyboard or mouse input, whatever the screen does. AwakeTab never moves the mouse or presses keys."
honestLimit: "Edge 84 and later hold the lock only while the tab is visible. Sleeping tabs affect only background tabs, and Energy saver may dim the screen but does not refuse the lock. Minimise the window, lock the PC or close the lid and Edge lets the screen go."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/extension"
  - "/guides/lock-screen-vs-sleep"
  - "/learn/does-a-wake-lock-keep-teams-green"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up in Edge

Two steps start a session. The last two are an optional check and a way to keep the screen on with the tab hidden.

::steps

::ad

## Which Edge setups keep the screen on

Sources: browser documentation and Chromium's code, checked 26 September 2026. Real-device results appear once recorded.

::matrix

## What turns the screen off anyway

Edge can only hold the display while its tab is showing. These still end the session.

::rows blockers
