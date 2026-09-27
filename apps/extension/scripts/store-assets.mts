// Store listing images (docs/10 §9): five 1280×800 screenshot placeholders and the 440×280 promo tile,
// rendered with satori + resvg — the same renderer (and pinned versions) the web uses for OG images,
// resolved from apps/web so the extension adds no dependency. Text becomes paths from a bundled font file,
// so output bytes depend only on this script and its inputs: `pnpm -F extension store:assets` twice → same
// files (test/unit/store-assets.test.ts). Real screenshots replace these before submission (Needs Soubhik).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.resolve(ROOT, '../web');
const requireWeb = createRequire(path.join(WEB, 'package.json'));

interface IElement {
  type: string;
  props: Record<string, unknown> & { style?: Record<string, string | number>; children?: unknown };
}

type TSatori = (el: unknown, opts: { width: number; height: number; fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: 'normal' }> }) => Promise<string>;
type TResvg = new (svg: string, opts: { fitTo: { mode: 'width'; value: number } }) => { render(): { asPng(): Uint8Array } };

const el = (type: string, style: Record<string, string | number>, children?: unknown, extra: Record<string, unknown> = {}): IElement => ({
  type,
  props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }), ...extra },
});

const COLORS = { ground: '#FAF7F2', surface: '#FFFFFF', ink: '#1A1A1A', muted: '#5C5C5C', line: '#E3DED6', accent: '#B86E00', tint: '#F6EDE0', indigo: '#2B3A67' };

export interface IShot {
  file: string;
  headline: string;
  caption: string;
  pill: string;
  timer: string;
  extra?: string;
  badge: string;
}

export const SHOTS: IShot[] = [
  { file: 'screenshot-1-held.png', headline: 'Keep your screen awake from the toolbar', caption: 'The pill says Screen awake only while Chrome holds the keep-awake.', pill: 'Screen awake', timer: '24:59', badge: '25m' },
  { file: 'screenshot-2-presets.png', headline: '15 minutes to 4 hours, until a time, or until you stop', caption: 'Presets, until-time and Alt+Shift+A from any tab.', pill: 'Ready', timer: '--:--:--', badge: '' },
  { file: 'screenshot-3-schedules.png', headline: 'Weekly schedules with Pro', caption: 'Weekdays 09:00–18:00. Overlapping windows merge.', pill: 'Screen awake', timer: '5:12:40', extra: 'Started by your schedule', badge: 'ON' },
  { file: 'screenshot-4-web-and-extension.png', headline: 'The web app and the extension, side by side', caption: 'Same vocabulary, same settings, one Pro licence.', pill: 'Screen awake', timer: '00:42', badge: 'ON' },
  { file: 'screenshot-5-honest-limits.png', headline: 'Honest limits', caption: 'Works while Chrome runs. Cannot stop lid-close sleep. Never fakes input.', pill: 'System awake', timer: '1:05:00', extra: 'Screen may dim or lock', badge: 'SYS' },
];

function popupCard(shot: IShot, ring: string): IElement {
  const held = shot.pill !== 'Ready';
  return el(
    'div',
    { flexDirection: 'column', alignItems: 'center', width: 360, padding: 28, gap: 18, background: COLORS.surface, border: `2px solid ${COLORS.line}`, borderRadius: 20 },
    [
      el('div', { width: '100%', fontSize: 22, color: COLORS.ink }, 'AwakeTab'),
      el('div', { position: 'relative', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }, [
        { type: 'img', props: { src: ring, width: 200, height: 200, style: { position: 'absolute', top: 0, left: 0 } } },
        el('div', { fontSize: 32, color: held ? COLORS.ink : COLORS.muted }, shot.timer),
      ]),
      el(
        'div',
        { padding: '10px 22px', borderRadius: 999, fontSize: 22, color: COLORS.ink, border: `2px solid ${held ? COLORS.accent : COLORS.line}`, background: held ? COLORS.tint : COLORS.surface },
        shot.pill,
      ),
      ...(shot.extra ? [el('div', { fontSize: 18, color: COLORS.muted }, shot.extra)] : []),
      el('div', { flexWrap: 'wrap', gap: 8, justifyContent: 'center' }, ['15 min', '30 min', '1 h', '2 h', '4 h', 'Until…'].map((label) => el('div', { padding: '8px 14px', border: `2px solid ${COLORS.line}`, borderRadius: 10, fontSize: 18, color: COLORS.ink }, label))),
    ],
  );
}

export async function renderAll(outDir: string): Promise<Record<string, Uint8Array>> {
  const satori = ((await import(pathToFileURL(requireWeb.resolve('satori')).href)) as { default: TSatori }).default;
  const { Resvg } = (await import(pathToFileURL(requireWeb.resolve('@resvg/resvg-js')).href)) as { Resvg: TResvg };
  const fontBytes = await readFile(path.join(WEB, 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'));
  const font = fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength);
  const ring = `data:image/png;base64,${(await readFile(path.join(ROOT, 'public/icon-128.png'))).toString('base64')}`;
  const fonts = [{ name: 'Inter', data: font, weight: 700, style: 'normal' as const }];
  const png = async (tree: IElement, width: number, height: number) =>
    new Resvg(await satori(tree, { width, height, fonts }), { fitTo: { mode: 'width', value: width } }).render().asPng();

  const out: Record<string, Uint8Array> = {};
  for (const shot of SHOTS) {
    const tree = el(
      'div',
      { width: 1280, height: 800, padding: 80, gap: 64, alignItems: 'center', justifyContent: 'space-between', background: COLORS.ground, fontFamily: 'Inter', color: COLORS.ink },
      [
        el('div', { flexDirection: 'column', gap: 24, width: 640 }, [
          el('div', { fontSize: 26, color: COLORS.muted }, 'AwakeTab for Chrome'),
          el('div', { fontSize: 60, lineHeight: 1.08, letterSpacing: -1.5 }, shot.headline),
          el('div', { fontSize: 28, lineHeight: 1.3, color: COLORS.muted }, shot.caption),
          ...(shot.badge
            ? [el('div', { alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 8, fontSize: 24, color: '#FFFFFF', background: shot.badge === 'SYS' ? COLORS.indigo : COLORS.accent }, shot.badge)]
            : []),
        ]),
        popupCard(shot, ring),
      ],
    );
    out[shot.file] = await png(tree, 1280, 800);
  }
  out['promo-440x280.png'] = await png(
    el('div', { width: 440, height: 280, padding: 32, gap: 24, alignItems: 'center', background: COLORS.ground, fontFamily: 'Inter', color: COLORS.ink }, [
      { type: 'img', props: { src: ring, width: 128, height: 128 } },
      el('div', { flexDirection: 'column', gap: 8, width: 220 }, [el('div', { fontSize: 34 }, 'AwakeTab'), el('div', { fontSize: 18, color: COLORS.muted }, 'Keep your screen awake, honestly.')]),
    ]),
    440,
    280,
  );
  await mkdir(outDir, { recursive: true });
  for (const [file, bytes] of Object.entries(out)) await writeFile(path.join(outDir, file), bytes);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = path.join(ROOT, 'store/images');
  const files = await renderAll(dir);
  process.stdout.write(`${String(Object.keys(files).length)} images → ${path.relative(ROOT, dir)}\n`);
}
