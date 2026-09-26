import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  alternatesFor,
  contentPath,
  frontmatterScalars,
  isIndexable,
  ogImagePath,
  publicSlug,
  readContentIndex,
  type IContentIndexEntry,
} from './translations.mjs';

const slugs = {
  for: { cooking: { es: 'cocinar', de: 'kochen', ja: 'ryouri' } },
  on: { macos: { es: 'macos' } },
};

const entry = (locale: string, reviewed: boolean, kind = 'for', enSlug = 'cooking', noindex = false): IContentIndexEntry => ({
  kind,
  enSlug,
  locale,
  reviewed,
  noindex,
});

describe('translated content routing', () => {
  it('reads top-level frontmatter scalars and ignores nested lists', () => {
    const data = frontmatterScalars(
      '---\ntitle: "Cocinar — AwakeTab"\nh1: "Mantén la pantalla: \\"encendida\\""\nreviewed: false\nlocale: es\nfaq:\n  - q: "nested: ignored"\n---\n\nBody title: not frontmatter\n',
    );
    expect(data).toEqual({ title: 'Cocinar — AwakeTab', h1: 'Mantén la pantalla: "encendida"', reviewed: false, locale: 'es' });
  });

  it('maps English slugs to translated public slugs, falling back to the English slug', () => {
    expect(publicSlug(slugs, 'for', 'cooking', 'es')).toBe('cocinar');
    expect(publicSlug(slugs, 'for', 'cooking', 'en')).toBe('cooking');
    expect(publicSlug(slugs, 'for', 'cooking', 'fr')).toBe('cooking');
    expect(contentPath(slugs, 'for', 'cooking', 'en')).toBe('/for/cooking');
    expect(contentPath(slugs, 'for', 'cooking', 'ja')).toBe('/ja/for/ryouri');
    expect(ogImagePath(slugs, 'for', 'cooking', 'de')).toBe('/og/de/for/kochen.png');
  });

  it('indexes English always and translations only once reviewed', () => {
    expect(isIndexable(entry('en', false))).toBe(true);
    expect(isIndexable(entry('es', false))).toBe(false);
    expect(isIndexable(entry('es', true))).toBe(true);
    expect(isIndexable(entry('es', true, 'for', 'cooking', true))).toBe(false);
  });

  it('emits reciprocal hreflang sets over indexable versions only', () => {
    const index = [entry('en', true), entry('es', true), entry('de', false), entry('ja', true), entry('en', true, 'on', 'macos')];
    const english = alternatesFor(index, slugs, 'for', 'cooking', 'en', 'https://x.test');
    const spanish = alternatesFor(index, slugs, 'for', 'cooking', 'es', 'https://x.test');
    const japanese = alternatesFor(index, slugs, 'for', 'cooking', 'ja', 'https://x.test');
    expect(english.map((item) => [item.hreflang, item.href])).toEqual([
      ['en', 'https://x.test/for/cooking'],
      ['es', 'https://x.test/es/for/cocinar'],
      ['ja', 'https://x.test/ja/for/ryouri'],
    ]);
    // Reciprocity: every member lists exactly the same set, itself included.
    expect(spanish).toEqual(english);
    expect(japanese).toEqual(english);
    // The unreviewed German page is noindex: it emits nothing and nobody points at it.
    expect(alternatesFor(index, slugs, 'for', 'cooking', 'de')).toEqual([]);
    expect(english.some((item) => item.locale === 'de')).toBe(false);
    // A page without translations lists only itself.
    expect(alternatesFor(index, slugs, 'on', 'macos', 'en', 'https://x.test')).toEqual([
      { locale: 'en', hreflang: 'en', href: 'https://x.test/on/macos' },
    ]);
  });

  it('uses BCP 47 hreflang codes for pt-br and zh', () => {
    const index = [entry('en', true), entry('pt-br', true), entry('zh', true)];
    expect(alternatesFor(index, {}, 'for', 'cooking', 'en').map((item) => item.hreflang)).toEqual(['en', 'pt-BR', 'zh-Hans']);
  });

  describe('readContentIndex', () => {
    let dir = '';
    afterAll(async () => {
      if (dir) await rm(dir, { recursive: true, force: true });
    });

    it('walks {kind}/{locale}/{enSlug}.md', async () => {
      dir = await mkdtemp(path.join(tmpdir(), 'at-content-'));
      await mkdir(path.join(dir, 'for', 'en'), { recursive: true });
      await mkdir(path.join(dir, 'for', 'es'), { recursive: true });
      await writeFile(path.join(dir, 'for', 'en', 'cooking.md'), '---\nh1: "Keep your screen on while cooking"\nreviewed: true\n---\n');
      await writeFile(
        path.join(dir, 'for', 'es', 'cooking.md'),
        '---\nh1: "Mantén la pantalla encendida mientras cocinas"\nogTitle: "Pantalla encendida al cocinar"\nreviewed: false\n---\n',
      );
      const index = await readContentIndex(dir);
      expect(index.map(({ kind, locale, enSlug, reviewed, ogTitle }) => ({ kind, locale, enSlug, reviewed, ogTitle }))).toEqual([
        { kind: 'for', locale: 'en', enSlug: 'cooking', reviewed: true, ogTitle: undefined },
        { kind: 'for', locale: 'es', enSlug: 'cooking', reviewed: false, ogTitle: 'Pantalla encendida al cocinar' },
      ]);
    });
  });
});
