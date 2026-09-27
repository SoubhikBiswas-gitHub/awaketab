# Languages and accessibility boards: findings (27 Sep 2026)

Boards: `Intl.dc.html` (+ IntlDePhone, IntlJaPhone, IntlHiPhone, IntlFrPhone, IntlPtPhone, IntlZhDesk, IntlEsDesk, IntlArticleDe) and `A11y.dc.html` (+ A11yKeyboardDesk, A11yForcedDark, A11yForcedLight, A11yZoomPhone, A11yReflow320, A11yReducedPhone, A11yNoJsPhone, A11yNoJsDesk, A11yScreenReader). Open questions are O-59 to O-66 in [DECISIONS.md](../redesign/DECISIONS.md).

## Method
- Every Intl string is copied by script from `apps/web/src/i18n/{locale}.json` (48 keys) and `src/content/for/{locale}/cooking.md`. Nothing is translated by hand.
- Dates and times use `Intl.DateTimeFormat` for the page's `htmlLang` with `numberingSystem: 'latn'`. No locale file uses native digits, so Hindi keeps Latin digits (docs/07 §4).
- Overflow check: 168 renders in Chromium (7 locales × 6 states × phone, tablet, desktop, with banners and QA mode on). Result: nothing clipped, nothing past the right edge, and the dock always ends 20 px above the bottom of the 844 px phone.

## Locale strings
| Finding | Where | Action |
|---|---|---|
| False claim: battery saver "blocks" the wake lock (D-R12) | `tool.advice.battery_saver`, all 8 locales | Remove it. Boards leave it out. See O-59 |
| Missing keys | Face names, ring kickers, blocked-card title and per-cause lines, desktop nav (Use cases, Devices, Extension), "Honest limit", CTA "Keep awake · {duration}" | Add them before build (O-61). Boards show them only in QA mode, with a dashed amber outline |
| Suggestion banner uses the wrong language | `i18n.suggest` renders in the page language: "Dies auf English lesen?", "要用日本語阅读吗?" | Render it from the suggested locale's catalog (O-60) |
| Advice and button disagree | `tool.advice.*` says "tap Start"; the blocked dock button is `tool.advice.retry` | Align the copy when the advice keys are rewritten |
| Content accuracy | de `/for/cooking` recommends iPad "Split View" (removed in iPadOS 26); its FAQ says Android energy saver can refuse the request | Content fix batch |

## Wrapping, measured at 390 px
- The pill wraps only for fr `tool.pill.unsupported` ("Touchez pour utiliser la solution de secours", 44 characters): 54 px tall on two lines. Hindi pills are 41 px because Devanagari needs a 1.5 line height. docs/07 §4 says the pill stays on one line; the boards allow two lines instead (O-62).
- The CTA wraps to two lines for es ("Empezar a mantener la pantalla despierta") and fr ("Commencer à garder l'écran allumé"): 73 px tall. The duration sits on a second line, so no string is concatenated.
- German "Diese Sprache behalten" and "Sprache wechseln" do not fit side by side on a phone. On phones, dismiss becomes a close icon named with the same string.
- All seven presets fit a 4-column grid, with ∞ across two cells (D-R14). A width rule shrinks preset text (15 px, or 13 px on desktop) only when the widest label would clip. No shipped locale needs the shrink.
- A phone cannot fit both banners and all seven presets in 844 px. Phones show one banner at a time (O-63).

## Type rules used
- Latin: Geist first. `hyphens: auto` with the correct `lang`, which gives German compounds hyphenation.
- ja: Hiragino Sans, Noto Sans JP, then Yu Gothic UI. zh: PingFang SC, Noto Sans SC, then Microsoft YaHei. Use the correct Han order for each (JP fonts before SC fonts in ja, and the reverse in zh). CJK text uses no hyphenation, `line-break: strict`, 1.75 body line height and no negative tracking.
- hi: Kohinoor Devanagari, Noto Sans Devanagari, then Nirmala UI. Line heights are 1.85 for body and 1.5 for controls. Letter-spacing is 0, because tracking breaks conjunct shaping. The kicker is never uppercased.

## Accessibility
- **Focus order.** The desktop order has 20 stops. Theme and clock face are one stop each and use the arrow keys inside. Main puts the face tabs first in the DOM but shows them last on desktop (O-65).
- **Forced colours.** Gradients and `background-image` disappear, which removes the ring ticks, the sweep and the glows. State must come from SVG strokes in CanvasText (dash patterns: paused `18 12`, blocked `1 13`, fallback track `3 9`), the pill glyph and the pill text. Selection and focus use Highlight. Buttons need a 1 px ButtonText border.
- **Text 200% and reflow at 320 px.** At 200% text, the header wraps, the ring captions move under the ring, the presets become a 2-column grid and the dock stays in the page flow. At 320 px, theme collapses to the existing Cycle theme button (`tool.header.theme`) and the presets use a 4-column grid. Neither view scrolls horizontally.
- **Reduced motion.** Only decorative loops stop. The arc, the digits, the sun position and the water level still update instantly.
- **Before JavaScript.** The pill says Ready. Durations are links to `/15m` … `/4h`. The date and time line waits for the local clock, with its height reserved. When JavaScript is off, `tool.noscript` sits under the button.
- **Screen reader.** Two polite live regions: the pill and the hidden timer line. The digits are `role="timer"` with `aria-live="off"`. The cadence is still an open decision (O-64).
