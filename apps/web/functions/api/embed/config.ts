import type { IEnv } from '../../_lib/env';
import {
  candidateDomains,
  cleanTheme,
  FREE_EMBED_CONFIG as FREE,
  normalizeDomain,
  type IEmbedRecord,
} from '../../_lib/embed';
import { jsonOk } from '../../_lib/http';

// docs/09 §7.1, docs/11 §2 + §4: `GET /api/embed/config?domain=` → `{ licensed, attribution, theme, expiresAt }`,
// public and cached 5 minutes. The widget asks with the *verified* parent hostname (ancestorOrigins/referrer).

export const onRequestGet: PagesFunction<IEnv> = async (context) => {
  const headers = {
    'cache-control': 'public, max-age=300',
    'access-control-allow-origin': '*',
  };
  const domain = normalizeDomain(new URL(context.request.url).searchParams.get('domain') ?? '');
  const kv = context.env.LICENSES;
  if (!domain || !kv) return jsonOk(FREE, 200, headers);

  let record: IEmbedRecord | null = null;
  for (const candidate of candidateDomains(domain)) {
    const raw = await kv.get(`embed:${candidate}`);
    if (!raw) continue;
    try {
      record = JSON.parse(raw) as IEmbedRecord;
    } catch {
      record = null;
    }
    break;
  }
  if (!record) return jsonOk(FREE, 200, headers);

  // Expired (expiresAt already includes the grace period) → the attribution returns silently (docs/11 §4).
  const expiresAt = typeof record.expiresAt === 'number' ? record.expiresAt : null;
  if (expiresAt !== null && expiresAt <= Date.now()) return jsonOk(FREE, 200, headers);

  // A revoked or refunded key flips `lic:{keyHash}.status`; honour it here so the attribution returns within the
  // 5-minute cache window without waiting for the embed record to be cleaned up.
  if (record.keyHash) {
    const lic = await kv.get(`lic:${record.keyHash}`);
    if (lic) {
      try {
        const status = (JSON.parse(lic) as { status?: string }).status;
        if (status && status !== 'active') return jsonOk(FREE, 200, headers);
      } catch {
        return jsonOk(FREE, 200, headers);
      }
    }
  }

  return jsonOk(
    {
      licensed: true,
      attribution: record.attribution !== false,
      theme: cleanTheme(record.theme),
      expiresAt,
    },
    200,
    headers,
  );
};
