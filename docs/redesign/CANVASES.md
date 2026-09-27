# Redesign canvases

The design lives on 12 canvases, one per product area (decision D-R25). Each holds its own boards plus the component files they mount, so it loads fast and every board renders. They replace the single 357-board canvas, which was too heavy to load (boards showed as empty frames).

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

Source: `design/canvas/project` (one file per board) and `sections.json`. `design/canvas/split.py` rebuilds the 12 bundles in a scratch folder; publish each bundle to its canvas (canvas.json as `file_path`, the boards as `files`). Gates before publishing: `tools/final/rtscan.sh` (0 flagged) and `tools/final/rtaudit.sh` (0 violations).
