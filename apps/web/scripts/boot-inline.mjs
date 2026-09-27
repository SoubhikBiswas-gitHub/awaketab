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
export const FACES_FILE = path.join(HERE, '../public/assets/faces.css');

// /assets/* is served immutable, so each sheet's URL there carries a hash of its content.
const hashed = (file, name) => {
  const v = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);
  return `/assets/${name}?v=${v}`;
};

export const themesHref = () => hashed(THEMES_FILE, 'themes.css');

// The Bold, Horizon and Tide art (docs/05 §3.33): linked by boot.js before first paint when one is the saved face.
export const facesHref = () => hashed(FACES_FILE, 'faces.css');

export function bootInline(source = readFileSync(BOOT_FILE, 'utf8')) {
  const code = source
    .replace("'__AT_THEMES__'", JSON.stringify(themesHref()))
    .replace("'__AT_FACES__'", JSON.stringify(facesHref()));
  return transformSync(code, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code.trim();
}
