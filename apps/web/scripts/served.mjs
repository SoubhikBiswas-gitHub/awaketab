// The URL ↔ file contract between the build and Cloudflare Pages (docs/14 §2.1).
//
// Pages serves a static file at exactly one URL and 308-redirects every other spelling ("route matching"):
//   dist/x.html        → /x         (/x/ and /x.html 308 → /x)
//   dist/x/index.html  → /x/        (/x and /x/index.html 308 → /x/)
// Every page URL in docs/00 §7 has no trailing slash, except `/` and the locale homes `/{lang}/`. Astro's
// `build.format: 'preserve'` writes `x.astro` as `x.html` and `x/index.astro` as `x/index.html`, so the pages
// directory decides the served shape; these helpers let scripts and tests agree on it in one place.

export const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];

const LOCALE_HOME = new RegExp(`^/(?:${LOCALES.join('|')})/$`, 'u');

export function isServedPath(pathname) {
  if (pathname === '/' || LOCALE_HOME.test(pathname)) return true;
  if (!pathname.startsWith('/') || pathname.endsWith('/')) return false;
  if (/\.html$|\/index$/u.test(pathname)) return false;
  return !LOCALES.some((locale) => pathname === `/${locale}`);
}

export function servedFile(pathname) {
  if (!isServedPath(pathname)) throw new Error(`served: ${pathname} is not a served URL (Pages would 308 it)`);
  if (pathname.endsWith('/')) return `${pathname.slice(1)}index.html`;
  return `${pathname.slice(1)}.html`;
}

export function servedPath(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'index.html'.length)}`;
  return `/${file.replace(/\.html$/u, '')}`;
}
