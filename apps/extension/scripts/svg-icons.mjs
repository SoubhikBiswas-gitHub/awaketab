// Build-time inlining (MV3 loads no remote code): `<svg data-icon="gear-six" …></svg>` becomes the Phosphor
// duotone icon and `<svg data-logo="chrome" …></svg>` the full-colour SVG Logos mark, unaltered.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const DUOTONE = path.resolve(path.dirname(require.resolve('@phosphor-icons/core')), '../assets/duotone');
const PLACEHOLDER = /<svg data-(icon|logo)="([a-z0-9-]+)"([^>]*)><\/svg>/gu;

let logos;

function attrsOf(name, attrs) {
  const width = /\swidth="(\d+)"/u.exec(attrs)?.[1];
  const height = /\sheight="(\d+)"/u.exec(attrs)?.[1];
  if (!width || !height) throw new Error(`icon ${name}: set width and height`);
  const cls = /\sclass="([^"]*)"/u.exec(attrs)?.[1];
  const rest = attrs.replace(/\s(?:width|height|class)="[^"]*"/gu, '');
  return { width: Number(width), height: Number(height), cls, rest };
}

function phosphorSvg(name, attrs) {
  const svg = readFileSync(path.join(DUOTONE, `${name}-duotone.svg`), 'utf8');
  const body = /<svg[^>]*>([\s\S]*)<\/svg>/u.exec(svg)?.[1];
  if (!body?.includes(' opacity="0.2"')) throw new Error(`icon ${name}: not a Phosphor duotone icon`);
  const { width, height, cls, rest } = attrsOf(name, attrs);
  const inner = body.replaceAll(' opacity="0.2"', ' class="at-duo-f"');
  const classes = cls ? `at-duo ${cls}` : 'at-duo';
  return `<svg class="${classes}" width="${String(width)}" height="${String(height)}" viewBox="0 0 256 256" fill="currentColor"${rest} aria-hidden="true" focusable="false">${inner}</svg>`;
}

function logoSvg(name, attrs) {
  logos ??= JSON.parse(readFileSync(require.resolve('@iconify-json/logos/icons.json'), 'utf8'));
  const icon = logos.icons[name];
  if (!icon) throw new Error(`logo ${name}: not in @iconify-json/logos`);
  const w = icon.width ?? logos.width ?? 256;
  const h = icon.height ?? logos.height ?? 256;
  const { height, cls, rest } = attrsOf(name, attrs);
  // Keep the mark's own aspect ratio: the height is the size, the width follows.
  const width = Math.round((height * w) / h);
  const classes = cls ? `at-logo-mark ${cls}` : 'at-logo-mark';
  return `<svg class="${classes}" width="${String(width)}" height="${String(height)}" viewBox="${String(icon.left ?? 0)} ${String(icon.top ?? 0)} ${String(w)} ${String(h)}"${rest} aria-hidden="true" focusable="false">${icon.body}</svg>`;
}

export function inlineIcons(html) {
  return html.replace(PLACEHOLDER, (_match, kind, name, attrs) =>
    kind === 'icon' ? phosphorSvg(name, attrs) : logoSvg(name, attrs),
  );
}

export function awaketabIcons() {
  return {
    name: 'awaketab-icons',
    transformIndexHtml: { order: 'pre', handler: inlineIcons },
  };
}
