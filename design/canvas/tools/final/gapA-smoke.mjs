// Gap agent A smoke (27 Sep 2026): D-R20 buttons, the Main Settings language row, the Sys footer language switcher,
// Sys checkout on tablet and Pro lapsed on phone, and the nine new wrappers. Writes nothing.
// usage: node design/canvas/tools/final/gapA-smoke.mjs
import { readFileSync } from 'node:fs';
import { load, missing, balance, dir } from '../../ProLib.mjs';

let bad = 0;
const fail = (m) => { bad++; if (bad < 40) console.log('FAIL', m); };
const ok = (c, m) => { if (!c) fail(m); };

// 1. No ink-filled neutral buttons left (D-R20).
for (const f of ['Main', 'Extras', 'Ambient', 'PipWindow', 'Sys']) {
  const src = readFileSync(new URL(f + '.dc.html', dir), 'utf8');
  ok(!/primaryBg|primaryInk/.test(src), f + ' still uses primaryBg/primaryInk');
  const off = balance(f + '.dc.html');
  ok(!off.length, f + ' unbalanced ' + off.join(','));
}
{
  const src = readFileSync(new URL('Sys.dc.html', dir), 'utf8');
  ok(/stopBg: '#26324B', stopInk: '#EAF0F7'/.test(src) && /stopBg: '#E3E9F1', stopInk: '#0E1726'/.test(src), 'Sys stop tokens');
}

// 2. Main: language row and list (PRIMITIVES.md P-LANG, settings variant).
const main = load('Main.dc.html');
const ORDER = 'English|Español|Português (Brasil)|Deutsch|Français|日本語|简体中文|हिन्दी';
for (const layout of ['phone', 'small', 'tablet', 'desktop', 'xl']) for (const theme of ['light', 'dark', 'oled']) for (const language of ['closed', 'open']) {
  const c = new main.Component({ status: 'awake', face: 'ring', layout, theme, sheet: 'settings', language });
  const v = c.renderVals();
  const miss = missing(main.markup, v);
  ok(!miss.length, 'Main ' + layout + ' ' + theme + ' ' + language + ' missing ' + miss.join(','));
  ok(v.lang.open === (language === 'open') && v.lang.expanded === String(language === 'open'), 'Main language prop');
  ok(!v.lang.sheet && !v.lang.pop, 'Main settings variant is inline');
  ok(v.lang.rows.length === 8 && v.lang.rows.map((l) => l.name).join('|') === ORDER, 'Main locale order');
  ok(v.lang.rows[0].note === 'Current' && v.lang.rows[0].cur === 'true' && v.lang.rows.slice(1).every((l) => l.note === 'Translation in review' && l.cur === 'false'), 'Main notes');
  ok(v.lang.rows.map((l) => l.href).join(' ') === '/ /es/ /pt-br/ /de/ /fr/ /ja/ /zh/ /hi/', 'Main routes ' + v.lang.rows.map((l) => l.href).join(' '));
  ok(v.lang.rows.map((l) => l.hreflang).join(' ') === 'en es pt-BR de fr ja zh-Hans hi', 'Main hreflang');
}
{
  globalThis.document = globalThis.document ?? { querySelector: () => ({ focus() {} }), activeElement: null };
  const c = new main.Component({ sheet: 'settings', theme: 'dark' });
  let v = c.renderVals();
  v.lang.toggle(); v = c.renderVals(); ok(v.lang.open && v.lang.expanded === 'true' && v.lang.chev === 'rotate(180deg)', 'Main toggle open');
  v.lang.key({ key: 'Escape', preventDefault() {}, currentTarget: { querySelector: () => ({ focus() {} }) } }); v = c.renderVals(); ok(!v.lang.open, 'Main Esc closes');
  ok(/border: 1px solid \{\{t\.line2\}\}; background: \{\{t\.raised\}\}/.test(main.markup), 'Main Stop markup');
  const prim = readFileSync(new URL('../PRIMITIVES.md', dir), 'utf8');
  const js = prim.split('```js\n')[2].split('```')[0];
  ok(main.src.includes(js), 'Main AT-LANG v1 JS identical to PRIMITIVES.md');
}

// 3. Sys: every kind x layout x theme x state, plus the language switcher.
const sys = load('Sys.dc.html');
const H = {};
for (const kind of ['offline', 'notify', 'tabs', 'prolapsed', 'checkout', 'update', 'install']) for (const layout of ['phone', 'tablet', 'desktop']) for (const theme of ['light', 'dark']) for (const state of ['success', 'cancelled', 'failed', 'help', 'grace', 'lapsed']) {
  const c = new sys.Component({ kind, layout, theme, state });
  const v = c.renderVals();
  const miss = missing(sys.markup, v);
  ok(!miss.length, 'Sys ' + [kind, layout, theme, state].join(' ') + ' missing ' + miss.join(','));
  H[[kind, layout, state].join('-')] = v.W + ' x ' + v.H;
}
ok(H['checkout-tablet-success'] === '820px x 1420px', 'Sys tablet checkout size ' + H['checkout-tablet-success']);
ok(H['prolapsed-phone-lapsed'] === '390px x 2824px', 'Sys phone lapsed size ' + H['prolapsed-phone-lapsed']);
ok(H['checkout-desktop-success'] === '1280px x 948px' && H['prolapsed-desktop-lapsed'] === '1280px x 2044px', 'Sys desktop sizes unchanged');
ok(H['offline-tablet-success'] === '1280px x 888px', 'Sys tablet still desktop for other kinds');
for (const layout of ['phone', 'tablet', 'desktop']) {
  const c = new sys.Component({ kind: 'checkout', layout, theme: 'dark', state: 'success' });
  let v = c.renderVals();
  ok(!v.lang.open && v.lang.rows.length === 8, 'Sys lang closed ' + layout);
  v.lang.toggle(); v = c.renderVals();
  ok(v.lang.open && (layout === 'phone' ? v.lang.sheet && !v.lang.pop : v.lang.pop && !v.lang.sheet), 'Sys lang opens as ' + (layout === 'phone' ? 'sheet' : 'popover') + ' on ' + layout);
  ok(v.lang.rows[0].href === '/pro/activate' && v.lang.rows[1].href === '/es/' && v.lang.rows[6].hreflang === 'zh-Hans', 'Sys lang routes ' + v.lang.rows[1].href);
  ok(missing(sys.markup, v).length === 0, 'Sys open missing ' + layout);
  v.lang.key({ key: 'Escape', preventDefault() {}, currentTarget: { querySelector: () => ({ focus() {} }) } }); v = c.renderVals(); ok(!v.lang.open && !v.lang.sheet, 'Sys Esc closes');
  const o = new sys.Component({ kind: 'prolapsed', layout, theme: 'light', state: 'lapsed', language: 'open' }).renderVals();
  ok(o.lang.open && o.lang.rows[0].href === '/pro/manage', 'Sys language prop + manage path');
}

// 4. New wrappers: props exist in the base and the size matches.
const NEW = {
  ToolStatsDesk: ['Main', 1280, 800], ToolStatsTablet: ['Main', 820, 1180], ToolSettingsTablet: ['Main', 820, 1180],
  ExtrasTabletRating: ['Extras', 820, 1180], AmbientClockTablet: ['Ambient', 1180, 820],
  SysCheckoutSuccessPhone: ['Sys', 390, 1660], SysCheckoutFailedPhone: ['Sys', 390, 1312], SysProLapsedPhone: ['Sys', 390, 2824], SysCheckoutSuccessTablet: ['Sys', 820, 1420]
};
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
for (const [f, [base, w, h]] of Object.entries(NEW)) {
  const src = readFileSync(new URL(f + '.dc.html', dir), 'utf8');
  const m = /<dc-import name="(\w+)" ([^>]*) hint-size="(\d+)px,(\d+)px">/.exec(src);
  ok(m && m[1] === base && +m[3] === w && +m[4] === h, f + ' import');
  ok(src.includes(`width: ${w}px; height: ${h}px`) && src.includes(`"$preview":{"width":${w},"height":${h}}`), f + ' size');
  const props = JSON.parse(load(base + '.dc.html').src.split("data-props='")[1].split("'>")[0]);
  const given = Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map((x) => [camel(x[1]), x[2]]));
  for (const [k, val] of Object.entries(given)) {
    ok(props[k], f + ' unknown prop ' + k);
    if (props[k] && props[k].options && props[k].editor === 'enum') ok(props[k].options.includes(val), f + ' bad value ' + k + '=' + val);
  }
  const b = load(base + '.dc.html');
  const c = new b.Component(given);
  const v = c.renderVals();
  ok(!missing(b.markup, v).length, f + ' missing ' + missing(b.markup, v).join(','));
  if (v.W) ok(v.W === w + 'px' && v.H === h + 'px', f + ' base size ' + v.W + ' ' + v.H);
}
console.log(bad ? 'FAILURES: ' + bad : 'ALL PASS (gap A)');
process.exit(bad ? 1 : 0);
