(() => {
  // Inlined in <head> by BaseLayout (docs/05 §11) and allowed by a CSP sha256 hash that scripts/headers.mjs
  // computes from this exact file. Keep it small, dependency-free and free of the string "</script".
  const root = document.documentElement;
  try {
    const allowed = ['auto', 'light', 'dark', 'oled'];
    const q = new URLSearchParams(location.search).get('theme');
    const raw = localStorage.getItem('at.v1.settings');
    /** @type {{ theme?: unknown; accent?: unknown } | null} */
    const saved = raw ? /** @type {{ theme?: unknown; accent?: unknown }} */ (JSON.parse(raw)) : null;
    let theme = 'auto';
    if (q && allowed.includes(q)) theme = q;
    else if (saved && typeof saved.theme === 'string' && allowed.includes(saved.theme)) theme = saved.theme;
    // Mirror of src/tool/accent.ts ACCENTS; the island re-checks pack palettes against the licence.
    /** @type {Record<string, string>} */
    const accents = { '#4F46E5': 'indigo', '#0F766E': 'teal', '#BE123C': 'rose' };
    const accent = saved && typeof saved.accent === 'string' ? accents[saved.accent.toUpperCase()] : undefined;
    if (accent) root.dataset.accent = accent;
    const resolved = theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  } catch {
    /* private mode */
  }
  // The tool module starts after the first contentful paint (docs/00 §11: LCP lab ≤ 1.2 s) and never later than 150 ms
  // after DOMContentLoaded, so the wake lock is still requested within the 300 ms budget. scripts/defer-main.mjs
  // moves the built entry URL onto #awaketab-tool[data-main]; without it (astro dev) the module tag runs as usual.
  addEventListener('DOMContentLoaded', () => {
    const src = document.getElementById('awaketab-tool')?.dataset.main;
    if (!src) return;
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      void import(src);
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
