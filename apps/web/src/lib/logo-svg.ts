import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { rowBrands } from './brands';

interface ISet {
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
}

let set: ISet | null = null;
const logos = (): ISet => {
  if (set) return set;
  const require = createRequire(`${process.cwd()}/package.json`);
  set = JSON.parse(readFileSync(require.resolve('@iconify-json/logos/icons.json'), 'utf8')) as ISet;
  return set;
};

// Same output as BrandIcon.astro, as a string for build-time HTML such as Markdown tables.
function logoSvg(name: string, size: number): string {
  const icon = logos().icons[name];
  if (!icon) throw new Error(`Unknown logo: ${name}`);
  const w = icon.width ?? logos().width ?? 256;
  const h = icon.height ?? logos().height ?? 256;
  const store = globalThis as { __atLogo?: number };
  const n = String((store.__atLogo = (store.__atLogo ?? 0) + 1));
  const body = icon.body
    .replace(/id="([^"]+)"/gu, `id="$1-${n}"`)
    .replace(/url\(#([^)]+)\)/gu, `url(#$1-${n})`)
    .replace(/href="#([^"]+)"/gu, `href="#$1-${n}"`);
  const fill = /fill=/u.test(icon.body) ? '' : ' fill="currentColor"';
  const width = Math.round((size * w) / Math.max(w, h));
  const height = Math.round((size * h) / Math.max(w, h));
  return `<svg class="at-logo" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(w)} ${String(h)}"${fill} aria-hidden="true" focusable="false">${body}</svg>`;
}

// Samsung Internet has no logo in the set, so it gets the Phosphor browser icon, as Icon.astro draws it.
function browserSvg(size: number): string {
  const require = createRequire(`${process.cwd()}/package.json`);
  const file = readFileSync(require.resolve('@phosphor-icons/core/assets/duotone/browser-duotone.svg'), 'utf8');
  const body = (/<svg[^>]*>([\s\S]*)<\/svg>/u.exec(file)?.[1] ?? '').replaceAll(' opacity="0.2"', ' class="at-duo-f"');
  return `<svg class="at-duo" width="${String(size)}" height="${String(size)}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;
}

// A table's first column names a browser or system: its logo goes in front of the name.
export function brandCells(html: string): string {
  if (!html.includes('class="at-table"')) return html;
  return html.replace(
    /<tr role="row"><td role="cell"([^>]*)><span>([\s\S]*?)<\/span><\/td>/gu,
    (row, attrs: string, cell: string) => {
      const found = rowBrands(cell);
      if (found.length === 0) return row;
      const marks = found.map((logo) => (logo ? logoSvg(logo, 16) : browserSvg(16))).join('');
      return `<tr role="row"><td role="cell"${attrs}><span class="at-brand-cell">${marks}<span>${cell}</span></span></td>`;
    },
  );
}
