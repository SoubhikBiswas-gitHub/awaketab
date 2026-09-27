// The boot script as pages inline it: src/boot/boot.js minified, about 1.8 KB gz less HTML on every page.
// astro.config.mjs serves it for `boot.js?raw`; headers.mjs hashes the same text for the CSP.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

export const BOOT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/boot/boot.js');

export function bootInline(source = readFileSync(BOOT_FILE, 'utf8')) {
  return transformSync(source, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code.trim();
}
