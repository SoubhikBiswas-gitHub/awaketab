import { formatHms, idleTimerText, remainingOf } from '../format.js';
import { t } from '../i18n.js';
import type { IStore } from '../store.js';

const RUNNING = new Set(['held', 'fallback']);

export function mountTimer(root: HTMLElement, store: IStore): () => void {
  const digits = root.querySelector<HTMLElement>('[data-timer-digits]');
  const caption = root.querySelector<HTMLElement>('[data-timer-caption]');
  const live = root.querySelector<HTMLElement>('[data-timer-live]');
  if (!digits) return () => undefined;
  let lastAnnounce = -1;

  const paint = () => {
    const s = store.get();
    const now = Date.now();
    const lock = s.lock;
    const running = RUNNING.has(lock);
    root.hidden = lock === 'denied' || lock === 'unsupported';
    const session = s.session;
    if (!session || session.status === 'inactive') {
      digits.textContent = idleTimerText(s.selectedPreset, s.settings.lastCustomMs, s.eightHour);
      digits.classList.add('is-muted');
      if (caption) caption.textContent = '';
      return;
    }
    if (session.status === 'completed') {
      digits.textContent = '00:00:00';
      digits.classList.remove('is-muted');
      if (caption) caption.textContent = t('tool.timer.complete');
      if (live) live.textContent = t('tool.timer.complete');
      return;
    }
    const rem = remainingOf(session, now);
    const elapsed = now - session.startedAt - session.pausedMs;
    if (session.plan.type === 'indefinite') {
      digits.textContent = running ? formatHms(Math.max(0, elapsed)) : idleTimerText('pinf', 0, false);
      digits.classList.toggle('is-muted', !running);
      if (caption) caption.textContent = running ? t('tool.timer.elapsedCaption') : '';
      const mins = Math.floor(elapsed / 60_000);
      if (live && running && mins > 0 && mins % 5 === 0 && mins !== lastAnnounce) {
        lastAnnounce = mins;
        live.textContent = t('tool.timer.announceElapsed', { minutes: mins });
      }
      return;
    }
    const show = rem ?? 0;
    const frozen = !running;
    digits.textContent = formatHms(frozen && s.remainingMs !== null ? s.remainingMs : show);
    digits.classList.toggle('is-muted', frozen);
    if (caption) {
      caption.textContent = session.status === 'paused' ? t('tool.timer.paused') : t('tool.timer.remaining', { time: formatHms(show) });
    }
    const minsLeft = Math.floor(show / 60_000);
    if (live && running) {
      if (show <= 60_000 && show > 0 && lastAnnounce !== 0) {
        lastAnnounce = 0;
        live.textContent = t('tool.timer.announce', { minutes: 1 });
      } else if (minsLeft > 0 && minsLeft % 5 === 0 && minsLeft !== lastAnnounce) {
        lastAnnounce = minsLeft;
        live.textContent = t('tool.timer.announce', { minutes: minsLeft });
      }
    }
  };

  const unsub = store.subscribe(paint);
  const id = window.setInterval(paint, 250);
  return () => {
    unsub();
    window.clearInterval(id);
  };
}
