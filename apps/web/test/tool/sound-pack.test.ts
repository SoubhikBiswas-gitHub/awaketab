import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';
import { describe, expect, it } from 'vitest';
import { GENS, isChime, isGen, readFocus } from '../../src/tool/packs/sound/catalog.js';
import { TRACKS } from '../../src/tool/packs/sound/tracks.js';

const withFocus = (focusSound: unknown): ISettings => ({ ...DEFAULT_SETTINGS, focusSound }) as ISettings;

describe('sound catalog', () => {
  it('knows the seven focus sounds and the four pack end sounds', () => {
    expect(GENS).toEqual(['brown', 'pink', 'white', 'rain', 'cafe', 'fire', 'lofi']);
    for (const id of ['bell', 'soft', 'digital', 'birds']) expect(isChime(id), id).toBe(true);
    expect(isChime('chime')).toBe(false);
    expect(isGen('rain')).toBe(true);
    expect(isGen('track:x')).toBe(false);
  });
});

describe('readFocus', () => {
  it('reads the defaults', () => {
    expect(readFocus(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS.focusSound);
  });

  it('fills in a missing or partial focusSound from the defaults', () => {
    expect(readFocus(withFocus(undefined))).toEqual(DEFAULT_SETTINGS.focusSound);
    expect(readFocus(withFocus({ kind: 'rain' }))).toEqual({ ...DEFAULT_SETTINGS.focusSound, kind: 'rain' });
  });

  it('drops corrupt values instead of playing them', () => {
    const f = readFocus(
      withFocus({ kind: 7, volume: 4, stopAtEnd: 'no', mix: { rain: 0.4, fire: 2, cafe: 'x', bogus: 1 } }),
    );
    expect(f).toEqual({ kind: 'none', volume: 0.5, mix: { rain: 0.4 }, stopAtEnd: true });
  });

  it('keeps stopAtEnd off only when it is explicitly false', () => {
    expect(readFocus(withFocus({ stopAtEnd: false })).stopAtEnd).toBe(false);
  });
});

describe('track manifest', () => {
  it('lists only same-origin files with a public-domain licence', () => {
    for (const tr of TRACKS) {
      expect(tr.url, tr.id).toMatch(/^\/audio\/[\w.-]+$/u);
      expect(tr.licence, tr.id).toMatch(/^(?:CC0|Public domain)/u);
      expect(tr.duration, tr.id).toBeGreaterThan(0);
    }
    expect(new Set(TRACKS.map((tr) => tr.id)).size).toBe(TRACKS.length);
  });
});
