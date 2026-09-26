---
"@awaketab/core": major
---

Prefix every exported type name: interfaces take `I` (`IWakeLockHandle`, `ISession`) and type aliases take `T` (`TLockState`, `TPresetId`). Runtime behaviour, string values, storage keys and preset ids are unchanged — this renames types only, so the migration is import-site edits.
