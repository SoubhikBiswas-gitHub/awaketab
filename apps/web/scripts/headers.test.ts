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
    expect(headers).toContain('frame-ancestors *');
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

    // The /embed landing page is an ordinary, indexable, unframeable page. It is served at /embed (embed.html;
    // /embed/ only 308-redirects there, docs/14 §2.1), so no rule is keyed on /embed/.
    expect(headerTools.parseRules(text).map(({ route }) => route)).not.toContain('/embed/');
    const landing = at('/embed');
    expect(landing.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(landing.get('content-security-policy')).not.toContain('frame-ancestors *');
    expect(landing.get('x-frame-options')).toBe('DENY');
    expect(landing.has('x-robots-tag')).toBe(false);

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

  it('marks every *.pages.dev host noindex and leaves the production host indexable (F-03, docs/14 §1)', () => {
    const text = headerTools.generateHeaders();
    const PAGES = [
      '/',
      '/es/',
      '/30m',
      '/for/cooking',
      '/es/learn/x',
      '/embed',
      '/pip',
      '/sitemap-index.xml',
      '/_astro/x.js',
    ];
    for (const host of ['awaketab.pages.dev', '3f2a9c1b.awaketab.pages.dev', 'm6-engagement.awaketab.pages.dev']) {
      for (const pathname of PAGES) {
        expect(headerTools.resolveHeaders(text, pathname, host).get('x-robots-tag'), `${host}${pathname}`).toMatch(
          /^noindex(, noindex)?$/u,
        );
      }
      // Path rules still apply on preview hosts.
      expect(headerTools.resolveHeaders(text, '/embed/cook', host).get('content-security-policy')).toMatch(
        /frame-ancestors \*$/u,
      );
    }
    for (const host of ['awaketab.com', 'www.awaketab.com', 'awaketab.pages.dev.evil.example', 'pages.dev']) {
      for (const pathname of ['/', '/30m', '/for/cooking', '/embed']) {
        expect(headerTools.resolveHeaders(text, pathname, host).has('x-robots-tag'), `${host}${pathname}`).toBe(false);
      }
    }
    // Last in the file, so a path rule's `! X-Robots-Tag` (the /embed landing page) cannot detach them.
    const routes = headerTools.parseHeaderRules(text).map((rule) => rule.route);
    expect(routes.slice(-2)).toEqual([...headerTools.PREVIEW_HOST_RULES]);
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

    expect(redirects).toContain('https://www.awaketab.com/* https://awaketab.com/:splat 301');
    expect(redirects).toContain('/support-matrix /learn/browser-support-matrix 301');
  });

  it('301s the OD-3 merged content URLs to the page that now answers them, and nothing for the cut /for pages', () => {
    const redirects = headerTools.generateRedirects();
    for (const line of [
      '/for/second-monitor /guides/second-monitor-turns-off 301',
      '/on/windows-10 /on/windows-11 301',
      '/guides/modern-standby /guides/lock-screen-vs-sleep 301',
      '/learn/nosleep-js-vs-wake-lock /vs/nosleep-js 301',
    ]) {
      expect(redirects.split('\n')).toContain(line);
    }
    expect(headerTools.CONTENT_REDIRECTS).toHaveLength(4);
    // Cut pages (never indexed) answer 404; a redirect to an unrelated page would be a soft 404.
    for (const cut of ['/for/navigation', '/for/live-streams', '/for/exams-proctoring', '/for/baby-monitor']) {
      expect(redirects).not.toContain(`${cut} `);
    }
    // No chains: a redirect target is never itself redirected.
    const sources = new Set(headerTools.CONTENT_REDIRECTS.map(([from]) => from));
    for (const [, to] of headerTools.CONTENT_REDIRECTS) expect(sources.has(to), to).toBe(false);
  });
});
