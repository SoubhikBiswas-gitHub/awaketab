import { activateLicense, deviceId, fetchActivations } from './license';
import { lookupCheckoutKey, normaliseLicenseKey } from './license-lookup';
import { applyLaunch, deviceLabel, fill, trackPro } from './pro-common';

/** API error code → the aside row (activate.astro) that carries its title, tone and copy (docs/09 §2.10). */
const ERR_ROW: Record<string, string> = {
  invalid_key: 'invalid_key',
  activation_limit: 'activation_limit',
  revoked: 'revoked',
  refunded: 'revoked',
  offline: 'offline',
  polar_unavailable: 'polar_unavailable',
  rate_limited: 'offline',
  bad_token: 'bad_token',
  bad_request: 'invalid_key',
};

/** The page states (`data-state` on the root). The last four use the checkout-return layout (Sys board). */
export type TActivateState = 'idle' | 'checking' | 'error' | 'success' | 'ext-success' | 'checkout-success' | 'cancelled' | 'failed' | 'help';
const CHECKOUT_STATES: readonly TActivateState[] = ['checkout-success', 'cancelled', 'failed', 'help'];

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
 * `/pro/activate` (docs/09 §2.3). Without `ext=1` the page activates THIS browser as a device and then says so on
 * the page ("Pro is active", O-26), never redirecting. With `ext=1` (the hand-off from AwakeTab for Chrome, docs/10
 * §5) it never activates anything: a pasted key is checked for shape client-side and a `checkout_id` is resolved
 * through the non-activating lookup (docs/09 §2.3a), then the copy panel shows the key so the extension performs
 * the single activation the purchase spends.
 *
 * Checkout return (O-26): `checkout_id` without `ext=1` auto-activates and lands on the checkout success page; an
 * unknown, expired or failed checkout (`invalid_key`) shows the failed page, and a purchase still syncing after
 * every retry shows the help page. `?checkout=cancelled|failed|help` opens those pages directly.
 */
export function bootActivatePage(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-activate]');
  const error = root.querySelector<HTMLElement>('[data-activate-error]');
  const extPanel = root.querySelector<HTMLElement>('[data-ext-panel]');
  const extKey = root.querySelector<HTMLInputElement>('[data-ext-key]');
  if (!form) return;
  applyLaunch(root);
  const params = new URLSearchParams(location.search);
  const checkoutId = params.get('checkout_id');
  const ext = params.get('ext') === '1';
  const input = form.querySelector<HTMLInputElement>('input[name="key"]');

  const setState = (state: TActivateState) => {
    root.dataset.state = state;
    const checkout = CHECKOUT_STATES.includes(state);
    for (const view of root.querySelectorAll<HTMLElement>('[data-view]')) view.hidden = (view.dataset.view === 'checkout') !== checkout;
    form.setAttribute('aria-busy', state === 'checking' ? 'true' : 'false');
    if (input) input.readOnly = state === 'checking';
  };

  // Copy that differs between the two modes is pre-rendered once per mode; the ext variants start hidden.
  if (ext) {
    root.dataset.ext = '';
    for (const node of root.querySelectorAll<HTMLElement>('[data-activate-mode="web"]')) node.hidden = true;
    for (const node of root.querySelectorAll<HTMLElement>('[data-activate-mode="ext"]')) node.hidden = false;
  }

  const clearError = () => {
    if (error) {
      error.hidden = true;
      delete error.dataset.code;
    }
    input?.removeAttribute('aria-invalid');
    for (const row of root.querySelectorAll('[data-code][aria-current]')) row.removeAttribute('aria-current');
  };

  let lastAttempt: (() => void) | null = null;

  // The error card takes its title, tone and text from the matching "If activation fails" row.
  const fail = (code: string) => {
    setState('error');
    if (!error) return;
    const rowCode = ERR_ROW[code] ?? 'invalid_key';
    const row = root.querySelector<HTMLElement>(`[data-title][data-code="${rowCode}"]`);
    for (const other of root.querySelectorAll('[data-code][aria-current]')) other.removeAttribute('aria-current');
    row?.setAttribute('aria-current', 'true');
    error.hidden = false;
    error.dataset.code = code;
    error.dataset.tone = row?.dataset.tone ?? 'bad';
    const copy = row?.querySelector('[data-err]');
    const target = error.querySelector<HTMLElement>('[data-activate-error-text]') ?? error;
    target.textContent = copy instanceof HTMLElement ? copy.textContent || code : code;
    const title = error.querySelector<HTMLElement>('[data-activate-error-title]');
    if (title) title.textContent = row?.dataset.title ?? '';
    const manage = error.querySelector<HTMLElement>('[data-err-manage]');
    if (manage) manage.hidden = rowCode !== 'activation_limit';
    input?.setAttribute('aria-invalid', 'true');
  };

  const showKey = (key: string) => {
    clearError();
    if (extKey) extKey.value = key;
    if (extPanel) extPanel.hidden = false;
    setState('ext-success');
  };

  const showSuccess = (key: string) => {
    const tail = root.querySelector<HTMLElement>('[data-ok-key]');
    if (tail) tail.textContent = fill(tail.dataset.tpl ?? '{tail}', { tail: keyTail(key) });
    setState('success');
  };

  /** `fromCheckout`: the automatic auto-fill after checkout, which waits out Polar's sync (F-08). */
  const activate = async (key?: string, fromCheckout = false) => {
    clearError();
    setState('checking');
    const payload: { deviceId: string; deviceLabel: string; key?: string; checkoutId?: string } = {
      deviceId: deviceId(),
      deviceLabel: deviceLabel() || 'This browser',
    };
    if (key) payload.key = key;
    if (checkoutId) payload.checkoutId = checkoutId;
    const result = fromCheckout
      ? await whileSyncing(() => activateLicense(payload), (code) => {
          fail(code);
          setState('checking');
        })
      : await activateLicense(payload);
    if (!result.ok) {
      if (fromCheckout && result.error === 'polar_unavailable') setState('help');
      else if (fromCheckout && result.error === 'invalid_key') setState('failed');
      else fail(result.error);
      return;
    }
    clearError();
    trackPro('pro_activated', { plan: result.plan }, '/pro/activate');
    if (fromCheckout && checkoutId) {
      void checkoutSuccess(root, checkoutId, result);
      setState('checkout-success');
    } else {
      showSuccess(key ?? '');
    }
  };

  const reset = () => {
    clearError();
    if (extPanel) extPanel.hidden = true;
    if (input) {
      input.value = '';
      input.focus();
    }
    setState('idle');
  };

  const direct = params.get('checkout');
  if (!ext && (direct === 'cancelled' || direct === 'failed' || direct === 'help')) {
    setState(direct);
  } else if (ext && checkoutId) {
    setState('checking');
    void whileSyncing(() => lookupCheckoutKey(checkoutId), (code) => {
      fail(code);
      setState('checking');
    }).then((result) => {
      if (result.ok) showKey(result.key);
      else fail(result.error);
    });
  } else if (checkoutId) {
    lastAttempt = () => void activate(undefined, true);
    lastAttempt();
  } else {
    setState('idle');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (root.dataset.state === 'checking') return;
    const raw = new FormData(form).get('key');
    const typed = typeof raw === 'string' ? raw : '';
    if (!ext) {
      lastAttempt = () => void activate(typed);
      lastAttempt();
      return;
    }
    const key = normaliseLicenseKey(typed);
    if (key) showKey(key);
    else fail('invalid_key');
  });

  // Typing a new key clears a shown error (board: setKey).
  input?.addEventListener('input', () => {
    if (root.dataset.state === 'error') {
      clearError();
      setState('idle');
    }
  });

  root.querySelector('[data-retry]')?.addEventListener('click', () => {
    if (lastAttempt) lastAttempt();
    else form.requestSubmit();
  });
  for (const button of root.querySelectorAll('[data-reset]')) button.addEventListener('click', reset);

  const copyButton = root.querySelector<HTMLElement>('[data-ext-copy]');
  copyButton?.addEventListener('click', () => {
    if (extKey?.value) void copyText(extKey.value, copyButton);
  });
}

/** "7F2Q": the last four characters of a key, as the receipt shows them. */
export function keyTail(key: string): string {
  return key.replace(/\s/gu, '').slice(-4).toUpperCase() || '····';
}

function copyText(text: string, button: HTMLElement): Promise<void> {
  return navigator.clipboard.writeText(text).then(
    () => {
      button.dataset.copied = '';
      setTimeout(() => {
        delete button.dataset.copied;
      }, 2000);
    },
    () => undefined,
  );
}

/**
 * Checkout success (Sys board, O-26): fill "Your purchase" from the activation, then look the key up (the
 * non-activating lookup, docs/09 §2.3a) for its last four characters and the "Show my key" panel, and count the
 * devices. Both extra requests are optional: a failure only leaves the row hidden.
 */
async function checkoutSuccess(root: HTMLElement, checkoutId: string, result: { token: string; plan: string; exp: number }): Promise<void> {
  const plan = root.querySelector<HTMLElement>('[data-co-plan]');
  const price = root.querySelector<HTMLElement>('[data-co-price]');
  const renews = root.querySelector<HTMLElement>('[data-co-renews]');
  const lifetime = result.plan === 'pro_lifetime';
  if (plan) plan.textContent = plan.getAttribute(`data-${result.plan}`) ?? plan.textContent;
  if (price) {
    const launchOff = root.dataset.launch === 'off';
    price.textContent = (lifetime && launchOff ? price.dataset.lifetimeAfter : price.getAttribute(`data-${result.plan}`)) ?? price.textContent;
  }
  if (renews) {
    // Yearly tokens carry a 7-day grace past the period end (docs/08 §2.4), so the renewal date is exp − 7 days.
    renews.textContent = lifetime ? (renews.dataset.never ?? '') : new Date((result.exp - 7 * 86_400) * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const showBtn = root.querySelector<HTMLButtonElement>('[data-co-show]');
  const panel = root.querySelector<HTMLElement>('[data-co-key-panel]');
  const keyInput = root.querySelector<HTMLInputElement>('[data-co-key]');
  const missing = root.querySelector<HTMLElement>('[data-co-key-missing]');
  let key: string | null = null;
  showBtn?.addEventListener('click', () => {
    const open = showBtn.getAttribute('aria-expanded') !== 'true';
    showBtn.setAttribute('aria-expanded', String(open));
    showBtn.textContent = (open ? showBtn.dataset.hide : showBtn.dataset.show) ?? showBtn.textContent;
    if (panel) panel.hidden = !open || !key;
    if (missing) missing.hidden = !open || Boolean(key);
  });
  const copy = root.querySelector<HTMLElement>('[data-co-copy]');
  copy?.addEventListener('click', () => {
    if (keyInput?.value) void copyText(keyInput.value, copy);
  });

  const [lookup, rows] = await Promise.all([
    lookupCheckoutKey(checkoutId),
    fetchActivations(result.token).catch(() => null),
  ]);
  if (lookup.ok) {
    key = lookup.key;
    if (keyInput) keyInput.value = key;
    const tail = root.querySelector<HTMLElement>('[data-co-tail]');
    const tailRow = root.querySelector<HTMLElement>('[data-co-tail-row]');
    if (tail && tailRow) {
      tail.textContent = fill(tail.dataset.tpl ?? '{tail}', { tail: keyTail(key) });
      tailRow.hidden = false;
    }
    if (showBtn?.getAttribute('aria-expanded') === 'true') {
      if (panel) panel.hidden = false;
      if (missing) missing.hidden = true;
    }
  }
  const count = rows && !rows.revoked && Array.isArray(rows.activations) ? rows.activations.length : 0;
  const devices = root.querySelector<HTMLElement>('[data-co-devices]');
  const devicesRow = root.querySelector<HTMLElement>('[data-co-devices-row]');
  if (count > 0 && devices && devicesRow) {
    devices.textContent = fill(devices.dataset.tpl ?? '{n}', { n: count });
    devicesRow.hidden = false;
  }
}
