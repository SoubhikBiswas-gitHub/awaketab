---
title: Embed widget, kiosk links, and the wake lock library
date: 2026-09-26
type: new
---

Sites can now add a "keep my screen on" button with one line: `<script async src="https://awaketab.com/embed.js" data-mode="cook"></script>`. The widget is the real AwakeTab in a small frame — the same honest status in eight languages, Start/Stop, tap the timer to pause while the screen stays on, and up to three kitchen timers in the full-width size. If a site pastes the frame without permission to keep the screen on, the widget says "Ask the site owner" instead of pretending. The new [/embed](/embed) page has a snippet generator and live demos; a free widget carries a small credit link, and the Embed licence removes it and applies your brand colour.

The new [/kiosk](/kiosk) page builds start URLs for lobby screens and signage — autostart, message, theme — and, with a Kiosk licence, your own logo and no AwakeTab branding or prompts. Licence links carry the token after `#lic=`, which is checked on the device and removed from the address bar.

`@awaketab/wake`, the open-source lock library behind AwakeTab, is ready for its 1.0 release on npm. [/library](/library) has a live state-machine demo running the published build, and [How we tested](/learn/how-we-tested) now shows the device matrix — its results are pending until the manual run is recorded.
