import type { IEnv } from '../_lib/env';
import { mapEvent, writePoints, type IIncomingEvent } from '../_lib/events';
import { jsonOk } from '../_lib/http';

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const raw = await context.request.text();
  let path: string;
  try {
    const parsed = JSON.parse(raw) as { 'csp-report'?: { 'document-uri'?: string }; url?: string };
    path = parsed['csp-report']?.['document-uri'] ?? parsed.url ?? '';
  } catch {
    path = '';
  }
  const row: IIncomingEvent = { event: 'client_error', code: 'csp', path, ts: Date.now() };
  const point = mapEvent(row, Date.now());
  if (point) writePoints(context.env, [point]);
  return jsonOk({ ok: true });
};
