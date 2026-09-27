// Injects the REAL locale strings (apps/web/src/i18n/*.json) and the real /for/cooking article excerpts
// into project/Intl.dc.html between the /*L10N*/ ... /*END*/ markers. Idempotent. Reports missing keys.
import { readFileSync, writeFileSync } from 'node:fs';

const REPO = '/home/user/awaketab/apps/web/src';
const file = new URL('./project/Intl.dc.html', import.meta.url);
const KEYS = [
  'tool.pill.idle', 'tool.pill.requesting', 'tool.pill.held', 'tool.pill.lost', 'tool.pill.denied', 'tool.pill.unsupported', 'tool.pill.fallback',
  'tool.preset.p15', 'tool.preset.p30', 'tool.preset.p45', 'tool.preset.p60', 'tool.preset.p120', 'tool.preset.p240', 'tool.preset.pinf', 'tool.preset.pinf.sr',
  'tool.preset.custom', 'tool.preset.until', 'tool.presets',
  'tool.ring.start', 'tool.ring.stop', 'tool.extend.add15', 'tool.timer.remaining', 'tool.timer.until', 'tool.timer.paused',
  'tool.advice.hidden_document', 'tool.advice.retry', 'tool.advice.learn',
  'tool.fallback.consent.accept', 'tool.fallback.consent.start', 'tool.fallback.consent.body', 'tool.fallback.cpu',
  'tool.skip', 'tool.header.settings', 'tool.header.theme', 'stats.open', 'settings.theme', 'settings.theme.light', 'settings.theme.dark', 'settings.theme.auto',
  'i18n.suggest', 'i18n.suggest.accept', 'i18n.suggest.dismiss',
  'content.translation.pending', 'content.translation.original', 'content.verified', 'content.breadcrumb', 'app.name', 'pro.badge'
];
const META = {
  en: ['en', 'English'], es: ['es', 'Español'], 'pt-br': ['pt-BR', 'Português (Brasil)'], de: ['de', 'Deutsch'], fr: ['fr', 'Français'],
  ja: ['ja', '日本語'], zh: ['zh-Hans', '简体中文'], hi: ['hi', 'हिन्दी']
};

function article(lang) {
  const src = readFileSync(`${REPO}/content/for/${lang}/cooking.md`, 'utf8');
  const [, fm, body] = src.split(/^---$/m);
  const scalar = (k) => { const m = fm.match(new RegExp('^' + k + ':\\s*"?(.*?)"?\\s*$', 'm')); return m ? m[1] : ''; };
  const sections = body.split(/^## /m).slice(1).map((s) => {
    const [head, ...rest] = s.split('\n');
    const para = rest.join('\n').split(/\n\s*\n/).map((x) => x.trim()).find((x) => x && !/^(\d+\.|-|\*|\||>|<)/.test(x));
    const first = rest.join('\n').trim();
    return { h2: head.trim(), p: para ?? '', prose: first && !/^(\d+\.|-|\*|\|)/.test(first) };
  }).filter((s) => s.prose && s.p);
  return { h1: scalar('h1'), limit: scalar('honestLimit'), verified: scalar('lastVerified'), h2a: sections[0].h2, p1: sections[0].p, h2b: sections[1].h2, p2: sections[1].p };
}

const L = {};
const missing = [];
for (const [code, [html, label]] of Object.entries(META)) {
  const j = JSON.parse(readFileSync(`${REPO}/i18n/${code}.json`, 'utf8'));
  const s = {};
  for (const k of KEYS) { if (j[k] === undefined) missing.push(code + ' ' + k); else s[k] = j[k]; }
  L[code] = { html, label, s };
  if (code !== 'en') L[code].a = article(code);
}
const src = readFileSync(file, 'utf8');
const out = src.replace(/\/\*L10N\*\/[\s\S]*?\/\*END\*\//, '/*L10N*/' + JSON.stringify(L).replace(/'/g, '\\u0027') + '/*END*/');
writeFileSync(file, out);
console.log('injected', Object.keys(L).length, 'locales,', KEYS.length, 'keys; missing:', missing.length ? missing.join(', ') : 'none');
for (const c of Object.keys(L)) if (L[c].a) console.log(c, '|', L[c].a.h1, '|', L[c].a.h2a, '|', L[c].a.h2b, '|', L[c].a.p1.length, L[c].a.p2.length);
