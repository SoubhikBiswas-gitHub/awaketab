import { describe, expect, it } from 'vitest';

import { inline, placedBlocks, plain, splitArticle, tokenize } from '../../src/lib/article';

// docs/06 §22: a Markdown body places structured blocks on lines of their own (`::name` or `::name key`), which
// Astro renders as a paragraph each.
const body = [
  '<p>Intro before any heading.</p>',
  '<h2 id="set-up">Set it up</h2>',
  '<p>Three steps.</p>',
  '<p>::steps</p>',
  '<p>::figures</p>',
  '<p>::ad</p>',
  '<h2 id="what-to-expect">What to expect &#x26; why</h2>',
  '<p>::pills</p>',
  '<p>::limit</p>',
  '<h2 id="code">Code</h2>',
  '<p>::code wake-lock.js</p>',
  '<p>::rows blockers</p>',
  '<p>::limit inline</p>',
].join('\n');

describe('splitArticle', () => {
  const parts = splitArticle(body);

  it('cuts the body into h2 sections and page-level markers, in order', () => {
    expect(parts.map((p) => (p.kind === 'section' ? `section:${p.id ?? ''}` : p.kind))).toEqual([
      'section:',
      'section:set-up',
      'ad',
      'section:what-to-expect',
      'limit',
      'section:code',
    ]);
  });

  it('keeps the heading text readable for the table of contents', () => {
    const expect_ = parts[3];
    expect(expect_?.kind === 'section' && expect_.title).toBe('What to expect & why');
  });

  it('lists placed blocks with their keys; `limit inline` stays inside its section', () => {
    expect(placedBlocks(parts)).toEqual([
      'steps',
      'figures',
      'pills',
      'code wake-lock.js',
      'rows blockers',
      'limit inline',
    ]);
  });

  it('drops the marker paragraphs from the section HTML', () => {
    const setUp = parts[1];
    expect(
      setUp?.kind === 'section' &&
        setUp.parts.filter((p) => p.kind === 'html').map((p) => p.kind === 'html' && p.html.trim()),
    ).toEqual(['<p>Three steps.</p>']);
  });

  it('fails the build on an unknown block name', () => {
    expect(() => splitArticle('<p>::nope</p>')).toThrow(/Unknown article block "::nope"/u);
  });

  it('leaves ordinary paragraphs that merely mention :: alone', () => {
    expect(placedBlocks(splitArticle('<p>Use a::b in text.</p>'))).toEqual([]);
  });
});

describe('inline Markdown in frontmatter strings', () => {
  it('renders code, strong and links, and escapes everything else', () => {
    expect(inline('Tap **Start**, run `a < b` and read [the guide](/guides/x) <script>')).toBe(
      'Tap <strong>Start</strong>, run <code>a &lt; b</code> and read <a href="/guides/x">the guide</a> &lt;script&gt;',
    );
  });

  it('marks external links rel="noopener"', () => {
    expect(inline('[Apple](https://support.apple.com/en-us/101604)')).toBe(
      '<a href="https://support.apple.com/en-us/101604" rel="noopener">Apple</a>',
    );
  });

  it('strips the same marks for plain text', () => {
    expect(plain('Tap **Start** in [the tool](/) with `code`')).toBe('Tap Start in the tool with code');
  });
});

describe('code block tokens (GuideLearn highlighter)', () => {
  it('tells keywords, calls, strings and comments apart in JavaScript', () => {
    expect(tokenize("const s = await navigator.wakeLock.request('screen'); // hold", 'js')).toEqual([
      ['kw', 'const'],
      ['pun', ' '],
      ['id', 's'],
      ['pun', ' = '],
      ['kw', 'await'],
      ['pun', ' '],
      ['id', 'navigator'],
      ['pun', '.'],
      ['id', 'wakeLock'],
      ['pun', '.'],
      ['fn', 'request'],
      ['pun', '('],
      ['str', "'screen'"],
      ['pun', '); '],
      ['com', '// hold'],
    ]);
  });

  it('marks tags, attributes and values in HTML', () => {
    expect(tokenize('<iframe allow="screen-wake-lock"></iframe>', 'html').map(([kind]) => kind)).toEqual([
      'tag',
      'pun',
      'attr',
      'pun',
      'str',
      'tag',
      'tag',
      'tag',
    ]);
  });
});
