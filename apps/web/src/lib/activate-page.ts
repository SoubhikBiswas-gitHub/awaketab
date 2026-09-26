import { activateLicense, deviceId } from './license';
import { lookupCheckoutKey, normaliseLicenseKey } from './license-lookup';

const ERR_KEY: Record<string, string> = {
  invalid_key: 'license.error.invalid',
  activation_limit: 'license.error.limit',
  revoked: 'license.error.revoked',
  refunded: 'license.error.revoked',
  offline: 'license.error.offline',
  polar_unavailable: 'license.info.syncing',
  rate_limited: 'license.error.offline',
  bad_token: 'license.error.token',
  bad_request: 'license.error.invalid',
};

/**
 * F-08 (docs/09 §2.3b): Polar creates the order, benefit grant and licence key a few seconds after the checkout
 * succeeds, so the auto-fill that runs right after the redirect is often answered `polar_unavailable` ("still
 * syncing", HTTP 503). It re-asks after each of these waits: about 21 s and 4 requests in all, well inside the 10
 * a minute that `/api/license/*` allows.
 */
export const CHECKOUT_RETRY_MS: readonly number[] = [3000, 6000, 12000];

async function whileSyncing<T extends { ok: boolean; error?: string }>(attempt: () => Promise<T>, onWait: (code: string) => void): Promise<T> {
  let result = await attempt();
  for (const ms of CHECKOUT_RETRY_MS) {
    if (result.ok || result.error !== 'polar_unavailable') break;
    onWait(result.error);
    await new Promise((resolve) => setTimeout(resolve, ms));
    result = await attempt();
  }
  return result;
}

/**
 * `/pro/activate` (docs/09 §2.3). Without `ext=1` the page activates THIS browser as a device. With `ext=1`
 * (the hand-off from AwakeTab for Chrome, docs/10 §5) it never activates anything: a pasted key is checked for
 * shape client-side and a `checkout_id` is resolved through the non-activating lookup (docs/09 §2.3a), then the
 * copy panel shows the key so the extension performs the single activation the purchase spends.
 */
export function bootActivatePage(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-activate]');
  const error = root.querySelector<HTMLElement>('[data-activate-error]');
  const extPanel = root.querySelector<HTMLElement>('[data-ext-panel]');
  const extKey = root.querySelector<HTMLInputElement>('[data-ext-key]');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const checkoutId = params.get('checkout_id');
  const ext = params.get('ext') === '1';

  const input = form.querySelector<HTMLInputElement>('input[name="key"]');

  // Copy that differs between the two modes is pre-rendered once per mode; the ext variants start hidden.
  if (ext) {
    for (const node of root.querySelectorAll<HTMLElement>('[data-activate-mode="web"]')) node.hidden = true;
    for (const node of root.querySelectorAll<HTMLElement>('[data-activate-mode="ext"]')) node.hidden = false;
  }

  // The page pre-renders a shadcn <Alert> (wrapper) with an <AlertDescription> (text target);
  // writing into the description keeps the alert's grid intact. Falls back to the wrapper.
  const fail = (code: string) => {
    if (!error) return;
    error.hidden = false;
    error.dataset.code = code;
    const key = ERR_KEY[code] ?? 'license.error.invalid';
    const copy = root.querySelector(`[data-err="${key}"]`);
    const target = error.querySelector<HTMLElement>('[data-activate-error-text]') ?? error;
    target.textContent = copy instanceof HTMLElement ? copy.textContent || code : code;
    input?.setAttribute('aria-invalid', 'true');
  };

  const clearError = () => {
    if (error) error.hidden = true;
    input?.removeAttribute('aria-invalid');
  };

  const showKey = (key: string) => {
    clearError();
    if (extKey) extKey.value = key;
    if (extPanel) extPanel.hidden = false;
  };

  /** `fromCheckout`: the automatic auto-fill after checkout, which waits out Polar's sync (F-08). */
  const activate = async (key?: string, fromCheckout = false) => {
    const payload: { deviceId: string; deviceLabel: string; key?: string; checkoutId?: string } = {
      deviceId: deviceId(),
      deviceLabel: navigator.userAgent.slice(0, 40) || 'This browser',
    };
    if (key) payload.key = key;
    if (checkoutId) payload.checkoutId = checkoutId;
    const result = fromCheckout ? await whileSyncing(() => activateLicense(payload), fail) : await activateLicense(payload);
    if (!result.ok) {
      fail(result.error);
      return;
    }
    clearError();
    void import('./analytics.js').then((mod) => {
      mod.track('pro_activated', { plan: result.plan }, { telemetry: true, source: 'web', locale: 'en', path: '/pro/activate' });
    });
    location.assign('/');
  };

  if (ext && checkoutId) {
    void whileSyncing(() => lookupCheckoutKey(checkoutId), fail).then((result) => {
      if (result.ok) showKey(result.key);
      else fail(result.error);
    });
  } else if (checkoutId) {
    void activate(undefined, true);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = new FormData(form).get('key');
    const typed = typeof raw === 'string' ? raw : '';
    if (!ext) {
      void activate(typed);
      return;
    }
    const key = normaliseLicenseKey(typed);
    if (key) showKey(key);
    else fail('invalid_key');
  });

  root.querySelector('[data-ext-copy]')?.addEventListener('click', () => {
    if (extKey?.value) void navigator.clipboard.writeText(extKey.value);
  });
}
