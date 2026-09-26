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
});

test('journey 2 preset 2 h writes a duration session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '2 h', exact: true }).click();
  await expect(page.locator('[data-timer-digits]')).toHaveText(/0[12]:\d{2}:\d{2}/);
  const session = await page.evaluate(() => localStorage.getItem('at.v1.session'));
  expect(session).toContain('"type":"duration"');
});

test('journey 3 until picker shows Tomorrow when past', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Until…' }).click();
  const dlg = page.locator('dialog[data-dialog="until"]');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('[data-until-summary]')).not.toHaveText('');
  await dlg.locator('input[name="until"]').fill('00:00');
  await dlg.locator('input[name="until"]').dispatchEvent('input');
  await expect(dlg.locator('[data-until-summary]')).toContainText('Tomorrow');
});

test('journey 4 hide then show reacquires', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await page.evaluate(() => (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('hidden'));
  await expect(page.locator('[data-pill-text]')).toHaveText('Paused — tab hidden');
  await page.evaluate(() => (window as Window & { __at: { setVisibility: (s: string) => void } }).__at.setVisibility('visible'));
  await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(page.locator('[data-toasts]')).toContainText('Screen awake again');
});

test('journey 5 denied shows advice', async ({ page }) => {
  await page.goto('/?autostart=0');
  await page.evaluate(() => {
    (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
  });
  await page.getByRole('button', { name: '15 min', exact: true }).click();
  await expect(page.locator('[data-pill-text]')).toHaveText("Blocked — here's the fix", { timeout: 4000 });
  await expect(page.locator('[data-notice]')).toBeVisible();
  await expect(page.locator('[data-notice-body]')).not.toHaveText('');
  await expect(page.locator('[data-timer]')).toBeHidden();
});

test('journey 6 timer end chimes, flashes the title and opens extend', async ({ page }) => {
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
  await page.clock.install();
  await page.goto('/?autostart=0');
  // A pointerdown on the island primes the AudioContext (docs/04 §10).
  await page.locator('#awaketab-tool h1').click();
  await page.getByRole('button', { name: 'Custom…' }).click();
  const dlg = page.locator('dialog[data-dialog="custom"]');
  await expect(dlg).toBeVisible();
  await dlg.locator('input[name="days"]').fill('0');
  await dlg.locator('input[name="hours"]').fill('0');
  await dlg.locator('input[name="minutes"]').fill('1');
  await dlg.locator('[data-custom-start]').click();
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
  await expect(page.locator('dialog[data-dialog="extend"]')).toBeVisible({ timeout: 4000 });
  await page.locator('[data-extend-30]').click();
  await expect(page.locator('[data-timer-digits]')).toHaveText(/00:(29|30|31):\d{2}/);
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
  await page.goto('/pro/activate?ext=1');
  await page.locator('input[name="key"]').fill('ATAB-TEST-KEY-1234567890');
  await page.locator('[data-activate] button[type="submit"]').click();
  await expect(page.locator('[data-ext-panel]')).toBeVisible();
  await expect(page).toHaveURL(/ext=1/u);
});

test('axe zero on home light and dark', async ({ page }) => {
  await page.goto('/');
  const light = await new AxeBuilder({ page }).analyze();
  expect(light.violations).toEqual([]);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await new AxeBuilder({ page }).analyze();
  expect(dark.violations).toEqual([]);
});
