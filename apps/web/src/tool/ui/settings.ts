import type { ISettings, TFace, TTheme } from '@awaketab/core';
import type { TSoundAction } from '../packs/sound/index.js';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { notificationsState } from '../signal.js';
import { applyTheme } from '../theme.js';
import { openDialog } from './dialog.js';

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

// The sound pack (panel, focus sounds, the richer end sounds) loads the first time any of it is used.
export const sound = (ctx: IToolCtx, what: TSoundAction, el?: Element | null): Promise<void> =>
  import('../packs/sound/index.js').then((m) => {
    m.run(ctx, what, el);
  });

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
  setValue(form, 'face', s.face);
  setValue(form, 'sound', s.sound.id);
  setValue(form, 'soundVolume', String(Math.round(s.sound.volume * 100)));
  setValue(form, 'vibrate', s.vibrate);
  setValue(form, 'tick', s.tick);
  setValue(form, 'notifications', s.notifications);
  setValue(form, 'endBehaviour', s.endBehaviour);
  setValue(form, 'batteryAuto', s.battery.autoStop);
  setValue(form, 'batteryThreshold', String(s.battery.threshold));
  setValue(form, 'showSeconds', s.ambient.showSeconds);
  setValue(form, 'clock24h', s.ambient.clock24h === null ? 'auto' : s.ambient.clock24h ? '24' : '12');
  setValue(form, 'telemetry', s.telemetry);
  setValue(form, 'keyboardShortcuts', s.keyboardShortcuts);
  setValue(form, 'keyboardHints', s.keyboardHints);
  setValue(form, 'reduceMotion', s.reduceMotion === 'on');
}

export function readSettings(form: HTMLFormElement, cur: ISettings): ISettings {
  const data = new FormData(form);
  const str = (k: string) => {
    const v = data.get(k);
    return typeof v === 'string' ? v : '';
  };
  const clock = str('clock24h');
  const threshold = Math.min(30, Math.max(5, Math.round(Number(str('batteryThreshold')) || cur.battery.threshold)));
  // A disabled control is absent from FormData; it must not read as "off" and overwrite the stored value.
  const notif = field(form, 'notifications');
  const notifDisabled = notif instanceof HTMLInputElement && notif.disabled;
  return {
    ...cur,
    theme: (['auto', 'light', 'dark', 'oled'].includes(str('theme')) ? str('theme') : cur.theme) as TTheme,
    face: FACES.has(str('face') as TFace) ? (str('face') as TFace) : cur.face,
    telemetry: data.get('telemetry') === 'on',
    keyboardShortcuts: data.get('keyboardShortcuts') === 'on',
    keyboardHints: data.get('keyboardHints') === 'on',
    reduceMotion: data.get('reduceMotion') === 'on' ? 'on' : 'system',
    notifications: notifDisabled ? cur.notifications : data.get('notifications') === 'on',
    endBehaviour: str('endBehaviour') === 'stop' ? 'stop' : 'prompt_extend',
    sound: { id: (str('sound') || cur.sound.id) as ISettings['sound']['id'], volume: Number(str('soundVolume')) / 100 },
    vibrate: data.get('vibrate') === 'on',
    tick: data.get('tick') === 'on',
    battery: {
      ...cur.battery,
      autoStop: data.get('batteryAuto') === 'on',
      threshold,
    },
    ambient: {
      ...cur.ambient,
      showSeconds: data.get('showSeconds') === 'on',
      clock24h: clock === '24' ? true : clock === '12' ? false : null,
    },
  };
}

// `group` opens one of the four groups (timer, clock, focus, device), or `look` shows the looks panel.
export function openSettings(ctx: IToolCtx, opener?: Element | null, group?: string): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="settings"]');
  const form = dialog?.querySelector('form');
  if (!dialog || !form) return;
  const q = (sel: string) => dialog.querySelector<HTMLElement>(sel);
  const html = document.documentElement;

  const save = (next: ISettings) => {
    ctx.storage.writeSettings(next);
    ctx.store.set({ settings: next });
    applyTheme(next.theme, ctx.store.get().ui.mode === 'night');
    if (next.keyboardHints) delete html.dataset.hints;
    else html.dataset.hints = 'off';
    if (next.reduceMotion === 'on') html.dataset.motion = 'reduce';
    else delete html.dataset.motion;
  };

  const refresh = () => {
    const s = ctx.store.get().settings;
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
    const vib = q('[data-vibrate-row]');
    if (vib) vib.hidden = !('vibrate' in navigator);
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
  };

  if (!form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
    form.addEventListener('click', (e) => {
      const b =
        e.target instanceof Element ? e.target.closest<HTMLElement>('[data-sound],[data-reset],[data-act]') : null;
      if (!b) return;
      const r = b.dataset.reset;
      if (b.dataset.act)
        void import('./actions.js').then((m) => {
          m.openCustomize(ctx, 'look', b);
        });
      else if (!r) void sound(ctx, 'play', b);
      else {
        const box = b.closest('details');
        if (box) box.open = false;
        q('[data-settings-reset]')?.focus();
        if (r !== 'yes') return;
        const next = structuredClone(DEFAULT_SETTINGS);
        save(next);
        fillSettings(form, next);
        refresh();
        const done = q('[data-reset-done]');
        if (done) done.textContent = t('settings.reset.done');
      }
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
      const next = readSettings(form, ctx.store.get().settings);
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
      // Hearing a pick is the point of picking it; turning the tick on starts it without a reload.
      const n = (target as HTMLInputElement).name;
      if (n === 'sound' || n === 'soundVolume' || n === 'tick') void sound(ctx, n === 'tick' ? 'mount' : 'play');
    });
  }

  fillSettings(form, ctx.store.get().settings);
  refresh();
  const looks = q('[data-looks]');
  if (looks && group === 'look') looks.hidden = false;
  for (const d of dialog.querySelectorAll<HTMLDetailsElement>('[data-sg]')) if (group) d.open = d.dataset.sg === group;
  // Colour themes, lamps, patterns and presets are the themes pack; the focus tools, the second time zone and the
  // group lines are the extras pack. The sheet waits briefly for them so nothing pops in.
  const host = looks?.querySelector<HTMLElement>('[data-appearance]');
  const ready = Promise.all([
    host && !looks?.hidden && import('../packs/themes/appearance.js').then((m) => m.mountAppearance(ctx, host)),
    import('../packs/extras/index.js').then((m) => {
      m.panel(ctx, form);
    }),
  ]);
  // A failed pack load still opens the sheet; only the gallery is missing.
  void Promise.race([ready.catch(() => undefined), new Promise((r) => setTimeout(r, 400))]).then(() => {
    openDialog(dialog, opener);
    if (group === 'look') looks?.querySelector('input')?.focus();
  });
}
