import { chipShortcut } from './ui/chips.js';
import type { TTheme } from '@awaketab/core';
import type { IStore } from './store.js';

function typingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function mountShortcuts(
  store: IStore,
  actions: {
    toggle: () => void;
    startPreset: (id: ReturnType<typeof chipShortcut>) => void;
    openUntil: () => void;
    fullscreen: () => void;
    /** Called with no theme: the action picks the next one when it runs, after any earlier press has applied. */
    cycleTheme: (theme?: TTheme) => void;
    cycleMode: () => void;
    exitMode: () => void;
    pip: () => void;
    stop: () => void;
    closeDialog: () => void;
    toggleHelp: () => void;
  },
): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const s = store.get();
    if (!s.settings.keyboardShortcuts && e.key !== 'Escape') return;
    if (typingTarget(e.target)) return;
    // Any open modal counts (the Pro sheet, the rating prompt), not just the ones the store names; the
    // ambient layer is a <dialog> too but is a mode, not a dialog.
    const dialogOpen = s.ui.dialog !== null || document.querySelector('dialog[open]:not([data-ambient])') !== null;
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      // Esc closes the innermost layer first: a dialog, then an ambient mode, then the session (docs/05 §5).
      if (dialogOpen) actions.closeDialog();
      else if (s.ui.mode !== 'standard') actions.exitMode();
      else actions.stop();
      return;
    }
    if (key === '?' || (key === '/' && e.shiftKey)) {
      e.preventDefault();
      actions.toggleHelp();
      return;
    }
    if (dialogOpen) return;
    if (key === ' ' || key === 'Spacebar') {
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      actions.toggle();
      return;
    }
    const preset = chipShortcut(key);
    if (preset) {
      e.preventDefault();
      actions.startPreset(preset);
      return;
    }
    if (key === 'u' || key === 'U') {
      e.preventDefault();
      actions.openUntil();
      return;
    }
    if (key === 'f' || key === 'F') {
      e.preventDefault();
      actions.fullscreen();
      return;
    }
    if (key === 'd' || key === 'D') {
      e.preventDefault();
      // The theme action loads lazily; computing the next theme here would read stale settings when D is
      // pressed again before the first press applied, so two quick presses would only advance one step.
      actions.cycleTheme();
      return;
    }
    if (key === 'm' || key === 'M') {
      e.preventDefault();
      actions.cycleMode();
      return;
    }
    if (key === 'p' || key === 'P') {
      e.preventDefault();
      actions.pip();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => {
    window.removeEventListener('keydown', onKey);
  };
}
