import type { TPlanId } from '@awaketab/core';

declare const __AT_POLAR_SERVER__: string | undefined;

export type TPolarServer = 'sandbox' | 'production';

// Polar sandbox org `awaketab` (created 2026-09-26 via the API); each link's success URL is
// https://awaketab.pages.dev/pro/activate?checkout_id={CHECKOUT_ID}.
export const CHECKOUT_LINKS_SANDBOX: Readonly<Record<TPlanId, string>> = {
  pro_yearly:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_hl19dM6c6AmehBiuzDYFRg5lurRsDwJkxbQAU0liBMl/redirect',
  pro_lifetime:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_BxpdJ71IEheYkbOuqrdrKVDLi4wNhhjEyhmTo23rT1R/redirect',
  biz_embed_site_yearly:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_Atyk10vf6DIQD9ICnFuvKN2Z01A9lNUFZjZM113Rwsj/redirect',
  biz_kiosk_site:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_15TOjnz6iwUVlIRJS6jUNvP3sSUkllwxOZmlQ42ezr2/redirect',
  biz_kiosk_5:
    'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_lpGZ6htk6dAFL9EhOD3N8m4ryk7v6z5irdum41Bk9qT/redirect',
};

export const CHECKOUT_PLACEHOLDER = 'PROPOSED-REPLACE';

export const CHECKOUT_LINKS_PRODUCTION: Readonly<Record<TPlanId, string>> = {
  pro_yearly: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-pro-yearly`,
  pro_lifetime: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-pro-lifetime`,
  biz_embed_site_yearly: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-embed`,
  biz_kiosk_site: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-kiosk`,
  biz_kiosk_5: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-kiosk-5`,
};

export function toPolarServer(value: string | undefined): TPolarServer {
  return value === 'production' ? 'production' : 'sandbox';
}

export function checkoutLinks(server: TPolarServer): Readonly<Record<TPlanId, string>> {
  return server === 'production' ? CHECKOUT_LINKS_PRODUCTION : CHECKOUT_LINKS_SANDBOX;
}

export const POLAR_SERVER: TPolarServer = toPolarServer(
  typeof __AT_POLAR_SERVER__ === 'undefined' ? undefined : __AT_POLAR_SERVER__,
);

export const CHECKOUT_LINKS: Readonly<Record<TPlanId, string>> = checkoutLinks(POLAR_SERVER);
