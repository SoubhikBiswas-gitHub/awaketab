import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Frame, type Page } from '@playwright/test';

// M8 (E12) journeys: the embed widget in a real cross-origin iframe (journey 10), postMessage origin checks, the
// /embed and /kiosk landing pages, the /library demo on the published IIFE, and the kiosk `#lic=` hash.
//
// Cross-origin setup: the preview server answers on 127.0.0.1:4321 (the widget origin); the host page lives on
// http://localhost:4321 — a different origin that is still a secure context — and is served by page.route, so no
// test fixture ships in dist/. Chromium's Local Network Access checks would block a route-fulfilled document
// from reaching the loopback server, so they are disabled for this file only.
test.use({
  launchOptions: {
    args: [
      '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessSendPreflights,BlockInsecurePrivateNetworkRequests',
    ],
  },
});

const BASE = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4321');
const WIDGET = BASE.origin;
const HOST = `http://localhost:${BASE.port}`;

async function installPolicyAwareWakeLock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class FakeSentinel extends EventTarget {
      released = false;
      type = 'screen';
      release = async () => {
        this.released = true;
        this.dispatchEvent(new Event('release'));
      };
    }
    const d = document as Document & { featurePolicy?: { allowsFeature(f: string): boolean } };
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          if (d.featurePolicy && !d.featurePolicy.allowsFeature('screen-wake-lock')) {
            throw new DOMException(
              "Failed to execute 'request' on 'WakeLock': Access to Screen Wake Lock features is disallowed by permissions policy",
              'NotAllowedError',
            );
          }
          return new FakeSentinel();
        },
      },
    });
  });
}

async function hostPage(page: Page, body: string): Promise<void> {
  await page.route(`${HOST}/__host/**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>Recipe</title></head><body><h1>Recipe</h1>${body}</body></html>`,
    }),
  );
  await page.goto(`${HOST}/__host/recipe.html`);
}

async function widgetFrame(page: Page, match: (url: string) => boolean = () => true): Promise<Frame> {
  await expect
    .poll(() => page.frames().some((f) => f.url().startsWith(`${WIDGET}/embed/cook`) && match(f.url())))
    .toBe(true);
  const frame = page.frames().find((f) => f.url().startsWith(`${WIDGET}/embed/cook`) && match(f.url()));
  if (!frame) throw new Error('widget frame missing');
  await frame.waitForLoadState('load');
  return frame;
}

const loaderTag = (attrs = 'data-size="compact" data-lang="en"') =>
  `<script async src="${WIDGET}/embed.js" ${attrs}></script>`;

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installPolicyAwareWakeLock(page);
  // No Pages Functions behind `astro preview`: answer the licence lookup as an unlicensed domain by default.
  await page.route('**/api/embed/config**', (route) =>
    route.fulfill({
      headers: { 'access-control-allow-origin': '*' },
      json: { licensed: false, attribution: true, theme: null, expiresAt: null },
    }),
  );
  await page.route('**/api/e', (route) => route.fulfill({ json: { ok: true } }));
});

test('journey 10 loader → cross-origin iframe with allow holds the lock', async ({ page }) => {
  await hostPage(page, loaderTag());
  const iframe = page.locator('iframe[src*="/embed/cook"]');
  await expect(iframe).toHaveAttribute('allow', 'screen-wake-lock');
  await expect(iframe).toHaveAttribute('loading', 'lazy');
  await expect(iframe).toHaveAttribute('sandbox', /allow-scripts allow-same-origin allow-popups/u);
  await expect(iframe).toHaveAttribute('src', /host=localhost/u);
  await expect(page.locator(`script[src="${WIDGET}/embed.js"]`)).toHaveCount(0);

  // O-58: the compact box is reserved at 320 × 104 before the widget loads.
  await expect(iframe).toHaveCSS('height', '104px');
  await expect(iframe).toHaveCSS('width', '320px');

  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  await expect(frame.locator('[data-embed-notice]')).toBeHidden();
  await frame.getByRole('button', { name: 'Start' }).click();
  await expect(frame.locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(frame.getByRole('button', { name: 'Stop' })).toBeVisible();

  // O-47: the credit is a visible nofollow link in the host page, directly after the iframe, not in the frame.
  const credit = page.locator('iframe[src*="/embed/cook"] + .awaketab-credit a');
  await expect(credit).toBeVisible();
  await expect(credit).toHaveText('Keep awake by AwakeTab');
  await expect(credit).toHaveAttribute('href', 'https://awaketab.com/?ref=embed&source=embed');
  await expect(credit).toHaveAttribute('rel', 'nofollow');
  // Neutral on any site: it takes the host's font and colour.
  const [linkFont, bodyFont, linkColor, bodyColor] = await page.evaluate(() => {
    const a = document.querySelector('.awaketab-credit a') as HTMLElement;
    const s = getComputedStyle(a);
    const b = getComputedStyle(document.body);
    return [s.fontFamily, b.fontFamily, s.color, b.color];
  });
  expect(linkFont).toBe(bodyFont);
  expect(linkColor).toBe(bodyColor);
  await expect(frame.locator('a[href*="ref=embed"]')).toHaveCount(0);
});

test('the credit line reserves its box: nothing below the widget moves after load', async ({ page }) => {
  await hostPage(page, `${loaderTag()}<p id="after">Method</p>`);
  const before = await page.locator('#after').boundingBox();
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  await page.waitForTimeout(300);
  const after = await page.locator('#after').boundingBox();
  expect(after?.y).toBe(before?.y);
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveCSS('height', '104px');
});

test('journey 10 iframe without allow shows the "Ask the site owner" state', async ({ page, browserName }) => {
  // Only Chromium enforces (and exposes) the screen-wake-lock Permissions Policy in iframes. Firefox and WebKit
  // grant the lock without allow=, and the widget honestly reports it held, so there is no blocked state to show.
  test.skip(browserName !== 'chromium', 'engine does not enforce the screen-wake-lock iframe policy');
  await hostPage(
    page,
    `<iframe src="${WIDGET}/embed/cook?mode=cook&size=compact&lang=en" title="Keep screen awake" style="width:320px;height:120px;border:0"></iframe>`,
  );
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-embed-notice]')).toContainText('Ask the site owner');
  await expect(frame.locator('[data-embed-notice-link]')).toHaveAttribute('href', 'https://awaketab.com/embed#allow');
  await frame.getByRole('button', { name: 'Start' }).click();
  await expect(frame.locator('[data-pill-text]')).toHaveText("Blocked — here's the fix");
  await expect(frame.locator('[data-embed-notice]')).toContainText('Ask the site owner');
  await expect(frame.locator('[data-embed-digits]')).toHaveClass(/is-muted/u);
  await expect(frame.getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('AwakeTabEmbed API starts, reports state and stops the widget', async ({ page }) => {
  await hostPage(
    page,
    `${loaderTag()}<script>
      window.__states = [];
      addEventListener('load', () => {
        AwakeTabEmbed.on('state', (s) => window.__states.push(s.lock + '/' + s.status));
      });
    </script>`,
  );
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  await page.evaluate(() => {
    (window as unknown as { AwakeTabEmbed: { start(o: object): void } }).AwakeTabEmbed.start({ preset: 'p30' });
  });
  await expect(frame.locator('[data-pill-text]')).toHaveText('Screen awake');
  await expect(frame.locator('[data-embed-digits]')).toHaveText(/^(29:\d{2}|30:00)$/u);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __states: string[] }).__states))
    .toContain('held/active');
  await page.evaluate(() => {
    (window as unknown as { AwakeTabEmbed: { stop(): void } }).AwakeTabEmbed.stop();
  });
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
});

test('widget rejects commands whose origin does not match the declared host', async ({ page }) => {
  // host=evil.example does not match the real parent (localhost): the widget must ignore the page entirely.
  await hostPage(
    page,
    `<iframe id="w" src="${WIDGET}/embed/cook?mode=cook&size=compact&lang=en&host=evil.example" allow="screen-wake-lock" style="width:320px;height:104px"></iframe>`,
  );
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  await page.evaluate((origin) => {
    const w = document.querySelector<HTMLIFrameElement>('#w')?.contentWindow;
    w?.postMessage({ type: 'awaketab:start' }, origin);
    w?.postMessage({ type: 'awaketab:start' }, '*');
  }, WIDGET);
  await page.waitForTimeout(500);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
});

test('widget ignores commands from a window that is not its parent', async ({ page }) => {
  await hostPage(
    page,
    `<iframe id="w" src="${WIDGET}/embed/cook?mode=cook&size=compact&lang=en&host=localhost" allow="screen-wake-lock" style="width:320px;height:104px"></iframe>
     <iframe id="sibling" srcdoc="<p>sibling</p>"></iframe>`,
  );
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  // Same origin as the parent (srcdoc inherits it) but a different window: the message's source is the sibling
  // (the script runs in the sibling's realm), so the widget must drop it.
  await page.evaluate(() => {
    const sibling = document.querySelector<HTMLIFrameElement>('#sibling')?.contentWindow as
      (Window & typeof globalThis) | null;
    sibling?.eval("parent.document.querySelector('#w').contentWindow.postMessage({ type: 'awaketab:start' }, '*')");
  });
  await page.waitForTimeout(500);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  // The control: the real parent may start it.
  await page.evaluate(() => {
    document.querySelector<HTMLIFrameElement>('#w')?.contentWindow?.postMessage({ type: 'awaketab:start' }, '*');
  });
  await expect(frame.locator('[data-pill-text]')).toHaveText('Screen awake');
});

test('loader ignores forged widget messages from other windows', async ({ page }) => {
  await hostPage(
    page,
    `${loaderTag()}<script>
      window.__locks = [];
      addEventListener('load', () => AwakeTabEmbed.on('state', (s) => { window.__locks.push(s.lock); }));
    </script>`,
  );
  const frame = await widgetFrame(page);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Ready');
  const before = await page
    .locator('iframe[src*="/embed/cook"]')
    .evaluate((el) => (el as HTMLIFrameElement).style.height);
  await page.evaluate(() => {
    // Same-window forgeries: the source is not a widget frame the loader created.
    window.postMessage({ type: 'awaketab:resize', height: 600 }, '*');
    window.postMessage({ type: 'awaketab:state', lock: 'held', status: 'active', endsAt: null, mode: 'cook' }, '*');
  });
  await page.waitForTimeout(300);
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveCSS('height', before);
  // Only the widget's own (idle) state reports reached the page; the forged `held` did not.
  expect(await page.evaluate(() => (window as unknown as { __locks: string[] }).__locks)).not.toContain('held');
});

test('licensed domain gets no credit line and the brand colour on Start', async ({ page }) => {
  await page.route('**/api/embed/config**', (route) =>
    route.fulfill({
      // The loader asks cross-origin (host page → widget origin); the real function sends this header too.
      headers: { 'access-control-allow-origin': '*' },
      json: {
        licensed: true,
        attribution: false,
        theme: { accent: '#0f766e', scheme: 'auto' },
        expiresAt: Date.now() + 86_400_000,
      },
    }),
  );
  await hostPage(page, loaderTag());
  const frame = await widgetFrame(page);
  await expect(page.locator('.awaketab-credit')).toHaveCount(0);
  await expect(frame.locator('#awaketab-embed')).toHaveAttribute('style', /--at-embed-brand:\s*#0f766e/u);
});

test('a failed licence lookup keeps the credit line (free by default)', async ({ page }) => {
  await page.route('**/api/embed/config**', (route) => route.fulfill({ status: 503, body: 'down' }));
  await hostPage(page, loaderTag());
  await widgetFrame(page);
  await page.waitForTimeout(300);
  await expect(page.locator('.awaketab-credit a')).toBeVisible();
});

test('full size in cook mode offers kitchen timers and tap-to-pause keeps the lock', async ({ page }) => {
  await hostPage(page, loaderTag('data-size="full" data-lang="en"'));
  const frame = await widgetFrame(page);
  await frame.getByRole('button', { name: 'Add a 5-minute kitchen timer' }).click();
  await expect(frame.locator('[data-embed-timer]')).toHaveCount(1);
  await expect(frame.locator('[data-pill-text]')).toHaveText('Screen awake');
  await frame.locator('[data-embed-clock]').click();
  await expect(frame.locator('[data-embed-clock]')).toHaveAttribute('aria-pressed', 'true');
  await expect(frame.locator('[data-pill-text]')).toHaveText('Screen awake');
  const stored = await frame.evaluate(() => localStorage.getItem('at.v1.embed.settings'));
  expect(stored).toContain('"cookTimers":[{');
});

test('/embed shows the paste-ready snippet, the generator and live demos', async ({ page }) => {
  await page.goto('/embed');
  await expect(page.locator('[data-snippet]')).toHaveText(
    '<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>',
  );
  // One live widget on the placeholder recipe page (B6, board EmbedShowcase), remounted by the builder.
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveCount(1);
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveAttribute('src', /size=compact/u);
  // Size is a segmented bar of native radios now (was a <select>); language stays a <select>.
  await page.getByRole('radio', { name: 'Full width, 240 pixels tall' }).check({ force: true });
  await page.locator('select[name="lang"]').selectOption('de');
  await expect(page.locator('[data-snippet]')).toHaveText(
    '<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="full" data-lang="de"></script>',
  );
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveCount(1);
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveAttribute('src', /size=full/u);
  await expect(page.locator('iframe[src*="/embed/cook"]')).toHaveAttribute('src', /lang=de/u);
  await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
});

test('/kiosk builds a kiosk URL with the licence token in the hash', async ({ page }) => {
  await page.goto('/kiosk');
  await page.locator('input[name="msg"]').fill('Front desk');
  await page.locator('input[name="logo"]').fill('https://cdn.example.com/logo.png');
  await page.locator('input[name="token"]').fill('aaa.bbb.ccc');
  const url = await page.locator('[data-kiosk-url]').textContent();
  expect(url).toMatch(
    /\/\?autostart=1&mode=message&msg=Front\+desk&theme=dark&logo=https%3A%2F%2Fcdn\.example\.com%2Flogo\.png#lic=aaa\.bbb\.ccc$/u,
  );
});

test('an invalid #lic= token is stripped from the address bar and reported', async ({ page }) => {
  await page.goto('/?autostart=0#lic=aaaa.bbbb.cccc');
  await expect(page.locator('[data-toasts]')).toContainText('could not be verified');
  expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('at.v1.license'))).toBeNull();
});

test('/library demo drives the published IIFE through all seven states', async ({ page }) => {
  // Headless Chromium never settles play() on the inlined 1-frame fallback videos (no media pipeline), so the
  // media element is stubbed to "playing"; the library code under test (the published IIFE) runs unchanged.
  await page.addInitScript(() => {
    let playing = false;
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', { configurable: true, get: () => !playing });
    HTMLMediaElement.prototype.play = function play() {
      playing = true;
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      playing = false;
    };
  });
  await page.goto('/library');
  const current = page.locator('[data-demo-current]');
  await expect(page.locator('[data-state]')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Request' })).toBeEnabled();
  expect(await page.evaluate(() => typeof (window as unknown as { AwakeTabWake?: unknown }).AwakeTabWake)).toBe(
    'object',
  );

  // real (the test's fake navigator.wakeLock): idle → requesting → held → idle
  await expect(current).toHaveText('idle');
  await page.getByRole('button', { name: 'Request' }).click();
  await expect(current).toHaveText('held');
  await expect(page.locator('[data-demo-log]')).toContainText('requesting → held (acquired)');
  await page.getByRole('button', { name: 'Release' }).click();
  await expect(current).toHaveText('idle');

  // simulated device: hidden tab → lost → visible → held
  await page.locator('[data-demo-scenario]').selectOption('simulated');
  await page.getByRole('button', { name: 'Request' }).click();
  await expect(current).toHaveText('held');
  await page.getByRole('button', { name: 'Simulate tab hidden' }).click();
  await expect(current).toHaveText('lost');
  await page.getByRole('button', { name: 'Simulate tab visible' }).click();
  await expect(current).toHaveText('held');

  // the browser refuses (as Firefox does at 5 % battery or less) → denied, no known cause to name
  await page.locator('[data-demo-scenario]').selectOption('denied');
  await page.getByRole('button', { name: 'Request' }).click();
  await expect(current).toHaveText('denied');
  await expect(page.locator('[data-demo-advice]')).toHaveText('');

  // no API → unsupported; a click starts the real video fallback
  await page.locator('[data-demo-scenario]').selectOption('unsupported');
  await expect(current).toHaveText('unsupported');
  await page.getByRole('button', { name: 'Request' }).click();
  await expect(current).toHaveText('fallback');
});

test.describe('axe on M8 templates (docs/13 §6)', () => {
  // The landing pages embed live widgets; those iframes are scanned on their own page (/embed/cook) above, and two
  // identical widgets on one page would only report their duplicate `main` landmarks against each other.
  const violations = async (page: Page, excludeFrames = false) => {
    const builder = new AxeBuilder({ page });
    if (excludeFrames) builder.exclude('iframe');
    return (await builder.analyze()).violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} ${n.failureSummary ?? ''}`).join(', ')}`,
    );
  };

  for (const theme of ['light', 'dark'] as const) {
    test(`/embed/cook widget has no violations (${theme})`, async ({ page }) => {
      await page.goto(`/embed/cook?mode=cook&size=full&lang=en&theme=${theme}`);
      await expect(page.locator('[data-embed-timers]')).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  for (const route of ['/embed', '/kiosk', '/library']) {
    test(`${route} has no violations`, async ({ page }) => {
      await page.goto(route);
      if (route === '/library') {
        // The demo buttons are disabled until the IIFE loads; let the enable transition finish before sampling colours.
        await expect(page.getByRole('button', { name: 'Request' })).toBeEnabled();
        await page.waitForTimeout(400);
      }
      expect(await violations(page, true)).toEqual([]);
    });
  }
});

test('the published IIFE is served same-origin for the /library demo', async ({ page }) => {
  const res = await page.request.get('/library/awaketab-wake.iife.js');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('AwakeTabWake');
});
