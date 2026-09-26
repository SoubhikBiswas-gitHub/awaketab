import { hasFeature, type IToolCtx } from './ctx.js';
import { t } from './i18n.js';

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

function button(doc: Document, label: string, data: string, aria?: string): HTMLButtonElement {
  const b = doc.createElement('button');
  b.type = 'button';
  b.className = 'at-btn at-pip-btn';
  b.textContent = label;
  b.dataset[data] = '';
  if (aria) b.setAttribute('aria-label', aria);
  return b;
}

/**
 * `pip.pro` (docs/05 §9): copies the ambient layer's digits — the clock (`clock`/`night`) or a running focus
 * block's interval countdown and phase label — into the PiP window, above the pill. They are clones of what
 * the ambient mode module renders in the page, so the maths lives in one place and nothing here chimes or
 * notifies twice. The session timer steps aside while they show (`body[data-ambient]`); the pill, the honest
 * lock state, never does. Other modes, and focus before a block starts, keep the free pill + timer layout.
 */
export function mirrorAmbient(ctx: IToolCtx, body: HTMLElement): () => void {
  const box = body.ownerDocument.createElement('div');
  box.className = 'at-pip-ambient';
  body.prepend(box);
  const content = ctx.root.querySelector('[data-ambient-content]');
  const sync = () => {
    const label = content?.querySelector('[data-focus-label]:not([hidden])');
    const digits = label ? content?.querySelector('[data-focus-digits]') : content?.querySelector('[data-clock]');
    const on = ctx.store.get().ui.mode !== 'standard' && !!digits;
    box.replaceChildren(...(on ? [label, digits] : []).flatMap((n) => (n ? [n.cloneNode(true)] : [])));
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
 * 280 × 120 window with Stop and +15; the page keeps an empty slot of the same size (CLS 0). Without
 * Document PiP, the /pip popup mirrors state over BroadcastChannel('awaketab') (pip-mirror.ts).
 * A second `P` closes the window. Closing never stops the session.
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
    try {
      const pro = hasFeature(ctx, 'pip.pro');
      const pip = await api.requestWindow(pro ? PIP_PRO_SIZE : PIP_SIZE);
      for (const node of document.querySelectorAll('style, link[rel="stylesheet"]')) {
        pip.document.head.append(node.cloneNode(true));
      }
      pip.document.documentElement.dataset.theme = document.documentElement.dataset.theme;
      pip.document.documentElement.lang = document.documentElement.lang;
      pip.document.title = t('pip.open');
      slot.style.minBlockSize = `${String(slot.offsetHeight)}px`;
      const body = pip.document.body;
      body.className = 'at-pip-body';
      const actions = pip.document.createElement('div');
      actions.className = 'at-pip-actions';
      const add = button(pip.document, t('pip.add15'), 'pipAdd', t('pip.add15.label'));
      const stop = button(pip.document, t('tool.ring.stop'), 'pipStop');
      actions.append(add, stop);
      body.append(pill, timer, actions);
      const offPro = pro ? mirrorAmbient(ctx, body) : () => undefined;
      const sync = () => {
        const s = ctx.store.get().session;
        const live = s?.status === 'active' || s?.status === 'paused';
        add.hidden = !live || s.endsAt === null;
        stop.hidden = !live;
      };
      const unsub = ctx.store.subscribe(sync);
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
