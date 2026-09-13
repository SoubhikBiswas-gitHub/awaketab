import type { ISettings, TTheme } from '@awaketab/core';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import { t } from '../i18n.js';

export function bindSettings(
  dialog: HTMLDialogElement,
  opts: {
    settings: ISettings;
    onChange: (next: ISettings) => void;
    hasBattery: boolean;
  },
): () => void {
  const form = dialog.querySelector('form');
  if (!form) return () => undefined;

  const apply = (patch: Partial<ISettings> | ((s: ISettings) => ISettings)) => {
    const cur = opts.settings;
    const next = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
    opts.onChange(next);
    opts.settings = next;
  };

  form.addEventListener('change', () => {
    const data = new FormData(form);
    const themeRaw = data.get('theme');
    const presetRaw = data.get('defaultPreset');
    const theme = (typeof themeRaw === 'string' ? themeRaw : 'auto') as TTheme;
    apply({
      theme,
      defaultPreset: (typeof presetRaw === 'string' ? presetRaw : 'p30') as ISettings['defaultPreset'],
      telemetry: data.get('telemetry') === 'on',
      keyboardShortcuts: data.get('keyboardShortcuts') === 'on',
      keyboardHints: data.get('keyboardHints') === 'on',
      notifications: data.get('notifications') === 'on',
      endBehaviour: data.get('endBehaviour') === 'stop' ? 'stop' : 'prompt_extend',
      sound: {
        ...opts.settings.sound,
        id: data.get('sound') === 'none' ? 'none' : 'chime',
      },
      battery: {
        ...opts.settings.battery,
        autoStop: data.get('batteryAuto') === 'on',
        threshold: Number(data.get('batteryThreshold') || 15),
      },
    });
  });

  dialog.querySelector('[data-settings-reset]')?.addEventListener('click', () => {
    const btn = dialog.querySelector<HTMLButtonElement>('[data-settings-reset]');
    if (btn?.dataset.confirm !== '1') {
      if (btn) {
        btn.dataset.confirm = '1';
        btn.textContent = t('settings.reset.confirm');
      }
      return;
    }
    apply(() => structuredClone(DEFAULT_SETTINGS));
    dialog.close();
  });

  const batt = dialog.querySelector<HTMLElement>('[data-battery-fields]');
  if (batt && !opts.hasBattery) batt.hidden = true;

  dialog.querySelector('[data-settings-close]')?.addEventListener('click', () => {
    dialog.close();
  });
  return () => undefined;
}
