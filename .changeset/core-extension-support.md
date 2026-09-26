---
"@awaketab/core": minor
---

Fix: `createSession({ channel: null })` now disables the multi-tab protocol as documented instead of opening the shared `BroadcastChannel('awaketab')`. Only an omitted `channel` opens it. The extension's background worker relies on this.

Add `ISessionOptions.resumeIndefiniteMs` (default 12 h, unchanged for the web). The extension's service worker restarts many times during one session and passes `Infinity`, so a long indefinite session is not dropped when the worker wakes after 12 hours.

`IStorageAdapter` is now exported from the package entry, as documented in docs/04 §16.
