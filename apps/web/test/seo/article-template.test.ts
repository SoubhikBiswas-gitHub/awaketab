import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The one article order as built (docs/06 §24), for every English article of every family, drafts included.
const dist = process.env.AT_DIST
  ? new URL(`file://${path.resolve(process.env.AT_DIST)}/`)
  : new URL('../../dist/', import.meta.url);
const FAMILIES = ['for', 'on', 'vs', 'guides', 'learn'] as const;

// Template blocks in page order; `false` marks one a family may leave out. Use cases and device guides put the
// tool right after the head, the other families after the body.
const block = (name: string, re: RegExp, required: boolean): readonly [string, RegExp, boolean] => [name, re, required];
const HEAD = [
  block('breadcrumbs', /<nav class="at-crumbs"/u, true),
  block('family kicker', /<p class="at-family">/u, true),
  block('h1', /<h1\b/u, true),
  block('lead', /<p class="at-lead">/u, false),
  block('meta row', /<div class="at-meta">/u, true),
  block('desktop contents', /<nav class="at-toc/u, true),
];
const TOOL = block('tool', /<section id="s-tool"/u, true);
const BODY = [
  block('phone contents', /<details class="at-toc-m">/u, true),
  block('body', /<div class="at-body">/u, true),
  block('honest limit', /<aside id="s-limit"/u, true),
];
const TAIL = [
  block('questions', /<section class="at-faq-sec"/u, true),
  block('related', /<section id="s-related"/u, false),
  block('author', /<div class="at-author">/u, true),
];
const orderFor = (family: string): ReadonlyArray<readonly [string, RegExp, boolean]> =>
  family === 'for' || family === 'on' ? [...HEAD, TOOL, ...BODY, ...TAIL] : [...HEAD, ...BODY, TOOL, ...TAIL];

async function articles(): Promise<Array<[string, string]>> {
  const out: Array<[string, string]> = [];
  for (const family of FAMILIES) {
    const dir = new URL(`${family}/`, dist);
    for (const name of (await readdir(dir)).filter((n) => n.endsWith('.html')).sort())
      out.push([`/${family}/${name.replace(/\.html$/u, '')}`, await readFile(new URL(name, dir), 'utf8')]);
  }
  return out;
}

const pages = await articles();
const main = (html: string): string => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

describe('one article order (docs/06 §24)', () => {
  it('builds every English article', () => {
    expect(pages.length).toBeGreaterThanOrEqual(47);
  });

  it("renders the template blocks in the family's order, leaving out only the optional ones", () => {
    const bad: string[] = [];
    for (const [route, html] of pages) {
      const body = main(html);
      let last = -1;
      for (const [name, re, required] of orderFor(route.split('/')[1] ?? '')) {
        const at = re.exec(body)?.index ?? -1;
        if (at < 0) {
          if (required) bad.push(`${route}: no ${name}`);
          continue;
        }
        if (at < last) bad.push(`${route}: ${name} out of order`);
        last = at;
      }
    }
    expect(bad).toEqual([]);
  });

  it('never skips a heading level and has one h1', () => {
    const bad: string[] = [];
    for (const [route, html] of pages) {
      const levels = [...main(html).matchAll(/<h([1-6])\b/gu)].map((m) => Number(m[1]));
      if (levels.filter((n) => n === 1).length !== 1 || levels[0] !== 1) bad.push(`${route}: h1`);
      levels.forEach((n, i) => {
        const prev = levels[i - 1] ?? 1;
        if (n > prev + 1) bad.push(`${route}: h${String(n)} after h${String(prev)}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('draws every callout with the shared Note and Limit components and their Phosphor icons', () => {
    const bad: string[] = [];
    for (const [route, html] of pages) {
      const body = main(html);
      for (const m of body.matchAll(/<(?:div|aside) role="note" class="([^"]+)"[^>]*>\s*(<svg[^>]*>)/gu)) {
        if (!/\bat-note\b/u.test(m[1] ?? '')) bad.push(`${route}: note without .at-note`);
        if (!/class="at-duo/u.test(m[2] ?? '')) bad.push(`${route}: note icon is not Phosphor`);
      }
      if (/<blockquote/u.test(body)) bad.push(`${route}: blockquote`);
      if (/<p><strong>(?:Note|Tip|Warning|Important)\b/u.test(body)) bad.push(`${route}: hand-made callout`);
    }
    expect(bad).toEqual([]);
  });

  it('writes the verified or updated date in full, with the weekday', () => {
    for (const [route, html] of pages) {
      const meta = /<div class="at-meta">([\s\S]*?)<\/div>/u.exec(html)?.[1] ?? '';
      expect(meta, route).toMatch(
        /(?:Sources checked|Updated) (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{1,2} [A-Z][a-z]+ \d{4}/u,
      );
      expect(meta, route).toMatch(/\d+ min read/u);
    }
  });
});
