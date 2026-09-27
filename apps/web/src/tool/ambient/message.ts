import { hasFeature, type IToolCtx } from '../ctx.js';
import { dateLong, hm } from '../format.js';
import { t } from '../i18n.js';
import { sanitizeMsg } from '../params.js';
import { resolveMessage } from './logic.js';
import { el, everySecond } from './tick.js';

export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const pro = hasFeature(ctx, 'ambient.message');
  const view = resolveMessage({
    param: sanitizeMsg(ctx.params.msg),
    saved: sanitizeMsg(ctx.store.get().settings.ambient.message),
    pro,
    sample: t('ambient.message.placeholder'),
  });
  const text = el('p', {
    class: 'at-ambient-message',
    dir: 'auto',
    lang: document.documentElement.lang || 'en',
    'data-message': '',
  });
  text.textContent = view.text || t('ambient.message.empty');
  const time = el('time');
  const date = el('span');
  stage.append(text, el('p', { class: 'at-am-meta' }, time, date));

  if (view.sample) {
    stage.dataset.scrim = '';
    text.setAttribute('aria-hidden', 'true');
    const see = el('a', { class: 'at-am-cta', href: '/pro', 'data-pro-link': '' }, t('pro.see'));
    const back = el(
      'button',
      { type: 'button', class: 'at-am-skip' },
      t('ambient.message.back', { mode: t('ambient.mode.clock') }),
    );
    const card = el(
      'section',
      { class: 'at-pro-card', 'data-message-pro': '', 'aria-labelledby': 'am-pro' },
      el('span', { class: 'at-am-tag' }, t('pro.badge')),
      el('h2', { id: 'am-pro' }, t('tool.toast.proMessage')),
      el('p', {}, t('ambient.message.pro')),
      el('div', {}, see, back),
    );
    see.addEventListener('click', () => {
      ctx.track('pro_view', { from: 'message' });
    });
    back.addEventListener('click', () => {
      ctx.store.set({ ui: { mode: 'clock' } });
    });
    stage.append(card);
    see.focus();
  }

  if (!pro) stage.append(el('p', { class: 'at-am-preview' }, el('span', { class: 'at-am-tag' }, t('pro.badge'))));

  if (pro) {
    const edit = el('button', { type: 'button', class: 'at-am-edit' }, t('ambient.message.edit'));
    const input = el('input', { id: 'am-msg', dir: 'auto', maxlength: '80', autocomplete: 'off' });
    const n = el('span');
    const cancel = el('button', { type: 'button', class: 'at-am-skip' }, t('tool.custom.cancel'));
    const form = el(
      'form',
      { class: 'at-am-msgform', hidden: '' },
      el('label', { for: 'am-msg' }, t('ambient.message.label')),
      input,
      el('div', {}, n, cancel, el('button', { type: 'submit', class: 'at-am-save' }, t('ambient.message.show'))),
    );
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

  const off = everySecond((now) => {
    time.textContent = hm(now, ctx.store.get().settings.ambient.clock24h);
    date.textContent = dateLong(now);
  });

  // A shared link's message runs as the shared five-minute Pro preview (its chip counts down), then Clock returns.
  let gone = false;
  let stop: () => void = () => undefined;
  if (view.preview)
    void import('../packs/themes/preview.js').then((m) => {
      if (gone) return;
      m.startPreview(ctx, {
        kind: 'mode',
        id: 'message',
        label: t('ambient.mode.message'),
        back: t('ambient.mode.clock'),
        apply: () => undefined,
        revert: () => {
          ctx.store.set({ ui: { mode: 'clock' } });
        },
      });
      stop = () => {
        if (m.activePreview()?.id === 'message') m.endPreview(false);
      };
    });
  return () => {
    gone = true;
    off();
    stop();
    delete stage.dataset.scrim;
  };
}
