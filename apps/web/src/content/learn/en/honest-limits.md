---
title: "Honest limits: what AwakeTab cannot do — AwakeTab"
description: "A wake lock holds the display while its tab is visible. It cannot beat a closed lid, change your Teams status or stop system sleep. Here is each limit."
h1: "Honest limits: what AwakeTab cannot do"
crumb: "Honest limits"
intent: "what awaketab cannot do"
secondaryQueries:
  - "keep screen awake website not working"
  - "why does my screen still turn off with awaketab"
  - "wake lock limitations"
  - "can a website stop my computer sleeping"
  - "keep screen on in background tab"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "AwakeTab keeps the display on while its tab is visible, and nothing more. A hidden tab, a closed lid, a phone's Low Power Mode and your organisation's lock policy all keep their own rules, and no web page can overrule them. This page lists each limit, why it exists, and what to use instead when it matters."
toc:
  what-are-the-limits-at-a-glance: "At a glance"
  why-does-a-hidden-tab-lose-the-lock: "Hidden tabs"
  why-does-closing-the-lid-still-sleep-the-computer: "Closing the lid"
  why-does-my-phone-still-lock-the-screen: "Phones and batteries"
  does-awaketab-change-my-chat-status: "Chat status"
  is-display-sleep-the-same-as-system-sleep: "Display vs system sleep"
  what-other-rules-sit-outside-a-wake-lock: "Other software"
  when-is-something-else-the-better-tool: "Better tools"
rows:
  limits:
    - title: "A hidden tab cannot hold a wake lock."
      text: "Switching apps, minimising or changing tabs pauses the session. That is a platform rule."
    - title: "Closing the lid still puts the machine to sleep."
      text: "No web page or extension can change that. It takes an OS setting, an external display or a native tool."
    - title: "Low Power Mode shortens Auto-Lock."
      text: "iPhone Low Power Mode forces a 30-second Auto-Lock, whatever a web page asks for."
    - title: "It does not touch your chat status."
      text: "Teams, Slack and Zoom presence follows keyboard and mouse idle time, not the display."
    - title: "Display sleep is not system sleep."
      text: "A wake lock holds the screen, not the whole computer."
    - title: "Other software keeps its own rules."
      text: "Bank logouts, proctoring apps, monitors and lock-screen policies are outside a wake lock's reach."
  outside:
    - title: "A bank or email logout"
      text: "Websites sign you out after their own period of inactivity. A lit screen does not count as activity to them."
    - title: "A proctoring or exam app"
      text: "These apps set their own rules about other tabs and windows. Follow what the exam allows."
    - title: "A monitor that sleeps on lost signal"
      text: "If the monitor loses its signal it turns itself off, whatever the computer asks for. [Second monitor keeps turning off: how to fix it](/guides/second-monitor-turns-off) covers cables and settings."
    - title: "A corporate lock-screen policy"
      text: "A rule that locks the computer after some minutes of no input is separate from display sleep. [Lock screen versus display sleep](/guides/lock-screen-vs-sleep) explains the difference."
faq:
  - q: "Can AwakeTab keep the screen on with its tab in the background?"
    a: "Not the web version. Every browser releases a wake lock when the page is hidden. [AwakeTab for Chrome](/extension) uses Chrome's power API instead, so it keeps working with the tab hidden in Chrome and Edge on desktop."
  - q: "Why do you list the limits so plainly?"
    a: "Because a keep-awake tool that fails quietly is worse than none. If the screen went dark during a talk or a recipe, you should know why and what to do next, not find out afterwards."
  - q: "Will these limits change?"
    a: "Some might, when browsers change. When one does, the support matrix and the affected pages are updated, and the change is dated in the changelog."
honestLimit: "Each limit here comes from browser documentation, engine source and vendor support pages, checked on 26 September 2026. Our own device results are still pending, so a device may behave differently in a case nobody has recorded yet."
related:
  - "/learn/how-awaketab-works"
  - "/learn/faq"
  - "/learn/low-power-mode-and-wake-locks"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/extension"
author: soubhik
published: 2026-09-27
---

## What are the limits at a glance?

A wake lock is a request from a web page to keep the display on. The browser grants it while the page is visible, and the operating system honours it within its own rules. Everything outside that is out of reach for any web page, AwakeTab included.

::rows limits

The rest of this page takes each limit in turn. When one of them stops a session, the pill says so instead of pretending: you see "Paused — tab hidden" or "Blocked — here's the fix", never a false "Screen awake".

## Why does a hidden tab lose the lock?

Browsers release a wake lock as soon as its page is hidden, so a background tab cannot keep a screen on for a page you are not looking at. Switching apps, minimising the window, changing tabs and locking a phone all count as hidden.

AwakeTab pauses when that happens and asks again when the tab is visible. A window that is on screen but not focused keeps its lock, so you can put AwakeTab beside the document you are reading.

Full-screen slides are the case that catches people out: the presentation covers the tab, so the tab counts as hidden. In desktop Chrome and Edge 116 and later, and desktop Firefox 151 and later, the floating window keeps AwakeTab visible on top of the slides. The extension, a second window or a longer display timeout for the talk also work. [Keep the screen on while presenting](/for/presentations) covers each option.

For a display that must stay awake behind other windows, use the [AwakeTab extension for Chrome and Edge](/extension). It uses Chrome's own power API, which does not depend on a visible tab.

## Why does closing the lid still sleep the computer?

Closing the lid is an operating-system decision, and no web page or extension can change it. On a Mac, clamshell mode with power and an external display keeps it running. On Windows, the lid setting lives in the power options. On a Chromebook, turn off "Sleep when cover is closed" in the power settings, unless a school or work policy has locked it. A native tool can also hold the machine awake. [Keep a Mac awake with the lid closed: what works](/guides/mac-prevent-sleep-lid-closed) walks through each option.

## Why does my phone still lock the screen?

iPhone Low Power Mode forces a 30-second Auto-Lock, and it applies whatever a web page asks for. Turn it off in Settings, then Battery, and the normal Auto-Lock comes back. [Do battery savers block a wake lock? Mostly, no](/learn/low-power-mode-and-wake-locks) explains what each phone and browser does.

Firefox has one battery rule of its own. At 5 % battery or less, while not charging, it turns down new wake locks and releases a held one. The pill then reads "Blocked — here's the fix" and names the cause. Plug in and start again.

## Does AwakeTab change my chat status?

No. Teams, Slack and Zoom work out your presence from keyboard and mouse idle time, your calls and your calendar, not from the display. A lit screen is not activity to them. AwakeTab never simulates input to fake it. [Does keeping your screen on keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) covers what does set your status, and how to tell colleagues where you are.

## Is display sleep the same as system sleep?

No. A wake lock holds the screen, not the whole computer. On Windows, and on a Mac running Chrome, the computer does not idle-sleep while the browser holds the display on, but that is a side effect of the lit screen rather than a promise. If you need the machine awake with the screen off, for a long download or a build, use a native utility such as PowerToys Awake on Windows or `caffeinate` on a Mac.

## What other rules sit outside a wake lock?

Plenty of software keeps its own clock, and a wake lock does not reach any of it:

::rows outside

## When is something else the better tool?

AwakeTab is instant and needs no installation, which makes it right for a recipe, a talk or a dashboard you can see. A native utility beats it when the screen must stay on with the browser out of sight, or when the whole machine must stay awake. The [comparisons](/vs) set out, with dated facts, when each tool is the better pick. For everything AwakeTab does do, [open the tool](/) and read the pill.

::limit inline
