import { hasFeature, type IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { sanitizeMsg } from '../params.js';
import { toast } from '../ui/toast.js';
import { MESSAGE_PREVIEW_MS, resolveMessage } from './logic.js';
import { el } from './tick.js';

// The shared-link preview is spent once per page view; coming back to the mode shows the Pro card.
let previewSpent = false;

/**
 * One line of user text (docs/05 §3.15). The text is re-sanitised here and only ever written with
 * textContent — `msg=` can never inject markup. Without `ambient.message` a shared link previews for 60 s,
 * otherwise the layout shows sample text behind a scrim with an honest Pro card.
 */
export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const pro = hasFeature(ctx, 'ambient.message');
  const view = resolveMessage({
    param: previewSpent && !pro ? '' : sanitizeMsg(ctx.params.msg),
    saved: sanitizeMsg(ctx.store.get().settings.ambient.message),
    pro,
    sample: t('ambient.message.placeholder'),
  });
  const text = el('p', { class: 'at-ambient-message', dir: 'auto', lang: document.documentElement.lang || 'en', 'data-message': '' });
  text.textContent = view.text || t('ambient.message.empty');
  stage.append(text);

  if (view.sample) {
    stage.dataset.scrim = '';
    const card = el('div', { class: 'at-banner at-pro-card', 'data-message-pro': '' });
    card.append(
      el('p', {}, t('ambient.message.pro')),
      el('a', { class: 'at-btn', href: '/pro', 'data-pro-link': '' }, t('pro.see')),
    );
    card.querySelector('a')?.addEventListener('click', () => {
      ctx.track('pro_view', { from: 'message' });
    });
    stage.append(card);
  }

  let timer = 0;
  if (view.preview) {
    timer = window.setTimeout(() => {
      previewSpent = true;
      toast(ctx.store, { kind: 'info', text: t('tool.toast.proMessage'), id: 'mode' });
      ctx.store.set({ ui: { mode: 'clock' } });
    }, MESSAGE_PREVIEW_MS);
  }
  return () => {
    window.clearTimeout(timer);
    delete stage.dataset.scrim;
  };
}
