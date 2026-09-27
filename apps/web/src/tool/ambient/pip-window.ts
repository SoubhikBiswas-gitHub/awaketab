import { hasFeature, type IToolCtx } from '../ctx.js';
import { remainingOf } from '../format.js';
import { t } from '../i18n.js';
import { liveSession } from '../ui/view.js';
import { ambientCss, at, digits as writeDigits } from './fmt.js';
import { el, everySecond } from './tick.js';

export const PIP_SIZE = { width: 280, height: 120 } as const;
export const PIP_PRO_SIZE = { width: 280, height: 160 } as const;
export const PIP_ADD_MS = 15 * 60_000;

interface IDocPip {
  requestWindow(o: { width: number; height: number }): Promise<Window>;
  window?: Window | null;
}

let current: Window | null = null;

export function pipPath(htmlLang: string): string {
  const lang = htmlLang.toLowerCase().replace('-hans', '');
  return /^(?:es|pt-br|de|fr|ja|zh|hi)$/u.test(lang) ? `/${lang}/pip` : '/pip';
}

export function mirrorAmbient(ctx: IToolCtx, body: HTMLElement): () => void {
  const box = el('div', { class: 'at-pip-ambient' });
  body.querySelector('.at-pip-top')?.after(box);
  if (!box.isConnected) body.prepend(box);
  const content = ctx.root.querySelector('[data-ambient-content]');
  const sync = () => {
    const label = content?.querySelector('[data-focus-label]:not([hidden])');
    const clock = content?.querySelector('[data-clock]');
    const digits = label ? content?.querySelector('[data-focus-digits]') : clock;
    const on = ctx.store.get().ui.mode !== 'standard' && !!digits;
    const kick = el(
      'p',
      { class: 'at-pip-kick' },
      (label
        ? [...label.children].slice(0, 2).map((n) => n.textContent)
        : [clock?.querySelector('.at-am-ap')?.textContent, content?.querySelector('.at-am-date')?.textContent].filter(
            Boolean,
          )
      ).join(' · '),
    );
    kick.toggleAttribute('data-now', !label);
    box.replaceChildren(...(on ? [kick, digits.cloneNode(true)] : []));
    body.toggleAttribute('data-ambient', on);
  };
  const mo = new MutationObserver(sync);
  if (content) mo.observe(content, { subtree: true, childList: true, characterData: true, attributes: true });
  const unsub = ctx.store.subscribe(sync);
  sync();
  return () => {
    mo.disconnect();
    unsub();
  };
}

export async function togglePip(ctx: IToolCtx): Promise<'document' | 'popup' | 'blocked' | 'closed'> {
  if (current && !current.closed) {
    current.close();
    current = null;
    return 'closed';
  }
  const slot = ctx.root.querySelector<HTMLElement>('[data-pip-slot]');
  const pill = slot?.querySelector<HTMLElement>('[data-pill]');
  const timer = slot?.querySelector<HTMLElement>('[data-timer]');
  const api = (window as Window & { documentPictureInPicture?: IDocPip }).documentPictureInPicture;
  if (api && slot && pill && timer) {
    // The cloned <link> below makes the window fetch the layer's stylesheet itself; no need to wait here.
    void ambientCss();
    try {
      const pro = hasFeature(ctx, 'pip.pro');
      const pip = await api.requestWindow(pro ? PIP_PRO_SIZE : PIP_SIZE);
      for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
        pip.document.head.append(node.cloneNode(true));
      }
      const html = pip.document.documentElement;
      html.dataset.theme = document.documentElement.dataset.theme;
      if (document.documentElement.dataset.accent) html.dataset.accent = document.documentElement.dataset.accent;
      html.lang = document.documentElement.lang;
      pip.document.title = t('pip.open');
      slot.style.minBlockSize = `${String(slot.offsetHeight)}px`;
      // The pill and timer sit deep in the face markup; comments hold their places until the window closes.
      const pillHome = document.createComment('');
      const timerHome = document.createComment('');
      pill.before(pillHome);
      timer.before(timerHome);
      const body = pip.document.body;
      body.className = 'at-pip-body';
      const until = el('span', { class: 'at-pip-until' });
      const digits = el('div', { class: 'at-pip-digits', role: 'timer' });
      const add = el(
        'button',
        { type: 'button', class: 'at-pip-btn', 'data-pip-add': '', 'aria-label': t('pip.add15.label') },
        t('pip.add15'),
      );
      const stop = el('button', { type: 'button', class: 'at-pip-btn', 'data-pip-stop': '' }, t('tool.ring.stop'));
      const empty = el('p', { class: 'at-pip-empty' }, `${t('pip.empty')} AwakeTab`);
      body.append(
        el('div', { class: 'at-pip-top' }, pill, until),
        digits,
        el('div', { class: 'at-pip-actions' }, add, stop),
        empty,
        timer,
      );
      const offPro = pro ? mirrorAmbient(ctx, body) : () => undefined;
      const paint = (now: number) => {
        const s = ctx.store.get();
        const session = liveSession(s);
        add.hidden = !session || session.endsAt === null;
        stop.hidden = !session;
        empty.hidden = !!session;
        body.toggleAttribute('data-live', !!session);
        if (!session) return;
        const rem = remainingOf(session, now);
        const text = writeDigits(digits, rem ?? now - session.startedAt - session.pausedMs);
        digits.toggleAttribute('data-long', text.length > 5);
        until.hidden = s.lock !== 'held' || rem === null;
        until.textContent =
          rem === null ? '' : t('ambient.until', { time: at(now + rem, now, s.settings.ambient.clock24h) });
      };
      const offTick = everySecond(paint);
      const unsub = ctx.store.subscribe(() => {
        paint(Date.now());
      });
      add.addEventListener('click', () => {
        ctx.engine.addTime(PIP_ADD_MS);
        ctx.syncLock();
      });
      stop.addEventListener('click', ctx.stop);
      pip.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'p' || e.key === 'P') pip.close();
        else if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          ctx.stop();
        }
      });
      pip.addEventListener('pagehide', () => {
        unsub();
        offTick();
        offPro();
        pillHome.replaceWith(pill);
        timerHome.replaceWith(timer);
        slot.style.minBlockSize = '';
        current = null;
        ctx.store.set({ ui: { pip: 'closed' } });
      });
      current = pip;
      ctx.store.set({ ui: { pip: 'document' } });
      return 'document';
    } catch {
      // Denied (e.g. no user activation): fall through to the popup.
    }
  }
  const pop = window.open(
    pipPath(document.documentElement.lang),
    'awaketab-pip',
    `popup,width=${String(PIP_SIZE.width)},height=${String(PIP_SIZE.height)}`,
  );
  if (!pop) return 'blocked';
  current = pop;
  ctx.store.set({ ui: { pip: 'popup' } });
  return 'popup';
}
