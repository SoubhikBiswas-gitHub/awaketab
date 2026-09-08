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
