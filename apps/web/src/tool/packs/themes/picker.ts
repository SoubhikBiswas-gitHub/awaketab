import 'vanilla-colorful/hex-color-picker.js';
import { t } from '../../i18n.js';
import { fitLamp } from './fit.js';

interface IPickerHooks {
  start: string;
  pro: () => boolean;
  change: (hex: string) => void;
  use: () => void;
  cancel: () => void;
}

export function mountPicker(box: HTMLElement, hooks: IPickerHooks): void {
  const wheel = document.createElement('hex-color-picker');
  wheel.color = hooks.start;
  const field = document.createElement('input');
  Object.assign(field, { id: 'lk-hex', value: hooks.start, maxLength: 7, spellcheck: false, autocomplete: 'off' });
  const fieldLabel = Object.assign(document.createElement('label'), {
    htmlFor: 'lk-hex',
    textContent: t('settings.custom.hex'),
  });
  const fit = Object.assign(document.createElement('p'), { className: 'at-caption' });
  const said = Object.assign(document.createElement('span'), { className: 'sr-only' });
  said.setAttribute('role', 'status');
  const use = Object.assign(document.createElement('button'), { type: 'button', className: 'at-button at-button-sm' });
  const cancel = Object.assign(document.createElement('button'), {
    type: 'button',
    className: 'at-textlink',
    textContent: t('tool.custom.cancel'),
  });
  const row = Object.assign(document.createElement('div'), { className: 'at-lk-hexrow' });
  row.append(fieldLabel, field);
  const actions = Object.assign(document.createElement('div'), { className: 'at-lk-actions' });
  actions.append(use, cancel);
  box.append(wheel, row, fit, actions, said);

  let frame = 0;
  let picked = hooks.start;
  const show = (raw: string, announce: boolean) => {
    const hex = fitLamp(raw);
    picked = hex;
    const moved = hex !== raw.toUpperCase();
    fit.textContent = moved ? t('settings.custom.fitted', { hex }) : t('settings.custom.ok');
    if (announce) said.textContent = fit.textContent;
    use.textContent = t(hooks.pro() ? 'settings.custom.use' : 'settings.preview.keep');
    hooks.change(hex);
  };
  // One repaint per frame while dragging; the fitted result is read out when the drag or typing settles.
  wheel.addEventListener('color-changed', (e) => {
    const raw = (e as CustomEvent<{ value: string }>).detail.value;
    field.value = raw.toUpperCase();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      show(raw, false);
    });
  });
  wheel.addEventListener('pointerup', () => {
    said.textContent = fit.textContent;
  });
  field.addEventListener('change', (e) => {
    // The field sits in the Settings form; the form must not treat it as a setting.
    e.stopPropagation();
    const v = field.value.trim();
    const raw = v.startsWith('#') ? v : `#${v}`;
    if (!/^#[0-9A-Fa-f]{6}$/u.test(raw)) {
      field.setAttribute('aria-invalid', 'true');
      fit.textContent = t('settings.custom.invalid');
      said.textContent = fit.textContent;
      return;
    }
    field.removeAttribute('aria-invalid');
    wheel.color = raw;
    show(raw, true);
  });
  use.addEventListener('click', () => {
    field.value = picked;
    hooks.use();
  });
  cancel.addEventListener('click', hooks.cancel);
  use.textContent = t(hooks.pro() ? 'settings.custom.use' : 'settings.preview.keep');
  fit.textContent = t('settings.custom.help');
}
