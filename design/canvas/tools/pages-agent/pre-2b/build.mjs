// Assembles self-contained Page*.dc.html files from src/<Name>.html + src/<Name>.js + shared parts.
import { readFileSync, writeFileSync } from 'node:fs';
const here = (f) => new URL(f, import.meta.url);
const PROJECT = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const style = readFileSync(here('./helmet-style.txt'), 'utf8').trimEnd();
const EXTRA = `input,select,textarea{font-family:inherit}
input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid #5BE0E8;outline-offset:2px}
a{-webkit-tap-highlight-color:transparent;transition:color .45s var(--ease),background-color .45s var(--ease),border-color .45s var(--ease)}
.at-u{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.at-u:hover{text-decoration-thickness:2px}
.at-pulse{animation:at-tw 3.4s ease-in-out infinite}`;
const styleWithExtra = style.replace('@media (prefers-reduced-motion', EXTRA + '\n@media (prefers-reduced-motion');
const header = readFileSync(here('./src/_header.html'), 'utf8').trimEnd();
const footer = readFileSync(here('./src/_footer.html'), 'utf8').trimEnd();
const common = readFileSync(here('./src/_common.js'), 'utf8').trimEnd();

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
${styleWithExtra}
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
