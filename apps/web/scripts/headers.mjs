import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const CONTENT_FAMILIES = ['for', 'on', 'vs', 'guides', 'learn'];

const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://polar.sh https://*.polar.sh",
  'upgrade-insecure-requests',
  'report-to csp',
].join('; ');

const CONTENT_CSP = [
  "default-src 'self'",
  "script-src 'self' https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://*.googletagservices.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' data:",
  "connect-src 'self' https://*.google.com https://*.doubleclick.net",
  'frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  'report-to csp',
].join('; ');

const contentRoutes = [
  ...CONTENT_FAMILIES.map((family) => `/${family}/*`),
  ...LOCALES.flatMap((locale) =>
    CONTENT_FAMILIES.map((family) => `/${locale}/${family}/*`),
  ),
];

export function generateHeaders() {
  const content = contentRoutes
    .map(
      (route) => `${route}
  ! Content-Security-Policy
  Content-Security-Policy: ${CONTENT_CSP}`,
    )
    .join('\n\n');

  return `/*
  Content-Security-Policy: ${DEFAULT_CSP}
  Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self), camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Frame-Options: DENY
  Reporting-Endpoints: csp="/api/csp"
  Cache-Control: public, max-age=0, must-revalidate

${content}

/embed/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; frame-ancestors *
  ! X-Frame-Options
  X-Robots-Tag: noindex

${['/pip', ...LOCALES.map((locale) => `/${locale}/pip`)]
  .map((route) => `${route}
  X-Robots-Tag: noindex`)
  .join('\n\n')}

/config/*
  Cache-Control: public, max-age=300

/sw.js
  Cache-Control: no-cache
  Service-Worker-Allowed: /

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-store
  X-Robots-Tag: noindex
`;
}

export function generateRedirects() {
  return `https://www.awaketab.com/* https://awaketab.com/:splat 301
/en/* /:splat 301
/support-matrix /learn/browser-support-matrix 301
/how-we-tested /learn/how-we-tested 301
/pro/buy /pro 302
`;
}

export function parseRules(text) {
  return text
    .trim()
    .split(/\n(?=\/|https:\/\/)/u)
    .map((block) => {
      const [route, ...lines] = block.trim().split('\n');
      return {
        route,
        headers: lines
          .map((line) => line.trim())
          .filter((line) => line.includes(':'))
          .map((line) => line.slice(0, line.indexOf(':'))),
      };
    });
}

async function writeGeneratedFiles() {
  const publicDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../public',
  );
  await mkdir(publicDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(publicDirectory, '_headers'), generateHeaders()),
    writeFile(path.join(publicDirectory, '_redirects'), generateRedirects()),
  ]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeGeneratedFiles();
}
