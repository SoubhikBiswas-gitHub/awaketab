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

// The frame is allowed, so an iframe_no_allow guess is wrong: the browser refused for another, unknown reason.
export function embedAdvice(advice: TAdviceCode | null, policy: boolean | null): TAdviceCode | null {
  return advice === 'iframe_no_allow' && policy === true ? null : advice;
}
