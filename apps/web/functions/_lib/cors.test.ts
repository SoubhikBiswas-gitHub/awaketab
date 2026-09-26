import { describe, expect, it } from 'vitest';
import { onRequest } from '../api/_middleware';
import { extensionCorsHeaders, isExtensionOrigin, preflight } from './cors';

const EXT = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';

function req(path: string, method: string, origin?: string): Request {
  return new Request(`https://awaketab.com${path}`, { method, headers: origin ? { origin } : {} });
}

async function run(request: Request, body = Response.json({ ok: true })) {
  return (onRequest as unknown as (ctx: { request: Request; next: () => Promise<Response> }) => Promise<Response>)({
    request,
    next: () => Promise.resolve(body),
  });
}

describe('extension CORS on /api', () => {
  it('recognises only chrome-extension ids', () => {
    expect(isExtensionOrigin(EXT)).toBe(true);
    expect(isExtensionOrigin('https://evil.example')).toBe(false);
    expect(isExtensionOrigin('chrome-extension://short')).toBe(false);
    expect(isExtensionOrigin('moz-extension://abcdefghijklmnopabcdefghijklmnop')).toBe(false);
    expect(isExtensionOrigin(null)).toBe(false);
  });

  it('answers the preflight for the licence and telemetry routes only', async () => {
    const ok = preflight(req('/api/license/activate', 'OPTIONS', EXT));
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe(EXT);
    expect(ok.headers.get('access-control-allow-headers')).toBe('content-type');
    expect(ok.headers.get('access-control-allow-credentials')).toBeNull();
    expect(preflight(req('/api/webhooks/polar', 'OPTIONS', EXT)).status).toBe(403);
    expect(preflight(req('/api/e', 'OPTIONS', 'https://evil.example')).status).toBe(403);
    expect((await run(req('/api/e', 'OPTIONS', EXT))).status).toBe(204);
  });

  it('adds the allow-origin header to extension responses and leaves same-origin responses alone', async () => {
    const ext = await run(req('/api/license/validate', 'POST', EXT));
    expect(ext.headers.get('access-control-allow-origin')).toBe(EXT);
    expect(ext.headers.get('vary')).toBe('Origin');
    expect(await ext.json()).toEqual({ ok: true });
    const site = await run(req('/api/license/validate', 'POST'));
    expect(site.headers.get('access-control-allow-origin')).toBeNull();
    const other = await run(req('/api/rating', 'POST', EXT));
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
    expect(extensionCorsHeaders(req('/api/embed/config', 'GET', EXT))).toEqual({});
  });
});
