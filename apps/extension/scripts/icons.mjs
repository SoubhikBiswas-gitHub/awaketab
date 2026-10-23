// Rasterise the shared screen-and-power mark at each Chrome icon size. The SVG is also used by the
// extension pages and store artwork, keeping the published identity consistent and reproducible.
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const requireWeb = createRequire(new URL('../../web/package.json', import.meta.url));
const { Resvg } = requireWeb('@resvg/resvg-js');
export const ICON_SVG = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function iconPixels(size) {
  const image = new Resvg(ICON_SVG, { fitTo: { mode: 'width', value: size } }).render();
  return Buffer.from(image.pixels);
}

export function iconPng(size) {
  return encodePng(size, size, iconPixels(size));
}

export const ICON_SIZES = [16, 32, 48, 128];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
  await mkdir(publicDirectory, { recursive: true });
  await Promise.all(ICON_SIZES.map((size) => writeFile(path.join(publicDirectory, `icon-${size}.png`), iconPng(size))));
}
