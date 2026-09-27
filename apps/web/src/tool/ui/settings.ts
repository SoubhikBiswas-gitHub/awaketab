import type { ISettings, TAmbientMode, TFace, TTheme } from '@awaketab/core';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import { ACCENTS, accentHex, applyAccent, PACK_ACCENTS } from '../accent.js';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { hm } from '../format.js';
import { t } from '../i18n.js';
import { sanitizeMsg } from '../params.js';
import { notificationsState } from '../signal.js';
import { applyTheme } from '../theme.js';
import { openDialog } from './dialog.js';

const MODES = new Set<TAmbientMode>(['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook']);
const FACES = new Set<TFace>([
  'ring',
  'bold',
  'horizon',
  'tide',
  'flip',
  'rolling',
  'analog',
  'rings',
  'word',
  'nixie',
  'lcd',
  'matrix',
]);

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
  setValue(form, 'face', s.face);
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
    face: FACES.has(str('face') as TFace) ? (str('face') as TFace) : cur.face,
    defaultPreset: (str('defaultPreset') || cur.defaultPreset) as ISettings['defaultPreset'],
    telemetry: data.get('telemetry') === 'on',
    keyboardShortcuts: data.get('keyboardShortcuts') === 'on',
    keyboardHints: data.get('keyboardHints') === 'on',
    notifications: notifDisabled ? cur.notifications : data.get('notifications') === 'on',
    endBehaviour: str('endBehaviour') === 'stop' ? 'stop' : 'prompt_extend',
    sound: { ...cur.sound, id: str('sound') === 'none' ? 'none' : 'chime' },
    battery: {
      ...cur.battery,
      autoStop: data.get('batteryAuto') === 'on',
      threshold,
    },
    ambient: {
      ...cur.ambient,
      mode: MODES.has(mode) ? mode : cur.ambient.mode,
      message: gates.message && data.has('ambientMessage') ? sanitizeMsg(str('ambientMessage')) : cur.ambient.message,
      showSeconds: data.get('showSeconds') === 'on',
      clock24h: clock === '24' ? true : clock === '12' ? false : null,
    },
  };
}

let bound = false;

export function openSettings(ctx: IToolCtx, opener?: Element | null): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="settings"]');
  const form = dialog?.querySelector('form');
  if (!dialog || !form) return;
  const gates = () => ({
    packs: hasFeature(ctx, 'ambient.packs'),
    message: hasFeature(ctx, 'ambient.message'),
  });
  const q = (sel: string) => dialog.querySelector<HTMLElement>(sel);
  const html = document.documentElement;

  const save = (next: ISettings) => {
    ctx.storage.writeSettings(next);
    ctx.store.set({ settings: next });
    applyTheme(next.theme, ctx.store.get().ui.mode === 'night');
    if (next.keyboardHints) delete html.dataset.hints;
    else html.dataset.hints = 'off';
  };

  const refresh = () => {
    const s = ctx.store.get().settings;
    const picked = (form.elements.namedItem('accent') as RadioNodeList | null)?.value ?? s.accent;
    const hex = accentHex(picked);
    const preview = PACK_ACCENTS.has(hex) && !gates().packs;
    applyAccent(hex, true);
    const name = t(`settings.accent.${ACCENTS[hex]}`);
    const note = q('[data-lamp-note]');
    if (note) note.textContent = preview ? t('settings.lamp.preview', { name }) : name;
    const packGate = q('[data-pack-gate]');
    if (packGate) packGate.hidden = gates().packs;
    const notif = field(form, 'notifications');
    const state = notificationsState();
    if (notif instanceof HTMLInputElement) notif.disabled = state === 'unavailable';
    const notes = q('[data-notifications-note]');
    if (notes) {
      notes.textContent =
        state === 'unavailable'
          ? t('settings.notifications.unavailable')
          : state === 'denied'
            ? t('settings.notifications.blocked')
            : t('settings.notifications.help');
    }
    const hasBattery = 'getBattery' in navigator;
    const batt = q('[data-battery-fields]');
    if (batt) batt.hidden = !hasBattery;
    const battNote = q('[data-battery-unavailable]');
    if (battNote) battNote.hidden = hasBattery;
    const range = field(form, 'batteryThreshold');
    if (range instanceof HTMLInputElement) range.disabled = !s.battery.autoStop;
    const label = q('[data-battery-label]');
    if (label)
      label.textContent = t('settings.battery.value', {
        percent: s.battery.threshold,
      });
    const hint = q('[data-battery-hint]');
    if (hint) hint.textContent = t(s.battery.autoStop ? 'settings.battery.on' : 'settings.battery.off');
    const now = q('[data-t="nowShows"]');
    if (now)
      now.textContent = t('settings.clock.now', {
        time: hm(Date.now(), s.ambient.clock24h, s.ambient.showSeconds),
      });
  };

  if (!bound) {
    bound = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
    form.addEventListener('input', (e) => {
      // The threshold slider reads its value live while dragging.
      const target = e.target;
      if (target instanceof HTMLInputElement && target.name === 'batteryThreshold') {
        const label = q('[data-battery-label]');
        if (label)
          label.textContent = t('settings.battery.value', {
            percent: target.value,
          });
      }
    });
    form.addEventListener('change', (e) => {
      const next = readSettings(form, ctx.store.get().settings, gates());
      const target = e.target;
      const asked =
        target instanceof HTMLInputElement && target.name === 'notifications' && target.checked
          ? notificationsState()
          : '';
      // Permission is asked only when the user turns notifications on (docs/04 §10 step 4).
      if (asked === 'default') {
        void Notification.requestPermission().then((p) => {
          const granted = p === 'granted';
          (target as HTMLInputElement).checked = granted;
          save({ ...ctx.store.get().settings, notifications: granted });
          refresh();
        });
      }
      if (asked === 'denied') {
        (target as HTMLInputElement).checked = false;
        next.notifications = false;
      }
      save(next);
      refresh();
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
      refresh();
    });
    // A previewed pack lamp is never kept: closing puts the stored lamp back.
    dialog.addEventListener('close', () => {
      applyAccent(ctx.store.get().settings.accent, gates().packs);
    });
  }

  fillSettings(form, ctx.store.get().settings);
  refresh();
  openDialog(dialog, opener);
}
