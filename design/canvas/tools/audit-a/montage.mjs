import { createRequire } from 'node:module';
const require = createRequire('/Users/soubhik/Work/github/awaketab/package.json');
const sharp = require('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const [out, scale, cols, ...files] = process.argv.slice(2);
const S = +scale, C = +cols;
const imgs = [];
for (const f of files) { const m = await sharp(f).metadata(); const w = Math.round(m.width * S), h = Math.round(m.height * S); imgs.push({ buf: await sharp(f).resize(w, h).toBuffer(), w, h }); }
const cw = Math.max(...imgs.map((i) => i.w)), rows = Math.ceil(imgs.length / C);
const rh = []; for (let r = 0; r < rows; r++) rh.push(Math.max(...imgs.slice(r * C, r * C + C).map((i) => i.h)));
const W = C * cw + (C - 1) * 8, H = rh.reduce((a, b) => a + b, 0) + (rows - 1) * 8;
const comp = imgs.map((im, i) => ({ input: im.buf, left: (i % C) * (cw + 8), top: rh.slice(0, Math.floor(i / C)).reduce((a, b) => a + b + 8, 0) }));
await sharp({ create: { width: W, height: H, channels: 3, background: '#ff00ff' } }).composite(comp).png().toFile(out);
