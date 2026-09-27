#!/usr/bin/env node
// Only `//` comments and tool directives are allowed in source files. Check by default; `--fix` rewrites files.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');

const FIX = process.argv.includes('--fix');
const EXT = /\.(?:ts|tsx|mts|cts|js|mjs|cjs|astro|css)$/u;
const SKIP = /^apps\/web\/public\/|\/(?:dist|\.astro|\.wxt|\.output)\//u;
const DIRECTIVE =
  /^\/\*[*!]?\s*(?:eslint|stylelint|global\s|globals\s|istanbul|c8\s|v8\signore|@ts-|@vitest-environment|prettier-ignore|@vite-ignore|[#@]__PURE__|@license|@preserve)/u;
const CONFIG_TYPE = /^\/\*\*\s*@type\s*\{[^\n]*\}\s*\*\/$/u;

// Plain .js files are type-linted through JSDoc, so a comment made only of tags (@type, @param) stays there.
function typeOnly(comment) {
  const lines = comment
    .slice(2, -2)
    .split('\n')
    .map((l) => l.trim().replace(/^\*+\s*/u, ''))
    .filter(Boolean);
  return comment.startsWith('/**') && lines.length > 0 && lines.every((l) => l.startsWith('@'));
}

function firstLine(comment) {
  return (
    comment
      .slice(2, -2)
      .split('\n')
      .map((l) => l.trim().replace(/^[*!]+\s*/u, ''))
      .find(Boolean) ?? ''
  );
}

function keep(comment, file) {
  if (DIRECTIVE.test(`/* ${firstLine(comment)}`) || comment.includes('@vite-ignore') || comment.includes('__PURE__'))
    return true;
  if (/\.config\.[cm]?js$/u.test(file) && CONFIG_TYPE.test(comment)) return true;
  return file.endsWith('.js') && typeOnly(comment);
}

function scriptKind(file) {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (/\.[cm]?js$/u.test(file)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function scriptComments(text, kind) {
  const sf = ts.createSourceFile('file', text, ts.ScriptTarget.Latest, true, kind);
  const found = new Map();
  const add = (ranges) => {
    for (const r of ranges ?? []) if (r.kind === ts.SyntaxKind.MultiLineCommentTrivia) found.set(r.pos, [r.pos, r.end]);
  };
  const visit = (node) => {
    if (node.kind !== ts.SyntaxKind.JsxText && node.kind !== ts.SyntaxKind.JsxTextAllWhiteSpaces) {
      add(ts.getLeadingCommentRanges(text, node.pos));
      add(ts.getTrailingCommentRanges(text, node.end));
    }
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  return [...found.values()];
}

function cssComments(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === '\\') i++;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out.push([i, stop]);
      i = stop - 1;
    }
  }
  return out;
}

function markupComments(text) {
  const out = [];
  for (const m of text.matchAll(/<!--[\s\S]*?-->/gu)) out.push([m.index, m.index + m[0].length]);
  for (const m of text.matchAll(/\{\s*\/\*[\s\S]*?\*\/\s*\}/gu)) out.push([m.index, m.index + m[0].length]);
  return out;
}

function astroComments(text) {
  const ranges = [];
  const shift = (list, offset) => list.map(([a, b]) => [a + offset, b + offset]);
  let body = 0;
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (fm) {
    const start = text.indexOf(fm[1]);
    ranges.push(...shift(scriptComments(fm[1], ts.ScriptKind.TS), start));
    body = fm.index + fm[0].length;
  }
  const blocks = [];
  for (const m of text.slice(body).matchAll(/<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/gu)) {
    const [whole, tag, attrs = '', inner] = m;
    const start = body + m.index + whole.indexOf('>') + 1;
    blocks.push([body + m.index, body + m.index + whole.length]);
    if (tag === 'style') ranges.push(...shift(cssComments(inner), start));
    else if (!/type="application\/(?:ld\+)?json"/u.test(attrs))
      ranges.push(...shift(scriptComments(inner, ts.ScriptKind.TS), start));
  }
  const inBlock = ([a]) => blocks.some(([s, e]) => a >= s && a < e);
  ranges.push(...shift(markupComments(text.slice(body)), body).filter((r) => !inBlock(r)));
  return ranges;
}

// A comment that is the only content of a block keeps its meaning as one `//` line.
function asLineComment(comment) {
  return `// ${comment
    .replace(/^\/\*+|\*+\/$/gu, '')
    .replace(/\s*\n\s*\*?\s*/gu, ' ')
    .trim()}`;
}

function strip(text, ranges, script) {
  let out = text;
  for (const [pos, end] of [...ranges].sort((x, y) => y[0] - x[0])) {
    const lineStart = out.lastIndexOf('\n', pos - 1) + 1;
    const nl = out.indexOf('\n', end);
    const lineEnd = nl === -1 ? out.length : nl;
    const before = out.slice(lineStart, pos);
    const after = out.slice(end, lineEnd);
    let a = pos;
    let b = end;
    let insert = '';
    const emptyBlock =
      script && out.slice(0, pos).trimEnd().endsWith('{') && out.slice(end).trimStart().startsWith('}');
    if (emptyBlock) {
      insert = asLineComment(out.slice(pos, end));
      if (before.trim() !== '') insert = `\n${before.match(/^\s*/u)[0]}  ${insert}\n${before.match(/^\s*/u)[0]}`;
    } else if (before.trim() === '' && after.trim() === '') {
      a = lineStart;
      b = nl === -1 ? out.length : nl + 1;
      const blankBefore = a === 0 || (a >= 2 && out[a - 1] === '\n' && out[a - 2] === '\n');
      if (blankBefore && out[b] === '\n') b += 1;
    } else if (after.trim() === '') {
      while (a > lineStart && /[ \t]/u.test(out[a - 1])) a--;
    } else if (before.trim() === '') {
      while (b < lineEnd && /[ \t]/u.test(out[b])) b++;
    } else {
      insert = out.slice(pos, end).includes('\n') ? '\n' : ' ';
      while (a > lineStart && /[ \t]/u.test(out[a - 1])) a--;
      while (b < lineEnd && /[ \t]/u.test(out[b])) b++;
      if (insert === ' ' && (/[([{]$/u.test(out.slice(lineStart, a)) || /^[)\]},;]/u.test(out.slice(b, lineEnd))))
        insert = '';
    }
    out = out.slice(0, a) + insert + out.slice(b);
  }
  return out;
}

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter((f) => EXT.test(f) && !SKIP.test(f));

let total = 0;
const report = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const all = file.endsWith('.astro')
    ? astroComments(text)
    : file.endsWith('.css')
      ? cssComments(text)
      : scriptComments(text, scriptKind(file));
  const ranges = all.filter(([a, b]) => !keep(text.slice(a, b), file));
  if (ranges.length === 0) continue;
  total += ranges.length;
  report.push(`${file}: ${String(ranges.length)}`);
  if (FIX) writeFileSync(file, strip(text, ranges, !file.endsWith('.css')));
}

if (FIX) {
  console.log(`comments: removed ${String(total)} from ${String(report.length)} files`);
} else if (total > 0) {
  console.error(
    `comments: ${String(total)} block, JSDoc or HTML comments; only // comments are allowed (run node scripts/comments.mjs --fix)`,
  );
  console.error(report.join('\n'));
  process.exit(1);
}
