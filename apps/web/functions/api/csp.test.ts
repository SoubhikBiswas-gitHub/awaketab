import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onCsp } from './csp';
import { harness, invoke, ipTraces, SITE, TEST_IP, type IHarness } from '../../test/functions/harness';

function report(h: IHarness, body: string, contentType: string) {
  return invoke(
    onCsp,
    h.env,
    new Request(`${SITE}/api/csp`, {
      method: 'POST',
      headers: { 'content-type': contentType, 'cf-connecting-ip': TEST_IP, 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/128' },
      body,
    }),
  );
}

// What Chrome POSTs for `report-to csp` + `Reporting-Endpoints: csp="/api/csp"` (public/_headers).
const REPORTING_API = JSON.stringify([
  {
    age: 12,
    type: 'csp-violation',
    url: 'https://awaketab.com/30m?utm_source=newsletter',
    user_agent: 'Mozilla/5.0 (Macintosh) Chrome/128',
    body: {
      documentURL: 'https://awaketab.com/30m?utm_source=newsletter',
      blockedURL: 'https://evil.example/x.js',
      effectiveDirective: 'script-src-elem',
      disposition: 'enforce',
      statusCode: 200,
    },
  },
]);

const LEGACY = JSON.stringify({
  'csp-report': { 'document-uri': 'https://awaketab.com/es/learn/why?x=1', 'violated-directive': 'img-src' },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/csp', () => {
  it('maps a Reporting API report to client_error code csp with the pathname only', async () => {
    const h = harness();
    const res = await report(h, REPORTING_API, 'application/reports+json');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(h.ae.points).toHaveLength(1);
    const point = h.ae.points[0];
    expect(point?.indexes).toEqual(['client_error']);
    expect(point?.blobs[0]).toBe('/30m');
    expect(point?.blobs[5]).toBe('csp');
    expect(point?.blobs).toHaveLength(9);
    expect(point?.doubles[0]).toBe(0);
  });

  it('maps a legacy report-uri body the same way', async () => {
    const h = harness();
    await report(h, LEGACY, 'application/csp-report');
    expect(h.ae.points[0]?.indexes).toEqual(['client_error']);
    expect(h.ae.points[0]?.blobs[0]).toBe('/es/learn/why');
    expect(h.ae.points[0]?.blobs[5]).toBe('csp');
  });

  it.each(['', 'not json', '[]', '{"csp-report":{"document-uri":42}}'])('still records client_error for a malformed body %j', async (body) => {
    const h = harness();
    expect((await report(h, body, 'application/json')).status).toBe(200);
    expect(h.ae.points).toHaveLength(1);
    expect(h.ae.points[0]?.blobs[0]).toBe('');
    expect(h.ae.points[0]?.blobs[5]).toBe('csp');
  });

  it('persists no IP, user agent, blocked URL or query string, and never touches KV', async () => {
    const h = harness();
    await report(h, REPORTING_API, 'application/reports+json');
    await report(h, LEGACY, 'application/csp-report');
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
    const stored = JSON.stringify(h.ae.points);
    expect(stored).not.toContain('Mozilla');
    expect(stored).not.toContain('evil.example');
    expect(stored).not.toContain('utm_source');
    expect(h.kv.writes).toEqual([]);
  });

  it('answers 200 without an EVENTS binding', async () => {
    const h = harness({ EVENTS: undefined });
    expect((await report(h, REPORTING_API, 'application/reports+json')).status).toBe(200);
  });
});
