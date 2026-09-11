import { describe, expect, it } from 'vitest';
import { matchLocale } from '../../src/i18n/match';

describe('matchLocale', () => {
  it('prefers Brazilian Portuguese over generic Portuguese', () => {
    expect(matchLocale(['pt-BR', 'en'])).toBe('pt-br');
  });

  it('maps zh-CN to zh and ignores English when it is already first', () => {
    expect(matchLocale(['en-US'])).toBe('en');
    expect(matchLocale(['zh-CN', 'en'])).toBe('zh');
  });

  it('returns the first supported non-default locale', () => {
    expect(matchLocale(['sv-SE', 'de-DE', 'en'])).toBe('de');
  });
});
