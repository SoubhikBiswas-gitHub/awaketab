---
title: "NoSleep.js vs the Wake Lock API — AwakeTab"
description: "NoSleep.js last shipped in December 2020 and uses the Wake Lock API where present. @awaketab/wake does too, and tells your code what happened."
h1: "NoSleep.js vs @awaketab/wake"
crumb: "NoSleep.js"
intent: "nosleep.js alternative"
secondaryQueries:
  - "nosleep.js vs wake lock"
  - "nosleep.js alternative"
  - "nosleep.js wake lock api"
  - "nosleep.js maintained"
  - "keep screen awake javascript library"
preset: p15
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet", "opera"]
os: []
lead: "NoSleep.js 0.12.0, its last release (16 December 2020), already calls the Screen Wake Lock API when the browser has it, and falls back to a hidden looping video when it doesn't. If it works for you, there is no emergency. `@awaketab/wake` takes the same first step, then tells your code what happened: seven states, and a reason with every change. It is an actively maintained alternative, MIT-licensed."
toc:
  side-by-side: "Side by side"
  when-nosleepjs-is-the-better-choice: "When NoSleep.js is better"
  when-awaketabwake-is-the-better-choice: "When @awaketab/wake is better"
  the-same-job-in-code: "The same job in code"
compare:
  label: "@awaketab/wake compared with NoSleep.js 0.12.0, checked 26 September 2026"
  what: "What"
  cols:
    - name: "@awaketab/wake"
      us: true
    - name: "NoSleep.js 0.12.0"
  rows:
    - what: "How it keeps the screen on"
      cells: ["Wake Lock API; a video fallback after a tap, only where the API is missing", "Wake Lock API if present; hidden looping video otherwise; a page-reload timer on very old iOS"]
    - what: "With the tab hidden"
      cells: ["No", "No"]
      same: true
    - what: "Install"
      cells: ["Copy `packages/wake` from the repository; npm package coming soon", "The npm package `nosleep.js`"]
    - what: "Platforms"
      cells: ["Browsers; returns an inert handle during server rendering", "Browsers"]
    - what: "Status"
      cells: ["Seven states, with a `change` event carrying `from`, `to`, `reason` and `advice`", "`isEnabled`, a boolean"]
    - what: "Asks again after the tab returns"
      cells: ["Yes, on both, controlled by `reacquireOnVisible`", "Yes, on `visibilitychange` and `fullscreenchange`"]
    - what: "When the browser takes the lock back"
      cells: ["Moves to `lost` with a reason", "Logs a console message"]
    - what: "Licence and price"
      cells: ["MIT, free", "MIT, free"]
      same: true
    - what: "Last release"
      cells: ["Source on GitHub; not yet published", "0.12.0, 16 December 2020"]
picks:
  them:
    - title: "It already works and you only show an on/off switch"
      text: "On current browsers it makes the same API call. Switching buys you status reporting, not a stronger lock."
    - title: "You need a package from npm today"
      text: "`@awaketab/wake` isn't published yet, and some teams can't vendor source."
  us:
    - title: "Your users see the status"
      text: "A kiosk or dashboard that says \"awake\" should only say it while the lock holds. `held` means a live lock, and `fallback` means the video is really playing."
    - title: "You need to know why it failed"
      text: "A missing `allow=\"screen-wake-lock\"` on an iframe, a hidden page and an http origin each get their own advice code."
    - title: "You use a framework"
      text: "`@awaketab/wake/react`, `/preact` and `/vue` export a `useWakeLock()` hook that returns the state with `request` and `release`."
code:
  nosleep.js:
    lang: js
    text: |
      import NoSleep from 'nosleep.js';

      const noSleep = new NoSleep();
      startButton.addEventListener('click', () => {
        noSleep.enable().catch((err) => console.warn(err.name));
      });
      stopButton.addEventListener('click', () => noSleep.disable());
  wake.ts:
    lang: ts
    text: |
      import { createWakeLock } from '@awaketab/wake';

      const lock = createWakeLock();
      lock.on('change', ({ from, to, reason, advice }) => {
        console.log(`${from} -> ${to} (${reason})`, advice ?? '');
      });
      startButton.addEventListener('click', () => lock.request());
      stopButton.addEventListener('click', () => lock.release());
faq:
  - q: "Does NoSleep.js still work in 2026?"
    a: "On browsers with the Screen Wake Lock API, yes: version 0.12.0 calls navigator.wakeLock.request('screen') first. Its video path is only reached where the API is missing. We have not re-checked that video path on current iOS."
  - q: "Is @awaketab/wake a drop-in replacement for NoSleep.js?"
    a: "No. The calls differ: createWakeLock(), request() and release() instead of new NoSleep(), enable() and disable(). Moving over is a few lines, and in return you get change events you can show to your users."
  - q: "Why does the video fallback need a click?"
    a: "Browsers block video autoplay until the person has interacted with the page. If play() is refused, @awaketab/wake stays in the unsupported state and emits an error event, so call request() again from a click or tap handler."
  - q: "Can I use @awaketab/wake before the npm package is out?"
    a: "Yes. The source is MIT-licensed in the packages/wake folder of the AwakeTab repository on GitHub. Copy it into your project and build it with your own bundler. The npm package is coming soon."
honestLimit: "Neither library can keep a hidden tab awake. Every browser releases the wake lock when the page is hidden; the most a library can do is ask again when the page returns, and tell you it did."
related:
  - "/library"
  - "/learn/screen-wake-lock-api-guide"
  - "/vs/nosleep-page"
  - "/learn/browser-support-matrix"
  - "/embed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Side by side

When NoSleep.js was written, a silent video was the only way to keep most phones awake. The Screen Wake Lock API arrived in Chrome and Edge 84 (July 2020), Safari 16.4 (March 2023) and Firefox 126 (May 2024). For the API itself, see [Screen Wake Lock API: a practical guide with error handling](/learn/screen-wake-lock-api-guide). Facts about NoSleep.js come from its source on GitHub. Rows marked Same are real ties.

::compare

::ad

## When NoSleep.js is the better choice

It is a good library. In these cases we would send you there.

::picks them

## When @awaketab/wake is the better choice

These are the jobs `@awaketab/wake` was built for.

::picks us

## The same job in code

NoSleep.js:

::code nosleep.js

`@awaketab/wake`:

::code wake.ts

`request()` does not throw. It resolves with the resulting state: `held` when the browser grants the lock, `fallback` when the video is playing, `denied` or `unsupported` when neither worked. When a state changes for a reason you can act on, `advice` names it, for example `hidden_document`, `permissions_policy`, `iframe_no_allow` or `insecure_context`.

The [@awaketab/wake library page](/library) has a live demo of every state.
