import { RATE_WINDOW_S } from './env';

export function jsonOk(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

export function jsonError(error: string, status: number, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status, headers: { 'cache-control': 'no-store' } });
}

/** 429 with `Retry-After` = seconds left in the current fixed rate-limit bucket (docs/09 §2.10). */
export function rateLimited(now = Date.now()): Response {
  const retryAfter = RATE_WINDOW_S - (Math.floor(now / 1000) % RATE_WINDOW_S);
  return Response.json(
    { error: 'rate_limited' },
    { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': String(retryAfter) } },
  );
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export const KEY_RE = /^[A-Z0-9-]{20,80}$/u;
// Polar checkout IDs are UUIDs; the looser shape still refuses anything that could reshape the upstream path.
const CHECKOUT_RE = /^[A-Za-z0-9_-]{1,80}$/u;

export function parseActivateBody(body: unknown): { key: string; deviceId: string; deviceLabel: string; checkoutId?: string } | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  const deviceId = typeof row.deviceId === 'string' ? row.deviceId : '';
  const deviceLabel =
    typeof row.deviceLabel === 'string'
      ? [...row.deviceLabel].filter((ch) => (ch.codePointAt(0) ?? 0) >= 32).join('').slice(0, 40)
      : '';
  const checkoutId = typeof row.checkoutId === 'string' ? row.checkoutId : undefined;
  const key = typeof row.key === 'string' ? row.key.trim().toUpperCase() : '';
  if (!UUID_V4.test(deviceId) || !deviceLabel) return null;
  if (checkoutId) return CHECKOUT_RE.test(checkoutId) ? { key, deviceId, deviceLabel, checkoutId } : null;
  if (!KEY_RE.test(key)) return null;
  return { key, deviceId, deviceLabel };
}

/**
 * `{ checkoutId, lookup: true }` — resolve a paid checkout to its licence key without activating a device
 * (docs/09 §2.3a: the `/pro/activate?ext=1&checkout_id=…` hand-off, so the extension spends the only activation).
 */
export function parseLookupBody(body: unknown): { checkoutId: string } | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  if (row.lookup !== true) return null;
  const checkoutId = typeof row.checkoutId === 'string' ? row.checkoutId : '';
  return CHECKOUT_RE.test(checkoutId) ? { checkoutId } : null;
}

export function isLookupBody(body: unknown): boolean {
  return !!body && typeof body === 'object' && 'lookup' in body;
}
