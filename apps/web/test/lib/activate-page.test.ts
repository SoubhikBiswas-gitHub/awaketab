import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bootActivatePage, CHECKOUT_RETRY_MS } from '../../src/lib/activate-page';
import { activateLicense, fetchActivations } from '../../src/lib/license';
import { lookupCheckoutKey } from '../../src/lib/license-lookup';
import type * as LicenseLookup from '../../src/lib/license-lookup';

// PRO_LAUNCH_END feeds the launch-price switch (pro-common.ts); fetchActivations counts devices on checkout success.
vi.mock('../../src/lib/license', () => ({
  activateLicense: vi.fn(),
  fetchActivations: vi.fn(() => Promise.resolve({ revoked: false, activations: [] })),
  deviceId: () => 'dev-0000',
  PRO_LAUNCH_END: Date.parse('2026-12-08T00:00:00.000Z'),
}));
// normaliseLicenseKey stays real: the ext hand-off validates the key shape client-side, with no request.
vi.mock('../../src/lib/license-lookup', async (importOriginal) => ({
  ...(await importOriginal<typeof LicenseLookup>()),
  lookupCheckoutKey: vi.fn(),
}));
vi.mock('../../src/lib/analytics.js', () => ({ track: vi.fn() }));
const { track } = await import('../../src/lib/analytics.js');

const activate = vi.mocked(activateLicense);
const lookup = vi.mocked(lookupCheckoutKey);
const fetchSpy = vi.fn(() => Promise.reject(new Error('no network in this test')));

// Mirrors the hooks activate.astro renders (B7): both views, the error card, the aside rows that carry each
// code's title, tone and copy, the success card, the extension panel and the checkout-return blocks.
function mount(): HTMLElement {
  document.body.innerHTML = `
    <div data-activate-root data-state="idle">
      <main data-view="activate">
        <p data-activate-mode="web">This device counts as one of five activations.</p>
        <p data-activate-mode="ext" hidden>This browser is not activated.</p>
        <form data-activate>
          <label for="license-key">Enter licence key</label>
          <input id="license-key" name="key" aria-describedby="activate-error" />
          <button type="submit">Activate</button>
        </form>
        <div role="alert" id="activate-error" data-activate-error="" hidden>
          <p><span data-activate-error-title></span></p>
          <p data-activate-error-text=""></p>
          <button type="button" data-retry>Retry</button>
          <a href="/pro/manage" data-err-manage hidden>Manage devices</a>
        </div>
        <div role="status" data-ok><p data-ok-key data-tpl="Key ending {tail}"></p><button type="button" data-reset>Use a different key</button></div>
        <div data-ext-panel="" hidden>
          <input data-ext-key="" readonly />
          <button type="button" data-ext-copy>Copy</button>
        </div>
        <ul>
          <li data-code="invalid_key" data-tone="bad" data-title="Activation didn't work"><code>invalid_key</code><span data-err="license.error.invalid">That key doesn't match a purchase.</span></li>
          <li data-code="activation_limit" data-tone="bad" data-title="All five devices are in use"><code>activation_limit</code><span data-err="license.error.limit">Already active on 5 devices.</span></li>
          <li data-code="polar_unavailable" data-tone="warn" data-title="Not ready yet"><code>polar_unavailable</code><span data-err="license.info.syncing">Still syncing.</span></li>
        </ul>
      </main>
      <main data-view="checkout" hidden>
        <dl>
          <dd data-co-plan data-pro_yearly="AwakeTab Pro, yearly" data-pro_lifetime="AwakeTab Pro, pay once"></dd>
          <dd data-co-price data-pro_yearly="$12 / year" data-pro_lifetime="$19 once" data-lifetime-after="$29 once"></dd>
          <dd data-co-renews data-never="No renewal"></dd>
          <div data-co-devices-row hidden><dd data-co-devices data-tpl="{n} of 5"></dd></div>
          <div data-co-tail-row hidden><dd data-co-tail data-tpl="ending {tail}"></dd></div>
        </dl>
        <button type="button" aria-expanded="false" data-co-show data-show="Show my key" data-hide="Hide my key">Show my key</button>
        <div data-co-key-panel hidden><input data-co-key readonly /></div>
      </main>
    </div>`;
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
    // B7: the card keeps its title, text and actions (was the shadcn alert's single child); the title and tone come
    // from the matching "If activation fails" row, which is marked current, and activation_limit offers Manage devices.
    expect(alert?.children).toHaveLength(4);
    expect(root.querySelector('[data-activate-error-title]')?.textContent).toBe('All five devices are in use');
    expect(alert?.dataset.tone).toBe('bad');
    expect(root.querySelector('li[data-code="activation_limit"]')?.getAttribute('aria-current')).toBe('true');
    expect(root.querySelector<HTMLElement>('[data-err-manage]')?.hidden).toBe(false);
    expect(root.dataset.state).toBe('error');
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
    activate.mockResolvedValue({ ok: false, error: 'invalid_key' });
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

  // F-08: Polar creates the licence key a few seconds after the checkout; auto-fill waits for it.
  describe('while Polar is still syncing the purchase', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout'] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    const waitAll = async () => {
      for (const ms of CHECKOUT_RETRY_MS) await vi.advanceTimersByTimeAsync(ms);
    };

    it('re-asks the lookup after each wait and shows the key once Polar has it (ext=1)', async () => {
      history.replaceState(null, '', '/pro/activate?ext=1&checkout_id=chk_1');
      lookup
        .mockResolvedValueOnce({ ok: false, error: 'polar_unavailable' })
        .mockResolvedValueOnce({ ok: false, error: 'polar_unavailable' })
        .mockResolvedValueOnce({ ok: true, key: 'ATAB-TEST-KEY-1234567890' });
      const root = mount();
      bootActivatePage(root);
      await vi.advanceTimersByTimeAsync(0);
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(alertBox(root)?.dataset.code).toBe('polar_unavailable');
      expect(alertBox(root)?.hidden).toBe(false);
      await waitAll();
      expect(lookup).toHaveBeenCalledTimes(3);
      expect(panel(root)?.hidden).toBe(false);
      expect(extKey(root)).toBe('ATAB-TEST-KEY-1234567890');
      expect(alertBox(root)?.hidden).toBe(true);
      expect(activate).not.toHaveBeenCalled();
    });

    it('re-asks the activation too, and gives up after the last wait', async () => {
      history.replaceState(null, '', '/pro/activate?checkout_id=chk_1');
      activate.mockResolvedValue({ ok: false, error: 'polar_unavailable' });
      const root = mount();
      bootActivatePage(root);
      await vi.advanceTimersByTimeAsync(0);
      await waitAll();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(activate).toHaveBeenCalledTimes(CHECKOUT_RETRY_MS.length + 1);
      expect(alertBox(root)?.dataset.code).toBe('polar_unavailable');
      expect(panel(root)?.hidden).toBe(true);
      // B7 (O-26): still syncing after every wait lands on the checkout help page ("Where is my licence key?").
      expect(root.dataset.state).toBe('help');
    });

    it('does not retry any other error, nor a key typed by hand', async () => {
      history.replaceState(null, '', '/pro/activate?checkout_id=chk_1');
      activate.mockResolvedValue({ ok: false, error: 'invalid_key' });
      const root = mount();
      bootActivatePage(root);
      await vi.advanceTimersByTimeAsync(0);
      activate.mockResolvedValue({ ok: false, error: 'polar_unavailable' });
      submit(root, 'ATAB-TEST-KEY-1234567890');
      await waitAll();
      expect(activate).toHaveBeenCalledTimes(2);
    });
  });

  // B7 / O-26: activation ends on the page ("Pro is active"), never with a redirect to /.
  describe('Pro is active and the checkout return', () => {
    const ok = { ok: true as const, token: 't', plan: 'pro_yearly' as const, features: [], exp: Math.floor(Date.UTC(2027, 8, 27) / 1000) + 7 * 86_400 };

    it('shows the success card with the key ending instead of leaving the page', async () => {
      activate.mockResolvedValue(ok);
      const root = mount();
      bootActivatePage(root);
      submit(root, 'ATAB-TEST-KEY-1234567F2Q');
      await flush();
      expect(root.dataset.state).toBe('success');
      expect(root.querySelector('[data-ok-key]')?.textContent).toBe('Key ending 7F2Q');
      expect(location.pathname).toBe('/pro/activate');
    });

    it('sends a readable device label, never a user-agent slice (C5)', async () => {
      activate.mockResolvedValue({ ok: false, error: 'invalid_key' });
      const root = mount();
      bootActivatePage(root);
      submit(root, 'ATAB-TEST-KEY-1234567890');
      await flush();
      const label = activate.mock.calls[0]?.[0].deviceLabel ?? '';
      expect(label).not.toContain('Mozilla');
      expect(label.length).toBeLessThanOrEqual(40);
    });

    it('after checkout, fills "Your purchase" from the activation, the key lookup and the device count', async () => {
      history.replaceState(null, '', '/pro/activate?checkout_id=chk_1');
      activate.mockResolvedValue(ok);
      lookup.mockResolvedValue({ ok: true, key: 'AWAKE-3C9D-81F0-7F2Q-ABCD' });
      vi.mocked(fetchActivations).mockResolvedValue({ revoked: false, activations: [{ label: 'a', at: 1, devHash: 'h' }, { label: 'b', at: 2, devHash: 'i' }] });
      const root = mount();
      bootActivatePage(root);
      await flush();
      await flush();
      expect(root.dataset.state).toBe('checkout-success');
      expect(root.querySelector<HTMLElement>('[data-view="checkout"]')?.hidden).toBe(false);
      expect(root.querySelector<HTMLElement>('[data-view="activate"]')?.hidden).toBe(true);
      expect(root.querySelector('[data-co-plan]')?.textContent).toBe('AwakeTab Pro, yearly');
      expect(root.querySelector('[data-co-price]')?.textContent).toBe('$12 / year');
      expect(root.querySelector('[data-co-renews]')?.textContent).toBe('27 September 2027');
      expect(root.querySelector('[data-co-devices]')?.textContent).toBe('2 of 5');
      expect(root.querySelector('[data-co-tail]')?.textContent).toBe('ending ABCD');
      // The lookup never activates: one activation, one lookup for the same checkout.
      expect(activate).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenCalledWith('chk_1');
      const show = root.querySelector<HTMLButtonElement>('[data-co-show]');
      show?.click();
      expect(show?.getAttribute('aria-expanded')).toBe('true');
      expect(root.querySelector<HTMLElement>('[data-co-key-panel]')?.hidden).toBe(false);
      expect(root.querySelector<HTMLInputElement>('[data-co-key]')?.value).toBe('AWAKE-3C9D-81F0-7F2Q-ABCD');
    });

    it('an unknown, expired or failed checkout shows the failed page', async () => {
      history.replaceState(null, '', '/pro/activate?checkout_id=chk_1');
      activate.mockResolvedValue({ ok: false, error: 'invalid_key' });
      const root = mount();
      bootActivatePage(root);
      await flush();
      expect(root.dataset.state).toBe('failed');
    });

    it('opens the cancelled, failed and help pages from ?checkout= without any request', () => {
      for (const state of ['cancelled', 'failed', 'help']) {
        history.replaceState(null, '', `/pro/activate?checkout=${state}`);
        const root = mount();
        bootActivatePage(root);
        expect(root.dataset.state).toBe(state);
      }
      expect(activate).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('honours the telemetry opt-out (O-43)', async () => {
      activate.mockResolvedValue(ok);
      localStorage.setItem('at.v1.settings', JSON.stringify({ telemetry: false }));
      let root = mount();
      bootActivatePage(root);
      submit(root, 'ATAB-TEST-KEY-1234567890');
      await flush();
      await flush();
      expect(track).not.toHaveBeenCalled();
      localStorage.removeItem('at.v1.settings');
      root = mount();
      bootActivatePage(root);
      submit(root, 'ATAB-TEST-KEY-1234567890');
      await flush();
      await flush();
      expect(track).toHaveBeenCalledWith('pro_activated', { plan: 'pro_yearly' }, expect.objectContaining({ telemetry: true, path: '/pro/activate' }));
    });
  });
});
