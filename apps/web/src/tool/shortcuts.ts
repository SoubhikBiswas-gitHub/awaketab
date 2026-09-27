import type { TPresetId } from '@awaketab/core';
import type { IToolCtx } from './ctx.js';
import { act, cycleTheme, help, pip, toggleFullscreen } from './ui/actions.js';
import { sound } from './ui/settings.js';

const PRESET_KEYS: Record<string, Exclude<TPresetId, 'custom' | 'until'>> = {
  '1': 'p15',
  '2': 'p30',
  '3': 'p45',
  '4': 'p60',
  '5': 'p120',
  '6': 'p240',
  '0': 'pinf',
};

export function chipShortcut(key: string): Exclude<TPresetId, 'custom' | 'until'> | null {
  return PRESET_KEYS[key] ?? null;
}

function typingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function keyHandler(
  ctx: IToolCtx,
  toggle: () => void,
  startPreset: (id: Exclude<TPresetId, 'custom' | 'until'>) => void,
): (e: KeyboardEvent) => void {
  const { store, root } = ctx;
  return (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    const run = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    // Esc from inside a layer belongs to it, from a field too: a modal sheet and the ambient layer take it natively
    // (their cancel event; on a first press this module loads after they did), a docked card closes here.
    const layer = e.target instanceof Element ? e.target.closest('dialog') : null;
    if (key === 'escape' && layer) {
      if (layer.open && !layer.matches(':modal'))
        run(() => {
          layer.close();
        });
      return;
    }
    const s = store.get();
    if (!s.settings.keyboardShortcuts && e.key !== 'Escape') return;
    if (typingTarget(e.target)) return;
    // Esc closing a header menu must not also stop the session.
    if (e.target instanceof Element && e.target.closest('.at-hm-panel, [popovertarget]')) return;
    if ('showPopover' in root && document.querySelector('.at-hm-panel:popover-open')) return;
    // The open <dialog> is the truth; the ambient layer is a <dialog> too but is a mode, not a dialog.
    const dialogOpen = root.querySelector('dialog[open]:not([data-ambient])');
    if (key === 'escape') {
      // Esc closes the innermost layer: a dialog, the ambient mode, a length panel or "How AwakeTab knows", then
      // the session (docs/05 §5).
      run(() => {
        const ui = s.ui;
        if (dialogOpen instanceof HTMLDialogElement) dialogOpen.close();
        else if (ui.mode !== 'standard') store.set({ ui: { mode: 'standard' } });
        else if (ui.open || ui.why) store.set({ ui: { open: '', why: false } });
        else if (ui.ask) toggle();
        else ctx.stop();
      });
      return;
    }
    if (key === '?' || (key === '/' && e.shiftKey)) {
      run(() => {
        help(ctx);
      });
      return;
    }
    if (dialogOpen) return;
    if (key === ' ' || key === 'spacebar') {
      if (!(e.target instanceof HTMLButtonElement)) run(toggle);
      return;
    }
    const preset = chipShortcut(key);
    if (preset)
      run(() => {
        startPreset(preset);
      });
    else if (key === 'u')
      run(() => {
        act(ctx, 'until', root);
      });
    else if (key === 'f')
      run(() => {
        toggleFullscreen(store);
      });
    // The theme is read when the press is handled, so two quick presses advance two steps.
    else if (key === 'd')
      run(() => {
        cycleTheme(ctx);
      });
    else if (key === 'm')
      run(
        () =>
          void import('./ambient/shell.js').then((m) => {
            m.cycleMode(ctx);
          }),
      );
    else if (key === 'p')
      run(() => {
        pip(ctx);
      });
    else if (key === 's')
      run(() => {
        void sound(ctx, 'open');
      });
  };
}
