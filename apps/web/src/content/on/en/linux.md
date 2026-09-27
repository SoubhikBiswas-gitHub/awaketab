---
title: "Keep the screen on in Linux — AwakeTab"
description: "Keep a Linux screen on from a visible Chrome, Edge or Firefox tab. The browser asks the desktop not to blank, and your desktop decides whether it holds."
h1: "Keep the screen on in Linux"
crumb: "Linux"
intent: "keep screen on linux browser"
secondaryQueries:
  - "stop linux screen blanking in browser"
  - "keep screen awake ubuntu chrome"
  - "linux idle inhibit browser"
preset: pinf
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["linux"]
lead: "Chrome and Edge 84 and later, and Firefox 126 and later, can keep a Linux screen on while the AwakeTab tab is visible. The browser asks your desktop not to blank the screen. Whether that holds depends on the desktop, which has to honour the GNOME SessionManager or freedesktop ScreenSaver inhibit. We have not yet recorded real-device results on Linux."
facts:
  - label: "Chrome and Edge"
    value: "84 or later"
  - label: "Firefox"
    value: "126 or later"
  - label: "Your desktop"
    value: "must honour the inhibit"
  - label: "Device results"
    value: "not yet recorded"
toc:
  set-it-up-on-linux: "Set it up"
  which-linux-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Chrome, Edge or Firefox and press Start"
    path: "Browser › awaketab.com"
    text: "Pick a length, or leave it running until you stop it, then press Start. The pill says \"Screen awake\" once the browser has granted the lock."
    shot: "AwakeTab in Chrome on a Linux desktop with the pill reading Screen awake"
  - title: "Keep the window visible"
    path: "No minimising while it runs"
    text: "Minimise the window or switch tabs and the browser releases the lock. The pill changes to \"Paused — tab hidden\", and AwakeTab asks again when you come back."
    shot: "the pill after minimising and restoring the window"
  - title: "Wait past your blank time once"
    path: "Leave the machine alone for longer than the blank delay"
    text: "The pill reports what the browser answered, not what the desktop did. So the first time, stay away for longer than your screen-blank delay. If the screen stays on, your desktop honours the request."
    shot: "a Linux desktop still lit past its blank delay"
  - title: "If it still blanks, try the other engine"
    path: "Chrome or Edge, then Firefox"
    text: "On Linux, Chrome and Edge ask over D-Bus, through GNOME SessionManager or the freedesktop PowerManagement and ScreenSaver services. Firefox is a separate engine with its own code, so it is worth one try."
    shot: "AwakeTab open in Firefox beside Chrome"
matrix:
  label: "Linux support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Chrome or Edge 84 or later, desktop honours the inhibit"
      result: works
      label: "Supported"
      text: "Chromium asks the desktop over D-Bus not to go idle."
    - what: "Firefox 126 or later, window visible"
      result: works
      label: "Supported"
      text: "Refuses at 5 % battery or less while not charging."
    - what: "A desktop without GNOME SessionManager or freedesktop inhibit"
      result: untested
      label: "Not yet tested"
      text: "The browser may grant the lock while the desktop still blanks the screen."
    - what: "Window minimised or another tab in front"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is back in front."
    - what: "Firefox before 126"
      result: fallback
      label: "Video fallback"
      text: "Tap once to start it. It needs this tab visible and uses a little more battery."
rows:
  blockers:
    - title: "A desktop that ignores the request"
      text: "The pill can say \"Screen awake\" while the desktop blanks anyway, because the browser cannot make it listen."
    - title: "A hidden tab"
      text: "A minimised window or another tab in front lets the display go. Bring it back and AwakeTab asks again."
    - title: "A low battery in Firefox"
      text: "At 5 % or less and not charging, Firefox refuses the lock."
      link:
        label: "Keep the screen on in Firefox"
        href: "/on/firefox"
    - title: "A screen lock with its own schedule"
      text: "A managed machine can lock the screen on its own timer, separate from display sleep."
      link:
        label: "Lock screen versus display sleep"
        href: "/guides/lock-screen-vs-sleep"
faq:
  - q: "Does it work on Wayland and X11?"
    a: "Those are display protocols, not desktops, so they are not what decides it. What matters is whether your desktop implements GNOME SessionManager or freedesktop ScreenSaver inhibit, because that is what the browser asks."
  - q: "The pill says Screen awake, but the screen still blanked. Why?"
    a: "The pill shows the browser's answer. The browser granted the lock, but your desktop did not keep the screen on. Try the other engine, or change your desktop's own blank delay for this session."
  - q: "Can AwakeTab stop by itself on low battery on a Linux laptop?"
    a: "In Chrome and Edge, yes: they share the battery level with pages, so you can pick a level in AwakeTab's settings. Firefox removed that API in version 52, so there it cannot."
  - q: "Have you tested this on a Linux machine?"
    a: "Not yet. The support rows come from browser documentation and source code. Real-device results will appear in the table once they are recorded."
honestLimit: "The screen stays on only while the tab is visible and only if your desktop honours the browser's sleep inhibit (GNOME SessionManager or freedesktop ScreenSaver). Real-device results for Linux are still pending."
related:
  - "/on/firefox"
  - "/learn/browser-support-matrix"
  - "/learn/screen-wake-lock-api-guide"
  - "/guides/lock-screen-vs-sleep"
  - "/for/dashboards"
author: soubhik
published: 2026-09-09
updated: 2026-09-28
---

## Set it up on Linux

Two steps start a session. The next two tell you whether your desktop is listening, and what to try if it is not.

::steps

::ad

## Which Linux setups keep the screen on

These results come from Chromium's and Firefox's source and browser documentation, checked 26 September 2026. They depend on your desktop, and no Linux device run is recorded yet.

::matrix

## What turns the screen off anyway

If the screen still blanks, one of these is usually the reason.

::rows blockers
