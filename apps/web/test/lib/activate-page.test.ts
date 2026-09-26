import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bootActivatePage } from '../../src/lib/activate-page';
import { activateLicense } from '../../src/lib/license';
import { lookupCheckoutKey } from '../../src/lib/license-lookup';
import type * as LicenseLookup from '../../src/lib/license-lookup';

vi.mock('../../src/lib/license', () => ({
  activateLicense: vi.fn(),
  deviceId: () => 'dev-0000',
}));
// normaliseLicenseKey stays real: the ext hand-off validates the key shape client-side, with no request.
vi.mock('../../src/lib/license-lookup', async (importOriginal) => ({
  ...(await importOriginal<typeof LicenseLookup>()),
  lookupCheckoutKey: vi.fn(),
}));
vi.mock('../../src/lib/analytics.js', () => ({ track: vi.fn() }));

const activate = vi.mocked(activateLicense);
const lookup = vi.mocked(lookupCheckoutKey);
const fetchSpy = vi.fn(() => Promise.reject(new Error('no network in this test')));

// Mirrors the hooks activate.astro renders with shadcn primitives at build time.
function mount(): HTMLElement {
  document.body.innerHTML = `
    <main data-activate-root>
      <p data-activate-mode="web">This device counts as one of five activations.</p>
      <p data-activate-mode="ext" hidden>This browser is not activated.</p>
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
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => {
    activate.mockReset();
    lookup.mockReset();
    fetchSpy.mockClear();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const panel = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-ext-panel]');
  const extKey = (root: HTMLElement) => root.querySelector<HTMLInputElement>('[data-ext-key]')?.value;
  const alertBox = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-activate-error]');

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

  it('activates this browser on submit without ext=1', async () => {
    activate.mockResolvedValue({ ok: false, error: 'invalid_key' });
    const root = mount();
    bootActivatePage(root);
    submit(root, 'ATAB-TEST-KEY-1234567890');
    await flush();
    expect(activate).toHaveBeenCalledWith({ deviceId: 'dev-0000', deviceLabel: expect.any(String) as string, key: 'ATAB-TEST-KEY-1234567890' });
    expect(panel(root)?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-activate-mode="web"]')?.hidden).toBe(false);
  });

  it('auto-activates from checkout_id without ext=1 and never uses the lookup', async () => {
    history.replaceState(null, '', '/pro/activate?checkout_id=chk_1');
    activate.mockResolvedValue({ ok: false, error: 'polar_unavailable' });
    const root = mount();
    bootActivatePage(root);
    await flush();
    expect(activate).toHaveBeenCalledWith({ deviceId: 'dev-0000', deviceLabel: expect.any(String) as string, checkoutId: 'chk_1' });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('with ext=1 validates the key client-side and shows the copy panel without activating', async () => {
    history.replaceState(null, '', '/pro/activate?ext=1');
    const root = mount();
    bootActivatePage(root);
    expect(root.querySelector<HTMLElement>('[data-activate-mode="web"]')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-activate-mode="ext"]')?.hidden).toBe(false);

    submit(root, 'not a key');
    await flush();
    expect(alertBox(root)?.hidden).toBe(false);
    expect(alertBox(root)?.dataset.code).toBe('invalid_key');
    expect(root.querySelector('input[name="key"]')?.getAttribute('aria-invalid')).toBe('true');
    expect(panel(root)?.hidden).toBe(true);

    submit(root, '  atab-test-key-1234567890 ');
    await flush();
    expect(panel(root)?.hidden).toBe(false);
    expect(extKey(root)).toBe('ATAB-TEST-KEY-1234567890');
    expect(alertBox(root)?.hidden).toBe(true);
    expect(root.querySelector('input[name="key"]')?.hasAttribute('aria-invalid')).toBe(false);

    // The extension performs the only activation: no activate call, no lookup, no request at all.
    expect(activate).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('with ext=1 resolves checkout_id through the non-activating lookup', async () => {
    history.replaceState(null, '', '/pro/activate?ext=1&checkout_id=chk_1');
    lookup.mockResolvedValue({ ok: true, key: 'ATAB-TEST-KEY-1234567890' });
    const root = mount();
    bootActivatePage(root);
    await flush();
    expect(lookup).toHaveBeenCalledWith('chk_1');
    expect(activate).not.toHaveBeenCalled();
    expect(panel(root)?.hidden).toBe(false);
    expect(extKey(root)).toBe('ATAB-TEST-KEY-1234567890');
  });

  it('with ext=1 falls back to the paste field when the lookup fails', async () => {
    history.replaceState(null, '', '/pro/activate?ext=1&checkout_id=chk_1');
    lookup.mockResolvedValue({ ok: false, error: 'invalid_key' });
    const root = mount();
    bootActivatePage(root);
    await flush();
    expect(panel(root)?.hidden).toBe(true);
    expect(alertBox(root)?.dataset.code).toBe('invalid_key');

    submit(root, 'ATAB-TEST-KEY-1234567890');
    await flush();
    expect(panel(root)?.hidden).toBe(false);
    expect(activate).not.toHaveBeenCalled();
  });
});
