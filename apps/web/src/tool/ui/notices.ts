import type { TAdviceCode } from '@awaketab/wake';
import { t } from '../i18n.js';

const GUIDE: Record<TAdviceCode, string> = {
  battery_saver: '/guides',
  low_power_ios: '/on',
  hidden_document: '/learn',
  permissions_policy: '/learn',
  insecure_context: '/learn',
  unsupported_browser: '/learn',
  ios_safari_old: '/on',
  firefox_old: '/on',
  iframe_no_allow: '/about',
};

const noticeHandlers = new WeakMap<HTMLElement, { onRetry: () => void; onFallback: () => void }>();

export function bindNotice(
  root: HTMLElement,
  opts: { advice: TAdviceCode | null; unsupported: boolean; onRetry: () => void; onFallback: () => void },
): void {
  noticeHandlers.set(root, { onRetry: opts.onRetry, onFallback: opts.onFallback });
  const title = root.querySelector('[data-notice-title]');
  const body = root.querySelector('[data-notice-body]');
  const learn = root.querySelector<HTMLAnchorElement>('[data-notice-learn]');
  const retry = root.querySelector<HTMLButtonElement>('[data-notice-retry]');
  const fallback = root.querySelector<HTMLButtonElement>('[data-notice-fallback]');
  if (title) title.textContent = opts.unsupported ? t('tool.fallback.consent.title') : t('tool.pill.denied');
  if (body) {
    body.textContent = opts.advice ? t(`tool.advice.${opts.advice}`) : t('tool.fallback.consent.body');
  }
  if (learn && opts.advice) learn.href = GUIDE[opts.advice];
  if (fallback) fallback.hidden = !opts.unsupported;
  if (root.dataset.bound === '1') return;
  root.dataset.bound = '1';
  retry?.addEventListener('click', () => {
    noticeHandlers.get(root)?.onRetry();
  });
  fallback?.addEventListener('click', () => {
    noticeHandlers.get(root)?.onFallback();
  });
}

export function bindExtend(
  dialog: HTMLDialogElement,
  opts: {
    onAdd: (ms: number) => void;
    onStop: () => void;
    graceMs: number;
  },
): () => void {
  const auto = dialog.querySelector<HTMLElement>('[data-extend-auto]');
  const started = Date.now();
  const tick = () => {
    const left = Math.max(0, Math.ceil((opts.graceMs - (Date.now() - started)) / 1000));
    if (auto) auto.textContent = t('tool.extend.auto', { seconds: left });
    if (left <= 0) {
      dialog.close();
      opts.onStop();
    }
  };
  const id = window.setInterval(tick, 250);
  tick();
  dialog.querySelector('[data-extend-15]')?.addEventListener('click', () => {
    dialog.close();
    opts.onAdd(15 * 60_000);
  });
  dialog.querySelector('[data-extend-30]')?.addEventListener('click', () => {
    dialog.close();
    opts.onAdd(30 * 60_000);
  });
  dialog.querySelector('[data-extend-60]')?.addEventListener('click', () => {
    dialog.close();
    opts.onAdd(60 * 60_000);
  });
  const stopBtn = dialog.querySelector<HTMLButtonElement>('[data-extend-stop]');
  stopBtn?.addEventListener('click', () => {
    dialog.close();
    opts.onStop();
  });
  dialog.addEventListener(
    'close',
    () => {
      window.clearInterval(id);
    },
    { once: true },
  );
  queueMicrotask(() => stopBtn?.focus());
  return () => {
    window.clearInterval(id);
  };
}
