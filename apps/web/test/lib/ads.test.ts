import { afterEach, describe, expect, it } from 'vitest';

import { licenseIsAdsFree } from '../../src/lib/ads';

describe('licenseIsAdsFree', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('is false without a licence', () => {
    expect(licenseIsAdsFree()).toBe(false);
  });

  it('is true when the stored licence includes ads.free', () => {
    localStorage.setItem('at.v1.license', JSON.stringify({ features: ['ambient.packs', 'ads.free'] }));
    expect(licenseIsAdsFree()).toBe(true);
  });
});
