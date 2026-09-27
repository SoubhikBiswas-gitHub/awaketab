function spy(nav: HTMLElement): void {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]:not([data-tool-mirror])')];
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
  const mark = (index: number): void => {
    links.forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    nav.style.setProperty('--at-i', String(index));
  };
  // A rail click keeps its item current until the reader scrolls by hand: the last sections cannot reach the top.
  let pinned = -1;
  links.forEach((a, i) => {
    a.addEventListener('click', () => {
      pinned = i;
      mark(i);
    });
  });
  for (const type of ['wheel', 'touchmove', 'keydown'])
    addEventListener(
      type,
      () => {
        pinned = -1;
      },
      { passive: true },
    );
  let queued = false;
  const update = (): void => {
    queued = false;
    if (pinned >= 0) return;
    const line = innerHeight * 0.4;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    let index = 0;
    targets.forEach((t, i) => {
      const top = t?.getBoundingClientRect().top;
      if (top !== undefined && top <= (atEnd ? innerHeight - 1 : line)) index = i;
    });
    mark(index);
  };
  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

function mirror(card: HTMLElement): void {
  const pill = document.querySelector<HTMLElement>('#awaketab-tool [data-pill]');
  const text = pill?.querySelector('[data-pill-text]');
  const digits = document.querySelector('#awaketab-tool [data-timer-digits]');
  const outPill = card.querySelector<HTMLElement>('[data-mirror-pill]');
  const outText = card.querySelector('[data-mirror-text]');
  const outDigits = card.querySelector('[data-mirror-digits]');
  if (!pill || !text || !outPill || !outText) return;
  const copy = (): void => {
    outPill.dataset.lock = pill.dataset.lock ?? 'idle';
    outText.textContent = text.textContent;
    if (digits && outDigits) outDigits.textContent = digits.textContent;
  };
  copy();
  const mo = new MutationObserver(copy);
  mo.observe(pill, {
    attributes: true,
    attributeFilter: ['data-lock'],
    childList: true,
    subtree: true,
    characterData: true,
  });
  if (digits) mo.observe(digits, { childList: true, subtree: true, characterData: true });
}

function count(section: Element | null, n: number): void {
  const out = section?.querySelector<HTMLElement>('[data-counter]');
  if (out) out.textContent = (out.dataset.counter ?? '').replace('{n}', String(n));
}

// Checklist (ContentArticle): native checkboxes; the script only keeps the counter true. Ticks are not stored.
function checklist(list: HTMLElement): void {
  const boxes = [...list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const update = (): void => {
    count(list.closest('section'), boxes.filter((b) => b.checked).length);
  };
  for (const box of boxes) box.addEventListener('change', update);
  update();
}

// Tracked steps (GuideGuides): "Mark as done" per step, the next step flagged, the rail line lit up to it, the
// progress list on desktop and the counter beside the heading. Shown only once this runs; progress is not stored.
function steps(list: HTMLElement): void {
  const items = [...list.querySelectorAll<HTMLElement>('[data-step]')];
  const buttons = items.map((li) => li.querySelector<HTMLButtonElement>('.at-done'));
  const section = list.closest<HTMLElement>('section');
  const allDone = section?.querySelector<HTMLElement>('[data-all-done]') ?? null;
  const reset = section?.querySelector<HTMLButtonElement>('[data-reset]') ?? null;
  const nav = document.querySelector<HTMLElement>('[data-progress]');
  const done = items.map(() => false);
  const render = (): void => {
    const n = done.filter(Boolean).length;
    const next = done.indexOf(false);
    items.forEach((li, i) => {
      li.dataset.state = done[i] ? 'done' : i === next ? 'next' : '';
      const next_ = li.querySelector<HTMLElement>('.at-next');
      if (next_) next_.hidden = i !== next;
      const button = buttons[i];
      if (button) {
        button.setAttribute('aria-checked', String(done[i]));
        const label = button.lastElementChild;
        if (label) label.textContent = (done[i] ? button.dataset.on : button.dataset.off) ?? '';
      }
    });
    count(section, n);
    section?.style.setProperty('--at-p', String(n / items.length));
    if (allDone) allDone.hidden = n !== items.length;
    if (reset) reset.hidden = n === 0 || n === items.length;
    if (nav) {
      nav.style.setProperty('--at-p', String(n / items.length));
      const prog = nav.querySelector<HTMLElement>('[data-prog]');
      const total = String(items.length);
      if (prog) {
        const tpl = (n === items.length ? prog.dataset.all : prog.dataset.next) ?? '';
        prog.textContent = tpl
          .replace('{n}', String(n))
          .replace('{total}', total)
          .replace('{next}', String(next + 1));
      }
      nav.querySelectorAll('li').forEach((li, i) => {
        li.dataset.state = done[i] ? 'done' : i === next ? 'next' : '';
        const a = li.querySelector('a');
        if (i === next) a?.setAttribute('aria-current', 'step');
        else a?.removeAttribute('aria-current');
      });
    }
  };
  buttons.forEach((button, i) => {
    if (!button) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      done[i] = !done[i];
      render();
    });
  });
  reset?.addEventListener('click', () => {
    done.fill(false);
    render();
  });
  render();
}

// Code blocks (GuideLearn): Copy puts the block on the clipboard and says "Copied" for 2 s.
function copy(button: HTMLButtonElement): void {
  const lines = button.closest('.at-codeb')?.querySelectorAll('.at-ln > code');
  if (!('clipboard' in navigator) || !lines) return;
  const text = [...lines].map((line) => line.textContent).join('\n');
  button.hidden = false;
  const label = button.querySelector('span');
  const idle = label?.textContent ?? '';
  let timer = 0;
  button.addEventListener('click', () => {
    void navigator.clipboard.writeText(text).then(() => {
      button.dataset.state = 'copied';
      if (label) label.textContent = button.dataset.copied ?? idle;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        delete button.dataset.state;
        if (label) label.textContent = idle;
      }, 2000);
    });
  });
}

export function initContentNav(): void {
  for (const nav of document.querySelectorAll<HTMLElement>('[data-spy]')) spy(nav);
  for (const card of document.querySelectorAll<HTMLElement>('[data-tool-mirror]')) mirror(card);
  for (const list of document.querySelectorAll<HTMLElement>('[data-check]')) checklist(list);
  for (const list of document.querySelectorAll<HTMLElement>('[data-steps]')) steps(list);
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) copy(button);
}
