import type { IToolCtx } from '../ctx.js';
import { planLabel, remainingOf, when, words } from '../format.js';
import { t } from '../i18n.js';

export function mountBanners(ctx: IToolCtx): () => void {
  const { root, store, engine } = ctx;
  const resume = root.querySelector<HTMLElement>('[data-resume]');
  const second = root.querySelector<HTMLElement>('[data-second-tab]');
  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const on = (sel: string, fn: () => void) => q(sel)?.addEventListener('click', fn);
  on('[data-resume-accept]', () => {
    ctx.track('resume_accepted');
    void engine.resumeSession().then(ctx.syncLock);
    store.set({
      ui: {
        resumeVisible: false,
        mode: store.get().session?.mode ?? store.get().ui.mode,
      },
    });
  });
  on('[data-resume-dismiss]', () => {
    engine.discardResumable();
    store.set({ ui: { resumeVisible: false }, session: engine.session });
  });
  on('[data-tab-use]', () => {
    store.set({ ui: { secondTab: false } });
    ctx.startCurrent();
  });
  on('[data-tab-keep]', () => {
    store.set({ ui: { secondTab: false } });
  });
  return store.subscribe((s) => {
    if (second) second.hidden = !s.ui.secondTab;
    // The stored session to resume: boot's syncLock replaces s.session with the engine's (none yet).
    const session = s.session ?? engine.getResumable();
    if (!resume) return;
    resume.hidden = !s.ui.resumeVisible || !session;
    if (resume.hidden || !session) return;
    const rem = remainingOf(session, Date.now());
    const put = (sel: string, text: string) => {
      const n = q(sel);
      if (n) n.textContent = text;
    };
    const ask = t('tool.resume.body', { label: planLabel(session.presetId, s.eightHour) });
    // A no-limit session has no time left to name, so its question becomes the title.
    put('[data-resume-title]', rem === null ? ask : t('tool.resume.title', { time: words(Math.round(rem / 1000)) }));
    put(
      '[data-resume-until]',
      session.endsAt === null
        ? ''
        : t('tool.resume.until', {
            time: when(session.endsAt, s.settings.ambient.clock24h),
          }),
    );
    put('[data-resume-body]', rem === null ? '' : ask);
  });
}
