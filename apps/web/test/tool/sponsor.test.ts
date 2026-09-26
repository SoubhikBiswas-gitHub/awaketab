import { describe, expect, it } from 'vitest';
import { parseSponsor } from '../../src/tool/sponsor.js';

const VALID = {
  enabled: true,
  id: 'acme_2026-q3',
  name: 'Acme Lamps',
  text: 'Desk lamps that stay on as long as your screen does.',
  url: 'https://acme.example/lamps?utm_source=awaketab',
};

describe('parseSponsor (docs/09)', () => {
  it('accepts a valid config', () => {
    expect(parseSponsor(VALID)).toEqual(VALID);
  });

  it('trims and caps the text fields', () => {
    const cfg = parseSponsor({ ...VALID, name: `  ${'N'.repeat(100)}  `, text: 'T'.repeat(500) });
    expect(cfg?.name).toBe('N'.repeat(60));
    expect(cfg?.text).toHaveLength(140);
  });

  it.each([
    ['null', null],
    ['a string', 'enabled'],
    ['disabled', { ...VALID, enabled: false }],
    ['enabled as a string', { ...VALID, enabled: 'true' }],
    ['an http: URL', { ...VALID, url: 'http://acme.example/' }],
    ['a javascript: URL', { ...VALID, url: 'javascript:alert(1)' }],
    ['a relative URL', { ...VALID, url: '/lamps' }],
    ['an unparseable URL', { ...VALID, url: 'not a url' }],
    ['an upper-case id', { ...VALID, id: 'Acme' }],
    ['an id with spaces', { ...VALID, id: 'acme lamps' }],
    ['an id with markup', { ...VALID, id: '<b>' }],
    ['an empty id', { ...VALID, id: '' }],
    ['a missing name', { ...VALID, name: undefined }],
    ['a blank name', { ...VALID, name: '   ' }],
    ['a missing text', { ...VALID, text: undefined }],
    ['a non-string text', { ...VALID, text: 42 }],
    ['a missing url', { ...VALID, url: undefined }],
  ])('rejects %s', (_name, raw) => {
    expect(parseSponsor(raw)).toBeNull();
  });
});
