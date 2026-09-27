---
title: "Keep your Mac awake with the lid closed — AwakeTab"
description: "No web page or extension can keep a closed Mac awake. Clamshell mode with power and an external display does. The other options and their heat risk."
h1: "Keep a Mac awake with the lid closed: what works"
intent: "keep mac awake with lid closed"
secondaryQueries:
  - "prevent mac sleep lid closed"
  - "macbook clamshell mode"
  - "caffeinate lid closed"
  - "pmset disablesleep"
  - "keep macbook running with lid closed"
preset: pinf
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers:
  - chrome
  - edge
os:
  - macos
faq:
  - q: "Does caffeinate keep a MacBook awake with the lid closed?"
    a: "Not with its usual options. `caffeinate -i` or `caffeinate -di` stops idle sleep while the lid is open. Closing the lid is not idle time, so the Mac sleeps anyway unless it is in clamshell mode with power and an external display."
  - q: "My Mac is on power and a monitor but still sleeps when I close it. Why?"
    a: "Apple's closed-display mode guide lists what each model needs, and we have not checked every model. Make sure the adapter is charging and the external display is on and showing your desktop before you close the lid."
  - q: "Can I close the lid on battery and keep a download running?"
    a: "Not in a supported way, because clamshell mode needs the power adapter. The pmset switch can do it, but you trade heat and a draining battery for it. Lid open, brightness down, is safer."
  - q: "Will AwakeTab for Chrome keep my Mac awake with the lid shut?"
    a: "No. The extension also works through a power assertion, without needing the tab in view. Closing the lid still sleeps the Mac."
honestLimit: "Nothing in a browser, AwakeTab for Chrome included, can keep a Mac awake once you close the lid. Clamshell mode with power and an external display is the supported way; anything beyond that runs hotter and is your call."
related:
  - "/on/macos"
  - "/vs/caffeine"
  - "/for/ai-agents"
  - "/vs/amphetamine"
  - "/vs/caffeinate-command"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

No web page or browser extension can keep a Mac awake after you close the lid. Closing it puts the Mac to sleep whatever the browser asks. The supported exception is clamshell mode: the Mac on power with an external display connected. Terminal settings and some apps can go further, at a cost in heat and battery. With the lid open, a visible tab is enough.

## Why closing the lid wins

Apps keep a Mac awake by holding a power assertion, a note to macOS that says "don't sleep yet". Chrome holds one while a page keeps the screen on, and `caffeinate` creates the same kind from Terminal. These assertions stop idle sleep: the sleep that follows a stretch with no keyboard or mouse input.

Closing the lid is not idle: it is a direct request to sleep. So the browser, AwakeTab for Chrome and `caffeinate` with its usual options all stop at the lid.

## Your options, safest first

### 1. Clamshell mode (closed-display mode)

1. Connect the power adapter.
2. Connect an external display and make sure it shows your desktop.
3. Close the lid. The desktop moves to the external display and the Mac keeps running.

Apple's guide on closed-display mode lists what your model needs. We have not checked every model's requirements, so read it for yours.

### 2. Keep the lid open with the screen dimmed

Turn the brightness down to its lowest and leave the lid open. Then either keep a tab visible, or run `caffeinate -di` in Terminal to stop both display and idle sleep until you press Control-C. `caffeinate -i` alone keeps the Mac awake and lets the screen turn off.

### 3. An app with a closed-display option

Amphetamine, from the Mac App Store, has a closed-display mode option (as of 26 September 2026). Read its own help for what it needs on your Mac. Caffeine for Mac holds a power assertion like `caffeinate` does, so it keeps the Mac awake with the lid open only; see [AwakeTab vs Caffeine](/vs/caffeine).

### 4. The pmset switch (advanced)

`sudo pmset -a disablesleep 1` is widely used to stop a Mac sleeping at all, lid included. It is not described in the pmset manual, so Apple can change or remove it. It needs an administrator password. Turn it off with `sudo pmset -a disablesleep 0` as soon as you are done.

## Heat and battery

A closed Mac that stays awake still makes heat. Inside a bag or sleeve it has nowhere to go, so never keep one awake there; use a hard, open surface. On battery, a Mac that cannot sleep drains until it shuts down, and unsaved work goes with it. Clamshell mode avoids the battery problem because it needs the power adapter.

## If you can't change the settings

On a work or school Mac without admin rights, `sudo pmset` will ask for a password you don't have, and energy settings may be set by a profile. Ask your IT team. Clamshell mode and a visible tab need no admin rights.

## Confirm what is keeping it awake

- `pmset -g assertions` lists every process asking macOS not to sleep. A browser keeping the screen on shows a PreventUserIdleDisplaySleep or NoDisplaySleep entry. `caffeinate -i` shows PreventUserIdleSystemSleep.
- `pmset -g` prints your current settings. After using the pmset switch, check it is off again.
- `pmset -g log` records each sleep and wake with a reason, which tells you whether the lid or idle time put the Mac to sleep.

## With the lid open, a tab is enough

The AwakeTab timer near the top runs until you stop it. Open in Chrome or Edge and kept in view, it holds the display on through macOS, and the Mac skips idle sleep for as long as that lasts. You'll see "Screen awake" on the pill after the browser grants it. Switch to another tab and it shows "Paused — tab hidden".

If the job runs out of sight, [AwakeTab for Chrome](/extension) at its System level keeps the Mac awake with the tab hidden while Chrome runs. For long builds and agents, [keeping your computer awake for an AI agent](/for/ai-agents) compares the options. The full Mac setup is on [the macOS page](/on/macos).
