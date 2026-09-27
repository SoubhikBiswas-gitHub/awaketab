function spy(nav: HTMLElement): void {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
  const mark = (index: number): void => {
    links.forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    nav.style.setProperty('--at-i', String(index));
  };
  links.forEach((a, i) => {
    a.addEventListener('click', () => {
      mark(i);
    });
  });
  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      const index = targets.findIndex((t) => t !== null && visible.has(t));
      if (index >= 0) mark(index);
    },
    { rootMargin: '0px 0px -60% 0px' },
  );
  for (const target of targets) if (target) io.observe(target);
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
  mo.observe(pill, { attributes: true, attributeFilter: ['data-lock'], childList: true, subtree: true, characterData: true });
  if (digits) mo.observe(digits, { childList: true, subtree: true, characterData: true });
}

export function initContentNav(): void {
  for (const nav of document.querySelectorAll<HTMLElement>('[data-spy]')) spy(nav);
  for (const card of document.querySelectorAll<HTMLElement>('[data-tool-mirror]')) mirror(card);
}
