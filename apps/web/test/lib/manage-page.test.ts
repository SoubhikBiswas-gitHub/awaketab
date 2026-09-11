import { afterEach, describe, expect, it, vi } from 'vitest';

import { deactivateDevice, fetchActivations } from '../../src/lib/license';
import { bootManagePage } from '../../src/lib/manage-page';

vi.mock('../../src/lib/license', () => ({
  fetchActivations: vi.fn(),
  deactivateDevice: vi.fn(),
}));

const fetchRows = vi.mocked(fetchActivations);
const deactivate = vi.mocked(deactivateDevice);

const FIRST = { label: 'Chrome · Mac', at: Date.UTC(2026, 8, 1), devHash: 'h1' };
const SECOND = { label: 'Edge · Windows', at: Date.UTC(2026, 8, 5), devHash: 'h2' };
const ROWS = [FIRST, SECOND];

// Mirrors the hooks manage.astro renders with shadcn primitives at build time,
// including the <template> row prototype the script clones.
function mount(withTemplate = true): HTMLElement {
  document.body.innerHTML = `
    <main data-manage-root>
      <div role="status" data-manage-empty="" hidden>No licence on this device yet.</div>
      <div data-devices-wrap="" hidden>
        <table><tbody data-devices=""></tbody></table>
      </div>
      ${withTemplate ? '<template data-device-row></template>' : '<span hidden data-deactivate-label>Remove</span>'}
    </main>`;
  const root = document.querySelector<HTMLElement>('[data-manage-root]');
  if (!root) throw new Error('root missing');
  // happy-dom's parser drops <tr> outside a <table> even inside <template> (browsers keep it per the
  // HTML spec), so the prototype row is built with DOM APIs to mirror what the browser parses.
  const tpl = root.querySelector<HTMLTemplateElement>('template[data-device-row]');
  if (tpl) {
    const tr = document.createElement('tr');
    tr.className = 'border-b';
    tr.dataset.slot = 'table-row';
    const label = document.createElement('td');
    label.dataset.deviceLabel = '';
    label.className = 'p-2 font-medium';
    const atCell = document.createElement('td');
    const time = document.createElement('time');
    time.dataset.deviceAt = '';
    atCell.append(time);
    const actions = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bg-destructive min-h-11';
    btn.dataset.deviceRemove = '';
    btn.textContent = 'Remove';
    actions.append(btn);
    tr.append(label, atCell, actions);
    tpl.content.append(tr);
  }
  return root;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('manage page', () => {
  afterEach(() => {
    fetchRows.mockReset();
    deactivate.mockReset();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('shows the empty state without a stored licence and never calls the API', () => {
    const root = mount();
    bootManagePage(root);
    expect(root.querySelector<HTMLElement>('[data-manage-empty]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
    expect(fetchRows).not.toHaveBeenCalled();
  });

  it('clones the template row per activation, keeping shadcn classes and hooks', async () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ token: 'tok' }));
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    const root = mount();
    bootManagePage(root);
    await flush();

    expect(fetchRows).toHaveBeenCalledWith('tok');
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(false);
    const rows = root.querySelectorAll('[data-devices] > tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute('data-slot')).toBe('table-row');
    expect(rows[0]?.querySelector('[data-device-label]')?.textContent).toBe('Chrome · Mac');
    const time = rows[1]?.querySelector('[data-device-at]');
    expect(time?.getAttribute('datetime')).toBe(new Date(SECOND.at).toISOString());
    expect(time?.textContent).not.toBe('');
    const btn = rows[1]?.querySelector<HTMLButtonElement>('[data-device-remove]');
    expect(btn?.className).toContain('bg-destructive');
    expect(btn?.textContent).toBe('Remove');
    expect(btn?.getAttribute('aria-describedby')).toBe(rows[1]?.querySelector('[data-device-label]')?.id);
    // The template itself is untouched.
    expect(root.querySelector('template[data-device-row]')).not.toBeNull();
  });

  it('removes a device and repaints from the API response', async () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ token: 'tok' }));
    fetchRows.mockResolvedValue({ revoked: false, activations: ROWS });
    deactivate.mockResolvedValue({ ok: true, activations: [SECOND] });
    const root = mount();
    bootManagePage(root);
    await flush();

    root.querySelector<HTMLButtonElement>('[data-devices] > tr [data-device-remove]')?.click();
    await flush();

    expect(deactivate).toHaveBeenCalledWith('tok', 'h1');
    const labels = [...root.querySelectorAll('[data-device-label]')].map((el) => el.textContent);
    expect(labels).toEqual(['Edge · Windows']);
  });

  it('hides the table when the last device is removed', async () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ token: 'tok' }));
    fetchRows.mockResolvedValue({ revoked: false, activations: [FIRST] });
    deactivate.mockResolvedValue({ ok: true, activations: [] });
    const root = mount();
    bootManagePage(root);
    await flush();
    root.querySelector<HTMLButtonElement>('[data-device-remove]')?.click();
    await flush();

    expect(root.querySelectorAll('[data-devices] > tr')).toHaveLength(0);
    expect(root.querySelector<HTMLElement>('[data-devices-wrap]')?.hidden).toBe(true);
  });

  it('drops a revoked licence and shows the empty state', async () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ token: 'tok' }));
    fetchRows.mockResolvedValue({ revoked: true, activations: [] });
    const root = mount();
    bootManagePage(root);
    await flush();

    expect(localStorage.getItem('at.v1.license')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-manage-empty]')?.hidden).toBe(false);
  });

  it('falls back to bare rows with the same hooks when no template ships', async () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ token: 'tok' }));
    fetchRows.mockResolvedValue({ revoked: false, activations: [FIRST] });
    const root = mount(false);
    bootManagePage(root);
    await flush();

    const row = root.querySelector('[data-devices] > tr');
    expect(row?.querySelector('[data-device-label]')?.textContent).toBe('Chrome · Mac');
    expect(row?.querySelector('[data-device-remove]')?.textContent).toBe('Remove');
  });
});
