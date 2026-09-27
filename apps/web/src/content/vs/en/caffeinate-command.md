---
title: "caffeinate vs a wake-lock tab — AwakeTab"
description: "caffeinate keeps a Mac awake from Terminal with nothing on screen. AwakeTab keeps the display on from a visible tab and shows its state. Which fits."
h1: "AwakeTab vs caffeinate"
crumb: "caffeinate"
intent: "caffeinate command alternative"
preset: pinf
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari"]
os: ["macos"]
lead: "If the job runs in Terminal, such as a build, a script or an AI agent, use `caffeinate`: it is built into macOS, holds the Mac awake whatever window is in front, and lets go when the command exits. If you want a button, a session that ends at a set time, or a status you can read at a glance, AwakeTab does that from a visible browser tab."
toc:
  side-by-side: "Side by side"
  when-caffeinate-is-the-better-choice: "When caffeinate is better"
  when-awaketab-is-the-better-choice: "When AwakeTab is better"
  neither-one-keeps-a-closed-macbook-awake: "A closed MacBook"
  check-which-one-is-holding-your-mac-awake: "Check which one holds it"
compare:
  label: "AwakeTab compared with the macOS caffeinate command, checked 26 September 2026"
  what: "What"
  cols:
    - name: "AwakeTab"
      us: true
    - name: "caffeinate"
  rows:
    - what: "How it keeps the Mac awake"
      cells: ["Screen Wake Lock API; Chrome holds a \"no display sleep\" power assertion", "A power assertion from Terminal: `-i` stops idle sleep, `-di` also keeps the display on"]
    - what: "With the tab hidden or the window covered"
      cells: ["Stops. The pill says \"Paused — tab hidden\" and asks again when you return.", "Keeps holding, whatever window is in front"]
    - what: "Screen off, Mac awake"
      cells: ["No, it keeps the display on", "Yes, with `caffeinate -i`"]
    - what: "When it ends"
      cells: ["At the time you pick, or when you stop it", "When you press Control-C, or when the command it runs exits"]
    - what: "What you see"
      cells: ["A pill that says \"Screen awake\" only once the browser grants the lock", "The Terminal window running it"]
    - what: "With the lid closed"
      cells: ["Sleeps, unless in clamshell mode", "Sleeps, unless in clamshell mode"]
      same: true
    - what: "Install"
      cells: ["None, open a web page", "None, part of macOS"]
    - what: "Platforms"
      cells: ["Chrome and Edge 84+, Firefox 126+, Safari 16.4+", "macOS"]
    - what: "Facts checked"
      cells: ["26 September 2026", "26 September 2026"]
      same: true
picks:
  them:
    - title: "The job is a command in Terminal"
      text: "Put it in front of the command: `caffeinate -i npm run build` or `caffeinate -i claude`. The Mac stays awake until the command exits, then lets go by itself."
    - title: "You want the Mac awake with the screen off"
      text: "`caffeinate -i` holds off idle sleep and lets the display turn off. A wake lock always keeps the display lit."
    - title: "You work full screen in other apps"
      text: "caffeinate works whatever window is in front. A browser tab loses its lock the moment you switch away."
  us:
    - title: "You'd rather press a button"
      text: "No Terminal and no flags. Open the page, pick a length and press Start."
    - title: "You want it to end at a time"
      text: "Pick 30 min, 1 h or a clock time such as 11:30 AM. Hidden time doesn't count toward a timed session."
    - title: "You want to see that it's working"
      text: "The pill turns to \"Screen awake\" once your browser has granted the lock, not when you press the button."
    - title: "You are not on a Mac"
      text: "AwakeTab works in Chrome and Edge on Windows, in Chrome on Android, and in Safari 16.4 or later on iPhone and iPad."
    - title: "You want a hidden tab to count"
      text: "On desktop Chrome or Edge, [AwakeTab for Chrome](/extension) uses Chrome's own power setting, so it keeps working with the tab hidden."
faq:
  - q: "What is the difference between caffeinate -i and caffeinate -di?"
    a: "`caffeinate -i` keeps the Mac awake and lets the screen turn off. `caffeinate -di` also stops display sleep, so the screen stays lit until you press Control-C. Either one can wrap a command, such as `caffeinate -di codex`."
  - q: "Does caffeinate keep a MacBook awake with the lid closed?"
    a: "Not with its usual options. Closing the lid is not idle time, so the Mac sleeps anyway unless it is in clamshell mode with power and an external display."
  - q: "Can I run caffeinate and AwakeTab at the same time?"
    a: "Yes. Each one makes its own request, and the Mac stays awake while either stands. If the Mac still won't sleep after AwakeTab stops, check for a Terminal window still running caffeinate."
honestLimit: "caffeinate holds off idle and display sleep from Terminal with nothing on screen. AwakeTab needs its tab to stay visible, so for unattended jobs use caffeinate or AwakeTab for Chrome."
related:
  - "/for/ai-agents"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/on/macos"
  - "/vs/caffeine"
  - "/vs/amphetamine"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Side by side

Both hold a power assertion, a note to macOS that says "don't sleep yet". `caffeinate` creates one from Terminal; Chrome creates the same kind while a visible page keeps the screen on. The difference is what ends it: a command or Control-C for caffeinate, the tab's visibility and your chosen time for AwakeTab. Rows marked Same are real ties.

::compare

::ad

## When caffeinate is the better choice

It is the operating system's own tool, and for these jobs it is the simplest fix.

::picks them

## When AwakeTab is the better choice

These are the jobs AwakeTab was built for.

::picks us

## Neither one keeps a closed MacBook awake

Closing the lid is a direct request to sleep, not idle time, so caffeinate with its usual options, the browser and AwakeTab for Chrome all stop there. The exception is clamshell mode, with power and an external display: see [keeping a Mac awake with the lid closed](/guides/mac-prevent-sleep-lid-closed).

## Check which one is holding your Mac awake

Run `pmset -g assertions` in Terminal. It lists every process asking macOS not to sleep. `caffeinate -i` shows up as PreventUserIdleSystemSleep. With AwakeTab showing "Screen awake" in Chrome, the browser holds a PreventUserIdleDisplaySleep or NoDisplaySleep entry. Hide the tab, run it again, and the browser's line is gone.
