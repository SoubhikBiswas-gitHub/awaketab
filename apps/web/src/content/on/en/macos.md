---
title: "Keep your Mac awake from a browser tab — AwakeTab"
description: "In Chrome or Edge, a visible tab keeps your Mac's display on, and the Mac does not idle-sleep while it does. Closing the lid still puts it to sleep."
h1: "Keep your Mac screen awake from a browser tab"
crumb: "Mac"
intent: "keep mac screen awake"
secondaryQueries:
  - "prevent mac display sleep"
  - "stop mac going to sleep chrome"
  - "keep macbook awake without app"
  - "pmset assertions browser"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "safari", "firefox"]
os: ["macos"]
lead: "Chrome, Edge, Safari and Firefox can all keep your Mac's display on from a visible tab. In Chrome or Edge, the Mac also does not idle-sleep while the display is held. Closing the lid still sleeps the Mac, unless it runs in clamshell mode with power and an external display."
facts:
  - label: "Chrome and Edge"
    value: "84 or later"
  - label: "Safari"
    value: "16.4 or later"
  - label: "Firefox"
    value: "126 or later"
  - label: "Admin rights"
    value: "not needed"
toc:
  set-it-up-on-your-mac: "Set it up"
  which-mac-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Chrome or Edge and press Start"
    path: "Chrome or Edge › awaketab.com"
    text: "Safari and Firefox keep the display on too, but Chrome and Edge also stop the Mac idle-sleeping. Wait for the pill to say \"Screen awake\"."
    shot: "AwakeTab in Chrome on a Mac with the pill reading Screen awake"
  - title: "Keep the tab visible"
    path: "No minimising while it runs"
    text: "The window can sit behind another app while part of it stays on screen. Minimise it or switch tabs and the pill changes to \"Paused — tab hidden\"."
    shot: "a small AwakeTab window beside another app"
  - title: "Check it in Terminal"
    path: "Terminal › pmset -g assertions"
    text: "Run `pmset -g assertions`. Look for a PreventUserIdleDisplaySleep or NoDisplaySleep line that names your browser. Hide the tab, run it again, and the line is gone."
    shot: "Terminal with the browser's display-sleep line"
  - title: "Optional: change the Mac's own timeout"
    path: "Apple menu › System Settings › Lock Screen"
    text: "This sets the display-off times for every app, with one for battery and one for the power adapter on a laptop. It stays changed until you set it back."
    shot: "the Lock Screen pane with the display-off times"
matrix:
  label: "Mac support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Chrome or Edge 84 or later, tab visible"
      result: works
      label: "Supported"
      text: "Holds a \"no display sleep\" power assertion, so the Mac does not idle-sleep either."
    - what: "Safari 16.4 or later, tab visible"
      result: works
      label: "Supported"
      text: "Keeps the display on after one click."
    - what: "Firefox 126 or later, tab visible"
      result: works
      label: "Supported"
      text: "Refuses at 5 % battery or less when unplugged."
    - what: "Window partly visible behind another app"
      result: works
      label: "Supported"
      text: "The lock holds. A window that is completely covered may count as hidden."
    - what: "Window minimised or another tab in front"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is back in front."
    - what: "Low Power Mode on"
      result: untested
      label: "Not yet tested"
      text: "Set in System Settings › Battery, it may shorten display timeouts."
    - what: "Lid closed"
      result: "no"
      label: "Not supported"
      text: "The Mac sleeps. Clamshell mode with power and an external display is the exception."
    - what: "AwakeTab browser extension"
      result: works
      label: "Supported"
      text: "[AwakeTab for Chrome](/extension), also for Edge, carries on with the tab hidden or the window minimised."
rows:
  blockers:
    - title: "Closing the lid"
      text: "The Mac sleeps, whatever the tab asked for, unless it is in clamshell mode."
      link:
        label: "Keep a Mac awake with the lid closed"
        href: "/guides/mac-prevent-sleep-lid-closed"
    - title: "A work Mac's lock rules"
      text: "A management profile can lock the screen on its own schedule. That is separate from display sleep, and a tab does not change it."
      link:
        label: "Lock screen versus display sleep"
        href: "/guides/lock-screen-vs-sleep"
    - title: "A hidden tab"
      text: "A minimised window or a different tab in front lets the display go. Bring the tab back and AwakeTab asks again."
faq:
  - q: "Does the Mac stay awake if the AwakeTab window is behind another app?"
    a: "Yes, as long as part of the window is still on screen and the AwakeTab tab is the one showing in it. The browser releases the wake lock when the window is minimised or you switch to a different tab in it, and a window that is completely covered may count as hidden too."
  - q: "Will a download or upload keep going while the display is held?"
    a: "In Chrome or Edge, yes: the Mac does not idle-sleep while the display is kept on, so network work carries on. It still stops if you close the lid, pause the session or hide the tab."
  - q: "Can a work Mac still lock while AwakeTab is running?"
    a: "It can. A management profile may set its own screen lock or screen saver rules, and those are separate from display sleep. AwakeTab keeps the display lit; it does not change any rule your organisation sets."
  - q: "Do I need admin rights on the Mac?"
    a: "No. The tab needs no install and no admin password. Checking it with pmset -g assertions also works from a normal Terminal window without sudo."
honestLimit: "A tab cannot keep a closed MacBook awake. Closing the lid sleeps the Mac unless it runs in clamshell mode with power and an external display, and hiding the tab releases the display too."
related:
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/vs/caffeine"
  - "/for/ai-agents"
  - "/learn/browser-support-matrix"
  - "/vs/caffeinate-command"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up on your Mac

Four steps. The screenshots are placeholders until real-device captures are recorded.

::steps

::ad

## Which Mac setups keep the screen on

Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded. Sources checked 26 September 2026.

::matrix

## What turns the screen off anyway

If the screen still goes dark, one of these is usually the reason.

::rows blockers
