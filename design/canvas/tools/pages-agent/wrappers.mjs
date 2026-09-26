import { writeFileSync } from 'node:fs';
const PROJECT = '/home/user/awaketab/design/canvas/project/';
export const WRAPS = [
  ['PageKioskDesk', 'PageKiosk', 'kiosk · desktop dark', { layout: 'desktop', theme: 'dark' }, 1280, 2992],
  ['PageKioskPhone', 'PageKiosk', 'kiosk · phone light', { layout: 'phone', theme: 'light' }, 390, 4360],
  ['PageLibraryDesk', 'PageLibrary', 'library · desktop dark', { layout: 'desktop', theme: 'dark' }, 1280, 3104],
  ['PageExtensionDesk', 'PageExtension', 'extension · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 3512],
  ['PageExtensionPhone', 'PageExtension', 'extension · phone dark', { layout: 'phone', theme: 'dark' }, 390, 5544],
  ['PageAboutDesk', 'PageAbout', 'about · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 2066],
  ['PageChangelogPhone', 'PageChangelog', 'changelog · phone dark', { layout: 'phone', theme: 'dark' }, 390, 7844],
  ['PagePrivacyDesk', 'PageLegal', 'privacy · desktop light', { doc: 'privacy', layout: 'desktop', theme: 'light' }, 1280, 4312],
  ['PageTermsPhone', 'PageLegal', 'terms · phone dark', { doc: 'terms', layout: 'phone', theme: 'dark' }, 390, 2236],
  ['Page404Phone', 'Page404', '404 · phone dark', { layout: 'phone', theme: 'dark' }, 390, 1536],
  ['Page404Desk', 'Page404', '404 · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 1040]
];
for (const [file, comp, title, props, w, h] of WRAPS) {
  writeFileSync(PROJECT + file + '.dc.html', `<!doctype html>
<html lang="en">
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
<dc-import name="${comp}" ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')} hint-size="${w}px,${h}px"></dc-import>
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
}
console.log('wrappers', WRAPS.length);
