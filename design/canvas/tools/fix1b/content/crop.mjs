// node crop.mjs NAME Y H  -> crops/NAME-Y.png (clip of shots/NAME.png)
import { readFileSync } from 'node:fs';
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const [name, y, h] = [process.argv[2], +process.argv[3], +(process.argv[4] || 1400)];
const buf = readFileSync('shots/' + name + '.png');
const w = buf.readUInt32BE(16);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: w, height: h } });
await p.setContent(`<body style="margin:0"><img src="data:image/png;base64,${buf.toString('base64')}" style="display:block;margin-top:-${y}px"></body>`);
await p.screenshot({ path: `crops/${name}-${y}.png` }); await b.close(); console.log('ok');
