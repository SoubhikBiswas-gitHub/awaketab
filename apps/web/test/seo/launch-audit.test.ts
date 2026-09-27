// Launch-audit fixes checked against the built site (docs/LAUNCH-AUDIT.md F-04, F-05, F-06, F-07, N-03, D-03).
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readSitemapUrls, selectUrls } from '../../scripts/indexnow.mjs';
import { servedFile } from '../../scripts/served.mjs';

const dist = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.resolve(import.meta.dirname, '../../dist');
const devVars = path.resolve(import.meta.dirname, '../../.dev.vars.example');
const SITE = 'https://awaketab.com';

/** The built HTML Pages serves at `pathname` (scripts/served.mjs: `/about` → `about.html`, `/es/` → `es/index.html`). */
const page = (pathname: string) => readFile(path.join(dist, servedFile(pathname)), 'utf8');
const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gu, ' ')
    .replace(/<style[\s\S]*?<\/style>/gu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/&#x3C;/gu, '<')
    .replace(/\s+/gu, ' ');

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(full)));
    else if (/\.(?:html|js|mjs|json|txt|xml|webmanifest)$/u.test(entry.name)) out.push(full);
  }
  return out;
}

describe('F-04 · /about contact and /privacy retention rows', () => {
  it('/about has a working contact address', async () => {
    const html = await page('/about');
    expect(html).toContain('id="contact"');
    expect(html).toMatch(/<a [^>]*href="mailto:support@awaketab\.com"[^>]*>support@awaketab\.com<\/a>/u);
  });

  it('/privacy lists every docs/08 §7 row, retention periods and how to ask for deletion', async () => {
    const html = await page('/privacy');
    const body = text(html);
    // Anonymous usage events: Analytics Engine, 90 days.
    expect(body).toMatch(/Anonymous usage events/u);
    expect(body).toMatch(/deleted automatically after 90 days/u);
    // Ratings: stars + optional text, no identity.
    expect(body).toMatch(/Ratings/u);
    expect(body).toMatch(/stars, any text you choose to write/u);
    expect(body).toMatch(/No name, email, IP address or device id is attached/u);
    // Licence record in KV + deletion request.
    expect(body).toMatch(/Licence record/u);
    expect(body).toMatch(/Deleting your licence data/u);
    expect(body).toMatch(/within 7 days/u);
    expect(html).toContain('href="mailto:support@awaketab.com"');
    // Ads section present and clearly not active (docs/17 §2, docs/09 §3.7).
    expect(html).toContain('id="ads"');
    expect(body).toMatch(/Advertising \(not yet active\)/u);
    expect(body).toMatch(/never show ads on the awake screen/u);
    // Every event the API accepts is disclosed (functions/_lib/env.ts EVENT_NAMES).
    for (const event of ['session_extend', 'affiliate_click', 'rating_submitted', 'client_error']) expect(body).toContain(event);
    // Still a first-party page: no ad or consent script ships with the policy itself.
    expect(html).not.toMatch(/googlesyndication|adsbygoogle|fundingchoicesmessages/u);
  });
});

describe('F-07 · /changelog renders Markdown and orders by date', () => {
  it('renders inline code and links as HTML, never as literal Markdown', async () => {
    const html = await page('/changelog');
    const cards = html.slice(html.indexOf('data-changelog-entry'), html.lastIndexOf('</ol>'));
    expect(cards.length).toBeGreaterThan(1000);
    expect(cards).toContain('<code>M</code>');
    expect(cards).toMatch(/<a href="\/embed">\/embed<\/a>/u);
    expect(text(cards)).not.toMatch(/`[^`\s]+`/u);
    expect(text(cards)).not.toMatch(/\]\(\//u);
    // No front matter or stray headings printed as text (the old analytics-pro / content-pages fragments).
    expect(text(cards)).not.toMatch(/\stitle:\s|\sdate:\s\d|\s---\s/u);
    expect(cards).not.toContain('# 2026-09');
  });

  it('puts the 1.0 launch entry first, then newest date first', async () => {
    // Entries only: the shared footer (B2) carries the language switcher's own "Language" heading.
    const html = (await page('/changelog')).split('<footer')[0] ?? '';
    // B6 (board PageChangelog): the release is a card with an h2; the other entries are h3 under an h2 per date.
    // Every entry carries its own date (data-date) and its title (data-changelog-title), in page order.
    const titles = [...html.matchAll(/<h[23][^>]*data-changelog-title[^>]*>\s*([^<]+?)\s*<\/h[23]>/gu)].map((m) => m[1]);
    const dates = [...html.matchAll(/data-changelog-entry="[^"]+" data-date="(\d{4}-\d{2}-\d{2})"/gu)].map((m) => m[1] ?? '');
    // Each date heading names a date the entries under it carry.
    const headings = [...html.matchAll(/<h2[^>]*><time datetime="(\d{4}-\d{2}-\d{2})">/gu)].map((m) => m[1] ?? '');
    expect(headings.length).toBeGreaterThanOrEqual(4);
    for (const day of headings) expect(dates).toContain(day);
    expect(titles[0]).toBe('1.0 — launch');
    expect(dates.length).toBe(titles.length);
    expect(dates.length).toBeGreaterThanOrEqual(14);
    expect([...dates].sort().reverse()).toEqual(dates);
    // Every fragment has front matter: no entry falls back to its file name.
    for (const title of titles) expect(title).not.toMatch(/^\d{4}-\d{2}-/u);
    // The Article schema's dateModified follows the newest entry.
    expect(html).toContain(`"dateModified":"${dates[0] ?? ''}"`);
  });
});

describe('F-05 · IndexNow URL selection', () => {
  it('selects only indexable pages from the built sitemaps', async () => {
    const urls = selectUrls(await readSitemapUrls({ from: 'dist', dist, site: SITE, fetchFn: fetch }));
    expect(urls.length).toBeGreaterThan(50);
    expect(urls).toContain(`${SITE}/`);
    expect(urls).toContain(`${SITE}/for/cooking`);
    for (const url of urls) {
      const { pathname } = new URL(url);
      expect(pathname, url).not.toMatch(/^\/(?:api|until|embed\/)|\/pip$/u);
      // Every submitted URL is the spelling Pages serves with a 200 (servedFile throws on one it would 308).
      const html = await readFile(path.join(dist, servedFile(pathname)), 'utf8');
      // Never a noindex page: /pip, /until/*, and translations still waiting for native review.
      expect(html, url).not.toMatch(/<meta name="robots" content="[^"]*noindex/u);
    }
    // Unreviewed translations exist in the build but are never submitted.
    expect(await page('/es/for/cocinar')).toMatch(/content="noindex/u);
    expect(urls).not.toContain(`${SITE}/es/for/cocinar`);
  });

  it('ships a key file only when INDEXNOW_KEY was set for the build', async () => {
    const key = process.env.INDEXNOW_KEY?.trim();
    const txt = (await readdir(dist)).filter((name) => /^[A-Za-z0-9-]{8,128}\.txt$/u.test(name) && name !== 'robots.txt');
    if (key) {
      expect(txt).toEqual([`${key}.txt`]);
      expect((await readFile(path.join(dist, `${key}.txt`), 'utf8')).trim()).toBe(key);
    } else {
      expect(txt).toEqual([]);
    }
  });
});

describe('F-06 / N-03 · Polar server and licence keys in the bundle', () => {
  async function devPoint(): Promise<{ x: string; y: string }> {
    const line = (await readFile(devVars, 'utf8')).split('\n').find((row) => row.startsWith('LICENSE_SIGNING_KEY=')) ?? '';
    return JSON.parse(line.slice('LICENSE_SIGNING_KEY='.length)) as { x: string; y: string };
  }

  async function mode(): Promise<'sandbox' | 'production'> {
    const pro = await page('/pro');
    const links = [...pro.matchAll(/href="(https:\/\/[^"]*polar\.sh[^"]*)"/gu)].map((m) => m[1] ?? '');
    expect(links.length).toBeGreaterThanOrEqual(2);
    const sandbox = links.every((href) => href.startsWith('https://sandbox.polar.sh/'));
    const production = links.every((href) => !href.includes('sandbox'));
    expect(sandbox || production, 'checkout links mix sandbox and production').toBe(true);
    return sandbox ? 'sandbox' : 'production';
  }

  it('every checkout link on /pro and /kiosk comes from the same Polar server; /embed sells nothing yet', async () => {
    const want = await mode();
    // Decision O-29 (B6): Embed licences are held until a sandbox purchase ends with a licensed domain, so /embed
    // shows "Licences open soon" and carries no checkout link at all.
    expect(await page('/embed')).not.toMatch(/href="https:\/\/[^"]*polar\.sh/u);
    for (const route of ['pro', 'kiosk']) {
      const links = [...(await page(`/${route}`)).matchAll(/href="(https:\/\/[^"]*polar\.sh[^"]*)"/gu)].map((m) => m[1] ?? '');
      expect(links.length, route).toBeGreaterThan(0);
      for (const href of links) expect(href.includes('sandbox'), `${route}: ${href}`).toBe(want === 'sandbox');
    }
  });

  it('a production-mode build contains no trace of the dev licence public key; a sandbox build trusts it', async () => {
    const { x, y } = await devPoint();
    const hits: string[] = [];
    for (const file of await files(dist)) {
      const body = await readFile(file, 'utf8');
      if (body.includes(x) || body.includes(y)) hits.push(path.relative(dist, file));
    }
    if ((await mode()) === 'production') expect(hits).toEqual([]);
    // Sandbox builds (local, CI, previews) verify dev-signed tokens; this also proves the scan can find the key.
    else expect(hits.some((file) => file.startsWith('_astro/') && file.endsWith('.js'))).toBe(true);
  });
});

describe('D-03 · ja, zh and hi content pages use the English slug (docs/06 §5)', () => {
  // The romanised slugs these locales carried before D-03. They were never indexed (every ja/zh/hi page
  // is `reviewed: false` → noindex), so nothing redirects them; nothing may link to them either.
  const RETIRED: Record<string, Record<string, readonly string[]>> = {
    ja: {
      for: ['ryouri', 'purezenteeshon', 'daunroodo', 'ai-ejento', 'dasshuboodo', 'kiosuku', 'gakufu', 'dokusho', 'yoru-tokei', 'akachan-monitor', 'nabi', 'bideo-tsuuwa', 'raibu', 'terepuronputa', 'toreseningu', 'sabu-monitor', 'shigoto-pc', 'shiken'],
      on: ['ios-home-gamen'],
      vs: ['caffeinate-meirei', 'mouse-jiggler'],
      guides: ['windows-11-1-fun-de-gamen-off', 'mac-futa-tojite-suimin-boshi', 'iphone-jido-rokku-never-grey', 'android-gamen-timeout-ichi-app', 'sabu-monitor-kieru', 'lock-gamen-vs-suimin'],
      learn: ['wake-lock-api-gaido', 'wake-lock-teams-midori', 'low-power-mode-to-wake-lock', 'dou-tesuto-shita-ka'],
    },
    zh: {
      for: ['pengren', 'yanjiang', 'xiazai', 'ai-daili', 'yibiaoban', 'zizhu', 'yuepu', 'yuedu', 'yejian-shizhong', 'yinger-jianshi', 'daohang', 'shipin-tonghua', 'zhibo', 'ti-ci-qi', 'duanlian', 'di-er-ping', 'bangong-bijiben', 'kaoshi'],
      on: ['ios-zhuoye'],
      vs: ['caffeinate-mingling', 'shubiao-hudong'],
      guides: ['windows-11-yi-fenzhong-hei-ping', 'mac-hegai-fangzhi-xiumian', 'iphone-zidong-suoding-yongbu-hui', 'chrome-jieneng', 'android-pingmu-chaoshi-yi-yingyong', 'di-er-ping-xizhen', 'suoping-vs-xiumian'],
      learn: ['wake-lock-api-zhinan', 'wake-lock-nengfou-baochi-teams-zaixian', 'dihao-moshi-yu-wake-lock', 'liulanqi-zhichi-juzhen', 'women-ruhe-ceshi'],
    },
    hi: {
      for: ['khana-banana', 'prastuti', 'download', 'ai-agent', 'dashboard', 'sangeet-lipi', 'padhna', 'raat-ghadi', 'shishu-monitor', 'video-call', 'live-stream', 'vyayam', 'doosri-screen', 'kaam-laptop', 'pariksha'],
      vs: ['mouse-jiggler'],
      guides: ['windows-11-ek-minute-baad-screen-band', 'mac-dhakkan-band-sone-se-rokna', 'iphone-auto-lock-never-grey', 'android-screen-timeout-ek-app', 'doosri-screen-band'],
      learn: ['wake-lock-api-guide', 'wake-lock-teams-green', 'low-power-mode-aur-wake-lock', 'kaise-test-kiya'],
    },
  };
  // `/{lang}/{kind}/{old slug}` not followed by another slug character: `/hi/for/download` is retired but
  // `/hi/for/downloads` (the English slug) is not. Also catches `/og/{lang}/{kind}/{old slug}.png`.
  const retiredPaths = Object.entries(RETIRED).flatMap(([lang, kinds]) =>
    Object.entries(kinds).flatMap(([kind, list]) => list.map((slug) => `${lang}/${kind}/${slug}`)),
  );
  const retired = new RegExp(`/(?:${retiredPaths.join('|')})(?![a-z0-9-])`, 'u');

  async function everyFile(dir: string): Promise<string[]> {
    const out: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await everyFile(full)));
      else out.push(full);
    }
    return out;
  }

  it('the pattern finds a retired slug and spares the English one', () => {
    expect(retiredPaths).toHaveLength(89);
    expect(retired.test('href="/ja/for/ryouri"')).toBe(true);
    expect(retired.test('/og/hi/for/download.png')).toBe(true);
    expect(retired.test('href="/hi/for/downloads"')).toBe(false);
    expect(retired.test('/hi/guides/iphone-auto-lock-never-greyed-out')).toBe(false);
  });

  it('serves every ja, zh and hi translation at /{lang}/{kind}/{English slug}', async () => {
    const all = (await everyFile(dist)).map((file) => path.relative(dist, file).replace(/\\/gu, '/'));
    const pages = all.filter((file) => /^(?:ja|zh|hi)\/(?:for|on|vs|guides|learn)\/[^/]+\.html$/u.test(file));
    expect(pages).toHaveLength(30);
    for (const file of pages) {
      const [lang = '', kind = '', name = ''] = file.split('/');
      const enSlug = name.replace(/\.html$/u, '');
      expect(all, `${file} has no English original`).toContain(servedFile(`/${kind}/${enSlug}`));
      const html = await page(`/${lang}/${kind}/${enSlug}`);
      expect(html, file).toContain(`<link rel="canonical" href="${SITE}/${lang}/${kind}/${enSlug}">`);
      expect(html, file).toContain(`${SITE}/og/${lang}/${kind}/${enSlug}.png`);
      expect(all, `${file} OG image`).toContain(`og/${lang}/${kind}/${enSlug}.png`);
    }
  });

  it('no built file is named after, or references, a retired romanised slug', async () => {
    const hits: string[] = [];
    for (const file of await everyFile(dist)) {
      const relative = path.relative(dist, file).replace(/\\/gu, '/');
      if (retired.test(`/${relative.replace(/\.(?:html|png)$/u, '')}`)) hits.push(relative);
      if (!/\.(?:html|js|mjs|json|txt|xml|webmanifest|css)$|^_(?:redirects|headers)$/u.test(path.basename(file))) continue;
      const match = retired.exec(await readFile(file, 'utf8'));
      if (match) hits.push(`${relative}: ${match[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it('the IndexNow selection carries no retired slug', async () => {
    const urls = selectUrls(await readSitemapUrls({ from: 'dist', dist, site: SITE, fetchFn: fetch }));
    expect(urls.filter((url) => retired.test(url))).toEqual([]);
  });
});
