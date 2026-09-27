import { DEFAULT_SETTINGS, PRESET_MS } from '@awaketab/core';
import { splitDigits } from '../tool/format';

type TT = (key: string, vars?: Record<string, string | number>) => string;

export interface IToolReady {
  chip: string;
  sec: number;
  a: string;
  b: string;
  len: string;
  cta: string;
  ctaAria: string;
  meta: string;
  of: string;
}

const isPreset = (id: string): id is keyof typeof PRESET_MS => id in PRESET_MS;

// The Ready state the island's first render shows (tool/ui/view.ts), drawn at build time so the first paint already
// equals it: the page's length (its route, the embedding page's, /8h, or the default), its digits and the lamp label.
export function toolReady(t: TT, preset: string | undefined, eight: boolean): IToolReady {
  const id = eight
    ? 'custom'
    : preset && (preset === 'pinf' || isPreset(preset))
      ? preset
      : DEFAULT_SETTINGS.defaultPreset;
  const sec = eight ? 28_800 : isPreset(id) ? PRESET_MS[id] / 1000 : 0;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  const len = !sec
    ? '∞'
    : h && m
      ? t('tool.len.hm', { h, m })
      : h
        ? t('tool.len.hours', { h })
        : t('tool.len.min', { m });
  const [a, b] = splitDigits(sec);
  const cta = t('tool.cta.keep', { length: len });
  return {
    chip: id,
    sec,
    a,
    b,
    len,
    cta,
    ctaAria: sec ? cta : t('tool.cta.keepInf'),
    meta: t(sec ? 'tool.meta.endsAt' : 'tool.meta.untilStop'),
    of: sec ? t('tool.ofTotal', { length: len }) : t('tool.noLimit'),
  };
}
