import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { servedFile } from '../../scripts/served.mjs';

// Structured article blocks (docs/06 §22) as built: every indexed English page carries its lead and its family's
// blocks, no `::` block line leaks into a page, and pill labels stay the contract copy (docs/00 §5.1).
const dist = process.env.AT_DIST
  ? new URL(`file://${path.resolve(process.env.AT_DIST)}/`)
  : new URL('../../dist/', import.meta.url);
const built = async (pathname: string): Promise<string> => readFile(new URL(servedFile(pathname), dist), 'utf8');

type TFamily = 'for' | 'on' | 'vs' | 'guides' | 'learn';
const PILL_COPY = new Set([
  'Ready',
  'Starting…',
  'Screen awake',
  'Paused — tab hidden',
  "Blocked — here's the fix",
  'Not supported here',
  'Tap to use the fallback',
  'Awake via video fallback',
]);
// What each family's board draws, as the class or attribute the block renders.
const FAMILY_BLOCKS: Record<TFamily, readonly string[]> = {
  for: [
    'class="at-steps"',
    'class="at-figs"',
    'data-placeholder="phone screenshot"',
    'class="at-states"',
    'data-check',
  ],
  on: ['at-steps-shots', 'data-placeholder="screenshot"', 'class="at-grid at-mx"', 'class="at-rl"', 'class="at-facts"'],
  vs: ['class="at-grid at-cmp"', 'class="at-picks"'],
  guides: ['at-steps-track', 'data-progress', 'id="s-tool"'],
  learn: ['class="at-rl"', 'id="h-limit-in"', 'id="s-tool"'],
};

async function htmlFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const out: URL[] = [];
  for (const entry of entries) {
    const target = new URL(entry.name, `${directory.href.replace(/\/?$/u, '/')}`);
    if (entry.isDirectory()) out.push(...(await htmlFiles(new URL(`${target.href}/`))));
    else if (entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

async function indexedEnglish(): Promise<string[]> {
  const sitemap = await readFile(new URL('sitemap-en.xml', dist), 'utf8');
  return [...sitemap.matchAll(/<loc>https:\/\/awaketab\.com(\/(?:for|on|vs|guides|learn)\/[^<]+)<\/loc>/gu)].map(
    (m) => m[1] ?? '',
  );
}

const pillLabels = (html: string): string[] =>
  [...html.matchAll(/<span data-lock="[a-z]+" class="at-pill[^"]*">[\s\S]*?<\/svg>([^<]*)<\/span>/gu)].map((m) =>
    (m[1] ?? '').replace(/&#39;/gu, "'").trim(),
  );

describe('structured article blocks (docs/06 §22)', () => {
  it('gives each of the 25 indexed English pages its lead and its family blocks', async () => {
    const routes = await indexedEnglish();
    expect(routes).toHaveLength(25);
    for (const route of routes) {
      const html = await built(route);
      const family = route.split('/')[1] as TFamily;
      const lead = /<p class="at-lead">([\s\S]*?)<\/p>/u.exec(html)?.[1]?.replace(/<[^>]+>/gu, '') ?? '';
      expect(lead.length, `${route} lead`).toBeGreaterThanOrEqual(60);
      for (const needle of FAMILY_BLOCKS[family]) expect(html, `${route}: ${needle}`).toContain(needle);
    }
  });

  it('leaves no block line in any built content page, in any locale', async () => {
    const files = (await htmlFiles(dist)).filter((file) =>
      /\/(?:for|on|vs|guides|learn)\/[^/]+\.html$/u.test(file.pathname),
    );
    expect(files.length).toBeGreaterThan(100);
    for (const file of files) {
      const html = await readFile(file, 'utf8');
      expect(html.match(/<p>::[a-z]/gu) ?? [], file.pathname).toEqual([]);
    }
  });

  it('draws pill states with the exact contract copy', async () => {
    for (const route of await indexedEnglish()) {
      const html = await built(route);
      for (const label of pillLabels(html.slice(html.indexOf('class="at-body"')))) {
        expect(PILL_COPY.has(label), `${route}: "${label}"`).toBe(true);
      }
    }
  });

  it('builds /for/cooking section by section like the ContentArticle board', async () => {
    const html = await built('/for/cooking');
    const body = html.slice(html.indexOf('class="at-body"'));
    const ids = [...body.matchAll(/<h2 id="([^"]+)"/gu)].map((m) => m[1]);
    expect(ids).toEqual([
      'set-it-up-in-30-seconds',
      'what-to-expect-while-you-cook',
      'h-limit',
      'before-a-long-cook',
      'h-related',
      'faq',
    ]);
    const lead = html.indexOf('class="at-lead"');
    expect(lead).toBeGreaterThan(html.indexOf('<h1'));
    expect(lead).toBeLessThan(html.indexOf('id="tool"'));
    expect(body.match(/<li><span class="at-step-n"/gu)).toHaveLength(3);
    expect(body.match(/data-placeholder="(?:phone|desktop) screenshot"/gu)).toHaveLength(2);
    expect(pillLabels(body.slice(body.indexOf('class="at-states"')))).toEqual(
      expect.arrayContaining(['Starting…', 'Screen awake', 'Paused — tab hidden', "Blocked — here's the fix"]),
    );
    expect(body).toMatch(
      /<span class="at-count" aria-live="polite" data-counter="\{n\} of 4 checked">\s*0 of 4 checked/u,
    );
    expect(body.match(/<input type="checkbox">/gu)).toHaveLength(4);
  });

  it('inlines only the block styles a page uses', async () => {
    const style = (html: string): string =>
      /<style>([^<]*\.at-(?:steps|figs|grid|rl|codeb)[^<]*)<\/style>/u.exec(html)?.[1] ?? '';
    const cooking = style(await built('/for/cooking'));
    expect(cooking).toContain('.at-figs');
    expect(cooking).not.toContain('.at-codeb');
    const guide = style(await built('/guides/iphone-auto-lock-never-greyed-out'));
    expect(guide).toContain('.at-steps-track');
    expect(guide).toContain('.at-box');
    expect(guide).not.toContain('.at-figs');
    const learn = style(await built('/learn/screen-wake-lock-api-guide'));
    expect(learn).toContain('.at-codeb');
    expect(learn).not.toMatch(/\/\*/u);
  });
  // Google's Article guidelines: headline, image, datePublished, dateModified and a named author on every indexed
  // article; the image is the page's own Open Graph image.
  it('gives every indexed article complete Article structured data', async () => {
    const routes = await indexedEnglish();
    const sitemaps = await Promise.all(
      ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'].map((l) =>
        readFile(new URL(`sitemap-${l}.xml`, dist), 'utf8').catch(() => ''),
      ),
    );
    for (const xml of sitemaps)
      for (const m of xml.matchAll(
        /<loc>https:\/\/awaketab\.com(\/[a-z-]+\/(?:for|on|vs|guides|learn)\/[^<]+)<\/loc>/gu,
      ))
        routes.push(m[1] ?? '');
    for (const route of routes) {
      const html = await built(route);
      const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)].flatMap(
        (m) => (JSON.parse(m[1] ?? '{}') as { '@graph'?: Array<Record<string, unknown>> })['@graph'] ?? [],
      );
      const article = graph.find((node) => node['@type'] === 'Article');
      const og = /<meta property="og:image" content="([^"]+)"/u.exec(html)?.[1];
      const h1 = /<h1[^>]*>([^<]+)<\/h1>/u.exec(html)?.[1]?.trim();
      expect(article, route).toBeDefined();
      expect(article?.headline, `${route} headline`).toBe(h1?.replace(/&#39;/gu, "'").replace(/&amp;/gu, '&'));
      expect(String(article?.headline ?? '').length, `${route} headline length`).toBeLessThanOrEqual(110);
      expect(article?.image, `${route} image`).toBe(og);
      expect(article?.datePublished, `${route} datePublished`).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(article?.dateModified, `${route} dateModified`).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(article?.author, `${route} author`).toMatchObject({ '@type': 'Person', name: 'Soubhik Biswas' });
      expect(article?.publisher, `${route} publisher`).toMatchObject({ '@type': 'Organization', name: 'AwakeTab' });
    }
  });
});
