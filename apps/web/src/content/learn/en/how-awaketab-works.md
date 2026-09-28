---
title: "How AwakeTab works — AwakeTab"
description: "AwakeTab asks your browser for a screen wake lock and shows what the browser answered: seven states, one pill, and a timer that follows the lock."
h1: "How AwakeTab works"
crumb: "How AwakeTab works"
intent: "how does awaketab work"
secondaryQueries:
  - "how does a keep screen awake website work"
  - "what does screen awake mean in awaketab"
  - "awaketab status pill"
  - "keep screen on without installing anything"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: []
lead: "AwakeTab keeps your display on by asking the browser for a screen wake lock, the same request a video player makes while you watch. It says the screen is awake only after the browser confirms the lock, and the pill at the top of the tool always names one of seven states. There is no account and nothing to download: the whole tool is one page."
toc:
  what-does-awaketab-do: "What it does"
  how-does-a-session-work: "How a session works"
  what-do-the-seven-states-mean: "The seven states"
  what-happens-when-you-switch-tabs-or-apps: "Switching tabs or apps"
  what-else-can-the-screen-show: "Faces, sounds and notes"
  where-do-your-settings-and-data-go: "Your settings and data"
  when-is-the-extension-the-better-fit: "The extension"
  what-does-this-page-not-cover: "Limits"
steps:
  - title: "You pick a duration."
    text: "A preset, a custom length or a clock time starts a session. Each choice is one keypress: `1` to `6` for the presets, `0` for no end time, `U` for a clock time and `Space` to start or stop."
    short: "Pick a duration"
  - title: "The browser is asked for a screen wake lock."
    text: "It is the same Screen Wake Lock API a video player uses. The browser can accept, refuse, or take the lock back later, and all three answers show on the pill as they happen."
    short: "Ask the browser"
  - title: "The timer follows the lock, not the clock."
    text: "The countdown shows only while a lock is held, and it runs on system time, so a laptop that was suspended comes back with an honest number. When time is up you hear a chime and choose to extend or stop."
    short: "Follow the lock"
pills:
  - state: idle
    text: "Nothing requested yet. Pick a duration to start."
  - state: requesting
    text: "The request is in flight; the browser has not answered."
  - state: held
    text: "The browser confirmed the lock. Only now does the timer run."
  - state: lost
    text: "The tab was hidden, so the browser took the lock back. AwakeTab asks again when you return."
  - state: denied
    text: "The browser refused the request, for example Safari before your first tap. The panel names the cause and the fix."
  - state: unsupported
    text: "No Screen Wake Lock API here; a fallback is offered instead."
  - state: fallback
    text: "A silent one-frame video is holding the display. It needs this tab visible and uses a little more battery."
rows:
  data:
    - title: "Settings"
      text: "Theme, colours, background, clock face, sounds, focus tools and your default duration are saved in this browser's storage. Clear the site's data and they are gone."
    - title: "Notes"
      text: "Kept in this browser's own storage (IndexedDB) and never uploaded. Voice typing goes through the browser's speech service; AwakeTab itself sends nothing."
    - title: "Pro previews"
      text: "A five-minute preview of a Pro item is never saved. A reload ends it and brings back your own choice."
    - title: "The current session"
      text: "Saved in this browser so a reload can offer to carry on where you left off."
    - title: "Your stats"
      text: "How long the screen was kept awake, day by day, counted and kept in this browser only."
    - title: "Usage events"
      text: "Anonymous and first-party, with no identifiers, no cookies and no fingerprinting. Turn them off with **Share anonymous usage data** in settings."
notes:
  pill:
    kicker: "Good to know"
    text: "The pill never shows \"Screen awake\" because you pressed Start. It changes only when the browser answers, so a refused or lost lock is always visible."
faq:
  - q: "Why does the pill say Starting… for a moment?"
    a: "That is the moment between the request and the browser's answer, usually too short to notice. AwakeTab waits for the real answer instead of guessing, so the pill moves on to Screen awake, or to Blocked with the reason, as soon as the browser replies."
  - q: "Can I use AwakeTab without a mouse?"
    a: "Yes. Every duration has a key, `Space` starts or stops, and the tool works with a keyboard and a screen reader. The pill is announced when its state changes."
  - q: "Does AwakeTab work offline?"
    a: "Yes, after your first visit. The page is cached by the browser, so a session starts without a connection. **Install AwakeTab** in the header also puts it on a home screen or dock."
honestLimit: "A wake lock keeps the display on only while this tab is visible, and only as long as the browser and the operating system allow it. AwakeTab shows when that stops; it cannot overrule it."
related:
  - "/learn/honest-limits"
  - "/learn/faq"
  - "/learn/browser-support-matrix"
  - "/learn/screen-wake-lock-api-guide"
  - "/extension"
author: soubhik
published: 2026-09-27
---

## What does AwakeTab do?

AwakeTab uses the browser's Screen Wake Lock API while its tab is visible. Pick a duration, from 15 minutes to 4 hours, a custom length up to seven days, or a clock time to stop at, and the display stops dimming and going to sleep. A work idle-lock policy can still lock the screen; that rule belongs to your organisation, not to the browser.

The status is the point. The pill reads "Screen awake" only while the browser is actually holding the lock. Hide the tab and the browser takes the lock back, so the pill switches to "Paused — tab hidden" until you come back, and AwakeTab asks for a new lock as soon as the tab is visible again.

Nothing needs installing. [Open AwakeTab](/) in any current browser, pick a duration and read the pill. It works offline after the first visit, and **Install AwakeTab** in the header puts it on a home screen or dock like an app.

## How does a session work?

Every session goes through the same three steps, whether you start it with a click, a key or a link such as a preset page.

::steps

A session that has no end time keeps asking for the lock until you stop it. A clock time works across midnight: pick 1:00 AM at 11:00 PM and the session ends tomorrow at 1:00 AM.

## What do the seven states mean?

A lock has exactly seven states, and the pill names the one you are in. Each state has its own words, shape and colour, so you never have to guess from a colour alone.

::pills

::note pill

Only two states run the timer: "Screen awake" and "Awake via video fallback". In every other state the countdown on screen stands still, because the screen is not being held. When a refusal has a known cause, such as a missing tap in Safari, the blocked panel names it and offers the one step that fixes it.

## What happens when you switch tabs or apps?

Browsers release a wake lock the moment its page is hidden. Switching tabs, minimising the window, changing apps on a phone and locking the phone all count as hidden. That is a rule every browser follows, not a setting AwakeTab can change.

AwakeTab does not hide this. The pill turns to "Paused — tab hidden", the countdown stops moving, and the end time stays where it was. When you come back, AwakeTab asks again and the pill returns to "Screen awake" once the browser agrees. A window that is visible but not focused keeps its lock, so AwakeTab can sit beside the document you are reading.

## What else can the screen show?

The wake lock is the core, and everything else sits around it without touching it. Twelve clock faces show the same session: Ring, Bold, Horizon and Tide; Flip, Nixie, LCD and LED; and Rolling, Analog, Rings and Words. Switch with the face name above the clock, a sideways swipe on the clock or `C`. **Settings → Appearance** adds colour themes, lamps, backgrounds and presets, each with a light and a dark version.

**Sounds** (`S`) plays brown, pink or white noise, rain, a café, a fireplace or a lo-fi loop, all made live in the browser, and an end sound marks the finish. The notepad (`N`) keeps notes and checklists beside the clock. Focus mode (`T`) runs a Pomodoro with pause and skip, and you can add an intention (`I`), a breathing guide (`B`) and a second time zone.

Each of these loads only the first time you use it, so the tool stays small. None of them changes the pill: sound never keeps the screen awake, and no face or theme hides a paused or blocked state. Pro items can be tried for five minutes, and a preview never touches the lock or the timer.

## Where do your settings and data go?

Your settings, the current session and your stats stay in the browser you are using. There is no account, so there is nothing on a server to sign in to.

::rows data

## When is the extension the better fit?

A web page can hold the screen only while it is visible. If you need the display awake behind other windows, or with the browser minimised, [AwakeTab for Chrome](/extension) uses Chrome's own power API instead. It works in Chrome and Edge on desktop, keeps working with the tab hidden, and its status is just as honest. It still cannot stop a laptop from sleeping when the lid closes.

## What does this page not cover?

This page explains the tool. The rules it cannot change, from a closed lid to your chat status, are on [Honest limits: what AwakeTab cannot do](/learn/honest-limits). Which browser versions support the wake lock is on [Wake lock browser support matrix](/learn/browser-support-matrix), and the questions people ask most are answered in [AwakeTab FAQ: the questions we are asked most](/learn/faq).

