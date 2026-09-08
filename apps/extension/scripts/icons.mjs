import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const publicDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public',
);

await mkdir(publicDirectory, { recursive: true });
await Promise.all(
  [16, 32, 48, 128].map((size) =>
    writeFile(path.join(publicDirectory, `icon-${size}.png`), png),
  ),
);
