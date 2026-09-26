import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk, rateLimited } from '../../_lib/http';
import { parseSigningKey, publicJwk, verifyES256 } from '../../_lib/jwt';
import { PLAN_FEATURES, publicActivations, readLicense, writeLicense } from '../../_lib/license';
import { clientIp, rateLimit } from '../../_lib/ratelimit';
import { mintToken } from '../../_lib/token';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'license', await clientIp(request), 10))) return rateLimited();
  let token: string;
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token ?? '';
  } catch {
    return jsonError('bad_request', 400);
  }
  const kv = env.LICENSES;
  if (!kv || !env.LICENSE_SIGNING_KEY) return jsonError('polar_unavailable', 502);
  const pub = publicJwk(parseSigningKey(env.LICENSE_SIGNING_KEY));
  if (!pub) return jsonError('polar_unavailable', 502);
  const claims = await verifyES256(token, pub, { allowExpired: true });
  if (!claims) return jsonError('bad_token', 401);
  const record = await readLicense(kv, claims.sub);
  if (!record || record.status === 'revoked' || record.status === 'refunded') {
    return jsonOk({ revoked: true, reason: record?.status ?? 'revoked' });
  }
  // A device removed via /api/license/deactivate must not keep refreshing; otherwise the
  // activation limit could be bypassed by removing and re-adding devices.
  const entry = record.activations.find((row) => row.devHash === claims.dev);
  if (!entry) return jsonOk({ revoked: true, reason: 'deactivated' });
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);
  // `at` is the device's last-seen time; stale eviction (> 90 d) in activate relies on it.
  entry.at = now;
  record.updatedAt = now;
  await writeLicense(kv, claims.sub, record);
  const fresh = await mintToken(env, record, claims.sub, claims.dev, nowSec);
  return jsonOk({
    revoked: false,
    token: fresh.token,
    plan: record.plan,
    features: PLAN_FEATURES[record.plan],
    exp: fresh.exp,
    activations: publicActivations(record),
  });
};
