import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

/*
 * Privacy and install checks from docs/17 §2 and docs/19 §E that need a browser:
 * - no cookie is ever set on a tool route (docs/08 §1: "No cookies"), including after a full session with
 *   settings, theme and ambient changes — asserted on the context jar and document.cookie;
 * - the PWA is installable (Lighthouse 12 dropped its PWA category, so Chromium's own installability check
 *   is asserted instead).
 * Run against a deployed preview with PLAYWRIGHT_BASE_URL to cover what the edge adds (e.g. bot cookies).
 */

const TOOL_ROUTES = [
  '/',
  '/15m',
  '/30m',
  '/45m',
  '/1h',
  '/2h',
  '/4h',
  '/8h',
  '/until/17-30',
  '/pip',
  '/es/',
  '/ja/',
  '/es/pip',
];

async function expectNoCookies(context: BrowserContext, page: Page, where: string): Promise<void> {
  expect(await context.cookies(), `cookie jar after ${where}`).toEqual([]);
  expect(await page.evaluate(() => document.cookie), `document.cookie on ${where}`).toBe('');
}

test.beforeEach(async ({ page }) => {
  await installFakeWakeLock(page);
});

test.describe('no cookies on tool routes', () => {
  for (const route of TOOL_ROUTES) {
    test(`${route} sets no cookie`, async ({ context, page }) => {
      const setCookie: string[] = [];
      page.on('response', (res) => {
        const header = res.headers()['set-cookie'];
        if (header) setCookie.push(`${res.url()}: ${header}`);
      });
      await page.goto(route);
      await expect(page.locator('#awaketab-tool, #awaketab-pip').first()).toBeAttached();
      await page.waitForLoadState('networkidle');
      expect(setCookie).toEqual([]);
      await expectNoCookies(context, page, route);
    });
  }

  test('a full session with settings, theme and ambient changes stores nothing in cookies', async ({ context, page }) => {
    await page.goto('/');
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
    await page.keyboard.press('2');
    await page.keyboard.press('d');
    await page.keyboard.press('m');
    await expect(page.locator('dialog[data-ambient]')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('#awaketab-tool header [data-open-settings]').click();
    await page.locator('dialog[data-dialog="settings"] input[name="showSeconds"]').check();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expectNoCookies(context, page, 'a full session');
    // State lives in the documented localStorage keys only (docs/08 §2).
    const keys = await page.evaluate(() => Object.keys(localStorage).sort());
    for (const key of keys) expect(key).toMatch(/^at\.v1\.(settings|session|stats|license|meta|onboarding)$/u);
  });
});

test.describe('PWA', () => {
  test.use({ serviceWorkers: 'allow' });

  test('home is installable (Chromium installability check)', async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'Page.getInstallabilityErrors is a Chromium DevTools Protocol command');
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: Array<{ errorId: string }>;
    };
    expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
    const manifest = (await cdp.send('Page.getAppManifest')) as { errors: unknown[]; url: string };
    expect(manifest.errors).toEqual([]);
    expect(new URL(manifest.url).pathname).toBe('/manifest.webmanifest');
  });

  test('each locale home links its own installable manifest', async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'Page.getInstallabilityErrors is a Chromium DevTools Protocol command');
    await page.goto('/es/');
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: Array<{ errorId: string }>;
    };
    expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
    const manifest = (await cdp.send('Page.getAppManifest')) as { url: string };
    expect(new URL(manifest.url).pathname).toBe('/es/manifest.webmanifest');
  });
});
