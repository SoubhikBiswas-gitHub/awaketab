// Looks anyone may keep. boot.js paints the stored lamp, colour theme and pattern before first paint; any other value
// needs ambient.packs, so a lapsed licence falls back to the default (the catalogue is packs/themes/looks.ts).
const FREE = /^(?:violet|amber|teal|paper|nord|grain|dots|grid)$/u;

export function gateLooks(packs: boolean, html: HTMLElement = document.documentElement): void {
  // A running preview owns the page until it ends (packs/themes/preview.ts).
  if (packs || 'preview' in html.dataset) return;
  for (const k of ['accent', 'palette', 'pattern'] as const) {
    const v = html.dataset[k];
    if (v && !FREE.test(v)) html.removeAttribute(`data-${k}`);
  }
}
