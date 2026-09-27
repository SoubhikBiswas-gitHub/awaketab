import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderOgPng, type IOgFont } from '../src/lib/og';
import { ogImagePath, readContentIndex, type TSlugMap } from './translations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'public/og');
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;

function arrayBuffer(bytes: Buffer): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function font(relative: string, name: string): Promise<IOgFont> {
  return {
    name,
    data: arrayBuffer(await readFile(path.join(ROOT, 'node_modules', relative))),
  };
}

const latin = await font('@fontsource/inter/files/inter-latin-700-normal.woff', 'Inter');
const fontFor = async (locale: string): Promise<IOgFont[]> => {
  if (locale === 'ja') {
    return [await font('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff', 'Noto Sans JP'), latin];
  }
  if (locale === 'zh') {
    return [
      await font('@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff', 'Noto Sans SC'),
      latin,
    ];
  }
  if (locale === 'hi') {
    return [
      await font(
        '@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff',
        'Noto Sans Devanagari',
      ),
      latin,
    ];
  }
  return [latin];
};

// The language's own name for the image footer (the English images keep `awaketab.com · en`).
const LOCALE_LABEL: Record<string, string> = {
  es: 'Español',
  'pt-br': 'Português (Brasil)',
  de: 'Deutsch',
  fr: 'Français',
  ja: '日本語',
  zh: '简体中文',
  hi: 'हिन्दी',
};

await mkdir(OUTPUT, { recursive: true });
for (const locale of LOCALES) {
  const catalog = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf8')) as Record<
    string,
    string
  >;
  const png = await renderOgPng({
    title: catalog['page.home.h1'] ?? 'Keep your screen awake',
    eyebrow: 'AwakeTab',
    locale,
    ...(LOCALE_LABEL[locale] ? { footer: `awaketab.com · ${LOCALE_LABEL[locale]}` } : {}),
    fonts: await fontFor(locale),
  });
  await writeFile(path.join(OUTPUT, `home-${locale}.png`), png);
}

// E6-T05: one image per translated content page at /og/{lang}/{collection}/{public slug}.png (docs/06 §9),
// title = ogTitle ?? h1, footer = the language's own name. Fonts are read from node_modules at build time
// only; nothing under public/og references them and they never reach dist/.
const slugs = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/slugs.json'), 'utf8')) as TSlugMap;
const fontCache = new Map<string, IOgFont[]>();
// Regenerated from scratch so a renamed slug or a deleted translation leaves no orphan image behind.
for (const locale of Object.keys(LOCALE_LABEL)) await rm(path.join(OUTPUT, locale), { recursive: true, force: true });
for (const page of await readContentIndex(path.join(ROOT, 'src/content'))) {
  if (page.locale === 'en') continue;
  const fonts = fontCache.get(page.locale) ?? (await fontFor(page.locale));
  fontCache.set(page.locale, fonts);
  const target = path.join(ROOT, 'public', ogImagePath(slugs, page.kind, page.enSlug, page.locale));
  await mkdir(path.dirname(target), { recursive: true });
  const png = await renderOgPng({
    title: page.ogTitle ?? page.h1,
    eyebrow: 'AwakeTab',
    locale: page.locale,
    footer: `awaketab.com · ${LOCALE_LABEL[page.locale] ?? page.locale}`,
    fonts,
  });
  await writeFile(target, png);
}

const english = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/en.json'), 'utf8')) as Record<string, string>;
const pages = [
  '15m',
  '30m',
  '45m',
  '1h',
  '2h',
  '4h',
  '8h',
  'for',
  'on',
  'vs',
  'guides',
  'learn',
  'about',
  'privacy',
  'terms',
  'changelog',
  'pro',
  'embed',
  'kiosk',
  'library',
  'extension',
];
for (const page of pages) {
  const png = await renderOgPng({
    title: english[`page.${page}.h1`] ?? english['page.home.h1'] ?? 'AwakeTab',
    eyebrow: 'AwakeTab',
    locale: 'en',
    fonts: [latin],
  });
  await writeFile(path.join(OUTPUT, `${page}-en.png`), png);
}
