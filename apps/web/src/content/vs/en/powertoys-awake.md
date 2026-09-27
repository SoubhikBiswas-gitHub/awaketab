---
title: "PowerToys Awake alternative in a browser — AwakeTab"
description: "PowerToys Awake keeps Windows awake, with the screen off by default or on. AwakeTab needs no install but only holds while its tab is visible."
h1: "AwakeTab vs PowerToys Awake"
crumb: "PowerToys Awake"
intent: "powertoys awake alternative"
secondaryQueries:
  - "powertoys awake keep screen on"
  - "keep windows awake without installing"
  - "powertoys awake not working lock screen"
  - "keep pc awake without admin rights"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["windows"]
lead: "If you can install PowerToys, Awake is the stronger Windows tool: it keeps the PC awake whatever is in front, for a set time or until a date and time, with the screen off or on. AwakeTab fits when you can't install software, or when you want a countdown and a status you can see. It holds only while its browser tab stays visible."
toc:
  side-by-side: "Side by side"
  when-powertoys-awake-is-the-better-choice: "When Awake is better"
  when-awaketab-is-the-better-choice: "When AwakeTab is better"
  neither-keeps-a-locked-pcs-screen-on: "A locked PC"
  confirm-which-one-is-working: "Confirm which one works"
compare:
  label: "AwakeTab compared with PowerToys Awake, checked 26 September 2026"
  what: "What"
  cols:
    - name: "AwakeTab"
      us: true
    - name: "PowerToys Awake"
  rows:
    - what: "How it keeps Windows awake"
      cells: ["Screen Wake Lock API; the browser asks Windows to keep the display on", "Power request from a background app"]
    - what: "With the tab hidden or no window open"
      cells: ["Stops. The pill says \"Paused — tab hidden\" and asks again when you return.", "Keeps holding. It has no tab."]
    - what: "Screen"
      cells: ["On while the lock holds", "Off by default, on with \"Keep screen on\""]
    - what: "When it ends"
      cells: ["After a set time, at a clock time such as 5:30 PM, or when you stop it", "With no end, after a time interval, or at a date and time"]
    - what: "Install"
      cells: ["None, open a web page", "PowerToys installer; may need admin rights on a managed PC"]
    - what: "Platforms"
      cells: ["Windows, macOS, Linux, ChromeOS, Android, iPhone, iPad", "Windows"]
    - what: "Price"
      cells: ["Free, with optional Pro", "Free, open source"]
    - what: "Last release"
      cells: ["Web app, see the [changelog](/changelog)", "PowerToys 0.101, August 2026"]
    - what: "Facts checked"
      cells: ["26 September 2026", "26 September 2026"]
      same: true
picks:
  them:
    - title: "A long job where the screen can go dark"
      text: "A build, a large download or an AI agent in a terminal needs the PC awake, not the display. Awake does that and saves the power a lit screen would use. [Keep your computer awake while an AI agent or long build runs](/for/ai-agents) compares the options."
    - title: "You live in other apps all day"
      text: "Awake holds while you work full screen in Excel or a game. A tab can't."
    - title: "You script your setup"
      text: "The command-line flags tie Awake to a task's lifetime."
  us:
    - title: "You can't install PowerToys"
      text: "On a work laptop with no admin rights, a web page may be the only tool available. It leaves sign-in and lock policies as IT set them."
    - title: "You want to see the state from across the room"
      text: "Presenting, a wall dashboard or a report you read without touching: the pill says \"Screen awake\" only once the browser grants the lock."
    - title: "You want a timed session with an end you can see"
      text: "Pick 1 h or an end time such as 5:30 PM. A chime and a \"Time's up\" prompt let you add 15 minutes."
    - title: "You also use a Mac, Chromebook or phone"
      text: "The same page works there."
    - title: "You like Awake's two levels"
      text: "[AwakeTab for Chrome](/extension) has a similar pair for Chrome and Edge: Screen keeps the display on, System keeps only the computer awake, and both keep working when the tab is hidden."
faq:
  - q: "Why does my screen still turn off with PowerToys Awake on?"
    a: "By default Awake keeps the computer awake but lets the displays turn off. Turn on the “Keep screen on” switch in Awake's settings, or pass --display-on true when you run it from the command line."
  - q: "Does PowerToys Awake need admin rights?"
    a: "Installing PowerToys may need admin rights, depending on how your PC is managed, and IT can switch Awake off with a group policy that Microsoft documents. AwakeTab installs nothing, which is why it is often the option left on a locked-down laptop."
  - q: "Does AwakeTab have a screen-off mode like Awake?"
    a: "The web page always keeps the screen on, and while it does, Windows does not idle-sleep. For the computer awake with the screen free to turn off, AwakeTab for Chrome has a System level that works in Chrome and Edge even when the tab is hidden."
honestLimit: "PowerToys Awake holds whatever is in front. AwakeTab holds only while its tab is visible, so for a long job behind other windows, Awake or AwakeTab for Chrome is the better fit."
related:
  - "/on/windows-11"
  - "/for/ai-agents"
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/for/work-laptop"
  - "/vs/caffeine"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Side by side

PowerToys Awake is one of Microsoft's PowerToys utilities. It tells Windows the machine must stay awake without touching your power plan. It also runs from the command line as `PowerToys.Awake.exe`, and `--pid` ends it when a given process exits. AwakeTab works through the browser: in Chrome or Edge, a visible AwakeTab tab asks Windows to keep the display on, and while it does, Windows does not idle-sleep. Facts about Awake come from Microsoft Learn, checked 26 September 2026. Rows marked Same are real ties.

::compare

::ad

## When PowerToys Awake is the better choice

It is a good tool. In these cases we would send you there.

::picks them

## When AwakeTab is the better choice

These are the jobs AwakeTab was built for.

::picks us

## Neither keeps a locked PC's screen on

Microsoft says Awake doesn't work while the lock screen is showing, because the lock screen runs in a separate security context. A browser tab can't help there either. Windows also turns the monitor off about 60 seconds after you lock the PC, separately from your normal timeout. [Windows 11 screen turns off after 1 minute](/guides/windows-11-screen-turns-off-after-1-minute) explains the `powercfg` setting Microsoft documents for it.

## Confirm which one is working

In an administrator terminal, run `powercfg /requests`. With AwakeTab showing "Screen awake" in Chrome or Edge, the browser appears under DISPLAY. The Windows settings behind this are in [Keep the screen on in Windows 11 and 10](/on/windows-11).
