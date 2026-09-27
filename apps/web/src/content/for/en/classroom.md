---
title: "Keep the classroom screen on while you teach — AwakeTab"
description: "Keep a teacher laptop or classroom display on through the lesson, with no install and no admin rights. A school lock policy still applies; ask IT."
h1: "Keep the classroom screen on while you teach"
intent: "keep classroom screen on"
secondaryQueries:
  - "stop teacher laptop going to sleep during lesson"
  - "keep school chromebook screen on"
  - "keep projector on during class"
  - "classroom clock that keeps screen on"
preset: p60
mode: clock
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "safari", "firefox"]
os: ["chromeos", "windows", "macos", "ipados"]
faq:
  - q: "Will I still have to type my password in the middle of a lesson?"
    a: "Not if the prompt comes from the screen timing out: with the display kept on, it never gets there. If your school also locks the laptop after a set time without input, that lock still happens. Only IT can change it."
  - q: "Can I use it on a school Chromebook?"
    a: "Yes, in Chrome, while its tab is visible. Your school’s admin settings still decide the rest: a power or lock policy wins, and closing the lid sleeps the Chromebook unless the lid setting has been turned off. If wake locks are switched off, the pill tells you so."
  - q: "Is anything recorded about my students?"
    a: "No. AwakeTab has no accounts, no sign-in and no cookies, and it never asks for a name. Settings stay in the browser on your device. Anonymous usage counts are on by default, carry no personal details, and can be turned off in Settings."
  - q: "Can the class see a countdown for an activity?"
    a: "Yes. Pick a length such as 15 min and switch to Standard mode for the ring and the minutes left, or stay on Clock for the time of day. When it ends you get a chime, or silence if you set the end sound to None."
honestLimit: "AwakeTab keeps the display on only while its tab is visible on the teacher device. A school lock policy, an admin who has switched wake locks off, or a closed Chromebook lid still wins."
related:
  - "/for/presentations"
  - "/on/chromebook"
  - "/guides/lock-screen-vs-sleep"
  - "/for/work-laptop"
  - "/on/windows-11"
  - "/extension"
author: soubhik
published: 2026-09-27
updated: 2026-09-27
---

Keep the classroom screen on through the lesson. No install, no admin rights. Keeps the display on while this tab is visible. A school policy that locks the screen still applies; ask IT about the timeout. Before the lesson, open AwakeTab on the teacher laptop, tap "Until…" and pick when the lesson ends, then leave it on screen as a clock the class can read.

## Why the screen goes dark mid-lesson

Teacher laptops are often set to turn the display off, or sleep, after a few minutes without a key press. That makes sense in an empty classroom and gets in the way when you're talking at the front. Every time it happens you walk back, wake the laptop and type a password while thirty people wait.

AwakeTab deals with the first of those, the display timeout, and nothing more. A separate rule that locks the laptop after a set time still runs. If you're unsure which one is catching you, read [Lock screen versus display sleep](/guides/lock-screen-vs-sleep).

## Set it up before the bell

1. Open AwakeTab in Chrome, Edge, Safari or Firefox on the teacher laptop.
2. Tap "Until…" and choose the end of the lesson, such as 10:50 AM. For a one-hour class you can pick 1 h instead.
3. Choose Clock mode for a large time the class can read, or Standard to show a countdown ring.
4. Tap Start. Within a second or two, "Starting…" on the pill should turn into "Screen awake".
5. Optional: in Settings, set the end sound to None, and "When time is up" to "Just stop" if you don't want a prompt at the end.

## The projector or interactive board

A projector or board connected as a second display follows your laptop's display timeout. When AwakeTab keeps the display on, the board stays lit too.

With an extended display, put AwakeTab's clock on the board and keep your notes on the laptop. If you show slides in full screen on the same display as AwakeTab, the slides cover it and the pill reads "Paused — tab hidden". [Keep the screen on while presenting](/for/presentations) covers the floating window and other options.

## A clock or countdown the class can see

Clock mode shows the time in large numerals, in 12-hour or 24-hour format. For a timed task, start a 15-minute session, or a custom length, in Standard mode: the ring and the minutes left are visible across the room, and a chime marks the end.

## School-managed Chromebooks and Windows laptops

On a device your school manages, the administrator's settings come first. Google's own Chromebook Help says that at work or school "you might not be able to change your sleep settings" ([Google Chromebook Help](https://support.google.com/chromebook/answer/3420029), checked 26 September 2026). Plainly:

- **A power or lock policy set by an admin wins.** AwakeTab keeps the display on while it can; a policy that locks the device still locks it.
- **Wake locks can be switched off.** If the school has done that, the pill reads "Blocked — here's the fix" and says why, instead of pretending.
- **The lid still matters.** A Chromebook goes to sleep when you shut it, unless someone has switched off "Sleep when cover is closed". Windows laptops usually sleep on lid close too.

If the timeout is too short for teaching, ask IT whether teacher devices can have a longer display timeout during lessons. That fixes it for every app, not only a browser tab. [Keep a Chromebook screen on](/on/chromebook) has the Chromebook settings.

If your school allows extensions, [AwakeTab for Chrome](/extension) keeps the screen on even with the tab hidden behind full-screen slides.

## Nothing to sign in, nothing about students

AwakeTab has no accounts and sets no cookies. Students have nothing to join, and nothing asks for a name. Your settings stay in the browser on your device.
