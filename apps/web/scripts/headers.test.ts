import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import * as headerTools from './headers.mjs';

describe('Cloudflare generated rules', () => {
  it('generates canonical security headers and route overrides', () => {
    const headers = headerTools.generateHeaders();
    const rules = headerTools.parseRules(headers);
    const defaultRule = rules.find(({ route }) => route === '/*');
    const embedRule = rules.find(({ route }) => route === '/embed/*');

    expect(defaultRule?.headers).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
      ]),
    );
    expect(embedRule?.headers).toContain('X-Robots-Tag');
    expect(headers).toContain('/pt-br/learn/*');
    expect(headers).toContain("frame-ancestors *");
  });

  it('makes only /embed/* frameable, and keeps it noindex (docs/14 §3, docs/11 §7)', () => {
    const text = headerTools.generateHeaders();
    const at = (pathname: string) => headerTools.resolveHeaders(text, pathname);

    const widget = at('/embed/cook');
    expect(widget.get('content-security-policy')).toMatch(/frame-ancestors \*$/u);
    expect(widget.get('content-security-policy')).not.toContain("frame-ancestors 'none'");
    expect(widget.has('x-frame-options')).toBe(false);
    expect(widget.get('x-robots-tag')).toBe('noindex');
    expect(widget.get('permissions-policy')).toContain('screen-wake-lock=(self)');
    expect(widget.get('content-security-policy')).toContain("connect-src 'self'");

    // The /embed landing page is an ordinary, indexable, unframeable page even though /embed/* matches it.
    for (const landing of ['/embed', '/embed/']) {
      const h = at(landing);
      expect(h.get('content-security-policy')).toContain("frame-ancestors 'none'");
      expect(h.get('content-security-policy')).not.toContain('frame-ancestors *');
      expect(h.get('x-frame-options')).toBe('DENY');
      expect(h.has('x-robots-tag')).toBe(false);
    }

    for (const other of ['/', '/30m', '/pip', '/library', '/kiosk', '/for/cooking', '/es/learn/x']) {
      const h = at(other);
      expect(h.get('x-frame-options'), other).toBe('DENY');
      expect(h.get('content-security-policy'), other).toContain("frame-ancestors 'none'");
      expect(h.get('content-security-policy'), other).not.toContain('frame-ancestors *');
    }

    // Cloudflare joins a header set by two matching rules; the specific rules detach the /* default first.
    expect(at('/embed.js').get('cache-control')).toBe('public, max-age=3600');
    // The fingerprinted iframe app (embed-loader.mjs --fingerprint) is immutable; the pages that load it are not.
    expect(at('/embed/assets/app.0123456789.js').get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(at('/embed/cook').get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(at('/embed/app.js').get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(at('/_astro/x.js').get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(at('/sw.js').get('cache-control')).toBe('no-cache');
    expect(at('/api/health').get('cache-control')).toBe('no-store');
  });

  it('ships the generated rules as public/_headers (what Cloudflare actually reads)', async () => {
    // vitest runs from the repo root under happy-dom, where import.meta.url is not a file: URL.
    const shipped = await readFile(path.resolve('apps/web/public/_headers'), 'utf8');
    expect(shipped).toBe(headerTools.generateHeaders());
    const widget = headerTools.resolveHeaders(shipped, '/embed/cook');
    expect(widget.get('content-security-policy')).toMatch(/frame-ancestors \*$/u);
    expect(widget.has('x-frame-options')).toBe(false);
  });

  it('keeps tool routes to first-party scripts and connections; only kiosk logos may be https images', () => {
    const csp = headerTools.resolveHeaders(headerTools.generateHeaders(), '/').get('content-security-policy') ?? '';
    // First-party scripts plus the one hashed inline boot script (src/boot/boot.js); never 'unsafe-inline'.
    expect(csp).toContain(`script-src 'self' ${headerTools.BOOT_HASH};`);
    expect(csp.match(/script-src[^;]*/u)?.[0]).not.toContain('unsafe-inline');
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("img-src 'self' data: https:;");
  });

  it('generates canonical redirects', () => {
    const redirects = headerTools.generateRedirects();

    expect(redirects).toContain(
      'https://www.awaketab.com/* https://awaketab.com/:splat 301',
    );
    expect(redirects).toContain(
      '/support-matrix /learn/browser-support-matrix 301',
    );
  });
});
