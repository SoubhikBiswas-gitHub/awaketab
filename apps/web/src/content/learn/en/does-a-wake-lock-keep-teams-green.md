---
title: "Does keeping the screen on keep Teams green? — AwakeTab"
description: "No. Teams shows Away after about 5 minutes without keyboard or mouse input, and Slack after 10, even with the screen on. Here is what sets your status."
h1: "Does keeping your screen on keep Teams green? No. Here's why"
crumb: "Teams status and wake locks"
intent: "does wake lock keep teams status green"
secondaryQueries:
  - "keep teams status green"
  - "teams goes away after 5 minutes"
  - "slack away after 10 minutes"
  - "does keeping screen on keep teams active"
  - "why does teams show me away"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: []
os: ["windows", "macos"]
lead: "No. Microsoft Teams sets you to Away after about five minutes without keyboard or mouse activity, and Slack after about ten, whether or not the screen is on. A wake lock only stops the display sleeping. It sends no input, so your status changes as it normally would. AwakeTab never fakes input."
toc:
  how-does-teams-decide-youre-away: "How Teams decides"
  how-does-slack-decide-youre-away: "How Slack decides"
  why-doesnt-a-lit-screen-count-as-activity: "Screen on is not input"
  why-does-teams-say-away-while-youre-working: "When Teams disagrees"
  what-actually-keeps-your-status-right: "Keep your status right"
  why-wont-awaketab-fake-input: "Why we won't fake input"
  are-mouse-jigglers-a-policy-risk: "Mouse jigglers"
  what-can-awaketab-do-for-you-at-work: "Limits at work"
rows:
  teams:
    - title: "Activity"
      text: "Whether you have typed or moved the mouse recently."
    - title: "The Teams app"
      text: "Whether you are in a call or presenting."
    - title: "Your Outlook calendar"
      text: "Whether a meeting is booked."
  disagree:
    - title: "You're reading, not typing."
      text: "A long document or a dashboard you only watch is exactly what the inactivity timer can't see. Nothing is wrong; the status can't tell reading from absence."
    - title: "You're signed in on two devices."
      text: "Microsoft says the device where you were active most recently decides your presence. Pick up your phone, put it down with Teams in the background, and that can be the device reporting you."
    - title: "You locked the computer."
      text: "Microsoft lists a locked computer as a reason for Away, whatever the screen does next."
  status:
    - title: "Set your status yourself."
      text: "In Teams, choose Busy, Do not disturb or Be right back from your profile picture and give it a duration. Without one, Microsoft says a manual Busy or Do not disturb lasts a day and most others seven days. Its documentation also says you can only pick a status less available than the automatic one, so you can't pin Available over Away."
    - title: "Write a status message."
      text: "\"Reading the Q3 pack, back on chat at 2:30 PM\" answers the question a grey or yellow dot raises."
    - title: "Use your calendar."
      text: "A booked block shows as In a meeting in Teams, and focus time can show as Focusing. It tells people when you'll reply without anyone guessing."
    - title: "In Slack, set a status with an end."
      text: "Pick \"Clear after\" so it doesn't linger after you're back."
    - title: "Talk to your manager."
      text: "If long reading or thinking stretches keep making you look absent, agree how your team signals that. It is the only fix that works for everyone."
notes:
  offline:
    kicker: "Good to know"
    text: "The last row is the one thing a wake lock does change. While a browser keeps the display on, neither Windows nor macOS idle-sleeps, so you stay Away rather than dropping to Offline. That can matter if your team reads Offline as \"not working today\". It still isn't Available."
faq:
  - q: "Why did Teams show me Offline instead of Away?"
    a: "Teams shows Offline when your computer goes to sleep, or when you're signed out of Teams everywhere. Away is the inactivity state. Keeping the screen on stops the computer idle-sleeping, so you would see Away rather than Offline after you step away."
  - q: "Can I make Teams wait longer than 5 minutes before showing Away?"
    a: "Microsoft's presence documentation (checked 26 September 2026) describes no user setting for the inactivity timer. The supported route is to set a status yourself, with a duration, and a status message that says where you are."
  - q: "Does AwakeTab connect to Teams or Slack?"
    a: "No. It has no connection to any chat app and sends no keyboard or mouse input. Your colleagues see whatever status Teams or Slack works out from your real activity, your calendar and anything you set by hand."
  - q: "Does the Teams mobile app follow the same rules?"
    a: "Not quite. Microsoft says a phone shows you Away whenever the Teams app is in the background, and Offline after 24 hours of inactivity. Keeping a browser tab awake on the same phone puts Teams in the background, so it can't help there either."
honestLimit: "A lit screen is not activity. Whatever AwakeTab does for your display, Teams and Slack keep counting the minutes since your last key press or mouse movement, and your status follows that count."
related:
  - "/for/work-laptop"
  - "/vs/mouse-jigglers"
  - "/for/presentations"
  - "/guides/lock-screen-vs-sleep"
  - "/for/video-calls"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## How does Teams decide you're Away?

[Microsoft's admin documentation](https://learn.microsoft.com/en-us/microsoftteams/presence-admins) says that on a computer, your presence "becomes Away automatically if they're inactive for a few minutes or if the computer is locked; and it becomes Offline when the computer enters sleep mode". Its [troubleshooting article](https://learn.microsoft.com/en-us/troubleshoot/microsoftteams/teams-im-presence/presence-not-show-actual-status) puts the figure at more than five minutes of inactivity (Microsoft Learn, both checked 26 September 2026). Three things feed that status:

::rows teams

On a phone the rule is different again: Teams shows Away as soon as the app goes into the background.

## How does Slack decide you're Away?

[Slack Help](https://slack.com/help/articles/201864558) says you're set to away "after ten minutes of desktop inactivity or if you navigate away or close the app on your mobile device" (Slack Help, article 201864558, checked 26 September 2026). You can set yourself as away or active from your profile picture, and a status can clear itself after a time you choose.

Other chat and meeting tools, Zoom and Google Chat among them, also work out presence from activity and meetings. Their help pages give their own rules; check them rather than assuming the Teams numbers apply.

::ad

## Why doesn't a lit screen count as activity?

Your computer runs two separate clocks. One is the operating system's display timeout, which dims and then turns off the screen. The other is each chat app's own inactivity timer. A wake lock pauses the first and never touches the second.

| What happens | Screen | Teams shows |
|---|---|---|
| You are typing or using the mouse | On | Available |
| You stop for 5 minutes, AwakeTab tab visible | On | Away |
| You lock the computer | Off after a while | Away |
| The computer goes to sleep | Off | Offline |
| You step away for an hour, AwakeTab holding | On, no idle sleep | Away |

::note offline

## Why does Teams say Away while you're working?

The status can only see input, calls and your calendar. These are the usual reasons it gets you wrong:

::rows disagree

## What actually keeps your status right?

Tell people where you are instead of making the computer look busy. Each of these works with Teams or Slack, not against it:

::rows status

## Why won't AwakeTab fake input?

The loudest request in this category is "keep me green". Faking it would mean moving the pointer or sending key presses, which makes your status say something that isn't true, to people who rely on it. AwakeTab keeps the screen on so you can read, watch or present, and it says plainly when it can't. If the browser takes the lock back because you switched tabs, the pill reads "Paused — tab hidden" rather than pretending.

## Are mouse jigglers a policy risk?

Mouse jigglers exist to change presence, and some employers treat that as misconduct. In June 2024, Bloomberg reported that more than a dozen Wells Fargo staff had been let go over simulated keyboard activity. [AwakeTab vs mouse jigglers](/vs/mouse-jigglers) sets out what each one does and when either makes sense, without tips for looking busy.

## What can AwakeTab do for you at work?

It keeps a report, a dashboard or your slides on screen while you read or talk, without changing settings or needing admin rights. Your IT team's sign-in and lock rules still apply. The guide to [keeping a work laptop display awake](/for/work-laptop) walks through the setup, and what to do when your organisation's lock rule is shorter than your reading.

