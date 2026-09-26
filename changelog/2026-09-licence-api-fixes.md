---
title: Pro licence fixes
date: 2026-09-26
---

If you cancel a yearly Pro subscription, Pro keeps working until the end of the period you paid for. Before this fix it stopped as soon as you cancelled. A device you remove on `/pro/manage` now actually loses Pro, and devices you use regularly are no longer removed as "unused for 90 days" when you add a new one. Lifetime licences no longer need their key entered again after 90 days.

When you hit the rate limit, the API response now says how many seconds to wait before retrying.
