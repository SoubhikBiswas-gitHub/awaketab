import type { IToolCtx } from '../ctx.js';
import { dateLong, dtf } from '../format.js';
import { t } from '../i18n.js';
import { el, everySecond } from './tick.js';

export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const h = el('span');
  const m = el('span');
  const ap = el('span', { class: 'at-am-ap' });
  const sec = el('span', { class: 'at-am-sec' });
  const track = el(
    'div',
    { class: 'at-am-track', 'aria-hidden': 'true' },
    ...Array.from({ length: 60 }, () => el('i')),
    el('b'),
  );
  const date = el('p', { class: 'at-am-date' });
  stage.append(
    el(
      'time',
      { class: 'at-am-clock', 'data-clock': '' },
      h,
      el('span', { class: 'at-am-colon' }, ':'),
      m,
      el('span', { class: 'at-am-suffix' }, ap, sec),
    ),
    track,
    date,
    el(
      'p',
      { class: 'at-am-nightnote' },
      el('span', {}, t('ambient.night.dims')),
      el('span', {}, t('ambient.night.dimmed')),
    ),
  );

  return everySecond((now) => {
    const { clock24h, showSeconds } = ctx.store.get().settings.ambient;
    const parts = dtf({
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      ...(clock24h === null ? {} : { hour12: !clock24h }),
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
