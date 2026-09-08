import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const limits = {
  css: 20 * 1024,
  criticalJs: 15 * 1024,
  totalJs: 40 * 1024,
};

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? files(target) : [target];
      }),
    )
  ).flat();
}

async function gzipTotal(paths) {
  const values = await Promise.all(
    paths.map(async (target) => gzipSync(await readFile(target)).byteLength),
  );
  return values.reduce((total, value) => total + value, 0);
}

const paths = await files(DIST);
const js = paths.filter((target) => target.endsWith('.js'));
const css = paths.filter((target) => target.endsWith('.css'));
const html = paths.filter((target) => target.endsWith('.html'));
const [totalJs, externalCss, inlineCss] = await Promise.all([
  gzipTotal(js),
  gzipTotal(css),
  Promise.all(
    html.map(async (target) => {
      const document = await readFile(target, 'utf8');
      const styles = [...document.matchAll(/<style[^>]*>(?<css>.*?)<\/style>/gsu)]
        .map((match) => match.groups?.css ?? '')
        .join('');
      return gzipSync(styles).byteLength;
    }),
  ),
]);
const totalCss = externalCss + Math.max(0, ...inlineCss);
const criticalJs = totalJs;

const report = { criticalJs, totalCss, totalJs };
process.stdout.write(`${JSON.stringify(report)}\n`);

if (
  totalJs > limits.totalJs ||
  criticalJs > limits.criticalJs ||
  totalCss > limits.css
) {
  process.exitCode = 1;
}
