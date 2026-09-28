import { describe, expect, it, vi } from 'vitest';
import { makeCtx } from './ctx-helper.js';

const showGallery = vi.fn(async () => undefined);
const showSound = vi.fn(async () => undefined);
const mountAppearance = vi.fn(async () => undefined);
vi.mock('../../src/tool/packs/faces/index.js', () => ({ showGallery }));
vi.mock('../../src/tool/packs/sound/index.js', () => ({ showSound }));
vi.mock('../../src/tool/packs/themes/appearance.js', () => ({ mountAppearance }));
vi.mock('../../src/tool/ui/dialog.js', () => ({
  openDialog: (d: HTMLDialogElement) => {
    d.setAttribute('open', '');
  },
}));

const { openCustomize } = await import('../../src/tool/packs/customize/index.js');

const TABS = ['face', 'look', 'sound'];
const html = `<dialog data-dialog="customize"><div class="at-cz">
  <div role="tablist">${TABS.map(
    (id, i) =>
      `<button role="tab" data-cz-tab="${id}" aria-selected="${String(i === 0)}" tabindex="${i ? '-1' : '0'}"></button>`,
  ).join('')}</div>
  <div class="at-cz-panes">
    <section data-cz-pane="face"></section>
    <section data-cz-pane="look" hidden><div data-appearance>
      ${['auto', 'light', 'dark', 'oled'].map((v) => `<input type="radio" name="cz-theme" value="${v}" />`).join('')}
    </div></section>
    <section data-cz-pane="sound" hidden></section>
  </div>
</div></dialog>`;

const flush = async () => {
  for (let i = 0; i < 6; i += 1) await new Promise((r) => setTimeout(r, 0));
};

describe('Customize sheet (Face · Look · Sound)', () => {
  it('opens on the asked tab, moves with the arrow keys, keeps the last tab and sets the theme', async () => {
    const { ctx } = makeCtx({ html });
    const d = ctx.root.querySelector('dialog') as HTMLDialogElement;
    const tab = (id: string) => d.querySelector(`[data-cz-tab="${id}"]`) as HTMLElement;
    const pane = (id: string) => d.querySelector(`[data-cz-pane="${id}"]`) as HTMLElement;

    openCustomize(ctx, 'sound');
    await flush();
    // The sheet waits for its own stylesheet before it shows.
    expect(d.hasAttribute('open')).toBe(false);
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="stylesheet"]:last-of-type');
    link?.onload?.(new Event('load'));
    await flush();
    expect(d.hasAttribute('open')).toBe(true);
    expect(tab('sound').getAttribute('aria-selected')).toBe('true');
    expect(tab('sound').tabIndex).toBe(0);
    expect(tab('face').tabIndex).toBe(-1);
    expect(pane('sound').hidden).toBe(false);
    expect(pane('face').hidden).toBe(true);
    expect(showSound).toHaveBeenCalledTimes(1);

    tab('sound').focus();
    tab('sound').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tab('face').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tab('face'));
    await flush();
    expect(showGallery).toHaveBeenCalledTimes(1);
    tab('face').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(tab('sound').getAttribute('aria-selected')).toBe('true');

    tab('look').click();
    await flush();
    expect(pane('look').hidden).toBe(false);
    expect(mountAppearance).toHaveBeenCalledTimes(1);
    expect(d.querySelector<HTMLInputElement>('input[value="auto"]')?.checked).toBe(true);
    const dark = d.querySelector<HTMLInputElement>('input[value="dark"]') as HTMLInputElement;
    dark.checked = true;
    dark.dispatchEvent(new Event('change', { bubbles: true }));
    expect(ctx.store.get().settings.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // Closed and opened again with no tab named, it shows the tab of this visit.
    d.removeAttribute('open');
    d.dispatchEvent(new Event('close'));
    openCustomize(ctx);
    await flush();
    expect(tab('look').getAttribute('aria-selected')).toBe('true');
  });
});
