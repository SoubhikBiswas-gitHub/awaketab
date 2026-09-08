import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const dist = new URL('../../dist/', import.meta.url);

describe('holding page SEO', () => {
  it('ships canonical metadata and valid schema', async () => {
    const html = await readFile(new URL('index.html', dist), 'utf8');
    const schemaMatches = [
      ...html.matchAll(
        /<script type="application\/ld\+json">(?<json>.*?)<\/script>/gu,
      ),
    ];
    const schemas = schemaMatches.flatMap((match) => {
      const value = match.groups?.json;
      return value === undefined ? [] : [JSON.parse(value) as unknown];
    });

    expect(html.match(/<h1(?:\s[^>]*)?>/gu)).toHaveLength(1);
    expect(html).toContain(
      '<link rel="canonical" href="https://awaketab.com">',
    );
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(schemas).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ '@type': 'WebSite' }),
          expect.objectContaining({ '@type': 'Organization' }),
        ]),
      ]),
    );
  });

  it('publishes canonical robots and sitemap files', async () => {
    const [robots, sitemap] = await Promise.all([
      readFile(new URL('robots.txt', dist), 'utf8'),
      readFile(new URL('sitemap-index.xml', dist), 'utf8'),
    ]);

    expect(robots).toContain(
      'Sitemap: https://awaketab.com/sitemap-index.xml',
    );
    expect(sitemap).toContain('https://awaketab.com/sitemap-0.xml');
  });
});
