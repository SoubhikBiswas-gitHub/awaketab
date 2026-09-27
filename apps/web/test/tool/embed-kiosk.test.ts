import type { ILicenseState } from '@awaketab/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyKioskBranding,
  applyKioskHash,
  KIOSK_LOGO_MAX,
  parseLogo,
  readLicHash,
} from '../../src/tool/embed/kiosk.js';
import { license, makeCtx } from './ctx-helper.js';

const TOKEN = 'eyJhbGciOiJFUzI1NiJ9.eyJwbGFuIjoiYml6X2tpb3NrX3NpdGUifQ.c2ln';
const loc = (hash: string) => ({ hash, pathname: '/', search: '?autostart=1' });
const verified = (
  plan: string,
  features: string[] = ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
) =>
  vi.fn(() =>
    Promise.resolve({
      valid: true,
      plan,
      features,
      exp: Math.floor(Date.now() / 1000) + 365 * 86_400,
      grace: false,
    } as ILicenseState),
  );

afterEach(() => {
  document.documentElement.removeAttribute('data-kiosk');
});

describe('#lic= kiosk hash (docs/09 §7.2)', () => {
  it('parses only a JWT-shaped token', () => {
    expect(readLicHash(`#lic=${TOKEN}`)).toBe(TOKEN);
    expect(readLicHash('#lic=abc')).toBeNull();
    expect(readLicHash('#lic=a.b.c<script>')).toBeNull();
    expect(readLicHash('#other')).toBeNull();
  });

  it('verifies offline without device binding, stores a kiosk licence and strips the hash', async () => {
    const { ctx, storage } = makeCtx();
    const replaceState = vi.fn();
    const verify = verified('biz_kiosk_site');
    expect(await applyKioskHash(ctx, loc(`#lic=${TOKEN}`), { replaceState }, verify)).toBe('stored');
    expect(verify).toHaveBeenCalledWith(TOKEN, { deviceId: '' });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?autostart=1');
    expect(storage.license()).toMatchObject({
      token: TOKEN,
      plan: 'biz_kiosk_site',
      deviceId: '',
      deviceLabel: 'kiosk',
    });
    expect(ctx.store.get().license?.features).toContain('kiosk.branding');
  });

  it.each([
    ['a Pro token (per-device, never shared by URL)', verified('pro_yearly', ['ambient.packs'])],
    [
      'an invalid signature',
      vi.fn(() =>
        Promise.resolve({ valid: false, plan: null, features: [], exp: null, grace: false } as ILicenseState),
      ),
    ],
  ])('rejects %s, strips the hash and says so', async (_label, verify) => {
    const { ctx, storage, root } = makeCtx({ html: '<div data-toasts></div>' });
    const replaceState = vi.fn();
    expect(await applyKioskHash(ctx, loc(`#lic=${TOKEN}`), { replaceState }, verify)).toBe('invalid');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?autostart=1');
    expect(storage.license()).toBeNull();
    expect(ctx.store.get().ui.toasts.map((t) => t.id)).toContain('kiosk');
    expect(root).toBeTruthy();
  });

  it('strips a malformed #lic= without verifying anything', async () => {
    const { ctx } = makeCtx();
    const replaceState = vi.fn();
    const verify = vi.fn();
    expect(await applyKioskHash(ctx, loc('#lic=garbage'), { replaceState }, verify)).toBe('invalid');
    expect(verify).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalled();
  });

  it('ignores URLs without #lic=', async () => {
    const { ctx } = makeCtx();
    const replaceState = vi.fn();
    expect(await applyKioskHash(ctx, loc('#top'), { replaceState })).toBe('none');
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe('logo= and kiosk branding', () => {
  it('accepts only https logos without credentials, within the length cap', () => {
    expect(parseLogo('?logo=https%3A%2F%2Fcdn.example.com%2Flogo.png')).toBe('https://cdn.example.com/logo.png');
    expect(parseLogo('?logo=http%3A%2F%2Fcdn.example.com%2Flogo.png')).toBeNull();
    expect(parseLogo('?logo=javascript%3Aalert(1)')).toBeNull();
    expect(parseLogo('?logo=https%3A%2F%2Fu%3Ap%40cdn.example.com%2Fl.png')).toBeNull();
    expect(
      parseLogo(`?logo=${encodeURIComponent(`https://cdn.example.com/${'a'.repeat(KIOSK_LOGO_MAX)}`)}`),
    ).toBeNull();
    expect(parseLogo('?autostart=1')).toBeNull();
  });

  it('shows the logo and hides the wordmark only with the licence features', () => {
    const html = '<div data-panel></div><dialog data-ambient></dialog>';
    const free = makeCtx({ html });
    applyKioskBranding(free.ctx, 'https://cdn.example.com/logo.png');
    expect(document.querySelectorAll('[data-kiosk-logo]')).toHaveLength(0);
    expect(document.documentElement.hasAttribute('data-kiosk')).toBe(false);

    const kiosk = makeCtx({
      html,
      license: { ...license(['kiosk.branding', 'ambient.logo']), plan: 'biz_kiosk_site' },
    });
    applyKioskBranding(kiosk.ctx, 'https://cdn.example.com/logo.png');
    const logos = [...document.querySelectorAll<HTMLImageElement>('[data-kiosk-logo]')];
    expect(logos).toHaveLength(2);
    expect(logos[0]?.getAttribute('src')).toBe('https://cdn.example.com/logo.png');
    expect(logos[0]?.alt).toBe('');
    expect(logos[0]?.referrerPolicy).toBe('no-referrer');
    expect(document.documentElement.hasAttribute('data-kiosk')).toBe(true);
  });
});
