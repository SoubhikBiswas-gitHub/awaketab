// Store listing images (docs/10 §9): five 1280×800 screenshots and the 440×280 promo tile, drawn from the
// StoreAssets board on the Chrome extension design canvas (docs/redesign/CANVASES.md; the Store 1–5 boards
// and the small promo tile, dark theme). Colours come from apps/web/src/styles/tokens.css and text from the repo's own fonts in
// apps/web/public/fonts, rendered with satori + resvg: the renderer (and pinned versions) the web uses for OG
// images, resolved from apps/web so the extension adds no dependency. Text becomes paths, so output bytes
// depend only on this script and its inputs: `pnpm -F extension store:assets` twice gives the same files
// (test/build/store-assets.test.ts). The popups show fixed times so the art never changes with the clock.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BADGE_COLORS, BADGE_TEXT_COLOR, badgeText } from '../src/status.ts';
import { staticInstance, woff2ToTtf } from './fonts.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.resolve(ROOT, '../web');
const requireWeb = createRequire(path.join(WEB, 'package.json'));

type TStyle = Record<string, string | number>;

interface INode {
  type: string;
  props: Record<string, unknown>;
}

type TChild = INode | string;

type TSatori = (
  el: unknown,
  opts: {
    width: number;
    height: number;
    fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: 'normal' }>;
  },
) => Promise<string>;
type TResvg = new (
  svg: string,
  opts: { background: string; fitTo: { mode: 'width'; value: number } },
) => { render(): { pixels: Uint8Array; width: number; height: number } };
type TZlib = (data: Uint8Array, opts: { level: number; mem: number }) => Uint8Array;

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(Buffer.from(type, 'latin1'), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

// The Chrome Web Store takes screenshots and promo tiles as 24-bit PNG with no alpha, so the opaque render is
// written as colour type 2 (RGB). fflate is pure JS, so the bytes are the same on every machine.
function rgbPng(rgba: Uint8Array, width: number, height: number, zlib: TZlib): Uint8Array {
  const stride = width * 3;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    raw[row] = 1; // "Sub" filter: each byte minus the same channel one pixel to the left.
    for (let x = 0; x < width; x += 1) {
      const from = (y * width + x) * 4;
      if (rgba[from + 3] !== 255) throw new Error(`store image: pixel ${String(x)},${String(y)} is not opaque`);
      for (let ch = 0; ch < 3; ch += 1) {
        const left = x > 0 ? (rgba[from - 4 + ch] ?? 0) : 0;
        raw[row + 1 + x * 3 + ch] = ((rgba[from + ch] ?? 0) - left) & 0xff;
      }
    }
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 2, 0, 0, 0], 8);
  const parts = [
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib(raw, { level: 9, mem: 12 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  return Buffer.concat(parts);
}

const box = (style: TStyle, children?: TChild | TChild[]): INode => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }) },
});

const node = (type: string, props: Record<string, unknown>, children?: INode[]): INode => ({
  type,
  props: children ? { ...props, children } : props,
});

function tokenBlock(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`tokens.css: no ${selector} block`);
  const body = css.slice(start, css.indexOf('}', start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--at-[a-z0-9-]+):\s*([^;]+);/gu)) out[m[1] ?? ''] = (m[2] ?? '').trim();
  return out;
}

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return `rgba(${String((n >> 16) & 255)},${String((n >> 8) & 255)},${String(n & 255)},${String(alpha)})`;
}

// The dark Clear Night palette, as the Store boards draw it (theme="dark").
type TMeasure = (text: string, size: number, weight: number) => number;

async function palette(measure: TMeasure) {
  const css = await readFile(path.join(WEB, 'src/styles/tokens.css'), 'utf8');
  const dark = tokenBlock(css, '[data-theme="dark"]');
  const tok = (name: string): string => {
    const value = dark[name];
    if (!value || !value.startsWith('#')) throw new Error(`tokens.css: ${name} is not a colour`);
    return value;
  };
  const accent = tok('--at-accent');
  return {
    ground: tok('--at-ground'),
    lift: tok('--at-lift'),
    surface: tok('--at-surface'),
    line: tok('--at-line'),
    line2: tok('--at-line-strong'),
    ink: tok('--at-ink'),
    ink2: tok('--at-ink-2'),
    muted: tok('--at-muted'),
    track: tok('--at-track'),
    tick: tok('--at-tick'),
    raised: tok('--at-raised'),
    sunken: tok('--at-sunken'),
    inputBorder: tok('--at-input-border'),
    lamp: accent,
    lampText: tok('--at-accent-text'),
    lampSoft: rgba(accent, 0.14),
    lampLine: rgba(accent, 0.45),
    lampTag: rgba(accent, 0.12),
    shadowFloat: '0 24px 64px -24px rgba(0,0,0,0.45)',
    measure,
  };
}

type TPalette = Awaited<ReturnType<typeof palette>>;

const LOGO_RING = 'M32.8 11.4A16 16 0 1 1 15.2 11.4';
const GLYPH_DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';
const GLYPH_HALF =
  'M6 .8a5.2 5.2 0 1 1 0 10.4a5.2 5.2 0 1 1 0-10.4zM6 2.3a3.7 3.7 0 1 1 0 7.4a3.7 3.7 0 1 1 0-7.4zM6 2.3a3.7 3.7 0 0 0 0 7.4z';
const ICON_SCREEN = 'M3 5h18v11H3zM9 20h6M12 16v4';
const ICON_SYSTEM = 'M5 4h14v12H5zM3 20h18M9 10h6';
const ICON_MOON = 'M10.4 7.6A4.6 4.6 0 1 1 4.4 1.6a3.7 3.7 0 0 0 6 6z';
const ICON_CHECK = 'M5 12.5l4.5 4.5L19 7.5';
const ICON_ARROW = 'M7 17L17 7M9 7h8v8';
const ICON_SETTINGS = 'M4 7h10M18 7h2M4 17h4M12 17h8';

function logo(c: TPalette, size: number, bead: string, halo: boolean): INode {
  return node('svg', { width: size, height: size, viewBox: '0 0 48 48', style: { overflow: 'visible' } }, [
    node('path', { d: LOGO_RING, fill: 'none', stroke: c.ink, 'stroke-width': 4.5, 'stroke-linecap': 'round' }),
    ...(halo ? [node('circle', { cx: 24, cy: 9, r: 7.5, fill: bead, opacity: 0.28 })] : []),
    node('circle', { cx: 24, cy: 9, r: 4.2, fill: bead }),
  ]);
}

function wordmark(c: TPalette, size: number, fontSize: number, lineHeight: number): INode {
  return box({ alignItems: 'center', gap: 8, fontSize, lineHeight: `${String(lineHeight)}px`, fontWeight: 600 }, [
    logo(c, size, c.lamp, true),
    box({ letterSpacing: -0.01 * fontSize }, 'AwakeTab'),
  ]);
}

// The toolbar icon: the ring with a solid bead, as Chrome shows it (ExtBadges board).
function toolbarIcon(ring: string, bead: string, size: number): INode {
  return node('svg', { width: size, height: size, viewBox: '0 0 48 48' }, [
    node('path', { d: LOGO_RING, fill: 'none', stroke: ring, 'stroke-width': 5.4, 'stroke-linecap': 'round' }),
    node('circle', { cx: 24, cy: 9, r: 5.4, fill: bead }),
  ]);
}

interface IPopupState {
  level: 'display' | 'system';
  pill: string;
  totalSec: number;
  leftSec: number;
  caption: string;
  meta: string;
  chip: string;
}

const C = 2 * Math.PI * 56;

function digits(sec: number): [string, string] {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? [`${String(h)}:${p(m)}`, `:${p(s)}`] : [p(m), `:${p(s)}`];
}

// 60 ticks, 1.2° wide every 6°, between radius 45 and 48 (the ring's repeating-conic-gradient and mask).
function ticks(color: string): INode[] {
  const out: INode[] = [];
  const pt = (r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(62 + r * Math.cos(a)).toFixed(3)} ${(62 + r * Math.sin(a)).toFixed(3)}`;
  };
  for (let k = 0; k < 60; k++) {
    const a = k * 6 - 0.6;
    const b = k * 6 + 0.6;
    out.push(node('path', { d: `M${pt(45, a)}L${pt(48, a)}L${pt(48, b)}L${pt(45, b)}Z`, fill: color }));
  }
  return out;
}

// The held sweep: a conic gradient from transparent at 240° to the faint lamp at 360°, radius 50 (inset 12).
function sweep(color: string, alpha: number): INode[] {
  const out: INode[] = [];
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(62 + 50 * Math.cos(a)).toFixed(3)} ${(62 + 50 * Math.sin(a)).toFixed(3)}`;
  };
  for (let d = 240; d < 360; d += 2) {
    const mid = (d + 1 - 240) / 120;
    out.push(
      node('path', { d: `M62 62L${pt(d)}L${pt(d + 2.2)}Z`, fill: color, 'fill-opacity': (alpha * mid).toFixed(4) }),
    );
  }
  return out;
}

function ring(c: TPalette, s: IPopupState): INode {
  const [a, b] = digits(s.leftSec);
  const p = s.leftSec / s.totalSec;
  const dash = `${(C * p).toFixed(1)} ${C.toFixed(1)}`;
  const tip = 360 * p;
  const tipRad = ((tip - 90) * Math.PI) / 180;
  const tx = 62 + 56 * Math.cos(tipRad);
  const ty = 62 + 56 * Math.sin(tipRad);
  return box({ position: 'relative', width: 124, height: 124, flexShrink: 0 }, [
    node('svg', { width: 124, height: 124, viewBox: '0 0 124 124', style: { position: 'absolute', left: 0, top: 0 } }, [
      ...ticks(c.tick),
      ...sweep(c.lamp, 0.16),
      node('defs', {}, [
        node('filter', { id: 'glow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, [
          node('feGaussianBlur', { stdDeviation: 4 }),
        ]),
      ]),
      node('circle', { cx: 62, cy: 62, r: 56, fill: 'none', stroke: c.track, 'stroke-width': 5 }),
      node('g', { transform: 'rotate(-90 62 62)' }, [
        node('circle', {
          cx: 62,
          cy: 62,
          r: 56,
          fill: 'none',
          stroke: c.lamp,
          'stroke-opacity': 0.5,
          'stroke-width': 10,
          'stroke-linecap': 'round',
          'stroke-dasharray': dash,
          filter: 'url(#glow)',
        }),
        node('circle', {
          cx: 62,
          cy: 62,
          r: 56,
          fill: 'none',
          stroke: c.lamp,
          'stroke-width': 5,
          'stroke-linecap': 'round',
          'stroke-dasharray': dash,
        }),
      ]),
      node('circle', { cx: tx.toFixed(3), cy: ty.toFixed(3), r: 5, fill: c.lamp, opacity: 0.6 }),
      node('circle', { cx: tx.toFixed(3), cy: ty.toFixed(3), r: 4, fill: c.ink }),
    ]),
    box(
      {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 124,
        height: 124,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      },
      [
        box(
          {
            fontSize: s.leftSec >= 3600 ? 20 : 28,
            lineHeight: 1,
            fontWeight: 300,
            letterSpacing: (s.leftSec >= 3600 ? 20 : 28) * -0.02,
            color: c.ink,
            fontFeatureSettings: '"tnum" 1',
          },
          [box({}, a), box({ color: c.muted }, b)],
        ),
        box(
          {
            maxWidth: 96,
            textAlign: 'center',
            justifyContent: 'center',
            fontSize: 13,
            lineHeight: '16px',
            fontWeight: 500,
            color: c.muted,
          },
          s.caption,
        ),
      ],
    ),
  ]);
}

function pill(c: TPalette, s: IPopupState): INode {
  const system = s.level === 'system';
  return box(
    {
      alignItems: 'center',
      gap: 8,
      height: 32,
      padding: '0 12px 0 8px',
      borderRadius: 999,
      background: rgba(c.lamp, 0.12),
      border: `1px solid ${rgba(c.lamp, 0.38)}`,
      fontSize: 14,
      lineHeight: '20px',
      fontWeight: 600,
      color: c.ink,
      whiteSpace: 'nowrap',
    },
    [
      node('svg', { width: 12, height: 12, viewBox: '0 0 12 12', style: { overflow: 'visible' } }, [
        node('defs', {}, [
          node('filter', { id: 'pillglow', x: '-100%', y: '-100%', width: '300%', height: '300%' }, [
            node('feDropShadow', { dx: 0, dy: 0, stdDeviation: 2, 'flood-color': c.lamp, 'flood-opacity': 0.8 }),
          ]),
        ]),
        node('path', {
          d: system ? GLYPH_HALF : GLYPH_DOT,
          fill: c.lamp,
          stroke: c.lamp,
          'stroke-width': system ? 0 : 1.6,
          'fill-rule': 'evenodd',
          'stroke-linejoin': 'round',
          filter: 'url(#pillglow)',
        }),
      ]),
      box({}, s.pill),
    ],
  );
}

const buttonText = (c: TPalette, label: string, style: TStyle): INode =>
  box({ alignItems: 'center', justifyContent: 'center', color: c.ink, whiteSpace: 'nowrap', ...style }, label);

// Chromium draws a 1px dashed border as 3px dashes and 3px gaps; satori's own dashes are shorter, so dashed
// outlines are drawn as an SVG rectangle over the element.
function dashedBorder(width: number, height: number, radius: number, color: string, stroke = 1): INode {
  const dash = `${String(3 * stroke)} ${String(3 * stroke)}`;
  return node(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${String(width)} ${String(height)}`,
      style: { position: 'absolute', left: 0, top: 0 },
    },
    [
      node('rect', {
        x: stroke / 2,
        y: stroke / 2,
        width: width - stroke,
        height: height - stroke,
        rx: Math.min(radius, height / 2) - stroke / 2,
        fill: 'none',
        stroke: color,
        'stroke-width': stroke,
        'stroke-dasharray': dash,
      }),
    ],
  );
}

const CHIPS = ['15 min', '30 min', '45 min', '1 h', '2 h', '4 h', '∞'];

// The extension popup while a session is held (ExtPopup board, 360 × 600).
function popup(c: TPalette, s: IPopupState): INode {
  const system = s.level === 'system';
  const levelItem = (label: string, icon: string, on: boolean) =>
    box(
      {
        flexGrow: 1,
        flexBasis: 0,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 999,
        background: on ? c.raised : 'transparent',
        fontSize: 14,
        lineHeight: '20px',
        fontWeight: on ? 600 : 500,
        color: on ? c.ink : c.ink2,
      },
      [
        node(
          'svg',
          {
            width: 16,
            height: 16,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: on ? c.ink : c.ink2,
            'stroke-width': 1.8,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          [node('path', { d: icon })],
        ),
        box({}, label),
      ],
    );
  const chip = (label: string, on: boolean, dashed = false) => {
    const style: TStyle = {
      position: 'relative',
      width: 76,
      height: 44,
      borderRadius: 999,
      background: on ? c.lampSoft : 'transparent',
      fontSize: 14,
      lineHeight: '20px',
      fontWeight: on ? 600 : 500,
      color: on ? c.ink : c.ink2,
    };
    if (dashed && !on)
      return box({ ...style, alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }, [
        dashedBorder(76, 44, 22, c.line2),
        box({}, label),
      ]);
    return buttonText(c, label, { ...style, border: `1px solid ${on ? c.lampLine : c.line}` });
  };
  const untilOn = s.chip.endsWith('M');
  return box(
    {
      position: 'relative',
      width: 360,
      height: 600,
      flexDirection: 'column',
      padding: '0 16px 12px',
      overflow: 'hidden',
      backgroundImage: `radial-gradient(120% 70% at 50% 26%, ${c.lift} 0%, ${c.ground} 58%)`,
      backgroundColor: c.ground,
      color: c.ink,
    },
    [
      box({
        position: 'absolute',
        left: -108,
        top: -48,
        width: 576,
        height: 360,
        backgroundImage: `radial-gradient(45% 45% at 50% 50%, ${rgba(c.lamp, 0.18)} 0%, transparent 70%)`,
      }),
      box({ height: 60, flexShrink: 0, alignItems: 'center', justifyContent: 'space-between' }, [
        box({ alignItems: 'center', gap: 8, fontSize: 17, lineHeight: '24px', fontWeight: 600 }, [
          logo(c, 26, c.lamp, true),
          box({ letterSpacing: -0.17 }, 'AwakeTab'),
        ]),
        box({ width: 44, height: 44, marginRight: -12, alignItems: 'center', justifyContent: 'center' }, [
          node(
            'svg',
            {
              width: 20,
              height: 20,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: c.ink2,
              'stroke-width': 1.8,
              'stroke-linecap': 'round',
            },
            [
              node('path', { d: ICON_SETTINGS }),
              node('circle', { cx: 16, cy: 7, r: 2 }),
              node('circle', { cx: 10, cy: 17, r: 2 }),
            ],
          ),
        ]),
      ]),
      box({ minHeight: 128, flexShrink: 0, alignItems: 'center', gap: 16 }, [
        ring(c, s),
        box({ flexDirection: 'column', alignItems: 'flex-start', gap: 8, flexGrow: 1, flexBasis: 0, minWidth: 0 }, [
          pill(c, s),
          system
            ? box({ alignItems: 'center', gap: 8, fontSize: 13, lineHeight: '18px', fontWeight: 500, color: c.ink2 }, [
                node(
                  'svg',
                  {
                    width: 12,
                    height: 12,
                    viewBox: '0 0 12 12',
                    fill: 'none',
                    stroke: c.ink2,
                    'stroke-width': 1.4,
                    'stroke-linejoin': 'round',
                  },
                  [node('path', { d: ICON_MOON })],
                ),
                box({}, 'Screen may dim or lock'),
              ])
            : box({ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: c.ink2 }, s.meta),
        ]),
      ]),
      box(
        { marginTop: 12, flexShrink: 0, gap: 8 },
        ['+15 min', '+30 min', '+1 h'].map((label) =>
          buttonText(c, label, {
            width: 104,
            height: 44,
            borderRadius: 12,
            border: `1px solid ${c.line2}`,
            background: c.surface,
            fontSize: 13,
            lineHeight: '18px',
            fontWeight: 600,
          }),
        ),
      ),
      buttonText(c, 'Stop', {
        marginTop: 12,
        flexShrink: 0,
        height: 60,
        borderRadius: 20,
        border: `1px solid ${c.line2}`,
        background: c.raised,
        fontSize: 17,
        lineHeight: '24px',
        fontWeight: 600,
      }),
      box({ marginTop: 12, flexShrink: 0, alignItems: 'center', gap: 12 }, [
        box({ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: c.ink2 }, 'Keep awake'),
        box(
          {
            flexGrow: 1,
            padding: 4,
            borderRadius: 999,
            background: c.surface,
            border: `1px solid ${c.line}`,
          },
          [levelItem('Screen', ICON_SCREEN, !system), levelItem('System', ICON_SYSTEM, system)],
        ),
      ]),
      box({ marginTop: 12, flexShrink: 0, flexWrap: 'wrap', gap: 8 }, [
        ...CHIPS.map((label) => chip(label, label === s.chip)),
        chip(untilOn ? s.chip : 'Until…', untilOn, true),
      ]),
      box(
        {
          marginTop: 12,
          paddingTop: 8,
          borderTop: `1px solid ${c.line}`,
          flexShrink: 0,
        },
        [
          box({ height: 44, alignItems: 'center', gap: 8, fontSize: 15, lineHeight: '22px', fontWeight: 600 }, [
            box({}, 'Open AwakeTab'),
            node(
              'svg',
              {
                width: 16,
                height: 16,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: c.lampText,
                'stroke-width': 2,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              },
              [node('path', { d: ICON_ARROW })],
            ),
          ]),
        ],
      ),
    ],
  );
}

// The board sizes the frames and the badge tiles without box-sizing, so their 1px borders sit outside the stated size.
function popupFrame(c: TPalette, s: IPopupState, style: TStyle, line: string): INode {
  return box({ width: 362, height: 602, borderRadius: 16, overflow: 'hidden', border: `1px solid ${line}`, ...style }, [
    box({ position: 'absolute', left: 0, top: 0, width: 360, height: 600 }, [popup(c, s)]),
  ]);
}

// The session every popup shows is frozen at 9:45:42 PM, so the art reads the same on every run. Each Until and
// Started line follows from that clock and the popup's numbers (Started 9:29 PM + 1 h = Until 10:29 PM, 43:18 left).
const POPUPS: Record<'awake' | 'system' | 'long' | 'overnight', IPopupState> = {
  awake: {
    level: 'display',
    pill: 'Screen awake',
    totalSec: 3600,
    leftSec: 2598,
    caption: 'Until 10:29 PM',
    meta: 'Started 9:29 PM',
    chip: '1 h',
  },
  system: {
    level: 'system',
    pill: 'System awake',
    totalSec: 7200,
    leftSec: 5058,
    caption: 'Until 11:10 PM',
    meta: 'Started 9:10 PM',
    chip: '2 h',
  },
  long: {
    level: 'display',
    pill: 'Screen awake',
    totalSec: 7200,
    leftSec: 5058,
    caption: 'Until 11:10 PM',
    meta: 'Started 9:10 PM',
    chip: '2 h',
  },
  overnight: {
    level: 'display',
    pill: 'Screen awake',
    totalSec: 26718,
    leftSec: 23118,
    caption: 'Until 4:11 AM tomorrow',
    meta: 'Started 8:45 PM',
    chip: '4:11 AM',
  },
};

const FROZEN_MS = Date.UTC(2026, 8, 27, 21, 45, 42);

// The toolbar badge comes from the extension's own rule (minutes rounded up), so it always agrees with the popup.
function badgeSession(s: IPopupState): Parameters<typeof badgeText>[2] {
  const startedAt = FROZEN_MS - (s.totalSec - s.leftSec) * 1000;
  return {
    status: 'active',
    plan: { type: 'duration', ms: s.totalSec * 1000 },
    startedAt,
    endsAt: startedAt + s.totalSec * 1000,
    pausedAt: null,
    pausedMs: 0,
  } as Parameters<typeof badgeText>[2];
}

interface ICopy {
  kicker: string;
  headline: string;
  sub: string;
  limit: string;
  list?: string[];
}

function copyColumn(c: TPalette, copy: ICopy): INode {
  return box(
    {
      position: 'absolute',
      left: 80,
      top: 64,
      width: 384,
      height: 672,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    [
      wordmark(c, 32, 20, 28),
      box({ flexDirection: 'column', gap: 20 }, [
        box(
          {
            fontSize: 14,
            lineHeight: '20px',
            fontWeight: 600,
            letterSpacing: 14 * 0.14,
            textTransform: 'uppercase',
            color: c.lampText,
          },
          copy.kicker,
        ),
        box(
          { fontSize: 48, lineHeight: '56px', fontWeight: 600, letterSpacing: -0.96, textWrap: 'balance' },
          copy.headline,
        ),
        box({ fontSize: 20, lineHeight: '28px', color: c.ink2 }, copy.sub),
        ...(copy.list
          ? [
              box(
                { flexDirection: 'column', gap: 12 },
                copy.list.map((item) =>
                  box({ alignItems: 'center', gap: 12, fontSize: 18, lineHeight: '28px', color: c.ink }, [
                    node(
                      'svg',
                      {
                        width: 20,
                        height: 20,
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: c.lamp,
                        'stroke-width': 2.2,
                        'stroke-linecap': 'round',
                        'stroke-linejoin': 'round',
                      },
                      [node('path', { d: ICON_CHECK })],
                    ),
                    box({}, item),
                  ]),
                ),
              ),
            ]
          : []),
      ]),
      box({ fontSize: 15, lineHeight: '22px', color: c.muted }, copy.limit),
    ],
  );
}

function scene(c: TPalette, width: number, height: number, aura: [number, number], children: INode[]): INode {
  return box(
    {
      position: 'relative',
      width,
      height,
      overflow: 'hidden',
      backgroundImage: `radial-gradient(120% 90% at 70% 30%, ${c.lift} 0%, ${c.ground} 58%)`,
      backgroundColor: c.ground,
      color: c.ink,
      fontFamily: 'Geist',
    },
    [
      // The board's 900 px aura square, drawn over the whole scene so no part of it is clipped.
      box({
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        backgroundImage: `radial-gradient(360px 360px at ${String(aura[0] + 450)}px ${String(aura[1] + 450)}px, ${rgba(c.lamp, 0.14)} 0%, transparent 70%)`,
      }),
      ...children,
    ],
  );
}

// Store 1: the popup over a page, with the toolbar badge.
function browserShot(c: TPalette): INode[] {
  const bars = [100, 96, 100, 88, 94, 100, 72, 100, 92, 97, 64];
  return [
    box(
      {
        position: 'absolute',
        left: 528,
        top: 64,
        width: 688,
        height: 672,
        borderRadius: 16,
        overflow: 'hidden',
        background: c.ground,
        border: `1px solid ${c.line}`,
        flexDirection: 'column',
      },
      [
        box(
          {
            height: 56,
            flexShrink: 0,
            padding: '0 8px 0 16px',
            alignItems: 'center',
            gap: 12,
            background: c.surface,
            borderBottom: `1px solid ${c.line}`,
          },
          [
            box(
              {
                flexGrow: 1,
                height: 36,
                borderRadius: 999,
                background: c.sunken,
                alignItems: 'center',
                padding: '0 16px',
                fontSize: 14,
                color: c.muted,
              },
              'docs.example.com/quarterly-report',
            ),
            box(
              {
                position: 'relative',
                width: 44,
                height: 44,
                borderRadius: 12,
                background: c.raised,
                alignItems: 'center',
                justifyContent: 'center',
              },
              [
                toolbarIcon(c.ink, c.lamp, 24),
                box(
                  {
                    position: 'absolute',
                    right: 2,
                    bottom: 4,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 4,
                    background: BADGE_COLORS.display,
                    color: BADGE_TEXT_COLOR,
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: '16px',
                    boxShadow: `0 0 0 1px ${c.surface}`,
                  },
                  badgeText('held', 'display', badgeSession(POPUPS.awake), FROZEN_MS),
                ),
              ],
            ),
          ],
        ),
        box({ flexGrow: 1, padding: '40px 48px', flexDirection: 'column', gap: 12 }, [
          box({ width: '55%', height: 20, borderRadius: 8, background: c.track }),
          box({ width: '30%', height: 12, borderRadius: 8, background: c.track, marginBottom: 20 }),
          ...bars.map((w) => box({ width: `${String(w)}%`, height: 12, borderRadius: 8, background: c.track })),
          box({ width: '100%', height: 160, borderRadius: 16, background: c.track, marginTop: 12 }),
        ]),
      ],
    ),
    popupFrame(c, POPUPS.awake, { position: 'absolute', left: 844, top: 124, boxShadow: c.shadowFloat }, c.line2),
  ];
}

// Store 2 and 4: two popups side by side.
function pairShot(c: TPalette, pair: Array<{ name: string; note: string; state: IPopupState; line: string }>): INode[] {
  return pair.map((p, i) =>
    box({ position: 'absolute', left: 488 + i * 384, top: 64, width: 360, flexDirection: 'column', gap: 12 }, [
      box({ height: 48, alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }, [
        box({ fontSize: 20, lineHeight: '28px', fontWeight: 600 }, p.name),
        box({ fontSize: 15, lineHeight: '22px', color: c.muted }, p.note),
      ]),
      popupFrame(c, p.state, { position: 'relative' }, p.line),
    ]),
  );
}

// Store 3: the five toolbar badge states (ExtBadges board).
function badgeShot(c: TPalette): INode[] {
  const rows = [
    { text: '', title: 'Idle', body: 'No badge and a grey bead: nothing is held.' },
    { text: '25m', title: '25m', body: 'Screen level, minutes left under 100.' },
    { text: '3h', title: '3h', body: 'From 100 minutes up, whole hours.' },
    { text: 'ON', title: 'ON', body: 'Screen level with no time limit.' },
    { text: 'SYS', title: 'SYS', body: 'System level with no time limit. The screen may dim.' },
  ];
  return [
    box(
      { position: 'absolute', left: 528, top: 64, width: 688, flexDirection: 'column', gap: 16 },
      rows.map((r) =>
        box(
          {
            height: 120,
            padding: '0 24px',
            borderRadius: 16,
            background: c.surface,
            border: `1px solid ${c.line}`,
            alignItems: 'center',
            gap: 24,
          },
          [
            box(
              {
                width: 98,
                height: 82,
                marginRight: -2,
                flexShrink: 0,
                borderRadius: 12,
                background: c.surface,
                border: `1px solid ${c.line}`,
                alignItems: 'center',
                justifyContent: 'center',
              },
              [
                box({ position: 'relative', width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, [
                  toolbarIcon(r.text ? c.ink : c.muted, r.text ? c.lamp : c.muted, 48),
                  ...(r.text
                    ? [
                        box(
                          {
                            position: 'absolute',
                            right: -16,
                            bottom: -8,
                            height: 24,
                            minWidth: 24,
                            padding: '0 8px',
                            borderRadius: 8,
                            background: r.text === 'SYS' ? BADGE_COLORS.system : BADGE_COLORS.display,
                            color: BADGE_TEXT_COLOR,
                            fontSize: 15,
                            fontWeight: 600,
                            lineHeight: '24px',
                            justifyContent: 'center',
                            boxShadow: `0 0 0 2px ${c.surface}`,
                          },
                          r.text,
                        ),
                      ]
                    : []),
                ]),
              ],
            ),
            box({ flexDirection: 'column', gap: 4, minWidth: 0 }, [
              box({ fontSize: 20, lineHeight: '28px', fontWeight: 600 }, r.title),
              box({ fontSize: 16, lineHeight: '24px', color: c.ink2 }, r.body),
            ]),
          ],
        ),
      ),
    ),
  ];
}

// Store 5: the options page's Auto-start and Pro licence cards, as the board shows them: the ExtOptions board
// at 1280 wide, scaled to 0.796 inside the window (every length below is the board's, times that scale).
const OPTIONS_SCALE = 0.796;

function optionsShot(c: TPalette): INode[] {
  const u = (n: number): number => n * OPTIONS_SCALE;
  const px = (...ns: number[]): string => ns.map((n) => `${String(u(n))}px`).join(' ');
  const line = (color: string) => `${String(u(1))}px solid ${color}`;
  const text = (size: number, lineHeight: number, weight: number, color: string = c.ink): TStyle => ({
    fontSize: u(size),
    lineHeight: px(lineHeight),
    fontWeight: weight,
    color,
  });
  const button = (label: string, style: TStyle) =>
    box({ height: u(44), alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', ...style }, [
      ...(style.width === undefined ? [] : [dashedBorder(Number(style.width), u(44), u(12), c.line2, u(1))]),
      box({}, label),
    ]);
  const label = (value: string) => box(text(13, 16, 600, c.ink2), value);
  const field = (children: INode[] = [], style: TStyle = {}) =>
    box(
      {
        height: u(48),
        alignItems: 'center',
        borderRadius: u(8),
        border: line(c.inputBorder),
        background: c.sunken,
        ...style,
      },
      children,
    );
  const site = (host: string, duration: string) =>
    box({ minHeight: u(56), padding: px(8, 0), alignItems: 'center', gap: u(16), borderBottom: line(c.line) }, [
      box({ flexGrow: 1, fontFamily: 'Geist Mono', ...text(15, 19, 400) }, host),
      box(text(14, 18, 400, c.ink2), duration),
      button('Remove', { padding: px(0, 16), ...text(14, 20, 600, c.ink2) }),
    ]);
  const heading = (value: string, pro: boolean) =>
    box({ alignItems: 'center', gap: u(12) }, [
      box({ ...text(20, 28, 600), letterSpacing: u(-0.2) }, value),
      ...(pro
        ? [
            box(
              {
                height: u(24),
                padding: px(0, 8),
                alignItems: 'center',
                borderRadius: 999,
                border: line(c.lampLine),
                background: c.lampTag,
                ...text(12, 16, 600),
              },
              'Pro',
            ),
          ]
        : []),
    ]);
  const card = (children: INode[], style: TStyle = {}) =>
    box(
      { flexDirection: 'column', borderRadius: u(16), background: c.surface, border: line(c.line), ...style },
      children,
    );
  const icon = (d: string, size: number, stroke: string, width: number) =>
    node(
      'svg',
      {
        width: u(size),
        height: u(size),
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke,
        'stroke-width': width,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      },
      [node('path', { d })],
    );
  const column = box(
    {
      position: 'absolute',
      left: u(376) - 287,
      top: u(2522) - 1990,
      width: u(824),
      flexDirection: 'column',
      gap: u(48),
    },
    [
      box({ flexDirection: 'column', gap: u(16) }, [
        heading('Auto-start', true),
        card([
          box({ padding: px(20, 24), alignItems: 'center', gap: u(24) }, [
            box({ flexGrow: 1, ...text(16, 21, 600) }, 'Keep awake whenever Chrome starts'),
            box({ width: u(60), height: u(44), alignItems: 'center', justifyContent: 'center' }, [
              box(
                {
                  position: 'relative',
                  width: u(52),
                  height: u(32),
                  borderRadius: 999,
                  background: c.track,
                  border: line(c.line2),
                },
                [
                  box({
                    position: 'absolute',
                    left: u(3),
                    top: u(3),
                    width: u(24),
                    height: u(24),
                    borderRadius: 999,
                    background: c.muted,
                    boxShadow: `0 ${px(1)} ${px(3)} rgba(0,0,0,0.3)`,
                  }),
                ],
              ),
            ]),
          ]),
          box({ height: u(1), background: c.line }),
          box({ padding: px(24, 24, 8), flexDirection: 'column', gap: u(8) }, [
            box(text(16, 21, 600), 'Sites'),
            box(
              { maxWidth: u(680), ...text(14, 20, 400, c.muted) },
              'Starts when a tab on the site loads and stops when the last one closes. Chrome asks for access to that one site; AwakeTab never reports which sites you add.',
            ),
          ]),
          box({ padding: px(0, 24, 8), flexDirection: 'column' }, [
            site('docs.example.com', 'While the tab is open'),
            site('dashboards.example.net', '4 h'),
          ]),
          box({ padding: px(16, 24, 24), alignItems: 'flex-end', gap: u(12) }, [
            box({ flexGrow: 1, flexBasis: 0, minWidth: 0, flexDirection: 'column', gap: u(8) }, [
              label('Site, e.g. docs.example.com'),
              field(),
            ]),
            box({ width: u(220), flexShrink: 0, flexDirection: 'column', gap: u(8) }, [
              label('Keep awake for'),
              field(
                [
                  box({ flexGrow: 1, ...text(15, 19, 400) }, 'While the tab is open'),
                  icon('M6 9l6 6l6-6', 12, c.ink, 3),
                ],
                {
                  padding: px(0, 12, 0, 16),
                },
              ),
            ]),
            button('Add site', {
              position: 'relative',
              flexShrink: 0,
              width: u(40) + c.measure('Add site', u(15), 600),
              borderRadius: u(12),
              background: c.surface,
              ...text(15, 22, 600),
            }),
          ]),
        ]),
      ]),
      box({ flexDirection: 'column', gap: u(16) }, [
        heading('Pro licence', false),
        card(
          [
            box({ alignItems: 'center', gap: u(16) }, [
              box(
                {
                  width: u(48),
                  height: u(48),
                  flexShrink: 0,
                  borderRadius: u(12),
                  background: c.lampSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                [icon(ICON_CHECK, 22, c.lamp, 2.2)],
              ),
              box({ flexGrow: 1, flexDirection: 'column', gap: u(4) }, [
                box(text(16, 24, 600), 'Pro is active on this device'),
                box(text(14, 18, 400, c.muted), 'AwakeTab Pro · Chrome on macOS'),
              ]),
              box({ gap: u(8), flexShrink: 0 }, [
                button('Remove from this browser', {
                  padding: px(0, 16),
                  borderRadius: u(12),
                  border: line(c.line2),
                  ...text(15, 22, 600),
                }),
                button('Manage devices', { padding: px(0, 16), ...text(15, 22, 600, c.lampText) }),
              ]),
            ]),
          ],
          { padding: px(24) },
        ),
      ]),
    ],
  );
  return [
    box(
      {
        position: 'absolute',
        left: 528,
        top: 116,
        width: 690,
        height: 572,
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${c.line}`,
        background: c.ground,
      },
      [column],
    ),
  ];
}

function promo(c: TPalette): INode {
  return scene(
    c,
    440,
    280,
    [-420, -360],
    [
      box(
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 440,
          height: 280,
          padding: '32px 40px',
          alignItems: 'center',
          gap: 32,
        },
        [
          node(
            'svg',
            { width: 120, height: 120, viewBox: '0 0 48 48', style: { flexShrink: 0, overflow: 'visible' } },
            [
              node('defs', {}, [
                node('filter', { id: 'bead', x: '-100%', y: '-100%', width: '300%', height: '300%' }, [
                  node('feGaussianBlur', { stdDeviation: 2.4 }),
                ]),
              ]),
              node('path', {
                d: LOGO_RING,
                fill: 'none',
                stroke: c.ink,
                'stroke-width': 4.5,
                'stroke-linecap': 'round',
              }),
              node('circle', { cx: 24, cy: 9, r: 5, fill: c.lamp, filter: 'url(#bead)', opacity: 0.8 }),
              node('circle', { cx: 24, cy: 9, r: 4.2, fill: c.lamp }),
            ],
          ),
          box({ flexDirection: 'column', gap: 8, flexGrow: 1, flexBasis: 0, minWidth: 0 }, [
            box({ fontSize: 40, lineHeight: '48px', fontWeight: 600, letterSpacing: -0.8 }, 'AwakeTab'),
            box(
              { fontSize: 20, lineHeight: '28px', color: c.ink2, textWrap: 'balance' },
              'Keep your screen or computer awake',
            ),
          ]),
        ],
      ),
    ],
  );
}

export interface IShot {
  file: string;
  board: string;
  copy: ICopy;
  art: (c: TPalette) => INode[];
}

// Copy is bounded by apps/extension/store/listing.md, as on the board. Satori has no text-wrap: pretty, so one
// no-break space keeps the board's line breaks in the Screen or System paragraph.
export const SHOTS: IShot[] = [
  {
    file: 'screenshot-1-popup.png',
    board: 'Store 1 (StoreAssets, kind shot1)',
    copy: {
      kicker: 'Chrome extension',
      headline: 'Keeps your screen on, even with the tab hidden',
      sub: 'The popup says Screen awake only after Chrome accepts the request. The badge shows the minutes left.',
      limit: 'Works while Chrome is running. A closed laptop lid still sleeps.',
    },
    art: browserShot,
  },
  {
    file: 'screenshot-2-screen-or-system.png',
    board: 'Store 2 (StoreShot2 → StoreAssets, kind shot4)',
    copy: {
      kicker: 'Two levels',
      headline: 'Screen or System',
      sub: 'Screen keeps the display on. System keeps the computer awake and lets the\u00a0screen dim, and the popup says exactly that.',
      limit: 'System never says Screen awake.',
    },
    art: (c) =>
      pairShot(c, [
        { name: 'Screen', note: 'Display stays on', state: POPUPS.awake, line: c.lampLine },
        { name: 'System', note: 'Screen may dim or lock', state: POPUPS.system, line: c.line2 },
      ]),
  },
  {
    file: 'screenshot-3-toolbar-badge.png',
    board: 'Store 3 (StoreShot3 → StoreAssets, kind shot3)',
    copy: {
      kicker: 'Toolbar badge',
      headline: 'The badge tells the truth',
      sub: 'Blank when idle. Minutes left, ON or SYS only while Chrome holds the request. Alt+Shift+A toggles it from any tab.',
      limit: 'No badge ever claims more than the popup.',
    },
    art: badgeShot,
  },
  {
    file: 'screenshot-4-lengths.png',
    board: 'Store 4 (StoreShot4 → StoreAssets, kind presets)',
    copy: {
      kicker: 'Lengths',
      headline: '15 min to 4 h, or until a time',
      sub: 'Seven lengths and an end time, one click each. Past midnight it says tomorrow, and the badge counts down.',
      limit: 'Start uses your default length, or Alt+Shift+A from any tab.',
    },
    art: (c) =>
      pairShot(c, [
        { name: 'Pick a length', note: '2 h session', state: POPUPS.long, line: c.lampLine },
        { name: 'Or an end time', note: 'Past midnight', state: POPUPS.overnight, line: c.line2 },
      ]),
  },
  {
    file: 'screenshot-5-pro-auto-start.png',
    board: 'Store 5 (StoreShot5 → StoreAssets, kind shot5)',
    copy: {
      kicker: 'AwakeTab Pro',
      headline: 'Starts itself when you need it',
      sub: 'One Pro key works on five devices across the web app and the extension.',
      limit: 'Chrome asks before AwakeTab can see a site you add. Page content is never read.',
      list: ['Keep awake whenever Chrome starts', 'Start on sites you choose', 'Weekly schedules'],
    },
    art: optionsShot,
  },
];

async function loadFonts(satoriEntry: string) {
  const fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: 'normal' }> = [];
  const families: Array<[string, string, number[]]> = [
    ['Geist', 'geist-latin-wght-normal.woff2', [300, 400, 500, 600]],
    ['Geist Mono', 'geist-mono-latin-wght-normal.woff2', [400]],
  ];
  for (const [name, file, weights] of families) {
    const ttf = woff2ToTtf(await readFile(path.join(WEB, 'public/fonts', file)));
    for (const weight of weights)
      fonts.push({ name, data: await staticInstance(ttf, weight, satoriEntry), weight, style: 'normal' });
  }
  // The latin Geist subset has no ∞; like the pages, the chip falls back along --at-font, here to Noto Sans JP.
  const noto = await readFile(
    path.join(
      path.dirname(requireWeb.resolve('@fontsource/noto-sans-jp/package.json')),
      'files/noto-sans-jp-73-500-normal.woff',
    ),
  );
  fonts.push({
    name: 'Noto Sans JP',
    data: noto.buffer.slice(noto.byteOffset, noto.byteOffset + noto.byteLength),
    weight: 500,
    style: 'normal',
  });
  return fonts;
}

export async function renderAll(outDir: string): Promise<Record<string, Uint8Array>> {
  const satoriEntry = requireWeb.resolve('satori');
  const satoriModule = (await import(pathToFileURL(satoriEntry).href)) as {
    default: TSatori | { default: TSatori };
  };
  const satori = typeof satoriModule.default === 'function' ? satoriModule.default : satoriModule.default.default;
  const { Resvg } = (await import(pathToFileURL(requireWeb.resolve('@resvg/resvg-js')).href)) as { Resvg: TResvg };
  const fonts = await loadFonts(satoriEntry);
  const opentype = createRequire(satoriEntry)('@shuding/opentype.js') as {
    parse(data: ArrayBuffer): { getAdvanceWidth(text: string, size: number, options: { kerning: boolean }): number };
  };
  const faces = new Map(fonts.filter((f) => f.name === 'Geist').map((f) => [f.weight, opentype.parse(f.data)]));
  const c = await palette((text, size, weight) => {
    const face = faces.get(weight);
    if (!face) throw new Error(`font: no Geist ${String(weight)}`);
    return face.getAdvanceWidth(text, size, { kerning: true });
  });
  const { zlibSync } = createRequire(satoriEntry)('fflate') as { zlibSync: TZlib };
  const png = async (tree: INode, width: number, height: number) => {
    const image = new Resvg(await satori(tree, { width, height, fonts }), {
      background: c.ground,
      fitTo: { mode: 'width', value: width },
    }).render();
    return rgbPng(image.pixels, image.width, image.height, zlibSync);
  };

  const out: Record<string, Uint8Array> = {};
  for (const shot of SHOTS) {
    const tree = scene(c, 1280, 800, [460, -160], [copyColumn(c, shot.copy), ...shot.art(c)]);
    out[shot.file] = await png(tree, 1280, 800);
  }
  out['promo-440x280.png'] = await png(promo(c), 440, 280);
  await mkdir(outDir, { recursive: true });
  for (const [file, bytes] of Object.entries(out)) await writeFile(path.join(outDir, file), bytes);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'store/images');
  const files = await renderAll(dir);
  process.stdout.write(`${String(Object.keys(files).length)} images → ${path.relative(ROOT, dir)}\n`);
}
