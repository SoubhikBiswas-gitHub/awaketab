# Cloud agent log: B7 Pro and checkout (`redesign/cloud-b7-pro`)

Branch `redesign/cloud-b7-pro`, cut from `origin/redesign/clear-night` at 2742fbf (B1, B2, B8, B9 already on it).
Scope as briefed: `/pro`, `/pro/activate` (with the checkout-return states), `/pro/manage` (with the lapsed and
grace states), their scripts, Pro-only components, `styles/pro.css` and tests. Nothing outside that list was
edited, except for additions: new tokens at the end of `:root` in `tokens.css`, `pro.css` added to the strict
stylelint override, three docs rows.

## What changed

**Pages**

- `src/pages/pro.astro` was rebuilt to board **Pro.dc.html**. It has:
  - **Hero:** the "One evening with AwakeTab" kicker, h1 and lead, the at-a-glance bullets, and a lamp CTA to `#plans`.
  - **Lamp ring (preview only, nothing is saved):** a 72 % arc with a glow, a tip bead with a halo, ticks and a slow sweep. It is 224/256/320 px on phone/tablet/desktop.
  - **Lamp picker:** the page follows the picked lamp. This is CSS on native radios (`:root:has(#pro-lamp-*:checked)`), so there is no script and no flash.
  - **Plan helper:** three questions and one honest suggestion, with seven possible results.
  - **The evening:** four moments with a 1 px rail from 600 px:
    - a live Message preview with an 80-character counter;
    - the Cook and lamp pair;
    - a 12-week history with a Free/Pro toggle, a locked view and the export tag;
    - a schedule preview with seven day toggles and a live sentence.
  - **Two ways to pay:** yearly and lifetime cards, the refund line, the shutdown promise (O-33) and the tax line.
  - **What stays free:** the seven real status pills (StatusPill, XS on phones and M from 600) and a FAQ built on `<details name>`.
  - **Business rows:** Embed "Licences open soon" (O-29) and Kiosk.
- `src/pages/pro/activate.astro` covers two boards with one page, switched by `data-state`:
  - **ProActivate.dc.html**, the activation form, with these states:
    - idle;
    - checking (grey track button and spinner, "Checking your key with Polar…");
    - error: a card per code, amber for syncing / offline / token and red otherwise, with Retry and, for `activation_limit`, Manage devices. The matching "If activation fails" row is highlighted.
    - success: "Pro is active on this device" with the key ending, "Unlocked here", Open AwakeTab / Manage devices and "Use a different key" (O-26, no redirect to `/`);
    - ext-success: the key to copy for AwakeTab for Chrome.
  - **Sys.dc.html `kind="checkout"`**, the checkout return:
    - checkout-success: rail, "Pro is active", three next steps with "Show my key" plus Copy, and "Your purchase" (plan, price, renewal date, devices, key ending);
    - cancelled, failed and help.
- `src/pages/pro/manage.astro` covers **ProManage.dc.html** plus the Manage part of **Sys.dc.html `kind="prolapsed"`**. It has:
  - a 5-slot meter;
  - one `role=table`: a two-line list on phones and three columns from 600 px, with device icons and a "This device" tag;
  - inline remove confirm: Keep / Remove device;
  - the empty state and a refund card;
  - grace: an amber panel with "Update payment in Polar", "Pro stays on until {date}", and a "What stays and what changes" aside;
  - lapsed: a neutral panel with "Renew for $12 / year" / "Or $19 once", "Pro off" tags and the aside.

**Scripts** (zero hydration; each page has one bundled module)

- `src/lib/pro-common.ts` is new:
  - `deviceLabel()`: a readable "Chrome · macOS" (C5), replacing `navigator.userAgent.slice(0, 40)`;
  - `telemetryOn()` / `trackPro()`: honour `at.v1.settings.telemetry` (O-43), replacing the hard-coded `telemetry: true` on `/pro` and `/pro/activate`;
  - `applyLaunch()`: the runtime launch-price switch (O-52, D-R13);
  - also `POLAR_PORTAL_URL`, `heatLevels()` (the board's seeded sample) and `fill()` / `longDate()`.
- `src/lib/pro-page.ts` is new. It runs the plan helper (with "Nothing else" exclusive), the message preview and clock, the schedule sentence, and the view / checkout-click events.
- `src/lib/activate-page.ts` was rebuilt on the same hooks and contracts:
  - `CHECKOUT_RETRY_MS`, `whileSyncing`, the ext=1 non-activating lookup and the `data-err` copy source are unchanged.
  - New states: `checkout_id` auto-fill goes to checkout-success; `invalid_key` goes to failed; still `polar_unavailable` after every retry goes to help; `?checkout=cancelled|failed|help` opens those pages directly.
  - After checkout success it makes two optional reads: the non-activating lookup (key ending and "Show my key") and validate (device count). A failure only leaves those rows hidden.
- `src/lib/manage-page.ts`:
  - Rows are cloned from a template of `role=row` divs.
  - "This device" is `sha256(deviceId)` compared with `devHash`, the same hash the server stores.
  - Grace / lapsed come from the yearly token `exp` (period end + 7 days, docs/08 §2.4).
  - Removal is confirmed inline. Removing this browser clears `at.v1.license` and shows the empty state.

**Components, styles, tokens and strings**

- **Components:** `components/pro/ProLampRing.astro` and `ProRefund.astro`. B2's `Button`, `StatusPill`, `LogoGlyph`, `.at-card`, `.at-tag`, `.at-chip`, `.at-seg` and `.at-input` are reused, never restyled. The few Pro-only looks are modifier classes under `.at-pro`, such as the 45 % lamp-line tag and the chip with 16 px padding and a transparent fill.
- **`src/styles/pro.css`:** tokens by name only. It is now under the strict stylelint override, like `shell.css`. The type roles and measures the boards need that §12 lacks are declared once as `--at-type-pro-*` / `--at-pro-*` (label 16/24, figure 28/36, lamp name 48/56, mono key, message sizes).
- **`tokens.css`:** added only `--at-lamp-{aqua,violet,mint,sky}-{light,dark}` at the end of `:root`.
- **Strings:** 312 new keys, all under `page.pro.*` (the Pro pages' family) in all eight locales, English as the other Pro keys already are. I did not use the `pro.*` prefix on purpose: `pro.` is in `ISLAND_PREFIXES`, so every tool page ships those strings in its HTML, and the Pro copy would have added about 15 KB to each tool page. `page.pro.description` was shortened to ≤ 155 characters, and the unbuilt web schedules and custom end sounds were removed from it (O-05).
- **Docs:** `00-conventions.md` gained rows for `?checkout=`, the two `data-state` sets, `data-launch` and `pro-common.ts`. `09-monetization-impl.md` §2.2 step 4 now describes the new flow. The changelog fragment is held back; see Gates.

**Tests**

- `test/lib/activate-page.test.ts`:
  - **Mount and mocks:** the mount now mirrors the new markup, and the licence mock gained `PRO_LAUNCH_END` and `fetchActivations`.
  - **Changed assertion:** "wrapper keeps one child" is now "card keeps title, text and actions", and the test also checks the title, tone, current row and Manage link.
  - **New tests (6):** no redirect plus key ending; readable device label; the checkout "Your purchase" fill; failed; `?checkout=`; the telemetry opt-out.
- `test/lib/manage-page.test.ts` was rewritten for the div rows. No existing check was dropped; the shadcn class checks became hook checks. New tests cover the meter, This device, confirm and Keep, removing this device, grace, lapsed, and the helpers.
- `test/lib/pro-page.test.ts` is new: helper, message, schedule, heatmap, launch switch, six UA labels, opt-out, and the helper in the DOM.
- `test/e2e/tool.spec.ts` journey 9: after activation it now expects the success card and clicks "Open AwakeTab", instead of waiting for a redirect to `/`. That redirect was the behaviour O-26 replaced.

## Sizes

- Tool page (`pnpm size`): criticalJs 14,824 B, totalJs **40,320 B** gz (≤ 40,960), CSS **16,677 B** gz (≤ 20,480), embed 14,859 B, loader 2,969 B. No hydrated pages and no React chunks. The Pro pages do not touch the tool bundle or the island catalog.
- `pro.css` is inlined on the three Pro pages only.

## Gates

All run on the final tree, in the brief's order (Node 22.22.2, pnpm 9.15.9):

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ok |
| `pnpm lint` (eslint + stylelint, `pro.css` under the strict token override) | 0 problems |
| `pnpm typecheck` | 0 errors, 0 warnings (astro check 193 files + functions) |
| `pnpm test` | unit **623 / 623** (66 files) + functions **217 / 217** (12 files) |
| `pnpm build` | ok, 450 pages |
| `pnpm size` | criticalJs 14,824 · totalJs 40,320 (≤ 40,960) · CSS 16,677 (≤ 20,480) · embed 14,859 · loader 2,969 B gz |
| `AT_ALLOW_MISSING_PRODUCTION_KEY=1 PUBLIC_POLAR_SERVER=production pnpm -F web build && pnpm test:seo` | **82 / 82** (5 files) |
| `pnpm build` | ok |
| `pnpm test:e2e --project=chromium` | **250 passed, 1 failed, 37 skipped**. The failure is `keyboard.spec.ts` "journey 4 (keyboard)", a focus check on the tool page. It fails the same way on `origin/redesign/clear-night` (2742fbf, checked in a clean worktree), and this branch does not touch the tool. |

- Only Chromium runs here: the container has no Firefox or WebKit build (`/opt/pw-browsers` holds Chromium 1194 only).
- `test:seo` passes only after the production build, as intended. Its checkout-mode test accepts sandbox links only under `https://sandbox.polar.sh/`, while the sandbox links are `sandbox-api.polar.sh`; this is pre-existing and unrelated to B7.
- **Changelog fragment held back.** The fragment below breaks `launch-audit.test.ts` "puts the 1.0 launch entry first". Its date, 27 September, is after the 1.0 entry of 26 September, and that test pins the launch entry first. It belongs with the redesign's release note when the integrator dates it:

  > /pro now tells the story of one evening with AwakeTab: a lamp picker that recolours the page, a three-question plan helper that often answers "free", and live previews of Message mode, 12 weeks of stats and extension schedules. Unbuilt features are gone from the copy, Embed licences say "open soon", and the lifetime launch price switches to $29 on its end date with no strike-through. After checkout, /pro/activate shows "Pro is active" with next steps instead of jumping to the tool, and has its own pages for a closed checkout, a failed payment and a missing key. Manage devices shows a five-slot meter, marks this device, asks before removing one, and explains a renewal that did not go through or a plan that ended. Devices get readable names such as "Chrome · macOS", and the Pro pages respect the telemetry switch.


## Visual check

Every page and state was screenshotted at 390 / 820 / 1280 in light and dark: 14 cases × 6 = 84 shots. Each was compared side by side with the canvas boards rendered by the real canvas runtime (`dc-runtime.js`, 84 reference shots). The mocks for Manage and checkout use fixed sample devices and dates.

Fixed during the comparison:
- lamp sizes lost to the layer order;
- the seg indicator: shell.css's nested `:has()` is rejected by browsers, so `pro.css` moves it by radio id;
- the aura adding scroll height;
- the lapsed layout's alignment and lead width;
- the phone lapse buttons;
- the device icons;
- the checkout footer spacing;
- the "If activation fails" row height;
- horizontal scroll at 320 px (days and heatmap cells shrink below 360);
- an axe contrast failure measured mid-fade: the empty state and device card no longer animate in.

Remaining differences, and why:
- **Live data:** device names and dates, the clock, the key and the heatmap phase. Device labels now read "Safari · macOS" (C5) where the board's samples read "Safari on Mac".
- **Motion phase:** the aura drift, the ring sweep and the at-rise entrances are animated on the boards. The screenshots use reduced motion, so blob positions differ slightly.
- **B2 shell:** header, footer and language switcher (layout at 820), the Button glow (`0 10px 28px -12px` vs the board's `0 10px 30px -8px`) and the StatusPill M radius (r20, vs the board's r999 at 38 px, which looks the same). These are B2's and were not restyled, per the brief.
- **Font rasterisation:** local Geist vs the boards' Google Fonts Geist. Some lines wrap one word earlier or later (e.g. the moment text on desktop).
- **Tablet /pro/manage empty:** the text wraps to two lines in the 640 column, as on the board's phone.

## Open points for the owner

- `POLAR_PORTAL_URL` is `https://polar.sh/awaketab/portal` in production builds (the sandbox org slug `awaketab` is confirmed in `checkout.ts`). Please confirm the production org slug when the production organisation exists.
- The Polar checkout links have no cancel URL. `?checkout=cancelled` is ready for one, and support can link to it; `?checkout=help` is the "where is my key" page.
- The desktop popup checkout (docs/09 §2.2 steps 1 and 3) was not in the brief and is still same-tab.
- `pro.card` ("ambient packs, schedules…") is used by the tool's settings sheet, which another agent owns. It still mentions schedules; K2 / O-05 asks for that copy to change.
- O-52: the copy still says "Launch price for the first 90 days after launch" and the switch uses `PRO_LAUNCH_END` from `license.ts`. The cancelled page and the lapsed note say "the end date is on the Pro page" (board copy). Show the date on /pro once it is fixed at go-live.
