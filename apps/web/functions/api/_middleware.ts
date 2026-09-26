import type { IEnv } from '../_lib/env';
import { preflight, withExtensionCors } from '../_lib/cors';

/**
 * `/api/*` middleware: answers the extension's CORS preflight and adds `Access-Control-Allow-Origin` for
 * `chrome-extension://` origins on the routes listed in `_lib/cors.ts`. Same-origin requests pass through
 * otherwise untouched, apart from `X-Robots-Tag: noindex`: Cloudflare Pages never applies `_headers` to
 * Functions responses, so the `/api/*` and `*.pages.dev` noindex rules there cannot reach them (F-03, docs/14 §1).
 */
export const onRequest: PagesFunction<IEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') return preflight(context.request);
  const response = withExtensionCors(context.request, await context.next());
  if (response.headers.get('x-robots-tag') === 'noindex') return response;
  // Responses from `next()` may have immutable headers; copy once.
  const next = new Response(response.body, response);
  next.headers.set('x-robots-tag', 'noindex');
  return next;
};
