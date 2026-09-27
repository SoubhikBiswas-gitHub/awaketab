import { moreCss } from './more-css.js';

// The native <dialog> traps focus, handles Esc and makes the page inert; CSS locks the scroll (docs/05 §3.30).
export function openDialog(d: HTMLDialogElement, opener?: Element | null): void {
  // No sheet paints before tool-more.css, so its SVGs never render unsized.
  void moreCss().then(() => {
    if (d.open) return;
    // One layer at a time: a sheet opened from another (Settings → Stats) takes its place.
    for (const o of document.querySelectorAll<HTMLDialogElement>('.at-dialog[open]')) o.close();
    // Safari never focuses a clicked button, so the opener is kept, unless it sat in the sheet that just closed.
    const back = opener && !opener.closest('dialog:not([open])') ? opener : document.activeElement;
    const vv = window.visualViewport;
    // iOS never resizes the layout viewport for the keyboard, so a phone sheet lifts itself above it.
    const fit = () => {
      if (vv) d.style.setProperty('--at-kb', `${String(Math.max(0, innerHeight - vv.height - vv.offsetTop))}px`);
    };
    if (!d.dataset.bound) {
      d.dataset.bound = '';
      // The panels fill the box, so a click that lands on the <dialog> itself is on its backdrop.
      d.addEventListener('click', (e) => {
        if (e.target === d || (e.target as Element).closest('[data-dialog-close]')) d.close();
      });
    }
    vv?.addEventListener('resize', fit);
    d.addEventListener(
      'close',
      () => {
        vv?.removeEventListener('resize', fit);
        d.style.removeProperty('--at-kb');
        if (back instanceof HTMLElement) back.focus();
      },
      { once: true },
    );
    // Docked cards (share, rating) sit in the dock from 600 px, so the page stays live around them.
    if ('docked' in d.dataset && !matchMedia('(width < 600px)').matches) d.show();
    else d.showModal();
  });
}
