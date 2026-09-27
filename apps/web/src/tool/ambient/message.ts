import { hasFeature, type IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { sanitizeMsg } from '../params.js';
import { toast } from '../ui/toast.js';
import { MESSAGE_PREVIEW_MS, resolveMessage } from './logic.js';
import { dateLong, hm } from './fmt.js';
import { el, everySecond } from './tick.js';

// The shared-link preview is spent once per page view; coming back to the mode shows the Pro card.
let previewSpent = false;

/**
 * One line of user text (docs/05 §3.15). The text is re-sanitised here and only ever written with
 * textContent — `msg=` can never inject markup. Without `ambient.message` a shared link previews for 60 s
 * (Pro tag and countdown top right), otherwise the text is hidden behind the honest Pro card. Pro edits the
 * saved message in place (the same at.v1.settings field as Settings).
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
  const meta = el('p', { class: 'at-am-meta' });
  const time = el('time');
  const date = el('span');
  meta.append(time, date);
  stage.append(text, meta);

  if (view.sample) {
    stage.dataset.scrim = '';
    text.setAttribute('aria-hidden', 'true');
    const card = el('section', { class: 'at-pro-card', 'data-message-pro': '', 'aria-labelledby': 'am-pro' });
    const actions = el('div');
    const see = el('a', { class: 'at-am-cta', href: '/pro', 'data-pro-link': '' }, t('pro.see'));
    const back = el('button', { type: 'button', class: 'at-am-skip' }, t('ambient.message.back', { mode: t('ambient.mode.clock') }));
    actions.append(see, back);
    card.append(el('span', { class: 'at-am-tag' }, t('pro.badge')), el('h2', { id: 'am-pro' }, t('tool.toast.proMessage')), el('p', {}, t('ambient.message.pro')), actions);
    see.addEventListener('click', () => {
      ctx.track('pro_view', { from: 'message' });
    });
    back.addEventListener('click', () => {
      ctx.store.set({ ui: { mode: 'clock' } });
    });
    stage.append(card);
  }

  const preview = el('p', { class: 'at-am-preview' });
  const long = el('span');
  const brief = el('span');
  if (view.preview) {
    preview.append(el('span', { class: 'at-am-tag' }, t('pro.badge')), long, brief);
    stage.append(preview);
  }

  if (pro) {
    const edit = el('button', { type: 'button', class: 'at-am-edit' }, t('ambient.message.edit'));
    const form = el('form', { class: 'at-am-msgform', hidden: '' });
    const input = el('input', { id: 'am-msg', dir: 'auto', maxlength: '80', autocomplete: 'off' });
    const row = el('div');
    const n = el('span');
    const cancel = el('button', { type: 'button', class: 'at-am-skip' }, t('tool.custom.cancel'));
    row.append(n, cancel, el('button', { type: 'submit', class: 'at-am-save' }, t('ambient.message.show')));
    form.append(el('label', { for: 'am-msg' }, t('ambient.message.label')), input, row);
    const close = () => {
      form.hidden = true;
      text.hidden = edit.hidden = false;
    };
    const count = () => {
      n.textContent = `${String(Array.from(input.value).length)} / 80`;
    };
    edit.addEventListener('click', () => {
      form.hidden = false;
      text.hidden = edit.hidden = true;
      input.value = text.textContent;
      count();
      input.focus();
    });
    input.addEventListener('input', count);
    cancel.addEventListener('click', close);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = sanitizeMsg(input.value);
      if (message) {
        const s = ctx.store.get().settings;
        const next = { ...s, ambient: { ...s.ambient, message } };
        ctx.storage.writeSettings(next);
        ctx.store.set({ settings: next });
        text.textContent = message;
      }
      close();
    });
    text.after(form);
    stage.append(edit);
  }

  const started = Date.now();
  const off = everySecond((now) => {
    time.textContent = hm(now, ctx.store.get().settings.ambient.clock24h);
    date.textContent = dateLong(now);
    const s = Math.max(0, Math.ceil((MESSAGE_PREVIEW_MS - (now - started)) / 1000));
    long.textContent = t('ambient.message.preview', { n: s });
    brief.textContent = t('ambient.message.previewShort', { n: s });
  });

  let timer = 0;
  if (view.preview) {
    timer = window.setTimeout(() => {
      previewSpent = true;
      toast(ctx.store, { kind: 'info', text: t('tool.toast.proMessage'), id: 'mode' });
      ctx.store.set({ ui: { mode: 'clock' } });
    }, MESSAGE_PREVIEW_MS);
  }
  return () => {
    off();
    window.clearTimeout(timer);
    delete stage.dataset.scrim;
  };
}
