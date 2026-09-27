---
title: "Second monitor turns off? Causes and fixes — AwakeTab"
description: "If only your second monitor turns off, check the cable, DisplayPort and the monitor's own auto-off. If both follow the OS timeout, a wake lock helps."
h1: "Second monitor keeps turning off: how to fix it"
intent: "second monitor turns off"
secondaryQueries:
  - "keep second monitor from turning off"
  - "second monitor goes to sleep"
  - "external monitor turns off randomly"
  - "displayport monitor goes black"
  - "second monitor no signal after sleep"
preset: pinf
mode: clock
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers:
  - chrome
  - edge
os:
  - windows
  - macos
faq:
  - q: "Why do my windows jump to the main screen when the second monitor sleeps?"
    a: "Some DisplayPort monitors look unplugged to the computer once they sleep, so the system moves their windows to the screen that is left. Keeping the displays on stops that sleep. If windows jump while both screens are awake, the link is dropping: try another cable."
  - q: "Can I give each monitor its own timeout?"
    a: "Not in Windows or macOS settings. Both use one display timeout for every screen they drive. A monitor can still have its own auto-off or eco timer in its on-screen menu, and that one runs separately from the computer."
  - q: "Does the AwakeTab tab have to be on the monitor that turns off?"
    a: "No. The browser asks the system to keep the displays on, and the operating system applies that to every screen. Put the tab on whichever screen suits you, as long as it stays visible and nothing covers it."
honestLimit: "AwakeTab can hold the operating system's display timeout for every screen, but not a monitor that powers itself down, a DisplayPort link that drops, or a faulty cable. Those need the checks on this page, not software."
related:
  - "/on/windows-11"
  - "/on/macos"
  - "/for/dashboards"
  - "/for/presentations"
  - "/guides/lock-screen-vs-sleep"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

If only the second monitor goes dark while the main screen stays on, the cause is usually the monitor or its connection: a loose cable, a DisplayPort link that drops, or the monitor's own power saving. If both screens go dark at the same moment, your operating system's display timeout is doing it, and a visible AwakeTab tab on either screen can hold that timeout.

## Which pattern do you have?

- **Only the second screen goes dark, at random times:** the cable, adapter or link.
- **Only the second screen goes dark, after a steady delay:** the monitor's own auto-off or eco timer.
- **The second screen shows "No signal" after the computer wakes:** DisplayPort re-detection or the monitor's automatic input search.
- **Both screens go dark together:** the system display timeout.

## When only the second monitor goes dark

The causes, most likely first:

1. **The cable or adapter.** A loose plug, a long or low-grade cable, or a USB-C adapter or dock in the chain.
2. **The DisplayPort link.** DisplayPort connections can drop and reconnect, more often through docks or when monitors are daisy-chained (MST). A monitor that drops the link can look unplugged to the computer for a moment.
3. **The monitor's own settings.** Many monitors have a power-saving, eco or auto power-off option, and an automatic input setting that scans for a signal and sleeps when it finds none. Names differ by maker.
4. **The graphics driver.** An old driver can mishandle sleep and wake on external screens.

## Fix it, one step at a time

Change one thing, then wait long enough to know whether it helped.

1. Swap the cable for a known-good one. If you can, try the other port type, such as HDMI in place of DisplayPort.
2. Connect the monitor straight to the computer, without the dock, adapter or daisy chain.
3. In the monitor's on-screen menu, turn off power saving, eco mode and any auto power-off timer.
4. Set the monitor's input to the port you use, not automatic. This often cures "No signal" after wake.
5. Update the graphics driver. On Windows, check Settings > Windows Update > Advanced options > Optional updates, or the website of your PC or graphics card maker. On a Mac, drivers come with macOS updates.

If the menu will not open or ignores changes, some monitors have a menu lock; the manual says how to release it.

## When both screens go dark together

Windows and macOS use one display timeout for all screens. To change it:

- **Windows 11:** open Settings > System > Power & battery and expand the screen, sleep and hibernate timeouts.
- **Mac:** System Settings > Lock Screen, then the two "Turn display off" choices.

On a work computer these may be greyed out because IT sets them. In that case, leave them as they are.

## Hold the timeout from a tab

Rather than change the timeout, you can let the AwakeTab timer above hold it. It opens in clock mode and runs until you stop it, so it doubles as a wall clock on the spare screen. Kept visible in Chrome or Edge, it sends one request to keep the displays on, and that covers both screens.

Put it where nothing covers it. A tab in a minimised window counts as hidden, and one fully covered by another window can too; the pill then shows "Paused — tab hidden". A window that is visible but not focused is fine.

For a wall screen running all day, see [keeping a dashboard screen on](/for/dashboards). If you present from a laptop onto the second screen, [presenting with AwakeTab](/for/presentations) explains the floating window. Browser setup for each system is on [the Windows 11 page](/on/windows-11) and [the Mac page](/on/macos).

## Confirm which cause it is

1. Start AwakeTab and wait for "Screen awake".
2. On Windows, run `powercfg /requests` in an administrator terminal and look for the browser under DISPLAY. On a Mac, run `pmset -g assertions` and look for a NoDisplaySleep entry.
3. If the request is there and the second screen still goes dark, the timeout is not the cause. Go back to the cable and monitor steps.
