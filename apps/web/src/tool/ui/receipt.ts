import type { IToolCtx } from '../ctx.js';
import { hm, mins } from '../format.js';
import { t } from '../i18n.js';

export function mountReceipt(ctx: IToolCtx): () => void {
  const { root, store } = ctx;
  const bar = root.querySelector<HTMLElement>('[data-rc-bar]');
  const put = (key: string, text: string) => {
    for (const n of root.querySelectorAll(`[data-t="${key}"]`)) n.textContent = text;
  };
  let shown: unknown = null;
  return store.subscribe((s) => {
    const d = s.ui.done;
    if (!d || d === shown || d.reason === 'battery') return;
    shown = d;
    const c24 = s.settings.ambient.clock24h;
    const log = d.log.length ? d.log : [[0, d.at - d.total, d.at] as const];
    let held = 0;
    let paused = 0;
    let pauses = 0;
    bar?.replaceChildren(
      ...log.map(([k, from, to]) => {
        const ms = Math.max(0, (to ?? d.at) - from);
        if (k) {
          paused += ms;
          pauses += 1;
        } else held += ms;
        const seg = document.createElement('span');
        seg.className = k ? 'at-seg-p' : 'at-seg-h';
        seg.style.flexGrow = String(Math.max(1, Math.round(ms / 1000)));
        return seg;
      }),
    );
    const from = log[0]?.[1] ?? d.at;
    const heldMin = Math.round(held / 60_000);
    const pausedMin = Math.round(paused / 60_000);
    const short = held < 60_000;
    const heldText = short ? `${String(Math.round(held / 1000))} ${t('tool.done.s')}` : mins(heldMin);
    const pausedText = mins(pausedMin);
    const totalMin = Math.round((d.at - from) / 60_000);
    put('rcBig', String(short ? Math.round(held / 1000) : heldMin));
    put('rcUnit', ` ${t(short ? 'tool.done.s' : 'tool.done.min')}`);
    put(
      'rcWords',
      t(pausedMin ? 'tool.done.of' : 'tool.done.whole', {
        length: mins(Math.max(1, totalMin)),
      }),
    );
    put('rcFrom', hm(from, c24));
    put('rcTo', hm(d.at, c24));
    put('rcHeld', t('tool.done.held', { length: heldText }));
    put(
      'rcPaused',
      t(pauses === 1 ? 'tool.done.hiddenOnce' : pauses === 2 ? 'tool.done.hiddenTwice' : 'tool.done.hiddenN', {
        length: pausedText,
        times: pauses,
      }),
    );
    root.toggleAttribute('data-rc-paused', paused > 0);
    bar?.setAttribute(
      'aria-label',
      t(paused ? 'tool.done.ariaPaused' : 'tool.done.aria', {
        from: hm(from, c24),
        to: hm(d.at, c24),
        held: heldText,
        paused: pausedText,
      }),
    );
  });
}
