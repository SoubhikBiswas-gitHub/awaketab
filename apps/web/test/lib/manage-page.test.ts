import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deactivateDevice, fetchActivations } from '../../src/lib/license';
import { bootManagePage, deviceIcon, lapseState } from '../../src/lib/manage-page';

// PRO_LAUNCH_END feeds the launch-price switch on the lapsed panel (pro-common.ts).
vi.mock('../../src/lib/license', () => ({
  fetchActivations: vi.fn(),
  deactivateDevice: vi.fn(),
  PRO_LAUNCH_END: Date.parse('2026-12-08T00:00:00.000Z'),
}));

const fetchRows = vi.mocked(fetchActivations);
const deactivate = vi.mocked(deactivateDevice);

const HERE_ID = 'dev-here';
const HERE_HASH = createHash('sha256').update(HERE_ID).digest('hex');
const FIRST = { label: 'Chrome · macOS', at: Date.UTC(2026, 8, 1), devHash: HERE_HASH };
const SECOND = { label: 'Edge · Windows', at: Date.UTC(2026, 8, 5), devHash: 'h2' };
const ROWS = [FIRST, SECOND];
const NOW = Date.UTC(2026, 8, 27);
const DAY_S = 86_400;

// Mirrors the hooks manage.astro renders (B7): a role=table of div rows cloned from <template data-device-row>,
// the 5-slot meter, the inline confirm and the lapse panel's date templates. (Before B7 the rows were shadcn <tr>s.)
function mount(withTemplate = true): HTMLElement {
  document.body.innerHTML = `
    <div data-manage-root data-state="loading">
      <span data-meter-label data-tpl="{n} of 5 devices" data-loading="Checking your devices…"></span>
      <span data-meter-left data-tpl="{n} activations left" data-one="1 activation left" data-none="No activations left"></span>
      <div role="meter" data-meter-bar aria-valuenow="0"><span></span><span></span><span></span><span></span><span></span></div>
      <span data-lapse-fill data-tpl="Pro stays on until {date}" id="grace-title"></span>
      <span data-lapse-fill data-tpl="Yearly · ended {ended}" id="ended-kicker"></span>
      <div role="status" data-manage-empty="" tabindex="-1" hidden>No licence on this device yet.</div>
      <div role="alert" data-manage-offline="" tabindex="-1" hidden>You're offline <button type="button" data-manage-retry>Retry</button></div>
      <div data-devices-wrap="" hidden>
        <div role="table"><div role="rowgroup" data-devices=""></div></div>
      </div>
      ${
        withTemplate
          ? `<template data-device-row><div role="row" class="at-pro-dev">
              <div role="cell"><span data-device-label></span><span data-device-here hidden>This device</span><span data-device-off hidden>Pro off</span></div>
              <div role="cell"><time data-device-at></time></div>
              <div role="cell"><button type="button" data-device-remove>Remove</button></div>
              <div role="cell" data-device-confirm hidden><span data-confirm-text></span><button type="button" data-keep>Keep</button><button type="button" data-confirm-remove>Remove device</button></div>
            </div></template>`
          : '<span hidden data-deactivate-label>Remove</span>'
      }
      <span hidden data-confirm-here>Remove this device?</span>
      <span hidden data-confirm-other data-tpl="Remove {label}?" data-aria="Remove {label}?"></span>
    </div>`;
  const root = document.querySelector<HTMLElement>('[data-manage-root]');
  if (!root) throw new Error('root missing');
  return root;
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};
const store = (record: Record<string, unknown> = {}) => {
  localStorage.setItem(
    'at.v1.license',
    JSON.stringify({ token: 'tok', plan: 'pro_lifetime', deviceId: HERE_ID, ...record }),
  );
};
const rowsOf = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-devices] > [role="row"]')];

describe('manage page', () => {
  afterEach(() => {
    fetchRows.mockReset();
    deactivate.mockReset();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('shows the empty state without a stored licence and never calls the API', () => {
    const root = mount();
    bootManagePage(root, NOW);
    expect(root.dataset.state).toBe('empty');
    expect(root.querySelector<HTMLElement>('[data-manage-empty]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
    expect(fetchRows).not.toHaveBeenCalled();
  });

  it('clones the template row per activation, marks this device and fills the meter', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    expect(fetchRows).toHaveBeenCalledWith('tok');
    expect(root.dataset.state).toBe('list');
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(false);
    const rows = rowsOf(root);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.className).toBe('at-pro-dev');
    expect(rows[0]?.querySelector('[data-device-label]')?.textContent).toBe('Chrome · macOS');
    expect(rows[0]?.querySelector<HTMLElement>('[data-device-here]')?.hidden).toBe(false);
    expect(rows[1]?.querySelector<HTMLElement>('[data-device-here]')?.hidden).toBe(true);
    const time = rows[1]?.querySelector('[data-device-at]');
    expect(time?.getAttribute('datetime')).toBe(new Date(SECOND.at).toISOString());
    expect(time?.textContent).toBe('5 September 2026');
    const btn = rows[1]?.querySelector<HTMLButtonElement>('[data-device-remove]');
    expect(btn?.textContent).toBe('Remove');
    expect(btn?.getAttribute('aria-describedby')).toBe(rows[1]?.querySelector('[data-device-label]')?.id);
    expect(root.querySelector('[data-meter-label]')?.textContent).toBe('2 of 5 devices');
    expect(root.querySelector('[data-meter-left]')?.textContent).toBe('3 activations left');
    expect(root.querySelector('[data-meter-bar]')?.getAttribute('aria-valuenow')).toBe('2');
    expect(root.querySelectorAll('[data-meter-bar] > [data-on]')).toHaveLength(2);
    // The template itself is untouched.
    expect(root.querySelector('template[data-device-row]')).not.toBeNull();
  });

  it('asks before removing a device, and Keep cancels', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    const row = rowsOf(root)[1];
    row?.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    expect(row?.hasAttribute('data-confirming')).toBe(true);
    expect(row?.querySelector('[data-confirm-text]')?.textContent).toBe('Remove Edge · Windows?');
    expect(deactivate).not.toHaveBeenCalled();
    row?.querySelector<HTMLButtonElement>('[data-keep]')?.click();
    expect(row?.hasAttribute('data-confirming')).toBe(false);
    expect(row?.querySelector<HTMLElement>('[data-device-confirm]')?.hidden).toBe(true);
  });

  it('removes a device after the confirm and repaints from the API response', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    deactivate.mockResolvedValue({ ok: true, activations: [FIRST] });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    const row = rowsOf(root)[1];
    row?.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    row?.querySelector<HTMLButtonElement>('[data-confirm-remove]')?.click();
    await flush();

    expect(deactivate).toHaveBeenCalledWith('tok', 'h2');
    const labels = rowsOf(root).map((el) => el.querySelector('[data-device-label]')?.textContent);
    expect(labels).toEqual(['Chrome · macOS']);
    expect(root.querySelector('[data-meter-left]')?.textContent).toBe('4 activations left');
    // Focus moves to the row now in the removed row's place (the last one here), not to <body>.
    expect(document.activeElement).toBe(rowsOf(root)[0]?.querySelector('[data-device-remove]'));
  });

  it('shows the loading state with the devices card while the list is on its way', () => {
    store();
    fetchRows.mockReturnValue(new Promise(() => undefined));
    const root = mount();
    bootManagePage(root, NOW);

    expect(root.dataset.state).toBe('loading');
    expect(root.querySelector('[data-meter-label]')?.textContent).toBe('Checking your devices…');
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(false);
  });

  it('removing this device clears its stored licence and shows the empty state', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    deactivate.mockResolvedValue({ ok: true, activations: [SECOND] });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    const row = rowsOf(root)[0];
    expect(row?.querySelector('[data-confirm-text]')?.textContent).toBe('Remove this device?');
    row?.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    row?.querySelector<HTMLButtonElement>('[data-confirm-remove]')?.click();
    await flush();

    expect(localStorage.getItem('at.v1.license')).toBeNull();
    expect(root.dataset.state).toBe('empty');
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('[data-manage-empty]'));
  });

  it('hides the table when the last device is removed', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: [SECOND] });
    deactivate.mockResolvedValue({ ok: true, activations: [] });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();
    rowsOf(root)[0]?.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    rowsOf(root)[0]?.querySelector<HTMLButtonElement>('[data-confirm-remove]')?.click();
    await flush();

    expect(rowsOf(root)).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
  });

  it('drops a revoked licence and shows the empty state', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: true, activations: [] });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    expect(localStorage.getItem('at.v1.license')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-manage-empty]')?.hidden).toBe(false);
  });

  it('a failed device list says offline with a retry, never an empty list', async () => {
    store();
    fetchRows.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    expect(root.dataset.state).toBe('offline');
    expect(root.querySelector<HTMLElement>('[data-manage-offline]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-manage-empty]')?.hidden).toBe(true);

    fetchRows.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    root.querySelector<HTMLButtonElement>('[data-manage-retry]')?.click();
    await flush();
    expect(document.activeElement).toBe(root.querySelector('[data-manage-offline]'));

    fetchRows.mockResolvedValueOnce({ revoked: false, activations: ROWS });
    root.querySelector<HTMLButtonElement>('[data-manage-retry]')?.click();
    await flush();
    expect(root.dataset.state).toBe('list');
    expect(root.querySelector<HTMLElement>('[data-manage-offline]')?.hidden).toBe(true);
    expect(rowsOf(root)).toHaveLength(2);
  });

  it('a removal that fails on the network re-enables the row', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    deactivate.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const root = mount();
    bootManagePage(root, NOW);
    await flush();

    const row = rowsOf(root)[1];
    row?.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    row?.querySelector<HTMLButtonElement>('[data-confirm-remove]')?.click();
    await flush();
    expect(rowsOf(root)).toHaveLength(2);
    for (const b of row?.querySelectorAll<HTMLButtonElement>('button') ?? []) expect(b.disabled).toBe(false);
  });

  it('falls back to bare rows with the same hooks when no template ships', async () => {
    store();
    fetchRows.mockResolvedValue({ revoked: false, activations: [FIRST] });
    const root = mount(false);
    bootManagePage(root, NOW);
    await flush();

    const row = rowsOf(root)[0];
    expect(row?.querySelector('[data-device-label]')?.textContent).toBe('Chrome · macOS');
    expect(row?.querySelector('[data-device-remove]')?.textContent).toBe('Remove');
  });

  it('a yearly licence inside its 7-day grace shows the renewal panel with its dates', async () => {
    const exp = Math.floor(NOW / 1000) + 6 * DAY_S;
    store({ plan: 'pro_yearly', exp });
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS, plan: 'pro_yearly', exp } as Awaited<
      ReturnType<typeof fetchActivations>
    >);
    const root = mount();
    bootManagePage(root, NOW);
    await flush();
    expect(root.dataset.state).toBe('grace');
    expect(root.querySelector('#grace-title')?.textContent).toBe('Pro stays on until 3 October 2026');
    expect(rowsOf(root)[0]?.querySelector<HTMLElement>('[data-device-off]')?.hidden).toBe(true);
  });

  it('a lapsed yearly licence keeps its devices listed with "Pro off"', async () => {
    const exp = Math.floor(NOW / 1000) - DAY_S;
    store({ plan: 'pro_yearly', exp });
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    const root = mount();
    bootManagePage(root, NOW);
    await flush();
    expect(root.dataset.state).toBe('lapsed');
    expect(root.querySelector('#ended-kicker')?.textContent).toBe('Yearly · ended 19 September 2026');
    expect(rowsOf(root).map((r) => r.querySelector<HTMLElement>('[data-device-off]')?.hidden)).toEqual([false, false]);
  });
});

describe('manage page helpers', () => {
  it('lapseState: only yearly plans, grace in the last 7 days of the token, lapsed after it', () => {
    const now = NOW;
    const s = Math.floor(now / 1000);
    expect(lapseState('pro_yearly', s + 30 * DAY_S, now)).toBeNull();
    expect(lapseState('pro_yearly', s + 3 * DAY_S, now)).toBe('grace');
    expect(lapseState('pro_yearly', s - 1, now)).toBe('lapsed');
    expect(lapseState('pro_lifetime', s - 1, now)).toBeNull();
    expect(lapseState('pro_yearly', undefined, now)).toBeNull();
  });

  it('deviceIcon picks the extension, tablet, phone or laptop glyph from the label', () => {
    expect(deviceIcon('AwakeTab for Chrome · macOS')).toBe('ext');
    expect(deviceIcon('Safari · iPadOS')).toBe('tablet');
    expect(deviceIcon('Chrome · Android')).toBe('phone');
    expect(deviceIcon('Edge · Windows')).toBe('laptop');
  });
});
