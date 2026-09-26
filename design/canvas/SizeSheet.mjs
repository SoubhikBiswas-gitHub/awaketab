// Compose PNGs into one contact sheet. Usage: node SizeSheet.mjs out.png cols scale a.png b.png ...
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');
const [out, cols, scale, ...files] = process.argv.slice(2);
const html = '<!doctype html><body style="margin:0;background:#888"><div style="display:grid;grid-template-columns:repeat(' + cols + ',max-content);gap:8px;padding:8px">' + files.map((f) => '<img src="file://' + f + '" style="zoom:' + scale + '">').join('') + '</div></body>';
const tmp = out + '.html';
writeFileSync(tmp, html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
await p.goto('file://' + tmp);
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
await b.close();
