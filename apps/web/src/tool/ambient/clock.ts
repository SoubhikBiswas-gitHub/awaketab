import type { IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { dateLong } from './fmt.js';
import { el, everySecond } from './tick.js';

export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const lang = document.documentElement.lang || 'en';
  const h = el('span');
  const m = el('span');
  const ap = el('span', { class: 'at-am-ap' });
  const sec = el('span', { class: 'at-am-sec' });
  const suffix = el('span', { class: 'at-am-suffix' });
  suffix.append(ap, sec);
  const time = el('time', { class: 'at-am-clock', 'data-clock': '' });
  time.append(h, el('span', { class: 'at-am-colon' }, ':'), m, suffix);
  const track = el('div', { class: 'at-am-track', 'aria-hidden': 'true' });
  for (let i = 0; i < 60; i += 1) track.append(el('i'));
  track.append(el('b'));
  const date = el('p', { class: 'at-am-date' });
  const note = el('p', { class: 'at-am-nightnote' });
  note.append(el('span', {}, t('ambient.night.dims')), el('span', {}, t('ambient.night.dimmed')));
  stage.append(time, track, date, note);

  return everySecond((now) => {
    const { clock24h, showSeconds } = ctx.store.get().settings.ambient;
    const parts = new Intl.DateTimeFormat(lang, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      ...(clock24h === null ? {} : { hour12: !clock24h }),
      numberingSystem: 'latn',
    }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    h.textContent = part('hour');
    m.textContent = part('minute');
    ap.textContent = part('dayPeriod');
    sec.textContent = showSeconds ? part('second') : '';
    const s = new Date(now).getSeconds();
    track.style.setProperty('--s', String(s));
    track.toggleAttribute('data-zero', s === 0);
    date.textContent = dateLong(now);
  });
}
