import { writeFileSync } from 'node:fs';
const dir = new URL('./project/', import.meta.url);
const wrap = (file, title, name, props, w, h) => writeFileSync(new URL(file, dir), `<!doctype html>
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
const E = (f, t, edge, theme, extra = {}) => wrap(f, t, 'ExtEdge', { edge, theme, ...extra }, 360, 600);
E('ExtEdgeScheduled.dc.html', 'popup scheduled', 'scheduled', 'dark');
E('ExtEdgeAutostart.dc.html', 'popup auto-start', 'autostart', 'light');
E('ExtEdgeProLocked.dc.html', 'popup Pro locked', 'prolocked', 'dark');
E('ExtEdgeError.dc.html', 'popup blocked', 'error', 'light', { error: 'denied' });
E('ExtEdgeTimesUp.dc.html', 'popup time is up', 'timesup', 'dark');
E('ExtEdgeUpdate.dc.html', 'popup updated', 'update', 'light');
E('ExtEdgeFirstOpen.dc.html', 'popup first open', 'firstopen', 'dark');
wrap('WelcomeDark.dc.html', 'welcome dark', 'Welcome', { theme: 'dark' }, 1280, 2672);
wrap('WelcomeLight.dc.html', 'welcome light', 'Welcome', { theme: 'light' }, 1280, 2672);
const S = (f, t, props, w, h) => wrap(f, t, 'Sys', props, w, h);
S('SysOfflinePhone.dc.html', 'offline phone', { kind: 'offline', layout: 'phone', theme: 'dark' }, 390, 844);
S('SysOfflineDesk.dc.html', 'offline desktop', { kind: 'offline', layout: 'desktop', theme: 'light' }, 1280, 888);
S('SysNotify.dc.html', 'time is up notifications', { kind: 'notify', layout: 'desktop', theme: 'dark' }, 1280, 900);
S('SysTabsLight.dc.html', 'tab strip light', { kind: 'tabs', layout: 'desktop', theme: 'light' }, 1280, 1088);
S('SysTabsDark.dc.html', 'tab strip dark', { kind: 'tabs', layout: 'desktop', theme: 'dark' }, 1280, 1088);
S('SysProLapsed.dc.html', 'Pro lapsed', { kind: 'prolapsed', layout: 'desktop', theme: 'dark', state: 'lapsed' }, 1280, 2044);
S('SysCheckoutSuccess.dc.html', 'checkout success', { kind: 'checkout', layout: 'desktop', theme: 'dark', state: 'success' }, 1280, 948);
S('SysCheckoutFailed.dc.html', 'checkout failed', { kind: 'checkout', layout: 'desktop', theme: 'light', state: 'failed' }, 1280, 912);
S('SysUpdate.dc.html', 'update ready', { kind: 'update', layout: 'desktop', theme: 'dark' }, 1280, 860);
S('SysInstalledDesk.dc.html', 'installed desktop', { kind: 'install', layout: 'desktop', theme: 'dark' }, 1280, 800);
S('SysInstalledPhone.dc.html', 'installed phone', { kind: 'install', layout: 'phone', theme: 'light' }, 1280, 1084);
console.log('wrappers written');
