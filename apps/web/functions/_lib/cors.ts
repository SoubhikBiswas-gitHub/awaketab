/**
 * CORS for the AwakeTab browser extension (docs/10 §7–§8). The extension has no host permissions by
 * default, so its options page and service worker reach `/api/license/*` and `/api/e` as cross-origin
 * requests from `chrome-extension://<id>`. Only extension origins are answered, without credentials;
 * the endpoints stay authorised by the licence key/token itself and rate-limited by IP hash as before.
 */

/** Chrome and Edge extension ids are 32 letters a–p. */
const EXTENSION_ORIGIN = /^chrome-extension:\/\/[a-p]{32}$/u;

/** Routes the extension calls. Everything else under /api keeps same-origin only. */
export const EXTENSION_CORS_ROUTES = ['/api/e', '/api/license/activate', '/api/license/validate', '/api/license/deactivate'] as const; // PROPOSED — add to 00-conventions.md

export function isExtensionOrigin(origin: string | null): origin is string {
  return origin !== null && EXTENSION_ORIGIN.test(origin);
}

export function extensionCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!isExtensionOrigin(origin)) return {};
  const { pathname } = new URL(request.url);
  if (!(EXTENSION_CORS_ROUTES as readonly string[]).includes(pathname)) return {};
  return { 'access-control-allow-origin': origin, vary: 'Origin' };
}

/** `OPTIONS` preflight: 204 for an extension origin on an allowed route, 403 otherwise. */
export function preflight(request: Request): Response {
  const headers = extensionCorsHeaders(request);
  if (!headers['access-control-allow-origin']) return new Response(null, { status: 403, headers: { 'cache-control': 'no-store' } });
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store',
    },
  });
}

/** Copies the response with the CORS headers added (Response headers can be immutable). */
export function withExtensionCors(request: Request, response: Response): Response {
  const headers = extensionCorsHeaders(request);
  if (!headers['access-control-allow-origin']) return response;
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) next.headers.set(key, value);
  return next;
}
