const SW_LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];

const PIP = new RegExp(`^/(?:(?:${SW_LOCALES.join('|')})/)?pip$`, 'u');
const NO_FALLBACK = [/^\/api\//u, /^\/embed\//u];

export function langOf(pathname: string): string {
  const first = pathname.split('/')[1] ?? '';
  return SW_LOCALES.includes(first) ? first : 'en';
}

const homeOf = (lang: string) => (lang === 'en' ? '/' : `/${lang}/`);
const pipOf = (lang: string) => (lang === 'en' ? '/pip' : `/${lang}/pip`);

// The cached shell pages an offline navigation may open instead, best first. The floating timer only ever falls back
// to a floating timer in another language (a tool page inside the small popup would start a second session); every
// other page opens a cached home, which reads its preset or until-time from the URL.
export function offlinePages(pathname: string): string[] {
  if (NO_FALLBACK.some((re) => re.test(pathname))) return [];
  const own = langOf(pathname);
  const pick = PIP.test(pathname) ? pipOf : homeOf;
  return [...new Set([own, 'en', ...SW_LOCALES].map(pick))];
}
