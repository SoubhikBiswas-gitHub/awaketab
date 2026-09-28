import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The one article pattern (docs/06 §24) over the English Markdown: no skipped heading level, no hand-made callout,
// no hand-placed honest limit.
const CONTENT = path.resolve('apps/web/src/content');
const FAMILIES = ['for', 'on', 'vs', 'guides', 'learn'] as const;

interface ISource {
  file: string;
  frontmatter: string;
  body: string;
}

async function sources(): Promise<ISource[]> {
  const out: ISource[] = [];
  for (const family of FAMILIES) {
    const dir = path.join(CONTENT, family, 'en');
    for (const name of (await readdir(dir)).filter((n) => n.endsWith('.md')).sort()) {
      const text = await readFile(path.join(dir, name), 'utf8');
      const [, frontmatter = '', body = ''] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(text) ?? [];
      out.push({ file: `${family}/en/${name}`, frontmatter, body });
    }
  }
  return out;
}

// Fenced code is not prose: a `#` or `<div>` inside it is code.
const prose = (body: string): string => body.replace(/```[\s\S]*?```/gu, '');

const pages = await sources();

describe('one article pattern (docs/06 §24)', () => {
  it('reads every English article', () => {
    expect(pages.length).toBeGreaterThanOrEqual(47);
  });

  it('steps headings down one level at a time, from h2 (the template owns the h1)', () => {
    const bad: string[] = [];
    for (const page of pages) {
      let level = 1;
      for (const line of prose(page.body).split('\n')) {
        const m = /^(#{1,6})\s/u.exec(line);
        if (!m) continue;
        const next = m[1]?.length ?? 0;
        if (next === 1 || next > level + 1) bad.push(`${page.file}: "${line}" after h${String(level)}`);
        level = next;
      }
    }
    expect(bad).toEqual([]);
  });

  it('writes no callout by hand: no raw HTML, blockquote or "Note:" paragraph in the body', () => {
    const CALLOUT = [
      /^\s*<(?!!--)[a-z][^>]*>/imu,
      /^>\s/mu,
      /^\s*(?:\*\*|__)?(?:Note|Tip|Warning|Important|Heads up|Good to know|Caution)(?:\*\*|__)?\s*[:.—-]/imu,
      /style="/u,
    ];
    const bad: string[] = [];
    for (const page of pages) {
      const text = prose(page.body);
      for (const re of CALLOUT) {
        const m = re.exec(text);
        if (m) bad.push(`${page.file}: ${m[0].trim()}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never places the honest limit by hand; the template puts it after the body', () => {
    const placed = pages.filter((page) => /^::limit\b/mu.test(page.body)).map((page) => page.file);
    expect(placed).toEqual([]);
  });

  it('gives every article the fields the template needs: h1, honest limit, three to five questions', () => {
    const bad: string[] = [];
    for (const page of pages) {
      if (!/^h1: /mu.test(page.frontmatter)) bad.push(`${page.file}: h1`);
      if (!/^honestLimit: /mu.test(page.frontmatter)) bad.push(`${page.file}: honestLimit`);
      const faq = /^faq:\n((?: {2}.*\n?)*)/mu.exec(page.frontmatter)?.[1] ?? '';
      const questions = faq.match(/^ {2}- q: /gmu)?.length ?? 0;
      if (questions < 3 || questions > 5) bad.push(`${page.file}: ${String(questions)} questions`);
    }
    expect(bad).toEqual([]);
  });
});
