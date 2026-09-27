---
title: "Keep your Mac awake from a browser tab — AwakeTab"
description: "In Chrome or Edge, a visible tab keeps your Mac's display on, and the Mac does not idle-sleep while it does. Closing the lid still puts it to sleep."
h1: "Keep your Mac screen awake from a browser tab"
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

In Chrome or Edge on a Mac, a visible AwakeTab tab asks macOS to keep the display on. While it does, the Mac doesn't idle-sleep either (Apple's power-assertion rules). To check, run `pmset -g assertions` in Terminal while the pill says "Screen awake". Closing the lid still sleeps the Mac unless it's in clamshell mode, with power and an external display.

## The Mac's own setting

To change the timeout for every app, open Apple menu > System Settings > Lock Screen. It holds the display-off times for an inactive Mac (on a laptop, one for battery and one for the power adapter). Choose a longer time or Never, then set it back later. Sleep options sit in the Battery or Energy pane and vary by Mac.

## When a tab is the better choice

Settings stay changed until you undo them. A tab fits a task with an end, such as a lecture that finishes at 11:30. Pick a length or an "Until…" time, and your normal timeouts return on their own. On a managed Mac, a management profile can still lock the screen on its own schedule.

## Browser support on macOS

| Browser | First version | What happens |
|---|---|---|
| Chrome, Edge | 84 (July 2020) | Holds a "no display sleep" power assertion, so the Mac does not idle-sleep either |
| Safari | 16.4 (March 2023) | Keeps the display on from a visible tab after one click |
| Firefox | 126 (May 2024) | Keeps the display on from a visible tab; refuses at 5 % battery or less when unplugged |

The version dates and sources are in the [browser support matrix](/learn/browser-support-matrix).

## Check it in Terminal

1. Start a session and wait for the pill to say "Screen awake".
2. Open Terminal and run `pmset -g assertions`.
3. Look for a PreventUserIdleDisplaySleep or NoDisplaySleep line that names your browser.
4. Switch to another tab and run it again. The line should be gone, and the pill should read "Paused — tab hidden".

## What stops it on a Mac

- **Hiding the tab.** A minimised window, or a different tab in front, lets the display go. A window that stays partly visible behind another app keeps it.
- **Closing the lid.** The Mac sleeps. The exception is clamshell mode with power and an external display. [Keeping a Mac awake with the lid closed](/guides/mac-prevent-sleep-lid-closed) covers the options.
- **Low Power Mode.** Set in System Settings > Battery, it may shorten display timeouts. We have not recorded how it interacts with a tab that holds the display.

## When another tool fits better

- **A terminal job with nothing to watch.** `caffeinate -di` keeps both the display and the system awake while Terminal runs it; `caffeinate -i` lets the display sleep.
- **A menu bar switch.** Caffeine for Mac holds a macOS power assertion with no window open; [Caffeine compared with a tab](/vs/caffeine) sets out the trade-offs.
- **An AI agent or long build.** [Keeping your computer awake while an agent runs](/for/ai-agents) explains when a tab is enough.
- **A hidden tab.** The [AwakeTab for Chrome extension](/extension), also for Edge, carries on when the tab is hidden or the window is minimised.

## What we have checked

Apple's IOKit documentation for the display-sleep assertion and the Chromium source were checked on 26 September 2026. No Mac result is recorded yet; it will be published on /learn/how-we-tested after the device run.
