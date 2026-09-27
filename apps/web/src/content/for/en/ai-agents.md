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

If your agent or build runs in a terminal, the simplest fix is the operating system's own: `caffeinate -i` on a Mac, or PowerToys Awake on Windows. AwakeTab helps when you also want to watch progress. In Chrome or Edge, a visible AwakeTab tab keeps the display on, and while the display is on, neither Windows nor macOS idle-sleeps. Closing the lid still sleeps. Check it with `pmset -g assertions` (Mac) or `powercfg /requests` (Windows).

## Pick the tool for the job

| Your situation | Best fit | Why |
|---|---|---|
| Claude Code, Codex or a build in a Mac terminal | `caffeinate -i` in front of the command | Holds off idle sleep until the command exits, then lets go |
| The same job on Windows | PowerToys Awake | Keeps the PC awake; the display turns off unless you switch on "Keep screen on" |
| You want to watch the run on screen | A visible AwakeTab tab | The screen stays lit, so you can glance at progress from across the room |
| Overnight, tab hidden, Chrome or Edge | AwakeTab for Chrome, System level | Keeps the computer awake with the tab hidden; the screen may dim or lock |
| Laptop lid closed | None of these | See the lid section below |

On a Mac, that looks like `caffeinate -i codex` or `caffeinate -i npm run build`. Microsoft documents PowerToys Awake on [Microsoft Learn](https://learn.microsoft.com/en-us/windows/powertoys/awake) (checked 26 September 2026); [our PowerToys Awake comparison](/vs/powertoys-awake) sets the two side by side.

## What the web page does, precisely

A web page can only ask for the screen to stay on, through the Screen Wake Lock API. What that means for the rest of the machine depends on the system:

- **Windows:** Chrome and Edge ask Windows to keep the display on. While it is on, Windows doesn't idle-sleep. [Keep the screen on in Windows 11](/on/windows-11) has the settings side.
- **macOS:** Chrome holds a "no display sleep" power assertion, and Apple's rules mean the Mac does not idle-sleep while it's held. [The Mac page](/on/macos) covers the details.
- **Linux:** the browser sends the request to your desktop environment over D-Bus, and some desktops honour it better than others.

All of this lasts only while the tab is visible. Minimise the window or switch tabs and the pill shows "Paused — tab hidden"; from then on, the normal sleep timer runs. A work policy that locks the screen after a set time can still lock it, although a locked Mac or PC is not asleep.

## Set up a visible monitor for a long run

1. Start the agent or build.
2. Open AwakeTab in its own small window and choose ∞, or "Until…" with a clock time such as 7:00 AM tomorrow.
3. Pick Minimal mode: a dim screen with the elapsed time, easy on the eyes and the panel.
4. Place the window beside your terminal or the agent's page. It can sit unfocused; it only has to stay uncovered.
5. Plug the laptop in for a long run.

## Check that it's working

With the pill showing "Screen awake" on a Mac, type `pmset -g assertions` into Terminal. Look for a PreventUserIdleDisplaySleep or NoDisplaySleep line from your browser; `caffeinate` shows up under its own name. On Windows, open Terminal as administrator and run `powercfg /requests`. The browser should be listed under DISPLAY.

## The lid, and other walls a tab can't climb

Closing a laptop lid sleeps it, whatever any browser tab or command asks. The one exception is a Mac running closed with its charger and an external monitor connected (clamshell mode); our guide to [Mac sleep with the lid closed](/guides/mac-prevent-sleep-lid-closed) explains the trade-offs. For a remote machine you reach over SSH, set sleep on that machine, not in your local browser. For hidden-tab runs in Chrome or Edge, [AwakeTab for Chrome](/extension) is the tool built for it.
