// Writes the wrapper boards for Guide*, Preset* and Until* and prints canvas board entries.
import { writeFileSync } from 'node:fs';
import { dir, load } from './ProLib.mjs';

const boards = {};
const base = (file, title, w, h) => { boards[file] = { w, h, title, is_interactive: true }; };
const wrap = (file, child, title, props) => {
  const { Component } = load(child + '.dc.html');
  const v = new Component(props).renderVals();
  const w = parseInt(v.W, 10), h = parseInt(v.H, 10);
  if (h > 8000) throw new Error(file + ' too tall ' + h);
  const attrs = Object.entries(props).map(([k, x]) => `${k}="${x}"`).join(' ');
  writeFileSync(new URL(file, dir), `<!doctype html>
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
<dc-import name="${child}" ${attrs} hint-size="${w}px,${h}px"></dc-import>
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
  boards[file] = { w, h, title, is_interactive: true };
};
const size = (child, props) => { const { Component } = load(child + '.dc.html'); const v = new Component(props).renderVals(); return [parseInt(v.W, 10), parseInt(v.H, 10)]; };

base('GuideOn.dc.html', '/on/iphone-safari · follows your system', ...size('GuideOn', {}));
wrap('GuideOnPhoneDark.dc.html', 'GuideOn', '/on/iphone-safari · phone · dark', { layout: 'phone', theme: 'dark' });
wrap('GuideOnDeskLight.dc.html', 'GuideOn', '/on/iphone-safari · desktop · light', { layout: 'desktop', theme: 'light' });
wrap('GuideOnStalePhone.dc.html', 'GuideOn', '/on/iphone-safari · phone · light · stale badge', { layout: 'phone', theme: 'light', stale: 'true' });
base('GuideVs.dc.html', '/vs/nosleep-page · follows your system', ...size('GuideVs', {}));
wrap('GuideVsPhoneLight.dc.html', 'GuideVs', '/vs/nosleep-page · phone · light', { layout: 'phone', theme: 'light' });
wrap('GuideVsDeskDark.dc.html', 'GuideVs', '/vs/nosleep-page · desktop · dark', { layout: 'desktop', theme: 'dark' });
base('GuideLearn.dc.html', '/learn/screen-wake-lock-api-guide · follows your system', ...size('GuideLearn', {}));
wrap('GuideLearnDeskDark.dc.html', 'GuideLearn', '/learn/screen-wake-lock-api-guide · desktop · dark', { layout: 'desktop', theme: 'dark' });
wrap('GuideLearnPhoneLight.dc.html', 'GuideLearn', '/learn/screen-wake-lock-api-guide · phone · light', { layout: 'phone', theme: 'light' });
base('GuideGuides.dc.html', '/guides/iphone-auto-lock-never-greyed-out · follows your system', ...size('GuideGuides', {}));
wrap('GuideGuidesPhoneDark.dc.html', 'GuideGuides', '/guides/iphone-auto-lock · phone · dark', { layout: 'phone', theme: 'dark' });
wrap('GuideGuidesDeskLight.dc.html', 'GuideGuides', '/guides/iphone-auto-lock · desktop · light', { layout: 'desktop', theme: 'light' });
base('PresetPage.dc.html', '/30m · follows your system', ...size('PresetPage', {}));
wrap('PresetPhoneDark.dc.html', 'PresetPage', '/30m · phone · dark', { layout: 'phone', theme: 'dark' });
wrap('PresetDeskLight.dc.html', 'PresetPage', '/30m · desktop · light', { layout: 'desktop', theme: 'light' });
wrap('PresetTablet.dc.html', 'PresetPage', '/30m · tablet · dark', { layout: 'tablet', theme: 'dark' });
base('UntilPage.dc.html', '/until/07-30 · follows your system', ...size('UntilPage', {}));
wrap('UntilPhoneLight.dc.html', 'UntilPage', '/until/07-30 · phone · light · evening, ends tomorrow', { layout: 'phone', theme: 'light', clock: 'evening' });
wrap('UntilDeskDark.dc.html', 'UntilPage', '/until/07-30 · desktop · dark · morning, ends today', { layout: 'desktop', theme: 'dark', clock: 'morning' });
console.log(JSON.stringify(boards, null, 1));
