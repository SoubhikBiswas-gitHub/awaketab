import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onCsp } from './csp';
import { MAX_BODY_BYTES, RATE_MAX } from '../_lib/env';
import { ipHash } from '../_lib/ratelimit';
import { harness, invoke, ipTraces, sha256Hex, SITE, TEST_IP, type IHarness } from '../../test/functions/harness';

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
  vi.useRealTimers();
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

  it('persists no IP, user agent, blocked URL or query string; KV holds only the salted rate-limit counter', async () => {
    const h = harness();
    await report(h, REPORTING_API, 'application/reports+json');
    await report(h, LEGACY, 'application/csp-report');
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
    const stored = JSON.stringify(h.ae.points);
    expect(stored).not.toContain('Mozilla');
    expect(stored).not.toContain('evil.example');
    expect(stored).not.toContain('utm_source');
    expect(h.kv.writes.every((row) => row.key.startsWith('rl:csp:'))).toBe(true);
    expect(h.kv.writes.map((row) => row.value)).toEqual(['1', '2']);
  });

  it('keys the rate-limit counter by the salted IP hash with a 240 s TTL', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-09-01T10:00:00.000Z'));
    const h = harness();
    await report(h, LEGACY, 'application/csp-report');
    const salted = await ipHash(h.env, TEST_IP);
    expect(salted).not.toBe(await sha256Hex(TEST_IP));
    const bucket = Math.floor(Date.now() / 1000 / 120);
    expect(h.kv.writes).toEqual([{ op: 'put', key: `rl:csp:${salted}:${String(bucket)}`, value: '1', expirationTtl: 240 }]);
  });

  it('answers 429 with Retry-After once RATE_MAX is reached, and records nothing more', async () => {
    const h = harness();
    for (let i = 0; i < RATE_MAX; i += 1) {
      expect((await report(h, LEGACY, 'application/csp-report')).status).toBe(200);
    }
    const res = await report(h, LEGACY, 'application/csp-report');
    expect(res.status).toBe(429);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(Number(res.headers.get('retry-after'))).toBeLessThanOrEqual(120);
    expect(h.ae.points).toHaveLength(RATE_MAX);
  });

  it('limits per IP: another address still gets through', async () => {
    const h = harness();
    for (let i = 0; i <= RATE_MAX; i += 1) await report(h, LEGACY, 'application/csp-report');
    const other = await invoke(
      onCsp,
      h.env,
      new Request(`${SITE}/api/csp`, { method: 'POST', headers: { 'cf-connecting-ip': '198.51.100.4' }, body: LEGACY }),
    );
    expect(other.status).toBe(200);
  });

  it('rejects a body over 8 KB with 413 and writes no point', async () => {
    const h = harness();
    const big = JSON.stringify({ 'csp-report': { 'document-uri': `https://awaketab.com/${'x'.repeat(MAX_BODY_BYTES)}` } });
    const res = await report(h, big, 'application/csp-report');
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'too_large' });
    expect(h.ae.points).toEqual([]);
  });

  it('refuses an oversized Content-Length before reading, and caps a streamed body without one', async () => {
    const h = harness();
    const declared = await invoke(
      onCsp,
      h.env,
      new Request(`${SITE}/api/csp`, {
        method: 'POST',
        headers: { 'cf-connecting-ip': TEST_IP, 'content-length': String(MAX_BODY_BYTES + 1) },
        body: '{}',
      }),
    );
    expect(declared.status).toBe(413);
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        if (pulled > 100) throw new Error('read past the cap');
        controller.enqueue(new Uint8Array(1024).fill(0x20));
      },
    });
    const init = { method: 'POST', headers: { 'cf-connecting-ip': TEST_IP }, body: stream, duplex: 'half' };
    const streamed = await invoke(onCsp, h.env, new Request(`${SITE}/api/csp`, init as RequestInit));
    expect(streamed.status).toBe(413);
    expect(pulled).toBeLessThanOrEqual(Math.ceil(MAX_BODY_BYTES / 1024) + 2);
    expect(h.ae.points).toEqual([]);
  });

  it('accepts a body of exactly 8 KB', async () => {
    const h = harness();
    const prefix = '{"csp-report":{"document-uri":"https://awaketab.com/a","pad":"';
    const body = `${prefix}${'x'.repeat(MAX_BODY_BYTES - prefix.length - 3)}"}}`;
    expect(new TextEncoder().encode(body).byteLength).toBe(MAX_BODY_BYTES);
    const res = await report(h, body, 'application/csp-report');
    expect(res.status).toBe(200);
    expect(h.ae.points[0]?.blobs[0]).toBe('/a');
  });

  it('answers 200 without an EVENTS binding', async () => {
    const h = harness({ EVENTS: undefined });
    expect((await report(h, REPORTING_API, 'application/reports+json')).status).toBe(200);
  });
});
