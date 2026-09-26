import { describe, expect, it } from 'vitest';

import type { TPlanId } from '@awaketab/core';

import {
  CHECKOUT_LINKS,
  CHECKOUT_LINKS_PRODUCTION,
  CHECKOUT_LINKS_SANDBOX,
  CHECKOUT_PLACEHOLDER,
  checkoutLinks,
  POLAR_SERVER,
  toPolarServer,
} from '../../src/lib/checkout';
import { PLAN_PRICES } from '../../src/lib/license';

const PLANS: TPlanId[] = ['pro_yearly', 'pro_lifetime', 'biz_embed_site_yearly', 'biz_kiosk_site', 'biz_kiosk_5'];

describe('CHECKOUT_LINKS follow PUBLIC_POLAR_SERVER (F-06)', () => {
  it('sandbox: every plan links to sandbox.polar.sh', () => {
    const links = checkoutLinks('sandbox');
    expect(Object.keys(links).sort()).toEqual([...PLANS].sort());
    for (const plan of PLANS) expect(links[plan]).toMatch(/^https:\/\/sandbox\.polar\.sh\/checkout\//u);
    expect(links).toBe(CHECKOUT_LINKS_SANDBOX);
  });

  it('production: every plan has a non-sandbox https link (placeholders until N-04 step 4)', () => {
    const links = checkoutLinks('production');
    expect(Object.keys(links).sort()).toEqual([...PLANS].sort());
    for (const plan of PLANS) {
      expect(links[plan]).toMatch(/^https:\/\//u);
      expect(links[plan]).not.toContain('sandbox');
    }
    expect(links).toBe(CHECKOUT_LINKS_PRODUCTION);
    expect(new Set(Object.values(links)).size).toBe(PLANS.length);
    // Placeholders are marked, so scripts/check-keys.mts can refuse a production build that still has them.
    expect(Object.values(links).every((url) => url.includes(CHECKOUT_PLACEHOLDER))).toBe(true);
  });

  it('only "production" selects production; anything else is the sandbox', () => {
    expect(toPolarServer('production')).toBe('production');
    for (const value of [undefined, '', 'sandbox', 'prod', 'Production']) expect(toPolarServer(value)).toBe('sandbox');
  });

  it('the test bundle is a sandbox build (vitest defines __AT_POLAR_SERVER__ = sandbox)', () => {
    expect(POLAR_SERVER).toBe('sandbox');
    expect(CHECKOUT_LINKS).toBe(CHECKOUT_LINKS_SANDBOX);
  });

  it('every priced plan that sells through Polar has a link in both modes', () => {
    for (const plan of PLANS) {
      expect(PLAN_PRICES[plan]).toBeGreaterThan(0);
      expect(CHECKOUT_LINKS_SANDBOX[plan]).toBeTruthy();
      expect(CHECKOUT_LINKS_PRODUCTION[plan]).toBeTruthy();
    }
  });
});
