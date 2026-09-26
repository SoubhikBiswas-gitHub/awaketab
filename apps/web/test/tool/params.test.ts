import { describe, expect, it } from 'vitest';
import { parseToolParams } from '../../src/tool/params';

const at = (pathname: string, search = '') => parseToolParams({ pathname, search }, {});

describe('parseToolParams canonicalPath (history.replaceState target, docs/05 §10)', () => {
  it('keeps the locale prefix so a reload stays in the reader’s language', () => {
    expect(at('/es/').canonicalPath).toBe('/es');
    expect(at('/es/for/cocinar', '?autostart=1').canonicalPath).toBe('/es/for/cocinar');
    expect(at('/pt-br/on/iphone-safari/').canonicalPath).toBe('/pt-br/on/iphone-safari');
  });

  it('drops only the query and a trailing slash', () => {
    expect(at('/', '?preset=p30&ref=hn').canonicalPath).toBe('/');
    expect(at('/30m/').canonicalPath).toBe('/30m');
    expect(at('/until/17-30').canonicalPath).toBe('/until/17-30');
  });

  it('still matches routes on the locale-free path', () => {
    expect(at('/es/30m').routePreset).toBe('p30');
    expect(at('/es/for/cocinar').isToolAutostartRoute).toBe(false);
    expect(at('/es/').isToolAutostartRoute).toBe(true);
  });
});
