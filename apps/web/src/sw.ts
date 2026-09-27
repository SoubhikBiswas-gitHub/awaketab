/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { langOf, offlinePages } from './sw-fallback';

interface IShellEntry {
  url: string;
  revision: string;
  lang: string;
  install: boolean;
}

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  __AT_SHELL: IShellEntry[];
};

const DAY_S = 86_400;
const CONTENT =
  /^\/(?:(?:es|pt-br|de|fr|ja|zh|hi)\/)?(?:for|on|vs|guides|learn|about|privacy|terms|changelog|pro)(?:\/|$)/u;
const SHELL_CACHE = 'at-shell';
const SHELL = self.__AT_SHELL;
const PRECACHE = self.__WB_MANIFEST;
const REVISION = new Map(SHELL.map((e) => [e.url, e.revision]));

cleanupOutdatedCaches();
// Files every visitor needs (the tool's scripts and styles, the main font, icons). Query strings never select a
// different file.
precacheAndRoute(PRECACHE, { ignoreURLParametersMatching: [/.*/u] });

const sameOrigin = (url: URL) => url.origin === self.location.origin;
// Shell pages are stored under their URL plus revision, like Workbox's precache: an update fetches only the pages
// whose revision changed, and the old copy keeps serving until the new worker activates.
const shellKey = (url: string) => new URL(`${url}?at-rev=${REVISION.get(url) ?? ''}`, self.location.origin).href;
const cacheable = (res: Response) => res.ok && !res.redirected && res.type === 'basic';

type TPlugin = NonNullable<NonNullable<ConstructorParameters<typeof CacheFirst>[0]>['plugins']>[number];
// workbox-expiration's class predates exactOptionalPropertyTypes; its runtime shape is the WorkboxPlugin contract.
const expire = (maxEntries: number): TPlugin =>
  new ExpirationPlugin({ maxEntries, maxAgeSeconds: 30 * DAY_S }) as unknown as TPlugin;

async function cacheShell(urls: Iterable<string>) {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      const key = shellKey(url);
      if (await cache.match(key)) return;
      const res = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
      if (!cacheable(res)) throw new Error(`sw: ${url} answered ${String(res.status)}`);
      await cache.put(key, res);
    }),
  );
}

const languageShell = (lang: string) => SHELL.filter((e) => e.lang === lang && e.install).map((e) => e.url);

const contentPages = new StaleWhileRevalidate({ cacheName: 'at-content', plugins: [expire(80)] });
const pageAssets = new CacheFirst({ cacheName: 'at-assets', plugins: [expire(60)] });
const precached = new Set(PRECACHE.map((e) => (typeof e === 'string' ? e : e.url)));

// A content page someone is reading when the worker installs: kept like any visited content page, with its scripts.
async function cacheContentPage(event: ExtendableEvent, pathname: string) {
  const html = await (await contentPages.handle({ event, request: pathname })).text();
  const assets = [...html.matchAll(/["'](\/_astro\/[^"'?#]+\.(?:js|css))["']/gu)].map((m) => m[1] ?? '');
  await Promise.all(assets.filter((a) => !precached.has(a)).map((a) => pageAssets.handle({ event, request: a })));
}

// Install caches only what this visitor needs: the shell of the language of the page that registered the worker
// (its home, its /pip floating timer and its web manifest, and those of any language an earlier version had cached),
// plus that page itself. Other languages and pages are cached when they are first opened.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const langs = new Set<string>();
      const urls = new Set<string>();
      const content: string[] = [];
      for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
        const url = new URL(client.url);
        if (!sameOrigin(url)) continue;
        langs.add(langOf(url.pathname));
        if (REVISION.has(url.pathname)) urls.add(url.pathname);
        else if (CONTENT.test(url.pathname)) content.push(url.pathname);
      }
      for (const request of await (await caches.open(SHELL_CACHE)).keys()) {
        const { pathname } = new URL(request.url);
        langs.add(langOf(pathname));
        if (REVISION.has(pathname)) urls.add(pathname);
      }
      if (langs.size === 0) langs.add('en');
      for (const lang of langs) for (const url of languageShell(lang)) urls.add(url);
      await cacheShell(urls);
      await Promise.all(content.map((p) => cacheContentPage(event, p).catch(() => undefined)));
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const current = new Set(SHELL.map((e) => shellKey(e.url)));
      const cache = await caches.open(SHELL_CACHE);
      for (const request of await cache.keys()) if (!current.has(request.url)) await cache.delete(request);
      await self.clients.claim();
    })(),
  );
});

registerRoute(({ url }) => sameOrigin(url) && url.pathname.startsWith('/api/'), new NetworkOnly());

// Shell pages and manifests: from the cache when this visitor has them, else from the network, then kept. Opening a
// page in another language also fetches the rest of that language's shell in the background.
registerRoute(
  ({ url, request }) => sameOrigin(url) && request.method === 'GET' && REVISION.has(url.pathname),
  async ({ url, request, event }) => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = await cache.match(shellKey(url.pathname));
    if (hit) return hit;
    const res = await fetch(request);
    if (cacheable(res)) {
      await cache.put(shellKey(url.pathname), res.clone());
      if (request.mode === 'navigate') {
        event.waitUntil(cacheShell(languageShell(langOf(url.pathname))).catch(() => undefined));
      }
    }
    return res;
  },
);

// /embed/assets/app.<hash>.js is content-hashed (scripts/embed-loader.mjs --fingerprint): cache-first is safe.
// It is never precached — the embed iframe is not part of the tool's offline shell.
registerRoute(
  ({ url }) => sameOrigin(url) && url.pathname.startsWith('/embed/assets/'),
  new CacheFirst({ cacheName: 'at-embed-assets', plugins: [expire(4)] }),
);

registerRoute(
  ({ url }) => sameOrigin(url) && url.pathname.startsWith('/embed/'),
  new NetworkFirst({ cacheName: 'at-embed', networkTimeoutSeconds: 3 }),
);

registerRoute(
  ({ url, request }) =>
    sameOrigin(url) && request.destination === 'image' && /^\/(?:og|screens|img)\//u.test(url.pathname),
  new CacheFirst({ cacheName: 'at-img', plugins: [expire(60)] }),
);

// Other pages' hashed scripts and styles (content, Pro, kiosk): cached on first use; the URL changes with the file.
registerRoute(({ url }) => sameOrigin(url) && url.pathname.startsWith('/_astro/'), pageAssets);

// Content pages (all locales). Third-party ad scripts are cross-origin and never reach a route here.
registerRoute(
  ({ url, request }) => sameOrigin(url) && request.mode === 'navigate' && CONTENT.test(url.pathname),
  contentPages,
);

// Any other page goes to the network, so an offline navigation reaches the fallback below instead of an error page.
registerRoute(({ url, request }) => sameOrigin(url) && request.mode === 'navigate', new NetworkOnly());

// Offline and not cached: a floating timer opens a cached floating timer, any other page a cached home.
setCatchHandler(async ({ request, url }) => {
  if (request.mode !== 'navigate') return Response.error();
  const cache = await caches.open(SHELL_CACHE);
  for (const page of offlinePages(url.pathname)) {
    const hit = await cache.match(shellKey(page));
    if (hit) return hit;
  }
  return Response.error();
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});

// End-of-session and kitchen-timer notifications (docs/04 §10 step 4): focus an open tab, else open one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const tab = list.find((c) => new URL(c.url).origin === self.location.origin);
      return tab ? tab.focus() : self.clients.openWindow('/');
    }),
  );
});
