import type { TAdviceCode } from '@awaketab/wake';

interface IPolicyLike {
  allowsFeature(feature: string): boolean;
}

/**
 * Whether this document's Permissions-Policy lets it request a screen wake lock: `true`/`false` where the
 * browser exposes the policy (`document.permissionsPolicy`, or Chromium's `document.featurePolicy`), `null`
 * when it cannot be known (Safari, Firefox) — then only a rejected request tells.
 */
export function wakeLockPolicy(doc: Document): boolean | null {
  const d = doc as Document & { permissionsPolicy?: IPolicyLike; featurePolicy?: IPolicyLike };
  const policy = d.permissionsPolicy ?? d.featurePolicy;
  if (!policy || typeof policy.allowsFeature !== 'function') return null;
  try {
    return policy.allowsFeature('screen-wake-lock');
  } catch {
    return null;
  }
}

export function inIframe(win: Window): boolean {
  try {
    return win.self !== win.top;
  } catch {
    return true;
  }
}

/**
 * The library classifies every `NotAllowedError` inside an iframe as `iframe_no_allow` (it cannot see the
 * policy). The widget can: when the policy is known to allow the feature, a denial is the device's power
 * policy instead, and the reader needs that advice rather than "ask the site owner".
 */
export function embedAdvice(advice: TAdviceCode | null, policy: boolean | null, ua: string): TAdviceCode | null {
  if (advice === 'iframe_no_allow' && policy === true) return /iPhone|iPad|iPod/u.test(ua) ? 'low_power_ios' : 'battery_saver';
  return advice;
}
