import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

// docs/06 §22: the checklist, tracked steps and code blocks are plain HTML; one small content-page script keeps
// their counters and buttons honest. Nothing is stored.
test('the cooking checklist counts what you tick', async ({ page }) => {
  await installFakeWakeLock(page);
  await page.goto('/for/cooking');
  const section = page.locator('section', { has: page.getByRole('heading', { name: 'Before a long cook' }) });
  await expect(section.locator('.at-count')).toHaveText('0 of 4 checked');
  await section.locator('label').first().click();
  await expect(section.getByRole('checkbox').first()).toBeChecked();
  await expect(section.locator('.at-count')).toHaveText('1 of 4 checked');
  await page.reload();
  await expect(section.locator('.at-count')).toHaveText('0 of 4 checked');
});

test('tracked guide steps mark progress and point at the next step', async ({ page }) => {
  await installFakeWakeLock(page);
  await page.goto('/guides/iphone-auto-lock-never-greyed-out');
  const first = page.locator('#step-1');
  const done = first.getByRole('checkbox', { name: 'Mark as done' });
  await expect(done).toBeVisible();
  await expect(first.locator('.at-next')).toBeVisible();
  await done.click();
  await expect(first.getByRole('checkbox', { name: 'Done' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#step-2 .at-next')).toBeVisible();
  await expect(page.locator('#s-steps, section:has(#step-1)').locator('.at-count').first()).toHaveText('1 of 4 done');
});

test('a code block copies its text without the line numbers', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only in Playwright');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await installFakeWakeLock(page);
  await page.goto('/learn/screen-wake-lock-api-guide');
  const copy = page.getByRole('button', { name: 'Copy stop.js' });
  await copy.click();
  await expect(copy).toContainText('Copied');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.split('\n')[0]).toBe('async function letScreenSleep() {');
});

test('structured article pages pass axe', async ({ page }) => {
  await installFakeWakeLock(page);
  for (const route of ['/for/cooking', '/on/iphone-safari', '/vs/caffeine', '/learn/screen-wake-lock-api-guide']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, route).toEqual([]);
  }
});
