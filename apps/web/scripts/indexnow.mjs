// IndexNow (F-05; docs/06 §15, docs/14 §7). Bing, Yandex and the other IndexNow engines share one endpoint.
//
//   node scripts/indexnow.mjs write-key [--dist dist]   last step of `pnpm -F web build`: writes dist/{INDEXNOW_KEY}.txt
//   pnpm -F web indexnow [--base <git ref>] [--all] [--from live|dist] [--dry-run]
//                                                        post-deploy ping (.github/workflows/indexnow.yml); never part
//                                                        of a build, so local builds never ping
//
// The key comes from the INDEXNOW_KEY build variable (Cloudflare Pages) / secret (GitHub Actions). Unset → no key file
// and no ping, with a warning. URLs come only from the sitemaps, which list indexable pages only (English and
// reviewed translations; never /pip, /until/*, /embed/*, noindex or unreviewed pages), filtered once more here.
// With --base, only URLs whose sources changed since that ref are sent; a template or engine change sends them all.
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { contentPath, isIndexable, readContentIndex, SITE } from './translations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '../..');
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
/** IndexNow accepts at most 10,000 URLs per request. */
export const MAX_URLS = 10_000;
/** The protocol's key format: 8–128 characters of a–z, A–Z, 0–9 and `-`. */
const KEY_RE = /^[A-Za-z0-9-]{8,128}$/u;
const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
/** Never submitted even if a sitemap listed them (defence in depth; robots.txt and `_headers` agree). */
const EXCLUDED = [
  /^\/api(?:\/|$)/u,
  new RegExp(`^(?:/(?:${LOCALES.join('|')}))?/pip/?$`, 'u'),
  /^\/until(?:\/|$)/u,
  /^\/embed\/.+/u,
  /\.(?:xml|txt|json|js|css|png|svg|webmanifest)$/u,
];

/** @param {string | undefined} key */
export function validKey(key) {
  return typeof key === 'string' && KEY_RE.test(key);
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ key: string } | { key: null; reason: string }}
 */
export function readKey(env = process.env) {
  const key = env.INDEXNOW_KEY?.trim();
  if (!key) return { key: null, reason: 'INDEXNOW_KEY is not set' };
  if (!validKey(key)) return { key: null, reason: 'INDEXNOW_KEY must be 8–128 characters of A–Z, a–z, 0–9 or -' };
  return { key };
}

/** `<loc>` values of a sitemap or sitemap index. @param {string} xml */
export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((m) =>
    (m[1] ?? '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').trim(),
  );
}

/**
 * Indexable page URLs on the site's own host, deduplicated and sorted.
 * @param {readonly string[]} urls
 * @param {string} [site]
 */
export function selectUrls(urls, site = SITE) {
  const host = new URL(site).host;
  const out = new Set();
  for (const raw of urls) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' || url.host !== host || url.search || url.hash) continue;
    if (EXCLUDED.some((re) => re.test(url.pathname))) continue;
    // As listed: the served spelling (scripts/served.mjs), e.g. `/for/cooking`, but `/es/` with its slash.
    out.add(url.href);
  }
  return [...out].sort();
}

/**
 * Which page URLs a set of changed repo files affects: `'all'` when a shared template, style, script, string
 * catalog or engine package changed; otherwise the content pages (indexable versions only) and `/changelog`.
 * @param {readonly string[]} files repo-relative paths (`git diff --name-only`)
 * @param {ReadonlyArray<{ kind: string; enSlug: string; locale: string; reviewed: boolean; noindex: boolean; file: string }>} pages
 * @param {Record<string, Record<string, Record<string, string>>>} slugs
 * @param {string} [site]
 * @returns {'all' | Set<string>}
 */
export function changedUrls(files, pages, slugs, site = SITE) {
  const byFile = new Map(pages.map((page) => [path.relative(REPO, page.file).split(path.sep).join('/'), page]));
  const urls = new Set();
  for (const file of files) {
    const page = byFile.get(file);
    if (page) {
      if (isIndexable(page)) urls.add(`${site}${contentPath(slugs, page.kind, page.enSlug, page.locale)}`);
      continue;
    }
    if (/^apps\/web\/src\/content\//u.test(file)) continue; // a deleted or renamed page: nothing to announce
    if (/^changelog\/[^/]+\.md$/u.test(file)) {
      urls.add(`${site}/changelog`);
      continue;
    }
    if (/^(?:apps\/web\/(?:src|public)\/|apps\/web\/astro\.config\.mjs$|packages\/[^/]+\/src\/)/u.test(file)) return 'all';
  }
  return urls;
}

/**
 * @param {string} key
 * @param {readonly string[]} urls
 * @param {string} [site]
 */
export function payloads(key, urls, site = SITE) {
  const { host, origin } = new URL(site);
  const out = [];
  for (let i = 0; i < urls.length; i += MAX_URLS) {
    out.push({ host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls.slice(i, i + MAX_URLS) });
  }
  return out;
}

/**
 * Reads the sitemap index and every child sitemap, from the deployed site or a local dist.
 * @param {{ from: 'live' | 'dist'; dist: string; site: string; fetchFn: typeof fetch }} opts
 */
export async function readSitemapUrls({ from, dist, site, fetchFn }) {
  const load = async (/** @type {string} */ url) => {
    if (from === 'dist') return readFile(path.join(dist, new URL(url).pathname), 'utf8');
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${String(res.status)}`);
    return res.text();
  };
  const index = sitemapLocs(await load(`${site}/sitemap-index.xml`));
  const pages = await Promise.all(index.map(async (child) => sitemapLocs(await load(child))));
  return pages.flat();
}

/**
 * @param {{ key: string; urls: readonly string[]; site?: string; fetchFn?: typeof fetch; dryRun?: boolean; log?: (line: string) => void }} opts
 */
export async function ping({ key, urls, site = SITE, fetchFn = fetch, dryRun = false, log = () => undefined }) {
  if (urls.length === 0) {
    log('indexnow: no changed indexable URLs; nothing to send');
    return { sent: 0 };
  }
  const probe = await fetchFn(`${site}/${key}.txt`);
  const served = probe.ok ? (await probe.text()).trim() : '';
  if (served !== key) throw new Error(`indexnow: ${site}/${key}.txt does not serve the key (HTTP ${String(probe.status)}); deploy with INDEXNOW_KEY set first`);
  let sent = 0;
  for (const body of payloads(key, urls, site)) {
    if (dryRun) {
      log(`indexnow: dry run, would POST ${String(body.urlList.length)} URLs to ${INDEXNOW_ENDPOINT}`);
      continue;
    }
    const res = await fetchFn(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 200 OK and 202 Accepted are both success (202: key validation pending).
    if (res.status !== 200 && res.status !== 202) throw new Error(`indexnow: ${INDEXNOW_ENDPOINT} → HTTP ${String(res.status)}`);
    sent += body.urlList.length;
    log(`indexnow: submitted ${String(body.urlList.length)} URLs (HTTP ${String(res.status)})`);
  }
  return { sent };
}

/** @param {string[]} args @param {string} name */
function option(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const exec = promisify(execFile);

/** @param {string[]} args */
async function main(args) {
  const log = (/** @type {string} */ line) => process.stdout.write(`${line}\n`);
  const warn = (/** @type {string} */ line) => process.stderr.write(`${line}\n`);
  const dist = path.resolve(option(args, '--dist') ?? process.env.AT_DIST ?? path.join(ROOT, 'dist'));
  const found = readKey();
  if (args[0] === 'write-key') {
    if (found.key === null) {
      if (process.env.INDEXNOW_KEY?.trim()) throw new Error(`indexnow: ${found.reason}`);
      warn(`indexnow: WARNING ${found.reason}; no key file written and \`pnpm -F web indexnow\` will not ping (F-05, LAUNCH-AUDIT N-07).`);
      return;
    }
    await writeFile(path.join(dist, `${found.key}.txt`), found.key);
    log(`indexnow: wrote /${found.key}.txt`);
    return;
  }
  if (found.key === null) {
    warn(`indexnow: WARNING ${found.reason}; skipping the ping.`);
    return;
  }
  const site = (option(args, '--site') ?? process.env.PUBLIC_SITE_URL ?? SITE).replace(/\/$/u, '');
  const from = option(args, '--from') === 'dist' ? 'dist' : 'live';
  const all = selectUrls(await readSitemapUrls({ from, dist, site, fetchFn: fetch }), site);
  const base = option(args, '--base');
  let urls = all;
  if (base && !args.includes('--all')) {
    const { stdout } = await exec('git', ['diff', '--name-only', base, 'HEAD'], { cwd: REPO });
    const slugs = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/slugs.json'), 'utf8'));
    const pages = await readContentIndex(path.join(ROOT, 'src/content'));
    const changed = changedUrls(stdout.split('\n').filter(Boolean), pages, slugs, site);
    urls = changed === 'all' ? all : all.filter((url) => changed.has(url));
    log(`indexnow: ${changed === 'all' ? 'shared sources changed, sending every' : `${String(urls.length)} changed`} indexable URL(s) since ${base}`);
  }
  await ping({ key: found.key, urls, site, dryRun: args.includes('--dry-run'), log });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
