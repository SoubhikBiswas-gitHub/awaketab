import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('renders the accessible holding page', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'The tab that keeps your screen awake.',
    }),
  ).toBeVisible();
  await expect(page.getByText('Coming soon.')).toBeVisible();
  await expect(page).toHaveTitle('Keep Your Screen Awake — AwakeTab');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
