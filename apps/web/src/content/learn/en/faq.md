---
title: "Questions about AwakeTab, answered — AwakeTab"
description: "Straight answers about AwakeTab: hidden tabs, closed lids, Teams status, iPhone Auto-Lock, the video fallback, battery use, price and your data."
h1: "AwakeTab FAQ: the questions we are asked most"
crumb: "FAQ"
intent: "awaketab faq"
secondaryQueries:
  - "does awaketab work in the background"
  - "does awaketab keep laptop awake with lid closed"
  - "is awaketab free"
  - "awaketab battery use overnight"
  - "why does my iphone lock with awaketab open"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "These are the questions people ask most about AwakeTab, with the short answer first and the detail after. Most of them come down to one rule: a web page can keep the display on while it is visible, and the browser and the operating system decide everything else."
toc:
  getting-started: "Getting started"
  tabs-windows-and-the-lid: "Tabs, windows and the lid"
  status-sleep-and-phones: "Status, sleep and phones"
  the-video-fallback-and-battery: "Fallback and battery"
  price-and-privacy: "Price and privacy"
rows:
  free:
    - title: "Every length"
      text: "15 minutes to 4 hours, until you stop it, until a clock time, or a custom length up to seven days."
    - title: "Every face and mode"
      text: "All four clock faces and every ambient mode: Standard, Clock, Focus, Minimal, Night and Cook."
    - title: "Stats and install"
      text: "Seven days of stats, and an offline install in eight languages."
    - title: "The extension"
      text: "[AwakeTab for Chrome](/extension) at Screen or System level."
faq:
  - q: "How do I know AwakeTab is working?"
    a: "Read the pill at the top of the tool. \"Screen awake\" appears only after your browser confirms the lock, so the pill itself is the check. Anything else names what happened instead."
  - q: "Which browsers does AwakeTab support?"
    a: "Chrome and Edge 84, Opera 70, Samsung Internet 14, Firefox 126 and Safari 16.4 hold the screen natively. iPhone and iPad Home Screen apps need iOS 18.4. Older browsers get the video fallback after a tap."
  - q: "Do I need to install anything?"
    a: "No. The tool is a web page and works offline after the first visit. **Install AwakeTab** in the header adds it to a home screen or dock, and the Chrome extension is optional."
honestLimit: "These answers describe what browsers are built to do, checked against their documentation and engine source on 26 September 2026. Our own device results are still pending, so a device can still surprise us."
related:
  - "/learn/how-awaketab-works"
  - "/learn/honest-limits"
  - "/learn/browser-support-matrix"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/extension"
author: soubhik
published: 2026-09-27
---

## Getting started

### How do I start a session?

[Open AwakeTab](/), pick a duration and press Start. The presets run from 15 minutes to 4 hours, **Until I stop** has no end time, **Until…** stops at a clock time, and **Custom…** takes any length up to seven days. On a keyboard, `1` to `6` pick the presets, `0` picks no end time, `U` opens the clock time and `Space` starts or stops.

### Can I make it stop at a certain time?

Yes. Choose **Until…** and pick the time. If that time has already passed today, the session ends at that time tomorrow, and the tool says so before you start. When the time comes you hear a chime and can extend or stop.

### What do the words on the pill mean?

The pill names one of seven states, from "Ready" to "Screen awake" to "Paused — tab hidden". Each has its own words, shape and colour, and it changes only when the browser answers. [How AwakeTab works](/learn/how-awaketab-works) lists all seven with what each one means.

### Does it work on a work laptop?

Usually, as long as the browser allows it and the tab stays visible. A work policy that locks the computer after some minutes without input is separate from display sleep, so it can still lock the screen. [Keep a work laptop display awake](/for/work-laptop) covers what to ask your IT team.

## Tabs, windows and the lid

### Does it still work if I switch tabs or minimise the window?

No. The browser releases the lock when the page is hidden, and switching tabs, minimising the window or changing apps all hide it. AwakeTab pauses, the pill reads "Paused — tab hidden", and it asks again as soon as the tab is visible.

For a display behind other windows, use the [AwakeTab extension for Chrome and Edge](/extension), which keeps working with the tab hidden, or the floating window. The floating window is a small always-on-top window in desktop Chrome and Edge 116 and later and in desktop Firefox 151 and later. Whether it keeps the screen on while its tab is hidden has not been checked on a device yet.

### Will it keep my laptop awake with the lid closed?

No, and neither will any other web page. What happens when the lid closes is an operating-system decision. Change it in your power settings, attach an external display, or use a native tool. [Keep a Mac awake with the lid closed: what works](/guides/mac-prevent-sleep-lid-closed) covers the Mac options step by step.

## Status, sleep and phones

### Does it keep Teams or Slack showing me as available?

No. Presence follows keyboard and mouse idle time, not a lit display, so Teams still shows you as Away after a few minutes without input. AwakeTab never sends synthetic input to change that. [Does keeping your screen on keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) explains what does set your status.

### Does it stop the whole computer from sleeping, or only the screen?

The screen is the guarantee. Idle system sleep is a separate policy the page cannot control, although Windows, and a Mac running Chrome, do not idle-sleep while the browser holds the display on. For a machine that stays awake with the display off, use a native utility such as PowerToys Awake or `caffeinate`.

### Why does my iPhone lock the screen anyway?

Low Power Mode forces a 30-second Auto-Lock. Turn it off in Settings, then Battery. Safari needs iOS 16.4 or later, and a Home Screen web app needs iOS 18.4. Below those versions, AwakeTab offers the video fallback. [Keep your iPhone screen on in Safari](/on/iphone-safari) has the full steps.

## The video fallback and battery

### What is the video fallback, and when does it run?

It is a silent one-frame video loop, so the browser treats media as playing and keeps the display on. It runs only when there is no Screen Wake Lock API, and only after you tap. The pill then says "Awake via video fallback". It needs the tab visible and uses a little more battery than a native lock.

### How much battery does it use, and can I leave it running overnight?

The lock itself costs almost nothing; the lit screen is what drains the battery. Plug in, dim the display, and consider the [night clock](/for/night-clock) on an OLED screen. In Chrome and Edge, **Stop automatically on low battery** in settings ends the session before the battery runs out.

## Price and privacy

### Is it free, and what happens to my data?

Free, with no sign-up. Settings, the current session and your stats stay in this browser, with no cookies and no fingerprinting. Anonymous first-party usage events carry no identifiers, and **Share anonymous usage data** in settings turns them off. There are no ads on the awake screen, now or later.

All of this is free, with no account:

::rows free

### Where are my notes kept, and does voice typing send my words anywhere?

Notes stay in this browser on this device, in its own storage (IndexedDB). They are never uploaded, there is no account or sync, and they work offline. Clearing the site's data in your browser deletes them, so export a note as `.md` or `.txt` when you want a copy. The notepad's mic uses your browser's speech recognition: in Chrome and Edge your voice goes to the browser's speech service (Google or Microsoft) to be turned into text, and Safari uses Apple's. AwakeTab itself sends nothing and keeps only the text you save. Firefox has no speech recognition, so the mic is hidden there. Press `N` to open the notes.

Ready to try it? [Open AwakeTab](/), pick a duration and watch the pill.

::limit inline
