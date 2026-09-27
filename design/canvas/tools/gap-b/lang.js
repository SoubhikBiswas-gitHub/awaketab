// AT-LANG v1 (language switcher; PRIMITIVES.md P-LANG). Keep identical across files.
const AT_LOCALES = [
  ['en', '', 'en', 'English', true], ['es', '/es', 'es', 'Español', false], ['pt-br', '/pt-br', 'pt-BR', 'Português (Brasil)', false],
  ['de', '/de', 'de', 'Deutsch', false], ['fr', '/fr', 'fr', 'Français', false], ['ja', '/ja', 'ja', '日本語', false],
  ['zh', '/zh', 'zh-Hans', '简体中文', false], ['hi', '/hi', 'hi', 'हिन्दी', false]
];
const AT_LANG_COPY = { title: 'Language', current: 'Current', review: 'Translation in review', close: 'Close' };
// o = { layout, t, lamp, open, toggle, close, cur: 'en', path: '/', variant: 'footer' | 'settings' }
function atLang(o) {
  const t = o.t, cur = o.cur || 'en', path = o.path || '/', settings = o.variant === 'settings', open = !!o.open;
  const id = settings ? 'at-lang-set' : 'at-lang', sheet = !settings && o.layout === 'phone';
  const a = (hex, x) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + x + ')'; };
  const here = AT_LOCALES.find((l) => l[0] === cur) || AT_LOCALES[0];
  const panel = 'box-sizing: border-box; display: flex; flex-direction: column; background: ' + t.surface + '; border: 1px solid ' + t.line + '; box-shadow: 0 24px 64px -24px rgba(0,0,0,.45); ';
  return {
    open, sheet: sheet && open, pop: !sheet && !settings, btnId: id + '-btn', listId: id + '-list', headId: id + '-h',
    label: here[3], aria: AT_LANG_COPY.title + ': ' + here[3], title: AT_LANG_COPY.title, closeLabel: AT_LANG_COPY.close, pageLang: here[2],
    expanded: open ? 'true' : 'false', chev: open ? 'rotate(180deg)' : 'none', role: sheet ? 'dialog' : 'group', modal: sheet ? 'true' : 'false',
    wrapStyle: sheet ? 'display: flex' : 'position: relative; display: flex; margin-inline-start: auto',
    panelStyle: sheet
      ? panel + 'position: fixed; inset-inline: 0; bottom: 0; z-index: 30; padding: 8px 16px 32px; border-radius: 28px 28px 0 0; border-bottom: 0'
      : panel + 'position: absolute; inset-inline-end: 0; bottom: calc(100% + 8px); z-index: 30; width: 360px; padding: 4px; border-radius: 16px',
    toggle: () => {
      o.toggle();
      if (!open) setTimeout(() => { try { document.querySelector('#' + id + '-list a[aria-current="true"]').focus(); } catch (e) {} }, 60);
    },
    close: () => o.close(),
    key: (e) => {
      const k = e && e.key, box = (e && e.currentTarget) || document;
      if (k === 'Escape' && open) {
        if (e.preventDefault) e.preventDefault();
        o.close();
        try { box.querySelector('button[aria-controls]').focus(); } catch (x) {}
        return;
      }
      const step = { ArrowDown: 1, ArrowUp: -1, Home: 'home', End: 'end' }[k];
      if (!step || !open) return;
      let rows = [];
      try { rows = Array.from(box.querySelectorAll('a[hreflang]')); } catch (x) {}
      if (!rows.length) return;
      if (e.preventDefault) e.preventDefault();
      const i = rows.indexOf(document.activeElement), n = rows.length;
      rows[step === 'home' ? 0 : step === 'end' ? n - 1 : i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n].focus();
    },
    rows: AT_LOCALES.map(([lid, prefix, lang, name, reviewed]) => {
      const on = lid === cur;
      return {
        href: prefix + path, lang, hreflang: lang, name, cur: on ? 'true' : 'false',
        border: on ? a(o.lamp, 0.45) : 'transparent', bg: on ? a(o.lamp, 0.14) : 'transparent', weight: on ? 600 : 500,
        ring: on ? o.lamp : t.inputBorder, dot: on ? o.lamp : 'transparent',
        note: on ? AT_LANG_COPY.current : reviewed ? '' : AT_LANG_COPY.review, noteInk: on ? t.ink2 : t.muted
      };
    })
  };
}
