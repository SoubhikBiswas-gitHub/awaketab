import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALE_META, RTL_LANGUAGES, textDirection } from '../../src/i18n/locales';

// E6-T07: RTL readiness for the phase-2 `ar` locale (docs/07 §6). CSS files are covered by stylelint's
// liberty/use-logical-spec; this test covers the other half — Tailwind utilities written in markup.
const SRC = path.resolve('apps/web/src');

async function files(directory: string, pattern: RegExp): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...(await files(target, pattern)));
    else if (pattern.test(entry.name)) out.push(target);
  }
  return out;
}

// Physical-direction utilities and their logical replacements: ml/mr → ms/me, pl/pr → ps/pe,
// left/right → start/end (inset), border-l/r → border-s/e, rounded-l/r → rounded-s/e,
// text-left/right → text-start/end, float/clear-left/right → float/clear-start/end.
const PHYSICAL =
  /(?<![\w-])(?:[\w-]+(?:\[[^\]]*\])?:)*(?:-?m[lr]|p[lr]|scroll-[mp][lr]|border-[lr]|rounded-[lr]|rounded-[tb][lr]|-?(?:left|right)-[\w./[\]%]+|(?:text|float|clear)-(?:left|right))(?:-[\w./[\]%]+)?(?![\w-])/gu;

describe('RTL readiness', () => {
  it('derives dir from the language tag', () => {
    expect(textDirection('ar')).toBe('rtl');
    expect(textDirection('ar-EG')).toBe('rtl');
    expect(textDirection('he')).toBe('rtl');
    for (const language of RTL_LANGUAGES) expect(textDirection(language)).toBe('rtl');
    for (const meta of Object.values(LOCALE_META)) expect(textDirection(meta.htmlLang), meta.htmlLang).toBe('ltr');
  });

  it('plumbs dir through the one document layout', async () => {
    const layout = await readFile(path.join(SRC, 'layouts/BaseLayout.astro'), 'utf8');
    expect(layout).toMatch(/<html lang=\{localeMeta\.htmlLang\} dir=\{textDirection\(localeMeta\.htmlLang\)\}>/u);
    const pages = await files(path.join(SRC, 'pages'), /\.astro$/u);
    for (const page of pages) {
      const source = await readFile(page, 'utf8');
      expect(source.includes('<html'), `${path.relative(SRC, page)} must render through BaseLayout`).toBe(false);
    }
  });

  it('uses only logical Tailwind direction utilities in markup', async () => {
    const offenders: string[] = [];
    const sources = [
      ...(await files(path.join(SRC, 'components'), /\.(?:astro|tsx|ts)$/u)),
      ...(await files(path.join(SRC, 'layouts'), /\.astro$/u)),
      ...(await files(path.join(SRC, 'pages'), /\.astro$/u)),
      ...(await files(path.join(SRC, 'tool'), /\.ts$/u)),
    ];
    for (const file of sources) {
      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(PHYSICAL)) offenders.push(`${path.relative(SRC, file)}: ${match[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('mirrors direction-implying icons under dir="rtl"', async () => {
    const tokens = await readFile(path.join(SRC, 'styles/tokens.css'), 'utf8');
    expect(tokens).toMatch(/\[dir="rtl"\][^{]*breadcrumb-separator[^{]*\{\s*transform: scaleX\(-1\);/u);
  });
});
