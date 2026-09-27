import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('/extension: store links record extension_click, no ad code, axe clean in both themes', async ({
  page,
  browserName,
}) => {
  const events: string[] = [];
  await page.route('**/api/e', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}') as { events?: Array<{ event: string }> };
    for (const row of body.events ?? []) events.push(row.event);
    await route.fulfill({ status: 204, body: '' });
  });
  // Store pages are third-party: never navigate there in the test.
  await page.route(/chromewebstore\.google\.com|microsoftedge\.microsoft\.com/u, (route) =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.goto('/extension');
  await expect(page.locator('h1')).toHaveText('AwakeTab for Chrome');
  const html = await page.content();
  expect(html).not.toMatch(/googlesyndication|adsbygoogle|data-ad-slot/u);
  await expect(page.locator('a[href="/on/firefox"]')).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute('data-theme', value);
    }, theme);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  const install = page.locator('[data-store="chrome"]');
  await expect(install).toHaveCount(2);
  if (browserName === 'firefox' || browserName === 'webkit') {
    // FR-EXT-05: no install button where the extension cannot exist.
    for (const link of await install.all()) await expect(link).toBeHidden();
    await expect(page.getByRole('link', { name: 'Open AwakeTab' }).first()).toBeVisible();
    return;
  }
  await install.first().click({ modifiers: ['ControlOrMeta'] });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => events).toContain('extension_click');
});
