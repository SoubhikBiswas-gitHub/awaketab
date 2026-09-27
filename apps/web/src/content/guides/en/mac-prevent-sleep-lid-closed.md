---
title: "Keep your Mac awake with the lid closed — AwakeTab"
description: "No web page or extension can keep a closed Mac awake. Clamshell mode with power and an external display does. The other options and their heat risk."
h1: "Keep a Mac awake with the lid closed: what works"
crumb: "Mac awake, lid closed"
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
lead: "No web page or browser extension can keep a Mac awake after you close the lid: closing it puts the Mac to sleep whatever the browser asks. The supported way round it is clamshell mode, with the Mac on power and an external display connected. Terminal settings and some apps can go further, at a cost in heat and battery. With the lid open, a visible tab is enough."
steps:
  - title: "Connect the power adapter"
    short: "Plug in power"
    text: "Clamshell mode needs the Mac on power. Check that it is charging before you go on."
  - title: "Connect an external display"
    short: "Connect a display"
    text: "Turn the display on and make sure it shows your desktop."
  - title: "Close the lid"
    short: "Close the lid"
    text: "The desktop moves to the external display and the Mac keeps running. Leave it on a hard, open surface, not in a bag or sleeve."
  - title: "Check that it stayed awake"
    short: "Check it stayed awake"
    path: "Terminal › pmset -g log"
    text: "`pmset -g log` records each sleep and wake with a reason. If it shows a sleep when you closed the lid, check the first two steps and Apple's guide for your model."
stepsDone: "All four done. If the Mac still sleeps when you close it, read the next section."
toolNote: "With the lid open, a tab is enough. The AwakeTab timer runs until you stop it. Kept in view in Chrome or Edge, it holds the display on, and the Mac skips idle sleep for as long as that lasts. The pill says \"Screen awake\" once the browser grants it, and \"Paused — tab hidden\" if you switch to another tab."
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

## Use clamshell mode in 4 steps

Apple calls this closed-display mode. Apple's guide lists what your model needs. We have not checked every model's requirements, so read it for yours.

::steps

## If it still sleeps or you can't change the settings

Make sure the adapter is charging and the external display is on and showing your desktop before you close the lid.

On a work or school Mac without admin rights, `sudo pmset` will ask for a password you don't have, and energy settings may be set by a profile. Ask your IT team. Clamshell mode and a visible tab need no admin rights.

::ad

## Why closing the lid wins

Apps keep a Mac awake by holding a power assertion, a note to macOS that says "don't sleep yet". Chrome holds one while a page keeps the screen on, and `caffeinate` creates the same kind from Terminal. These assertions stop idle sleep: the sleep that follows a stretch with no keyboard or mouse input.

Closing the lid is not idle: it is a direct request to sleep. So the browser, AwakeTab for Chrome and `caffeinate` with its usual options all stop at the lid.

## Other options, safest first

### Keep the lid open with the screen dimmed

Turn the brightness down to its lowest and leave the lid open. Then either keep a tab visible, or run `caffeinate -di` in Terminal to stop both display and idle sleep until you press Control-C. `caffeinate -i` alone keeps the Mac awake and lets the screen turn off.

### An app with a closed-display option

Amphetamine, from the Mac App Store, has a closed-display mode option (as of 26 September 2026). Read its own help for what it needs on your Mac. Caffeine for Mac holds a power assertion like `caffeinate` does, so it keeps the Mac awake with the lid open only; see [AwakeTab vs Caffeine](/vs/caffeine).

### The pmset switch (advanced)

`sudo pmset -a disablesleep 1` is widely used to stop a Mac sleeping at all, lid included. It is not described in the pmset manual, so Apple can change or remove it. It needs an administrator password. Turn it off with `sudo pmset -a disablesleep 0` as soon as you are done.

## Heat and battery

A closed Mac that stays awake still makes heat. Inside a bag or sleeve it has nowhere to go, so never keep one awake there; use a hard, open surface. On battery, a Mac that cannot sleep drains until it shuts down, and unsaved work goes with it. Clamshell mode avoids the battery problem because it needs the power adapter.

## Confirm what is keeping it awake

- `pmset -g assertions` lists every process asking macOS not to sleep. A browser keeping the screen on shows a PreventUserIdleDisplaySleep or NoDisplaySleep entry. `caffeinate -i` shows PreventUserIdleSystemSleep.
- `pmset -g` prints your current settings. After using the pmset switch, check it is off again.

If the job runs out of sight, [AwakeTab for Chrome](/extension) at its System level keeps the Mac awake with the tab hidden while Chrome runs. For long builds and agents, [keeping your computer awake for an AI agent](/for/ai-agents) compares the options. The full Mac setup is on [the macOS page](/on/macos).
