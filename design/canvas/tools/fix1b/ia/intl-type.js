// Per-script typography. Geist first (Latin letters and Latin digits), then the script's own system face,
// then a Noto face so every viewer gets real glyphs. CJK: no hyphenation, strict line breaking, taller
// lines, no negative tracking. Devanagari: taller lines so matras above and below never clip, zero
// letter-spacing (tracking breaks conjunct shaping), no uppercase kicker.
// Line heights are px on the 4 px grid (DESIGN.md §11.5 sizes; Latin keeps the §11.5 line heights,
// CJK and Devanagari step up one grid row or more): caption 13, small 14, ui 15, body 16, cta 17, h1, h2.
const TYPE = {
  latn: { font: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif", hyph: 'auto', lb: 'auto', headTrack: '-0.02em', h2Track: '-0.01em',
    caption: '18px', small: '20px', ui: '22px', body: '26px', cta: '24px', h1: ['42px', '56px'], h2: ['32px', '36px'] },
  ja: { font: "Geist, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic UI', Meiryo, system-ui, sans-serif", hyph: 'manual', lb: 'strict', headTrack: '0', h2Track: '0',
    caption: '20px', small: '24px', ui: '24px', body: '28px', cta: '28px', h1: ['48px', '64px'], h2: ['36px', '40px'] },
  zh: { font: "Geist, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei UI', 'Microsoft YaHei', system-ui, sans-serif", hyph: 'manual', lb: 'strict', headTrack: '0', h2Track: '0',
    caption: '20px', small: '24px', ui: '24px', body: '28px', cta: '28px', h1: ['48px', '64px'], h2: ['36px', '40px'] },
  hi: { font: "Geist, 'Kohinoor Devanagari', 'Noto Sans Devanagari', 'Nirmala UI', Mangal, system-ui, sans-serif", hyph: 'manual', lb: 'auto', headTrack: '0', h2Track: '0',
    caption: '20px', small: '24px', ui: '24px', body: '28px', cta: '28px', h1: ['48px', '64px'], h2: ['36px', '40px'] }
};
// Accuracy corrections (BRIEF, D-R12): the canvas never shows a battery-saver refusal claim or iPad Split View
// (removed in iPadOS 26). These phrases are in the repo articles (src/content/for/{ja,de,hi}/cooking.md);
// the content fix batch must correct the source files. tool.advice.battery_saver is never injected (O-59).
const CLEAN = {
  ja: [['省電力機能に断られた場合は「ブロック中 — 解決方法はこちら」と出て、原因と直し方が示されます。', '']],
  de: [[', in Split View', '']],
  hi: [[' स्प्लिट व्यू में,', ',']]
};
