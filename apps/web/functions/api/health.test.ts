import { describe, expect, it } from 'vitest';

import { onRequestGet } from './health';

describe('GET /api/health', () => {
  it('returns health and deployment version without caching', async () => {
    const response = await onRequestGet({
      env: { CF_PAGES_COMMIT_SHA: '1234567890abcdef' },
    } as unknown as Parameters<typeof onRequestGet>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      ok: true,
      version: '1234567890ab',
      polar: 'sandbox',
    });
  });

  it('reports which Polar the licence API uses (PUBLIC_POLAR_SERVER, F-06)', async () => {
    const response = await onRequestGet({
      env: { CF_PAGES_COMMIT_SHA: '1234567890abcdef', PUBLIC_POLAR_SERVER: 'production' },
    } as unknown as Parameters<typeof onRequestGet>[0]);
    expect(((await response.json()) as { polar: string }).polar).toBe('production');
  });
});
