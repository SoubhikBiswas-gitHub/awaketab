---
"@awaketab/core": minor
---

Add the engine surface the engagement layer needs. `pause({ keepLock: true })` pauses the session clock but keeps the lock held (cook mode). `addTime(ms)` grows a live finite plan in place: an `until` plan becomes a `duration` with the same moved deadline. `updateSession({ mode, modeState })` persists the ambient mode and per-mode data. The engine now broadcasts a `state` snapshot on every tick, status change and lock change, and in reply to `hello`. `TTabMessage` `state` gains the optional `endsAt`, `planType`, `pausedMs`, `pausedAt` and `wall` fields, plus a new `intent` message (`{ target, action: 'stop' | 'add', ms? }`) that only the addressed tab acts on. `IMeta.ratingPrompt` gains an optional `rearmAt`.

The battery monitor now caches one `BatteryManager`. It evaluates on `levelchange`/`chargingchange` and on every 60th tick, warns once per session, and re-arms only when charging or 5 points above the threshold. Fix: `stop()` after a session has completed now releases the lock re-requested for the extend prompt's grace period.
