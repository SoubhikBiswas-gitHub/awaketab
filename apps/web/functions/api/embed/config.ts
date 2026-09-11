import type { IEnv } from '../../_lib/env';
import { jsonOk } from '../../_lib/http';

function normalizeDomain(raw: string): string {
  try {
    const host = raw.includes('://') ? new URL(raw).hostname : raw;
    return host.toLowerCase().replace(/^www\./u, '');
  } catch {
    return raw.toLowerCase().replace(/^www\./u, '');
  }
}

export const onRequestGet: PagesFunction<IEnv> = async (context) => {
  const domain = normalizeDomain(new URL(context.request.url).searchParams.get('domain') ?? '');
  const kv = context.env.LICENSES;
  const raw = domain && kv ? await kv.get(`embed:${domain}`) : null;
  const headers = {
    'cache-control': 'public, max-age=300',
    'access-control-allow-origin': '*',
  };
  if (!raw) {
    return jsonOk({ licensed: false, attribution: true, theme: 'auto', expiresAt: null }, 200, headers);
  }
  const cfg = JSON.parse(raw) as { attribution?: boolean; theme?: unknown; expiresAt?: number };
  return jsonOk(
    {
      licensed: true,
      attribution: cfg.attribution === false ? false : true,
      theme: cfg.theme ?? 'auto',
      expiresAt: cfg.expiresAt ?? null,
    },
    200,
    headers,
  );
};
