import { MAX_BODY_BYTES, type IEnv } from '../_lib/env';
import { mapEvent, readCappedText, writePoints, type IIncomingEvent } from '../_lib/events';
import { jsonError, jsonOk, rateLimited } from '../_lib/http';
import { clientIp, rateLimit } from '../_lib/ratelimit';

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

/**
 * Same guards as `/api/e` (docs/09 §2.10): the salted-IP-hash limiter (`rl:csp:{hash}:{bucket}`, no IP stored)
 * answers 429 + `Retry-After`, and a body over `MAX_BODY_BYTES` (8 KB) answers 413 without being read in full.
 */
export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const ip = await clientIp(context.request);
  if (!(await rateLimit(context.env, 'csp', ip))) return rateLimited();
  const raw = await readCappedText(context.request, MAX_BODY_BYTES);
  if (raw === null) return jsonError('too_large', 413);
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
