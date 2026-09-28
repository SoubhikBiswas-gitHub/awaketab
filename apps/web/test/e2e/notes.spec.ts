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
  await expect(notes.locator('[data-notes-start]')).toBeVisible();

  await page.keyboard.type('# Plan');
  await page.keyboard.press('Enter');
  await page.keyboard.type('[ ] milk');
  await expect(doc.locator('h1')).toHaveText('Plan');
  await expect(doc.locator('li[data-checked] input[type="checkbox"]')).toHaveCount(1);
  await expect(notes.locator('[data-notes-start]')).toBeHidden();
  await expect(notes.locator('[data-notes-state]')).toHaveText('Saved');
  await expect(notes.locator('[data-notes-name]')).toHaveText('Plan');
  await expect(notes.locator('[data-notes-meta]')).toContainText('2 words');

  const mic = notes.locator('[data-notes-mic]');
  await expect(mic).toBeVisible();
  if (browserName === 'firefox') await expect(mic).toHaveAttribute('data-off', '');

  // Free: the ⋯ menu offers more notes with Pro as a small inline card, never a second note.
  await notes.locator('[data-notes-more]').click();
  await notes.locator('[data-notes-new-menu]').click();
  await expect(notes.locator('[data-notes-pro]')).toBeVisible();
  await expect(notes.locator('[data-notes-list]')).toBeHidden();

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
  await notes.locator('[data-notes-more]').click();
  await notes.locator('[data-notes-clear]').click();
  await expect(notes.locator('[data-notes-confirm]')).toBeVisible();
  await expect(notes.locator('[data-notes-confirm-no]')).toBeFocused();
  await notes.locator('[data-notes-confirm-yes]').click();
  await expect(notes.locator('.at-notes-doc')).not.toContainText('keep this');
  await notes.locator('[data-notes-undo]').click();
  await expect(notes.locator('.at-notes-doc')).toContainText('keep this');
});

test('the "/" menu inserts blocks, the selection menu formats, and a starter fills the page', async ({ page }) => {
  await installFakeWakeLock(page);
  await page.goto('/');
  await page.locator('#awaketab-tool[data-booted]').waitFor();
  await page.keyboard.press('n');
  const notes = page.locator('dialog[data-dialog="notes"]');
  const doc = notes.locator('.at-notes-doc');
  await expect(doc).toBeFocused();

  await notes.locator('[data-notes-tpl="todo"]').click();
  await expect(doc.locator('h1')).toHaveText('To-do for this session');
  await expect(doc.locator('li[data-checked]')).toHaveCount(1);
  await page.keyboard.type('Reply to Lena');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  const slash = notes.locator('[data-notes-slash]');
  await page.keyboard.type('/quo');
  await expect(slash).toBeVisible();
  await expect(slash.locator('[data-block="quote"]')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(slash).toBeHidden();
  await expect(doc.locator('blockquote')).toHaveCount(1);
  await page.keyboard.type('calm');

  // Esc closes the "/" menu first and leaves the drawer open.
  await page.keyboard.type(' /');
  await expect(slash).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(slash).toBeHidden();
  await expect(notes).toBeVisible();
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  await page.keyboard.down('Shift');
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  const bubble = notes.locator('[data-notes-bubble]');
  await expect(bubble).toBeVisible();
  await bubble.locator('[data-cmd="b"]').click();
  await expect(doc.locator('blockquote strong')).toHaveText('calm');
});
