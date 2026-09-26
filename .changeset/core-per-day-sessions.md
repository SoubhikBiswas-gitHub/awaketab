---
"@awaketab/core": minor
---

Add per-day session counts to `IStats`. Two new optional fields are keyed by local day: `daySessions`, the sessions of at least 1 min that ended that day, and `dayFocus`, the focus blocks that completed that day. The engine increments `daySessions` wherever it increments `sessions`. It increments `dayFocus` when a session carrying `modeState.focusBlock === true` completes. Both counters use the local day the session ends, so a session crossing midnight counts on the new day. The change is backward-compatible: older stored stats have neither field, and `storage.stats()` does not invent them. It prunes both with the same 365-day window as `days` and drops them if corrupt. `pruneDays()` now keeps only number values. `exportStatsCsv()` fills the `sessions` column from `daySessions` and leaves days without a count empty; the header is unchanged. New export: `countDay(rec, now, timeZone?)`.
