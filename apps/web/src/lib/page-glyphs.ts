/**
 * The seven lock states and their 12 px shape glyphs (DESIGN.md §2.3; the same paths as the status pill in
 * components/shell/StatusPill.astro), for the site pages that list the states (/about, /library). Shape carries
 * the state, never colour alone.
 */
export const LOCK_STATES = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const;
export type TPageLockState = (typeof LOCK_STATES)[number];

const DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';

export const LOCK_GLYPH: Record<TPageLockState, string> = {
  idle: DOT,
  requesting: DOT,
  held: DOT,
  unsupported: DOT,
  lost: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z',
  denied: 'M6 1L11.2 10.5H.8z',
  fallback: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
};
