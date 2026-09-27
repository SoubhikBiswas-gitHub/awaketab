import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDialog } from '../../src/tool/ui/dialog.js';
import { dialogSettled } from './ctx-helper.js';

// The controller waits for tool-more.css; happy-dom never loads the stylesheet.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));

// Mirrors the markup components/ui/Dialog.astro renders.
const sheet = (name: string) => `
  <dialog class="at-dialog" data-dialog="${name}" data-side="end" aria-labelledby="${name}-t">
    <div class="at-dialog-header"><h2 id="${name}-t">${name}</h2>
      <button type="button" data-dialog-close aria-label="Close">×</button></div>
    <div class="at-dialog-body"><button type="button" data-inner>Inner</button></div>
  </dialog>`;

describe('openDialog (components/ui/Dialog.astro)', () => {
  beforeEach(() => {
    document.body.innerHTML = `<button type="button" data-open-settings>Settings</button>${sheet('settings')}${sheet('stats')}`;
  });
  const dlg = (name: string) => document.querySelector(`[data-dialog="${name}"]`) as HTMLDialogElement;
  const btn = (sel: string) => document.querySelector(sel) as HTMLButtonElement;

  it('opens only once the stylesheet is in', async () => {
    const d = dlg('settings');
    openDialog(d, btn('[data-open-settings]'));
    expect(d.open).toBe(false);
    await dialogSettled();
    expect(d.open).toBe(true);
  });

  it('the Close button and a click on the backdrop close it; focus returns to the opener', async () => {
    const d = dlg('settings');
    const opener = btn('[data-open-settings]');
    openDialog(d, opener);
    await dialogSettled();
    btn('[data-dialog="settings"] [data-inner]').click();
    expect(d.open).toBe(true);
    btn('[data-dialog="settings"] [data-dialog-close]').click();
    expect(d.open).toBe(false);
    expect(document.activeElement).toBe(opener);

    openDialog(d, opener);
    await dialogSettled();
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(d.open).toBe(false);
  });

  it('one layer at a time: a sheet opened from another takes its place', async () => {
    const settings = dlg('settings');
    const stats = dlg('stats');
    openDialog(settings, btn('[data-open-settings]'));
    await dialogSettled();
    openDialog(stats, btn('[data-dialog="settings"] [data-inner]'));
    await dialogSettled();
    expect(settings.open).toBe(false);
    expect(stats.open).toBe(true);
  });
});
