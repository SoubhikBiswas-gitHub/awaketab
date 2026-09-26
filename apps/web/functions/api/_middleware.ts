import type { IEnv } from '../_lib/env';
import { preflight, withExtensionCors } from '../_lib/cors';

/**
 * `/api/*` middleware: answers the extension's CORS preflight and adds `Access-Control-Allow-Origin` for
 * `chrome-extension://` origins on the routes listed in `_lib/cors.ts`. Same-origin requests pass through
 * untouched.
 */
export const onRequest: PagesFunction<IEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') return preflight(context.request);
  const response = await context.next();
  return withExtensionCors(context.request, response);
};
