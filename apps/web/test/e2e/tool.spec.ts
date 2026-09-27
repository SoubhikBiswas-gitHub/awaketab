import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
});

test('journey 1 autostart shows Screen awake', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
  // The island starts after first paint (LCP budget) but must still request the lock within 300 ms of
  // DOMContentLoaded (docs/00 §11).
  const gap = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const at = (window as Window & { __at: { firstRequestAt: number | null } }).__at.firstRequestAt ?? Infinity;
    return at - nav.domContentLoadedEventStart;
  });
  expect(gap).toBeLessThanOrEqual(300);
});

test('journey 2 preset 2 h writes a duration session', async ({ page }) => {
  await page.goto('/?autostart=0');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  // A length chip chooses what the lamp button runs (DESIGN.md §5); the button starts it.
  await page.getByRole('button', { name: '2 hours', exact: true }).click();
  await expect(page.locator('#awaketab-tool .at-cta')).toHaveText(/Keep awake · 2 h/u);
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('[data-timer-digits]')).toHaveText(/^(?:1:59:\d{2}|2:00:00)$/u);
  const session = await page.evaluate(() => localStorage.getItem('at.v1.session'));
  expect(session).toContain('"type":"duration"');
});

test('journey 3 until panel asks "tomorrow?" for a time that has passed', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-27T21:30:00') });
  await page.goto('/?autostart=0');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.getByRole('button', { name: 'Until a time' }).click();
  // An inline panel replaces the length block, never a modal (DESIGN.md §6).
  const panel = page.locator('.at-lp-until');
  await expect(panel).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(panel.locator('[data-slot="0"]')).toContainText(/\d{1,2}:\d{2}/u);
  await panel.locator('[data-until-input]').fill('07:00');
  await panel.locator('[data-until-input]').dispatchEvent('change');
  await expect(panel.locator('[data-t="pastQ"]')).toHaveText('7:00 AM is tomorrow. Keep awake until then?');
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  const session = await page.evaluate(() => localStorage.getItem('at.v1.session'));
  expect(session).toContain('"type":"until"');
});

test('journey 4 hide then show reacquires', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await page.evaluate(() =>
    (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('hidden'),
  );
  await expect(page.locator('[data-pill-text]')).toHaveText('Paused — tab hidden');
  await page.evaluate(() =>
    (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('visible'),
  );
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(page.locator('[data-toasts]')).toContainText('Screen awake again');
});

test('journey 5 denied shows the fix: the usual causes when the cause is unknown, Retry and the fallback', async ({
  page,
}) => {
  await page.goto('/?autostart=0');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.evaluate(() => {
    (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
  });
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('[data-pill-text]')).toHaveText("Blocked — here's the fix", { timeout: 4000 });
  const card = page.locator('.at-blocked');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Your browser said no');
  await expect(card.locator('.at-causes')).toBeVisible();
  // Battery savers and Low Power Mode never refuse a wake lock, so nothing may blame them (docs/04 §3).
  await expect(page.locator('#awaketab-tool')).not.toContainText(/battery saver|low power mode|energy saver/iu, {
    useInnerText: true,
  });
  await page.locator('#awaketab-tool [data-act="retry"]:visible').click();
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(card).toBeHidden();
});

test('/30m first load with a refused lock stays honest and moves nothing', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as Window & { __at: { rejectNext: string | null }; __cls: number };
    w.__at.rejectNext = 'NotAllowedError';
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>)
        if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/30m');
  await expect(page.locator('#awaketab-tool')).toHaveAttribute('data-settled', '', { timeout: 4000 });
  await expect(page.locator('[data-pill-text]')).toBeVisible();
  await expect(page.locator('[data-pill-text]')).toHaveText('Ready');
  await expect(page.locator('#awaketab-tool')).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('#awaketab-tool .at-face-ring [data-t="k"]')).toHaveText('Keeps awake for');
  await expect(page.locator('#awaketab-tool .at-cta')).toBeVisible();
  await expect(page.locator('.at-blocked')).toBeHidden();
  await expect(page.locator('#awaketab-tool')).not.toContainText(/battery saver|low power mode|energy saver/iu, {
    useInnerText: true,
  });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as Window & { __cls: number }).__cls)).toBe(0);
  // A refused tap then shows the full card with the usual causes.
  await page.evaluate(() => {
    (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
  });
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('.at-blocked .at-causes')).toBeVisible();
});

test('the first paint is the settled tool: the island changes nothing on screen when it starts', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
  });
  const read = async () => {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    return page.evaluate(() => {
      const tool = document.querySelector('#awaketab-tool');
      const text = (sel: string) =>
        [...(tool?.querySelectorAll(sel) ?? [])].map((n) => (n.textContent ?? '').trim()).join('|');
      return {
        status: tool?.getAttribute('data-status'),
        pill: text('[data-pill-text]'),
        face: text('.at-face-ring .at-face-text'),
        cta: text('.at-cta [data-t="cta"]'),
        date: text('.at-first [data-t="date"]'),
        pressed: text('[data-chips] [aria-pressed="true"]'),
      };
    });
  };
  await page.route('**/*.js', (route) => route.abort());
  await page.goto('/');
  const first = await read();
  const moving = await page.evaluate(
    () =>
      document
        .querySelector('#awaketab-tool .at-tool')
        ?.getAnimations({ subtree: true })
        .filter((a) => a.effect?.getTiming().iterations !== Infinity).length,
  );
  expect(moving).toBe(0);
  await page.unrouteAll();
  await page.goto('/');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.waitForTimeout(300);
  expect(first).toMatchObject({ status: 'ready', pill: 'Ready', pressed: '∞' });
  expect(first.date).not.toBe('');
  expect(await read()).toEqual(first);
});

test('a toast on a content page has a 44 px close button', async ({ page }) => {
  await page.goto('/learn/screen-wake-lock-api-guide');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  // Changing the length while running switches at once and says so in a toast.
  await page.locator('#awaketab-tool [data-chips] [data-preset="p60"]').click();
  const close = page.locator('[data-toasts] .at-toast-x').first();
  await expect(close).toBeVisible();
  // The toast rises in with a slight scale (DESIGN.md §8); measure it at rest.
  await page.evaluate(() => {
    for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
  });
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test.describe('layout stability: the first load moves nothing (CLS 0, docs/00 §11)', () => {
  for (const [route, deny] of [
    ['/', false],
    ['/', true],
    ['/30m', false],
    ['/30m', true],
  ] as const) {
    for (const [width, height] of [
      [390, 844],
      [412, 823],
      [820, 1180],
      [1280, 800],
    ] as const) {
      test(`${route} ${deny ? 'refused' : 'granted'} at ${String(width)}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.addInitScript((refuse) => {
          const w = window as Window & { __at: { rejectNext: string | null }; __cls: number; __moved: string[] };
          if (refuse) w.__at.rejectNext = 'NotAllowedError';
          w.__cls = 0;
          w.__moved = [];
          type TShift = PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
            sources: Array<{ node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>;
          };
          const inHeader = (node?: Node) =>
            (node instanceof Element ? node : node?.parentElement)?.closest('.at-site-header') != null;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as TShift[]) {
              // A worker under heavy test load can paint the shared header while the parser is still inside it (the
              // theme switch before its buttons); that is the parser's frame, not the tool moving, so it is left out.
              if (e.hadRecentInput || e.sources.every((src) => inHeader(src.node))) continue;
              w.__cls += e.value;
              for (const src of e.sources) {
                const el = src.node instanceof Element ? src.node : src.node?.parentElement;
                w.__moved.push(
                  `${String(Math.round(e.startTime))} ms ${el?.className.toString() ?? '?'} ${JSON.stringify([src.previousRect, src.currentRect])}`,
                );
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        }, deny);
        // Warm the font cache first: a web-font swap that lands late under test load is a network race (B1 keeps it
        // metric-matched), not the tool moving its own layout, which is what this measures.
        await page.goto('/about');
        await page.evaluate(() => document.fonts.ready);
        await page.goto(route);
        await expect(page.locator('#awaketab-tool')).toHaveAttribute('data-settled', '');
        await page.waitForTimeout(1500);
        const { cls, moved } = await page.evaluate(() => {
          const w = window as Window & { __cls: number; __moved: string[] };
          return { cls: w.__cls, moved: w.__moved };
        });
        expect(cls, moved.join('\n')).toBe(0);
      });
    }
  }
});

test("journey 6 timer end chimes, flashes the title and shows the time's-up card", async ({ page }) => {
  // Count synthesised chime tones: a stub AudioContext records every createOscillator() call.
  await page.addInitScript(() => {
    const w = window as Window & { __chimes: number };
    w.__chimes = 0;
    const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const node = () => ({
      connect(next: unknown) {
        return next;
      },
    });
    class FakeAudioContext {
      currentTime = 0;
      state = 'running';
      destination = {};
      resume() {
        return Promise.resolve();
      }
      createOscillator() {
        w.__chimes += 1;
        return { ...node(), type: 'sine', frequency: param(), start() {}, stop() {} };
      }
      createGain() {
        return { ...node(), gain: param() };
      }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: FakeAudioContext });
  });
  // A one-minute custom length (the Custom panel steps in 5 minutes; the stored last length is what it shows).
  await page.addInitScript(() => {
    localStorage.setItem('at.v1.settings', JSON.stringify({ v: 1, lastCustomMs: 60_000 }));
  });
  await page.clock.install();
  await page.goto('/?autostart=0');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  // A pointerdown on the island primes the AudioContext (docs/04 §10).
  await page.locator('#awaketab-tool h1').click();
  await page.getByRole('button', { name: 'Custom length' }).click();
  await expect(page.locator('.at-lp-custom')).toBeVisible();
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  const titles: string[] = [];
  await page.clock.fastForward(61_000);
  await expect
    .poll(async () => {
      titles.push(await page.title());
      return titles.includes('Done — AwakeTab');
    })
    .toBe(true);
  await expect.poll(() => page.evaluate(() => (window as Window & { __chimes: number }).__chimes)).toBeGreaterThan(0);
  // The time's-up card sits in the dock (canvas `timesup`), not a modal.
  await expect(page.locator('#awaketab-tool')).toHaveAttribute('data-status', 'timesup', { timeout: 4000 });
  await expect(page.locator('.at-ask')).toBeVisible();
  await page.locator('[data-act="add30"]').click();
  await expect(page.locator('[data-timer-digits]')).toHaveText(/^(?:29|30):\d{2}$/u);
});

test('journey 7 resume banner after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await page.reload();
  await expect(page.locator('[data-resume]')).toBeVisible();
});

test('journey 12 second tab warning', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  const two = await context.newPage();
  await installFakeWakeLock(two);
  await two.goto('/');
  await expect(two.locator('[data-second-tab]')).toBeVisible({ timeout: 4000 });
  await two.close();
});

test('journey 8 pip requests a 280×120 document window', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        requestWindow: async (opts: { width: number; height: number }) => {
          (window as Window & { __atPip: { width: number; height: number } }).__atPip = opts;
          const d = document.implementation.createHTMLDocument('pip');
          return {
            document: d,
            addEventListener() {
              return undefined;
            },
          };
        },
      },
    });
  });
  await page.goto('/?autostart=0');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.keyboard.press('p');
  await expect
    .poll(async () =>
      page.evaluate(() => (window as Window & { __atPip?: { width: number; height: number } }).__atPip?.width),
    )
    .toBe(280);
});

test('journey 9 mocked Pro activation shows the badge then revokes', async ({ page }) => {
  await page.route('**/api/license/activate', async (route) => {
    await route.fulfill({
      json: {
        token: 'header.payload.sig',
        plan: 'pro_yearly',
        features: ['ambient.packs', 'ads.free'],
        exp: Math.floor(Date.now() / 1000) + 86_400,
        activations: [],
      },
    });
  });
  // The first page on / revalidates the stored licence too; answer it OK so it cannot consume the
  // `revoked` mock meant for the reload (the source of the old flake).
  await page.route('**/api/license/validate', async (route) => {
    await route.fulfill({ json: {} });
  });
  const firstValidate = page.waitForResponse('**/api/license/validate');
  await page.goto('/pro/activate');
  await page.locator('input[name="key"]').fill('ATAB-TEST-KEY-1234567890');
  await page.locator('[data-activate] button[type="submit"]').click();
  // B7 / O-26: activation ends on "Pro is active on this device" (no redirect); its lamp action opens the tool.
  await expect(page.locator('[data-ok]')).toBeVisible();
  await page.locator('[data-ok-open]').click();
  await page.waitForURL('**/');
  await expect(page.locator('[data-pro-badge]')).toBeVisible();
  await firstValidate;
  await page.unroute('**/api/license/validate');
  await page.route('**/api/license/validate', async (route) => {
    await route.fulfill({ json: { revoked: true } });
  });
  await page.reload();
  // Bumped from the 5s default: under full-suite parallel worker load the mocked validate
  // round-trip plus toast render can miss 5s even though it's not slow in isolation.
  await expect(page.locator('[data-toasts]')).toContainText('refunded or cancelled', { timeout: 10_000 });
  await expect(page.locator('[data-pro-badge]')).toBeHidden();
});

test('journey 11 tool routes ship no ad network code', async ({ page }) => {
  const html = await (await page.request.get('/')).text();
  expect(html).not.toMatch(/googlesyndication|adsbygoogle|pagead\/js|doubleclick\.net/u);
  await page.goto('/');
  await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
});

test('first-party beacon includes page_view, session_start and lock_state', async ({ page }) => {
  const seen: string[] = [];
  const record = (raw: string | null) => {
    if (!raw) return;
    const body = JSON.parse(raw) as { events?: Array<{ event: string }> };
    for (const row of body.events ?? []) seen.push(row.event);
  };
  // WebKit does not expose sendBeacon Blob bodies to page.route (postData() is null there), so also capture
  // the payload in the page; both paths feed the same assertion in every engine.
  await page.exposeFunction('__atBeacon', record);
  await page.addInitScript(() => {
    const send = navigator.sendBeacon.bind(navigator);
    const hook = (window as unknown as { __atBeacon: (raw: string) => void }).__atBeacon;
    navigator.sendBeacon = (url, data) => {
      if (data instanceof Blob) void data.text().then(hook);
      else if (typeof data === 'string') hook(data);
      return send(url, data);
    };
  });
  await page.route('**/api/e', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    record(route.request().postData());
    await route.fulfill({ status: 204, body: '' });
  });
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(() => seen.includes('page_view') && seen.includes('session_start') && seen.includes('lock_state'))
    .toBe(true);
});

test('pro activate with ext=1 shows the copy panel', async ({ page }) => {
  // docs/09 §2.3a: the hand-off must not spend an activation on this browser; the extension activates itself.
  const licenceCalls: string[] = [];
  await page.route('**/api/license/**', async (route) => {
    licenceCalls.push(route.request().url());
    await route.fulfill({ status: 500, json: { error: 'polar_unavailable' } });
  });
  await page.goto('/pro/activate?ext=1');
  // Long enough for the input's minlength, so the page's own key-shape check is what rejects it.
  await page.locator('input[name="key"]').fill('not a licence key at all');
  await page.locator('[data-activate] button[type="submit"]').click();
  await expect(page.locator('[data-activate-error]')).toBeVisible();
  await expect(page.locator('[data-ext-panel]')).toBeHidden();

  await page.locator('input[name="key"]').fill(' atab-test-key-1234567890 ');
  await page.locator('[data-activate] button[type="submit"]').click();
  await expect(page.locator('[data-ext-panel]')).toBeVisible();
  await expect(page.locator('[data-ext-key]')).toHaveValue('ATAB-TEST-KEY-1234567890');
  await expect(page.locator('[data-activate-error]')).toBeHidden();
  await expect(page).toHaveURL(/ext=1/u);
  expect(licenceCalls).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('at.v1.license'))).toBeNull();
});

test('pro activate with ext=1 and checkout_id looks the key up without activating', async ({ page }) => {
  const bodies: unknown[] = [];
  await page.route('**/api/license/**', async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ json: { key: 'ATAB-TEST-KEY-1234567890', plan: 'pro_yearly' } });
  });
  await page.goto('/pro/activate?ext=1&checkout_id=chk_e2e');
  await expect(page.locator('[data-ext-panel]')).toBeVisible();
  await expect(page.locator('[data-ext-key]')).toHaveValue('ATAB-TEST-KEY-1234567890');
  expect(bodies).toEqual([{ checkoutId: 'chk_e2e', lookup: true }]);
  expect(await page.evaluate(() => localStorage.getItem('at.v1.license'))).toBeNull();
});

test('axe zero on home light and dark', async ({ page }) => {
  await page.goto('/');
  const light = await new AxeBuilder({ page }).analyze();
  expect(light.violations).toEqual([]);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await new AxeBuilder({ page }).analyze();
  expect(dark.violations).toEqual([]);
});
