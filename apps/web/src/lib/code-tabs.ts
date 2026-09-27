export function bindCodeTabs(root: HTMLElement, win: Window = window): void {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const other of tabs) {
      const on = other === tab;
      other.setAttribute('aria-selected', on ? 'true' : 'false');
      other.tabIndex = on ? 0 : -1;
      const panel = root.querySelector<HTMLElement>(`#${other.getAttribute('aria-controls') ?? ''}`);
      if (panel) panel.hidden = !on;
      const note = root.querySelector<HTMLElement>(`[data-tab-note="${other.dataset.tab ?? ''}"]`);
      if (note) note.hidden = !on;
    }
    if (focus) tab.focus();
  };
  for (const [i, tab] of tabs.entries()) {
    tab.addEventListener('click', () => {
      select(tab);
    });
    tab.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      const rtl =
        win.getComputedStyle(tab).direction === 'rtl' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') ? -1 : 1;
      let next: number | null = null;
      if (e.key in step) next = (i + (step[e.key] ?? 0) * rtl + n) % n;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = n - 1;
      const target = next === null ? undefined : tabs[next];
      if (!target) return;
      e.preventDefault();
      select(target, true);
    });
  }
  const timers = new WeakMap<HTMLElement, number>();
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-copy-code]')) {
    button.addEventListener('click', () => {
      const panel = button.closest<HTMLElement>('[role="tabpanel"]');
      const code = panel?.querySelector<HTMLElement>('[data-code]')?.dataset.code ?? '';
      const status = panel?.querySelector<HTMLElement>('[role="status"]');
      void win.navigator.clipboard.writeText(code).then(() => {
        if (!status) return;
        status.textContent = 'Copied';
        win.clearTimeout(timers.get(status));
        timers.set(
          status,
          win.setTimeout(() => {
            status.textContent = '';
          }, 2000),
        );
      });
    });
  }
}
