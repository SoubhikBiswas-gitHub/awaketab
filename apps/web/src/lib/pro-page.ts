import { applyLaunch, fill, trackPro } from './pro-common';

/**
 * /pro (board Pro.dc.html). The lamp preview and the history toggle are CSS on native radios; this script runs what
 * CSS cannot: the plan helper's suggestion, the message and schedule previews, the preview clock, the launch-price
 * switch (O-52) and opt-out-aware analytics (O-43).
 */
export function bootProPage(root: HTMLElement, now = Date.now()): void {
  applyLaunch(root, now);
  bootHelper(root);
  bootMessage(root);
  bootSchedule(root);

  trackPro('pro_view', {}, '/pro');
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-plan]')) {
    link.addEventListener('click', () => {
      trackPro('pro_checkout_click', { plan: link.dataset.plan ?? '' }, '/pro');
    });
  }
}

/** The plan helper: three questions, one honest suggestion (Pro board; GrowthPlanHelper). */
export function suggestPlan(use: string, wants: readonly string[], credit: string, logo: string, pay: string): string {
  if (use === 'site') return credit === 'remove' ? 'embed' : 'embedfree';
  if (use === 'screens') return logo === 'yes' ? 'kiosk' : 'kioskfree';
  if (wants.length === 0 || wants.includes('none')) return 'free';
  return pay === 'year' ? 'yearly' : 'lifetime';
}

function bootHelper(root: HTMLElement): void {
  const helper = root.querySelector<HTMLElement>('[data-helper]');
  if (!helper) return;
  const value = (name: string) => helper.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';
  const wantBoxes = [...helper.querySelectorAll<HTMLInputElement>('input[name="want"]')];

  const update = () => {
    const use = value('use');
    const wants = wantBoxes.filter((box) => box.checked).map((box) => box.value);
    for (const group of helper.querySelectorAll<HTMLElement>('[data-q2]')) group.hidden = group.dataset.q2 !== use;
    const wantsPro = use === 'me' && wants.length > 0 && !wants.includes('none');
    const q3 = helper.querySelector<HTMLElement>('[data-q3]');
    if (q3) q3.hidden = !wantsPro;
    const pick = suggestPlan(use, wants, value('credit'), value('logo'), value('pay'));
    const aside = helper.querySelector<HTMLElement>('[data-result]');
    if (aside) aside.dataset.result = pick;
    for (const body of helper.querySelectorAll<HTMLElement>('[data-res]')) {
      const on = body.dataset.res === pick;
      body.hidden = !on;
      // One heading id for aria-labelledby: whichever suggestion shows.
      const title = body.querySelector<HTMLElement>('[data-res-title]');
      if (title) {
        if (on) title.id = 'res-h';
        else title.removeAttribute('id');
      }
    }
  };

  // "Nothing else" is exclusive; clearing every box falls back to it.
  for (const box of wantBoxes) {
    box.addEventListener('change', () => {
      if (box.value === 'none' && box.checked) {
        for (const other of wantBoxes) if (other !== box) other.checked = false;
      } else if (box.checked) {
        for (const other of wantBoxes) if (other.value === 'none') other.checked = false;
      }
      if (!wantBoxes.some((other) => other.checked)) {
        const none = wantBoxes.find((other) => other.value === 'none');
        if (none) none.checked = true;
      }
      update();
    });
  }
  helper.addEventListener('change', update);
  update();
}

/** Message mode preview: the typed line in big type, sized by length, with a live character count. */
export function messageSize(length: number): 's' | 'm' | 'l' {
  return length <= 20 ? 's' : length <= 44 ? 'm' : 'l';
}

function bootMessage(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-msg-input]');
  const screen = root.querySelector<HTMLElement>('[data-msg-screen]');
  const text = root.querySelector<HTMLElement>('[data-msg-text]');
  const count = root.querySelector<HTMLElement>('[data-msg-count]');
  const clock = root.querySelector<HTMLElement>('[data-msg-clock]');
  if (!input || !screen || !text) return;
  const render = () => {
    const raw = input.value.slice(0, 80);
    const shown = raw.trim() || (text.dataset.emptyText ?? '');
    text.textContent = shown;
    screen.dataset.len = messageSize(shown.length);
    screen.toggleAttribute('data-empty', raw.trim() === '');
    screen.setAttribute('aria-label', fill(screen.dataset.ariaTpl ?? '{text}', { text: shown }));
    if (count) count.textContent = fill(count.dataset.tpl ?? '{n} / 80', { n: raw.length });
  };
  input.addEventListener('input', render);
  render();
  if (clock) {
    const tick = () => {
      clock.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };
    tick();
    setInterval(tick, 15_000);
  }
}

/** "Awake Monday to Friday, …": contiguous runs of three or more read as a range. */
export function scheduleLine(on: readonly boolean[], names: readonly string[], tpl: Record<'none' | 'every' | 'line' | 'on' | 'range' | 'and', string>): string {
  const days = on.map((d, i) => (d ? i : -1)).filter((i) => i >= 0);
  if (days.length === 0) return tpl.none;
  if (days.length === 7) return tpl.every;
  const name = (i: number) => names[i] ?? '';
  const first = days[0] ?? 0;
  const last = days[days.length - 1] ?? 0;
  const contiguous = days.every((d, i) => i === 0 || d === (days[i - 1] ?? -2) + 1);
  let span: string;
  if (days.length === 1) span = fill(tpl.on, { day: name(first) });
  else if (contiguous && days.length > 2) span = fill(tpl.range, { from: name(first), to: name(last) });
  else span = fill(tpl.and, { list: days.slice(0, -1).map(name).join(', '), last: name(last) });
  return fill(tpl.line, { span });
}

function bootSchedule(root: HTMLElement): void {
  const line = root.querySelector<HTMLElement>('[data-sched-line]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-day]')];
  if (!line || buttons.length !== 7) return;
  const d = line.dataset;
  const tpl = { none: d.none ?? '', every: d.every ?? '', line: d.line ?? '', on: d.on ?? '', range: d.range ?? '', and: d.and ?? '' };
  const names = buttons.map((b) => b.dataset.full ?? '');
  const render = () => {
    line.textContent = scheduleLine(
      buttons.map((b) => b.getAttribute('aria-pressed') === 'true'),
      names,
      tpl,
    );
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    });
  }
  render();
}
