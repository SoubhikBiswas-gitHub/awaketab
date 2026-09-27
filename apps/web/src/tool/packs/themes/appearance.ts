import type { TPalette, TPattern } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import {
  CUSTOM,
  type ILook,
  isFree,
  lampHex,
  lookFree,
  lampOf,
  LAMPS,
  lookOf,
  ownedLook,
  paintLook,
  PALETTES,
  PATTERNS,
  PRESETS,
  presetLook,
  sameLook,
  themesCss,
  type TLookKind,
  uiCss,
} from './looks.js';
import { fitLamp } from './fit.js';
import { activePreview, endPreview, onPreview, previewLine, startPreview } from './preview.js';

type TPick = TLookKind | 'preset';

const html = document.documentElement;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...kids: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

const label = (kind: TPick, id: string) =>
  t(`settings.${kind === 'accent' ? 'accent' : kind === 'preset' ? 'preset' : kind}.${id}`);

const lookLabel = (look: ILook) =>
  [
    label('palette', look.palette),
    label('accent', lampOf(look.accent).id),
    ...(look.pattern === 'none' ? [] : [label('pattern', look.pattern)]),
  ].join(' · ');

// The look on screen right now (a preview included), read back from <html>.
function displayed(): ILook {
  const d = html.dataset;
  const id = d.accent ?? 'aqua';
  return {
    palette: (d.palette ?? 'clear-night') as TPalette,
    pattern: (d.pattern ?? 'none') as TPattern,
    accent: id === CUSTOM ? html.style.getPropertyValue('--at-custom').trim().toUpperCase() : lampHex(id),
  };
}

function paint(look: ILook): Promise<void> {
  return themesCss().then(() => {
    paintLook(look);
    // The browser bar follows the page ground of the colour theme.
    const ground = getComputedStyle(html).getPropertyValue('--at-ground').trim();
    if (ground) document.querySelector('meta[name="theme-color"]:not([media])')?.setAttribute('content', ground);
  });
}

// A mini scene drawn with the real tokens: ground, pattern, a lamp ring with its bead, and a card with two lines.
function mini(): HTMLElement {
  return h(
    'span',
    { class: 'at-lk-mini', 'aria-hidden': 'true' },
    h('span', { class: 'at-lk-bg' }),
    h('span', { class: 'at-lk-ring' }),
    h('span', { class: 'at-lk-card' }, h('i'), h('i')),
  );
}

interface IOption {
  kind: TPick;
  id: string;
  free: boolean;
  look: () => ILook;
}

export async function mountAppearance(ctx: IToolCtx, host: HTMLElement): Promise<void> {
  // The minis draw every theme, so the gallery needs the themes sheet as well as its own.
  await Promise.all([uiCss(), themesCss()]);
  // The page shows what is kept (boot.js painted it; a lapsed licence may have dropped a part) unless a preview runs.
  if (!activePreview()) paintLook(ownedLook(ctx.store.get().settings, hasFeature(ctx, 'ambient.packs')));
  if (host.dataset.built === undefined) build(ctx, host);
  host.dispatchEvent(new Event('at-sync'));
}

function build(ctx: IToolCtx, host: HTMLElement): void {
  host.dataset.built = '';
  const packs = () => hasFeature(ctx, 'ambient.packs');
  const stored = () => ctx.store.get().settings;
  const options: Array<IOption & { input: HTMLInputElement; scene: HTMLElement; tag: HTMLElement | null }> = [];

  const status = h('p', { class: 'at-lk-status', hidden: '' });
  const statusText = h('span');
  const statusEnd = h('button', { type: 'button', class: 'at-textlink' }, t('settings.preview.endNow'));
  statusEnd.addEventListener('click', () => {
    endPreview(true, 'user');
  });
  status.append(h('span', { class: 'at-pv-dot', 'aria-hidden': 'true' }), statusText, statusEnd);

  const group = (kind: TPick, cls: string, items: Array<Omit<IOption, 'kind'>>) => {
    const id = `lk-${kind}`;
    const box = h('div', { class: `at-lk-group ${cls}`, role: 'radiogroup', 'aria-labelledby': `${id}-l` });
    for (const it of items) {
      const name = label(kind, it.id);
      const input = h('input', {
        class: 'sr-only',
        type: 'radio',
        name: id,
        value: it.id,
        'aria-label': it.free ? name : `${name}, ${t('pro.badge')}`,
      });
      const scene = mini();
      const tag = it.free ? null : h('span', { class: 'at-tag', 'aria-hidden': 'true' }, t('pro.badge'));
      const opt = h(
        'label',
        { class: 'at-lk-opt', 'data-kind': kind, 'data-id': it.id },
        input,
        scene,
        h('span', { class: 'at-lk-name' }, name),
        ...(tag ? [tag] : []),
      );
      box.append(opt);
      options.push({ ...it, kind, input, scene, tag });
    }
    return box;
  };

  const field = (kind: TPick, body: HTMLElement, extra?: HTMLElement) =>
    h(
      'div',
      { class: 'at-field' },
      h(
        'div',
        { class: 'at-field-top' },
        h('span', { class: 'at-label', id: `lk-${kind}-l` }, t(`settings.looks.${kind}`)),
        ...(extra ? [extra] : []),
      ),
      body,
    );

  const presets = group(
    'preset',
    'at-lk-presets',
    PRESETS.map(([id]) => {
      const look = presetLook(id) as ILook;
      return { id, free: lookFree(look), look: () => look };
    }),
  );
  const palettes = group(
    'palette',
    'at-lk-palettes',
    PALETTES.map(([id, free]) => ({ id, free, look: () => ({ ...displayed(), palette: id, pattern: 'none' }) })),
  );
  const lamps = group(
    'accent',
    'at-lk-lamps',
    [...LAMPS.map(([id, , free]) => ({ id, free })), { id: CUSTOM, free: false }].map(({ id, free }) => ({
      id,
      free,
      look: () => ({ ...displayed(), accent: id === CUSTOM ? customHex() : lampHex(id), pattern: 'none' }),
    })),
  );
  const patterns = group(
    'pattern',
    'at-lk-patterns',
    PATTERNS.map(([id, free]) => ({ id, free, look: () => ({ ...displayed(), pattern: id }) })),
  );
  const lampName = h('span', { class: 'at-caption' });
  const note = h('p', { class: 'at-caption' }, t('settings.looks.note'));

  // Custom lamp (Pro): vanilla-colorful's picker, fitted live so every theme keeps AA text and 3:1 rings.
  const picker = h('div', { class: 'at-lk-picker', hidden: '' });
  let lastCustom = '';
  const customHex = () =>
    lastCustom || (lampOf(stored().accent).id === CUSTOM ? lampOf(stored().accent).hex : fitLamp('#3F7FBF'));

  host.append(
    status,
    field('preset', presets),
    field('palette', palettes),
    field('accent', h('div', {}, lamps, picker), lampName),
    field('pattern', patterns),
    note,
  );

  const pick = (kind: TPick, id: string, value?: ILook) => {
    const s = stored();
    const owned = ownedLook(s, packs());
    const look: ILook =
      value ??
      (kind === 'preset'
        ? (presetLook(id) as ILook)
        : { ...owned, [kind]: kind === 'accent' ? (id === CUSTOM ? customHex() : lampHex(id)) : id });
    const free = packs() || (kind === 'preset' ? lookFree(look) : isFree(kind, id));
    if (free) {
      // A free pick (or any pick with Pro) is kept; only what was picked changes in storage.
      const keep = kind === 'preset' ? look : { ...lookOf(s), [kind]: look[kind] };
      const next = { ...s, palette: keep.palette, accent: keep.accent, pattern: keep.pattern };
      ctx.storage.writeSettings(next);
      ctx.store.set({ settings: next });
      const p = activePreview();
      const overlap = !p || p.kind === kind || p.kind === 'preset' || kind === 'preset';
      if (p && overlap) endPreview(false);
      void paint(overlap ? ownedLook(next, packs()) : { ...displayed(), [kind]: look[kind] }).then(sync);
      return;
    }
    const back =
      kind === 'preset' ? lookLabel(owned) : label(kind, kind === 'accent' ? lampOf(owned.accent).id : owned[kind]);
    startPreview(ctx, {
      kind,
      id,
      label: label(kind, id),
      back,
      apply: () => {
        void paint(look).then(sync);
      },
      revert: () => paint(ownedLook(stored(), packs())).then(sync),
    });
    // A custom colour dragged during its own preview repaints without restarting the clock.
    if (id === CUSTOM) void paint(look);
  };

  const sync = () => {
    const now = displayed();
    const theme = html.dataset.theme ?? 'light';
    const pro = packs();
    for (const o of options) {
      const look = o.look();
      paintLook(look, o.scene);
      o.scene.dataset.theme = theme;
      // While the custom picker is open its tile stays the chosen lamp, even before the first drag.
      const chosen = picker.hidden ? lampOf(now.accent).id : CUSTOM;
      const on =
        o.kind === 'preset' ? sameLook(look, now) : o.kind === 'accent' ? chosen === o.id : now[o.kind] === o.id;
      o.input.checked = on;
      if (o.tag) o.tag.hidden = pro;
      o.input.setAttribute(
        'aria-label',
        o.free || pro ? label(o.kind, o.id) : `${label(o.kind, o.id)}, ${t('pro.badge')}`,
      );
    }
    note.hidden = pro;
    const p = activePreview();
    const lamp = label('accent', lampOf(now.accent).id);
    lampName.textContent = p?.kind === 'accent' ? t('settings.lamp.preview', { name: lamp }) : lamp;
    status.hidden = !p;
    statusText.textContent = previewLine();
  };

  host.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || !input.name.startsWith('lk-')) return;
    e.stopPropagation();
    const kind = input.name.slice(3) as TPick;
    if (kind === 'accent' && input.value === CUSTOM) {
      openPicker();
      return;
    }
    picker.hidden = true;
    pick(kind, input.value);
  });
  host.addEventListener('at-sync', sync);
  onPreview(sync);
  new MutationObserver(sync).observe(html, {
    attributeFilter: ['data-theme', 'data-palette', 'data-accent', 'data-pattern'],
  });

  let dirty = false;
  const openPicker = () => {
    picker.hidden = false;
    if (!picker.dataset.built) {
      picker.dataset.built = '';
      void import('./picker.js').then((m) => {
        m.mountPicker(picker, {
          start: customHex(),
          pro: packs,
          change: (hex) => {
            lastCustom = hex;
            dirty = true;
            // With Pro the colour paints live and is kept on "Use this colour"; without, it runs as a preview.
            if (packs()) void paint({ ...displayed(), accent: hex });
            else pick('accent', CUSTOM, { ...ownedLook(stored(), false), accent: hex });
          },
          use: () => {
            dirty = false;
            picker.hidden = true;
            if (packs()) pick('accent', CUSTOM);
            else document.querySelector<HTMLElement>('[data-open-pro]')?.click();
          },
          cancel: () => {
            picker.hidden = true;
            if (dirty && packs()) void paint(ownedLook(stored(), packs())).then(sync);
            else if (activePreview()?.id === CUSTOM) endPreview(true, 'quiet');
            dirty = false;
            sync();
          },
        });
      });
    }
  };
  // With Pro nothing previews: an unsaved custom colour goes back when the sheet closes.
  host.closest('dialog')?.addEventListener('close', () => {
    if (dirty && packs()) void paint(ownedLook(stored(), packs())).then(sync);
    dirty = false;
    picker.hidden = true;
  });
}
