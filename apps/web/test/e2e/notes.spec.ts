import { expect, test } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

test.use({ viewport: { width: 1280, height: 800 } });

test('N opens the notes drawer, Markdown typing formats, text survives a reload', async ({ page, browserName }) => {
  await installFakeWakeLock(page);
  await page.goto('/');
  await page.locator('#awaketab-tool[data-booted]').waitFor();

  const notes = page.locator('dialog[data-dialog="notes"]');
  await page.keyboard.press('n');
  await expect(notes).toBeVisible();
  const doc = notes.locator('.at-notes-doc');
  await expect(doc).toBeFocused();

  await page.keyboard.type('# Plan');
  await page.keyboard.press('Enter');
  await page.keyboard.type('[ ] milk');
  await expect(doc.locator('h1')).toHaveText('Plan');
  await expect(doc.locator('li[data-checked] input[type="checkbox"]')).toHaveCount(1);
  await expect(notes.locator('[data-notes-state]')).toContainText(/Saved at/u);
  await expect(notes.locator('[data-notes-words]')).toHaveText('2 words');

  const mic = notes.locator('[data-notes-mic]');
  if (browserName === 'firefox') await expect(mic).toBeHidden();

  // Free: a second note offers the preview instead of opening one.
  await notes.locator('[data-notes-new]').click();
  await expect(notes.locator('[data-notes-pro]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();

  await page.reload();
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.keyboard.press('n');
  await expect(notes.locator('.at-notes-doc h1')).toHaveText('Plan');
});

test('Clear asks inline first and can be undone', async ({ page }) => {
  await installFakeWakeLock(page);
  await page.goto('/');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.keyboard.press('n');
  const notes = page.locator('dialog[data-dialog="notes"]');
  await page.keyboard.type('keep this');
  await notes.locator('[data-notes-clear]').click();
  await expect(notes.locator('[data-notes-confirm]')).toBeVisible();
  await notes.locator('[data-notes-confirm-yes]').click();
  await expect(notes.locator('.at-notes-doc')).not.toContainText('keep this');
  await notes.locator('[data-notes-undo]').click();
  await expect(notes.locator('.at-notes-doc')).toContainText('keep this');
});
