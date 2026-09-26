import { describe, expect, it } from 'vitest';

import type { IEnv } from './env';
import { apiBase, createPolar, POLAR_API_BASES, polarServer } from './polar';
import { devVars } from '../../test/functions/harness';

function recorder() {
  const urls: string[] = [];
  const fetchFn = ((input: RequestInfo | URL) => {
    urls.push(input instanceof Request ? input.url : String(input));
    return Promise.resolve(Response.json({ status: 'granted', benefit_id: 'b', limit_activations: 5, expires_at: null, customer_id: 'c' }));
  }) as typeof fetch;
  return { urls, fetchFn };
}

const env = (server?: string): IEnv => ({
  POLAR_ACCESS_TOKEN: 't',
  POLAR_ORGANIZATION_ID: 'o',
  ...(server === undefined ? {} : { PUBLIC_POLAR_SERVER: server }),
});

describe('PUBLIC_POLAR_SERVER picks the Polar API (F-06)', () => {
  it('defaults to the sandbox, and only the value "production" reaches production', () => {
    expect(polarServer(env())).toBe('sandbox');
    expect(polarServer(env('sandbox'))).toBe('sandbox');
    expect(polarServer(env(''))).toBe('sandbox');
    expect(polarServer(env('prod'))).toBe('sandbox');
    expect(polarServer(env('Production'))).toBe('sandbox');
    expect(polarServer(env('production'))).toBe('production');
    expect(polarServer(env(' production\n'))).toBe('production');
    expect(apiBase(env())).toBe('https://sandbox-api.polar.sh');
    expect(apiBase(env('production'))).toBe('https://api.polar.sh');
  });

  it.each([
    ['sandbox', POLAR_API_BASES.sandbox],
    ['production', POLAR_API_BASES.production],
  ])('%s: every Polar call goes to %s', async (server, base) => {
    const { urls, fetchFn } = recorder();
    const polar = createPolar(env(server), fetchFn);
    await polar.validate('KEY');
    await polar.activate('KEY', 'label', 'dev');
    await polar.deactivate('KEY', 'act');
    await polar.checkout('chk_1');
    expect(urls).toHaveLength(4);
    for (const url of urls) expect(new URL(url).origin).toBe(base);
  });

  it('reads no other variable: the undocumented POLAR_API_BASE override is gone', async () => {
    const { urls, fetchFn } = recorder();
    const legacy = { ...env('production'), POLAR_API_BASE: 'https://sandbox-api.polar.sh' } as IEnv;
    await createPolar(legacy, fetchFn).validate('KEY');
    expect(new URL(urls[0] ?? '').origin).toBe('https://api.polar.sh');
  });

  it('local runs (.dev.vars.example) stay on the sandbox', () => {
    expect(devVars().PUBLIC_POLAR_SERVER).toBe('sandbox');
    expect(polarServer(env(devVars().PUBLIC_POLAR_SERVER))).toBe('sandbox');
  });
});
