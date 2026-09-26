// Bundle entry for public/embed.js (scripts/embed-loader.mjs). The frame titles are the `embed.frame.title`
// strings of the eight locale catalogs, inlined at build time so the loader stays catalog-free.
import { install } from './loader.js';

declare const __AT_FRAME_TITLES__: Record<string, string>;

install(window, document.currentScript as HTMLScriptElement | null, __AT_FRAME_TITLES__);
