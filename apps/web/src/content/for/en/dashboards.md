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
lead: "AwakeTab keeps a dashboard screen on as long as AwakeTab itself is visible on a display of that computer: in a small window beside the dashboard, side by side, or on another monitor attached to the same machine. Send the wall screen a link with `?autostart=1` and it starts itself when the page loads; Safari and iPad need one tap the first time. Keep the device plugged in."
crumb: "Dashboards"
toc:
  make-the-wall-screen-start-itself: "Make it start itself"
  what-to-expect-from-across-the-room: "What to expect"
  put-awaketab-where-the-browser-can-see-it: "Where to put AwakeTab"
  before-you-leave-it-on-the-wall: "Before you leave it"
steps:
  - title: "Choose ∞ and a quiet face."
    text: "Pick Minimal or Clock mode (below). To let the screen sleep out of hours, use \"Until…\" with a time such as 6:00 PM instead."
  - title: "Copy a link that starts itself."
    text: "Open Share, turn on \"Start automatically\" and copy the link. It ends in `?autostart=1` and carries the length you chose."
  - title: "Open that link when the wall computer starts."
    text: "Set the browser to open it at start-up. After a reload, AwakeTab restores its session."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "AwakeTab resized to a narrow strip in Minimal mode"
    caption: "AwakeTab as a narrow strip at the edge of the screen."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "a Grafana dashboard with a small AwakeTab window in the corner"
    caption: "A dashboard with a small AwakeTab window in the corner."
pills:
  - state: held
    text: "With a running time, the display is being kept on."
  - state: lost
    text: "Something, such as a full-screen dashboard, covers AwakeTab. Uncover it and AwakeTab asks again."
  - state: denied
    text: "The browser refused, for example because the page is embedded in a frame whose policy blocks wake locks. The card shows the fix."
checklist:
  - "The wall computer is on mains power."
  - "Nothing covers AwakeTab: a corner window, side by side, or another monitor on the same computer."
  - "On Safari or iPad, someone has tapped once to start the first session."
  - "The panel's own screen-care settings are on, or the screen switches off out of hours."
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

## Make the wall screen start itself

::steps

::figures

::ad

## What to expect from across the room

In Chrome and Edge the session starts as soon as the page loads. Safari and iPad need one tap the first time, because Safari asks for a recent tap before it will keep a screen on.

The pill at the top of the tool tells you what the browser is doing:

::pills

## Put AwakeTab where the browser can see it

A dashboard in full screen (F11) on the same monitor covers it. Three layouts work:

- **A small window in a corner.** Resize AwakeTab to a strip at the edge. An unfocused window still counts if nothing covers it.
- **Side by side.** Snap the dashboard to one side and AwakeTab to the other.
- **Another monitor on the same computer.** AwakeTab on the laptop screen, the dashboard on the big display. The display timeout is shared, so both stay lit.

On a Chromebook driving a wall screen, closing the lid sleeps it unless "Sleep when cover is closed" is turned off, and a managed Chromebook may not let you change that. [Keep a Chromebook screen on](/on/chromebook) has the steps.

## Choose a quiet face

**Minimal** is a dim screen with a small elapsed time, so AwakeTab doesn't compete with your charts. **Clock** shows the time in large numerals, handy where people also glance for the time.

## Power and the panel

A screen lit all day needs mains power. In Chrome and Edge, AwakeTab can stop itself at a battery level you pick, which protects a laptop someone unplugged.

OLED and some LCD panels can keep a faint image of anything that sits still for weeks. AwakeTab shifts its own face by a couple of pixels every minute, but it can't move your dashboard, so use the panel's screen-care settings or rotate between views.

## Many screens, or a lobby

For a reception screen, a shop or a row of wall displays, the [Kiosk licence](/kiosk) adds your logo. It costs $19 once for one site or $49 for five, where a site is one location with any number of screens. AwakeTab is not a kiosk browser: it doesn't lock the device down or launch itself, so pair it with your operating system's kiosk mode.

## Before you leave it on the wall

::checklist
