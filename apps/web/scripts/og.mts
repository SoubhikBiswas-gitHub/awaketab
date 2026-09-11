import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderOgPng, type IOgFont } from '../src/lib/og';

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
    return [await font('@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff', 'Noto Sans SC'), latin];
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

await mkdir(OUTPUT, { recursive: true });
for (const locale of LOCALES) {
  const catalog = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf8')) as Record<string, string>;
  const png = await renderOgPng({
    title: catalog['page.home.h1'] ?? 'Keep your screen awake',
    eyebrow: 'AwakeTab',
    locale,
    fonts: await fontFor(locale),
  });
  await writeFile(path.join(OUTPUT, `home-${locale}.png`), png);
}

const english = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/en.json'), 'utf8')) as Record<string, string>;
const pages = ['15m', '30m', '45m', '1h', '2h', '4h', '8h', 'for', 'on', 'vs', 'guides', 'learn', 'about', 'privacy', 'terms', 'changelog', 'pro'];
for (const page of pages) {
  const png = await renderOgPng({
    title: english[`page.${page}.h1`] ?? english['page.home.h1'] ?? 'AwakeTab',
    eyebrow: 'AwakeTab',
    locale: 'en',
    fonts: [latin],
  });
  await writeFile(path.join(OUTPUT, `${page}-en.png`), png);
}
