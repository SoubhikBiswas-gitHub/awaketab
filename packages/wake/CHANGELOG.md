# @awaketab/wake

## 1.0.0

First public release. The pending pre-release changesets (`wake-lock-layer`, and the `@awaketab/wake` half of `type-name-prefixes`) are folded into this entry, so `changeset version` does not bump the unpublished package past 1.0.0.

### Features

- `createWakeLock(options)` with exactly seven states — `idle` · `requesting` · `held` · `lost` · `denied` · `unsupported` · `fallback` — and `change` events carrying `{ from, to, reason, advice?, error?, at }`. `held` is reported only while a live `WakeLockSentinel` exists.
- Inlined 1-frame WebM + MP4 video fallback: gesture-aware `play()`, 20 s `currentTime` nudge, paused while hidden, removed on release.
- `classifyDenial()` maps a rejection to an advice code (`battery_saver`, `low_power_ios`, `hidden_document`, `permissions_policy`, `insecure_context`, `unsupported_browser`, `ios_safari_old`, `firefox_old`, `iframe_no_allow`).
- Re-acquire on `visibilitychange`, backoff retry for transient denials, re-request on `fullscreenchange`.
- SSR-safe inert handle when `window` is undefined.
- React, Preact and Vue adapters (`@awaketab/wake/react`, `/preact`, `/vue`), each < 400 B gzipped and importing the core instead of bundling a second copy.
- ESM, CJS (with `.d.cts` types) and an IIFE build at `dist/awaketab-wake.iife.js` exposing `window.AwakeTabWake` for `<script>` and CDN users.

### Type names

Every exported type name is prefixed: interfaces take `I` (`IWakeLockHandle`, `IChangeEvent`, `IWakeLockOptions`) and type aliases take `T` (`TLockState`, `TAdviceCode`, `TLockReason`). String values are unchanged.
