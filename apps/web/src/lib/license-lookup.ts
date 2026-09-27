// The `/pro/activate?ext=1` hand-off helpers (docs/09 §2.3a). Kept out of license.ts, whose chunk the tool page
// also loads lazily, so the tool's totalJs budget (docs/00 §11) never pays for a page-only flow.

export const LICENSE_KEY_RE = /^[A-Z0-9-]{20,80}$/u;

export function normaliseLicenseKey(raw: string): string | null {
  const key = raw.trim().toUpperCase();
  return LICENSE_KEY_RE.test(key) ? key : null;
}

export async function lookupCheckoutKey(
  checkoutId: string,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ checkoutId, lookup: true }),
    });
    const data = (await res.json()) as { error?: string; key?: string };
    const key = res.ok && typeof data.key === 'string' ? normaliseLicenseKey(data.key) : null;
    return key ? { ok: true, key } : { ok: false, error: data.error ?? 'invalid_key' };
  } catch {
    return { ok: false, error: 'offline' };
  }
}
