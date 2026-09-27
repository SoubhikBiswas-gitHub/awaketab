import type { TAdviceCode } from './types.js';

const IOS_RE = /iPhone|iPad|iPod/i;
const SAFARI_VER = /Version\/(\d+)(?:\.(\d+))?.*Safari/i;
const FIREFOX_VER = /Firefox\/(\d+)/i;

function parseMajorMinor(ua: string, kind: 'safari' | 'firefox'): [number, number] | null {
  const re = kind === 'safari' ? SAFARI_VER : FIREFOX_VER;
  const m = re.exec(ua);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0)];
}

// null: the browser refused without a known cause. Battery savers and Low Power Mode never refuse a wake lock
// (Chromium and WebKit have no such check); on iOS the usual cause is Safari wanting a tap first.
export function classifyDenial(
  err: unknown,
  ctx: { visible: boolean; secure: boolean; inIframe: boolean; ua: string },
): TAdviceCode | null {
  const name = err instanceof Error ? err.name : '';
  const message = err instanceof Error ? err.message : '';

  if (!ctx.secure || name === 'SecurityError') return 'insecure_context';
  if (!ctx.visible) return 'hidden_document';
  if (ctx.inIframe || (/permissions policy|notallowed/i.test(message) && /iframe|policy/i.test(message))) {
    if (ctx.inIframe) return 'iframe_no_allow';
    if (/permissions policy/i.test(message)) return 'permissions_policy';
  }

  const safari = parseMajorMinor(ctx.ua, 'safari');
  if (IOS_RE.test(ctx.ua) && safari && (safari[0] < 16 || (safari[0] === 16 && safari[1] < 4))) {
    return 'ios_safari_old';
  }
  const firefox = parseMajorMinor(ctx.ua, 'firefox');
  if (firefox && firefox[0] < 126) return 'firefox_old';
  if (/permissions policy/i.test(message)) return 'permissions_policy';
  return null;
}

export function isTransientAdvice(advice: TAdviceCode | null): boolean {
  return advice === null || advice === 'hidden_document';
}
