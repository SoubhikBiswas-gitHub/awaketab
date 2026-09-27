import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

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

  test('a full session with settings, theme and ambient changes stores nothing in cookies', async ({
    context,
    page,
  }) => {
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

test.describe('no third-party requests on tool routes (D-01)', () => {
  const external = (page: Page, baseURL: string | undefined, sink: string[]) => {
    const own = new URL(baseURL ?? 'http://127.0.0.1:4321').origin;
    page.on('request', (req) => {
      const url = new URL(req.url());
      if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== own) sink.push(req.url());
    });
  };

  for (const route of TOOL_ROUTES) {
    test(`${route} requests nothing from another origin`, async ({ baseURL, page }) => {
      const requests: string[] = [];
      external(page, baseURL, requests);
      await page.goto(route);
      await expect(page.locator('#awaketab-tool, #awaketab-pip').first()).toBeAttached();
      await page.waitForLoadState('networkidle');
      expect(requests).toEqual([]);
    });
  }

  test('fonts are self-hosted: every font request is same-origin under /fonts/ (D-R26)', async ({ baseURL, page }) => {
    const own = new URL(baseURL ?? 'http://127.0.0.1:4321').origin;
    const fonts: string[] = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'font') fonts.push(req.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const geistLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((face) => face.family.replace(/"/gu, '') === 'Geist' && face.status === 'loaded');
    });
    expect(geistLoaded).toBe(true);
    expect(fonts.length).toBeGreaterThan(0);
    for (const url of fonts) {
      const u = new URL(url);
      expect(u.origin, url).toBe(own);
      expect(u.pathname, url).toMatch(/^\/fonts\/[a-z0-9-]+\.woff2$/u);
    }
  });

  test('a started session with ambient and theme changes stays first-party', async ({ baseURL, page }) => {
    const requests: string[] = [];
    external(page, baseURL, requests);
    await page.goto('/');
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
    await page.keyboard.press('2');
    await page.keyboard.press('d');
    await page.keyboard.press('m');
    await expect(page.locator('dialog[data-ambient]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(requests).toEqual([]);
  });

  test('an unlicensed logo= URL loads no image and makes no request to its host', async ({ page }) => {
    const logoRequests: string[] = [];
    await page.route('https://cdn.example.com/**', async (route) => {
      logoRequests.push(route.request().url());
      await route.fulfill({ status: 204, body: '' });
    });
    await page.goto(`/?autostart=0&logo=${encodeURIComponent('https://cdn.example.com/logo.png')}`);
    await expect(page.locator('#awaketab-tool')).toBeAttached();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-kiosk-logo]')).toHaveCount(0);
    expect(logoRequests).toEqual([]);
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
    // Tool pages link the manifest after the first paint (src/tool/pwa.ts).
    await page.locator('link[rel="manifest"]').waitFor({ state: 'attached' });
    const cdp = await page.context().newCDPSession(page);
    const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
      installabilityErrors: Array<{ errorId: string }>;
    };
    expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
    const manifest = (await cdp.send('Page.getAppManifest')) as { url: string };
    expect(new URL(manifest.url).pathname).toBe('/es/manifest.webmanifest');
  });
});
