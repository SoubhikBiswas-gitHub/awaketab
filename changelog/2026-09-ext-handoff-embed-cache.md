---
title: Extension key hand-off uses one activation; faster embed widget loads
date: 2026-09-26
type: fixed
---

Opening "Find your key on awaketab.com" from AwakeTab for Chrome no longer activates Pro in that browser as well. The page checks the key and shows it to copy, and only the extension activates it. Moving your key into the extension now uses one of your five activations instead of two. If you arrive there straight from checkout, the page fills in your key without activating anything.

The embed widget's script now has a new file name for every release, so browsers can cache it for good. Pages that embed the widget no longer re-check that script on every load. The one-line `https://awaketab.com/embed.js` snippet is unchanged.
