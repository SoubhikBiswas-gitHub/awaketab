/**
 * /library "Use it" examples and their build-time highlighting (B6, canvas board PageLibrary). Kept out of the
 * .astro frontmatter because a template-literal line that starts with `import` would be hoisted there.
 */
export type TCodeTab = readonly [id: string, label: string, file: string, code: string, note: string];

const ADAPTER_NOTE = 'Each adapter is < 400 B and imports the core, so you get one lock instance.';
const hook = (pkg: string) => `import { useWakeLock } from '@awaketab/wake/${pkg}';

export function KeepAwake() {
  const { state, request, release } = useWakeLock();
  return state === 'held' || state === 'fallback'
    ? <button onClick={release}>Screen awake · Stop</button>
    : <button onClick={request}>Keep screen on</button>;
}`;

export function codeTabs(major: string): TCodeTab[] {
  return [
    [
      'esm',
      'ESM',
      'main.js',
      `import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  pill.textContent = to;            // one of the seven states
  hint.textContent = advice ?? '';  // e.g. 'iframe_no_allow', 'hidden_document'
});
start.addEventListener('click', () => lock.request()); // a tap allows the fallback
stop.addEventListener('click', () => lock.release());`,
      'ESM, for bundlers. Every change event carries the state it left, the state it entered, a reason and an advice code.',
    ],
    [
      'cdn',
      'CDN',
      'index.html',
      `<!-- Once the npm package is published -->
<script src="https://cdn.jsdelivr.net/npm/@awaketab/wake@${major}/dist/awaketab-wake.iife.js"></script>
<script>
  const lock = AwakeTabWake.createWakeLock();
  document.querySelector('#start').addEventListener('click', () => lock.request());
</script>`,
      'CDN, no build step. The IIFE build puts AwakeTabWake on the page.',
    ],
    ['react', 'React', 'KeepAwake.jsx', hook('react'), ADAPTER_NOTE],
    ['preact', 'Preact', 'KeepAwake.jsx', hook('preact'), ADAPTER_NOTE],
    [
      'vue',
      'Vue',
      'KeepAwake.vue',
      `<script setup>
import { useWakeLock } from '@awaketab/wake/vue';
const { state, request, release } = useWakeLock();
</script>

<template>
  <button v-if="state === 'held' || state === 'fallback'" @click="release">Screen awake · Stop</button>
  <button v-else @click="request">Keep screen on</button>
</template>`,
      ADAPTER_NOTE,
    ],
  ];
}

/** Token kinds: c comment · s string · k keyword · t tag; '' is plain text. */
export type TTok = '' | 'c' | 's' | 'k' | 't';

const TOKEN = /(\/\/.*$|<!--.*?-->)|('[^']*'|"[^"]*"|`[^`]*`)|\b(import|from|export|function|const|return|let|await|async|new)\b|(<\/?[A-Za-z][\w-]*|\/?(?<!=)>)/gu;

/** Splits code into lines of [text, kind] segments (the canvas highlighter). */
export function highlight(code: string): Array<Array<[string, TTok]>> {
  return code.split('\n').map((line) => {
    const segs: Array<[string, TTok]> = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
      const at = m.index;
      if (at > last) segs.push([line.slice(last, at), '']);
      segs.push([m[0], m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 't']);
      last = at + m[0].length;
    }
    if (last < line.length) segs.push([line.slice(last), '']);
    return segs;
  });
}
