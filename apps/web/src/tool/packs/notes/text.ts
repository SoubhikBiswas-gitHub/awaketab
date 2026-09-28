import type { JSONContent } from '@tiptap/core';

const MARKS = [
  ['bold', '**'],
  ['italic', '_'],
  ['strike', '~~'],
] as const;

const sym = (k: string) => MARKS.find(([m]) => m === k)?.[1] ?? '';
const attr = (n: JSONContent, k: string): unknown => n.attrs?.[k];
const escapeMd = (s: string) => s.replace(/[\\*_~`[\]]/gu, '\\$&');

function inline(nodes: JSONContent[] = [], md: boolean): string {
  let out = '';
  // Marks stay open across neighbouring text runs, so "**a** **b**" never becomes "**a****b**".
  let open: string[] = [];
  const close = (keep: string[]) => {
    const cut = open.findIndex((m) => !keep.includes(m));
    if (cut < 0) return;
    for (const m of open.slice(cut).reverse()) out += sym(m);
    open = open.slice(0, cut);
  };
  for (const n of nodes) {
    if (n.type === 'hardBreak') {
      close([]);
      out += md ? '  \n' : '\n';
      continue;
    }
    const text = n.text ?? '';
    if (!md) {
      out += text;
      continue;
    }
    const want = MARKS.map(([k]) => k).filter((k) => n.marks?.some((m) => m.type === k));
    close(want);
    for (const k of want)
      if (!open.includes(k)) {
        open = [...open, k];
        out += sym(k);
      }
    out += escapeMd(text);
  }
  close([]);
  return out;
}

function indent(text: string, pad: string): string {
  return text
    .split('\n')
    .map((l, i) => (i === 0 || !l ? l : pad + l))
    .join('\n');
}

function list(node: JSONContent, md: boolean): string {
  const start = Number(attr(node, 'start') ?? 1) || 1;
  return (node.content ?? [])
    .map((item, i) => {
      let mark = '- ';
      if (node.type === 'orderedList') mark = `${String(start + i)}. `;
      else if (node.type === 'taskList') mark = `${md ? '- ' : ''}[${attr(item, 'checked') === true ? 'x' : ' '}] `;
      const body = (item.content ?? []).map((c) => block(c, md)).join('\n');
      return mark + indent(body, ' '.repeat(mark.length));
    })
    .join('\n');
}

function block(node: JSONContent, md: boolean): string {
  switch (node.type) {
    case 'heading': {
      const text = inline(node.content, md);
      return md ? `${'#'.repeat(Number(attr(node, 'level') ?? 1) || 1)} ${text}` : text;
    }
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return list(node, md);
    case 'horizontalRule':
      return '---';
    case 'blockquote':
      return (node.content ?? [])
        .map((c) => block(c, md))
        .join('\n\n')
        .split('\n')
        .map((l) => (md ? `> ${l}`.trimEnd() : l))
        .join('\n');
    default:
      return inline(node.content, md);
  }
}

function serialise(doc: JSONContent, md: boolean): string {
  return (doc.content ?? [])
    .map((n) => block(n, md))
    .join('\n\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function toMarkdown(doc: JSONContent): string {
  return serialise(doc, true);
}

// Plain text keeps the shape a reader expects: list bullets, numbers and [ ] / [x] for checklist items.
export function toText(doc: JSONContent): string {
  return serialise(doc, false);
}

// For search and titles: every text run, one line per block, no list marks.
export function plainText(doc: JSONContent): string {
  const lines: string[] = [];
  const walk = (n: JSONContent) => {
    if (n.content?.some((c) => c.type === 'text' || c.type === 'hardBreak')) lines.push(inline(n.content, false));
    else for (const c of n.content ?? []) walk(c);
  };
  walk(doc);
  return lines.join('\n');
}

// Words by the page language's rules (CJK has no spaces), with a whitespace split where Intl.Segmenter is missing.
export function countWords(text: string, lang: string): number {
  if (typeof Intl.Segmenter === 'function') {
    let n = 0;
    for (const s of new Intl.Segmenter(lang, { granularity: 'word' }).segment(text)) if (s.isWordLike) n += 1;
    return n;
  }
  return text.split(/\s+/u).filter(Boolean).length;
}

// The day part of a note's date: "Today", "Yesterday", a weekday within the week, then the date.
export function dayLabel(ms: number, now: number, lang: string): string {
  const day = (x: number) => new Date(x).setHours(0, 0, 0, 0);
  const d = Math.round((day(ms) - day(now)) / 86_400_000);
  if (d === 0 || d === -1) {
    const word = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(d, 'day');
    return word.charAt(0).toLocaleUpperCase(lang) + word.slice(1);
  }
  const same = new Date(ms).getFullYear() === new Date(now).getFullYear();
  const o: Intl.DateTimeFormatOptions =
    d > -7 && d < 0 ? { weekday: 'long' } : { day: 'numeric', month: 'long', ...(same ? {} : { year: 'numeric' }) };
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang, o).format(ms);
}
