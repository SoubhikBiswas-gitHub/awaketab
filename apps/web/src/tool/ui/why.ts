import type { IToolCtx } from '../ctx.js';
import { hm } from '../format.js';
import { t } from '../i18n.js';
import { statusOf } from './view.js';

type TRow = [title: string, detail: string, dot: 'ok' | 'warn' | 'bad' | 'info' | 'wait'];

export function whyRows(ctx: Pick<IToolCtx, 'store'>, now = Date.now()): TRow[] {
  const s = ctx.store.get();
  const st = statusOf(s);
  const c24 = s.settings.ambient.clock24h;
  const at = (ms: number, secs = false) => hm(ms || now, c24, secs);
  const lock = (d: string, dot: TRow[2]): TRow => [t('tool.why.lock'), d, dot];
  const tab = (d: string, dot: TRow[2]): TRow => [t('tool.why.tab'), d, dot];
  const timer: TRow = [t('tool.why.timer'), t('tool.why.timerD'), 'info'];
  const none = lock(t('tool.why.lockNone'), 'info');
  const video = (d: string, dot: TRow[2]): TRow => [t('tool.why.video'), d, dot];
  if (st === 'ready') return [lock(t('tool.why.lockReady'), 'info'), tab(t('tool.why.tabReady'), 'info'), timer];
  if (st === 'ended') return [lock(t('tool.why.lockEnded', { time: at(s.ui.done?.at ?? now) }), 'info'), timer];
  if (st === 'starting')
    return [
      lock(t('tool.why.lockStarting', { time: at(s.ui.asked, true) }), 'wait'),
      tab(t('tool.why.tabVisible'), 'ok'),
      timer,
    ];
  const lostAt = [...s.ui.log].reverse().find(([k]) => k === 1)?.[1] ?? now;
  if (st === 'paused')
    return [lock(t('tool.why.lockPaused', { time: at(lostAt) }), 'warn'), tab(t('tool.why.tabPaused'), 'warn'), timer];
  if (st === 'blocked')
    return [
      lock(t('tool.why.lockBlocked', { time: at(s.ui.asked) }), 'bad'),
      [t('tool.why.causes'), t('tool.why.causesD'), 'info'],
      timer,
    ];
  if (st === 'needtap') return [none, video(t('tool.why.videoTap'), 'wait')];
  if (st === 'fallback' || s.ui.ask?.fb)
    return [none, video(t('tool.why.videoOn'), 'ok'), tab(t('tool.why.tabVideo'), 'ok')];
  return [
    lock(
      t('tool.why.lockHeld', {
        time: at(s.ui.ok || s.session?.startedAt || now, true),
      }),
      'ok',
    ),
    tab(t('tool.why.tabVisible'), 'ok'),
    timer,
    [t('tool.why.power'), t('tool.why.powerD'), 'info'],
  ];
}

export function mountWhy(ctx: IToolCtx): () => void {
  const list = ctx.root.querySelector<HTMLElement>('[data-why-list]');
  let last = '';
  return ctx.store.subscribe(() => {
    if (!list || !ctx.store.get().ui.why) return;
    const rows = whyRows(ctx);
    const key = JSON.stringify(rows);
    if (key === last) return;
    last = key;
    list.replaceChildren(
      ...rows.map(([title, detail, dot]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="at-why-dot" data-dot="${dot}" aria-hidden="true"></span><span><b></b><span></span></span>`;
        (li.querySelector('b') as HTMLElement).textContent = title;
        (li.querySelector('b + span') as HTMLElement).textContent = detail;
        return li;
      }),
    );
  });
}
