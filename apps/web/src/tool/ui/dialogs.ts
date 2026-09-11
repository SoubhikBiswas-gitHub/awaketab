import { CUSTOM_MAX_MS } from '@awaketab/core';
import en from '../../i18n/en.json';
import { formatHms } from '../format.js';
import { t, setCatalog } from '../i18n.js';
import { CUSTOM_MIN_MS } from '../params.js';

setCatalog(en);

export function customMs(days: number, hours: number, minutes: number): number {
  return ((days * 24 + hours) * 60 + minutes) * 60_000;
}

export function validateCustom(ms: number): string | null {
  if (ms < CUSTOM_MIN_MS) return t('tool.custom.error.min');
  if (ms > CUSTOM_MAX_MS) return t('tool.custom.error.max');
  return null;
}

export function bindCustomDialog(
  dialog: HTMLDialogElement,
  opts: {
    lastCustomMs: number;
    onStart: (ms: number) => void;
  },
): () => void {
  const days = dialog.querySelector<HTMLInputElement>('[name="days"]');
  const hours = dialog.querySelector<HTMLInputElement>('[name="hours"]');
  const minutes = dialog.querySelector<HTMLInputElement>('[name="minutes"]');
  const err = dialog.querySelector<HTMLElement>('[data-custom-error]');
  const summary = dialog.querySelector<HTMLElement>('[data-custom-summary]');
  if (!days || !hours || !minutes) return () => undefined;

  const fill = (ms: number) => {
    const totalMin = Math.floor(ms / 60_000);
    days.value = String(Math.floor(totalMin / (24 * 60)));
    hours.value = String(Math.floor((totalMin % (24 * 60)) / 60));
    minutes.value = String(totalMin % 60);
  };
  fill(opts.lastCustomMs);

  const read = () =>
    customMs(Number(days.value) || 0, Number(hours.value) || 0, Number(minutes.value) || 0);

  const update = () => {
    const ms = read();
    const v = validateCustom(ms);
    if (err) err.textContent = v ?? '';
    if (summary) summary.textContent = v ? '' : t('tool.custom.summary', { label: formatHms(ms), when: '' });
  };

  dialog.addEventListener('input', update);
  dialog.querySelector('[data-custom-cancel]')?.addEventListener('click', () => {
    dialog.close();
  });
  dialog.querySelector('[data-custom-start]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const ms = read();
    const v = validateCustom(ms);
    if (v) {
      if (err) err.textContent = v;
      return;
    }
    dialog.close();
    opts.onStart(ms);
  });
  update();
  return () => undefined;
}

export function bindUntilDialog(
  dialog: HTMLDialogElement,
  opts: { onStart: (wall: string) => void; lastWall: string | null },
): () => void {
  const time = dialog.querySelector<HTMLInputElement>('[name="until"]');
  const summary = dialog.querySelector<HTMLElement>('[data-until-summary]');
  if (!time) return () => undefined;
  const now = new Date();
  time.value =
    opts.lastWall ??
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const update = () => {
    const [h, m] = time.value.split(':').map(Number);
    const target = new Date();
    target.setHours(h ?? 0, m ?? 0, 0, 0);
    const tomorrow = target.getTime() <= Date.now();
    if (tomorrow) target.setDate(target.getDate() + 1);
    if (summary) {
      summary.textContent = t('tool.until.summary', {
        day: tomorrow ? t('tool.until.tomorrow') : t('tool.until.today'),
        time: time.value,
        remain: formatHms(target.getTime() - Date.now()),
      });
    }
  };
  time.addEventListener('input', update);
  update();
  dialog.querySelector('[data-until-cancel]')?.addEventListener('click', () => {
    dialog.close();
  });
  dialog.querySelector('[data-until-start]')?.addEventListener('click', (e) => {
    e.preventDefault();
    dialog.close();
    opts.onStart(time.value);
  });
  return () => undefined;
}
