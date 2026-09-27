---
title: "Keep your computer awake while an AI agent runs — AwakeTab"
description: "Claude Code, Codex or a long build stalls when the computer sleeps. What a visible tab can hold, and when caffeinate or PowerToys Awake fits better."
h1: "Keep your computer awake while an AI agent or long build runs"
intent: "keep computer awake while ai agent runs"
secondaryQueries:
  - "claude code keep computer awake"
  - "keep mac awake for claude"
  - "keep computer awake for codex"
  - "keep laptop awake during long build"
  - "keep mac awake terminal command"
preset: pinf
mode: minimal
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge"]
os: ["macos", "windows", "linux"]
lead: "If your agent or build runs in a terminal, the simplest fix is the operating system's own: `caffeinate -i` on a Mac, or PowerToys Awake on Windows. AwakeTab helps when you also want to watch progress. In Chrome or Edge, a visible AwakeTab tab keeps the display on, and while the display is on, neither Windows nor macOS idle-sleeps."
crumb: "AI agents and builds"
toc:
  set-up-a-visible-monitor-for-a-long-run: "Set up a visible monitor"
  what-to-expect-during-the-run: "What to expect"
  the-lid-and-other-walls-a-tab-cant-climb: "The lid and other walls"
steps:
  - title: "Start the agent or build."
    text: "Run Claude Code, Codex or your build as usual, with the laptop plugged in."
  - title: "Open AwakeTab in its own small window."
    text: "Choose ∞, or \"Until…\" with a time such as 7:00 AM tomorrow. Pick Minimal mode, a dim screen with the elapsed time."
  - title: "Place it beside your terminal."
    text: "It can sit unfocused; it only has to stay uncovered."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "AwakeTab in Minimal mode, a dim screen with the elapsed time"
    caption: "Minimal mode for a long run."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "a small AwakeTab window beside a terminal running Claude Code on a Mac"
    caption: "A small AwakeTab window beside a terminal on a Mac."
pills:
  - state: held
    text: "The display stays on, so the computer does not idle-sleep."
  - state: lost
    text: "The window is minimised or covered, so the normal sleep timer runs again. Uncover it and AwakeTab asks again."
  - state: denied
    text: "The browser said no. Chrome and Edge have no battery check, but Firefox refuses at 5% battery or less while not charging. The card names the fix."
checklist:
  - "The laptop is plugged in."
  - "The lid stays open, or the Mac has its charger and an external monitor connected."
  - "A hidden-tab run uses `caffeinate -i`, PowerToys Awake or AwakeTab for Chrome."
  - "`pmset -g assertions` or `powercfg /requests` lists the browser."
faq:
  - q: "What is the exact command to keep a Mac awake for one Claude Code session?"
    a: "Run caffeinate -i claude instead of claude. The Mac will not idle-sleep until you quit Claude Code; the display can still turn off. Use caffeinate -di claude if you also want the screen to stay lit so you can glance at it. The same pattern works for codex or any build command."
  - q: "Does the terminal window have to stay in front?"
    a: "No. caffeinate and PowerToys Awake work whatever window is in front, even with the screen off. With the web page, the AwakeTab window is the one that must stay uncovered; the terminal can sit behind other windows."
  - q: "Is the extension’s System level better than the web page for an overnight job?"
    a: "Usually, yes. It keeps the computer awake with the tab hidden or the window minimised, and the popup shows “System awake”. The screen may still dim or lock, which suits a night run. Chrome or Edge must stay open."
  - q: "Can AwakeTab stop a browser-based agent from timing out?"
    a: "No. It keeps the display on and nothing else. A site that signs you out when idle, or a browser that slows a hidden agent tab, is outside its reach. Keep the agent’s tab visible, or run the agent from a terminal."
honestLimit: "The web page keeps the display on, and with it stops idle sleep, only while its tab is visible. Minimise it or close the lid and the computer can sleep mid-run. For unattended jobs, use caffeinate, PowerToys Awake or AwakeTab for Chrome."
related:
  - "/on/macos"
  - "/on/windows-11"
  - "/extension"
  - "/vs/powertoys-awake"
  - "/vs/caffeine"
  - "/guides/mac-prevent-sleep-lid-closed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set up a visible monitor for a long run

::steps

::figures

::ad

## What to expect during the run

A web page can only ask for the screen to stay on, through the Screen Wake Lock API. What that does for the rest of the machine depends on the system:

- **Windows:** Chrome and Edge ask Windows to keep the display on, and while it is on, Windows doesn't idle-sleep. [Keep the screen on in Windows 11](/on/windows-11) has the settings.
- **macOS:** Chrome holds a "no display sleep" power assertion, so the Mac does not idle-sleep. [The Mac page](/on/macos) has the details.
- **Linux:** the browser asks your desktop over D-Bus, and some desktops honour it better than others.

This lasts only while the tab is visible.

The pill at the top of the tool tells you what the browser is doing:

::pills

## Pick the tool for the job

| Your situation | Best fit | Why |
|---|---|---|
| Claude Code, Codex or a build in a Mac terminal | `caffeinate -i` in front of the command | Holds off idle sleep until the command exits, then lets go |
| The same job on Windows | PowerToys Awake | Keeps the PC awake; the display turns off unless you switch on "Keep screen on" |
| You want to watch the run | A visible AwakeTab tab | The screen stays lit for a glance at progress |
| Overnight, tab hidden, Chrome or Edge | AwakeTab for Chrome, System level | Keeps the computer awake with the tab hidden; the screen may dim or lock |

On a Mac, that looks like `caffeinate -i codex` or `caffeinate -i npm run build`. Microsoft documents PowerToys Awake on [Microsoft Learn](https://learn.microsoft.com/en-us/windows/powertoys/awake) (checked 26 September 2026); [our PowerToys Awake comparison](/vs/powertoys-awake) sets the two side by side.

## Check that it's working

On a Mac, run `pmset -g assertions` in Terminal and look for a PreventUserIdleDisplaySleep or NoDisplaySleep line from your browser. On Windows, run `powercfg /requests` in Terminal as administrator; the browser should be listed under DISPLAY.

## The lid, and other walls a tab can't climb

Closing a laptop lid sleeps it, whatever any tab or command asks. The one exception is a Mac running closed with its charger and an external monitor connected (clamshell mode); our guide to [Mac sleep with the lid closed](/guides/mac-prevent-sleep-lid-closed) explains the trade-offs. For a remote machine you reach over SSH, set sleep on that machine, not in your local browser.

::limit

## Before a long run

::checklist
