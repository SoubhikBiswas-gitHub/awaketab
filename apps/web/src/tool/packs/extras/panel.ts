import type { ISettings } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import type * as TPreviewMod from '../themes/preview.js';
import { dateLong, dayDiff, dtf, hm } from '../../format.js';
import { t } from '../../i18n.js';
import { liveSession, plannedSec } from '../../ui/view.js';
import { breathOf } from './breathe.js';
import { mountLines } from './lines.js';
import { autoOn, autoPreviewing, cleanIntention, el, INTENTION_MAX, isPro, save, setAutoPreview } from './common.js';
import { autoCycleSaved, focusConfig, FOCUS_LIMITS, type IFocusConfig } from './pomodoro.js';
import { allZones, cityOf, diffMin, diffText, regionOf, searchZones, validZone, zoneName, zoneTime } from './zones.js';

type TPreview = typeof TPreviewMod;

const STEPS: ReadonlyArray<keyof IFocusConfig> = ['workMin', 'breakMin', 'cycles', 'longMin'];

function stepper(key: keyof IFocusConfig): HTMLElement {
  const less = el(
    'button',
    { type: 'button', class: 'at-icon-button at-fx-stepbtn', 'data-fx-step': key, 'data-d': '-1' },
    '−',
  );
  const more = el(
    'button',
    { type: 'button', class: 'at-icon-button at-fx-stepbtn', 'data-fx-step': key, 'data-d': '1' },
    '+',
  );
  less.setAttribute('aria-label', t(`settings.focus.${key}.less`));
  more.setAttribute('aria-label', t(`settings.focus.${key}.more`));
  const out = el('output', { class: 'at-fx-stepval at-tabnum', 'data-fx-val': key, 'aria-live': 'polite' });
  return el(
    'div',
    { class: 'at-fx-step' },
    el('span', { class: 'at-fx-stepname' }, t(`settings.focus.${key}`)),
    less,
    out,
    more,
  );
}

// Settings → Focus (docs/05 §3.18, §3.35): the Pomodoro timer, breathing and the intention in `[data-focus-tools]`, the
// second time zone in Clock's `[data-fx-zone]`, and the Focus and Clock group lines. Built once, refreshed on every open.
export function mountPanel(ctx: IToolCtx, form: HTMLElement): void {
  const box = form.querySelector<HTMLElement>('.at-fx-set') ?? build(ctx, form);
  (box as HTMLElement & { refresh?: () => void }).refresh?.();
}

function build(ctx: IToolCtx, form: HTMLElement): HTMLElement {
  const { store } = ctx;
  const host = form.querySelector<HTMLElement>('[data-focus-tools]') ?? form;
  const line = form.querySelector('[data-sg-now="focus"]');
  const zoneLine = form.querySelector('[data-sg-zone]');
  const box = el('div', { class: 'at-fx-set' });
  const settings = () => store.get().settings;

  const aimIn = el('input', {
    id: 'st-intent',
    class: 'at-input',
    type: 'text',
    maxlength: String(INTENTION_MAX),
    autocomplete: 'off',
    placeholder: t('tool.intention.placeholder'),
    'aria-describedby': 'st-intent-help',
  });
  const aimClear = el(
    'button',
    { type: 'button', class: 'at-button at-button-quiet at-button-sm' },
    t('tool.intention.clear'),
  );
  const aim = el(
    'div',
    { class: 'at-field' },
    el('label', { class: 'at-label', for: 'st-intent' }, t('tool.intention.label')),
    el('div', { class: 'at-fx-inrow' }, aimIn, aimClear),
    el('span', { class: 'at-caption', id: 'st-intent-help' }, t('settings.focus.intentionHelp')),
  );

  const now = el('div', { class: 'at-fx-now', 'data-fx-zone-now': '' });
  const nowText = el('span', { class: 'at-fx-nowtext' });
  const drop = el(
    'button',
    { type: 'button', class: 'at-button at-button-quiet at-button-sm' },
    t('settings.focus.zoneRemove'),
  );
  now.append(nowText, drop);
  const zoneIn = el('input', {
    id: 'st-zone',
    class: 'at-input',
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-expanded': 'false',
    'aria-controls': 'st-zone-list',
    'aria-autocomplete': 'list',
    'aria-describedby': 'st-zone-help',
    placeholder: t('settings.focus.zoneSearch'),
  });
  const list = el('ul', {
    id: 'st-zone-list',
    class: 'at-fx-list',
    role: 'listbox',
    'aria-label': t('settings.focus.zone'),
  });
  list.hidden = true;
  const count = el('span', { class: 'sr-only', role: 'status' });
  const zone = el(
    'div',
    { class: 'at-field' },
    el('label', { class: 'at-label', for: 'st-zone' }, t('settings.focus.zone')),
    now,
    el('div', { class: 'at-fx-combo' }, zoneIn, list),
    count,
    el('span', { class: 'at-caption', id: 'st-zone-help' }, t('settings.focus.zoneHelp')),
  );

  const steps = el('div', { class: 'at-fx-steps', role: 'group', 'aria-labelledby': 'st-fx-timer' });
  steps.append(el('span', { class: 'at-label', id: 'st-fx-timer' }, t('settings.focus.timer')), ...STEPS.map(stepper));

  const autoSw = el('input', {
    class: 'at-switch',
    type: 'checkbox',
    role: 'switch',
    'aria-describedby': 'st-fx-auto-cap',
  });
  const autoTag = el('span', { class: 'at-tag' }, t('pro.badge'));
  const autoCap = el('span', { class: 'at-caption', id: 'st-fx-auto-cap' });
  const auto = el(
    'label',
    { class: 'at-switchrow' },
    el(
      'span',
      { class: 'at-switch-text' },
      el('span', { class: 'at-label at-fx-labelrow' }, t('settings.focus.auto'), autoTag),
      autoCap,
    ),
    autoSw,
  );

  const breath = el('div', { class: 'at-seg at-sseg at-fx-breath', role: 'group', 'aria-labelledby': 'st-fx-breath' });
  breath.append(el('span', { class: 'at-seg-ind', 'aria-hidden': 'true' }));
  for (const id of ['478', 'box'] as const)
    breath.append(
      el('button', { type: 'button', class: 'at-seg-item', 'data-fx-breath': id }, t(`ambient.breathe.${id}`)),
    );
  const breathe = el(
    'div',
    { class: 'at-field' },
    el('span', { class: 'at-label', id: 'st-fx-breath' }, t('settings.focus.breathe')),
    breath,
    el('span', { class: 'at-caption' }, t('settings.focus.breatheHelp')),
  );

  box.append(steps, auto, breathe, aim);
  (form.querySelector('[data-fx-zone]') ?? box).append(zone);
  host.append(box);
  // The lines under the clock follow whatever is typed here.
  mountLines(ctx);

  let preview: TPreview | undefined;
  const shows = form.querySelector('[data-t="nowShows"]');
  const endLine = form.querySelector('[data-sg-end]');
  // Timer's first fragment: when the running session, or the chosen length started now, would end.
  const ends = (at: number, c24: boolean | null): string => {
    const st = store.get();
    const live = liveSession(st);
    const sec = live ? 0 : plannedSec(st, ctx.params.routeUntil, at);
    const end = live ? live.endsAt : sec ? at + sec * 1000 : null;
    if (end === null) return t('settings.sum.untilStop');
    const ms = Math.round(end / 60_000) * 60_000;
    const d = dayDiff(ms, at);
    const time = hm(ms, c24);
    if (d < 1) return t('settings.sum.ends', { time });
    return d === 1
      ? t('settings.sum.endsTomorrow', { time })
      : t('settings.sum.endsDay', { day: dtf({ weekday: 'long' }).format(ms), time });
  };
  const paintNow = () => {
    const s = settings();
    const z = validZone(s.worldClock) ? s.worldClock : null;
    now.hidden = !z;
    const at = Date.now();
    const c24 = s.ambient.clock24h;
    if (shows)
      shows.textContent = t('settings.clock.now', {
        time: `${dateLong(at)} · ${hm(at, c24, s.ambient.showSeconds)}`,
      });
    if (endLine) endLine.textContent = `${ends(at, c24)} · `;
    if (zoneLine) zoneLine.textContent = z ? ` · ${cityOf(z)} ${diffText(diffMin(z, at))}` : '';
    if (z) {
      nowText.textContent = t('settings.focus.zoneNow', {
        city: cityOf(z),
        time: zoneTime(z, at, s.ambient.clock24h),
        diff: diffText(diffMin(z, at)),
      });
    }
  };

  const refresh = () => {
    const s = settings();
    if (document.activeElement !== aimIn) aimIn.value = cleanIntention(s.intention);
    aimClear.hidden = !cleanIntention(s.intention);
    paintNow();
    const c = focusConfig(s);
    for (const key of STEPS) {
      const out = steps.querySelector(`[data-fx-val="${key}"]`);
      const v = c[key];
      if (out) out.textContent = key === 'cycles' ? String(v) : t('tool.len.min', { m: v });
      const [lo, hi] = FOCUS_LIMITS[key];
      for (const b of steps.querySelectorAll<HTMLButtonElement>(`[data-fx-step="${key}"]`))
        b.disabled = b.dataset.d === '1' ? v >= hi : v <= lo;
    }
    const pro = isPro(ctx);
    autoTag.hidden = pro;
    autoSw.checked = autoOn(ctx);
    if (line)
      line.textContent = `${t('settings.sum.focus', { work: c.workMin, rest: c.breakMin, cycles: c.cycles, long: c.longMin })} · ${t(autoSw.checked ? 'settings.sum.autoOn' : 'settings.sum.autoOff')}`;
    const live = autoPreviewing() && preview?.activePreview()?.kind === 'pomodoro';
    autoCap.textContent = live
      ? (preview?.previewLine() ?? '')
      : t(pro ? 'settings.focus.autoHelp' : 'settings.focus.autoHelpFree');
    const b = breathOf(s);
    breath.style.setProperty('--at-seg-n', '2');
    breath.style.setProperty('--at-seg-i', b === 'box' ? '1' : '0');
    for (const x of breath.querySelectorAll<HTMLElement>('[data-fx-breath]'))
      x.setAttribute('aria-pressed', String(x.dataset.fxBreath === b));
  };
  // The clock lines tick once a second while the sheet is open, and stop when it closes.
  let clock = 0;
  (box as HTMLElement & { refresh?: () => void }).refresh = () => {
    refresh();
    clock ||= window.setInterval(() => {
      if (host.closest('dialog')?.open) paintNow();
      else {
        window.clearInterval(clock);
        clock = 0;
      }
    }, 1000);
  };

  aimIn.addEventListener('input', () => {
    save(ctx, { intention: cleanIntention(aimIn.value) });
    aimClear.hidden = !aimIn.value.trim();
  });
  aimIn.addEventListener('change', () => {
    aimIn.value = cleanIntention(aimIn.value);
  });
  aimClear.addEventListener('click', () => {
    aimIn.value = '';
    save(ctx, { intention: '' });
    aimIn.focus();
  });

  // The zone picker: a combobox over Intl's own zone list (docs/05 §3.35).
  let zones: string[] | undefined;
  let hits: string[] = [];
  let active = -1;
  const setActive = (i: number) => {
    active = i;
    const opts = list.querySelectorAll<HTMLElement>('[role="option"]');
    opts.forEach((o, n) => {
      o.setAttribute('aria-selected', String(n === i));
    });
    const cur = opts[i];
    if (cur) {
      zoneIn.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    } else zoneIn.removeAttribute('aria-activedescendant');
  };
  const openList = (open: boolean) => {
    list.hidden = !open;
    zoneIn.setAttribute('aria-expanded', String(open));
    if (!open) setActive(-1);
  };
  const search = () => {
    zones ??= allZones();
    hits = searchZones(zones, zoneIn.value);
    const at = Date.now();
    const c24 = settings().ambient.clock24h;
    list.replaceChildren(
      ...hits.map((z, i) => {
        const sub = [zoneName(z), regionOf(z)].filter(Boolean).join(' · ');
        return el(
          'li',
          { id: `st-zone-o${String(i)}`, role: 'option', 'aria-selected': 'false', 'data-zone': z, class: 'at-fx-opt' },
          el('span', { class: 'at-fx-optmain' }, el('b', {}, cityOf(z)), el('span', { class: 'at-fx-optsub' }, sub)),
          el('span', { class: 'at-fx-opttime at-tabnum' }, `${zoneTime(z, at, c24)} · ${diffText(diffMin(z, at))}`),
        );
      }),
    );
    count.textContent = hits.length ? t('settings.focus.zoneCount', { n: hits.length }) : t('settings.focus.zoneNone');
    openList(true);
    if (!hits.length)
      list.append(el('li', { class: 'at-fx-empty', role: 'presentation' }, t('settings.focus.zoneNone')));
  };
  const choose = (z: string | undefined) => {
    if (!z || !validZone(z)) return;
    save(ctx, { worldClock: z });
    zoneIn.value = '';
    openList(false);
    count.textContent = t('settings.focus.zoneSet', { city: cityOf(z) });
    paintNow();
  };
  zoneIn.addEventListener('input', search);
  zoneIn.addEventListener('focus', () => {
    if (zoneIn.value) search();
  });
  // A tap on the empty field offers a short list of common zones.
  zoneIn.addEventListener('click', () => {
    if (list.hidden) search();
  });
  zoneIn.addEventListener('keydown', (e) => {
    const open = !list.hidden;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) search();
      const n = hits.length;
      if (n) setActive(e.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open) choose(hits[active < 0 ? 0 : active]);
    } else if (e.key === 'Escape' && open) {
      // Esc closes the list first; the sheet stays open.
      e.preventDefault();
      e.stopPropagation();
      openList(false);
    }
  });
  zoneIn.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (document.activeElement !== zoneIn) openList(false);
    }, 150);
  });
  list.addEventListener('pointerdown', (e) => {
    e.preventDefault();
  });
  list.addEventListener('click', (e) => {
    choose((e.target as Element).closest<HTMLElement>('[data-zone]')?.dataset.zone);
    zoneIn.focus();
  });
  drop.addEventListener('click', () => {
    save(ctx, { worldClock: null });
    count.textContent = t('settings.focus.zoneRemoved');
    paintNow();
    zoneIn.focus();
  });

  steps.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-fx-step]');
    const key = b?.dataset.fxStep as keyof IFocusConfig | undefined;
    if (!b || !key) return;
    const [lo, hi, step] = FOCUS_LIMITS[key];
    const s = settings();
    const c = focusConfig(s);
    const v = Math.min(hi, Math.max(lo, c[key] + Number(b.dataset.d) * step));
    const pomodoro: ISettings['pomodoro'] = { autoCycle: autoCycleSaved(s), longBreakMin: c.longMin };
    const focus = { workMin: c.workMin, breakMin: c.breakMin, cycles: c.cycles };
    if (key === 'longMin') pomodoro.longBreakMin = v;
    else focus[key] = v;
    save(ctx, { ambient: { ...s.ambient, focus }, pomodoro });
    refresh();
  });

  autoSw.addEventListener('change', () => {
    const on = autoSw.checked;
    const s = settings();
    const longBreakMin = focusConfig(s).longMin;
    if (isPro(ctx)) {
      save(ctx, { pomodoro: { autoCycle: on, longBreakMin } });
      refresh();
      return;
    }
    // Without Pro the switch runs the shared five-minute preview; nothing is stored.
    void import('../themes/preview.js').then((m) => {
      if (!preview) {
        preview = m;
        m.onPreview(refresh);
      }
      if (!on) {
        if (m.activePreview()?.kind === 'pomodoro') m.endPreview(true, 'user');
        refresh();
        return;
      }
      m.startPreview(ctx, {
        kind: 'pomodoro',
        id: 'auto',
        label: t('settings.focus.autoName'),
        apply: () => {
          setAutoPreview(true);
        },
        revert: () => {
          setAutoPreview(false);
          refresh();
        },
      });
      refresh();
    });
  });

  breath.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-fx-breath]');
    if (!b) return;
    save(ctx, { breathe: b.dataset.fxBreath === 'box' ? 'box' : '478' });
    refresh();
  });

  store.subscribe(() => {
    if (host.closest('dialog')?.open) refresh();
  });
  return box;
}
