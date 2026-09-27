import { writeFileSync } from 'node:fs';
const PROJECT = '/home/user/awaketab/design/canvas/project/';
export const WRAPS = [
  // Heights = the base's natural height at that layout, measured with the real canvas runtime (gap agent E, 27 Sep 2026).
  // D-R18: the Kiosk/Library desktop, Changelog phone and 404 phone wrappers are light (tools/final/dedupe-applied.json "flip").
  ['PageKioskDesk', 'PageKiosk', 'kiosk · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 2983],
  ['PageKioskTablet', 'PageKiosk', 'kiosk · tablet light', { layout: 'tablet', theme: 'light' }, 820, 3598],
  ['PageKioskPhone', 'PageKiosk', 'kiosk · phone light', { layout: 'phone', theme: 'light' }, 390, 4353],
  ['PageLibraryDesk', 'PageLibrary', 'library · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 3128],
  ['PageLibraryTablet', 'PageLibrary', 'library · tablet dark', { layout: 'tablet', theme: 'dark' }, 820, 3483],
  ['PageLibraryPhoneLight', 'PageLibrary', 'library · phone light', { layout: 'phone', theme: 'light' }, 390, 4470],
  ['PageExtensionDesk', 'PageExtension', 'extension · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 3545],
  ['PageExtensionTablet', 'PageExtension', 'extension · tablet light', { layout: 'tablet', theme: 'light' }, 820, 4583],
  ['PageExtensionPhone', 'PageExtension', 'extension · phone dark', { layout: 'phone', theme: 'dark' }, 390, 5624],
  ['PageAboutDesk', 'PageAbout', 'about · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 2066],
  ['PageAboutTablet', 'PageAbout', 'about · tablet dark', { layout: 'tablet', theme: 'dark' }, 820, 2348],
  ['PageAboutPhoneDark', 'PageAbout', 'about · phone dark', { layout: 'phone', theme: 'dark' }, 390, 3156],
  ['PageChangelogDeskLight', 'PageChangelog', 'changelog · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 5945],
  ['PageChangelogTablet', 'PageChangelog', 'changelog · tablet light', { layout: 'tablet', theme: 'light' }, 820, 5877],
  ['PageChangelogPhone', 'PageChangelog', 'changelog · phone light', { layout: 'phone', theme: 'light' }, 390, 7894],
  ['PagePrivacyDesk', 'PageLegal', 'privacy · desktop light', { doc: 'privacy', layout: 'desktop', theme: 'light' }, 1280, 4311],
  ['PageLegalTablet', 'PageLegal', 'privacy · tablet dark', { doc: 'privacy', layout: 'tablet', theme: 'dark' }, 820, 4733],
  ['PageTermsPhone', 'PageLegal', 'terms · phone dark', { doc: 'terms', layout: 'phone', theme: 'dark' }, 390, 2286],
  ['Page404Phone', 'Page404', '404 · phone light', { layout: 'phone', theme: 'light' }, 390, 1588],
  ['Page404Tablet', 'Page404', '404 · tablet light', { layout: 'tablet', theme: 'light' }, 820, 1702],
  ['Page404Desk', 'Page404', '404 · desktop light', { layout: 'desktop', theme: 'light' }, 1280, 1039]
];
// Gap agent E: wrappers are history (tools/final/setup.sh); rewrite them only with WRITE_WRAPPERS=1.
if (process.env.WRITE_WRAPPERS) for (const [file, comp, title, props, w, h] of WRAPS) {
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
if (process.env.WRITE_WRAPPERS) console.log('wrappers', WRAPS.length);
