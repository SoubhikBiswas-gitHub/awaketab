import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const ruleName = 'awaketab/button-geometry';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (prop, sel) =>
    `${prop} on "${sel}": a button's size comes from its size class (sm, md, lg), set once in the button stylesheet (DESIGN.md §11.8)`,
});
const OWN = /^at-(?:button|btn)(?:-(?:sm|lg|cook|primary|stop|quiet|secondary|lamp|big|medium|sec|full))?$/u;
const SIZED =
  /^(?:(?:min-|max-)?(?:block-size|height)|padding(?:-[a-z]+)*|font|font-size|line-height|border-radius|border(?:-[a-z]+)*-radius)$/u;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['apps/web/src', 'apps/extension/entrypoints', 'apps/extension/src'];
const MARKUP = new Set(['.astro', '.html', '.ts', '.tsx']);

// Classes that sit on a button next to at-button / at-btn (or on a <Button>) must not resize it either.
function companions() {
  const found = new Set();
  const take = (list) => {
    for (const c of list.split(/\s+/u)) if (/^[a-z][\w-]*$/u.test(c) && !OWN.test(c)) found.add(c);
  };
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (MARKUP.has(extname(name))) {
        const src = readFileSync(path, 'utf8');
        for (const m of src.matchAll(/["'`]([^"'`\n]*(?<![\w-])at-(?:button|btn)(?![\w-])[^"'`\n]*)["'`]/gu))
          take(m[1]);
        for (const m of src.matchAll(/<Button\b[^>]*?\bclass="([^"]*)"/gu)) take(m[1]);
      }
    }
  };
  for (const dir of SOURCES) walk(join(ROOT, dir));
  return found;
}

// The subject of each selector in a list: the last compound at the top level, e.g. `.at-dock .at-button` → `.at-button`.
function subjects(list) {
  const out = [];
  let depth = 0;
  let start = 0;
  let cut = 0;
  for (let i = 0; i <= list.length; i++) {
    const ch = list[i];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (depth === 0 && (ch === ',' || ch === undefined)) {
      out.push(list.slice(Math.max(start, cut), i).trim());
      start = i + 1;
      cut = start;
    } else if (depth === 0 && /[\s>+~]/u.test(ch)) cut = i + 1;
  }
  return out;
}

let classes;
const isButton = (sel) => {
  classes ??= companions();
  return subjects(sel).some((subject) => {
    if (subject.includes('::')) return false;
    const own = subject.replace(/:not\([^)]*\)/gu, '');
    for (const m of own.matchAll(/\.([a-z][\w-]*)/gu)) if (OWN.test(m[1]) || classes.has(m[1])) return true;
    return false;
  });
};

const rule = (enabled) => (root, result) => {
  if (!enabled) return;
  root.walkDecls((decl) => {
    if (!SIZED.test(decl.prop)) return;
    const sel = decl.parent?.selector;
    if (!sel || !isButton(sel)) return;
    stylelint.utils.report({
      ruleName,
      result,
      node: decl,
      message: messages.rejected(decl.prop, sel.replace(/\s+/gu, ' ')),
    });
  });
};
rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
