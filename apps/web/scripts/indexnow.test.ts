// @vitest-environment node
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { changedUrls, INDEXNOW_ENDPOINT, MAX_URLS, payloads, ping, readKey, selectUrls, sitemapLocs, validKey } from './indexnow.mjs';

const SITE = 'https://awaketab.com';
const REPO = path.resolve(import.meta.dirname, '../../..');
const KEY = '0123456789abcdef0123456789abcdef';

const slugs = { for: { cooking: { es: 'cocinar' } } };
const entry = (kind: string, locale: string, enSlug: string, extra: { reviewed?: boolean; noindex?: boolean } = {}) => ({
  kind,
  locale,
  enSlug,
  reviewed: extra.reviewed ?? false,
  noindex: extra.noindex ?? false,
  file: path.join(REPO, 'apps/web/src/content', kind, locale, `${enSlug}.md`),
});
const PAGES = [
  entry('for', 'en', 'cooking'),
  entry('for', 'es', 'cooking'),
  entry('for', 'de', 'cooking', { reviewed: true }),
  entry('learn', 'en', 'draft', { noindex: true }),
];

describe('IndexNow key (F-05)', () => {
  it('accepts only 8–128 characters of A–Z, a–z, 0–9 and -', () => {
    expect(validKey(KEY)).toBe(true);
    expect(validKey('short')).toBe(false);
    expect(validKey('x'.repeat(129))).toBe(false);
    expect(validKey('has space inside')).toBe(false);
    expect(validKey('../../etc/passwd')).toBe(false);
    expect(readKey({})).toEqual({ key: null, reason: 'INDEXNOW_KEY is not set' });
    expect(readKey({ INDEXNOW_KEY: ` ${KEY}\n` })).toEqual({ key: KEY });
    expect(readKey({ INDEXNOW_KEY: 'bad key' }).key).toBeNull();
  });
});

describe('IndexNow URL selection (F-05)', () => {
  it('reads <loc> values from a sitemap or sitemap index', () => {
    const xml = `<urlset><url><loc>${SITE}/for/cooking</loc><xhtml:link href="${SITE}/es/for/cocinar"/></url><url><loc>${SITE}/a?x=1&amp;y=2</loc></url></urlset>`;
    expect(sitemapLocs(xml)).toEqual([`${SITE}/for/cooking`, `${SITE}/a?x=1&y=2`]);
  });

  it('keeps only indexable pages on the site host, as served, deduplicated and sorted', () => {
    const selected = selectUrls([
      SITE,
      `${SITE}/for/cooking`,
      `${SITE}/for/cooking`,
      `${SITE}/es/`,
      `${SITE}/30m`,
      `${SITE}/embed`,
      `${SITE}/embed/cook`,
      `${SITE}/pip`,
      `${SITE}/es/pip`,
      `${SITE}/until/17-30`,
      `${SITE}/api/health`,
      `${SITE}/sitemap-en.xml`,
      `${SITE}/30m?utm_source=x`,
      `http://awaketab.com/for/cooking`,
      `https://awaketab.pages.dev/30m`,
      `https://evil.example/for/cooking`,
      'not a url',
    ]);
    expect(selected).toEqual([`${SITE}/`, `${SITE}/30m`, `${SITE}/embed`, `${SITE}/es/`, `${SITE}/for/cooking`]);
  });

  it('maps changed files to the indexable pages they build; never an unreviewed or noindex page', () => {
    const changed = changedUrls(
      [
        'apps/web/src/content/for/en/cooking.md',
        'apps/web/src/content/for/es/cooking.md',
        'apps/web/src/content/for/de/cooking.md',
        'apps/web/src/content/learn/en/draft.md',
        'apps/web/src/content/for/en/deleted.md',
        'changelog/2026-10-x.md',
        'docs/06-content-seo-spec.md',
        'apps/web/functions/api/e.ts',
        'apps/extension/src/popup.ts',
      ],
      PAGES,
      slugs,
    );
    expect(changed).toEqual(new Set([`${SITE}/for/cooking`, `${SITE}/de/for/cooking`, `${SITE}/changelog`]));
  });

  it('a shared template, style, string catalog or engine change means every URL', () => {
    for (const file of ['apps/web/src/layouts/BaseLayout.astro', 'apps/web/src/i18n/en.json', 'apps/web/public/_redirects', 'packages/wake/src/machine.ts', 'apps/web/astro.config.mjs']) {
      expect(changedUrls([file], PAGES, slugs), file).toBe('all');
    }
    expect(changedUrls(['README.md', 'apps/web/test/seo/x.test.ts'], PAGES, slugs)).toEqual(new Set());
  });
});

describe('IndexNow ping (F-05)', () => {
  it('builds the protocol body and splits at 10,000 URLs', () => {
    const urls = Array.from({ length: MAX_URLS + 1 }, (_, i) => `${SITE}/p${String(i)}`);
    const bodies = payloads(KEY, urls);
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toMatchObject({ host: 'awaketab.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt` });
    expect(bodies[0]?.urlList).toHaveLength(MAX_URLS);
    expect(bodies[1]?.urlList).toEqual([`${SITE}/p${String(MAX_URLS)}`]);
  });

  it('checks the live key file, then POSTs JSON to api.indexnow.org', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchFn = ((url: string, init?: RequestInit) => {
      calls.push({ url, ...(init ? { init } : {}) });
      return Promise.resolve(url.endsWith('.txt') ? new Response(`${KEY}\n`) : new Response(null, { status: 202 }));
    }) as unknown as typeof fetch;
    const result = await ping({ key: KEY, urls: [`${SITE}/for/cooking`], fetchFn });
    expect(result).toEqual({ sent: 1 });
    expect(calls.map((c) => c.url)).toEqual([`${SITE}/${KEY}.txt`, INDEXNOW_ENDPOINT]);
    expect(calls[1]?.init?.method).toBe('POST');
    expect(new Headers(calls[1]?.init?.headers).get('content-type')).toMatch(/^application\/json/u);
    expect(JSON.parse(calls[1]?.init?.body as string)).toEqual({ host: 'awaketab.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: [`${SITE}/for/cooking`] });
  });

  it('refuses to ping when the key file is not deployed, and sends nothing for no URLs or a dry run', async () => {
    let posts = 0;
    const missing = ((url: string) => {
      if (!url.endsWith('.txt')) posts += 1;
      return Promise.resolve(new Response('not found', { status: 404 }));
    }) as unknown as typeof fetch;
    await expect(ping({ key: KEY, urls: [`${SITE}/`], fetchFn: missing })).rejects.toThrow(/does not serve the key/u);
    expect((await ping({ key: KEY, urls: [], fetchFn: missing })).sent).toBe(0);
    const served = ((url: string) => {
      if (!url.endsWith('.txt')) posts += 1;
      return Promise.resolve(new Response(KEY));
    }) as unknown as typeof fetch;
    expect((await ping({ key: KEY, urls: [`${SITE}/`], fetchFn: served, dryRun: true })).sent).toBe(0);
    expect(posts).toBe(0);
  });

  it('treats any status but 200 / 202 as a failure', async () => {
    const fetchFn = ((url: string) =>
      Promise.resolve(url.endsWith('.txt') ? new Response(KEY) : new Response('bad', { status: 422 }))) as unknown as typeof fetch;
    await expect(ping({ key: KEY, urls: [`${SITE}/`], fetchFn })).rejects.toThrow(/HTTP 422/u);
  });
});
