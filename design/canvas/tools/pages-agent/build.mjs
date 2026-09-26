// Assembles self-contained Page*.dc.html files from src/<Name>.html + src/<Name>.js + the fix-batch-2b primitives.
import { readFileSync, writeFileSync } from 'node:fs';
const here = (f) => new URL(f, import.meta.url);
const PROJECT = '/home/user/awaketab/design/canvas/project/';
const prim = (f) => readFileSync('/home/user/awaketab/design/canvas/tools/fix2b/prims/' + f, 'utf8').trimEnd();
const EXTRA = `.at-rise{animation:at-in .9s var(--ease) both;animation-delay:.08s}
.at-lin{transition:transform 1s linear,clip-path 1s linear,opacity 1s linear}
.at-arc{transition:stroke-dasharray 1s linear,stroke .6s var(--ease),stroke-opacity .6s var(--ease)}
.at-tw{animation:at-tw 5s ease-in-out infinite}
.at-tw2{animation:at-tw 7s ease-in-out infinite;animation-delay:-3s}
.at-glint{transform-origin:top center;animation:at-glint 6s ease-in-out infinite}
.at-pulse{animation:at-tw 3.4s ease-in-out infinite}
@keyframes at-tw{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes at-glint{0%,100%{transform:scaleX(.6);opacity:.35}50%{transform:scaleX(1);opacity:.7}}`;
const css = prim('prims.css').replace('@media (prefers-reduced-motion', EXTRA + '\n@media (prefers-reduced-motion');
const header = prim('header.html');
const footer = prim('footer.html');
const common = prim('prims.js') + '\n\n' + readFileSync(here('./src/_common.js'), 'utf8').trimEnd();

const names = process.argv.slice(2);
for (const name of names) {
  let markup = readFileSync(here(`./src/${name}.html`), 'utf8');
  const title = markup.match(/<!--title: (.*?)-->/)[1];
  const props = markup.match(/<!--props: (.*?)-->/)[1];
  markup = markup.replace(/<!--(title|props): .*?-->\n/g, '').replace('@@HEADER@@', header).replace('@@FOOTER@@', footer).trimEnd();
  const js = readFileSync(here(`./src/${name}.js`), 'utf8').trimEnd();
  if (/<\/script/i.test(js)) throw new Error('raw </script> in ' + name);
  const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700&amp;family=Geist+Mono:wght@200;300;400;500&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap" rel="stylesheet">
<style>
${css}
</style>
</helmet>
${markup}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${props}'>
${common}

${js}
</script>
</body>
</html>
`;
  writeFileSync(PROJECT + `Page${name}.dc.html`, out);
  console.log('wrote', `Page${name}.dc.html`);
}
