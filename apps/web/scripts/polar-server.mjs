// F-06 / docs/09 §1: `PUBLIC_POLAR_SERVER` (`sandbox` | `production`, default `sandbox`) is the one switch between
// Polar sandbox and production. The same Cloudflare Pages variable is read twice:
//   - at build time, here, from the process environment (Pages build variables; `.env` files are not read), and
//     handed to the bundles through `define` — it picks CHECKOUT_LINKS (src/lib/checkout.ts) and whether the
//     bundle trusts the dev licence key (`__AT_LICENSE_DEV_KEY__`, @awaketab/core);
//   - at run time by the Pages Functions (`functions/_lib/polar.ts` picks the Polar API base from it).

export const POLAR_SERVERS = /** @type {const} */ (['sandbox', 'production']);

/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {'sandbox' | 'production'}
 */
export function polarServer(env = process.env) {
  const value = env.PUBLIC_POLAR_SERVER?.trim() ?? '';
  if (value === '') return 'sandbox';
  if (value === 'sandbox' || value === 'production') return value;
  throw new Error(`PUBLIC_POLAR_SERVER must be "sandbox" or "production" (got ${JSON.stringify(value)})`);
}

/**
 * The `define` entries every bundle of the web app and the extension gets.
 * @param {Record<string, string | undefined>} [env]
 */
export function polarDefines(env = process.env) {
  const server = polarServer(env);
  return {
    __AT_POLAR_SERVER__: JSON.stringify(server),
    __AT_LICENSE_DEV_KEY__: JSON.stringify(server !== 'production'),
  };
}
