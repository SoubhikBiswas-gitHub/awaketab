import { hasFeature, type IToolCtx } from '../ctx.js';
import { remainingOf } from '../format.js';
import { t } from '../i18n.js';
import { ambientCss, at, digits as writeDigits } from './fmt.js';
import { el, everySecond } from './tick.js';

export const PIP_SIZE = { width: 280, height: 120 } as const;
/** `pip.pro` asks for a taller window so the ambient digits fit above the pill (docs/05 §9). */
export const PIP_PRO_SIZE = { width: 280, height: 160 } as const;
export const PIP_ADD_MS = 15 * 60_000;

interface IDocPip {
  requestWindow(o: { width: number; height: number }): Promise<Window>;
  window?: Window | null;
}

let current: Window | null = null;

/** The popup in the opener's language: `/pip` for English, `/{lang}/pip` for the seven other locales. */
export function pipPath(htmlLang: string): string {
  const lang = htmlLang.toLowerCase().replace('-hans', '');
  return /^(?:es|pt-br|de|fr|ja|zh|hi)$/u.test(lang) ? `/${lang}/pip` : '/pip';
}

/**
 * `pip.pro` (docs/05 §9): the ambient layer's digits — the clock (`clock`/`night`) or a running focus block's
 * interval countdown — replace the session digits, with a kicker line ("Focus · Cycle 2 of 4") under the pill.
 * They are clones of what the ambient mode module renders in the page, so the maths lives in one place and
 * nothing here chimes or notifies twice. The pill, the honest lock state, never steps aside. Other modes, and
 * focus before a block starts, keep the free layout.
 */
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
    const kick = el('p', { class: 'at-pip-kick' });
    if (label) kick.textContent = [...label.children].slice(0, 2).map((n) => n.textContent).join(' · ');
    else if (clock) kick.textContent = [clock.querySelector('.at-am-ap')?.textContent, content?.querySelector('.at-am-date')?.textContent].filter(Boolean).join(' · ');
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

/**
 * `P` / the header button (docs/05 §9). Document PiP moves — never clones — the pill and timer into a
 * 280 × 120 window (PipWindow canvas: logo, pill and "until" on top, the digits with +15 and Stop below);
 * the page keeps an empty slot of the same size (CLS 0). Without Document PiP, the /pip popup mirrors state
 * over BroadcastChannel('awaketab') (pip-mirror.ts). A second `P` closes the window. Closing never stops the
 * session.
 */
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
      const body = pip.document.body;
      body.className = 'at-pip-body';
      const top = el('div', { class: 'at-pip-top' });
      const until = el('span', { class: 'at-pip-until' });
      top.append(pill, until);
      const digits = el('div', { class: 'at-pip-digits', role: 'timer' });
      const actions = el('div', { class: 'at-pip-actions' });
      const add = el('button', { type: 'button', class: 'at-pip-btn', 'data-pip-add': '', 'aria-label': t('pip.add15.label') }, t('pip.add15'));
      const stop = el('button', { type: 'button', class: 'at-pip-btn', 'data-pip-stop': '' }, t('tool.ring.stop'));
      actions.append(add, stop);
      const empty = el('p', { class: 'at-pip-empty' }, `${t('pip.empty')} AwakeTab`);
      body.append(top, digits, actions, empty, timer);
      const offPro = pro ? mirrorAmbient(ctx, body) : () => undefined;
      const paint = (now: number) => {
        const s = ctx.store.get();
        const session = s.session;
        const live = session?.status === 'active' || session?.status === 'paused';
        add.hidden = !live || session.endsAt === null;
        stop.hidden = !live;
        empty.hidden = live;
        body.toggleAttribute('data-live', live);
        if (!live) return;
        const rem = remainingOf(session, now);
        const text = writeDigits(digits, rem ?? now - session.startedAt - session.pausedMs);
        digits.toggleAttribute('data-long', text.length > 5);
        until.hidden = s.lock !== 'held' || rem === null;
        until.textContent = rem === null ? '' : t('ambient.until', { time: at(now + rem, now, s.settings.ambient.clock24h) });
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
        slot.append(pill, timer);
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
  const pop = window.open(pipPath(document.documentElement.lang), 'awaketab-pip', `popup,width=${String(PIP_SIZE.width)},height=${String(PIP_SIZE.height)}`);
  if (!pop) return 'blocked';
  current = pop;
  ctx.store.set({ ui: { pip: 'popup' } });
  return 'popup';
}
