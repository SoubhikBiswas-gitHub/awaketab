import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

/*
 * Keyboard-only run of journeys 1–7 (docs/13 §6, docs/19 §E, docs/17 §2): only page.keyboard — Tab /
 * Shift+Tab / Enter / Space / Esc and the documented single-key shortcuts (1–6, 0, U, F, D, M, P, ?).
 * No mouse clicks anywhere. Every control that receives focus must show a focus indicator (:focus-visible
 * with a non-none outline or ring), and focus must never get stuck (no trap outside modal dialogs, and
 * every modal lets Esc out).
 */

type TKeys = { tab: string; shiftTab: string };

// WebKit follows Safari: plain Tab skips links and buttons unless "Press Tab to highlight each item" is on;
// Option+Tab is Safari's documented keyboard path to every control.
const keysFor = (browserName: string): TKeys =>
  browserName === 'webkit' ? { tab: 'Alt+Tab', shiftTab: 'Alt+Shift+Tab' } : { tab: 'Tab', shiftTab: 'Shift+Tab' };

interface IFocus {
  desc: string;
  focusVisible: boolean;
  indicator: boolean;
}

/** Describes document.activeElement and whether it (or, for a visually hidden input, its label) shows focus. */
async function focusInfo(page: Page): Promise<IFocus | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement) || el === document.body) return null;
    // Settle focus-ring transitions so the computed style is the end state, not a transparent first frame.
    for (const anim of document.getAnimations()) {
      if (anim.effect?.getComputedTiming().endTime !== Infinity) anim.finish();
    }
    const alpha = (color: string): number => {
      if (color === 'transparent') return 0;
      const slash = /\/\s*([\d.]+)(%?)\s*\)$/u.exec(color);
      if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
      const rgba = /^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/u.exec(color);
      return rgba ? Number(rgba[1]) : 1;
    };
    // A focus ring drawn with box-shadow: a non-transparent layer with a spread.
    const visibleShadow = (shadow: string): boolean =>
      shadow !== 'none' &&
      shadow.split(/,(?![^(]*\))/u).some((layer) => {
        const color = /(?:rgba?|oklab|oklch|lab|lch|color|hsla?)\([^)]*\)|#[\da-f]+|transparent/iu.exec(layer)?.[0] ?? 'black';
        const lengths = [...layer.replace(color, '').matchAll(/(-?[\d.]+)px/gu)].map((m) => Number(m[1]));
        // A ring is a spread (x y blur spread); a resting drop shadow (shadow-xs) has none and does not count.
        return alpha(color) > 0 && (lengths[3] ?? 0) > 0;
      });
    const shows = (node: Element): boolean => {
      const cs = getComputedStyle(node);
      const outline = cs.outlineStyle !== 'none' && Number.parseFloat(cs.outlineWidth) > 0 && alpha(cs.outlineColor) > 0;
      return outline || visibleShadow(cs.boxShadow);
    };
    const rect = el.getBoundingClientRect();
    const hiddenInput = el instanceof HTMLInputElement && (rect.width <= 1 || rect.height <= 1);
    const label = el.closest('label');
    const indicator = shows(el) || (hiddenInput && label !== null && shows(label));
    const name =
      el.getAttribute('aria-label') ?? el.getAttribute('data-preset') ?? (el.textContent ?? '').trim().slice(0, 40);
    return {
      desc: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${name}"`,
      // Text-entry fields show focus on :focus-within: Chromium drops :focus-visible (and :focus on the AM/PM
      // segment) inside <input type=time>, and WebKit never sets :focus-visible on a field focused by showModal().
      focusVisible:
        el.matches(':focus-visible') ||
        (el.matches('input:not([type=checkbox], [type=radio], [type=range]), textarea, select') && el.matches(':focus-within')),
      indicator,
    };
  });
}

async function expectVisibleFocus(page: Page): Promise<IFocus> {
  const info = await focusInfo(page);
  expect(info, 'something must be focused').not.toBeNull();
  const f = info as IFocus;
  expect(f.focusVisible, `${f.desc} matches :focus-visible`).toBe(true);
  expect(f.indicator, `${f.desc} draws an outline or ring`).toBe(true);
  return f;
}

/** Tabs forward until `selector` has focus, asserting a visible indicator on every stop on the way. */
async function tabTo(page: Page, keys: TKeys, selector: string, max = 80, back = false): Promise<void> {
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press(back ? keys.shiftTab : keys.tab);
    if (await page.evaluate((sel) => document.activeElement?.matches(sel) ?? false, selector)) {
      await expectVisibleFocus(page);
      return;
    }
    if ((await focusInfo(page)) !== null) await expectVisibleFocus(page);
  }
  throw new Error(`${selector} never received focus after ${String(max)} presses`);
}

const pill = (page: Page) => page.locator('#awaketab-tool [data-pill-text]').first();
const focusedMatches = (page: Page, sel: string) =>
  page.evaluate((s) => document.activeElement?.matches(s) ?? false, sel);

async function session(page: Page): Promise<{ status: string; plan: { type: string } } | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('at.v1.session');
    return raw ? (JSON.parse(raw) as { status: string; plan: { type: string } }) : null;
  });
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
});

test('journey 1 (keyboard): autostart, skip link, and the whole page tabs through without a trap', async ({
  page,
  browserName,
}) => {
  const keys = keysFor(browserName);
  await page.goto('/');
  await expect(pill(page)).toHaveText('Screen awake', { timeout: 4000 });

  // First stop is the skip link; Enter moves to the main heading.
  await page.keyboard.press(keys.tab);
  expect(await focusedMatches(page, 'a.at-skip')).toBe(true);
  await expectVisibleFocus(page);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#content$/u);

  // The last focusable element of the page (the footer's locale links), which Tab must reach.
  const lastFocusable = await page.evaluate(() => {
    const els = [
      ...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]'),
    ].filter((el) => el.tabIndex >= 0 && el.closest('[hidden], dialog:not([open]), [inert]') === null && el.getClientRects().length > 0);
    return [...document.querySelectorAll('*')].indexOf(els[els.length - 1] as Element);
  });

  // Walk forward through every focusable control; each shows focus and focus keeps moving to the end.
  const seen: number[] = [];
  for (let i = 0; i < 400; i += 1) {
    await page.keyboard.press(keys.tab);
    const info = await focusInfo(page);
    if (info === null) break; // focus left the document: no trap
    await expectVisibleFocus(page);
    const id = await page.evaluate(() => [...document.querySelectorAll('*')].indexOf(document.activeElement as Element));
    const last = seen[seen.length - 1];
    if (last !== undefined && id < last) break; // wrapped back to the top: no trap
    expect(id, `focus stuck on ${info.desc}`).not.toBe(last);
    seen.push(id);
    if (id === lastFocusable) break;
  }
  expect(seen.length).toBeGreaterThan(20);
  expect(seen).toContain(lastFocusable);

  // Shift+Tab walks back up.
  await page.keyboard.press(keys.shiftTab);
  await expectVisibleFocus(page);
});

test('journey 2 (keyboard): Tab to the 2 h chip, Enter starts a 2 h session; the 5 key does too', async ({
  page,
  browserName,
}) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await expect(pill(page)).toHaveText('Ready');
  await tabTo(page, keys, '#awaketab-tool [data-chips] [data-preset="p120"]');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-timer-digits]')).toHaveText(/0[12]:\d{2}:\d{2}/u);
  await expect(pill(page)).toHaveText('Screen awake');
  expect((await session(page))?.plan.type).toBe('duration');

  // Esc (no dialog, standard mode) stops; the 5 shortcut starts the same preset again.
  await page.keyboard.press('Escape');
  await expect(pill(page)).toHaveText('Ready');
  await page.keyboard.press('5');
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-preset="p120"]')).toHaveAttribute('aria-pressed', 'true');
});

test('journey 3 (keyboard): U opens the until picker with focus inside; Enter on Start runs until then', async ({
  page,
  browserName,
}) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await expect(pill(page)).toHaveText('Ready');
  await page.keyboard.press('u');
  const dlg = page.locator('dialog[data-dialog="until"]');
  await expect(dlg).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.closest('dialog')?.dataset.dialog)).toBe('until');
  // The picker opens on "now", which has already begun, so the summary says Tomorrow (journey 3).
  await expect(dlg.locator('[data-until-summary]')).toContainText('Tomorrow');
  await tabTo(page, keys, 'dialog[data-dialog="until"] [data-until-start]', 12);
  await page.keyboard.press('Enter');
  await expect(dlg).toBeHidden();
  await expect(pill(page)).toHaveText('Screen awake');
  expect((await session(page))?.plan.type).toBe('until');
});

test('journey 4 (keyboard): hide → Paused, show → Screen awake again, focus stays put', async ({ page, browserName }) => {
  const keys = keysFor(browserName);
  await page.goto('/');
  await expect(pill(page)).toHaveText('Screen awake');
  await tabTo(page, keys, '#awaketab-tool [data-chips] [data-preset="p30"]');
  await page.evaluate(() => (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('hidden'));
  await expect(pill(page)).toHaveText('Paused — tab hidden');
  await page.evaluate(() => (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('visible'));
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-toasts]')).toContainText('Screen awake again');
  expect(await focusedMatches(page, '[data-preset="p30"]')).toBe(true);
  await expectVisibleFocus(page);
});

test('journey 5 (keyboard): denied → notice; Tab to Retry, Enter re-requests the lock', async ({ page, browserName }) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await page.evaluate(() => {
    (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
  });
  await page.keyboard.press('1');
  await expect(pill(page)).toHaveText("Blocked — here's the fix", { timeout: 4000 });
  await expect(page.locator('[data-notice]')).toBeVisible();
  await expect(page.locator('[data-timer]')).toBeHidden();
  // The pill is a button while blocked; the notice's link names its destination (not "Learn more").
  await tabTo(page, keys, '[data-pill]');
  await expect(page.locator('[data-notice-learn]')).toHaveText('Why this happens and how to fix it');
  await tabTo(page, keys, '[data-notice-retry]');
  await page.keyboard.press('Enter');
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-notice]')).toBeHidden();
});

test.describe('journey 6 (keyboard): custom timer end → extend prompt', () => {
  async function runOneMinute(page: Page, keys: TKeys): Promise<void> {
    await page.clock.install();
    await page.goto('/?autostart=0');
    await expect(pill(page)).toHaveText('Ready');
    await tabTo(page, keys, '#awaketab-tool [data-chips] [data-preset="custom"]');
    await page.keyboard.press('Enter');
    const dlg = page.locator('dialog[data-dialog="custom"]');
    await expect(dlg).toBeVisible();
    // showModal() puts focus in the dialog; the first field is days. Type 0 d 0 h 1 min.
    if (!(await focusedMatches(page, 'dialog[data-dialog="custom"] input[name="days"]'))) {
      await tabTo(page, keys, 'dialog[data-dialog="custom"] input[name="days"]', 6);
    }
    for (const [name, value] of [
      ['days', '0'],
      ['hours', '0'],
      ['minutes', '1'],
    ] as const) {
      expect(await focusedMatches(page, `dialog[data-dialog="custom"] input[name="${name}"]`)).toBe(true);
      await expectVisibleFocus(page);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(value);
      await page.keyboard.press(keys.tab);
    }
    await expect(dlg.locator('input[name="minutes"]')).toHaveValue('1');
    expect(await focusedMatches(page, '[data-custom-start]')).toBe(true);
    await expectVisibleFocus(page);
    await page.keyboard.press('Enter');
    await expect(dlg).toBeHidden();
    await expect(pill(page)).toHaveText('Screen awake');
    await page.clock.fastForward(61_000);
    await expect(page.locator('dialog[data-dialog="extend"]')).toBeVisible({ timeout: 4000 });
  }

  test('Stop is focused by default and Esc stops the session', async ({ page, browserName }) => {
    const keys = keysFor(browserName);
    await runOneMinute(page, keys);
    await expect.poll(() => focusedMatches(page, 'dialog[data-dialog="extend"] [data-extend-stop]')).toBe(true);
    await expectVisibleFocus(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[data-dialog="extend"]')).toBeHidden();
    await expect(pill(page)).toHaveText('Ready');
  });

  test('Shift+Tab to +30 min and Enter extends the session', async ({ page, browserName }) => {
    const keys = keysFor(browserName);
    await runOneMinute(page, keys);
    await expect.poll(() => focusedMatches(page, 'dialog[data-dialog="extend"] [data-extend-stop]')).toBe(true);
    await tabTo(page, keys, 'dialog[data-dialog="extend"] [data-extend-30]', 4, true);
    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[data-dialog="extend"]')).toBeHidden();
    await expect(page.locator('[data-timer-digits]')).toHaveText(/00:(29|30|31):\d{2}/u);
    await expect(pill(page)).toHaveText('Screen awake');
  });
});

test('journey 7 (keyboard): reload mid-session → Tab to Resume, Enter re-requests the lock', async ({ page, browserName }) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await page.keyboard.press('0');
  await expect(pill(page)).toHaveText('Screen awake');
  await page.reload();
  await expect(page.locator('[data-resume]')).toBeVisible();
  await expect(pill(page)).toHaveText('Ready');
  await tabTo(page, keys, '[data-resume-accept]');
  await page.keyboard.press('Enter');
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-resume]')).toBeHidden();
});

test('shortcuts: 1–6 and 0 pick presets, D cycles the theme, F asks for fullscreen, P opens PiP, ? toggles help', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as Window & { __fs: number; __pip: number };
    w.__fs = 0;
    w.__pip = 0;
    // Record the requests instead of leaving the test at the mercy of headless fullscreen/PiP support.
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true });
    Element.prototype.requestFullscreen = function requestFullscreen() {
      w.__fs += 1;
      return Promise.resolve();
    };
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        requestWindow: async () => {
          w.__pip += 1;
          const d = document.implementation.createHTMLDocument('pip');
          return { document: d, addEventListener: () => undefined };
        },
      },
    });
  });
  await page.goto('/?autostart=0');
  await expect(pill(page)).toHaveText('Ready');
  const presets: Array<[string, string]> = [
    ['1', 'p15'],
    ['2', 'p30'],
    ['3', 'p45'],
    ['4', 'p60'],
    ['5', 'p120'],
    ['6', 'p240'],
    ['0', 'pinf'],
  ];
  for (const [key, id] of presets) {
    await page.keyboard.press(key);
    await expect(page.locator(`#awaketab-tool [data-chips] [data-preset="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(pill(page)).toHaveText('Screen awake');
  }

  // D cycles auto → light → dark → oled (docs/05 §3.13) and persists the choice.
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  await page.keyboard.press('d');
  await page.keyboard.press('d');
  await expect.poll(theme).toBe('dark');
  await page.keyboard.press('d');
  await expect.poll(theme).toBe('oled');

  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => (window as Window & { __fs: number }).__fs)).toBe(1);

  await page.keyboard.press('p');
  await expect.poll(() => page.evaluate(() => (window as Window & { __pip: number }).__pip)).toBe(1);

  const help = page.locator('dialog[data-dialog="shortcuts"]');
  await page.keyboard.press('Shift+Slash');
  await expect(help).toBeVisible();
  await expect(help.locator('dt')).toHaveCount(10);
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();
  // Esc closed the overlay, not the session (the pill itself now lives in the PiP window).
  expect((await session(page))?.status).toBe('active');
});

test('ambient mode (M): controls take focus with a visible ring, Tab stays in the layer, Esc returns', async ({
  page,
  browserName,
}) => {
  const keys = keysFor(browserName);
  await page.goto('/');
  await expect(pill(page)).toHaveText('Screen awake', { timeout: 4000 });
  await page.keyboard.press('m');
  const layer = page.locator('dialog[data-ambient]');
  await expect(layer).toBeVisible();
  await expect(layer).toHaveAttribute('data-mode', 'clock');
  // The layer is modal: focus is inside it or has left for the browser UI, never on the page behind it.
  const outsideLayer = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return el !== null && el !== document.body && el.closest('dialog[data-ambient]') === null;
    });
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press(keys.tab);
    expect(await outsideLayer()).toBe(false);
    if ((await focusInfo(page)) !== null) await expectVisibleFocus(page);
  }
  // Firefox keeps focus on the last control of a modal when Tab has nowhere to go; walk back instead.
  await tabTo(page, keys, '[data-ambient-next]', 6, true);
  // Controls never auto-hide under a keyboard user.
  await page.waitForTimeout(3500);
  await expect(layer).toHaveAttribute('data-controls', 'shown');
  await page.keyboard.press('Enter');
  await expect(layer).toHaveAttribute('data-mode', 'focus');
  await page.keyboard.press('Escape');
  await expect(layer).toBeHidden();
  await expect(pill(page)).toHaveText('Screen awake');
  expect((await session(page))?.status).toBe('active');
});

test('settings dialog: every control shows focus, Esc closes and focus returns to the Settings button', async ({
  page,
  browserName,
}) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await tabTo(page, keys, '#awaketab-tool header [data-open-settings]');
  await page.keyboard.press('Enter');
  const dlg = page.locator('dialog[data-dialog="settings"]');
  await expect(dlg).toBeVisible();
  const inDialog = () => page.evaluate(() => document.activeElement?.closest('dialog')?.dataset.dialog ?? null);
  expect(await inDialog()).toBe('settings');
  for (let i = 0; i < 30; i += 1) {
    await page.keyboard.press(keys.tab);
    const where = await inDialog();
    if (where === null) break;
    expect(where).toBe('settings');
    await expectVisibleFocus(page);
    if (await focusedMatches(page, '[data-settings-reset]')) break;
  }
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  expect(await focusedMatches(page, '#awaketab-tool header [data-open-settings]')).toBe(true);
  await expectVisibleFocus(page);
});

test('stats dialog: opens from the keyboard, Tab reaches Close, Esc closes and restores focus', async ({ page, browserName }) => {
  const keys = keysFor(browserName);
  await page.goto('/?autostart=0');
  await tabTo(page, keys, '#awaketab-tool header [data-open-stats]');
  await page.keyboard.press('Enter');
  const dlg = page.locator('dialog[data-dialog="stats"]');
  await expect(dlg).toBeVisible();
  await tabTo(page, keys, 'dialog[data-dialog="stats"] [data-stats-close]', 10);
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  expect(await focusedMatches(page, '#awaketab-tool header [data-open-stats]')).toBe(true);
  await expectVisibleFocus(page);
});
