---
title: "Keep the screen on while presenting — AwakeTab"
description: "Full-screen slides hide the AwakeTab tab, so the browser stops keeping the screen on. Use the floating window, AwakeTab for Chrome or a longer timeout."
h1: "Keep the screen on while presenting"
intent: "keep screen on during presentation"
secondaryQueries:
  - "stop laptop screen turning off during presentation"
  - "projector turns off during presentation"
  - "keep screen awake powerpoint"
  - "keep mac awake during keynote"
preset: p120
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["windows", "macos", "chromeos", "linux"]
faq:
  - q: "My slides app is in full screen. Why did the pill change?"
    a: "Full screen covers the AwakeTab tab, and browsers only keep the screen on for a page you can see. The pill reads “Paused — tab hidden” until the tab is visible again."
  - q: "Will the audience see AwakeTab on the projector?"
    a: "Only if you put it there. With an extended display, keep the floating window or the AwakeTab window on your laptop screen and the slides on the projector. When you mirror the display, the floating window shows on both, so drag it into a corner or rely on AwakeTab for Chrome instead."
  - q: "Can I stop it at the end of the talk without touching the laptop?"
    a: "Yes. Tap “Until…” before you start and pick the end of your slot, such as 11:30 AM. In Settings, set “When time is up” to “Just stop” and the end sound to None, so no prompt or chime lands in the Q&A."
  - q: "Does a longer display timeout on a shared lectern PC cause problems?"
    a: "It can, because the next person inherits it. If you change the timeout for your talk, put it back afterwards. A tab or the extension leaves the settings alone and stops when you tell it to."
honestLimit: "Full-screen slides hide the AwakeTab tab, and then the screen follows its normal timeout. The projector follows that same timeout. Keep AwakeTab visible in a floating window or second window, or use AwakeTab for Chrome."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/guides/lock-screen-vs-sleep"
  - "/for/classroom"
  - "/extension"
  - "/guides/second-monitor-turns-off"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

Yes, AwakeTab can keep the screen on while you present, with one catch. When your slides go full screen, they hide the AwakeTab tab, and the browser stops keeping the screen on. So keep AwakeTab visible another way: the floating window in desktop Chrome, Edge or Firefox; AwakeTab for Chrome, which works with the tab hidden; a second window on your own screen; or a longer display timeout for the talk.

## Why full-screen slides stop it

A browser keeps the screen on only for a page that is visible. PowerPoint, Keynote or Google Slides in full screen covers the AwakeTab tab, so the browser releases the wake lock and the pill says "Paused — tab hidden". From that moment, your computer's normal display timeout is running again.

## Four ways to keep it on

| Option | Where it works | What to know |
|---|---|---|
| Floating window | Desktop Chrome and Edge 116 or later, Firefox 151 or later | A small window that stays on top of other windows. Not in Safari or on Android |
| AwakeTab for Chrome | Chrome and Edge on a computer | Uses Chrome's power setting, so the tab can be hidden or minimised |
| A second window on your screen | Any browser, with an extended display | Slides full screen on the projector, AwakeTab visible on the laptop |
| A longer display timeout | Any computer where you can change settings | Free and certain, but remember to set it back |

**The floating window** is the quickest. Open it with the "Floating window" button in the AwakeTab header; the browser may ask you to allow pop-ups for awaketab.com. Whether it keeps the screen on while full-screen slides cover the main AwakeTab tab has not been device-tested yet; we will publish that result on our how-we-tested page. Until then, run the check in the last section before the talk.

**[AwakeTab for Chrome](/extension)** is the most dependable choice for full-screen PowerPoint or Keynote on Chrome or Edge. Its Screen level keeps the display on while Chrome is running, whatever window is in front.

**A longer timeout** is the right answer on your own laptop if you present often. The steps are in [Keep the screen on in Windows 11](/on/windows-11) and on [the Mac page](/on/macos).

## The projector and second displays

A projector or second monitor follows the same display timeout as your laptop. When AwakeTab keeps the display on, it stays on too. When the wake lock is released, the projector goes dark on the same timer as your laptop screen. A projector that turns itself off after losing the signal is using its own setting; [Fix a second monitor that turns off](/guides/second-monitor-turns-off) covers that case.

A locked screen is a different matter. If your laptop locks during a long Q&A because of a work lock policy, AwakeTab won't prevent that. [Lock screen versus display sleep](/guides/lock-screen-vs-sleep) explains the difference.

## Set it up before you're introduced

1. Open AwakeTab and pick 2 h, or tap "Until…" and choose the end of your slot, such as 11:30 AM.
2. Tap Start and wait for the pill to change from "Starting…" to "Screen awake".
3. Open the floating window, or turn on the extension.
4. Start the slideshow. The floating window should still say "Screen awake".
5. Rehearse once: leave the slideshow running, untouched, for longer than your display timeout. If the screen stays on, you're set.

## What you'll see during the talk

A running time and "Screen awake" mean the display is covered. "Paused — tab hidden" means the slides are covering AwakeTab and the normal timeout is back in charge. If the browser refuses, for example because a school or work administrator has switched wake locks off, the pill reads "Blocked — here's the fix" and tells you why. Teaching a class? See [keep the classroom screen on while you teach](/for/classroom).
