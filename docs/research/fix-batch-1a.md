# Fix batch 1a: Main (the tool) and its wrappers (27 September 2026, cloud agent)

Scope: `Main.dc.html` and the 48 boards that mount it (Ring*/Bold*/Horizon*/Tide*/Paused*/Blocked*/Done*/Until* wrappers, Tool*, Desk*, Size*, Edge*).

## Finding at resume
HANDOFF §4a said batch 1a was "barely started". In fact, the Main.dc.html copied into the repo already carried almost all of the 1a work; the local agent was stopped before it wrote its report. This report verifies that work against the brief, and records the one fix made in the cloud.

## Verified present (by smoke test, source check and render)
| Item | Where it shows | Status |
|---|---|---|
| audit A "Left for Main" 1: blocked card "Your browser said no", Retry, cause lines, no battery-saver blame, no "works everywhere" | BlockedDark/Light | done |
| 2: all seven presets on phones (two-row grid), ∞ with the name "Until I stop"; at 320 px, the eighth cell More… holds Until…/Custom… (O-74) | Main, SizeSmall* | done |
| 3: no "Sample data / Demo numbers" note | ToolStats | done |
| 4: toasts never cover the dock (§11.7) | EdgeOffline, EdgeReturn | done |
| 5: until input border uses `--at-input-border` (O-56) | UntilDark/Light | done |
| 6–9: Tide underwater, Ring kicker and CTA hint contrast; heatmap level ink | Tide*, Ring*, ToolStats | done (no non-gradient text below AA) |
| 10: Pro nav link at least 44 wide | Desk* | done |
| 11: tokens raised/sunken/horizon-ink; the AT-PRIMITIVES v1 block | Main | done |
| Wow moves: one digit voice (Geist 200–300 tabular, no slashed zero); ignition on a real grant; lamp off plus the Done receipt timeline; "How do we know?" beside the pill; the first-visit receipt line ("Started for you · asked at … · confirmed 0.4 s later") | Main, Done*, EdgeReturn | done |
| Keycap rule §11.4 (theme keycap, hover-capable layouts only, `aria-keyshortcuts`) | Desk*, ToolSettings* | done |
| O-08 60 s grace · O-11 "7:00 AM is tomorrow. Keep awake until then?" · O-20 "Re-acquiring the wake lock" / "Screen awake again" · O-21 "Start anyway" low-battery card · O-70 auto-start with "Started for you" · O-73 Stop goes to Done with the receipt after 1 min or more · O-75 offline string · O-76 detected cause only · O-87 ∞ · O-56/O-57 · O-01 lamps · O-12 radio group | Main | done |
| Long sessions (DESIGN §4): H:MM:SS, "1d 02:15:00", "Awake for … since yesterday 7:46 PM" | EdgeMultiDay, EdgeLongNoLimit | done |

## Fixed in this pass
- **Bold face digits clipped at 390 px** when the digit font is wide (a `system-ui` like DejaVu Sans on Linux/ChromeOS: "24:18" at 128 px is 369 px, but the face is 342 px wide). The digits now use `font-size: min(128px | 96px | 62px, 34cqi | 22cqi | 16cqi)` inside an inline-size container, so they never clip and keep the spec size wherever it fits. DESIGN.md §3 notes the cap.
- **Renderer accuracy:** headless Chromium in the cloud cannot fetch Google Fonts, so boards rendered in a fallback font. Geist, Geist Mono and Space Grotesk are now installed locally for renders, and `tools/fix1b/render.mjs` waits for the fonts to load.

## Checks
- `tools/tool-backup/tool-smoke.mjs`: ALL PASS (0 missing). `SizeSmoke.mjs`: 42,894 combinations, 0 failures. `gen.mjs`: 415 holes, 0 missing.
- Checker v2 (`fix1b/analyze.mjs`) on Main: 51 hits, all exempt. They are the Horizon sun art, the side sheet's leading edge (allowed by §11.2), a native range track, and scaled Main mounts inside Sys boards (belongs to 2b). `tools/final/check.py` on the re-rendered Bold/Edge/Size boards: 0 contrast, target, overflow or copy issues.
- Board heights unchanged.

## Open questions
None.
