import { writeFileSync } from 'node:fs';
const dir = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const wrap = (file, child, title, props, w, h) => writeFileSync(dir + file, `<!doctype html>
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
wrap('ExtPopupAwakeDark.dc.html', 'ExtPopup', 'popup awake dark', { status: 'awake', theme: 'dark' }, 360, 600);
wrap('ExtPopupAwakeLight.dc.html', 'ExtPopup', 'popup awake light', { status: 'awake', theme: 'light' }, 360, 600);
wrap('ExtPopupReady.dc.html', 'ExtPopup', 'popup ready', { status: 'ready', theme: 'dark' }, 360, 600);
wrap('ExtPopupSystem.dc.html', 'ExtPopup', 'popup system awake', { status: 'system', theme: 'dark' }, 360, 600);
wrap('ExtOptionsDark.dc.html', 'ExtOptions', 'extension settings dark', { theme: 'dark', pro: '{{true}}' }, 1280, 3860);
wrap('ExtOptionsLight.dc.html', 'ExtOptions', 'extension settings light, no Pro', { theme: 'light', pro: '{{false}}' }, 1280, 4050);
wrap('EmbedCompactLight.dc.html', 'EmbedWidget', 'embed compact light', { size: 'compact', mode: 'cook', theme: 'light', running: '{{true}}' }, 320, 104);
wrap('EmbedFullDark.dc.html', 'EmbedWidget', 'embed full dark', { size: 'full', mode: 'cook', theme: 'dark', running: '{{true}}', width: '720' }, 720, 240);
console.log('wrappers written');
