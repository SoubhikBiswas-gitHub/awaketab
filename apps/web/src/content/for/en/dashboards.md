---
title: "Keep a dashboard screen switched on — AwakeTab"
description: "AwakeTab keeps a wall or desk dashboard lit while AwakeTab is visible on a display of the same computer. Share a link that starts itself, and plug in."
h1: "Keep a dashboard screen switched on"
intent: "keep dashboard screen on"
secondaryQueries:
  - "keep wall display on all day"
  - "stop tv dashboard going to sleep"
  - "keep noc screen on"
  - "keep grafana screen on"
preset: pinf
mode: minimal
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari"]
os: ["windows", "macos", "linux", "chromeos"]
faq:
  - q: "Can one AwakeTab window keep two monitors on?"
    a: "Usually, yes. The display timeout on Windows and macOS covers every screen attached to the computer, so AwakeTab on the small laptop screen keeps the big monitor lit too. A monitor that powers down on its own when the signal drops is using its own setting and needs changing on the monitor."
  - q: "Will the wall screen start again after a power cut?"
    a: "Only if the computer boots, signs in and opens the browser at your autostart link. Those steps are operating-system and browser settings. Once the page loads, Chrome and Edge start the session by themselves; Safari waits for one tap."
  - q: "Does AwakeTab refresh my dashboard or keep me signed in to it?"
    a: "No. It never touches other tabs or sites. If your dashboard signs you out overnight or needs its own auto-refresh, set that in the dashboard tool. AwakeTab’s only job is to keep the display on."
  - q: "Do I need a Kiosk licence for one TV in the office?"
    a: "No. The free web page works on any number of screens. The licence is for putting your own logo on screens that customers or visitors see, and it is priced per location, not per screen."
honestLimit: "AwakeTab must stay visible on a display of the same computer as the dashboard. If a full-screen dashboard window covers it, the screen goes back to its normal timeout and sleeps on schedule."
related:
  - "/kiosk"
  - "/on/chromebook"
  - "/for/classroom"
  - "/guides/second-monitor-turns-off"
  - "/on/windows-11"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

AwakeTab keeps a dashboard screen on as long as AwakeTab itself is visible on a display of that computer: in a small window beside the dashboard, side by side, or on another monitor attached to the same machine. Send the wall screen a link with `?autostart=1` and it starts itself when the page loads; Safari and iPad need one tap the first time. Keep the device plugged in.

## Put AwakeTab where the browser can see it

The browser keeps the display on only while the AwakeTab page is visible. A dashboard in full screen (F11) on the same monitor covers it, and the pill drops to "Paused — tab hidden". Three layouts work:

- **A small window in a corner.** Resize AwakeTab to a strip at the edge, with the dashboard filling the rest. An unfocused window still counts if nothing covers it.
- **Side by side.** Snap the dashboard to one side and AwakeTab to the other.
- **Another monitor on the same computer.** AwakeTab on the laptop screen, the dashboard on the big display. The display timeout is shared, so both stay lit.

On a Chromebook driving a wall screen, closing the lid sleeps it unless "Sleep when cover is closed" is turned off, and a managed Chromebook may not let you change that. [Keep a Chromebook screen on](/on/chromebook) has the steps.

## Make the wall screen start itself

1. Open AwakeTab, choose ∞ and pick a mode (below).
2. Open Share, turn on "Start automatically" and copy the link. It ends in `?autostart=1`.
3. Set the wall computer's browser to open that link when it starts.

In Chrome and Edge the session starts as soon as the page loads, and the pill shows "Screen awake" without anyone touching it. Safari and iPad need one tap the first time, because Safari asks for a recent tap before it will keep a screen on. After a reload, AwakeTab restores the session it was running.

To let the screen sleep out of hours, use "Until…" with a time such as 6:00 PM instead of ∞. Share links carry the length you chose.

## Choose a quiet face

**Minimal** is a dim screen with a small elapsed time, so AwakeTab doesn't compete with your charts. **Clock** shows the time in large numerals, which is handy on a wall where people also glance for the time.

## Power and the panel

A screen lit all day needs mains power. In Chrome and Edge, AwakeTab can stop itself at a battery level you pick, which protects a laptop that someone unplugged. Other browsers don't give pages the battery level.

OLED and some LCD panels can keep a faint image of anything that sits still for weeks. AwakeTab shifts its own face by a couple of pixels every minute, but it can't move your dashboard. Use the panel's own screen-care settings, switch the screen off out of hours, or rotate between views.

## Many screens, or a lobby

For a reception screen, a shop or a row of wall displays, the [Kiosk licence](/kiosk) adds your logo. It costs $19 once for one site or $49 for five, where a site is one location with any number of screens. AwakeTab is not a kiosk browser: it doesn't lock the device down or launch itself, so pair it with your operating system's kiosk mode. A board in a classroom has its own page: [keep the classroom screen on while you teach](/for/classroom).

## What you'll see from across the room

"Screen awake" with a running time means the display is being kept on. "Paused — tab hidden" means something is covering AwakeTab; uncover it and AwakeTab asks again. "Blocked — here's the fix" appears when the browser refuses, for example when an administrator has switched wake locks off on a managed device.
