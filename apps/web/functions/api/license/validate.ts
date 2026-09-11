import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk } from '../../_lib/http';
import { parseSigningKey, verifyES256 } from '../../_lib/jwt';
import { PLAN_FEATURES, publicActivations, readLicense } from '../../_lib/license';
import { clientIp, rateLimit } from '../../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'license', await clientIp(request), 10))) return jsonError('rate_limited', 429);
  let token: string;
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token ?? '';
  } catch {
    return jsonError('bad_request', 400);
  }
  const kv = env.LICENSES;
  if (!kv || !env.LICENSE_SIGNING_KEY) return jsonError('polar_unavailable', 502);
  const priv = parseSigningKey(env.LICENSE_SIGNING_KEY);
  const pub: JsonWebKey = { kty: 'EC', crv: 'P-256', x: priv.x, y: priv.y };
  const claims = await verifyES256(token, pub, { allowExpired: true });
  if (!claims) return jsonError('bad_token', 401);
  const record = await readLicense(kv, claims.sub);
  if (!record || record.status === 'revoked' || record.status === 'refunded') {
    return jsonOk({ revoked: true });
  }
  return jsonOk({
    revoked: false,
    plan: record.plan,
    features: PLAN_FEATURES[record.plan],
    exp: record.exp,
    activations: publicActivations(record),
  });
};
