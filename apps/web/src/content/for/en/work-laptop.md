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
lead: "AwakeTab keeps a work laptop's display on from a browser tab, with nothing to install and no admin rights. It works while the tab is visible, and it holds off the display timeout only. It does not stop a separate lock policy, removing a smart card, or closing the lid from locking or sleeping the laptop, and it won't keep Teams from showing you as Away."
crumb: "Work laptop"
toc:
  set-it-up-in-edge-or-chrome: "Set it up"
  what-to-expect-on-a-managed-laptop: "What to expect"
  is-this-allowed-on-my-work-laptop: "Is this allowed?"
  before-you-rely-on-it-at-work: "Before you rely on it"
steps:
  - title: "Open AwakeTab in Edge or Chrome."
    text: "Edge comes with Windows. Pick 30 min, or tap \"Until…\" and choose when your day ends, such as 5:30 PM."
  - title: "Tap Start."
    text: "You'll see \"Starting…\" briefly, then \"Screen awake\" once Edge or Chrome agrees."
  - title: "Snap it beside your work."
    text: "Press Windows key + Left arrow, or drag the window to your second monitor."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "the AwakeTab pill reading Screen awake in Edge"
    caption: "The pill in Edge."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "AwakeTab snapped to one side of a Windows 11 screen beside a report"
    caption: "AwakeTab snapped beside a report in Edge on Windows 11."
pills:
  - state: held
    text: "The display timeout is held off. A separate lock policy still runs."
  - state: lost
    text: "The window is minimised or covered. Uncover AwakeTab and it asks again."
  - state: denied
    text: "The browser refused. The card shows the cause it can see and what to try; it cannot change a rule your IT team has set."
checklist:
  - "You know whether your laptop has a lock policy as well as a display timeout."
  - "Nothing covers AwakeTab: it is snapped to one side or on a second monitor."
  - "The session ends when your day does, such as \"Until…\" 5:30 PM."
  - "Your employer's rules on screen locking allow it."
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

## Set it up in Edge or Chrome

::steps

::figures

::ad

## What to expect on a managed laptop

The tab uses the Screen Wake Lock API, a standard browser feature, to ask the laptop to keep the display on, the same request a video player makes during a film. While the display is on, Windows doesn't idle-sleep, and a Mac behaves the same way in Chrome.

The tab has to stay visible, but not in front. A window snapped beside your report, or on a second monitor, is enough.

On a work phone, a management profile may cap Auto-Lock. Whether a Safari tab keeps the screen on past that cap is not yet device-tested; the result will go on our how-we-tested page.

The pill at the top of the tool tells you what the browser is doing:

::pills

## What it can't do

- **A lock policy that isn't the display timeout.** Many organisations lock the screen after a set time without input. That timer still runs. To find out which kind your laptop has, see [Lock screen versus display sleep](/guides/lock-screen-vs-sleep).
- **Smart-card removal.** Pull the card and the policy locks the laptop, as it should.
- **Closing the lid.** The laptop sleeps.
- **Your chat status.** Teams shows Away after about 5 minutes without keyboard or mouse input, and Slack after about 10, whether or not the screen is lit. [Does a wake lock keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) has the sources.
- **The minute after locking.** A locked Windows PC turns its monitor off after about 60 seconds, by design. See [Windows 11 screen turns off after 1 minute](/guides/windows-11-screen-turns-off-after-1-minute).

## Is this allowed on my work laptop?

AwakeTab doesn't fake activity, doesn't change your status, and leaves sign-in and lock policies exactly as they are. If your employer has rules about screen locking, follow them.

A mouse jiggler is different: it sends fake input. [Mouse jigglers vs a wake-lock tab](/vs/mouse-jigglers) compares the two.

## For IT admins

An administrator can switch off the browser's wake-lock permission by policy. The page then can't keep the screen on, and the pill says so rather than pretending. The page sets no cookies and needs no account.

The optional extension, [AwakeTab for Chrome](/extension), asks for the power, storage and alarms permissions, plus notifications only if the user turns them on. It has no access to sites unless a user adds one for auto-start. Your usual extension allow and block lists apply to it like any other.

## Before you rely on it at work

::checklist
