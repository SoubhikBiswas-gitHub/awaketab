import type { ISettings, TAmbientMode, TTheme } from '@awaketab/core';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import { accentHex, applyAccent, PACK_ACCENTS } from '../accent.js';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { sanitizeMsg } from '../params.js';
import { notificationsState } from '../signal.js';
import { applyTheme } from '../theme.js';

const MODES = new Set<TAmbientMode>(['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook']);

type TField = HTMLInputElement | HTMLSelectElement;

function field(form: HTMLFormElement, name: string): TField | RadioNodeList | null {
  return (form.elements.namedItem(name) as TField | RadioNodeList | null) ?? null;
}

function setValue(form: HTMLFormElement, name: string, value: string | boolean): void {
  const f = field(form, name);
  if (!f) return;
  if (f instanceof RadioNodeList) {
    f.value = String(value);
    return;
  }
  if (f instanceof HTMLInputElement && f.type === 'checkbox') f.checked = Boolean(value);
  else f.value = String(value);
}

export function fillSettings(form: HTMLFormElement, s: ISettings): void {
  setValue(form, 'theme', s.theme);
  // A legacy palette hex (amber, indigo, teal, rose) selects the lamp that replaced it (docs/08 §2.1).
  setValue(form, 'accent', accentHex(s.accent));
  setValue(form, 'defaultPreset', s.defaultPreset);
  setValue(form, 'sound', s.sound.id === 'none' ? 'none' : 'chime');
  setValue(form, 'notifications', s.notifications);
  setValue(form, 'endBehaviour', s.endBehaviour);
  setValue(form, 'batteryAuto', s.battery.autoStop);
  setValue(form, 'batteryThreshold', String(s.battery.threshold));
  setValue(form, 'ambientMode', s.ambient.mode);
  setValue(form, 'ambientMessage', s.ambient.message);
  setValue(form, 'showSeconds', s.ambient.showSeconds);
  setValue(form, 'clock24h', s.ambient.clock24h === null ? 'auto' : s.ambient.clock24h ? '24' : '12');
  setValue(form, 'telemetry', s.telemetry);
  setValue(form, 'keyboardShortcuts', s.keyboardShortcuts);
  setValue(form, 'keyboardHints', s.keyboardHints);
}

export function readSettings(
  form: HTMLFormElement,
  cur: ISettings,
  gates: { packs: boolean; message: boolean },
): ISettings {
  const data = new FormData(form);
  const str = (k: string) => {
    const v = data.get(k);
    return typeof v === 'string' ? v : '';
  };
  const accent = str('accent').toUpperCase() || cur.accent;
  const mode = str('ambientMode') as TAmbientMode;
  const clock = str('clock24h');
  const threshold = Math.min(30, Math.max(5, Math.round(Number(str('batteryThreshold')) || cur.battery.threshold)));
  // A disabled control is absent from FormData; it must not read as "off" and overwrite the stored value.
  const notif = field(form, 'notifications');
  const notifDisabled = notif instanceof HTMLInputElement && notif.disabled;
  return {
    ...cur,
    theme: (['auto', 'light', 'dark', 'oled'].includes(str('theme')) ? str('theme') : cur.theme) as TTheme,
    accent: PACK_ACCENTS.has(accent) && !gates.packs ? cur.accent : accent,
    defaultPreset: (str('defaultPreset') || cur.defaultPreset) as ISettings['defaultPreset'],
    telemetry: data.get('telemetry') === 'on',
    keyboardShortcuts: data.get('keyboardShortcuts') === 'on',
    keyboardHints: data.get('keyboardHints') === 'on',
    notifications: notifDisabled ? cur.notifications : data.get('notifications') === 'on',
    endBehaviour: str('endBehaviour') === 'stop' ? 'stop' : 'prompt_extend',
    sound: { ...cur.sound, id: str('sound') === 'none' ? 'none' : 'chime' },
    battery: { ...cur.battery, autoStop: data.get('batteryAuto') === 'on', threshold },
    ambient: {
      ...cur.ambient,
      mode: MODES.has(mode) ? mode : cur.ambient.mode,
      message: gates.message ? sanitizeMsg(str('ambientMessage')) : cur.ambient.message,
      showSeconds: data.get('showSeconds') === 'on',
      clock24h: clock === '24' ? true : clock === '12' ? false : null,
    },
  };
}

let bound = false;

export function openSettings(ctx: IToolCtx): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="settings"]');
  const form = dialog?.querySelector('form');
  if (!dialog || !form) return;
  const gates = () => ({ packs: hasFeature(ctx, 'ambient.packs'), message: hasFeature(ctx, 'ambient.message') });
  const q = (sel: string) => dialog.querySelector<HTMLElement>(sel);

  const save = (next: ISettings) => {
    ctx.storage.writeSettings(next);
    ctx.store.set({ settings: next });
    applyTheme(next.theme, ctx.store.get().ui.mode === 'night');
    applyAccent(next.accent, gates().packs);
  };

  const refreshGates = () => {
    const g = gates();
    for (const input of form.querySelectorAll<HTMLInputElement>('input[name="accent"]')) {
      if (PACK_ACCENTS.has(input.value.toUpperCase())) input.disabled = !g.packs;
    }
    const msg = field(form, 'ambientMessage');
    if (msg instanceof HTMLInputElement) msg.disabled = !g.message;
    const gate = q('[data-message-gate]');
    if (gate) gate.hidden = g.message;
    const packGate = q('[data-pack-gate]');
    if (packGate) packGate.hidden = g.packs;
    const notes = q('[data-notifications-note]');
    const notif = field(form, 'notifications');
    const state = notificationsState();
    if (notif instanceof HTMLInputElement) notif.disabled = state === 'unavailable';
    if (notes) {
      notes.hidden = state !== 'unavailable' && state !== 'denied';
      notes.textContent =
        state === 'unavailable' ? t('settings.notifications.unavailable') : t('settings.notifications.blocked');
    }
    const hasBattery = 'getBattery' in navigator;
    const batt = q('[data-battery-fields]');
    if (batt) batt.hidden = !hasBattery;
    const battNote = q('[data-battery-unavailable]');
    if (battNote) battNote.hidden = hasBattery;
    const label = q('[data-battery-label]');
    if (label)
      label.textContent = t('settings.battery.threshold', { percent: ctx.store.get().settings.battery.threshold });
  };

  if (!bound) {
    bound = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
    form.addEventListener('change', (e) => {
      const next = readSettings(form, ctx.store.get().settings, gates());
      const target = e.target;
      // Permission is asked only when the user turns notifications on (docs/04 §10 step 4).
      if (
        target instanceof HTMLInputElement &&
        target.name === 'notifications' &&
        target.checked &&
        notificationsState() === 'default'
      ) {
        void Notification.requestPermission().then((p) => {
          const granted = p === 'granted';
          target.checked = granted;
          save({ ...ctx.store.get().settings, notifications: granted });
          refreshGates();
        });
      }
      if (
        target instanceof HTMLInputElement &&
        target.name === 'notifications' &&
        target.checked &&
        notificationsState() === 'denied'
      ) {
        target.checked = false;
        next.notifications = false;
      }
      save(next);
      refreshGates();
    });
    const reset = dialog.querySelector<HTMLButtonElement>('[data-settings-reset]');
    reset?.addEventListener('click', () => {
      if (reset.dataset.confirm !== '1') {
        reset.dataset.confirm = '1';
        reset.textContent = t('settings.reset.confirm');
        return;
      }
      delete reset.dataset.confirm;
      reset.textContent = t('settings.reset');
      const next = structuredClone(DEFAULT_SETTINGS);
      save(next);
      fillSettings(form, next);
      refreshGates();
    });
    q('[data-settings-close]')?.addEventListener('click', () => {
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      ctx.store.set({ ui: { dialog: null } });
    });
  }

  fillSettings(form, ctx.store.get().settings);
  refreshGates();
  ctx.store.set({ ui: { dialog: 'settings' } });
  if (!dialog.open) dialog.showModal();
}
