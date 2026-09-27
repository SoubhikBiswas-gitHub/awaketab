(() => {
  // Inlined in <head> by BaseLayout (docs/05 §11), minified by scripts/boot-inline.mjs, and allowed by a CSP sha256
  // hash that scripts/headers.mjs computes from that text. Keep it small, dependency-free and free of "</script".
  // It is the page's only inline script, so it also runs the shared shell (docs/05 §3.25–§3.27): the header theme
  // switch and the footer language switcher work on every page, with or without the tool island.
  const root = document.documentElement;
  // Geist Mono waits until after the first paint (tokens.css maps it to its metric-matched fallback until then).
  root.dataset.fontHold = '';
  const KEY = 'at.v1.settings';
  const dark = matchMedia('(prefers-color-scheme: dark)');
  /** @type {Record<string, string>} */
  const GROUND = { light: '#F2F6FA', dark: '#0A0E16', oled: '#000000' };
  /** @param {string} theme */
  const apply = (theme) => {
    const resolved = theme === 'auto' ? (dark.matches ? 'dark' : 'light') : theme;
    root.dataset.theme = resolved;
    root.dataset.themePref = theme;
    root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', GROUND[resolved] ?? '');
  };
  let theme = 'auto';
  try {
    const allowed = ['auto', 'light', 'dark', 'oled'];
    const q = new URLSearchParams(location.search).get('theme');
    const raw = localStorage.getItem(KEY);
    /** @type {{ theme?: unknown; accent?: unknown; face?: unknown; keyboardHints?: unknown } | null} */
    const saved = raw
      ? /** @type {{ theme?: unknown; accent?: unknown; face?: unknown; keyboardHints?: unknown }} */ (JSON.parse(raw))
      : null;
    if (q && allowed.includes(q)) theme = q;
    else if (saved && typeof saved.theme === 'string' && allowed.includes(saved.theme)) theme = saved.theme;
    // Mirror of src/tool/accent.ts ACCENTS + LEGACY_ACCENTS (aqua, the default, has no attribute); the island
    // re-checks pack lamps against the licence.
    /** @type {Record<string, string>} */
    const accents = {
      '#5A47CF': 'violet',
      '#167A50': 'mint',
      '#255FBD': 'sky',
      '#4F46E5': 'violet',
      '#0F766E': 'mint',
      '#BE123C': 'sky',
    };
    const accent = saved && typeof saved.accent === 'string' ? accents[saved.accent.toUpperCase()] : undefined;
    if (accent) root.dataset.accent = accent;
    // The remembered clock face (DESIGN.md §7) and the keyboard-hint switch paint before first frame too, so the
    // tool never flashes the Ring face or a keycap it is about to hide.
    const face = saved && typeof saved.face === 'string' ? saved.face : '';
    if (['bold', 'horizon', 'tide'].includes(face)) root.dataset.face = face;
    if (saved && saved.keyboardHints === false) root.dataset.hints = 'off';
  } catch {
    // private mode
  }
  apply(theme);

  // Theme switch (DESIGN.md §9): persist the pick, apply it, and tell the island (its store writes settings
  // back). Auto follows the system live; night mode's forced OLED is left alone.
  /** @param {string} theme */
  const choose = (theme) => {
    try {
      const raw = localStorage.getItem(KEY);
      /** @type {Record<string, unknown>} */
      const saved = raw ? /** @type {Record<string, unknown>} */ (JSON.parse(raw)) : { v: 1 };
      saved.theme = theme;
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // private mode: the choice lasts for this page
    }
    apply(theme);
    document.dispatchEvent(new CustomEvent('at-theme', { detail: theme }));
  };
  dark.addEventListener('change', () => {
    if (root.dataset.themePref === 'auto' && root.dataset.theme !== 'oled') apply('auto');
  });
  // The switch's native radios mirror <html data-theme-pref> (OLED counts as Dark), whoever set it.
  const sync = () => {
    const pref = root.dataset.themePref === 'oled' ? 'dark' : root.dataset.themePref;
    for (const r of document.querySelectorAll('input[name="at-theme"]')) {
      if (r instanceof HTMLInputElement) r.checked = r.value === pref;
    }
  };
  new MutationObserver(sync).observe(root, {
    attributeFilter: ['data-theme-pref'],
  });
  addEventListener('change', (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.name === 'at-theme') choose(el.value);
  });

  // Language switcher (PRIMITIVES.md P-LANG): a bottom sheet below 600 px (modal, focus trapped), an anchored
  // non-modal panel from 600. Opening focuses the current row; ↑/↓ wrap, Home/End jump, Esc closes and returns
  // focus to the trigger; an outside click or focus leaving closes it. It stores nothing: the rows are links.
  const narrow = matchMedia('(width < 600px)');
  /** @type {HTMLElement | null} */
  let langOpen = null;
  /** @param {HTMLElement} wrap @param {boolean} open @param {boolean} [refocus] */
  const lang = (wrap, open, refocus) => {
    const btn = wrap.querySelector('button[aria-controls]');
    const panel = wrap.querySelector('[data-lang-panel]');
    if (!(btn instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    panel.setAttribute('role', narrow.matches ? 'dialog' : 'group');
    if (narrow.matches) panel.setAttribute('aria-modal', 'true');
    else panel.removeAttribute('aria-modal');
    langOpen = open ? wrap : null;
    const current = panel.querySelector('a[aria-current="true"]');
    if (open && current instanceof HTMLElement) current.focus();
    else if (!open && refocus) btn.focus();
  };
  /** @type {Record<string, string>} */
  const NEXT = { light: 'dark', dark: 'auto', oled: 'auto', auto: 'light' };
  /** @type {Record<string, number>} */
  const STEPS = { ArrowDown: 1, ArrowUp: -1, Home: 0, End: 0 };
  addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (el.closest('[data-theme-cycle]')) choose(NEXT[root.dataset.themePref ?? 'auto'] ?? 'light');
    const wrap = el.closest('[data-lang]');
    if (wrap instanceof HTMLElement) {
      if (el.closest('[data-lang-close]')) lang(wrap, false, true);
      else if (el.closest('button[aria-controls]')) lang(wrap, wrap !== langOpen);
    } else if (langOpen) lang(langOpen, false);
  });
  addEventListener('keydown', (e) => {
    const wrap = langOpen;
    if (!wrap) return;
    // Registered before the tool island's shortcuts (same window target), so Esc closes only the panel and
    // never reaches the island's "Esc stops the session".
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      lang(wrap, false, true);
      return;
    }
    const active = document.activeElement;
    const rows = [...wrap.querySelectorAll('a[hreflang]')];
    const step = STEPS[String(e.key)];
    if (step !== undefined && active && wrap.contains(active) && rows.length) {
      e.preventDefault();
      const i = rows.indexOf(active);
      const n = rows.length;
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n;
      const row = rows[to];
      if (row instanceof HTMLElement) row.focus();
      return;
    }
    // The phone sheet is modal: Tab cycles inside it.
    if (e.key === 'Tab' && narrow.matches) {
      const stops = [...wrap.querySelectorAll('[data-lang-panel] a[href], [data-lang-panel] button')];
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (
        first instanceof HTMLElement &&
        last instanceof HTMLElement &&
        (active === (e.shiftKey ? first : last) || !wrap.contains(active))
      ) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
  });
  // Focus leaving closes the panel; the phone sheet is modal, so focus that escapes it (WebKit's Tab skips links)
  // is brought back to its first stop instead.
  addEventListener('focusin', (e) => {
    const wrap = langOpen;
    if (!wrap || !(e.target instanceof Node) || wrap.contains(e.target)) return;
    const first = wrap.querySelector('[data-lang-panel] button, [data-lang-panel] a[href]');
    if (narrow.matches && first instanceof HTMLElement) first.focus();
    else lang(wrap, false);
  });

  // Module entries (the tool island, content-page scripts) start after the first contentful paint (docs/00 §11: LCP
  // lab ≤ 1.2 s) and never later than 150 ms after DOMContentLoaded, so the wake lock is still requested within the
  // 300 ms budget. scripts/defer-main.mjs moves each built entry URL onto a [data-main] element; without it (astro
  // dev) the module tags run as usual. One frame after they load, the monospace font follows, so its request never
  // lands before the largest paint.
  addEventListener('DOMContentLoaded', () => {
    sync();
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      /** @type {Promise<unknown>[]} */
      const entries = [];
      for (const el of document.querySelectorAll('[data-main]')) {
        if (el instanceof HTMLElement && el.dataset.main) entries.push(import(el.dataset.main));
      }
      void Promise.allSettled(entries).then(() =>
        requestAnimationFrame(() =>
          setTimeout(() => {
            delete root.dataset.fontHold;
          }, 0),
        ),
      );
    };
    // First contentful paint is the signal (the LCP element is static HTML painted with it); the cap covers
    // browsers without paint timing and pages that are still hidden (no paint happens there).
    try {
      new PerformanceObserver((list, observer) => {
        if (!list.getEntries().some((e) => e.name === 'first-contentful-paint')) return;
        observer.disconnect();
        setTimeout(go, 0);
      }).observe({ type: 'paint', buffered: true });
    } catch {
      addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(go)), { once: true });
    }
    setTimeout(go, 150);
  });
})();
