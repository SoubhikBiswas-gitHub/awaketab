export function jsonOk(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...extra } });
}

export function jsonError(error: string, status: number, extra: Record<string, unknown> = {}): Response {
  return Response.json({ error, ...extra }, { status, headers: { 'cache-control': 'no-store' } });
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const KEY_RE = /^[A-Z0-9-]{20,80}$/u;

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
  if (checkoutId) return { key, deviceId, deviceLabel, checkoutId };
  if (!KEY_RE.test(key)) return null;
  return { key, deviceId, deviceLabel };
}
