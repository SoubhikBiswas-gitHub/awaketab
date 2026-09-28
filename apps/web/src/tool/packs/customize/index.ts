import type { TTheme } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import { cycleTheme, type TCustomizeTab as TTab } from '../../ui/actions.js';
import { openDialog } from '../../ui/dialog.js';
import href from './customize.css?url';

const TABS: readonly TTab[] = ['face', 'look', 'sound'];
// The tab last shown in this visit; a new page load starts on Face.
let last: TTab = 'face';
let css: Promise<void> | undefined;
let bound = false;

const sheet = () =>
  (css ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  }));

// Each tab's pack loads the first time the tab is shown; every later show only repaints it.
function mount(ctx: IToolCtx, d: HTMLDialogElement, tab: TTab): Promise<void> {
  const pane = d.querySelector<HTMLElement>(`[data-cz-pane="${tab}"]`);
  if (!pane) return Promise.resolve();
  if (tab === 'face') return import('../faces/index.js').then((m) => m.showGallery(ctx, pane));
  if (tab === 'sound') return import('../sound/index.js').then((m) => m.showSound(ctx));
  const pref = ctx.store.get().settings.theme;
  for (const r of pane.querySelectorAll<HTMLInputElement>('input[name="cz-theme"]')) r.checked = r.value === pref;
  const host = pane.querySelector<HTMLElement>('[data-appearance]');
  return host ? import('../themes/appearance.js').then((m) => m.mountAppearance(ctx, host)) : Promise.resolve();
}

function select(ctx: IToolCtx, d: HTMLDialogElement, tab: TTab, focus = false): Promise<void> {
  last = tab;
  for (const b of d.querySelectorAll<HTMLElement>('[data-cz-tab]')) {
    const on = b.dataset.czTab === tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  }
  for (const p of d.querySelectorAll<HTMLElement>('[data-cz-pane]')) p.hidden = p.dataset.czPane !== tab;
  // A tab's content rises in when switched to; opening the sheet only slides the sheet.
  if (d.open) d.dataset.czMoved = '';
  const panes = d.querySelector('.at-cz-panes');
  if (panes) panes.scrollTop = 0;
  return mount(ctx, d, tab).catch(() => undefined);
}

function bind(ctx: IToolCtx, d: HTMLDialogElement): void {
  const at = (b: Element | null) => TABS.indexOf((b as HTMLElement | null)?.dataset.czTab as TTab);
  d.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('[data-cz-tab]');
    if (b) void select(ctx, d, TABS[at(b)] ?? 'face');
  });
  // Arrow keys move between the tabs and show each one (automatic activation); Home and End jump to the ends.
  d.querySelector('[role="tablist"]')?.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    const i = at(document.activeElement);
    if (i < 0) return;
    const fwd = getComputedStyle(d).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    let to: number;
    if (k === 'Home') to = 0;
    else if (k === 'End') to = TABS.length - 1;
    else if (k === 'ArrowRight' || k === 'ArrowLeft') to = (i + (k === fwd ? 1 : -1) + TABS.length) % TABS.length;
    else return;
    e.preventDefault();
    void select(ctx, d, TABS[to] ?? 'face', true);
  });
  d.addEventListener('close', () => {
    delete d.dataset.czMoved;
  });
  d.addEventListener('change', (e) => {
    const r = e.target;
    if (r instanceof HTMLInputElement && r.name === 'cz-theme') cycleTheme(ctx, r.value as TTheme);
  });
}

export function openCustomize(ctx: IToolCtx, tab?: TTab | null, opener?: Element | null): void {
  const d = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="customize"]');
  if (!d) return;
  if (!bound) {
    bound = true;
    bind(ctx, d);
  }
  const next = tab && TABS.includes(tab) ? tab : last;
  if (d.open) {
    void select(ctx, d, next, true);
    return;
  }
  // The sheet waits briefly for its styles and the tab's pack, so nothing pops in; a slow pack still opens it.
  const pack = Promise.race([select(ctx, d, next), new Promise((r) => setTimeout(r, 400))]);
  void Promise.all([sheet(), pack]).then(() => {
    openDialog(d, opener);
    window.setTimeout(() => {
      d.querySelector<HTMLElement>('[data-cz-tab][aria-selected="true"]')?.focus();
    }, 0);
  });
}
