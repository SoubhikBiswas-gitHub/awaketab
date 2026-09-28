import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { cleanIntention, el, INTENTION_MAX, save, sheet } from './common.js';
import { cityOf, diffMin, diffText, diffWords, validZone, zoneTime } from './zones.js';

const AIM =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
const GLOBE =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5z"/></svg>';

interface ILines {
  edit: () => void;
}

let api: ILines | undefined;

// The intention and the second time zone under the clock (docs/05 §3.35). From 1024 px they float in the face
// column under the dial, elsewhere they close the note column, so neither moves the pill, the face or the dock.
export function mountLines(ctx: IToolCtx): ILines | undefined {
  if (api) return api;
  const { root, store } = ctx;
  const cell = root.querySelector<HTMLElement>('.at-face-cell');
  const note = root.querySelector<HTMLElement>('.at-tool > .at-note');
  if (!cell || !note || root.classList.contains('at-tool-embed')) return undefined;
  void sheet();

  const box = el('div', { class: 'at-lines', 'data-lines': '' });
  const show = el('button', { type: 'button', class: 'at-intent', 'data-intent-edit': '' });
  show.innerHTML = AIM;
  const showText = el('span', { class: 'at-intent-text' });
  show.append(showText);
  const form = el('form', { class: 'at-intent-form', 'data-intent-form': '' });
  const input = el('input', {
    class: 'at-input at-intent-input',
    type: 'text',
    maxlength: String(INTENTION_MAX),
    autocomplete: 'off',
    enterkeyhint: 'done',
    'aria-label': t('tool.intention.label'),
    placeholder: t('tool.intention.placeholder'),
  });
  const done = el(
    'button',
    { type: 'submit', class: 'at-button at-button-secondary at-button-sm' },
    t('tool.intention.save'),
  );
  const clear = el(
    'button',
    { type: 'button', class: 'at-button at-button-quiet at-button-sm', 'data-intent-clear': '' },
    t('tool.intention.clear'),
  );
  const left = el('span', { class: 'at-caption at-intent-left', 'aria-live': 'polite' });
  form.append(input, done, clear, left);
  const world = el('p', { class: 'at-world', 'data-world': '' });
  world.innerHTML = GLOBE;
  const city = el('span', { class: 'at-world-city' });
  const time = el('span', { class: 'at-world-time' });
  const diff = el('span', { class: 'at-world-diff', 'aria-hidden': 'true' });
  const worldSaid = el('span', { class: 'sr-only' });
  world.append(city, time, diff, worldSaid);
  const said = el('p', { class: 'sr-only', role: 'status' });
  box.append(show, form, world, said);
  box.hidden = true;

  const wide = matchMedia('(width >= 1024px) and (height > 500px)');
  const place = () => {
    const host = wide.matches ? cell : note;
    box.classList.toggle('is-float', wide.matches);
    if (box.parentElement !== host) host.append(box);
  };
  place();
  wide.addEventListener('change', place);

  let editing = false;
  const pill = root.querySelector<HTMLElement>('[data-pill]');

  const paint = () => {
    const s = store.get().settings;
    const aim = cleanIntention(s.intention);
    const zone = validZone(s.worldClock) ? s.worldClock : null;
    if (pill) {
      const tip = aim ? t('tool.intention.tip', { text: aim }) : '';
      if (pill.title !== tip) pill.title = tip;
    }
    show.hidden = editing || !aim;
    form.hidden = !editing;
    clear.hidden = !aim;
    if (showText.textContent !== aim) showText.textContent = aim;
    show.setAttribute('aria-label', t('tool.intention.edit', { text: aim }));
    world.hidden = !zone;
    if (zone) {
      const now = Date.now();
      const d = diffMin(zone, now);
      const c = cityOf(zone);
      const at = zoneTime(zone, now, s.ambient.clock24h);
      city.textContent = c;
      time.textContent = at;
      diff.textContent = diffText(d);
      worldSaid.textContent = `, ${diffWords(d)}`;
    }
    const on = editing || !!aim || !!zone;
    if (on && box.hidden) box.dataset.rise = '';
    box.hidden = !on;
  };

  const close = (keep: boolean) => {
    if (!editing) return;
    editing = false;
    if (keep) {
      const next = cleanIntention(input.value);
      if (next !== cleanIntention(store.get().settings.intention)) {
        save(ctx, { intention: next });
        said.textContent = next ? t('tool.intention.saved', { text: next }) : t('tool.intention.cleared');
      }
    }
    paint();
    if (!show.hidden) show.focus();
  };

  const edit = () => {
    editing = true;
    input.value = cleanIntention(store.get().settings.intention);
    paint();
    left.textContent = '';
    input.focus();
    input.select();
  };

  show.addEventListener('click', edit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    close(true);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    close(true);
  });
  input.addEventListener('input', () => {
    const n = INTENTION_MAX - Array.from(input.value).length;
    left.textContent = n <= 20 ? t('tool.intention.left', { n: Math.max(0, n) }) : '';
  });
  input.addEventListener('keydown', (e) => {
    // Esc belongs to the field: it cancels the edit and never reaches the tool's "Esc stops the session".
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(false);
    }
  });
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget as Node | null)) close(true);
  });

  store.subscribe(paint);
  // The second zone's time changes on the minute, whatever this page is doing.
  const minute = () => {
    paint();
    window.setTimeout(minute, 60_000 - (Date.now() % 60_000) + 50);
  };
  void sheet().then(minute);

  api = {
    edit: () => {
      if (store.get().ui.mode !== 'standard') store.set({ ui: { mode: 'standard' } });
      edit();
    },
  };
  return api;
}
