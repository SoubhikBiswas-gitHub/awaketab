---
title: "Keep a work laptop display awake — AwakeTab"
description: "No install, no admin rights: AwakeTab keeps a work laptop display on while its tab is visible. A lock policy, closing the lid and Teams Away still apply."
h1: "Keep a work laptop display awake"
intent: "keep work laptop screen on without admin rights"
secondaryQueries:
  - "keep laptop screen on without changing settings"
  - "keep computer awake without software"
  - "work laptop screen turns off too quickly"
  - "screen timeout greyed out work computer"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["edge", "chrome", "firefox", "safari"]
os: ["windows", "macos"]
faq:
  - q: "Do I need admin rights or an install?"
    a: "No. AwakeTab is a web page. It uses a feature built into Edge, Chrome, Firefox and Safari, and it changes no system setting. Close the tab and your laptop behaves exactly as it did before."
  - q: "My laptop still locks after 15 minutes. Why?"
    a: "Your organisation probably sets a lock after a period of inactivity, separate from the display timeout. AwakeTab keeps the display on but leaves that lock alone, so it still happens on schedule. If the time is too short for your work, ask IT whether it can change."
  - q: "What happens when I close the lid to walk to a meeting?"
    a: "The laptop sleeps as usual. When you open it and sign in, AwakeTab asks for the wake lock again as long as its tab is visible."
  - q: "The pill says “Blocked — here's the fix”. What now?"
    a: "The browser refused. On a managed laptop that often means an administrator has switched wake locks off for the browser. The pill explains the cause it can see. Nothing on the page can or should change an administrator’s choice; ask IT if you need the screen on longer."
honestLimit: "AwakeTab holds off only the display timeout, and only while its tab is visible. A separate lock policy, removing a smart card or closing the lid still locks or sleeps the laptop, and Teams still shows Away."
related:
  - "/guides/lock-screen-vs-sleep"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/vs/mouse-jigglers"
  - "/extension"
  - "/on/windows-11"
  - "/guides/windows-11-screen-turns-off-after-1-minute"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

AwakeTab keeps a work laptop's display on from a browser tab, with nothing to install and no admin rights. It works while the tab is visible, and it holds off the display timeout only. It does not stop a separate lock policy, removing a smart card, or closing the lid from locking or sleeping the laptop, and it won't keep Teams from showing you as Away.

## What it does on a managed laptop

The tab uses the Screen Wake Lock API, a standard browser feature, to ask the laptop to keep the display on, the same request a video player makes during a film. On Windows, Edge and Chrome pass that request to Windows, and while the display is on, Windows doesn't idle-sleep. A Mac behaves the same way in Chrome.

The tab has to stay visible, but not in front. A window snapped beside your report, or AwakeTab on a second monitor, is enough. Minimise it and the pill changes to "Paused — tab hidden".

## What it can't do

- **A lock policy that isn't the display timeout.** Many organisations lock the screen after a set time without input. That timer still runs. To find out which kind your laptop has, see [Lock screen versus display sleep](/guides/lock-screen-vs-sleep).
- **Smart-card removal.** Pull the card and the policy locks the laptop, as it should.
- **Closing the lid.** The laptop sleeps.
- **Your chat status.** Teams shows Away after about 5 minutes without keyboard or mouse input, and Slack after about 10, whether or not the screen is lit. [Does a wake lock keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) has the detail from Microsoft's and Slack's own documentation.
- **The minute after locking.** A locked Windows PC turns its monitor off after about 60 seconds, by design. A tab can't reach the lock screen. See [Windows 11 screen turns off after 1 minute](/guides/windows-11-screen-turns-off-after-1-minute).

## Set it up in Edge or Chrome

1. Open AwakeTab in Edge, which comes with Windows, or Chrome.
2. Pick 30 min, or tap "Until…" and choose when your day ends, such as 5:30 PM.
3. Tap Start. You'll see "Starting…" briefly, then "Screen awake" once Edge or Chrome agrees.
4. Snap the window to one side (Windows key + Left arrow) or drag it to your second monitor, and carry on working.

On a work phone, a management profile may cap Auto-Lock, and only its administrator can change that. Whether a Safari tab keeps the screen on past that cap is not yet device-tested; the result will go on our how-we-tested page when it is recorded.

## Could this get me in trouble at work?

AwakeTab doesn't fake activity, doesn't change your status, and leaves sign-in and lock policies exactly as they are. It keeps the display on, the same way a video player does. If your employer has rules about screen locking, follow them.

## Is this allowed on my work laptop?

It uses a standard browser feature and installs nothing. It doesn't touch sign-in or lock policies. If your company has rules about screen locking, follow them.

A mouse jiggler is different: it sends fake input. [Mouse jigglers vs a wake-lock tab](/vs/mouse-jigglers) compares the two.

## For IT admins

AwakeTab uses the browser's Screen Wake Lock. An administrator can switch off the browser's wake-lock permission by policy. When that happens, the page can't keep the screen on, and the pill says "Blocked — here's the fix" rather than pretending. The page sets no cookies and needs no account.

The optional extension, [AwakeTab for Chrome](/extension), asks for the power, storage and alarms permissions, plus notifications only if the user turns them on. It has no access to sites unless a user adds one for auto-start. Your usual extension allow and block lists apply to it like any other.
