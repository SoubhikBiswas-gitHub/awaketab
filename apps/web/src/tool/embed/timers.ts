import { addCookTimer, COOK_FLASH_MS, COOK_MAX_TIMERS, settleCookTimers, type ICookTimer } from '../ambient/logic.js';
import { el, everySecond } from '../ambient/tick.js';
import { formatHms } from '../format.js';
import { t } from '../i18n.js';

/** Quick-add durations in the widget (a subset of the app's cook mode; no free-text names in an embed). */
export const EMBED_QUICK_MIN = [5, 10, 15, 30, 60] as const;

export interface ITimerDeps {
  read(): ICookTimer[];
  write(list: ICookTimer[]): void;
  /** Starts an indefinite session when none is live, so the screen stays awake while timers run. */
  ensureSession(): Promise<void>;
  onFinished(timer: ICookTimer): void;
  announce(text: string): void;
  now?: () => number;
  id?: () => string;
}

/**
 * Up to three kitchen timers inside the `full` widget (docs/11 §2) — the same `ICookTimer` data and limits as
 * the app's cook mode (docs/00 §13.8), persisted in `at.v1.embed.settings` instead of the session.
 */
export function mountTimers(section: HTMLElement, deps: ITimerDeps): () => void {
  const list = section.querySelector<HTMLElement>('[data-embed-timer-list]');
  const quick = section.querySelector<HTMLElement>('[data-embed-quick]');
  if (!list || !quick) return () => undefined;
  const now = deps.now ?? Date.now;
  const newId = deps.id ?? (() => crypto.randomUUID().slice(0, 8));
  let timers = deps.read();
  const flashes = new Map<string, number>();
  const rows = new Map<string, { row: HTMLElement; left: HTMLElement }>();

  for (const min of EMBED_QUICK_MIN) {
    const btn = el('button', { type: 'button', class: 'at-embed-btn', 'data-embed-add': String(min) }, t('stats.minutes', { minutes: min }));
    btn.setAttribute('aria-label', t('embed.timers.addLabel', { minutes: min }));
    quick.append(btn);
  }

  const render = (at: number) => {
    quick.hidden = timers.length >= COOK_MAX_TIMERS;
    const ids = new Set(timers.map((x) => x.id));
    for (const [id, view] of rows) {
      if (!ids.has(id)) {
        view.row.remove();
        rows.delete(id);
      }
    }
    for (const timer of timers) {
      let view = rows.get(timer.id);
      if (!view) {
        const row = el('li', { class: 'at-embed-timer', 'data-embed-timer': timer.id });
        const left = el('span', { class: 'at-embed-timer-left' });
        const remove = el('button', { type: 'button', class: 'at-embed-btn', 'data-embed-remove': timer.id }, '×');
        remove.setAttribute('aria-label', t('ambient.cook.timer.removeNamed', { name: timer.name }));
        row.append(el('span', { class: 'at-embed-timer-name' }, timer.name), left, remove);
        list.append(row);
        view = { row, left };
        rows.set(timer.id, view);
      }
      view.row.toggleAttribute('data-flash', (flashes.get(timer.id) ?? 0) > at);
      view.row.toggleAttribute('data-done', timer.doneAt !== null);
      view.left.textContent = timer.doneAt === null ? formatHms(timer.endsAt - at) : t('ambient.cook.timer.done');
    }
  };

  const tick = (at: number) => {
    const settled = settleCookTimers(timers, at);
    if (settled.finished.length > 0) {
      timers = settled.list;
      deps.write(timers);
      for (const done of settled.finished) {
        flashes.set(done.id, at + COOK_FLASH_MS);
        deps.onFinished(done);
        deps.announce(t('ambient.cook.timer.notify', { name: done.name }));
      }
    }
    render(at);
  };

  quick.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-embed-add]');
    if (!btn) return;
    const at = now();
    const next = addCookTimer(timers, {
      name: t('ambient.cook.timer.default', { n: timers.length + 1 }),
      ms: Number(btn.dataset.embedAdd) * 60_000,
      now: at,
      id: newId(),
    });
    if (!next) {
      deps.announce(t('ambient.cook.timer.invalid'));
      return;
    }
    timers = next;
    deps.write(timers);
    void deps.ensureSession();
    render(at);
  });
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-embed-remove]');
    if (!btn) return;
    timers = timers.filter((x) => x.id !== btn.dataset.embedRemove);
    flashes.delete(btn.dataset.embedRemove ?? '');
    deps.write(timers);
    render(now());
  });

  section.hidden = false;
  return everySecond(tick);
}
