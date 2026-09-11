import { chipShortcut } from './ui/chips.js';
import { nextTheme } from './theme.js';
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
    cycleTheme: (theme: ReturnType<typeof nextTheme>) => void;
    cycleMode: () => void;
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
    const dialogOpen = s.ui.dialog !== null;
    const key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      if (dialogOpen) actions.closeDialog();
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
      actions.cycleTheme(nextTheme(s.settings.theme));
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
