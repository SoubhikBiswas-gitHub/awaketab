/**
 * Accent palettes (docs/05 §1.1a). Settings store the light-theme hex (docs/08 §2.1); the palette id goes on
 * <html data-accent> and tokens.css swaps the `--at-accent*` values per theme. Amber is the default and has
 * no attribute. Teal and Rose are the first `ambient.packs` palette pack. public/theme-boot.js mirrors this
 * map so the accent paints before first frame.
 */
export const ACCENTS = {
  '#B86E00': 'amber',
  '#4F46E5': 'indigo',
  '#0F766E': 'teal',
  '#BE123C': 'rose',
} as const;

export type TAccentId = (typeof ACCENTS)[keyof typeof ACCENTS];

export const PACK_ACCENTS: ReadonlySet<string> = new Set(['#0F766E', '#BE123C']);
export const DEFAULT_ACCENT = '#B86E00';

export function accentId(hex: string, packs: boolean): TAccentId {
  const key = hex.toUpperCase() as keyof typeof ACCENTS;
  const id = ACCENTS[key] as TAccentId | undefined;
  if (!id || (PACK_ACCENTS.has(key) && !packs)) return 'amber';
  return id;
}

export function applyAccent(hex: string, packs: boolean, doc: Document = document): TAccentId {
  const id = accentId(hex, packs);
  if (id === 'amber') delete doc.documentElement.dataset.accent;
  else doc.documentElement.dataset.accent = id;
  return id;
}
