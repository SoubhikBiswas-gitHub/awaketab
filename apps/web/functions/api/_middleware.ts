import type { IEnv } from '../_lib/env';
import { preflight, withExtensionCors } from '../_lib/cors';

export const onRequest: PagesFunction<IEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') return preflight(context.request);
  const response = withExtensionCors(context.request, await context.next());
  if (response.headers.get('x-robots-tag') === 'noindex') return response;
  // Responses from `next()` may have immutable headers; copy once.
  const next = new Response(response.body, response);
  next.headers.set('x-robots-tag', 'noindex');
  return next;
};
