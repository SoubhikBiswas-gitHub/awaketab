import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk, rateLimited } from '../../_lib/http';
import { parseSigningKey, publicJwk, verifyES256 } from '../../_lib/jwt';
import { decryptUtf8, publicActivations, readLicense, sha256Hex, writeLicense } from '../../_lib/license';
import { PolarError, createPolar } from '../../_lib/polar';
import { clientIp, rateLimit } from '../../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'license', await clientIp(request), 10))) return rateLimited();
  let token: string;
  let deviceId: string;
  try {
    const body = (await request.json()) as { token?: string; deviceId?: string };
    token = body.token ?? '';
    deviceId = body.deviceId ?? '';
  } catch {
    return jsonError('bad_request', 400);
  }
  const kv = env.LICENSES;
  const encKey = env.LICENSE_KEY_ENC_KEY;
  if (!kv || !encKey || !env.LICENSE_SIGNING_KEY) return jsonError('polar_unavailable', 502);
  const pub = publicJwk(parseSigningKey(env.LICENSE_SIGNING_KEY));
  if (!pub) return jsonError('polar_unavailable', 502);
  const claims = await verifyES256(token, pub, { allowExpired: true });
  if (!claims) return jsonError('bad_token', 401);
  const record = await readLicense(kv, claims.sub);
  if (!record) return jsonError('invalid_key', 404);
  const targetHash = await sha256Hex(deviceId);
  const entry = record.activations.find((row) => row.devHash === targetHash || row.devHash === deviceId);
  if (!entry) return jsonError('bad_request', 400);
  if (entry.polarActivationId) {
    try {
      const key = await decryptUtf8(record.keyEnc, encKey);
      await createPolar(env).deactivate(key, entry.polarActivationId);
    } catch (err) {
      if (err instanceof PolarError && err.code === 'polar_unavailable') return jsonError('polar_unavailable', 502);
    }
  }
  record.activations = record.activations.filter((row) => row !== entry);
  record.updatedAt = Date.now();
  await writeLicense(kv, claims.sub, record);
  return jsonOk({ ok: true, activations: publicActivations(record) });
};
