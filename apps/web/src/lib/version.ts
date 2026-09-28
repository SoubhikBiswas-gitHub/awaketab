declare const __AT_VERSION__: { date: string; commit: string } | undefined;

// Set by astro.config.mjs from scripts/build-version.mjs, so pages print it with no request at run time.
const BUILD = typeof __AT_VERSION__ === 'undefined' ? { date: 'dev', commit: 'dev' } : __AT_VERSION__;

export const VERSION = `${BUILD.date} · ${BUILD.commit}`;
