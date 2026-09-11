import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

test('renders the accessible home tool', async ({ page }) => {
  await installFakeWakeLock(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Keep your screen awake' })).toBeVisible();
  await expect(page).toHaveTitle('Keep Your Screen Awake — AwakeTab');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
