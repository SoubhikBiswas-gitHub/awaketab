export const BLOCKS = [
  'steps',
  'figures',
  'pills',
  'checklist',
  'matrix',
  'rows',
  'compare',
  'picks',
  'code',
  'note',
  'lifecycle',
  'limit',
] as const;
export type TBlockName = (typeof BLOCKS)[number];
const PAGE_MARKERS = ['ad', 'limit'] as const;
type TPageMarker = (typeof PAGE_MARKERS)[number];

export type TSectionPart = { kind: 'html'; html: string } | { kind: 'block'; name: TBlockName; arg: string };
export interface ISection {
  kind: 'section';
  id?: string;
  title?: string;
  heading?: string;
  parts: TSectionPart[];
}
export type TArticlePart = ISection | { kind: TPageMarker };

// A block line in the Markdown body (`::steps`, `::rows blockers`) renders as its own paragraph.
const MARKER = /<p>::([a-z]+)(?:\s+([\w.-]+))?<\/p>/gu;
const H2 = /<h2\b[^>]*>[\s\S]*?<\/h2>/gu;

const strip = (html: string): string =>
  html
    .replace(/<[^>]+>/gu, '')
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&amp;/gu, '&')
    .trim();

export function splitArticle(html: string): TArticlePart[] {
  const parts: TArticlePart[] = [];
  let current: ISection | null = null;
  const pushHtml = (chunk: string): void => {
    if (!chunk.trim()) return;
    if (!current) {
      current = { kind: 'section', parts: [] };
      parts.push(current);
    }
    current.parts.push({ kind: 'html', html: chunk });
  };
  // Tokens in document order: h2 headings and markers.
  const tokens: Array<{
    at: number;
    end: number;
    h2?: string;
    name?: string;
    arg?: string;
  }> = [];
  for (const m of html.matchAll(H2)) tokens.push({ at: m.index, end: m.index + m[0].length, h2: m[0] });
  for (const m of html.matchAll(MARKER))
    tokens.push({
      at: m.index,
      end: m.index + m[0].length,
      name: m[1] ?? '',
      arg: m[2] ?? '',
    });
  tokens.sort((a, b) => a.at - b.at);
  let cursor = 0;
  for (const token of tokens) {
    pushHtml(html.slice(cursor, token.at));
    cursor = token.end;
    if (token.h2) {
      const id = /\bid="([^"]+)"/u.exec(token.h2)?.[1];
      current = {
        kind: 'section',
        heading: token.h2,
        title: strip(token.h2),
        parts: [],
        ...(id ? { id } : {}),
      };
      parts.push(current);
      continue;
    }
    const name = token.name ?? '';
    // `limit` alone is page-level; `limit inline` keeps the note inside the section before it (GuideLearn).
    if ((PAGE_MARKERS as readonly string[]).includes(name) && token.arg !== 'inline') {
      parts.push({ kind: name as TPageMarker });
      current = null;
      continue;
    }
    if (!(BLOCKS as readonly string[]).includes(name)) throw new Error(`Unknown article block "::${name}"`);
    if (!current) {
      current = { kind: 'section', parts: [] };
      parts.push(current);
    }
    current.parts.push({
      kind: 'block',
      name: name as TBlockName,
      arg: token.arg ?? '',
    });
  }
  pushHtml(html.slice(cursor));
  for (const part of parts) {
    if (part.kind !== 'section') continue;
    part.parts = part.parts.filter((p) => p.kind !== 'html' || p.html.replace(/<p>\s*<\/p>/gu, '').trim() !== '');
    for (const p of part.parts) if (p.kind === 'html') p.html = breakCode(tables(p.html));
  }
  return parts;
}

// Inline code may break after a dot (`navigator.wakeLock.request()`), never mid-identifier.
export const breakCode = (html: string): string =>
  html.replace(/<code>([^<]*)<\/code>/gu, (_, code: string) => `<code>${code.replace(/\.(?=\w)/gu, '.<wbr>')}</code>`);

// A Markdown table scrolls inside a named, focusable region (WCAG 2.1.1). Each cell carries its column name so a
// phone can show a row as "column · value" lines; the explicit roles keep the table semantics when CSS restacks it.
export function tables(html: string): string {
  return html.replace(/<table>([\s\S]*?)<\/table>/gu, (_, inner: string) => {
    const head = /<thead>([\s\S]*?)<\/thead>/u.exec(inner)?.[1] ?? '';
    const labels = [...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gu)].map((m) => escapeHtml(strip(m[1] ?? '')));
    const body = inner
      .replace(/<(thead|tbody)>/gu, '<$1 role="rowgroup">')
      .replace(/<tr>/gu, '<tr role="row">')
      .replace(/<th\b([^>]*)>/gu, '<th role="columnheader"$1>')
      .replace(/<tr role="row">([\s\S]*?)<\/tr>/gu, (row: string, cells: string) => {
        if (!cells.includes('<td')) return row;
        let i = 0;
        const out = cells.replace(/<td\b([^>]*)>([\s\S]*?)<\/td>/gu, (__, attrs: string, cell: string) => {
          const label = labels[i] ?? '';
          i += 1;
          return `<td role="cell" data-label="${label}"${attrs}><span>${cell}</span></td>`;
        });
        return `<tr role="row">${out}</tr>`;
      });
    // Named by its columns: the section around it already carries the heading's name (axe landmark-unique).
    return `<div class="at-table" role="region" tabindex="0" aria-label="${labels.join(', ')}"><table role="table">${body}</table></div>`;
  });
}

export function placedBlocks(parts: TArticlePart[]): string[] {
  return parts.flatMap((part) =>
    part.kind === 'section'
      ? part.parts.flatMap((p) => (p.kind === 'block' ? [p.arg ? `${p.name} ${p.arg}` : p.name] : []))
      : [],
  );
}

const escapeHtml = (text: string): string =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');

export function inline(text: string): string {
  const out: string[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/gu;
  let i = 0;
  for (const m of text.matchAll(re)) {
    out.push(escapeHtml(text.slice(i, m.index)));
    if (m[1] !== undefined) out.push(breakCode(`<code>${escapeHtml(m[1])}</code>`));
    else if (m[2] !== undefined) out.push(`<strong>${escapeHtml(m[2])}</strong>`);
    else {
      const href = m[4] ?? '';
      const external = /^https?:/u.test(href);
      out.push(`<a href="${escapeHtml(href)}"${external ? ' rel="noopener"' : ''}>${escapeHtml(m[3] ?? '')}</a>`);
    }
    i = m.index + m[0].length;
  }
  out.push(escapeHtml(text.slice(i)));
  return out.join('');
}

export const plain = (text: string): string =>
  text
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/\*\*([^*]+)\*\*/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1');

// Code blocks (canvas GuideLearn): the board's own small highlighter, so the colours match it exactly.
export type TToken = [kind: 'kw' | 'fn' | 'id' | 'str' | 'com' | 'pun' | 'tag' | 'attr', text: string];
const KW = new Set([
  'let',
  'const',
  'async',
  'await',
  'function',
  'if',
  'return',
  'try',
  'catch',
  'new',
  'null',
  'true',
  'false',
  'in',
  'of',
  'else',
]);

export function tokenize(line: string, lang: string): TToken[] {
  const out: TToken[] = [];
  const re =
    lang === 'html'
      ? /(<\/?[\w-]+|\/?>)|("[^"]*")|([\w-]+)(?==)/gu
      : lang === 'text' || lang === 'sh'
        ? /(#.*$)/gu
        : /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)/gu;
  let i = 0;
  for (const m of line.matchAll(re)) {
    if (m.index > i) out.push(['pun', line.slice(i, m.index)]);
    if (lang === 'html') out.push([m[1] ? 'tag' : m[2] ? 'str' : 'attr', m[0]]);
    else if (m[1]) out.push(['com', m[0]]);
    else if (m[2]) out.push(['str', m[0]]);
    else {
      const rest = line.slice(m.index + m[0].length);
      out.push([KW.has(m[0]) ? 'kw' : /^\s*\(/u.test(rest) ? 'fn' : 'id', m[0]]);
    }
    i = m.index + m[0].length;
  }
  if (i < line.length) out.push([lang === 'text' || lang === 'sh' ? 'id' : 'pun', line.slice(i)]);
  return out;
}
