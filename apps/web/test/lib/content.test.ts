import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CONTENT_REDIRECTS } from '../../scripts/headers.mjs';
import { frontmatterScalars, readContentIndex } from '../../scripts/translations.mjs';

// Redesign B11 (content fixes) over the Markdown sources: the OD-3 route set (docs/00 §7), the launch set of
// rewritten pages that are indexed while the rest stay live but noindex (OD-2 / O-45, docs/06 §20), and the
// false claims the fact-check removed (docs/research/fact-check-2026-09-26.md, decision D-R12) never coming back.
const CONTENT = path.resolve('apps/web/src/content');
const SLUGS = path.resolve('apps/web/src/i18n/slugs.json');
const index = await readContentIndex(CONTENT);
const english = index.filter((page) => page.locale === 'en');
const route = (page: { kind: string; enSlug: string }): string => `/${page.kind}/${page.enSlug}`;

const ROUTES: Record<string, readonly string[]> = {
  for: ['ai-agents', 'classroom', 'cooking', 'dashboards', 'downloads', 'kiosk', 'night-clock', 'presentations', 'reading', 'sheet-music', 'teleprompter', 'video-calls', 'work-laptop', 'workouts'],
  on: ['android-chrome', 'chromebook', 'edge', 'firefox', 'ios-home-screen', 'ipad', 'iphone-safari', 'linux', 'macos', 'samsung-internet', 'windows-11'],
  vs: ['amphetamine', 'caffeinate-command', 'caffeine', 'mouse-jigglers', 'nosleep-js', 'nosleep-page', 'powertoys-awake'],
  guides: ['android-screen-timeout-one-app', 'chrome-energy-saver', 'iphone-auto-lock-never-greyed-out', 'lock-screen-vs-sleep', 'mac-prevent-sleep-lid-closed', 'second-monitor-turns-off', 'windows-11-screen-turns-off-after-1-minute'],
  learn: ['browser-support-matrix', 'does-a-wake-lock-keep-teams-green', 'how-we-tested', 'low-power-mode-and-wake-locks', 'screen-wake-lock-api-guide'],
};

// The launch set (docs/06 §20): marketing-seo-content.md §7 top pages + the days 15–45 wave + /for/classroom + the
// two 301 targets that absorbed merged pages. Everything else is a draft: live, noindex, out of the sitemap.
const READY = [
  '/for/cooking', '/for/ai-agents', '/for/presentations', '/for/work-laptop', '/for/dashboards', '/for/classroom',
  '/on/iphone-safari', '/on/macos', '/on/android-chrome', '/on/windows-11', '/on/chromebook', '/on/ipad',
  '/guides/iphone-auto-lock-never-greyed-out', '/guides/windows-11-screen-turns-off-after-1-minute',
  '/guides/mac-prevent-sleep-lid-closed', '/guides/lock-screen-vs-sleep', '/guides/second-monitor-turns-off',
  '/vs/nosleep-page', '/vs/caffeine', '/vs/powertoys-awake', '/vs/mouse-jigglers', '/vs/nosleep-js',
  '/learn/screen-wake-lock-api-guide', '/learn/does-a-wake-lock-keep-teams-green', '/learn/browser-support-matrix',
];

const CUT = ['/for/navigation', '/for/live-streams', '/for/exams-proctoring', '/for/baby-monitor'];

describe('OD-3 content routes (docs/00 §7)', () => {
  it('ships exactly the 44 English pages of docs/00 §7: 14 /for, 11 /on, 7 /vs, 7 /guides, 5 /learn', () => {
    for (const [kind, slugs] of Object.entries(ROUTES)) {
      expect(english.filter((page) => page.kind === kind).map((page) => page.enSlug).sort(), kind).toEqual([...slugs].sort());
    }
    expect(english).toHaveLength(44);
  });

  it('keeps no page, translation or translated slug for a cut or merged route', async () => {
    const slugs = JSON.parse(await readFile(SLUGS, 'utf8')) as Record<string, Record<string, unknown>>;
    for (const gone of [...CUT, ...CONTENT_REDIRECTS.map(([from]) => from)]) {
      const [, kind = '', slug = ''] = gone.split('/');
      expect(index.filter((page) => page.kind === kind && page.enSlug === slug), gone).toEqual([]);
      expect(slugs[kind]?.[slug], gone).toBeUndefined();
    }
  });

  it('maps every English page in slugs.json and every translation to an English original', async () => {
    const slugs = JSON.parse(await readFile(SLUGS, 'utf8')) as Record<string, Record<string, unknown>>;
    for (const [kind, list] of Object.entries(ROUTES)) {
      expect(Object.keys(slugs[kind] ?? {}).sort(), kind).toEqual([...list].sort());
    }
    for (const page of index.filter((entry) => entry.locale !== 'en')) {
      expect(english.some((entry) => entry.kind === page.kind && entry.enSlug === page.enSlug), page.file).toBe(true);
    }
  });

  it('redirects each merged URL to a READY page', () => {
    for (const [, to] of CONTENT_REDIRECTS) expect(READY, to).toContain(to);
  });

  it('links only to content pages that exist (related lists in every locale)', async () => {
    const existing = new Set(english.map(route));
    for (const page of index) {
      const text = await readFile(page.file, 'utf8');
      const related = /^related:\n((?:\s+- .*\n)+)/mu.exec(text)?.[1] ?? '';
      for (const match of related.matchAll(/"(\/[^"]+)"/gu)) {
        const href = match[1] ?? '';
        if (/^\/(?:for|on|vs|guides|learn)\//u.test(href)) expect(existing.has(href), `${page.file} -> ${href}`).toBe(true);
      }
      for (const match of text.matchAll(/\]\((\/(?:for|on|vs|guides|learn)\/[^)#?\s]+)\)/gu)) {
        const href = match[1] ?? '';
        if (page.locale === 'en') expect(existing.has(href), `${page.file} -> ${href}`).toBe(true);
      }
    }
  });
});

describe('launch set and drafts (OD-2 / O-45, docs/06 §20)', () => {
  it('indexes exactly the 25 rewritten pages; every other English page is a noindex draft', () => {
    expect(english.filter((page) => !page.noindex).map(route).sort()).toEqual([...READY].sort());
  });

  it('dates every rewritten page from the 26 September 2026 source check', async () => {
    for (const page of english.filter((entry) => READY.includes(route(entry)))) {
      const data = frontmatterScalars(await readFile(page.file, 'utf8'));
      expect(String(data.lastVerified), page.file).toBe('2026-09-26');
      expect(data.reviewed, page.file).toBe(true);
    }
  });
});

// Pill strings keep their em dash (docs/00 §5.1); the " — AwakeTab" title suffix is the docs/06 §4 formula.
const PILLS = ['Paused — tab hidden', "Blocked — here's the fix"];
const withoutAllowedDashes = (text: string): string =>
  PILLS.reduce((out, pill) => out.replaceAll(pill, ''), text).replace(/^title: .*$/mu, '');

// D-R12 and the fact-check: claims that are false, or testing we have not recorded, in any English page.
const DEVELOPER_PAGES = ['/learn/screen-wake-lock-api-guide', '/vs/nosleep-js'];
// A claim pattern only counts when the matched span carries no negation ("does not refuse", "no battery-saver check").
const NEGATION = /\b(?:not|no|never|neither|nor)\b|n't/iu;
const FALSE_EN: ReadonlyArray<[RegExp, string]> = [
  [/(?:battery|energy|power)[ -]?sav(?:er|ing)[^.\n]{0,40}?\b(?:den(?:y|ies|ied)|block(?:s|ed)?|refus(?:e|es|ed)|wins?|overrid(?:e|es))\b/giu, 'battery saver refuses the lock'],
  [/low power mode[^.\n]{0,30}?\b(?:den(?:y|ies|ied)|block(?:s|ed)?|refus(?:e|es|ed)|prevents? (?:a|the) (?:wake )?lock)\b/giu, 'Low Power Mode refuses the lock'],
  // "How we tested" is the page name (/learn/how-we-tested), not a claim.
  [/\bin our (?:tests|checks)\b|(?<!how )\bwe tested\b|\btested on ubuntu\b|device on a shelf/giu, 'unrecorded device testing'],
  [/PiP pill|floating timer|\bindefinite(?:ly)?\b/giu, 'banned term'],
  [/npm install @awaketab|the exact file on npm/giu, 'unpublished npm package'],
  [/keeps? (?:you|your status) (?:green|active|available)/giu, 'presence claim'],
];
// False claims that are themselves negative sentences, matched literally.
const FALSE_EN_NEGATIVE: ReadonlyArray<[RegExp, string]> = [
  [/idle (?:system )?sleep (?:was|is) not held|macOS did not|(?:did|does) not hold idle/giu, 'macOS idle sleep not held'],
];

/**
 * Every affirmative match of `pattern` in `text`. Not a claim: a negated span, a question ("Do battery savers block
 * a wake lock?") or a dated correction note ("Earlier versions of this page said … That was wrong").
 */
function falseClaims(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)]
    .filter((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const before = text.slice(0, start);
      const from = Math.max(before.lastIndexOf('. '), before.lastIndexOf('\n')) + 1;
      const after = text.slice(end).search(/[.?!\n]/u);
      const sentence = text.slice(from, after === -1 ? text.length : end + after + 1);
      if (NEGATION.test(match[0]) || sentence.trimEnd().endsWith('?') || /\?"$/u.test(sentence.trimEnd())) return false;
      return !/earlier versions? of this page said/iu.test(sentence);
    })
    .map((match) => match[0]);
}

describe('fact-check claims stay fixed (D-R12)', () => {
  it('finds an affirmative claim and spares its correction', () => {
    const [battery] = FALSE_EN[0] ?? [/$^/u];
    expect(falseClaims('Battery Saver denies the lock.', battery)).toHaveLength(1);
    expect(falseClaims('Windows battery saver can deny the lock.', battery)).toHaveLength(1);
    expect(falseClaims('Battery Saver does not refuse the lock.', battery)).toEqual([]);
    expect(falseClaims('Chrome has no battery-saver check, so it never refuses.', battery)).toEqual([]);
    expect(falseClaims('Do battery savers block a wake lock?', battery)).toEqual([]);
    expect(falseClaims('Earlier versions of this page said battery savers deny the wake lock.', battery)).toEqual([]);
    expect(falseClaims('Why? Battery savers deny the wake lock.', battery)).toHaveLength(1);
  });

  it('no English page repeats a false claim or a banned term', async () => {
    for (const page of english) {
      const text = await readFile(page.file, 'utf8');
      for (const [pattern, label] of FALSE_EN) {
        expect(falseClaims(text, pattern), `${page.file}: ${label}`).toEqual([]);
      }
      for (const [pattern, label] of FALSE_EN_NEGATIVE) {
        expect([...text.matchAll(pattern)].map((match) => match[0]), `${page.file}: ${label}`).toEqual([]);
      }
      // Engine words are for developers only (marketing-positioning.md §8): the API guide and the library comparison.
      if (!DEVELOPER_PAGES.includes(route(page))) {
        expect(text.match(/Date\.now\(\)|\bsentinel\b/giu) ?? [], `${page.file}: engine jargon`).toEqual([]);
      }
    }
  });

  it('attributes the F15 key press to Caffeine for Windows, never to Caffeine for Mac', async () => {
    const caffeine = await readFile(path.join(CONTENT, 'vs/en/caffeine.md'), 'utf8');
    expect(caffeine).toMatch(/power assertion/iu);
    expect(caffeine).toMatch(/Zhorn/u);
    // "Caffeine for Mac presses F15" in any affirmative sentence (a question such as "Does … press F15?" is fine).
    expect(caffeine.match(/(?:Mac|IntelliScape)[^.?\n]{0,60}\b(?:press(?:es)?|simulat\w*|fakes?)\b[^.?\n]{0,20}F15[^?\n]*?[.\n]/gu) ?? []).toEqual([]);
  });

  // The exact wording of the false claims removed from the translations and locale homes in B11 (one list per
  // locale, as it read before the fix). None may come back in that locale's pages or home copy.
  const FALSE_LOCALE: Record<string, readonly string[]> = {
    es: ['nuestras pruebas', 'simula la tecla F15', 'El ahorro de batería gana siempre', 'Ahorro de batería rechaza', 'le gana a cualquier página web', 'anula el Wake Lock', 'probamos la inhibición', 'Modo de bajo consumo gana siempre'],
    'pt-br': ['nossos testes', 'simula a tecla F15', 'simula o toque da tecla F15', 'A economia de bateria sempre vence', 'Economia de bateria nega', 'vence qualquer site', 'economia de bateria recusou', 'Versões testadas'],
    de: ['in unseren Tests', 'Der Energiesparmodus gewinnt', 'lehnt den Wake Lock ab', 'simuliert die Taste F15', 'Ubuntu 24.04 mit GNOME-Idle-Inhibit', 'Nur gegen den Stromsparmodus', 'wird auch AwakeTab übergangen'],
    fr: ['dans nos tests', 'l’emporte toujours', 'simule la touche F15', 'n’a pas été retenue', 'L’économiseur de batterie refuse', 'l’emporte sur AwakeTab', 'même AwakeTab est neutralisé'],
    ja: ['私たちのテストでは', 'F15キーを模して', 'F15キーの押下', 'バッテリーセーバーでは拒否され', 'AwakeTabの要求も上書き', '省電力モードには勝てません', 'macOSでは防げませんでした', 'バッテリー節約機能がロックを拒否'],
    zh: ['在我们的测试中', '模拟按下 F15 键', '模拟 F15 按键', '省电模式优先于唤醒锁', '节电模式可能拒绝唤醒锁', '唤醒锁同样会被覆盖', 'Ubuntu 24.04 的 GNOME', '省电模式会拒绝'],
    hi: ['Battery Saver लॉक को मना कर देता है', 'बैटरी सेवर की जीत होती है', 'हमारे परीक्षणों में', 'F15 कुंजी दबाने का नाटक', 'AwakeTab भी सिस्टम को नहीं हरा सकता', 'बैटरी सेवर वेक लॉक को मना कर', '(PiP पिल)', 'वैकल्पिक यूसेज बीकन'],
  };

  it('keeps the removed false claims out of all seven translations and locale homes', async () => {
    for (const [locale, phrases] of Object.entries(FALSE_LOCALE)) {
      const files = [
        ...index.filter((page) => page.locale === locale).map((page) => page.file),
        path.join(CONTENT, 'locale-home', `${locale}.ts`),
      ];
      expect(files.length, locale).toBe(11);
      for (const file of files) {
        const text = await readFile(file, 'utf8');
        for (const phrase of phrases) expect(text.includes(phrase), `${file}: "${phrase}"`).toBe(false);
      }
    }
  });

  it('keeps em dashes out of English prose (pill strings and the title suffix excepted)', async () => {
    for (const page of english) {
      const text = withoutAllowedDashes(await readFile(page.file, 'utf8'));
      expect(text.includes('—'), page.file).toBe(false);
    }
  });
});
