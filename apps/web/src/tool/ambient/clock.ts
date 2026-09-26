import type { IToolCtx } from '../ctx.js';
import { el, everySecond } from './tick.js';

/**
 * `clock` and `night` share one layout; night's red digits, hidden ring and dimming are CSS (docs/05 §3.13).
 * Seconds (settings.ambient.showSeconds) render smaller; 12/24 h follows the locale unless overridden.
 */
export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const lang = document.documentElement.lang || 'en';
  const digits = el('div', { class: 'at-ambient-digits', 'data-clock': '' });
  const date = el('p', { class: 'at-ambient-sub' });
  stage.append(digits, date);
  const dateFmt = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' });

  return everySecond((now) => {
    const { clock24h, showSeconds } = ctx.store.get().settings.ambient;
    const d = new Date(now);
    const parts = new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds ? { second: '2-digit' } : {}),
      ...(clock24h === null ? {} : { hour12: !clock24h }),
      numberingSystem: 'latn',
    }).formatToParts(d);
    const nodes: Node[] = [];
    for (const [i, part] of parts.entries()) {
      const small = part.type === 'second' || (part.type === 'literal' && parts[i + 1]?.type === 'second');
      nodes.push(small ? el('span', { class: 'at-ambient-seconds' }, part.value) : document.createTextNode(part.value));
    }
    digits.replaceChildren(...nodes);
    date.textContent = dateFmt.format(d);
  });
}
