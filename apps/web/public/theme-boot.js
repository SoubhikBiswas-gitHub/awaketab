(() => {
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get('theme');
    const allowed = new Set(['auto', 'light', 'dark', 'oled']);
    let theme = 'auto';
    if (q && allowed.has(q)) theme = q;
    else {
      const raw = localStorage.getItem('at.v1.settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && allowed.has(parsed.theme)) theme = parsed.theme;
      }
    }
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'auto' ? (dark ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  } catch {
    /* private mode */
  }
})();
