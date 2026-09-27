import type { TAdviceCode } from './types.js';

const IOS_RE = /iPhone|iPad|iPod/i;
const SAFARI_VER = /Version\/(\d+)(?:\.(\d+))?.*Safari/i;
const FIREFOX_VER = /Firefox\/(\d+)/i;

export function parseMajorMinor(ua: string, kind: 'safari' | 'firefox'): [number, number] | null {
  const re = kind === 'safari' ? SAFARI_VER : FIREFOX_VER;
  const m = re.exec(ua);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0)];
}

export function classifyDenial(
  err: unknown,
  ctx: { visible: boolean; secure: boolean; inIframe: boolean; ua: string },
): TAdviceCode {
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
  if (IOS_RE.test(ctx.ua)) return 'low_power_ios';
  return 'battery_saver';
}

export function isTransientAdvice(advice: TAdviceCode): boolean {
  return advice === 'hidden_document' || advice === 'battery_saver' || advice === 'low_power_ios';
}
