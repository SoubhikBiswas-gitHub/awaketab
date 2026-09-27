import type { TAdviceCode } from '@awaketab/wake';

interface IPolicyLike {
  allowsFeature(feature: string): boolean;
}

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

export function embedAdvice(advice: TAdviceCode | null, policy: boolean | null, ua: string): TAdviceCode | null {
  if (advice === 'iframe_no_allow' && policy === true)
    return /iPhone|iPad|iPod/u.test(ua) ? 'low_power_ios' : 'battery_saver';
  return advice;
}
