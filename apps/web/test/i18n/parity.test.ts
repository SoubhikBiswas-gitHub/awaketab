import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/i18n/locales';

const I18N = path.resolve('apps/web/src/i18n');
const SRC = path.resolve('apps/web/src');

async function catalog(locale: string): Promise<Record<string, string>> {
  return JSON.parse(await readFile(path.join(I18N, `${locale}.json`), 'utf8')) as Record<string, string>;
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)(?:,|\})/gu)].map((match) => match[1] ?? '').sort();
}

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(target)));
    else if (/\.(?:ts|astro)$/u.test(entry.name)) files.push(target);
  }
  return files;
}

describe('i18n catalogs', () => {
  it('keeps English t() isolated from other locale lookups', async () => {
    const { createT, t } = await import('../../src/i18n/load');
    const hi = createT('hi');
    expect(hi('tool.preset.p15')).not.toBe(t('tool.preset.p15'));
    expect(t('page.preset.title', { label: '15 min' })).toBe('Keep the screen awake for 15 min — AwakeTab');
  });

  it('has exact key and placeholder parity in all eight locales', async () => {
    const english = await catalog('en');
    const keys = Object.keys(english).sort();
    for (const locale of LOCALES) {
      const translated = await catalog(locale);
      expect(Object.keys(translated).sort(), `${locale} keys`).toEqual(keys);
      for (const key of keys) {
        expect(placeholders(translated[key] ?? ''), `${locale}:${key}`).toEqual(placeholders(english[key] ?? ''));
      }
    }
  });

  it('defines every literal translation key used by source', async () => {
    const english = await catalog('en');
    const missing = new Set<string>();
    for (const file of await sourceFiles(SRC)) {
      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/gu)) {
        const key = match[1];
        if (key && !(key in english) && !key.includes('${')) missing.add(key);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('keeps translated content slugs unique and ASCII', async () => {
    const slugs = JSON.parse(await readFile(path.join(I18N, 'slugs.json'), 'utf8')) as Record<
      string,
      Record<string, Record<string, string>>
    >;
    for (const collection of Object.values(slugs)) {
      for (const locale of LOCALES) {
        const values = Object.values(collection).flatMap((translations) => translations[locale] ?? []);
        expect(new Set(values).size).toBe(values.length);
        for (const value of values) expect(value).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
      }
    }
  });
});
