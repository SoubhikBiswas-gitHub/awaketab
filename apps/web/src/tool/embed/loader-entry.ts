// Bundle entry for public/embed.js (scripts/embed-loader.mjs). The frame titles and credit texts are the
// `embed.frame.title` and `embed.attribution` strings of the eight locale catalogs, inlined at build time so the
// loader stays catalog-free.
import { install } from './loader.js';

declare const __AT_FRAME_TITLES__: Record<string, string>;
declare const __AT_CREDITS__: Record<string, string>;

install(window, document.currentScript as HTMLScriptElement | null, {
  titles: __AT_FRAME_TITLES__,
  credits: __AT_CREDITS__,
});
