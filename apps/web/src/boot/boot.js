(() => {
  // Inlined in <head> by BaseLayout (docs/05 §11), minified by scripts/boot-inline.mjs, and allowed by a CSP sha256
  // hash that scripts/headers.mjs computes from that text. Keep it small, dependency-free and free of "</script".
  // It is the page's only inline script, so it also runs the shared shell (docs/05 §3.25–§3.27): the header theme
  // switch and the footer language switcher work on every page, with or without the tool island.
  const root = document.documentElement;
  // Geist Mono waits until after the first paint (tokens.css maps it to its metric-matched fallback until then).
  root.dataset.fontHold = '';
  // Edge is the one browser CSS cannot tell apart from Chrome.
  if (/\bEdg\//u.test(navigator.userAgent)) root.dataset.edge = '';
  const KEY = 'at.v1.settings';
  // scripts/boot-inline.mjs swaps in the hashed URL of public/assets/themes.css.
  const THEMES = '__AT_THEMES__';
  // The same for public/assets/faces.css, the Bold, Horizon and Tide art.
  const FACES_CSS = '__AT_FACES__';
  // FACE_ORDER in src/tool/packs/faces/order.ts; the island root's data-fnames lists their names in this order.
  const FACES = 'ring bold horizon tide flip nixie lcd matrix rolling analog rings word'.split(' ');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  /** @type {Record<string, string>} */
  const GROUND = { light: '#F2F6FA', dark: '#0A0E16', oled: '#000000' };
  /** @param {string} theme */
  const apply = (theme) => {
    const resolved = theme === 'auto' ? (dark.matches ? 'dark' : 'light') : theme;
    // Transitions pause for two frames so a theme change repaints at once.
    root.dataset.swap = '';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        delete root.dataset.swap;
      }),
    );
    root.dataset.theme = resolved;
    root.dataset.themePref = theme;
    root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', GROUND[resolved] ?? '');
  };
  let theme = 'auto';
  let face = '';
  /** @type {boolean | null} */
  let c24 = null;
  let secs = false;
  try {
    const allowed = ['auto', 'light', 'dark', 'oled'];
    const q = new URLSearchParams(location.search).get('theme');
    const raw = localStorage.getItem(KEY);
    const saved = raw ? /** @type {Record<string, unknown>} */ (JSON.parse(raw)) : null;
    if (q && allowed.includes(q)) theme = q;
    else if (saved && typeof saved.theme === 'string' && allowed.includes(saved.theme)) theme = saved.theme;
    // Mirror of LAMPS + LEGACY_LAMPS in src/tool/packs/themes/looks.ts (aqua, the default, has no attribute); any
    // other hex is a custom lamp. The island re-checks Pro lamps, colour themes and patterns against the licence.
    /** @type {Record<string, string>} */
    const accents = {
      '#5A47CF': 'violet',
      '#167A50': 'mint',
      '#255FBD': 'sky',
      '#A34F00': 'amber',
      '#B1452F': 'coral',
      '#B0366A': 'rose',
      '#7F6400': 'gold',
      '#4D7300': 'lime',
      '#0A7565': 'teal',
      '#2A6A8A': 'ice',
      '#7446B0': 'lavender',
      '#4F46E5': 'violet',
      '#0F766E': 'mint',
      '#BE123C': 'sky',
    };
    const hex = saved && typeof saved.accent === 'string' ? saved.accent.toUpperCase() : '';
    const accent =
      accents[hex] ?? (/^#[0-9A-F]{6}$/u.test(hex) && hex !== '#087B87' && hex !== '#B86E00' ? 'custom' : '');
    if (accent) root.dataset.accent = accent;
    if (accent === 'custom') root.style.setProperty('--at-custom', hex);
    const palette = saved?.palette;
    const pattern = saved?.pattern;
    if (typeof palette === 'string' && palette !== 'clear-night') root.dataset.palette = palette;
    if (typeof pattern === 'string' && pattern !== 'none') root.dataset.pattern = pattern;
    // Colour themes, patterns and the newer lamps live in public/assets/themes.css. A parser-inserted link holds the
    // first paint for it, as the inline CSS does, so a chosen look never flashes the default one.
    if (root.dataset.palette || root.dataset.pattern || (accent && !/^(?:violet|mint|sky)$/u.test(accent)))
      document.write(`<link rel="stylesheet" href="${THEMES}" data-at-themes>`);
    // The remembered clock face (DESIGN.md §7) and the keyboard-hint switch paint before first frame too, so the
    // tool never flashes the Ring face or a keycap it is about to hide.
    const f = saved && typeof saved.face === 'string' ? saved.face : '';
    const at = FACES.indexOf(f);
    if (at > 0) root.dataset.face = face = f;
    // A tool page (BaseLayout puts its render-blocking link above this script) holds its first paint for that art.
    if (at > 0 && at < 4 && document.querySelector('link[href="#at-tool-parsed"]'))
      document.write(`<link rel="stylesheet" href="${FACES_CSS}" data-at-faces>`);
    if (saved && saved.keyboardHints === false) root.dataset.hints = 'off';
    if (saved && saved.reduceMotion === 'on') root.dataset.motion = 'reduce';
    const clock = /** @type {{ clock24h?: unknown; showSeconds?: unknown } | undefined} */ (saved?.ambient);
    const h24 = clock?.clock24h;
    if (typeof h24 === 'boolean') c24 = h24;
    secs = clock?.showSeconds === true;
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
  // A theme swap from anywhere runs no transitions, so nothing eases in piecemeal.
  const sync = () => {
    const pref = root.dataset.themePref === 'oled' ? 'dark' : root.dataset.themePref;
    for (const r of document.querySelectorAll('input[name="at-theme"]')) {
      if (r instanceof HTMLInputElement) r.checked = r.value === pref;
    }
  };
  new MutationObserver(() => {
    sync();
    root.dataset.swap = '';
    root.getBoundingClientRect();
    delete root.dataset.swap;
  }).observe(root, {
    attributeFilter: ['data-theme', 'data-theme-pref'],
  });
  addEventListener('change', (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.name === 'at-theme') choose(el.value);
  });

  // Language switcher (PRIMITIVES.md P-LANG), a native <dialog> built on components/ui/Drawer.astro: a modal
  // bottom sheet below 600 px (showModal traps focus and makes the page inert), an anchored non-modal panel from 600.
  // Opening focuses the current row; ↑/↓ wrap, Home/End jump, Esc closes and returns focus to the trigger; an
  // outside click or focus leaving closes it. It stores nothing: the rows are links.
  const narrow = matchMedia('(width < 600px)');
  /** @type {HTMLElement | null} */
  let langOpen = null;
  /** @param {HTMLElement} wrap @param {boolean} open @param {boolean} [refocus] */
  const lang = (wrap, open, refocus) => {
    const btn = wrap.querySelector('button[aria-controls]');
    const panel = wrap.querySelector('dialog');
    if (!(btn instanceof HTMLElement) || !(panel instanceof HTMLDialogElement)) return;
    btn.setAttribute('aria-expanded', String(open));
    langOpen = open ? wrap : null;
    if (!open) {
      panel.close();
      if (refocus) btn.focus();
      return;
    }
    if (narrow.matches) panel.showModal();
    else panel.show();
    const current = panel.querySelector('a[aria-current="true"]');
    if (current instanceof HTMLElement) current.focus();
  };
  // Closed by the browser itself (Esc on the modal sheet, light dismiss): keep the trigger in step.
  addEventListener(
    'close',
    (e) => {
      const wrap = e.target instanceof Element ? e.target.closest('[data-lang]') : null;
      wrap?.querySelector('button[aria-controls]')?.setAttribute('aria-expanded', 'false');
      if (wrap === langOpen) langOpen = null;
    },
    true,
  );
  /** @type {Record<string, string>} */
  const NEXT = { light: 'dark', dark: 'auto', oled: 'auto', auto: 'light' };
  /** @type {Record<string, number>} */
  const STEPS = { ArrowDown: 1, ArrowUp: -1, Home: 0, End: 0 };
  addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (el.closest('[data-theme-cycle]')) choose(NEXT[root.dataset.themePref ?? 'auto'] ?? 'light');
    // On a tool page the footer's shortcuts link opens the tool's own list.
    const keys = el.closest('[data-keys]') && document.querySelector('[data-open-shortcuts]');
    if (keys instanceof HTMLElement) {
      e.preventDefault();
      keys.click();
    }
    const wrap = el.closest('[data-lang]');
    if (wrap instanceof HTMLElement) {
      const r = el.getBoundingClientRect();
      // A click on the dialog box itself, outside its rectangle, is a click on the phone sheet's backdrop.
      const out =
        el.localName === 'dialog' &&
        (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right);
      if (out || el.closest('[data-lang-close]')) lang(wrap, false, true);
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
    }
  });
  // Focus leaving the non-modal panel closes it (the modal sheet never lets focus out).
  addEventListener('focusin', (e) => {
    const wrap = langOpen;
    if (wrap && e.target instanceof Node && !wrap.contains(e.target)) lang(wrap, false);
  });

  // Fill clock- and device-dependent text before each frame so the island's first render changes nothing.
  const locale = root.lang || 'en';
  /** @param {Intl.DateTimeFormatOptions} o @param {number} ms @param {string} [l] */
  const fmt = (o, ms, l = locale) => new Intl.DateTimeFormat(l, { ...o, numberingSystem: 'latn' }).format(ms);
  /** @param {number} ms @param {boolean} [s] */
  const hm = (ms, s) =>
    fmt(
      {
        hour: 'numeric',
        minute: '2-digit',
        ...(s ? { second: '2-digit' } : {}),
        ...(c24 === null ? {} : { hour12: !c24 }),
      },
      ms,
    );
  /** @param {number} n */
  const pad = (n) => String(Math.floor(n)).padStart(2, '0');
  const quiet = /[?&]autostart=0(?:&|$)/u.test(location.search);
  const fill = () => {
    const tool = document.getElementById('awaketab-tool');
    if (tool && !('booted' in tool.dataset)) {
      const d = tool.dataset;
      if (quiet) delete d.auto;
      const now = Date.now();
      const nowT = hm(now, secs);
      /** @type {Intl.DateTimeFormatOptions} */
      const long = { day: 'numeric', month: 'long', year: 'numeric' };
      /** @param {string} k @param {string} v */
      const put = (k, v) => {
        for (const n of tool.querySelectorAll(`[data-t="${k}"]`)) n.textContent = v;
      };
      const h = new Date(now).getHours();
      const i = h < 5 ? 3 : h < 8 ? 0 : h < 17 ? 1 : h < 20 ? 2 : 3;
      d.phase = ['dawn', 'day', 'dusk', 'night'][i];
      put('hz', `${d.sky?.split('|')[i] ?? ''} · ${nowT}`);
      put('now', nowT);
      put(
        'date',
        locale === 'en'
          ? `${fmt({ weekday: 'long' }, now, 'en-GB')}, ${fmt(long, now, 'en-GB')}`
          : fmt({ weekday: 'long', ...long }, now),
      );
      let end = now + Number(d.sec) * 1000;
      if (d.until) {
        const at = new Date(now);
        at.setHours(Number(d.until.slice(0, 2)), Number(d.until.slice(3)), 0, 0);
        if (+at <= now) at.setDate(at.getDate() + 1);
        const left = Math.max(60, Math.round((+at - now) / 1000));
        const hh = Math.floor(left / 3600);
        put('a', hh ? `${String(hh)}:${pad((left % 3600) / 60)}` : pad(left / 60));
        put('b', `:${pad(left % 60)}`);
        d.units = hh ? 'h' : '';
        end = now + left * 1000;
      }
      if (end) {
        end = Math.round(end / 60_000) * 60_000;
        const later = new Date(end).getDate() !== new Date(now).getDate();
        const at = later ? (d.tmr ?? '').replace('{time}', hm(end)) : hm(end);
        put('mb', at);
        if (d.until) {
          tool.toggleAttribute('data-tomorrow', later);
          put('untilChip', (d.chip ?? '').replace('{time}', at));
        }
      }
      // The face switch names the remembered face.
      if (face) put('fn', (d.fnames ?? '').split('|')[FACES.indexOf(face)] ?? '');
    }
    if (document.readyState === 'loading') requestAnimationFrame(fill);
  };
  requestAnimationFrame(fill);

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
      void Promise.allSettled(entries).then(() => {
        const keys = document.querySelector('[data-open-shortcuts]');
        if (location.hash === '#keys' && keys instanceof HTMLElement) keys.click();
        requestAnimationFrame(() =>
          setTimeout(() => {
            delete root.dataset.fontHold;
          }, 0),
        );
      });
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
