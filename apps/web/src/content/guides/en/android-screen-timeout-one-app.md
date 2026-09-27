---
title: "Android screen timeout for one app — AwakeTab"
description: "Stock Android has one screen timeout for every app. How to keep a short timeout and still keep the screen on for one Chrome tab, step by step."
h1: "Android screen timeout for one app: keep it short, keep one tab on"
crumb: "Timeout for one app"
intent: "android screen timeout for one app"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "samsung-internet"]
os: ["android"]
lead: "Stock Android has no per-app screen timeout: Screen timeout is one setting for the whole phone. You can get close for the browser, though. Keep the phone's timeout short, and open AwakeTab in Chrome when you need the screen on. It stays lit while the tab is on screen, and your normal timeout returns the moment you leave."
toc:
  keep-one-tab-on-in-five-steps: "Five steps"
  if-the-app-you-need-is-not-a-browser-tab: "Another app"
  what-can-still-turn-the-screen-off: "What turns it off"
steps:
  - title: "Set the phone's timeout for everything else"
    short: "Set the phone's timeout"
    path: "Settings › Display › Screen timeout"
    text: "On a Pixel with Android 16, the path is Settings › Display & touch › Screen timeout. Pick the length you want for every other app. The longest choice depends on your phone."
  - title: "Open AwakeTab in Chrome and press Start"
    short: "Start in Chrome"
    path: "Chrome › awaketab.com"
    text: "Pick a length or an \"Until…\" time, then press Start. Chrome 84 or later and Samsung Internet 14 or later support it. Wait for the pill to say \"Screen awake\"."
  - title: "Keep the tab on screen"
    short: "Keep the tab on screen"
    path: "No Home, Recents or other apps"
    text: "Leaving Chrome or the tab ends the lock straight away, and the pill changes to \"Paused — tab hidden\". Your normal timeout applies again until you come back, and AwakeTab asks again when you do."
  - title: "Optional: put AwakeTab beside another app"
    short: "Optional: split screen"
    path: "Recents › app icon › Split screen"
    text: "Put your recipe or notes in one half and AwakeTab in the other, so the tab stays on screen. The steps differ by phone maker, and we have not yet recorded a device result for this setup."
  - title: "If the session disappears, keep Chrome awake"
    short: "Keep Chrome from sleeping"
    path: "Your phone maker's battery settings"
    text: "Some makers, Samsung's \"sleeping apps\" for example, can close Chrome after you leave it. Look for the list of apps that should never sleep and add Chrome. AwakeTab restores a session after the page reloads, so check the pill."
stepsDone: "All five done. If the screen you need is in another app, read the next section."
rows:
  blockers:
    - title: "The power button"
      text: "Pressing it turns the screen off, whatever the tab asked for."
    - title: "Leaving the tab"
      text: "Home, Recents, another app or another tab end the lock at once. The pill shows \"Paused — tab hidden\" until you return."
    - title: "Battery Saver"
      text: "Chrome does not refuse the wake lock because of it. It may shorten your timeout or dim the screen once you leave the tab."
    - title: "An older browser or a plain http page"
      text: "There is no Screen Wake Lock API there. AwakeTab offers \"Tap to use the fallback\", which uses more power."
toolNote: "Open AwakeTab in Chrome on the phone and press Start. The screen stays on only while this tab is on screen, and the pill says \"Screen awake\" once Chrome grants the lock. Leave the tab and your phone's own timeout takes over again, with nothing to undo."
faq:
  - q: "Can I set a longer screen timeout for Chrome only?"
    a: "Not on stock Android: Screen timeout is one setting for the whole phone. AwakeTab gets close for the browser, because the screen stays on only while its Chrome tab is on screen and your normal timeout returns when you leave."
  - q: "Will AwakeTab keep another app's screen on?"
    a: "No. A wake lock covers the page that asked for it. Another app keeps the phone's timeout, unless AwakeTab is on screen beside it in split screen, which we have not yet recorded on a device."
  - q: "Does Battery Saver stop Chrome keeping the screen on?"
    a: "No. Chrome has no Battery Saver check on the wake lock, so it is not refused. Battery Saver may still shorten your timeout or dim the display, which changes what happens after the session ends or once you leave the tab."
  - q: "Can I use AwakeTab's floating window on Android?"
    a: "No. The floating window needs a desktop browser feature that Chrome for Android lacks. Split screen is the nearest option, since it keeps the tab on screen beside another app."
honestLimit: "Stock Android has no per-app timeout, and AwakeTab covers its own browser tab only. Press Home or open another app and the phone goes back to its normal screen timeout."
related:
  - "/on/android-chrome"
  - "/on/samsung-internet"
  - "/for/cooking"
  - "/learn/browser-support-matrix"
  - "/guides/chrome-energy-saver"
author: soubhik
published: 2026-09-09
updated: 2026-09-28
---

## Keep one tab on in five steps

The paths are for stock Android and Pixel phones. Other makers can name these screens differently. Sources checked 26 September 2026.

::steps

## If the app you need is not a browser tab

A wake lock covers the page that asked for it, not the phone. A recipe app or a PDF reader follows the phone's timeout, unless it keeps the screen on by itself, even with AwakeTab running in Chrome behind it.

That leaves two honest options. Put AwakeTab in one half of split screen beside the other app, so the tab stays on screen; we have not yet recorded a device result for that, so check the pill. Or raise the phone's own timeout for as long as you need it, and lower it again afterwards, because a long timeout also drains the battery in your pocket. For a kitchen, the [cook mode page](/for/cooking) explains what works on a phone and what does not.

::ad

## What can still turn the screen off

If the screen goes dark with AwakeTab in front, one of these is usually the reason.

::rows blockers

The full Chrome walk-through, with what each Android setup does, is on [keep your Android screen on in Chrome](/on/android-chrome).
