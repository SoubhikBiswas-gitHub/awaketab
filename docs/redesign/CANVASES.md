# Redesign canvases

The Clear Night design lives on 12 canvases on claude.ai, one per product area. Each holds its boards (phone, tablet and desktop, light and dark) plus the component files they mount, with every prop editable in Tweaks. Open them to see a screen before building or changing it.

| # | Canvas | What is on it |
|---|---|---|
| 1 | [Tool](https://claude.ai/artifact/9QhwbrNAY7SuMfuK6Hcrou) | Home tool: phone dark/light, tablet, desktop, 320/600/1024/landscape/1920, settings, stats, time's up, blocked |
| 2 | [Tool states](https://claude.ai/artifact/NsYkjy6eGJoKSuH1FkRG8R) | Edge states at every size, banners, prompts, overlays, shortcuts, share, toasts, offline |
| 3 | [Ambient & floating window](https://claude.ai/artifact/JpgiyP7tmZokeu7NaGfHui) | Clock, focus, minimal, message, night, cook at every size; floating window |
| 4 | [Content & guides](https://claude.ai/artifact/YPZDmPmrqTZmG7SRMrULtn) | Article template, home below the tool, 5 hubs, /on /vs /guides /learn pages |
| 5 | [Site pages](https://claude.ai/artifact/42aFCsMbbfx8GSDFmCgxrC) | Presets and /until, extension landing, about, changelog, privacy, terms, 404 |
| 6 | [Pro & checkout](https://claude.ai/artifact/ALj1aJapyMrsWLV41hkQtd) | /pro, activate, manage devices, checkout, Pro lapsed, installed app, update |
| 7 | [Chrome extension](https://claude.ai/artifact/CQVxien6pmYfK7MEGPM9wp) | Popup and its states, badges, options, welcome, Web Store listing, icons |
| 8 | [Embed, kiosk & library](https://claude.ai/artifact/1xyEc8rRn9Kp2TjYfCtLdA) | Embed widget and edge states, /embed, kiosk page and TV screens, /library |
| 9 | [Growth moments](https://claude.ai/artifact/CsTo6C82KsHaMi33rUfkod) | First visit, trust panel, session done, back from hidden tab, Pro moments, plan helper, share, business entry points |
| 10 | [Languages & accessibility](https://claude.ai/artifact/BUMXs5FMhdWPhGJmMAgyVT) | Real translations, language switcher, high contrast, zoom, reduced motion, screen reader, no JS |
| 11 | [Brand & share images](https://claude.ai/artifact/1h91b7xNW9qw1g2TrWLsjk) | Brand sheet, social share images |
| 12 | [Components (all props)](https://claude.ai/artifact/KPSmTrmhVBxtmWJxB5GKCy) | Page components with every prop in Tweaks |

Boards are named after their file on the canvas, for example `PresetPage`, `UntilPage`, `StoreAssets` or `ExtPopup`; specs and code comments cite them by that name. The shared numbers every board uses are in `PRIMITIVES.md`, and the design system itself is `DESIGN.md`.

## Source files

The board sources (`design/canvas/project`, one `.dc.html` file per board, 357 boards), the section list that splits them into the 12 canvases, and the render and audit scripts were removed from the repository on 28 September 2026 to keep it small. The published canvases above match them byte for byte. To get them back, restore the folder from the commit before the removal: `git log --diff-filter=D --oneline -- design/canvas/sections.json` names the removing commit, and `git checkout <that commit>~1 -- design/canvas` restores it (at the time of removal that parent was `cfe415b`).
