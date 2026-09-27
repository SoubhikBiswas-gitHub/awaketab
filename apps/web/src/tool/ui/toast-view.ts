import { t } from '../i18n.js';
import type { IStore, IToastItem } from '../store.js';
import { moreCss } from './more-css.js';
import { dismiss } from './toast.js';

// Each kind has its own shape, not only its own colour.
const ICON: Record<IToastItem['kind'], string> = {
  success: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM8 12.2l2.8 2.8L16 9.6',
  info: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM12 11v5M12 7.8v.1',
  warn: 'M12 3.5L21.5 20h-19zM12 10v4.5M12 17.2v.3',
  error: 'M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3zM9.5 9.5l5 5M14.5 9.5l-5 5',
  offline:
    'M2.5 8.8a14 14 0 0 1 5-3M11 5a14 14 0 0 1 10.5 3.8M5.6 12.2a9.5 9.5 0 0 1 3.9-2.3M14.8 10.1a9.5 9.5 0 0 1 3.6 2.1M9 15.6a4.5 4.5 0 0 1 6 0M12 19.2v.1M3.5 3.5l17 17',
};
// Intrinsic sizes keep the icons small even if the stylesheet is late or fails.
const svg = (d: string, cls = '', size = 20) =>
  `<svg class="${cls}" width="${String(size)}" height="${String(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

// Time to read it: a base per kind plus 60 ms a character. Errors, sticky notices and ones with an action stay.
const life = (x: IToastItem) =>
  x.kind === 'error' || x.sticky || x.action ? Infinity : (x.kind === 'warn' ? 8000 : 5000) + 60 * x.text.length;

export function mountToasts(region: HTMLElement, store: IStore): () => void {
  const shown = new Map<string, { el: HTMLElement; item: IToastItem; left: number }>();
  const home = document.createComment('toasts');
  let last: IToastItem[] = [];
  let since = 0;
  let timer = 0;
  let hover = false;
  let back: HTMLElement | null = null;
  // run() takes the time since its last call off every clock, so a new clock starts with that much extra.
  const fresh = (x: IToastItem) => life(x) + (since ? Date.now() - since : 0);

  // Clocks only run while the tab is visible and the pointer and focus are elsewhere, so nothing vanishes unseen.
  const run = () => {
    const now = Date.now();
    const due: string[] = [];
    for (const [id, s] of shown) {
      s.left -= since ? now - since : 0;
      if (s.left <= 0) due.push(id);
    }
    since = hover || document.hidden || region.matches(':focus-within') ? 0 : now;
    clearTimeout(timer);
    const next = Math.min(...[...shown.values()].map((s) => s.left));
    if (since && next < Infinity) timer = window.setTimeout(run, next);
    for (const id of due) dismiss(store, id);
  };

  // A modal makes the page behind it inert and popovers sit in the top layer, so the region moves into the modal
  // and becomes a manual popover itself, shown again after anything else opens.
  const place = (e?: Event) => {
    if (e?.target === region) return;
    const modal =
      shown.size && CSS.supports('selector(:modal)') ? [...document.querySelectorAll('dialog:modal')].pop() : undefined;
    if (modal && !modal.contains(region)) {
      if (!home.parentNode) region.before(home);
      modal.append(region);
    } else if (!modal && home.parentNode) home.replaceWith(region);
    if (!('showPopover' in region)) return;
    const lift = !!shown.size && (!!home.parentNode || !!document.querySelector(':popover-open:not([data-toasts])'));
    const open = region.matches(':popover-open');
    if (open && (!lift || e)) region.hidePopover();
    region.popover = lift ? 'manual' : null;
    if (lift && (!open || e)) region.showPopover();
  };

  const build = (item: IToastItem) => {
    const el = document.createElement('div');
    el.className = `at-toast at-toast-${item.kind}`;
    el.innerHTML = `${svg(ICON[item.kind], 'at-toast-i')}<p></p>`;
    (el.querySelector('p') as HTMLElement).textContent = item.text;
    const button = (cls: string, label: string, fn: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      b.addEventListener('click', () => {
        fn();
        dismiss(store, item.id);
      });
      el.append(b);
      return b;
    };
    if (item.action)
      button('at-toast-act', item.action.label, () => {
        shown.get(item.id)?.item.action?.onClick();
      });
    const x = button('at-icon-button at-toast-x', '', () => undefined);
    x.setAttribute('aria-label', t('tool.toast.dismiss'));
    x.innerHTML = svg('M6 6l12 12M18 6L6 18', '', 16);
    return el;
  };

  const render = (list: IToastItem[]) => {
    for (const [id, s] of shown) {
      if (list.some((x) => x.id === id)) continue;
      shown.delete(id);
      const focused = s.el.contains(document.activeElement);
      s.el.inert = true;
      s.el.style.animation = '';
      // Focus never drops to the page: it goes to the next notice, or back where it came from.
      if (focused) (region.querySelector<HTMLElement>('.at-toast:not([inert]) .at-toast-x') ?? back)?.focus();
      setTimeout(() => {
        s.el.remove();
      }, 320);
    }
    // One live region: polite, and assertive only while an error is on screen.
    region.setAttribute('aria-live', list.some((x) => x.kind === 'error') ? 'assertive' : 'polite');
    for (const item of list) {
      const s = shown.get(item.id);
      if (s?.item === item) continue;
      // The same notice again restarts its clock and says nothing new; a changed one is swapped in without a rise.
      if (s?.item.text === item.text && s.item.kind === item.kind) {
        s.item = item;
        s.left = fresh(item);
        continue;
      }
      const el = build(item);
      if (s) {
        const focused = s.el.contains(document.activeElement);
        el.style.animation = 'none';
        s.el.replaceWith(el);
        if (focused) el.querySelector<HTMLElement>('.at-toast-x')?.focus();
      } else region.append(el);
      shown.set(item.id, { el, item, left: fresh(item) });
    }
    run();
    place();
  };

  const onHover = (e: PointerEvent) => {
    hover = e.type === 'pointerenter' && e.pointerType === 'mouse';
    run();
  };
  region.addEventListener('pointerenter', onHover);
  region.addEventListener('pointerleave', onHover);
  region.addEventListener('focusin', (e) => {
    if (!region.contains(e.relatedTarget as Node | null)) back = e.relatedTarget as HTMLElement | null;
    run();
  });
  // :focus-within still matches while focusout runs.
  region.addEventListener('focusout', () => {
    setTimeout(run);
  });
  document.addEventListener('visibilitychange', run);
  document.addEventListener('toggle', place, true);
  document.addEventListener('close', place, true);

  let off: () => void = () => undefined;
  // The toast styles sit in the on-demand sheet; nothing renders before it has loaded.
  void moreCss().then(() => {
    off = store.subscribe((s) => {
      if (s.ui.toasts !== last) render((last = s.ui.toasts));
      else if (shown.size)
        requestAnimationFrame(() => {
          place();
        });
    });
  });
  return () => {
    off();
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', run);
    document.removeEventListener('toggle', place, true);
    document.removeEventListener('close', place, true);
  };
}
