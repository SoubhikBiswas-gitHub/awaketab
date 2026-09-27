const LOCAL = 'http://127.0.0.1:4321';
const base = (process.env.LHCI_BASE_URL || LOCAL).replace(/\/+$/u, '');
const remote = base !== LOCAL;
// Every *.pages.dev host, the production alias included, sends `X-Robots-Tag: noindex` (docs/14 §1).
const noindexHost = remote && /\.pages\.dev$/u.test(new URL(base).hostname);

// docs/19 §E: /, /30m, one /for page, one /guides page, /es/.
const PATHS = ['/', '/30m', '/for/cooking', '/guides/lock-screen-vs-sleep', '/es/'];

// /es/ is `noindex` while its translation is `reviewed: false` (docs/07 §7, docs/06 §9): Lighthouse's
// `is-crawlable` audit (≈ 34 % of the SEO score) fails by design there. Every other SEO audit must pass.
const SEO_AUDITS_EXCEPT_CRAWLABLE = [
  'document-title',
  'meta-description',
  'http-status-code',
  'link-text',
  'crawlable-anchors',
  'robots-txt',
  'image-alt',
  'hreflang',
  'canonical',
];

module.exports = {
  ci: {
    collect: {
      ...(remote
        ? {}
        : {
            startServerCommand: 'pnpm --filter web preview',
            startServerReadyPattern: 'Local',
            startServerReadyTimeout: 60000,
          }),
      url: PATHS.map((p) => `${base}${p}`),
      numberOfRuns: Number(process.env.LHCI_RUNS || 3),
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          disabled: false,
        },
        // Headless in CI and locally; --no-sandbox is required on GitHub's Ubuntu runners.
        chromeFlags: '--headless=new --no-sandbox',
        // `astro preview` serves no Pages Functions, so the first-party beacon (/api/e) would 404 and fail
        // `errors-in-console` locally only. Blocked requests log ERR_BLOCKED_BY_CLIENT.Inspector, which that
        // audit ignores by default. On a deployed preview the real functions answer and nothing is blocked.
        ...(remote ? {} : { blockedUrlPatterns: ['*/api/*'] }),
      },
    },
    assert: {
      assertMatrix: [
        {
          // Every audited URL.
          matchingUrlPattern: '.*',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:accessibility': ['error', { minScore: 1 }],
            'categories:best-practices': ['error', { minScore: 1 }],
            'largest-contentful-paint': ['error', { maxNumericValue: 1200 }],
            'total-blocking-time': ['error', { maxNumericValue: 100 }],
            'cumulative-layout-shift': ['error', { maxNumericValue: 0 }],
          },
        },
        ...(noindexHost
          ? []
          : [
              {
                // Indexable URLs: SEO 100.
                matchingUrlPattern: '^(?!.*/es/$).*$',
                assertions: {
                  'categories:seo': ['error', { minScore: 1 }],
                },
              },
            ]),
        {
          // /es/ (noindex until native review) and every URL on a noindex host: every SEO audit except is-crawlable.
          matchingUrlPattern: noindexHost ? '.*' : '/es/$',
          assertions: Object.fromEntries(SEO_AUDITS_EXCEPT_CRAWLABLE.map((id) => [id, ['error', { minScore: 1 }]])),
        },
        {
          // Tool routes: zero third-party requests (docs/00 §11).
          matchingUrlPattern: '(:\\d+|\\.[a-z]+)/(30m/?|es/)?$',
          assertions: {
            'resource-summary:third-party:count': ['error', { maxNumericValue: 0 }],
          },
        },
      ],
    },
    upload: {
      target: process.env.LHCI_UPLOAD_TARGET || (process.env.CI ? 'temporary-public-storage' : 'filesystem'),
      outputDir: '.lighthouseci/reports',
    },
  },
};
