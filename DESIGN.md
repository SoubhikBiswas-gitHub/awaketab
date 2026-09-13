# AwakeTab design system

Status: v1.0 · 2026-09-13 · Owner: Soubhik

AwakeTab is a utility-first hybrid: a precise screen-awake instrument inside a quiet, trustworthy information site. The interface must make the real lock state obvious before it asks the user to read, configure, subscribe, or explore.

This file governs visual and interaction decisions. `docs/00-conventions.md` remains authoritative for identifiers, states, routes, gates, budgets, and canonical colour values. `docs/05-frontend-spec.md` remains authoritative for component behaviour.

## 1. Experience principles

1. **State before decoration.** The ring, status pill, timer, and current action form one instrument. Their hierarchy must survive blur, glare, distance, dark mode, and a 320 px viewport.
2. **One obvious next action.** Each state has one visually primary action. Secondary actions stay available without competing.
3. **Calm confidence.** Warm neutrals, precise spacing, restrained borders, and minimal motion communicate reliability. No gradients, decorative blobs, ornamental icons, or dashboard-card mosaics.
4. **Honesty in context.** Limits and recovery guidance appear beside the state or action they qualify. The interface never implies hidden-tab, closed-lid, presence, or unsupported background capability.
5. **Progressive depth.** The first viewport completes the core task. Explanatory, editorial, and commercial content follows in decreasing priority.
6. **Accessible by construction.** Visible focus, 44 px targets, semantic controls, non-colour state cues, reduced motion, forced colours, and 400% zoom are system rules rather than page exceptions.
7. **Performance is visual quality.** Static first paint, zero hydration, zero layout shift, no font swap, and lazy non-critical modules are part of the design.

## 2. Product signature

The progress ring and 12 o’clock dot are the sole brand motif. Use them in the wordmark, tool instrument, icons, and generated imagery. Do not introduce a second decorative motif.

The visual voice is:

- warm, not playful;
- technical, not clinical;
- quiet, not empty;
- direct, not terse;
- premium through proportion and detail, not effects.

## 3. Foundations

### Colour

Use only the canonical `--at-*` colours from `docs/05-frontend-spec.md` §1.1. shadcn semantic variables remain aliases; page and component code never carries one-off hex values.

- `--at-ground` is the continuous page canvas.
- `--at-surface` identifies controls, dialogs, and content that must be grouped.
- `--at-ink` is primary copy; `--at-muted` is supporting copy only.
- Awake amber is the single default accent and identifies focus, active selection, and a held lock.
- `--at-good`, `--at-warn`, and `--at-bad` are reserved for semantic state.
- Borders organize; they do not decorate. Essential control boundaries must meet 3:1 through the semantic `--input` value or an equivalent derived contrast.
- Filled semantic surfaces use a foreground with at least 4.5:1 contrast in every theme.

Dark and OLED themes use border and surface separation rather than large shadows. OLED is true black only where the screen-protection use case benefits from it.

### Typography

The canonical locale-complete system stack stays mandatory on tool routes. Hierarchy comes from measure, weight, scale, and rhythm:

- page title: `--at-t-2xl`, rising to `--at-t-3xl` at `md`, 600 weight, 1.2 line height;
- section title: `--at-t-xl`, 600 weight, 1.25 line height;
- component title: `--at-t-lg`, 600 weight, 1.3 line height;
- body: `--at-t-md`, 1.6 line height for editorial copy and 1.5 for compact UI copy;
- label and metadata: `--at-t-sm`; legal metadata alone may use `--at-t-xs`;
- timer: `--at-t-timer`, 700 weight, tabular numerals;
- prose measure: 45–72 characters, with 66 as the target.

Headings use balanced wrapping. Paragraphs use pretty wrapping where supported. Lowercase body copy never uses letter spacing.

### Spacing and geometry

Use the canonical 4 px spacing scale only: `--at-s-1`, `--at-s-2`, `--at-s-3`, `--at-s-4`, `--at-s-6`, `--at-s-8`, `--at-s-12`, `--at-s-16`.

- 4–8 px: internal relationships such as icon-to-label;
- 12–16 px: control and compact-card padding;
- 24–32 px: component and subsection separation;
- 48–64 px: major page-section separation.

The shell is centred at 60rem. Editorial measure is 45rem. The tool control measure is 36rem. Alignment follows these shared axes; no page invents a private width.

Radii communicate hierarchy:

- `--at-r-sm`: controls and inputs;
- `--at-r-md`: cards and alerts;
- `--at-r-lg`: dialogs and sheets;
- `--at-r-pill`: status and compact selectable chips.

Nested radii decrease by the inset gap. Avoid applying the same large radius to every surface.

### Elevation

Use four visual levels:

1. **Canvas:** `--at-ground`, no border or shadow.
2. **Grouped surface:** `--at-surface` with a subtle `--at-line` boundary.
3. **Interactive surface:** a contrast-safe boundary plus hover, pressed, and focus-visible states.
4. **Modal surface:** `--at-surface`, strong backdrop separation, and the existing dialog shadow in light mode.

Cards exist only when content is independently actionable, selectable, collapsible, or semantically grouped. Plain prose and page sections do not become cards for decoration.

## 4. Component grammar

### Tool instrument

The first viewport reads in this order:

1. contextual page title;
2. ring;
3. status pill;
4. timer or recovery notice;
5. duration choices;
6. state-specific primary action.

The ring is the strongest shape. The pill is the strongest statement. The timer is prominent only in `held` or `fallback`; static idle duration stays visibly subordinate.

### Actions

- Default button: the single next action.
- Secondary button: safe alternative or Stop.
- Outline/toggle: preset and mutually exclusive selection.
- Ghost button: utility actions in headers and compact navigation.
- Link button: navigation that benefits from button-sized targeting without impersonating a form action.
- Destructive styling: only destructive or irreversible actions.

Every interactive state includes rest, hover, focus-visible, active/pressed, and disabled. Pressed toggles use both `aria-pressed` and a visible surface change.

### Status and feedback

- Pill: persistent engine truth.
- Inline notice: actionable recovery tied to the current state.
- Banner: resumable or cross-tab context before the main action.
- Toast: transient confirmation that does not alter layout or steal focus.
- Dialog/sheet: a focused decision that cannot fit inline.

Do not duplicate the same message across pill, notice, banner, and toast.

### Cards

Use cards for plans, selectable destinations, FAQs, tool embeds, and discrete status groups. A card must contain either an action, a disclosure, a choice, or information that is meaningful as a unit.

Avoid card-inside-card framing. The embedded tool gets one boundary, not a Card plus an inner bordered panel.

### Links and navigation

Site identity is always visible. Deep content pages include breadcrumbs. Hubs identify the active collection. Utility links stay visually quieter than task actions. Inline links are underlined; visited editorial links remain distinguishable.

## 5. Page archetypes

### Tool-first pages

Routes: `/`, presets, `/until/*`, locale homes, `/404`, and `/pip`.

- The first viewport completes the primary task.
- Header utilities never outweigh the page title or ring.
- Below-fold home sections use clear alternating rhythm, not a repeated wall of equal cards.
- Preset and until routes retain the same composition so learned behaviour transfers.
- `/404` leads with recovery and the working tool, not an illustration.
- `/pip` is intentionally minimal: status, timer, Stop, and Extend only.

### Content hubs

Routes: `/for`, `/on`, `/vs`, `/guides`, `/learn`.

- One orientation sentence, then grouped destination choices.
- Collection purpose and current location are clear without reading body copy.
- Cards expose enough specific information to choose; generic repeated descriptions are removed.
- Grid density responds to content length, not a fixed three-column marketing pattern.

### Articles

Routes: `/for/*`, `/on/*`, `/vs/*`, `/guides/*`, `/learn/*`.

- Breadcrumb, title, verification metadata, honest limit, and embedded tool form the opening composition.
- The tool supports the article intent without overpowering the article title.
- Body measure stays readable and section rhythm makes the page scannable.
- FAQs and related links close the task; ads, when enabled, never interrupt the tool or disguise themselves as content.

### Commercial and account pages

Routes: `/pro`, `/pro/activate`, `/pro/manage`.

- Pricing is explicit before persuasion.
- Plan comparison uses meaningful differences, not duplicated feature-card copy.
- Forms keep labels visible, errors adjacent, and recovery specific.
- Activation success and device removal have unmistakable feedback.

### Trust pages

Routes: `/about`, `/privacy`, `/terms`, `/changelog`.

- Document typography is primary; decorative cards are avoided.
- Dates, scope, and ownership are easy to scan.
- Legal text keeps full reading measure and visible section anchors.

## 6. Responsive system

Breakpoints remain `sm` 480, `md` 768, `lg` 1024, `xl` 1280.

### 320–479 px

- Core tool fits the first 568 px without hiding controls.
- Header utilities wrap into a deliberate second row or compact overflow pattern; they never form an accidental icon cluster.
- Controls are at least 44 px; cook controls are at least 64 px.
- Dialogs behave as bottom sheets where specified and respect safe-area insets.
- Grids become one column unless two compact choices remain clearer.

### 480–767 px

- Tool controls gain breathing room without changing order.
- Content cards use one or two columns based on minimum readable width.
- Footer language choices wrap as a coherent navigation group.

### 768–1023 px

- Tool actions may share one row.
- Settings becomes a side panel.
- Editorial content remains centred; additional width increases whitespace before line length.

### 1024 px and above

- The page remains one composition inside the 60rem shell.
- Rail content is used only where the information architecture requires it.
- Large blank regions are not filled with decoration; section width and rhythm carry the layout.

All layouts support 400% zoom, text enlargement, long translated strings, RTL-ready logical properties, and `env(safe-area-inset-*)`.

## 7. Motion and state change

Motion explains state, position, or causality. It never delays the wake-lock request.

- fast 120 ms: pressed and focus-adjacent feedback;
- base 200 ms: hover, disclosure, compact surface changes;
- slow 320 ms: dialog/sheet entry and spatial transitions;
- ring progress: one-second linear interpolation;
- use opacity and transform only for spatial motion.

Never use `transition: all`. Theme changes repaint colour immediately. Reduced-motion collapses animation to 1 ms while preserving hardware-protection pixel shift.

## 8. Accessibility contract

- Exactly one visible page `h1`; headings descend without skipped levels.
- Landmarks identify header, main content, navigation, complementary content, and footer.
- Every control is keyboard operable and has a visible accessible name.
- Every interactive target is at least 44 × 44 CSS px, or has equivalent target spacing allowed by WCAG 2.2.
- Focus is never hidden by fixed UI, sheets, or toasts.
- Status uses text and shape in addition to colour.
- Live regions are limited to the status pill, throttled timer announcements, and relevant toasts.
- Body text and meaningful icons meet AA contrast in light, dark, OLED, forced-colour, and state-tinted surfaces.
- No horizontal overflow at 320 px or 400% zoom.
- Touch, keyboard, screen reader, reduced-motion, and coarse-pointer operation are first-class states.

## 9. Architecture rules

- Astro renders all shared shadcn primitives at build time.
- No `client:*` directive and no React runtime chunk.
- Interactive behaviour remains vanilla TypeScript in `apps/web/src/tool`.
- Static primitives live in `apps/web/src/components/ui`; shared page compositions live in Astro components; runtime-created UI uses the same semantic classes in `tool.css`.
- `tokens.css` owns tokens and aliases. `tool.css` owns tool and shared shell behaviour. `content.css` owns article-specific typography only.
- Prefer a shared component or page archetype fix over route-specific styling.
- New visual tokens are documented in `docs/00-conventions.md` first.
- Every user-visible feature gets a test; every visual-system rule that can be checked mechanically becomes a CI assertion.

## 10. Release quality gate

Before design work is complete:

- every built route passes structural design lint;
- every page archetype passes mobile, tablet, and desktop review in light, dark, and OLED;
- all interactive states pass keyboard and pointer review;
- axe reports zero violations on every archetype in both primary themes;
- contrast fixtures pass every canonical text, state, and control pair;
- no unexpected horizontal overflow or sub-44 px control target remains;
- `pnpm lint`, `pnpm typecheck`, unit, function, SEO, build, and relevant e2e suites pass;
- hydrated framework islands and React chunks remain absent;
- critical tool JavaScript remains ≤ 15 KB gzip and total tool JavaScript ≤ 40 KB gzip;
- before/after evidence shows improved hierarchy without changing product truth.
