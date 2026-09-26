import { createRequire } from 'node:module';
const require = createRequire('/Users/soubhik/Work/github/awaketab/package.json');
const sharp = require('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const [src, out, seg = '1600', cols = '1'] = process.argv.slice(2);
const m = await sharp(src).metadata();
const S = +seg; const n = Math.ceil(m.height / S); const C = +cols;
// tile segments side by side (C per row image)
const tiles = [];
for (let i = 0; i < n; i++) tiles.push(await sharp(src).extract({ left: 0, top: i * S, width: m.width, height: Math.min(S, m.height - i * S) }).toBuffer());
for (let g = 0; g < Math.ceil(n / C); g++) {
  const part = tiles.slice(g * C, g * C + C);
  const img = sharp({ create: { width: m.width * part.length + 10 * (part.length - 1), height: S, channels: 3, background: '#ff00ff' } }).composite(part.map((b, i) => ({ input: b, left: i * (m.width + 10), top: 0 })));
  await img.png().toFile(out.replace('.png', '-' + g + '.png'));
}
console.log(n, 'segments');
