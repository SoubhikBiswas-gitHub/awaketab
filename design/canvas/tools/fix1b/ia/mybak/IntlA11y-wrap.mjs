// Writes the Intl* and A11y* wrapper boards (fixed props, fixed size).
import { writeFileSync } from 'node:fs';
const dir = new URL('./project/', import.meta.url);
const wrap = (file, name, title, props, w, h, lang = 'en') => writeFileSync(new URL(file, dir), `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>AwakeTab · ${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>body{margin:0}</style>
</helmet>
<div style="width: ${w}px; height: ${h}px">
<dc-import name="${name}" ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')} hint-size="${w}px,${h}px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`);
const I = (file, title, props, w, h, html) => wrap(file, 'Intl', title, Object.assign({ qa: 'false' }, props), w, h, html);
I('IntlDePhone.dc.html', 'Deutsch phone dark', { lang: 'de', layout: 'phone', theme: 'dark', status: 'awake', banner: 'review' }, 390, 844, 'de');
I('IntlJaPhone.dc.html', '日本語 phone light', { lang: 'ja', layout: 'phone', theme: 'light', status: 'ready', banner: 'suggest' }, 390, 844, 'ja');
I('IntlHiPhone.dc.html', 'हिन्दी phone dark', { lang: 'hi', layout: 'phone', theme: 'dark', status: 'blocked', banner: 'review' }, 390, 844, 'hi');
I('IntlFrPhone.dc.html', 'Français phone light', { lang: 'fr', layout: 'phone', theme: 'light', status: 'needtap', banner: 'suggest' }, 390, 844, 'fr');
I('IntlPtPhone.dc.html', 'Português phone dark', { lang: 'pt-br', layout: 'phone', theme: 'dark', status: 'fallback', banner: 'review' }, 390, 844, 'pt-BR');
I('IntlZhDesk.dc.html', '简体中文 desktop light', { lang: 'zh', layout: 'desktop', theme: 'light', status: 'awake', banner: 'both' }, 1280, 800, 'zh-Hans');
I('IntlEsDesk.dc.html', 'Español desktop dark', { lang: 'es', layout: 'desktop', theme: 'dark', status: 'paused', banner: 'both' }, 1280, 800, 'es');
I('IntlArticleDe.dc.html', 'Deutsch article phone', { lang: 'de', layout: 'phone', theme: 'light', screen: 'article', banner: 'none' }, 390, 1312, 'de');
const A = (file, title, props, w, h) => wrap(file, 'A11y', title, props, w, h);
A('A11yKeyboardDesk.dc.html', 'keyboard focus order', { mode: 'keyboard', theme: 'dark', layout: 'desktop' }, 1760, 800);
A('A11yForcedDark.dc.html', 'forced colours dark', { mode: 'forced', theme: 'dark', layout: 'phone' }, 870, 844);
A('A11yForcedLight.dc.html', 'forced colours light', { mode: 'forced', theme: 'light', layout: 'phone' }, 870, 844);
A('A11yZoomPhone.dc.html', 'text 200 percent', { mode: 'zoom', variant: 'text200', theme: 'dark', layout: 'phone' }, 870, 1480);
A('A11yReflow320.dc.html', 'reflow 320', { mode: 'zoom', variant: 'reflow320', theme: 'light', layout: 'phone' }, 800, 848);
A('A11yReducedPhone.dc.html', 'reduced motion', { mode: 'reduced', theme: 'dark', layout: 'phone' }, 870, 844);
A('A11yNoJsPhone.dc.html', 'before JavaScript phone', { mode: 'nojs', theme: 'light', layout: 'phone' }, 870, 844);
A('A11yNoJsDesk.dc.html', 'before JavaScript desktop', { mode: 'nojs', theme: 'dark', layout: 'desktop' }, 1760, 800);
A('A11yScreenReader.dc.html', 'screen reader announcements', { mode: 'screenreader', theme: 'dark', layout: 'phone' }, 870, 844);
console.log('wrappers written');
