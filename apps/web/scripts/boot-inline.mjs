// The boot script as pages inline it: src/boot/boot.js minified, about 1.8 KB gz less HTML on every page.
// astro.config.mjs serves it for `boot.js?raw`; headers.mjs hashes the same text for the CSP.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BOOT_FILE = path.join(HERE, '../src/boot/boot.js');
export const THEMES_FILE = path.join(HERE, '../public/assets/themes.css');

// /assets/* is served immutable, so the colour-theme sheet's URL carries a hash of its content.
export function themesHref() {
  const v = createHash('sha256').update(readFileSync(THEMES_FILE)).digest('hex').slice(0, 10);
  return `/assets/themes.css?v=${v}`;
}

export function bootInline(source = readFileSync(BOOT_FILE, 'utf8')) {
  const code = source.replace("'__AT_THEMES__'", JSON.stringify(themesHref()));
  return transformSync(code, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code.trim();
}
