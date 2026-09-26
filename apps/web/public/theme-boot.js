(() => {
  try {
    const params = new URLSearchParams(location.search);
    const q = params.get('theme');
    const allowed = new Set(['auto', 'light', 'dark', 'oled']);
    let theme = 'auto';
    let parsed = null;
    const raw = localStorage.getItem('at.v1.settings');
    if (raw) parsed = JSON.parse(raw);
    if (q && allowed.has(q)) theme = q;
    else if (parsed && allowed.has(parsed.theme)) theme = parsed.theme;
    // Mirror of src/tool/accent.ts ACCENTS; the island re-checks pack palettes against the licence.
    const accents = { '#4F46E5': 'indigo', '#0F766E': 'teal', '#BE123C': 'rose' };
    const accent = parsed && typeof parsed.accent === 'string' ? accents[parsed.accent.toUpperCase()] : undefined;
    if (accent) document.documentElement.dataset.accent = accent;
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'auto' ? (dark ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  } catch {
    /* private mode */
  }
})();
