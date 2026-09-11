import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bootActivatePage } from '../../src/lib/activate-page';
import { activateLicense } from '../../src/lib/license';

vi.mock('../../src/lib/license', () => ({
  activateLicense: vi.fn(),
  deviceId: () => 'dev-0000',
}));
vi.mock('../../src/lib/analytics.js', () => ({ track: vi.fn() }));

const activate = vi.mocked(activateLicense);

// Mirrors the hooks activate.astro renders with shadcn primitives at build time.
function mount(): HTMLElement {
  document.body.innerHTML = `
    <main data-activate-root>
      <form data-activate>
        <label for="license-key">Enter licence key</label>
        <input id="license-key" name="key" aria-describedby="activate-error" />
        <button type="submit">Activate</button>
      </form>
      <div role="alert" id="activate-error" data-activate-error="" hidden>
        <div data-activate-error-text=""></div>
      </div>
      <table><tbody>
        <tr><th scope="row">invalid_key</th><td data-err="license.error.invalid">That key doesn't match a purchase.</td></tr>
        <tr><th scope="row">activation_limit</th><td data-err="license.error.limit">Already active on 5 devices.</td></tr>
      </tbody></table>
      <div data-ext-panel="" hidden>
        <input data-ext-key="" readonly />
        <button type="button" data-ext-copy>Copy</button>
      </div>
    </main>`;
  const root = document.querySelector<HTMLElement>('[data-activate-root]');
  if (!root) throw new Error('root missing');
  return root;
}

function submit(root: HTMLElement, key: string): void {
  const input = root.querySelector<HTMLInputElement>('input[name="key"]');
  const form = root.querySelector<HTMLFormElement>('[data-activate]');
  if (!input || !form) throw new Error('form missing');
  input.value = key;
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('activate page', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/pro/activate');
  });
  afterEach(() => {
    activate.mockReset();
    document.body.innerHTML = '';
  });

  it('writes the mapped copy into the alert description and flags the input', async () => {
    activate.mockResolvedValue({ ok: false, error: 'activation_limit' });
    const root = mount();
    bootActivatePage(root);
    submit(root, 'ATAB-TEST-KEY-1234567890');
    await flush();

    const alert = root.querySelector<HTMLElement>('[data-activate-error]');
    expect(alert?.hidden).toBe(false);
    expect(alert?.dataset.code).toBe('activation_limit');
    expect(root.querySelector('[data-activate-error-text]')?.textContent).toBe('Already active on 5 devices.');
    // The wrapper keeps its own children (the shadcn grid), text goes to the description only.
    expect(alert?.children).toHaveLength(1);
    expect(root.querySelector('input[name="key"]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('falls back to the wrapper when no description node exists', async () => {
    activate.mockResolvedValue({ ok: false, error: 'nope' });
    const root = mount();
    root.querySelector('[data-activate-error-text]')?.remove();
    bootActivatePage(root);
    submit(root, 'ATAB-TEST-KEY-1234567890');
    await flush();

    expect(root.querySelector('[data-activate-error]')?.textContent).toBe("That key doesn't match a purchase.");
  });

  it('shows the ext copy panel with the key and clears a previous error', async () => {
    history.replaceState(null, '', '/pro/activate?ext=1');
    activate.mockResolvedValueOnce({ ok: false, error: 'invalid_key' });
    activate.mockResolvedValueOnce({
      ok: true,
      token: 'h.p.s',
      plan: 'pro_yearly',
      features: ['ambient.packs'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const root = mount();
    bootActivatePage(root);

    submit(root, 'ATAB-BAD-KEY-000000000000');
    await flush();
    expect(root.querySelector<HTMLElement>('[data-activate-error]')?.hidden).toBe(false);

    submit(root, 'ATAB-TEST-KEY-1234567890');
    await flush();
    expect(activate).toHaveBeenLastCalledWith({
      deviceId: 'dev-0000',
      deviceLabel: expect.any(String) as string,
      key: 'ATAB-TEST-KEY-1234567890',
    });
    expect(root.querySelector<HTMLElement>('[data-ext-panel]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLInputElement>('[data-ext-key]')?.value).toBe('ATAB-TEST-KEY-1234567890');
    expect(root.querySelector<HTMLElement>('[data-activate-error]')?.hidden).toBe(true);
    expect(root.querySelector('input[name="key"]')?.hasAttribute('aria-invalid')).toBe(false);
  });
});
