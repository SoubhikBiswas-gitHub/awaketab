import { PRESET_MS, type TPresetId } from '@awaketab/core';
import { t } from '../i18n.js';
import type { IStore } from '../store.js';

const CHIPS: TPresetId[] = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'custom', 'until'];

export function mountChips(
  root: HTMLElement,
  store: IStore,
  handlers: {
    startPreset: (id: Exclude<TPresetId, 'custom' | 'until'>) => void;
    openCustom: () => void;
    openUntil: () => void;
  },
): () => void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-preset]')];

  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const id = btn.dataset.preset as TPresetId | undefined;
      if (!id || !CHIPS.includes(id)) return;
      if (id === 'custom') {
        handlers.openCustom();
        return;
      }
      if (id === 'until') {
        handlers.openUntil();
        return;
      }
      const s = store.get();
      if (s.session?.status === 'active' && s.session.presetId === id) return;
      handlers.startPreset(id);
    });
  }

  return store.subscribe((s) => {
    const pressed =
      s.session?.status === 'active' || s.session?.status === 'paused' ? s.session.presetId : s.selectedPreset;
    const busy = s.lock === 'requesting';
    for (const btn of buttons) {
      const id = btn.dataset.preset as TPresetId | undefined;
      btn.setAttribute('aria-pressed', id === pressed ? 'true' : 'false');
      btn.toggleAttribute('aria-disabled', busy);
      btn.disabled = busy;
      if (id === 'pinf') {
        const sr = btn.querySelector('.sr-only');
        if (sr) sr.textContent = t('tool.preset.pinf.sr');
      }
    }
  });
}

export function chipShortcut(key: string): Exclude<TPresetId, 'custom' | 'until'> | null {
  const map: Record<string, Exclude<TPresetId, 'custom' | 'until'>> = {
    '1': 'p15',
    '2': 'p30',
    '3': 'p45',
    '4': 'p60',
    '5': 'p120',
    '6': 'p240',
    '0': 'pinf',
  };
  return map[key] ?? null;
}

export function durationLabel(id: Exclude<TPresetId, 'custom' | 'until' | 'pinf'>): string {
  const min = PRESET_MS[id] / 60_000;
  if (min < 60) return t(`tool.preset.${id}`);
  return t(`tool.preset.${id}`);
}
