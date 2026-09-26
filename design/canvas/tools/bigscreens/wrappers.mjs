import { writeFileSync } from 'node:fs';
const dir = new URL('../directions/project/', import.meta.url);
const wrap = (file, child, title, props, w, h) => writeFileSync(new URL(file, dir), `<!doctype html>
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
<dc-import name="${child}" ${Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ')} hint-size="${w}px,${h}px"></dc-import>
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
export const WRAPPERS = [
  ['KioskTvClock.dc.html', 'KioskScreen', 'kiosk TV clock', { size: 'tv', mode: 'clock', theme: 'dark', licensed: 'true' }, 1920, 1080],
  ['KioskTvMessage.dc.html', 'KioskScreen', 'kiosk TV message', { size: 'tv', mode: 'message', theme: 'dark', licensed: 'true' }, 1920, 1080],
  ['KioskTvUnlicensed.dc.html', 'KioskScreen', 'kiosk TV unlicensed', { size: 'tv', mode: 'message', theme: 'dark', licensed: 'false' }, 1920, 1080],
  ['KioskTvDashboard.dc.html', 'KioskScreen', 'kiosk TV dashboard overlay', { size: 'tv', mode: 'dashboard-overlay', theme: 'light', licensed: 'false' }, 1920, 1080],
  ['KioskPortraitLogo.dc.html', 'KioskScreen', 'kiosk portrait logo', { size: 'portrait', mode: 'logo', theme: 'dark', licensed: 'true' }, 1080, 1920],
  ['EmbedEdgeNoAllow.dc.html', 'EmbedEdge', 'embed missing allow', { edge: 'noallow', host: 'light', theme: 'dark', layout: 'desktop' }, 1280, 800],
  ['EmbedEdgeSidebar.dc.html', 'EmbedEdge', 'embed 280 px sidebar', { edge: 'sidebar', host: 'dark', theme: 'dark', layout: 'desktop' }, 1280, 800],
  ['EmbedEdgeLicensed.dc.html', 'EmbedEdge', 'embed licensed', { edge: 'running', host: 'light', licensed: 'true', theme: 'light', layout: 'desktop' }, 1280, 800],
  ['EmbedEdgeUnsupportedTablet.dc.html', 'EmbedEdge', 'embed unsupported tablet', { edge: 'unsupported', host: 'light', theme: 'light', layout: 'tablet' }, 820, 1100],
  ['EmbedEdgeBatteryPhone.dc.html', 'EmbedEdge', 'embed low battery phone', { edge: 'battery', host: 'dark', theme: 'dark', layout: 'phone' }, 390, 1120],
  ['EmbedCookCompact.dc.html', 'EmbedCook', 'embed cook compact', { size: 'compact', state: 'running', theme: 'light' }, 320, 104],
  ['EmbedCookFull.dc.html', 'EmbedCook', 'embed cook full', { size: 'full', state: 'timerdone', theme: 'dark' }, 720, 240],
  ['OgHome.dc.html', 'OgCards', 'OG home', { kind: 'home', theme: 'dark' }, 1200, 630],
  ['OgArticle.dc.html', 'OgCards', 'OG article', { kind: 'article', theme: 'dark' }, 1200, 630],
  ['OgDevice.dc.html', 'OgCards', 'OG device', { kind: 'device', theme: 'dark' }, 1200, 630],
  ['OgVs.dc.html', 'OgCards', 'OG vs', { kind: 'vs', theme: 'dark' }, 1200, 630],
  ['OgPro.dc.html', 'OgCards', 'OG pro', { kind: 'pro', theme: 'dark' }, 1200, 630],
  ['OgPreset.dc.html', 'OgCards', 'OG preset', { kind: 'preset', theme: 'dark' }, 1200, 630],
  ['StoreShot1.dc.html', 'StoreAssets', 'store shot 1', { kind: 'shot1', theme: 'dark' }, 1280, 800],
  ['StoreShot2.dc.html', 'StoreAssets', 'store shot 2', { kind: 'shot2', theme: 'dark' }, 1280, 800],
  ['StoreShot3.dc.html', 'StoreAssets', 'store shot 3', { kind: 'shot3', theme: 'dark' }, 1280, 800],
  ['StoreShot4.dc.html', 'StoreAssets', 'store shot 4', { kind: 'shot4', theme: 'dark' }, 1280, 800],
  ['StoreShot5.dc.html', 'StoreAssets', 'store shot 5', { kind: 'shot5', theme: 'dark' }, 1280, 800],
  ['StorePromoSmall.dc.html', 'StoreAssets', 'store small promo tile', { kind: 'promo', theme: 'dark' }, 440, 280],
  ['StoreMarquee.dc.html', 'StoreAssets', 'store marquee', { kind: 'marquee', theme: 'dark' }, 1400, 560]
];
if (process.argv[1].endsWith('wrappers.mjs')) { for (const w of WRAPPERS) wrap(...w); console.log('wrote', WRAPPERS.length); }
