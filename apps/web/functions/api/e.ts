import type { IEnv } from '../_lib/env';
import { mapEvent, parseBatch, writePoints } from '../_lib/events';
import { jsonError, jsonOk, rateLimited } from '../_lib/http';
import { clientIp, rateLimit } from '../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const ip = await clientIp(context.request);
  if (!(await rateLimit(context.env, 'e', ip))) return rateLimited();
  const parsed = await parseBatch(context.request);
  if (!parsed.ok) return jsonError(parsed.status === 413 ? 'too_large' : 'bad_request', parsed.status);
  const now = Date.now();
  const points = parsed.events
    .map((row) => mapEvent(row, now))
    .filter((point): point is NonNullable<typeof point> => point !== null);
  writePoints(context.env, points);
  return jsonOk({ ok: true, n: points.length });
};
