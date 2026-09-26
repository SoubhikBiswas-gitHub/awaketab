// Extension icons (16/32/48/128) — the ring motif (docs/00 §1: progress ring with a glowing dot at 12
// o'clock) rasterised in plain JavaScript with 4×4 supersampling and written as PNG with zlib. No clock,
// no randomness and no image library, so the bytes are identical on every run (reproducible zip).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const AMBER = [0xb8, 0x6e, 0x00];
const GLOW = [0xff, 0xb8, 0x4d];
const ARC_END_DEG = 300;

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

/** Encodes straight-alpha RGBA rows as a PNG (colour type 6, no filter, zlib level 9). */
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

/** Colour of the topmost shape at (x, y) in a unit square, or null. */
function sample(x, y) {
  const cx = 0.5;
  const cy = 0.5;
  const stroke = 0.15;
  const radius = 0.5 - stroke / 2 - 0.06;
  const dotR = stroke * 0.95;
  const dx = x - cx;
  const dy = y - cy;
  const dotY = cy - radius;
  if (dx * dx + (y - dotY) ** 2 <= dotR * dotR) return [...GLOW, 255];
  const d = Math.hypot(dx, dy);
  if (Math.abs(d - radius) > stroke / 2) return null;
  // Clockwise angle from 12 o'clock.
  const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  if (angle <= ARC_END_DEG) return [...AMBER, 255];
  return [...AMBER, 90];
}

export function ringPixels(size, ss = 4) {
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          const c = sample((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size);
          if (!c) continue;
          const alpha = c[3] / 255;
          r += c[0] * alpha;
          g += c[1] * alpha;
          b += c[2] * alpha;
          a += alpha;
        }
      }
      const i = (py * size + px) * 4;
      const n = ss * ss;
      if (a > 0) {
        out[i] = Math.round(r / a);
        out[i + 1] = Math.round(g / a);
        out[i + 2] = Math.round(b / a);
      }
      out[i + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

export function ringPng(size) {
  return encodePng(size, size, ringPixels(size));
}

export const ICON_SIZES = [16, 32, 48, 128];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
  await mkdir(publicDirectory, { recursive: true });
  await Promise.all(ICON_SIZES.map((size) => writeFile(path.join(publicDirectory, `icon-${size}.png`), ringPng(size))));
}
