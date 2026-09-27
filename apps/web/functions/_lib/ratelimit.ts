import { RATE_MAX, RATE_WINDOW_S, type IEnv } from './env';

export async function clientIp(request: Request): Promise<string> {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  );
}

export async function ipHash(env: IEnv, ip: string): Promise<string> {
  const salt = env.RATE_LIMIT_SALT ?? 'dev';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}${ip}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function rateLimit(env: IEnv, route: string, ip: string, max = RATE_MAX): Promise<boolean> {
  const kv = env.LICENSES;
  if (!kv) return true;
  const hash = await ipHash(env, ip);
  const bucket = Math.floor(Date.now() / 1000 / RATE_WINDOW_S);
  const key = `rl:${route}:${hash}:${bucket}`;
  const current = Number((await kv.get(key)) ?? '0');
  if (current >= max) return false;
  await kv.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_S * 2 });
  return true;
}
