import type { TPlanId } from '@awaketab/core';

/**
 * Polar checkout links (docs/09 §1, docs/00 §13.3 `CHECKOUT_LINKS`). F-06: `PUBLIC_POLAR_SERVER` picks the set at
 * build time through `define` (`scripts/polar-server.mjs`); the Pages Functions read the same variable at run time
 * for the Polar API base, so one switch moves checkout and licence activation together.
 * Only the `.astro` pages import this module: no tool-page JS.
 */
declare const __AT_POLAR_SERVER__: string | undefined;

export type TPolarServer = 'sandbox' | 'production';

// Polar sandbox org `awaketab` (created 2026-09-26 via the API); each link's success URL is
// https://awaketab.pages.dev/pro/activate?checkout_id={CHECKOUT_ID}.
export const CHECKOUT_LINKS_SANDBOX: Readonly<Record<TPlanId, string>> = {
  pro_yearly: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_hl19dM6c6AmehBiuzDYFRg5lurRsDwJkxbQAU0liBMl/redirect',
  pro_lifetime: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_BxpdJ71IEheYkbOuqrdrKVDLi4wNhhjEyhmTo23rT1R/redirect',
  biz_embed_site_yearly: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_Atyk10vf6DIQD9ICnFuvKN2Z01A9lNUFZjZM113Rwsj/redirect',
  biz_kiosk_site: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_15TOjnz6iwUVlIRJS6jUNvP3sSUkllwxOZmlQ42ezr2/redirect',
  biz_kiosk_5: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_lpGZ6htk6dAFL9EhOD3N8m4ryk7v6z5irdum41Bk9qT/redirect',
};

/** Marks a production link that has not been created in Polar yet. `check-keys.mts` fails a production build on it. */
export const CHECKOUT_PLACEHOLDER = 'PROPOSED-REPLACE';

/**
 * PROPOSED placeholders — Needs Soubhik (LAUNCH-AUDIT N-04 step 4): paste each production checkout link from
 * Polar → Products → Checkout links. A production build refuses to ship while any still contains
 * `CHECKOUT_PLACEHOLDER`.
 */
export const CHECKOUT_LINKS_PRODUCTION: Readonly<Record<TPlanId, string>> = {
  pro_yearly: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-pro-yearly`,
  pro_lifetime: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-pro-lifetime`,
  biz_embed_site_yearly: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-embed`,
  biz_kiosk_site: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-kiosk`,
  biz_kiosk_5: `https://buy.polar.sh/${CHECKOUT_PLACEHOLDER}-kiosk-5`,
};

/** Anything but `production` is the sandbox (the default for local and preview builds). */
export function toPolarServer(value: string | undefined): TPolarServer {
  return value === 'production' ? 'production' : 'sandbox';
}

export function checkoutLinks(server: TPolarServer): Readonly<Record<TPlanId, string>> {
  return server === 'production' ? CHECKOUT_LINKS_PRODUCTION : CHECKOUT_LINKS_SANDBOX;
}

export const POLAR_SERVER: TPolarServer = toPolarServer(typeof __AT_POLAR_SERVER__ === 'undefined' ? undefined : __AT_POLAR_SERVER__);

export const CHECKOUT_LINKS: Readonly<Record<TPlanId, string>> = checkoutLinks(POLAR_SERVER);
