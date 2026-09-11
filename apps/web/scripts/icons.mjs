import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function png(size, r, g, b) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const i = row + 1 + x * 4;
      const cx = x + 0.5 - size / 2;
      const cy = y + 0.5 - size / 2;
      const inside = cx * cx + cy * cy <= (size * 0.38) ** 2;
      raw[i] = inside ? r : 0xfa;
      raw[i + 1] = inside ? g : 0xf7;
      raw[i + 2] = inside ? b : 0xf2;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'icon-192.png'), png(192, 0xb8, 0x6e, 0));
await writeFile(path.join(dir, 'icon-512.png'), png(512, 0xb8, 0x6e, 0));
await writeFile(path.join(dir, 'icon-512-maskable.png'), png(512, 0xb8, 0x6e, 0));
await writeFile(path.join(dir, 'apple-touch-icon.png'), png(180, 0xb8, 0x6e, 0));
