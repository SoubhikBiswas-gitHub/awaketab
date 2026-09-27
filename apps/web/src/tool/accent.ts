/**
 * Lamp colours (DESIGN.md §2.2, docs/05 §1.1a). Settings store the light-theme hex (docs/08 §2.1); the lamp id
 * goes on <html data-accent> and tokens.css swaps the `--at-accent*` values per theme. Aqua is the default and
 * has no attribute. Mint and Sky are the `ambient.packs` lamps. src/boot/boot.js mirrors this map (and the
 * legacy one) so the lamp paints before first frame.
 */
export const ACCENTS = {
  '#087B87': 'aqua',
  '#5A47CF': 'violet',
  '#167A50': 'mint',
  '#255FBD': 'sky',
} as const;

export type TAccentId = (typeof ACCENTS)[keyof typeof ACCENTS];

/** Pre-Clear-Night palette hexes still found in stored settings → the lamp that replaces them. */
export const LEGACY_ACCENTS: Readonly<Record<string, keyof typeof ACCENTS>> = {
  '#B86E00': '#087B87', // amber → aqua
  '#4F46E5': '#5A47CF', // indigo → violet
  '#0F766E': '#167A50', // teal → mint
  '#BE123C': '#255FBD', // rose → sky
};

export const PACK_ACCENTS: ReadonlySet<string> = new Set(['#167A50', '#255FBD']);
export const DEFAULT_ACCENT = '#087B87';

/** The stored value as a current lamp hex: legacy hexes migrate, unknown values become the default. */
export function accentHex(hex: string): keyof typeof ACCENTS {
  const up = hex.toUpperCase();
  const key = (LEGACY_ACCENTS[up] ?? up) as keyof typeof ACCENTS;
  return key in ACCENTS ? key : DEFAULT_ACCENT;
}

export function accentId(hex: string, packs: boolean): TAccentId {
  const key = accentHex(hex);
  if (PACK_ACCENTS.has(key) && !packs) return 'aqua';
  return ACCENTS[key];
}

export function applyAccent(hex: string, packs: boolean, doc: Document = document): TAccentId {
  const id = accentId(hex, packs);
  if (id === 'aqua') delete doc.documentElement.dataset.accent;
  else doc.documentElement.dataset.accent = id;
  return id;
}
