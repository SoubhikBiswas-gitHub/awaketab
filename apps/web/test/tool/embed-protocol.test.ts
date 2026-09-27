import { describe, expect, it } from 'vitest';
import {
  EMBED_BOX,
  EMBED_MAX_HEIGHT,
  EMBED_MIN_HEIGHT,
  embedLocale,
  embedQuery,
  isHostname,
  optionsFromDataset,
  parseEmbedQuery,
  parsePageMessage,
  parseWall,
  parseWidgetMessage,
  reservedHeight,
} from '../../src/tool/embed/protocol.js';

describe('reserved boxes (docs/11 §2, O-58)', () => {
  it('reserves 104 for compact and 240 for full, and the taller layouts in narrow containers', () => {
    expect(EMBED_BOX.compact).toEqual({ width: '320px', height: 104, radius: 16 });
    expect(EMBED_BOX.full).toEqual({ width: '100%', height: 240, radius: 28 });
    expect(reservedHeight({ size: 'compact', mode: 'cook' }, 0)).toBe(104);
    expect(reservedHeight({ size: 'compact', mode: 'clock' }, 320)).toBe(104);
    expect(reservedHeight({ size: 'compact', mode: 'clock' }, 280)).toBe(116);
    expect(reservedHeight({ size: 'full', mode: 'cook' }, 390)).toBe(420);
    expect(reservedHeight({ size: 'full', mode: 'cook' }, 720)).toBe(240);
    expect(reservedHeight({ size: 'full', mode: 'standard' }, 390)).toBe(240);
  });
});

describe('embed protocol: loader attributes and iframe params (docs/11 §1)', () => {
  it('applies the documented defaults', () => {
    expect(optionsFromDataset({}, 'en')).toEqual({
      mode: 'cook',
      theme: 'auto',
      lang: 'en',
      size: 'compact',
      preset: 'pinf',
      until: null,
    });
  });

  it('drops values outside the allow-lists instead of passing them on', () => {
    const opts = optionsFromDataset({ mode: 'night', theme: 'neon', size: 'huge', preset: 'p999', lang: 'xx' }, 'en');
    expect(opts).toMatchObject({ mode: 'cook', theme: 'auto', size: 'compact', preset: 'pinf', lang: 'en' });
  });

  it.each([
    ['pt-BR', 'pt-br'],
    ['pt', 'pt-br'],
    ['zh-Hans', 'zh'],
    ['zh-CN', 'zh'],
    ['en-US', 'en'],
    ['de_DE', 'de'],
    ['HI', 'hi'],
    ['ko', 'en'],
    ['', 'en'],
  ])('maps page language %s to %s', (raw, want) => {
    expect(embedLocale(raw)).toBe(want);
  });

  it('uses the page <html lang> when data-lang is absent', () => {
    expect(optionsFromDataset({}, 'fr-CA').lang).toBe('fr');
    expect(optionsFromDataset({ lang: 'ja' }, 'fr-CA').lang).toBe('ja');
  });

  it('keeps `until` only with a valid wall time', () => {
    expect(optionsFromDataset({ preset: 'until', until: '18:30' }, 'en')).toMatchObject({
      preset: 'until',
      until: '18:30',
    });
    expect(optionsFromDataset({ preset: 'until', until: '25:00' }, 'en')).toMatchObject({
      preset: 'pinf',
      until: null,
    });
    expect(optionsFromDataset({ preset: 'p30', until: '18:30' }, 'en').until).toBeNull();
  });

  it('builds the iframe query in the documented order and validates the host', () => {
    const opts = optionsFromDataset({}, 'en');
    expect(embedQuery(opts, 'example.com')).toBe(
      'mode=cook&theme=auto&lang=en&size=compact&preset=pinf&host=example.com',
    );
    expect(embedQuery(opts, 'bad host')).not.toContain('host=');
    expect(embedQuery({ ...opts, preset: 'until', until: '07:05' }, '')).toContain('until=07-05');
  });

  it('round-trips through the widget parser', () => {
    const opts = optionsFromDataset({ mode: 'clock', theme: 'oled', size: 'full', preset: 'p60', lang: 'hi' }, 'en');
    expect(parseEmbedQuery(`?${embedQuery(opts, 'recipes.example.org')}`)).toEqual({
      ...opts,
      host: 'recipes.example.org',
    });
  });

  it('never trusts a malformed host param', () => {
    expect(parseEmbedQuery('?host=evil.com/path').host).toBeNull();
    expect(parseEmbedQuery('?host=EXAMPLE.COM').host).toBeNull();
    expect(parseEmbedQuery('?host=<script>').host).toBeNull();
  });

  it('recognises hostnames only', () => {
    for (const ok of ['example.com', 'localhost', 'a-b.c.example.co.uk', '192.168.1.10'])
      expect(isHostname(ok)).toBe(true);
    for (const bad of ['', 'Example.com', 'ex ample.com', '-a.com', 'a..com', 'a.com:8080', 'http://a.com', null]) {
      expect(isHostname(bad)).toBe(false);
    }
  });

  it('parses wall times', () => {
    expect(parseWall('07-05')).toBe('07:05');
    expect(parseWall('23:59')).toBe('23:59');
    expect(parseWall('24:00')).toBeNull();
    expect(parseWall(730)).toBeNull();
  });
});

describe('embed protocol: postMessage payloads (docs/11 §3)', () => {
  it('accepts the three page commands', () => {
    expect(parsePageMessage({ type: 'awaketab:stop' })).toEqual({ type: 'awaketab:stop' });
    expect(parsePageMessage({ type: 'awaketab:theme', theme: 'dark' })).toEqual({
      type: 'awaketab:theme',
      theme: 'dark',
    });
    expect(parsePageMessage({ type: 'awaketab:start' })).toEqual({ type: 'awaketab:start' });
    expect(parsePageMessage({ type: 'awaketab:start', preset: 'p45', ms: 600_000, until: '06-30' })).toEqual({
      type: 'awaketab:start',
      preset: 'p45',
      ms: 600_000,
      until: '06:30',
    });
  });

  it.each([
    ['null', null],
    ['a string', 'awaketab:start'],
    ['an array', [{ type: 'awaketab:start' }]],
    ['an unknown type', { type: 'awaketab:eval', code: '1' }],
    ['a bad theme', { type: 'awaketab:theme', theme: 'hotpink' }],
    ['a bad preset', { type: 'awaketab:start', preset: 'p999' }],
    ['preset until without a time', { type: 'awaketab:start', preset: 'until' }],
    ['a fractional ms', { type: 'awaketab:start', ms: 60_000.5 }],
    ['ms under a minute', { type: 'awaketab:start', ms: 1000 }],
    ['ms over seven days', { type: 'awaketab:start', ms: 8 * 86_400_000 }],
    ['a bad until', { type: 'awaketab:start', until: '9pm' }],
  ])('rejects %s', (_label, data) => {
    expect(parsePageMessage(data)).toBeNull();
  });

  it('parses widget events and clamps resize heights', () => {
    expect(parseWidgetMessage({ type: 'awaketab:ready', version: '1' })).toEqual({
      type: 'awaketab:ready',
      version: '1',
    });
    expect(parseWidgetMessage({ type: 'awaketab:resize', height: 5 })).toEqual({
      type: 'awaketab:resize',
      height: EMBED_MIN_HEIGHT,
    });
    expect(parseWidgetMessage({ type: 'awaketab:resize', height: 99_999 })).toEqual({
      type: 'awaketab:resize',
      height: EMBED_MAX_HEIGHT,
    });
    expect(parseWidgetMessage({ type: 'awaketab:resize', height: Number.NaN })).toBeNull();
    expect(
      parseWidgetMessage({ type: 'awaketab:state', lock: 'held', status: 'active', endsAt: 5, mode: 'cook' }),
    ).toEqual({
      type: 'awaketab:state',
      lock: 'held',
      status: 'active',
      endsAt: 5,
      mode: 'cook',
    });
    expect(parseWidgetMessage({ type: 'awaketab:state', lock: 1, status: 'active' })).toBeNull();
    expect(parseWidgetMessage({ type: 'other' })).toBeNull();
  });
});
