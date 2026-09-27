// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { contentDate, gitDates, latest, PAGE_SOURCES, sitemapFiles } from './sitemap.mjs';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let dir = '';
const git = (cwd: string, args: string[], date?: string) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd,
    env: { ...process.env, ...(date ? { GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date } : {}) },
    stdio: 'pipe',
  });

async function commit(repo: string, file: string, date: string) {
  await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
  await writeFile(path.join(repo, file), date);
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-q', '-m', file], date);
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'awaketab-sitemap-'));
  const repo = path.join(dir, 'repo');
  await mkdir(repo);
  git(repo, ['init', '-q']);
  await commit(repo, 'web/src/pages/old.astro', '2026-01-02T03:04:05+00:00');
  await commit(repo, 'web/src/pages/mid.astro', '2026-03-04T05:06:07+00:00');
  await commit(repo, 'web/src/pages/new.astro', '2026-05-06T07:08:09+00:00');
  git(dir, ['clone', '-q', '--depth', '2', `file://${repo}`, 'shallow']);
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

// git prints UTC as Z or +00:00 depending on its version; compare the moment, not the text.
const instant = (value: string | undefined): number | undefined => (value === undefined ? value : Date.parse(value));

describe('page dates for the sitemap (docs/06 §6)', () => {
  it('reads the last commit of each path relative to the app directory, whatever the working directory', async () => {
    const dateOf = await gitDates(path.join(dir, 'repo/web'));
    expect(instant(await dateOf(['src/pages/old.astro']))).toBe(instant('2026-01-02T03:04:05+00:00'));
    expect(instant(await dateOf(['src/pages/old.astro', 'src/pages/mid.astro']))).toBe(
      instant('2026-03-04T05:06:07+00:00'),
    );
    expect(await dateOf(['src/pages/missing.astro'])).toBeUndefined();
  });

  it('drops a date that lands on a shallow clone boundary instead of guessing', async () => {
    const dateOf = await gitDates(path.join(dir, 'shallow/web'));
    expect(instant(await dateOf(['src/pages/new.astro']))).toBe(instant('2026-05-06T07:08:09+00:00'));
    // The boundary commit appears to add every older file, so its date is not the file's.
    expect(await dateOf(['src/pages/mid.astro'])).toBeUndefined();
    expect(await dateOf(['src/pages/old.astro'])).toBeUndefined();
  });

  it('gives no date outside a git checkout', async () => {
    const plain = path.join(dir, 'plain');
    await mkdir(plain, { recursive: true });
    const dateOf = await gitDates(plain);
    expect(await dateOf(['x'])).toBeUndefined();
  });

  it('uses the content date the page shows: updated, else published', () => {
    expect(contentDate({ published: '2026-09-09', updated: '2026-09-27' })).toBe('2026-09-27');
    expect(contentDate({ published: '2026-09-09' })).toBe('2026-09-09');
    expect(contentDate({ published: 'soon' })).toBeUndefined();
    expect(contentDate({})).toBeUndefined();
  });

  it('picks the latest valid date', () => {
    expect(latest(['2026-09-09', '2026-09-27T01:00:00+05:30', undefined, 'nope'])).toBe('2026-09-27T01:00:00+05:30');
    expect(latest(['2026-09-26T23:00:00Z', '2026-09-26'])).toBe('2026-09-26T23:00:00Z');
    expect(latest([])).toBeUndefined();
  });

  it('maps every English page to source paths that exist', () => {
    for (const [route, sources] of Object.entries(PAGE_SOURCES)) {
      for (const source of sources) expect(existsSync(path.join(WEB, source)), `${route}: ${source}`).toBe(true);
    }
  });
});

describe('sitemapFiles', () => {
  const urls = (xml: string) =>
    new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/gu)].map((m) => [m[1], m[2]]));

  it('omits lastmod rather than using the build time when a page has no known date', async () => {
    const files = await sitemapFiles({ dateOf: () => Promise.resolve(undefined) });
    const en = urls(files['sitemap-en.xml'] ?? '');
    expect(en.get('https://awaketab.com/about')).toBeUndefined();
    expect(en.get('https://awaketab.com')).toBeUndefined();
    // Content pages keep their frontmatter date, and hubs take the newest article they list.
    expect(en.get('https://awaketab.com/for/cooking')).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    const articles = [...en].filter(([loc]) => loc?.startsWith('https://awaketab.com/for/')).map(([, date]) => date);
    expect(articles.length).toBeGreaterThan(0);
    const hub = en.get('https://awaketab.com/for') ?? '';
    for (const date of articles) expect(Date.parse(hub)).toBeGreaterThanOrEqual(Date.parse(date ?? ''));
    expect(files['sitemap-index.xml']).not.toMatch(/\.\d{3}Z/u);
  });

  it('dates each page by its own sources and the index by its newest page', async () => {
    const seen: string[][] = [];
    const files = await sitemapFiles({
      dateOf: (paths) => {
        seen.push(paths);
        return Promise.resolve(paths.includes('src/pages/about.astro') ? '2099-01-01T00:00:00Z' : '2020-01-01');
      },
    });
    const en = urls(files['sitemap-en.xml'] ?? '');
    expect(en.get('https://awaketab.com/about')).toBe('2099-01-01T00:00:00Z');
    expect(en.get('https://awaketab.com/terms')).toBe('2020-01-01');
    expect(seen).toContainEqual(PAGE_SOURCES['/privacy']);
    expect(files['sitemap-index.xml']).toContain(
      '<loc>https://awaketab.com/sitemap-en.xml</loc><lastmod>2099-01-01T00:00:00Z</lastmod>',
    );
  });
});
