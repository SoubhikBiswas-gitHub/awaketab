import type { IEnv } from '../_lib/env';
import { mapEvent, writePoints, type IIncomingEvent } from '../_lib/events';
import { jsonOk } from '../_lib/http';

interface ICspReport {
  'csp-report'?: { 'document-uri'?: unknown };
  url?: unknown;
  body?: { documentURL?: unknown };
}

/**
 * `_headers` sends `report-to csp` (Reporting API: `application/reports+json`, an array of
 * `{ type, url, body: { documentURL } }`); older engines POST `{ "csp-report": { "document-uri" } }`.
 * Only the pathname is kept, matching the `blob1` contract in docs/08 §5.
 */
function reportPath(parsed: unknown): string {
  const first: unknown = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!first || typeof first !== 'object') return '';
  const row = first as ICspReport;
  const raw = row['csp-report']?.['document-uri'] ?? row.body?.documentURL ?? row.url;
  if (typeof raw !== 'string') return '';
  try {
    return new URL(raw, 'https://awaketab.com').pathname;
  } catch {
    return '';
  }
}

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const raw = await context.request.text();
  let path: string;
  try {
    path = reportPath(JSON.parse(raw));
  } catch {
    path = '';
  }
  const row: IIncomingEvent = { event: 'client_error', code: 'csp', path, ts: Date.now() };
  const point = mapEvent(row, Date.now());
  if (point) writePoints(context.env, [point]);
  return jsonOk({ ok: true });
};
