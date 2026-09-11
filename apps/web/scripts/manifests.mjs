import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const HTML_LANG = { es: 'es', 'pt-br': 'pt-BR', de: 'de', fr: 'fr', ja: 'ja', zh: 'zh-Hans', hi: 'hi' };
const source = JSON.parse(await readFile(path.join(ROOT, 'public/manifest.webmanifest'), 'utf8'));

for (const locale of LOCALES) {
  const catalog = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf8'));
  const directory = path.join(ROOT, 'public', locale);
  await mkdir(directory, { recursive: true });
  const manifest = {
    ...source,
    id: `/${locale}/`,
    name: `${catalog['app.name']} — ${catalog['app.tagline']}`,
    description: catalog['page.home.description'],
    start_url: `/${locale}/?source=pwa`,
    scope: `/${locale}/`,
    lang: HTML_LANG[locale],
    shortcuts: source.shortcuts.map((shortcut) => ({
      ...shortcut,
      url: `/${locale}${shortcut.url}`,
    })),
  };
  await writeFile(path.join(directory, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
}
