---
title: "Amphetamine alternative in a browser tab — AwakeTab"
description: "Amphetamine is a native Mac app with triggers and a closed-display mode. AwakeTab needs no install but holds only while its tab is visible. Which fits."
h1: "AwakeTab vs Amphetamine"
crumb: "Amphetamine"
intent: "amphetamine mac alternative"
preset: pinf
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari"]
os: ["macos"]
lead: "If the Mac has to stay awake on its own, with the lid closed or no browser open, use Amphetamine: a native Mac app with triggers and a closed-display mode. No web page can match that. If you can't install apps, aren't on a Mac, or want the screen on for a set time with a status you can trust, AwakeTab does that from a visible browser tab."
toc:
  side-by-side: "Side by side"
  when-amphetamine-is-the-better-choice: "When Amphetamine is better"
  when-awaketab-is-the-better-choice: "When AwakeTab is better"
  neither-a-tab-nor-a-power-setting-beats-a-closed-lid: "A closed lid"
  check-what-is-holding-your-mac-awake: "Check what holds it"
compare:
  label: "AwakeTab compared with Amphetamine for Mac, checked 26 September 2026"
  what: "What"
  cols:
    - name: "AwakeTab"
      us: true
    - name: "Amphetamine"
  rows:
    - what: "What it is"
      cells: ["A web page that asks the browser for a screen wake lock", "A native Mac app"]
    - what: "With the tab hidden or no browser open"
      cells: ["Stops. The pill says \"Paused — tab hidden\" and asks again when you return.", "Keeps holding, with no window open"]
    - what: "With the lid closed"
      cells: ["No. A closed lid sleeps the Mac unless it is in clamshell mode with power and an external display.", "Has a closed-display mode option. Its own help lists what it needs on your Mac."]
    - what: "Triggers"
      cells: ["None. You start a session, and it ends at the time you picked.", "Yes"]
    - what: "Install"
      cells: ["None, open a web page", "From the Mac App Store"]
    - what: "Platforms"
      cells: ["Chrome and Edge 84+, Firefox 126+, Safari 16.4+", "macOS"]
    - what: "Facts checked"
      cells: ["26 September 2026", "26 September 2026"]
      same: true
picks:
  them:
    - title: "The lid has to close"
      text: "A closed lid sleeps a MacBook whatever a web page asks. Amphetamine has a closed-display mode option; read its help for what it needs on your model."
    - title: "The Mac must stay awake with no browser open"
      text: "A render, a large copy or a download can run with every browser window closed. A web page can't."
    - title: "You work full screen in other apps all day"
      text: "A native app holds whatever is in front. A browser tab loses its lock the moment you switch away."
    - title: "You want it to start by itself"
      text: "Amphetamine has triggers for that. A web page holds the screen only while you have it open and in front of you."
  us:
    - title: "You can't install apps"
      text: "On a managed Mac, a web page is often the option left. It needs no admin password and leaves your organisation's lock policies alone."
    - title: "You are not on a Mac"
      text: "AwakeTab works in Chrome and Edge on Windows, in Chrome on Android, and in Safari 16.4 or later on iPhone and iPad."
    - title: "You want it to end by itself"
      text: "Pick 30 min, 1 h or a clock time such as 11:30 AM. Hidden time doesn't count toward a timed session."
    - title: "You want to see that it's working"
      text: "The pill turns to \"Screen awake\" once your browser has granted the lock, not when you press the button."
    - title: "You want a hidden tab to count"
      text: "On desktop Chrome or Edge, [AwakeTab for Chrome](/extension) uses Chrome's own power setting, so it keeps working with the tab hidden. It still stops at a closed lid."
faq:
  - q: "Can a web page keep a closed MacBook awake?"
    a: "No. Closing the lid is a direct request to sleep, not idle time, so a browser's wake lock and AwakeTab for Chrome both stop there. Clamshell mode with power and an external display, or a native tool such as Amphetamine, can."
  - q: "Can I run Amphetamine and AwakeTab at the same time?"
    a: "Yes. AwakeTab's request is separate from anything Amphetamine does, and ending an AwakeTab session does not end an Amphetamine one. If the Mac still won't sleep after AwakeTab stops, check Amphetamine."
  - q: "Will AwakeTab keep Teams or Slack Available?"
    a: "No. Teams and Slack set you to Away from keyboard and mouse inactivity, not from a lit screen, and AwakeTab never moves the pointer or presses keys."
honestLimit: "Amphetamine is native, has triggers and a closed-display mode; no browser tab can keep a closed Mac awake. If the Mac has to run on its own, use a native tool."
related:
  - "/guides/mac-prevent-sleep-lid-closed"
  - "/on/macos"
  - "/vs/caffeine"
  - "/vs/caffeinate-command"
  - "/for/ai-agents"
author: soubhik
published: 2026-09-09
updated: 2026-09-28
---

## Side by side

Amphetamine is a native Mac app from the Mac App Store that keeps the whole Mac awake with no window open. AwakeTab is a web page: in Chrome on a Mac its wake lock becomes a "no display sleep" power assertion, and per Apple's documentation the Mac does not idle-sleep while it is held. It lasts only while the tab is visible. Rows marked Same are real ties.

::compare

::ad

## When Amphetamine is the better choice

In these cases we would send you there.

::picks them

## When AwakeTab is the better choice

These are the jobs AwakeTab was built for.

::picks us

## Neither a tab nor a power setting beats a closed lid

Without a native tool, closing the lid sleeps a MacBook unless it is in clamshell mode, plugged in and driving an external display. The guide to [keeping a Mac awake with the lid closed](/guides/mac-prevent-sleep-lid-closed) covers clamshell mode, Amphetamine and the pmset switch.

## Check what is holding your Mac awake

Run `pmset -g assertions` in Terminal. It lists every process asking macOS not to sleep. With AwakeTab showing "Screen awake" in Chrome, the browser holds a PreventUserIdleDisplaySleep or NoDisplaySleep entry. Hide the tab and that line is gone; anything still listed belongs to another app.
