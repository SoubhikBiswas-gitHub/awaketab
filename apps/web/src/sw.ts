/// <reference lib="webworker" />
/*
 * AwakeTab service worker (docs/05 §8.2). Built by scripts/sw.mjs after `astro build` and the chunk prune:
 * esbuild bundles this file and injects the precache manifest in place of `self.__WB_MANIFEST`.
 *
 * - App shell (tool routes, locale homes, /pip, hashed JS, icons, manifests): precached, served cache-first,
 *   so the tool — and an honest pill — works offline.
 * - Content pages: stale-while-revalidate. Images: cache-first. /api/*: network only. /embed/*: network first.
 * - Update flow is `prompt`: a new worker waits until the page posts SKIP_WAITING, which the island does only
 *   when no session is active (FR-PWA-01). It never skips waiting on its own.
 */
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

const DAY_S = 86_400;
const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const CONTENT = /^\/(?:(?:es|pt-br|de|fr|ja|zh|hi)\/)?(?:for|on|vs|guides|learn|about|privacy|terms|changelog|pro)(?:\/|$)/u;
const NO_FALLBACK = [/^\/api\//u, /^\/embed\//u, /^\/pip$/u];

cleanupOutdatedCaches();
// Query strings never select a different shell page (the island reads them), so ignore them all when matching.
precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/.*/u] });

const sameOrigin = (url: URL) => url.origin === self.location.origin;

type TPlugin = NonNullable<NonNullable<ConstructorParameters<typeof CacheFirst>[0]>['plugins']>[number];
// workbox-expiration's class predates exactOptionalPropertyTypes; its runtime shape is the WorkboxPlugin contract.
const expire = (maxEntries: number): TPlugin =>
  new ExpirationPlugin({ maxEntries, maxAgeSeconds: 30 * DAY_S }) as unknown as TPlugin;

registerRoute(({ url }) => sameOrigin(url) && url.pathname.startsWith('/api/'), new NetworkOnly());

registerRoute(
  ({ url }) => sameOrigin(url) && url.pathname.startsWith('/embed/'),
  new NetworkFirst({ cacheName: 'at-embed', networkTimeoutSeconds: 3 }),
);

registerRoute(
  ({ url, request }) => sameOrigin(url) && request.destination === 'image' && /^\/(?:og|screens|img)\//u.test(url.pathname),
  new CacheFirst({ cacheName: 'at-img', plugins: [expire(60)] }),
);

// Content pages (all locales). Third-party ad scripts are cross-origin and never reach a route here.
registerRoute(
  ({ url, request }) => sameOrigin(url) && request.mode === 'navigate' && CONTENT.test(url.pathname),
  new StaleWhileRevalidate({ cacheName: 'at-content', plugins: [expire(80)] }),
);

/** Offline navigation to anything uncached: the tool itself (locale home), per docs/05 §8.2. */
setCatchHandler(async ({ request, url }) => {
  if (request.mode !== 'navigate' || NO_FALLBACK.some((re) => re.test(url.pathname))) return Response.error();
  const lang = url.pathname.split('/')[1] ?? '';
  const home = LOCALES.includes(lang) ? `/${lang}/` : '/';
  return (await matchPrecache(home)) ?? Response.error();
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
