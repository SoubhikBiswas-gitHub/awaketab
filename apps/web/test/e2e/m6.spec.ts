import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

// M6 engagement layer: ambient modes, cook and message modes, stats, rating prompt, the /pip mirror and offline.

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
});

const ambient = (page: Page) => page.locator('dialog[data-ambient]');
const pillText = (page: Page) => page.locator('[data-pill-text]');
const toasts = (page: Page) => page.locator('[data-toasts]');

async function storedJson<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as unknown) : null;
  }, key) as Promise<T | null>;
}

interface IStoredSession {
  status: string;
  modeState?: { cookTimers?: unknown[] };
}

interface IStoredMeta {
  sessionCount: number;
  ratingPrompt: { action: string | null; stars?: number };
}

test('M from standard opens clock mode; Esc exits without stopping the session', async ({ page }) => {
  await page.goto('/');
  await expect(pillText(page)).toHaveText('Screen awake', { timeout: 4000 });
  await expect(ambient(page)).toBeHidden();

  await page.keyboard.press('m');
  await expect(ambient(page)).toBeVisible();
  await expect(ambient(page)).toHaveAttribute('data-mode', 'clock');
  await expect(ambient(page).locator('[data-clock]')).toHaveText(/\d{1,2}:\d{2}/u);
  // The pill moves into the layer with the rest of the PiP slot: still one honest pill, still visible.
  await expect(ambient(page).locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(ambient(page).locator('[data-pill]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(ambient(page)).toBeHidden();
  await expect(pillText(page)).toHaveText('Screen awake');
  expect((await storedJson<IStoredSession>(page, 'at.v1.session'))?.status).toBe('active');
});

test('?mode=night opens night mode on the oled palette', async ({ page }) => {
  await page.goto('/?mode=night');
  await expect(ambient(page)).toBeVisible();
  await expect(ambient(page)).toHaveAttribute('data-mode', 'night');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
});

test('cook mode: tap pauses the clock but keeps the lock; kitchen timer finishes', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?mode=cook&autostart=0');
  await expect(ambient(page)).toHaveAttribute('data-mode', 'cook');
  const tap = page.locator('[data-cook-tap]');
  await expect(pillText(page)).toHaveText('Ready');

  await tap.click();
  await expect(pillText(page)).toHaveText('Screen awake');
  await expect.poll(async () => (await storedJson<IStoredSession>(page, 'at.v1.session'))?.status).toBe('active');

  await tap.click();
  await expect(tap).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await storedJson<IStoredSession>(page, 'at.v1.session'))?.status).toBe('paused');
  // Paused clock, held lock: the screen must not go dark mid-recipe.
  await expect(pillText(page)).toHaveText('Screen awake');

  await page.locator('[data-cook-quick="5"]').click();
  const card = page.locator('[data-cook-timer]');
  await expect(card).toHaveCount(1);
  await expect
    .poll(async () => (await storedJson<IStoredSession>(page, 'at.v1.session'))?.modeState?.cookTimers?.length)
    .toBe(1);

  await page.clock.fastForward(5 * 60_000 + 1000);
  await expect(card).toHaveAttribute('data-done', '');
  await expect(toasts(page)).toContainText('Timer 1 — done');
  await expect(pillText(page)).toHaveText('Screen awake');
});

test('message mode: a shared msg previews for 60 s, then falls back to clock', async ({ page }) => {
  await page.clock.install();
  await page.goto('/?mode=message&msg=Back%20soon');
  await expect(ambient(page)).toHaveAttribute('data-mode', 'message');
  await expect(page.locator('[data-message]')).toHaveText('Back soon');
  await expect(page.locator('[data-message-pro]')).toHaveCount(0);

  await page.clock.fastForward(61_000);
  await expect(ambient(page)).toHaveAttribute('data-mode', 'clock');
  await expect(toasts(page)).toContainText('Custom messages are a Pro feature');
});

test('message mode without msg shows sample text and the Pro card', async ({ page }) => {
  await page.goto('/?mode=message');
  await expect(ambient(page)).toHaveAttribute('data-mode', 'message');
  await expect(page.locator('[data-message-pro]')).toBeVisible();
  await expect(page.locator('[data-message]')).toHaveText('Back at 3 pm');
});

test('stats panel shows today, a 7-row heatmap and the free-tier limits', async ({ page }) => {
  await page.goto('/?autostart=0');
  await page.evaluate(() => {
    const key = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      return new Intl.DateTimeFormat('en-CA').format(d);
    };
    const days = { [key(0)]: 42, [key(1)]: 30, [key(3)]: 95, [key(20)]: 60 };
    localStorage.setItem(
      'at.v1.stats',
      JSON.stringify({
        v: 1,
        days,
        totalMinutes: 227,
        sessions: 5,
        daySessions: { [key(0)]: 2, [key(1)]: 1 },
        longestStreakDays: 2,
        currentStreakDays: 2,
        lastSessionAt: Date.now(),
      }),
    );
  });
  await page.goto('/?autostart=0');
  await page.getByRole('button', { name: 'Stats', exact: true }).click();
  const dlg = page.locator('dialog[data-dialog="stats"]');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('[data-stats-today]')).toHaveText('42 min · 2 sessions');
  await expect(dlg.locator('[data-stats-heatmap] tbody tr')).toHaveCount(7);
  await expect(dlg.locator('[data-stats-heatmap] td[data-locked]').first()).toBeAttached();
  await expect(dlg.locator('[data-stats-export]')).toBeHidden();
  await expect(dlg.locator('[data-stats-locked]')).toBeVisible();
  await expect(dlg.locator('[data-stats-empty]')).toBeHidden();
});

test('rating prompt after the 5th counted session, once only', async ({ page }) => {
  await page.route('**/api/rating', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });
  await page.clock.install();
  await page.goto('/?autostart=0');
  await page.evaluate(() => {
    localStorage.setItem(
      'at.v1.meta',
      JSON.stringify({
        v: 1,
        installedAt: Date.now() - 86_400_000,
        sessionCount: 4,
        ratingPrompt: { shownAt: null, action: null },
        lastSeenVersion: '',
        pwa: { installed: false, promptShownAt: null },
        secondTabWarnedAt: null,
      }),
    );
    localStorage.setItem('at.v1.settings', JSON.stringify({ v: 1, endBehaviour: 'stop' }));
  });

  const rating = page.locator('dialog[data-dialog="rating"]');
  const runFiveMinutes = async () => {
    await page.goto('/?autostart=0');
    await page.getByRole('button', { name: 'Custom…' }).click();
    const dlg = page.locator('dialog[data-dialog="custom"]');
    await dlg.locator('input[name="days"]').fill('0');
    await dlg.locator('input[name="hours"]').fill('0');
    await dlg.locator('input[name="minutes"]').fill('5');
    await dlg.locator('[data-custom-start]').click();
    await expect(pillText(page)).toHaveText('Screen awake');
    // runFor (not fastForward) fires every 1 s tick, so awakeSeconds reaches the 5-minute counting floor.
    await page.clock.runFor(5 * 60_000 + 3000);
    await expect(toasts(page)).toContainText('Session complete');
  };

  await runFiveMinutes();
  await expect.poll(async () => (await storedJson<IStoredMeta>(page, 'at.v1.meta'))?.sessionCount).toBe(5);
  await expect(rating).toBeVisible({ timeout: 4000 });
  await rating.getByRole('radio', { name: '4 stars' }).check();
  const sent = page.waitForRequest((r) => r.url().endsWith('/api/rating') && r.method() === 'POST');
  await rating.getByRole('button', { name: 'Send' }).click();
  expect((await sent).postDataJSON()).toMatchObject({ stars: 4 });
  await expect(rating).toBeHidden();
  await expect(toasts(page)).toContainText('Thanks — that helps.');
  const meta = await storedJson<IStoredMeta>(page, 'at.v1.meta');
  expect(meta?.ratingPrompt.action).toBe('rated');
  expect(meta?.ratingPrompt.stars).toBe(4);

  await runFiveMinutes();
  await expect.poll(async () => (await storedJson<IStoredMeta>(page, 'at.v1.meta'))?.sessionCount).toBe(6);
  // Well past RATING_DELAY_MS (2 s) on the fake clock: the prompt must not come back.
  await page.clock.runFor(3000);
  await page.waitForTimeout(500);
  await expect(rating).toBeHidden();
});

test('/pip mirrors the owning tab and its Stop reaches the owner', async ({ context, page }) => {
  await page.goto('/');
  await expect(pillText(page)).toHaveText('Screen awake', { timeout: 4000 });

  const pip = await context.newPage();
  await pip.goto('/pip');
  const root = pip.locator('#awaketab-pip');
  await expect(root.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 3000 });
  await expect(root.locator('[data-timer-digits]')).not.toHaveText('--:--:--', { timeout: 3000 });

  await root.locator('[data-pip-stop]').click();
  await expect(pillText(page)).toHaveText('Ready');
  await pip.close();
});

test('the /pip popup opens in the page language and mirrors the owner there', async ({ page }) => {
  // No Document PiP: P falls back to the popup (docs/05 §9).
  await page.addInitScript(() => {
    Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: undefined });
  });
  await page.goto('/es');
  await page.locator('[data-preset="p30"]').click();
  await expect(pillText(page)).toHaveText('Pantalla despierta', { timeout: 4000 });

  const [popup] = await Promise.all([page.waitForEvent('popup'), page.keyboard.press('p')]);
  await popup.waitForLoadState('domcontentloaded');
  expect(new URL(popup.url()).pathname).toBe('/es/pip');
  await expect(popup.locator('html')).toHaveAttribute('lang', 'es');
  const root = popup.locator('#awaketab-pip');
  await expect(root.locator('[data-pill-text]')).toHaveText('Pantalla despierta', { timeout: 3000 });
  await expect(root.locator('[data-pip-stop]')).toHaveText('Detener');
  await root.locator('[data-pip-stop]').click();
  await expect(pillText(page)).toHaveText('Listo');
  await popup.close();
});

test('/ja/pip renders in Japanese, noindex, with no cards or ads', async ({ page }) => {
  await page.goto('/ja/pip');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('[data-pill-text]')).toHaveText('準備完了');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u);
  await expect(page.locator('[data-sponsor], ins.adsbygoogle, [data-ad-slot]')).toHaveCount(0);
});

test('SponsorCard slots are not rendered, nor the config fetched, with PUBLIC_SPONSOR_ENABLED off', async ({ page }) => {
  const configRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/config/sponsor.json')) configRequests.push(req.url());
  });
  await page.goto('/?autostart=0');
  await expect(page.locator('dialog[data-dialog="extend"]')).toHaveCount(1);
  // Build flag off (the production default until G5): no reserved box anywhere, including the ExtendPrompt.
  await expect(page.locator('[data-sponsor]')).toHaveCount(0);
  await expect(page.locator('dialog[data-dialog="extend"] .at-sponsor')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  expect(configRequests).toEqual([]);
});

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });

  test('precached tool route works offline and says so', async ({ browserName, context, page }) => {
    test.skip(browserName !== 'chromium', 'service-worker offline replay is verified on Chromium');
    await page.goto('/?autostart=0');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    if (!(await page.evaluate(() => navigator.serviceWorker.controller !== null))) {
      await page.reload();
    }
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(async () => {
          for (const name of await caches.keys()) {
            if (await (await caches.open(name)).match('/30m', { ignoreSearch: true })) return true;
          }
          return false;
        }),
      )
      .toBe(true);

    await context.setOffline(true);
    await page.goto('/30m');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(pillText(page)).toHaveText('Screen awake', { timeout: 4000 });
    await expect(toasts(page)).toContainText("You're offline — the tool works, content pages may be unavailable.");
    await context.setOffline(false);
  });
});

test.describe('axe on M6 surfaces', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`ambient clock mode, ${theme}`, async ({ page }) => {
      await page.goto(`/?mode=clock&theme=${theme}`);
      await expect(ambient(page)).toHaveAttribute('data-mode', 'clock');
      await expect(ambient(page).locator('[data-clock]')).toHaveText(/\d{1,2}:\d{2}/u);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test(`stats dialog, ${theme}`, async ({ page }) => {
      await page.goto(`/?autostart=0&theme=${theme}`);
      await page.getByRole('button', { name: 'Stats', exact: true }).click();
      await expect(page.locator('dialog[data-dialog="stats"] tbody tr')).toHaveCount(7);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test(`settings dialog, ${theme}`, async ({ page }) => {
      await page.goto(`/?autostart=0&theme=${theme}`);
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await expect(page.locator('dialog[data-dialog="settings"]')).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test('content page scenario mode waits for a session instead of covering the article', async ({ page }) => {
  await page.goto('/for/cooking');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('dialog[data-ambient]')).toBeHidden();
  await page.locator('#awaketab-tool [data-chips] button[data-preset="pinf"]').click();
  await expect(page.locator('dialog[data-ambient]')).toBeVisible();
  await expect(page.locator('dialog[data-ambient]')).toHaveAttribute('data-mode', 'cook');
  await expect(page.locator('dialog[data-ambient] [data-pill-text]')).toHaveText('Screen awake');
});
