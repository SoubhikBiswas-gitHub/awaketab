# Canvas copy audit (26 September 2026)

Every visible string on the redesign canvas was checked: 110 boards, 27 of which hold copy (the rest are wrappers). Produced by a copy sub-agent; nothing was edited. The fixes are applied through the "Copy corrections" section of docs/redesign/agent-brief.md.

## Summary for the owner
- **Pill strings:** all seven are exact everywhere, plus "System awake" and "Screen may dim or lock". Two exceptions:
  - ExtEdge shows the web-only pill "Tap to use the fallback", but the extension has no video fallback.
  - The Brand board puts "· until 5:30 PM" inside the pill.
- **Prices are correct:** $12/yr, $19 once until 8 Dec 2026 then $29, 5 devices, 14-day refund, Embed $29/yr per site, Kiosk $19/$49. The problems:
  - "was $29" is misleading, because no one ever paid $29.
  - "Costs less than two years" of yearly stops being true after 8 Dec.
- **No fake testimonials, ratings, user counts or scarcity.** The overclaims are about testing ("a device on a shelf here") and "keep the computer awake".
- **Free vs Pro doesn't match canon:** ambient modes, clock faces and lamp colours (Aqua/Violet/Mint/Sky vs en.json Amber/Indigo/Teal/Rose). Owner decisions O-01 to O-03.
- **Wording drift:**
  - "No limit" vs ∞ / "Until I stop"
  - "15m" vs "15 min"
  - "Try again" vs "Retry"
  - 12-hour times on the canvas vs 24-hour examples in en.json
- **CTAs:**
  - Embed has no buy button.
  - Both Pro plans say "Get Pro"; they should name the plan.
  - A pre-launch store placeholder remains on the extension page.

## Findings
| Board | Current | Problem | Proposed | Sev |
|---|---|---|---|---|
| Pro | "$19 once · was $29" | Names a price never charged | "$19 once. Launch price until 8 December 2026, then $29." | High |
| HomeBelow, ContentArticle | "Every support claim comes from a device on a shelf here…", "In our tests…", "Idle-inhibit tested with…" | Contradicts About ("Real-device results are pending") | "Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded." | High |
| HomeBelow | "Keep the computer awake while downloading" | A web page only holds the display | "Keep the screen on while downloading" | High |
| ExtEdge | Pill "Tap to use the fallback" | The extension has no fallback | "Blocked — here's the fix" + "Open AwakeTab in a tab" | High |
| Pro | "Six ambient modes… free" | Conflicts with canon | Decide (O-02) | High |
| Pro | "Four clock faces" free | Not in canon | Decide (O-03) | Medium |
| Pro, Main, ProActivate | Lamp colours vs en.json accents | Contract (docs/05 tokens) | Decide (O-01), then update en.json and docs/05 together | Medium |
| Pro | "Costs less than two years of the yearly plan." | False after 8 Dec | "At the launch price, less than two years of the yearly plan." | Medium |
| ExtEdge | Price line without end date | Missing the launch-price date | Add "until 8 December 2026" | Medium |
| Pro | "Get Pro" on both cards | Doesn't name the plan | "Get yearly Pro" / "Get lifetime Pro" | Medium |
| EmbedShowcase | No licence CTA | Lost sale | "Buy an Embed licence · $29 / year per site", "Activate an Embed key" | Medium |
| Main | Video fallback "works everywhere" | Overclaim | "It needs this tab visible and uses a little more battery." | Medium |
| Main | "Try again" / "Use video fallback" / "Tap to keep awake" | en.json: Retry / Use fallback / Tap to start | Reuse the en.json keys | Medium |
| EmbedWidget | "while the page is open" | A hidden page releases the lock | "while this page is visible" | Medium |
| HubFor | "Keep the browser awake for AI agents" | Overclaim | "Keep the screen on while an AI agent runs" | Medium |
| Main stats | "Sample data · Demo numbers…" | Designer note inside the product | Remove | Medium |
| PageLegal | "up to 500 characters" | The rating note caps at 280 | "up to 280 characters" | Medium |
| HomeBelow | "seven days of stats stay…" | Legal says 365 days; Pro 12 weeks | "Settings, the current session and your stats stay in this browser" | Medium |
| ExtOptions | "Everything here stays in this browser." | Settings sync via the Chrome account | "Settings save here and sync through your Chrome account; your licence never syncs." | Medium |
| ExtPopup | No 45 min chip | Breaks the preset canon | Add 45 min; show ∞ | Medium |
| Main (phone) | 45m and 4h hidden behind "More lengths" | PRODUCT.md anti-reference | Show all seven presets | Medium |
| Main | "A time that has already passed today means tomorrow." | en.json treats it as an error | Decide (O-11) | Medium |
| several | "No limit" | en.json: ∞ with "Until I stop" | ∞ visible, "Until I stop" accessible name | Medium |
| Main | "15m 30m…" | en.json "15 min", "1 h" | Use the tool.preset.* strings | Medium |
| several | Time formats mixed | 12 h on the canvas vs 24 h examples in en.json | Format by locale; align en.json examples | Low |
| PageExtension | "Store links go live once the listing is approved." | Pre-launch placeholder | Remove at launch | Low |
| ExtEdge | "New in 1.1" | Version 1.0.0 | Use a version variable | Low |
| Brand | Pill "Screen awake · until 5:30 PM" | The pill must be exact | Move the time outside the pill | Low |
| Main | "Keep awake until" / "Keep awake for" | en.json "Stay awake until" / "How long?" | Reuse the keys | Low |
| Main | "Keep going 15 more minutes" | en.json "Add 15 minutes" | "Add 15 minutes" | Low |
| Main | "Locked · Pro keeps 12 weeks" | en.json uses an em-dash form | Reuse stats.heatmap.locked | Low |
| HubFor, HomeBelow | "floating pill", "Floating window" mid-sentence | Name drift | "floating window" | Low |
| ContentArticle | "The pill says what you believe." | Meaning reversed | "Believe the pill. Do not trust a dimming clock or a chat avatar." | Low |
| HomeBelow | "A green dot is a conversation with your employer…" | Quip, off tone | Cut | Low |
| ProManage | "Confirm removing" | Awkward | "Remove device" | Low |
| several | "behavior" vs "behaviour"; curly vs straight apostrophes | Drift | British spelling; straight apostrophes | Low |
| EmbedShowcase, PageKiosk, PageChangelog, PageAbout, PageLibrary, PageLegal | em dashes in new copy | Style | Replace with colon, full stop or comma | Low |
| PageChangelog | "shadcn/ui", "The ten most-read guides" | Jargon; a readership claim before launch | "Consistent controls across pages"; "Ten core guides" | Low |

## Word variant counts (visible canvas copy)
- **"licence"** 60, "license" 2 (code only).
- **"No limit" family:** "No limit" 5, "no limit" 8, ∞ 5, "Until I stop" 5, "until you stop" 6.
- **Floating window:** "Floating window" 4, "floating timer" 2, "floating pill" 2.
- **Wake lock:** "wake lock" 19, "Wake Lock" without "API" 5.
- **Durations:** "15 min" style 31 vs "15m" 6. "1 h" style 23 vs "1h" 4.
- **Buttons:** "Try again" 4 vs "Retry" 1.
- **Devices:** "5 devices" 5 vs "five devices" 3.
- **Spelling:** "behavior" 4 vs "behaviour" 1.

## New strings that will need i18n keys
The full per-screen list, about 940 raw strings, is in the session scratchpad: `new_strings.json` plus `copy_out.txt`. Those files are temporary, so the build phase must add keys for:
- Tool: Blocked card, battery stop, the length panel, primary labels, face kickers, notes, clock face names and sky phases, all of Settings, Stats.
- Ambient: Focus, Message, Cook and Night strings.
- Extras: banners, install, share, shortcuts.
- Extension: popup edge states and the options schedule editor.
- Pro, Activate, Manage.
- Embed, Kiosk, Library.
- Shared: header, footer, 404, hub and legal chrome.

Long-form prose belongs in the content collections, not in en.json.
