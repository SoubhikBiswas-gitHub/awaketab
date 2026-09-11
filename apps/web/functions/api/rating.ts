import type { IEnv } from '../_lib/env';
import { jsonError, jsonOk } from '../_lib/http';
import { clientIp, rateLimit } from '../_lib/ratelimit';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  if (!(await rateLimit(env, 'rating', await clientIp(request), 10))) return jsonError('rate_limited', 429);
  let stars: number;
  let text: string;
  let locale: string;
  try {
    const body = (await request.json()) as { stars?: number; text?: string; locale?: string };
    stars = Number(body.stars);
    text = typeof body.text === 'string' ? body.text.slice(0, 500) : '';
    locale = typeof body.locale === 'string' ? body.locale.slice(0, 16) : 'en';
  } catch {
    return jsonError('bad_request', 400);
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return jsonError('bad_request', 400);
  const id = crypto.randomUUID();
  await env.LICENSES?.put(
    `rating:${id}`,
    JSON.stringify({ stars, text: text || undefined, locale, ver: env.CF_PAGES_COMMIT_SHA?.slice(0, 12) ?? 'dev', at: Date.now() }),
    { expirationTtl: 2 * 365 * 86_400 },
  );
  return jsonOk({ ok: true, id });
};
