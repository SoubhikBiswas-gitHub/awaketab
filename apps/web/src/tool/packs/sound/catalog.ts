import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';

export const GENS = ['brown', 'pink', 'white', 'rain', 'cafe', 'fire', 'lofi'] as const;
export type TGen = (typeof GENS)[number];

const CHIMES = ['bell', 'soft', 'digital', 'birds'] as const;
export type TChimeId = (typeof CHIMES)[number];

export const isGen = (k: string): k is TGen => (GENS as readonly string[]).includes(k);
export const isChime = (k: string): k is TChimeId => (CHIMES as readonly string[]).includes(k);

// Stored settings are user-editable: every nested field is checked before use.
export function readFocus(s: ISettings): ISettings['focusSound'] {
  const cur = s.focusSound as Partial<ISettings['focusSound']> | undefined;
  const mix: ISettings['focusSound']['mix'] = {};
  for (const g of GENS) {
    const v = cur?.mix?.[g];
    if (typeof v === 'number' && v >= 0 && v <= 1) mix[g] = v;
  }
  const vol = cur?.volume;
  return {
    kind: typeof cur?.kind === 'string' ? cur.kind : 'none',
    volume: typeof vol === 'number' && vol >= 0 && vol <= 1 ? vol : DEFAULT_SETTINGS.focusSound.volume,
    mix,
    stopAtEnd: cur?.stopAtEnd !== false,
  };
}
