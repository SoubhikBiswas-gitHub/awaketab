import { activateLicense, deviceId } from './license';

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

export function bootActivatePage(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-activate]');
  const error = root.querySelector<HTMLElement>('[data-activate-error]');
  const extPanel = root.querySelector<HTMLElement>('[data-ext-panel]');
  const extKey = root.querySelector<HTMLInputElement>('[data-ext-key]');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const checkoutId = params.get('checkout_id');
  const ext = params.get('ext') === '1';
  const id = deviceId();
  const label = navigator.userAgent.slice(0, 40) || 'This browser';

  const input = form.querySelector<HTMLInputElement>('input[name="key"]');

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

  const run = async (key?: string) => {
    const payload: { deviceId: string; deviceLabel: string; key?: string; checkoutId?: string } = {
      deviceId: id,
      deviceLabel: label,
    };
    if (key) payload.key = key;
    if (checkoutId) payload.checkoutId = checkoutId;
    const result = await activateLicense(payload);
    if (!result.ok) {
      fail(result.error);
      return;
    }
    if (error) error.hidden = true;
    input?.removeAttribute('aria-invalid');
    void import('./analytics.js').then((mod) => {
      mod.track('pro_activated', { plan: result.plan }, { telemetry: true, source: ext ? 'ext' : 'web', locale: 'en', path: '/pro/activate' });
    });
    if (ext) {
      if (extPanel) extPanel.hidden = false;
      if (extKey) extKey.value = key ?? '';
      return;
    }
    location.assign('/');
  };

  if (checkoutId && !ext) void run();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = new FormData(form).get('key');
    const key = typeof raw === 'string' ? raw : '';
    void run(key);
  });

  root.querySelector('[data-ext-copy]')?.addEventListener('click', () => {
    if (extKey?.value) void navigator.clipboard.writeText(extKey.value);
  });
}
