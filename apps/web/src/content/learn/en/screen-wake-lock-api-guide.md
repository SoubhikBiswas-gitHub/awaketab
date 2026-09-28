---
title: "Screen Wake Lock API: guide and error handling — AwakeTab"
description: "How navigator.wakeLock.request('screen') works, why it throws NotAllowedError, how to re-acquire after visibilitychange, and support as of September 2026."
h1: "Screen Wake Lock API: a practical guide with error handling"
crumb: "Screen Wake Lock API"
intent: "screen wake lock api"
secondaryQueries:
  - "navigator.wakeLock.request"
  - "wake lock notallowederror"
  - "screen wake lock visibilitychange"
  - "wake lock iframe permissions policy"
  - "screen wake lock safari"
preset: p15
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet", "opera"]
os: []
lead: "`navigator.wakeLock.request('screen')` asks the browser to keep the display on. It works only on a secure (HTTPS) page that is visible. The browser releases the lock when the page is hidden and never asks again by itself. This guide gives you code for each step, the reasons a request fails, and support as of 26 September 2026."
toc:
  which-browsers-support-it: "Browser support"
  how-do-i-ask-for-a-wake-lock: "Ask for a lock"
  why-did-request-throw-notallowederror: "NotAllowedError"
  why-a-request-fails-by-engine: "By engine"
  what-happens-when-the-tab-is-hidden: "When the tab is hidden"
  what-does-the-whole-lifecycle-look-like: "The lifecycle"
  can-a-page-in-an-iframe-ask-for-one: "Inside an iframe"
  how-do-i-let-go-on-purpose: "Let go on purpose"
  the-video-fallback-trade-off: "The video fallback"
  what-can-a-wake-lock-not-do: "Limits"
rows:
  support:
    - title: "Chrome and Edge"
      value: "84 and later"
    - title: "Opera"
      value: "70 and later"
    - title: "Samsung Internet"
      value: "14 and later"
    - title: "Firefox"
      value: "126 and later (May 2024)"
    - title: "Safari on Mac, iPhone and iPad"
      value: "16.4 and later (March 2023)"
    - title: "iPhone and iPad Home Screen web apps"
      value: "iOS 18.4 and later"
  errors:
    - title: "The page is hidden or not active"
      text: "The request is rejected, and a held lock is released. AwakeTab shows \"Paused — tab hidden\" and asks again when you come back."
    - title: "A Permissions-Policy blocks it"
      text: "Common in an iframe without `allow=\"screen-wake-lock\"`. AwakeTab shows \"Blocked — here's the fix\"."
    - title: "Safari has not had a tap yet"
      text: "Safari wants a recent tap on the page. AwakeTab shows \"Blocked — here's the fix\", and tapping Retry is that tap."
    - title: "Firefox is at 5 % battery or less and not charging"
      text: "Firefox refuses new locks and releases held ones. Plug in, then tap Retry."
    - title: "The page is not on HTTPS"
      text: "There is no `navigator.wakeLock`, so nothing is rejected. AwakeTab calls this unsupported and offers the video fallback after a tap."
notes:
  hidden:
    kicker: "Good to know"
    text: "The browser releases the lock the moment the page is hidden, and it never asks again by itself. Listen for `visibilitychange` and request a new lock when the page is visible again."
code:
  wake-lock.js:
    lang: js
    text: |
      let sentinel = null;
      let wanted = false;

      async function keepScreenOn() {
        wanted = true;
        if (!('wakeLock' in navigator)) return 'unsupported';
        try {
          const s = await navigator.wakeLock.request('screen');
          s.addEventListener('release', () => {
            if (sentinel === s) sentinel = null;
          });
          sentinel = s;
          return 'held';
        } catch (err) {
          // NotAllowedError: page hidden, Permissions-Policy,
          // no tap yet in Safari, or Firefox at 5% battery or less
          console.warn(`${err.name}: ${err.message}`);
          return 'refused';
        }
      }

      startButton.addEventListener('click', keepScreenOn);
  resume.js:
    lang: js
    text: |
      document.addEventListener('visibilitychange', () => {
        if (wanted && !sentinel && document.visibilityState === 'visible') {
          keepScreenOn();
        }
      });
  embed.html:
    lang: html
    text: |
      <iframe src="https://widget.example.com/timer" allow="screen-wake-lock"></iframe>
  headers.txt:
    lang: text
    text: |
      Permissions-Policy: screen-wake-lock=(self "https://widget.example.com")
  stop.js:
    lang: js
    text: |
      async function letScreenSleep() {
        wanted = false;
        const s = sentinel;
        sentinel = null;
        await s?.release();
      }

      stopButton.addEventListener('click', letScreenSleep);
lifecycle:
  title: "Wake lock lifecycle"
  desc: "Ready moves to Starting when the page calls request. Starting moves to Screen awake when the browser grants the lock. Screen awake moves to Paused, tab hidden, when the page is hidden. When the page is visible again it requests a new lock and returns to Starting."
  edges:
    granted: "granted"
    hidden: "tab hidden"
    visible: "visible again"
    noApi: "no wakeLock in navigator"
    tap: "tap"
  others: "Other ways out"
  caption: "Labels are the exact pill copy. A timer runs only in \"Screen awake\" and \"Awake via video fallback\"."
faq:
  - q: "Does the Screen Wake Lock API show a permission prompt?"
    a: "Not in Chromium: its screen-wake-lock permission is allowed by default, so a visible, top-level HTTPS page gets the lock without asking. Safari's condition is a recent tap on the page, and Firefox's is a battery above 5 % or a charger."
  - q: "Why does the release event fire when my code never called release()?"
    a: "The browser releases the lock when the page becomes hidden, and Firefox also releases it when the battery drops to 5 % or less while unplugged. Check document.visibilityState in the handler: if the page is still visible, the browser took the lock back for another reason."
  - q: "Does a wake lock work on localhost?"
    a: "Yes. Browsers treat http://localhost as a secure context, so navigator.wakeLock exists there. A plain http:// address on your local network does not count, so test phones over HTTPS or through a tunnel."
  - q: "Can a service worker or web worker hold a wake lock?"
    a: "No. The WakeLock interface is exposed on the window only, and the lock is tied to a visible document. A worker can't ask for one, and a page can't keep one while it is in the background."
  - q: "Is it a problem to call request() while I already hold a lock?"
    a: "It works: each call returns a new sentinel, and the screen stays on while any of them is unreleased. Keep one reference and check sentinel.released before asking again, so stray sentinels don't keep the screen on after you meant to stop."
honestLimit: "The Screen Wake Lock API holds only while the document is visible. No code can keep the screen on from a hidden tab, a closed laptop or another app; for those, the answer is an OS setting or a browser extension."
related:
  - "/learn/browser-support-matrix"
  - "/vs/nosleep-js"
  - "/library"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/embed"
  - "/learn/how-we-tested"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Which browsers support it?

Versions as of 26 September 2026. Support claims come from browser documentation and engine source; real-device results appear in the [wake lock browser support matrix](/learn/browser-support-matrix) once recorded, with platforms, notes and sources for each row.

::rows support

## How do I ask for a wake lock?

Call `request('screen')` from a visible page served over HTTPS. Keep the object it returns: it is your only proof that the lock is held, and its `release` event tells you when it is gone. The `wakeLock` property only exists in secure contexts, so check with `'wakeLock' in navigator` rather than calling and catching: calling `request` on `undefined` throws a `TypeError` that looks like a bug in your code. `https://` pages and `http://localhost` count as secure.

::code wake-lock.js

Start the request from a click handler: that click is the tap Safari needs. The `wanted` flag separates "the user asked for the screen to stay on" from "the browser currently holds a lock". The browser can drop the second at any time; only the user should change the first. `@awaketab/wake` wraps this pattern, with a gesture-aware video fallback and a `change` event every time the state moves. Its source is MIT on GitHub, and the npm package is coming soon; the [@awaketab/wake library page](/library) runs a live demo.

## Why did request() throw NotAllowedError?

The browser rejects the promise with `NotAllowedError` for a small set of reasons. Battery saver modes are not one of them in Chromium or Safari. Here is what each cause looks like and what AwakeTab shows.

::rows errors

## Why a request fails, by engine

Checked against engine source on 26 September 2026.

| Cause | Chromium (Chrome, Edge, Opera, Samsung Internet) | WebKit (Safari) | Gecko (Firefox) |
|---|---|---|---|
| Page hidden or tab not active | `NotAllowedError`; a held lock is released | Same | Same |
| Permissions-Policy or iframe without `allow` | `NotAllowedError` | `NotAllowedError` | `NotAllowedError` |
| No recent user gesture | No check | `NotAllowedError` without a recent tap or an earlier gesture | No check |
| Battery at or below 5 %, unplugged | No check | No check | `NotAllowedError`; a held lock is released |
| Battery saver, Energy Saver or Low Power Mode | No check | No check | No check beyond the 5 % rule |
| Plain http page | `navigator.wakeLock` is undefined | Same | Same |

Sources: [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc), [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp) and [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp).

The battery-saver row matters because many pages, including earlier versions of ours, blamed battery savers for `NotAllowedError`. The engines don't check for them. A saver can still change how long the device waits before the display goes dark, but that happens in the operating system's settings, outside the browser, and your promise never rejects because of it.

::ad

## What happens when the tab is hidden?

Switching tabs or apps, minimising the window or locking the phone hides the document. A visible window that has lost focus keeps its lock. The sentinel fires `release`, and your page should show that honestly instead of a running timer. The same event fires when you call `release()` yourself and when the browser takes the lock back for its own reasons.

::note hidden

::code resume.js

Safari usually accepts that second request thanks to the earlier tap; if it rejects, show a button so the next tap can ask.

## What does the whole lifecycle look like?

Each box is one of AwakeTab's pill messages. The dashed line is the step most pages forget: asking again when the tab comes back.

::lifecycle

## Can a page in an iframe ask for one?

Only if the parent page allows it. The `screen-wake-lock` feature is allowed for the page's own origin by default; a cross-origin iframe needs the embedding page to delegate it with `allow="screen-wake-lock"`. Without it, the Permissions-Policy blocks the request and it fails with `NotAllowedError`, which is why "iframe without `allow`" is the first thing to check when a widget works on its own and fails when embedded.

::code embed.html

A site can also switch the feature off, or allow named origins, with a response header. `screen-wake-lock=()` blocks it everywhere on that page, including in the top-level document.

::code headers.txt

## How do I let go on purpose?

When the user stops or the time is up, release the lock and clear the flag that says they wanted it. Otherwise your `visibilitychange` handler will ask again the next time the tab is shown.

::code stop.js

## The video fallback trade-off

Before the API, libraries kept screens on by playing a tiny silent video in a loop. It still works as a fallback for browsers without the API, with three costs. It needs a user gesture, because browsers block video autoplay until someone interacts. It uses more power than a native lock, since the media pipeline stays busy. And your code can't easily tell whether it is working, only whether `play()` resolved. Use it only when `wakeLock` is missing, never as a second attempt after a `NotAllowedError`. [NoSleep.js vs @awaketab/wake](/vs/nosleep-js) compares two libraries that handle this differently.

## What can a wake lock not do?

It keeps the display on while the page is visible. It can't hold from a hidden tab, stop a laptop sleeping when the lid closes, or change an operating system rule such as a work sign-in lock. It sends no input, so it doesn't change a chat app's Away timer. On desktop Chrome or Edge, an extension with the `power` permission, such as [AwakeTab for Chrome](/extension), can keep the screen on from a hidden tab; a web page can't.

