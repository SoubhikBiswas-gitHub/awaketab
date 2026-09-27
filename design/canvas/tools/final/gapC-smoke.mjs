// Gap agent C smoke (27 Sep 2026): the P-LANG footer on the Pro / Growth web pages, the Language row in the extension
// options, the Brand additions, D-R20 tokens, the owner padding fixes that change geometry, and the two new wrappers.
// Writes nothing. usage: node design/canvas/tools/final/gapC-smoke.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { load, missing, balance, dir } from '../../ProLib.mjs';

globalThis.document = globalThis.document ?? { querySelector: () => ({ focus() {} }), querySelectorAll: () => [], getElementById: () => ({ focus() {} }), activeElement: null };
let bad = 0, checks = 0;
const fail = (m) => { bad++; if (bad < 40) console.log('FAIL', m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };
const ESC = { key: 'Escape', preventDefault() {}, currentTarget: { querySelector: () => ({ focus() {} }) } };
const ORDER = 'English|Español|Português (Brasil)|Deutsch|Français|日本語|简体中文|हिन्दी';
const prim = readFileSync(new URL('../PRIMITIVES.md', dir), 'utf8');
const LANGJS = prim.split('```js\n')[2].split('```')[0];

// 1. Footer language switcher on the web pages (PRIMITIVES.md P-LANG, footer variant).
const PAGES = {
  Pro: [{}, () => '/pro'],
  ProActivate: [{ state: ['idle', 'error', 'success'], ext: [false, true] }, () => '/pro/activate'],
  ProManage: [{ empty: [false, true] }, () => '/pro/manage'],
  GrowthPlanHelper: [{ answer: ['free', 'once', 'year', 'site', 'screens'] }, () => '/pro'],
  GrowthB2B: [{ variant: ['recipe', 'kiosk'] }, (p) => (p.variant === 'kiosk' ? '/kiosk' : '/for/cooking')]
};
const product = (axes) => Object.entries(axes).reduce((acc, [k, vs]) => acc.flatMap((a) => vs.map((v) => ({ ...a, [k]: v }))), [{}]);
for (const [name, [extra, route]] of Object.entries(PAGES)) {
  const f = name + '.dc.html', b = load(f);
  ok(b.src.includes(LANGJS), name + ' AT-LANG v1 JS identical to PRIMITIVES.md');
  ok(!balance(f).length, name + ' unbalanced ' + balance(f).join(','));
  ok(b.markup.includes('onKeyDown="{{lang.key}}"') && b.markup.indexOf('onKeyDown="{{lang.key}}"') < b.markup.indexOf('</footer>'), name + ' footer control inside the footer');
  ok(/\.at-chev\{transition:transform \.6s var\(--ease\)\}/.test(b.src), name + ' .at-chev rule');
  const schema = JSON.parse(b.src.split("data-props='")[1].split("'>")[0]);
  ok(schema.language && schema.language.options.join() === 'closed,open' && Object.keys(schema)[0] !== 'language', name + ' language prop (after the existing props)');
  for (const p of product(Object.assign({ layout: ['phone', 'tablet', 'desktop'], theme: ['light', 'dark'], language: ['closed', 'open'] }, extra))) {
    const c = new b.Component(p), v = c.renderVals(), tag = name + ' ' + JSON.stringify(p);
    const miss = missing(b.markup, v);
    ok(!miss.length, tag + ' missing ' + miss.join(','));
    const L = v.lang, open = p.language === 'open';
    ok(L.open === open && L.expanded === String(open), tag + ' language prop');
    ok(L.sheet === (open && p.layout === 'phone') && L.pop === (p.layout !== 'phone'), tag + ' sheet on phone, popover on tablet and desktop');
    ok(L.rows.map((r) => r.name).join('|') === ORDER, tag + ' locale order');
    ok(L.rows.map((r) => r.hreflang).join(' ') === 'en es pt-BR de fr ja zh-Hans hi', tag + ' hreflang');
    ok(L.rows[0].cur === 'true' && L.rows[0].note === 'Current' && L.rows.slice(1).every((r) => r.cur === 'false' && r.note === 'Translation in review'), tag + ' notes');
    const home = L.rows.map((r) => r.href).join(' ');
    const want = route(p) === '/for/cooking'
      ? '/for/cooking /es/for/cocinar /pt-br/for/cozinhar /de/for/kochen /fr/for/cuisine /ja/for/cooking /zh/for/cooking /hi/for/cooking'
      : route(p) + ' /es/ /pt-br/ /de/ /fr/ /ja/ /zh/ /hi/';
    ok(home === want, tag + ' routes ' + home);
    ok(L.aria === 'Language: English' && L.label === 'English', tag + ' trigger name');
  }
  for (const layout of ['phone', 'desktop']) {
    const c = new b.Component({ layout, theme: 'dark' });
    let v = c.renderVals();
    v.lang.toggle(); v = c.renderVals(); ok(v.lang.open && v.lang.chev === 'rotate(180deg)', name + ' toggle opens ' + layout);
    v.lang.key(ESC); v = c.renderVals(); ok(!v.lang.open, name + ' Esc closes ' + layout);
  }
}

// 2. Extension options: Language row in "Look and language" (settings variant, radio rows stored in settings.locale).
{
  const f = 'ExtOptions.dc.html', b = load(f);
  ok(b.src.includes(LANGJS), 'ExtOptions AT-LANG v1 JS identical to PRIMITIVES.md');
  ok(!balance(f).length, 'ExtOptions unbalanced');
  ok(!/<select id="sel-lang"/.test(b.markup), 'ExtOptions: the language <select> is replaced by the row');
  const look = b.markup.indexOf('Look and language'), row = b.markup.indexOf('{{lang.btnId}}');
  ok(look > 0 && row > look, 'ExtOptions: Language row sits in Look and language');
  for (const theme of ['light', 'dark']) for (const pro of [true, false]) for (const language of ['closed', 'open']) {
    const c = new b.Component({ theme, pro, language }), v = c.renderVals();
    const miss = missing(b.markup, v);
    ok(!miss.length, 'ExtOptions ' + [theme, pro, language] + ' missing ' + miss.join(','));
    ok(v.lang.open === (language === 'open') && !v.lang.sheet && !v.lang.pop, 'ExtOptions settings variant is inline');
    ok(v.langRows.length === 9 && v.langRows[0].name === 'Browser language' && v.langRows.slice(1).map((r) => r.name).join('|') === ORDER, 'ExtOptions rows');
    ok(parseInt(v.H, 10) >= (pro ? 3890 : 4142) + (language === 'open' ? 485 : 0), 'ExtOptions height grows with the open list ' + v.H);
  }
  const c = new b.Component({ theme: 'dark', pro: true, language: 'open' });
  let v = c.renderVals();
  ok(v.langRows[0].cur === 'true' && v.langNow === 'Browser language (English)', 'ExtOptions default is the browser language');
  v.langRows[6].pick(); v = c.renderVals();
  ok(v.langRows[6].cur === 'true' && v.langNow === '日本語' && v.langRows[6].note === 'Current', 'ExtOptions pick 日本語 ' + v.langNow);
  v.langKey({ key: 'ArrowDown', preventDefault() {} }); v = c.renderVals();
  ok(v.langRows[7].cur === 'true', 'ExtOptions ArrowDown selects the next row');
  v.langKey({ key: 'Home', preventDefault() {} }); v = c.renderVals();
  ok(v.langRows[0].cur === 'true', 'ExtOptions Home selects the first row');
  v.langKey({ key: 'Escape', preventDefault() {} }); v = c.renderVals();
  ok(!v.lang.open, 'ExtOptions Esc closes the list');
}

// 3. Brand: the D-R20 button family and the language switcher in the component inventory.
{
  const b = load('Brand.dc.html'), v = new b.Component({}).renderVals();
  ok(!missing(b.markup, v).length && !balance('Brand.dc.html').length, 'Brand renders');
  ok(v.btnThemes.length === 2 && v.btnThemes.every((x) => x.raised === (x.name === 'Light' ? '#E3E9F1' : '#26324B')), 'Brand button chart uses raised per theme');
  ok(v.inventory.some((x) => x.name === 'Language switcher') && v.inventory.some((x) => /language/.test(x.spec)), 'Brand inventory lists the language switcher');
  ok(v.langRows.length === 4 && v.H === '1470px', 'Brand language sample and height ' + v.H);
  ok(/\bStop<\/span>/.test(b.markup) && b.markup.includes('background: {{b.raised}}; color: {{b.ink}}'), 'Brand Stop is raised + ink');
}

// 4. D-R20: no ink-filled neutral buttons left in my batch-2a files.
for (const f of readdirSync(dir).filter((x) => /^(Pro|ProActivate|ProManage|ExtPopup|ExtOptions|ExtBadges|ExtEdge|Welcome|Store|Growth|Brand)\w*\.dc\.html$/.test(x))) {
  const s = readFileSync(new URL(f, dir), 'utf8');
  if (s.length < 2000) continue;
  ok(!/primaryBg: '#(EAF0F7|0E1726)'/.test(s), f + ' primaryBg is an ink slab');
  ok(!/primaryBg: '#[0-9A-F]{6}'/.test(s) || (/primaryBg: '#26324B'/.test(s) && /primaryBg: '#E3E9F1'/.test(s)), f + ' primaryBg is raised');
}

// 5. Owner padding rule: geometry that changed (the rendered check is tools/gap-c/padscan.mjs).
{
  const e = load('ExtEdge.dc.html').markup;
  ok(e.includes('gap: 12px; padding: 16px; border-radius: 16px; background: {{lampFaint}}'), 'ExtEdge extend card padding 16');
  ok(e.includes('gap: 8px; padding: 16px 16px 20px; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{lampLine}}'), 'ExtEdge Pro panel 20 below its buttons');
  ok(!e.includes('Works with the tab hidden.'), 'ExtEdge tips drop the line the status already says');
  const pro = load('Pro.dc.html'), pv = new pro.Component({ layout: 'phone' }).renderVals();
  ok(pv.figPad === '16px 16px 20px' && new pro.Component({ layout: 'desktop' }).renderVals().figPad === '24px', 'Pro figure padding');
  ok(load('GrowthProMoment.dc.html').markup.includes('padding: 16px; border-radius: 12px; background: {{t.field}}'), 'GrowthProMoment stat tiles padding 16');
}

// 6. Wrappers: every Pro and Growth-page wrapper matches its base's own size; the two new tablet boards exist.
const NEW = { ProActivateTablet: ['ProActivate', 820, 1602, { layout: 'tablet', theme: 'dark', state: 'error', error: 'activation_limit' }], ProManageTablet: ['ProManage', 820, 1104, { layout: 'tablet', theme: 'light' }] };
for (const [f, [base, w, h, props]] of Object.entries(NEW)) {
  const src = readFileSync(new URL(f + '.dc.html', dir), 'utf8');
  const attrs = Object.entries(props).map(([k, x]) => k + '="' + x + '"').join(' ');
  ok(src.includes(`<dc-import name="${base}" ${attrs} hint-size="${w}px,${h}px"></dc-import>`), f + ' import');
  ok(src.includes(`width: ${w}px; height: ${h}px`) && src.includes(`"$preview":{"width":${w},"height":${h}}`) && src.length < 700, f + ' shape');
}
for (const f of readdirSync(dir).filter((x) => /^(Pro|GrowthPlan|GrowthB2B)\w*\.dc\.html$/.test(x))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  const m = /<dc-import name="(\w+)" ([^>]*) hint-size="(\d+)px,(\d+)px">/.exec(src);
  if (!m) continue;
  const props = Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [x[1], x[2] === 'true' ? true : x[2] === 'false' ? false : x[2]]));
  const b = load(m[1] + '.dc.html'), v = new b.Component(props).renderVals();
  ok(!missing(b.markup, v).length, f + ' missing');
  ok(v.W === m[3] + 'px' && v.H === m[4] + 'px', f + ' size ' + m[3] + 'x' + m[4] + ' vs base ' + v.W + ' ' + v.H);
  ok(src.includes(`width: ${m[3]}px; height: ${m[4]}px`) && src.includes(`"$preview":{"width":${m[3]},"height":${m[4]}}`), f + ' root and preview agree');
}
console.log(bad ? 'FAILURES: ' + bad + ' of ' + checks : 'ALL PASS (gap C) · ' + checks + ' checks');
