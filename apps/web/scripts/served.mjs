// The URL ↔ file contract between the build and Cloudflare Pages (docs/14 §2.1).
//
// Pages serves a static file at exactly one URL and 308-redirects every other spelling ("route matching"):
//   dist/x.html        → /x         (/x/ and /x.html 308 → /x)
//   dist/x/index.html  → /x/        (/x and /x/index.html 308 → /x/)
// Every page URL in docs/00 §7 has no trailing slash, except `/` and the locale homes `/{lang}/`. Astro's
// `build.format: 'preserve'` writes `x.astro` as `x.html` and `x/index.astro` as `x/index.html`, so the pages
// directory decides the served shape; these helpers let scripts and tests agree on it in one place.

export const LOCALES = /** @type {const} */ (['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi']);

const LOCALE_HOME = new RegExp(`^/(?:${LOCALES.join('|')})/$`, 'u');

/**
 * True when `pathname` is spelled the way Pages serves it with a 200: `/`, `/{lang}/`, or a path with no
 * trailing slash and no `.html` / `/index` suffix. Locale homes without their slash (`/es`) are not.
 * @param {string} pathname
 */
export function isServedPath(pathname) {
  if (pathname === '/' || LOCALE_HOME.test(pathname)) return true;
  if (!pathname.startsWith('/') || pathname.endsWith('/')) return false;
  if (/\.html$|\/index$/u.test(pathname)) return false;
  return !LOCALES.some((locale) => pathname === `/${locale}`);
}

/**
 * The dist-relative file Pages serves at `pathname` without a redirect: `/` → `index.html`,
 * `/es/` → `es/index.html`, `/for/cooking` → `for/cooking.html`. Throws for a spelling Pages would redirect.
 * @param {string} pathname
 */
export function servedFile(pathname) {
  if (!isServedPath(pathname)) throw new Error(`served: ${pathname} is not a served URL (Pages would 308 it)`);
  if (pathname.endsWith('/')) return `${pathname.slice(1)}index.html`;
  return `${pathname.slice(1)}.html`;
}

/**
 * The URL Pages serves a built HTML file at (inverse of servedFile): `for/cooking.html` → `/for/cooking`,
 * `es/index.html` → `/es/`, `index.html` → `/`.
 * @param {string} file dist-relative, `/`-separated
 */
export function servedPath(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
  return `/${file.replace(/\.html$/u, '')}`;
}
