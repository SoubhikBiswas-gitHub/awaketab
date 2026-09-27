---
title: "Keep the screen on in Windows 11 and 10 — AwakeTab"
description: "Chrome or Edge keeps a Windows 11 or 10 screen on from a visible tab. Energy saver does not refuse it, and closing the lid follows your lid setting."
h1: "Keep the screen on in Windows 11 and 10"
crumb: "Windows 11 and 10"
intent: "keep screen on windows 11"
secondaryQueries:
  - "keep screen on windows 10"
  - "stop screen turning off windows 11"
  - "windows 11 screen timeout"
  - "keep laptop screen on without admin rights"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["windows"]
lead: "Chrome and Edge 84 and later keep a Windows 11 or 10 screen on from a visible tab, and Windows does not idle-sleep while they do. You need no install and no admin rights. Minimise the window, lock the PC or close the lid, and Windows follows its own settings again."
facts:
  - label: "Chrome and Edge"
    value: "84 or later"
  - label: "Firefox"
    value: "126 or later"
  - label: "Admin rights"
    value: "not needed"
  - label: "Extension"
    value: "Chrome and Edge"
toc:
  set-it-up-on-your-pc: "Set it up"
  which-windows-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Chrome or Edge and press Start"
    path: "Chrome or Edge › awaketab.com"
    text: "Pick a length or an \"Until…\" time, then press Start. Wait for the pill to say \"Screen awake\"."
    shot: "AwakeTab in Edge on Windows 11 with the pill reading Screen awake"
  - title: "Keep the window visible"
    path: "No minimising while it runs"
    text: "The window does not need focus, so a small one on a second monitor works while you type on the first. Minimise it or switch tabs and the pill changes to \"Paused — tab hidden\"."
    shot: "a small AwakeTab window on a second monitor"
  - title: "Check it with powercfg"
    path: "Right-click Start › Terminal (Admin)"
    text: "Run `powercfg /requests`. On Windows 10, use Windows PowerShell (Admin). Your browser should be listed under DISPLAY. Hide the tab, run it again, and the entry is gone."
    shot: "powercfg output with the browser under DISPLAY"
  - title: "Optional: change the Windows timeout"
    path: "Settings › System › Power & battery"
    text: "Open Screen, sleep & hibernate timeouts (Screen and sleep on older builds) and pick longer times, or Never. On Windows 10 it is Settings › System › Power & sleep."
    shot: "the screen timeout choices in Windows 11 Settings"
matrix:
  label: "Windows support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Chrome or Edge 84 or later, window visible"
      result: works
      label: "Supported"
      text: "Asks Windows for a display-required power request, so the PC does not idle-sleep either."
    - what: "Visible window without focus, or on a second monitor"
      result: works
      label: "Supported"
      text: "The lock holds while you work in another window."
    - what: "Firefox 126 or later, window visible"
      result: works
      label: "Supported"
      text: "Refuses when the battery is at 5 % or less and not charging."
    - what: "Energy saver on"
      result: works
      label: "Supported"
      text: "It does not refuse the wake lock, but it may dim the screen. Windows 11 24H2 renamed Battery saver to Energy saver."
    - what: "Window minimised or another tab in front"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is back."
    - what: "PC locked"
      result: pauses
      label: "Pauses"
      text: "A locked PC hides the tab and turns the monitor off after 60 seconds."
    - what: "AwakeTab browser extension"
      result: works
      label: "Supported"
      text: "[AwakeTab for Chrome](/extension), also for Edge, keeps the screen on with the window minimised."
rows:
  blockers:
    - title: "Locking the PC"
      text: "Windows uses a separate 60-second lock-screen timeout, and your normal screen setting does not change it."
      link:
        label: "Windows 11 screen turns off after 1 minute"
        href: "/guides/windows-11-screen-turns-off-after-1-minute"
    - title: "Closing the lid"
      text: "The laptop follows Control Panel › Power Options › Choose what closing the lid does. No tab or extension changes that."
    - title: "A work screen lock policy"
      text: "A sign-in policy can lock the screen on its own schedule. It is separate from display sleep."
      link:
        label: "Lock screen versus display sleep"
        href: "/guides/lock-screen-vs-sleep"
faq:
  - q: "Is anything different on Windows 10?"
    a: "Only the Settings path: System > Power & sleep instead of Power & battery. Chrome and Edge keep the display on the same way from a visible tab, and on Windows 10 Chrome also asks Windows to keep the system itself awake."
  - q: "Why does the screen go dark a minute after I lock the PC?"
    a: "When the PC is locked, Windows uses a separate lock-screen display timeout of 60 seconds, and your normal screen setting does not change it. A locked PC also hides the tab. Microsoft documents a powercfg setting for this timeout; the one-minute guide has the steps."
  - q: "Do I need admin rights to use AwakeTab on a work laptop?"
    a: "No. The tab needs no install and no admin rights. Only the optional check, powercfg /requests, needs an administrator terminal. If your company sets a screen lock policy, that policy still applies."
  - q: "Can I keep the tab on a second monitor while I work on the first?"
    a: "Yes. A window that is visible but not focused keeps the display on, so a small AwakeTab window on another monitor works while you type on the first."
honestLimit: "The tab has to stay visible. Minimise the window, lock the PC or close the lid, and Windows follows its own screen, lock-screen and lid settings again."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/vs/powertoys-awake"
  - "/for/work-laptop"
  - "/extension"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up on your PC

Four steps. Where Windows 10 differs, the step says so. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which Windows setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the screen still goes dark, one of these is usually the reason.

::rows blockers
