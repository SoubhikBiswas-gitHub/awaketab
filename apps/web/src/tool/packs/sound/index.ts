import type { ISettings, TFocusSound } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { chime } from '../../signal.js';
import { openDialog } from '../../ui/dialog.js';
import { openSettings } from '../../ui/settings.js';
import { dismiss, toast } from '../../ui/toast.js';
import { liveSession } from '../../ui/view.js';
import type * as Engine from './engine.js';
import type * as Player from './player.js';
import { GENS, isChime, isGen, readFocus, type TGen } from './catalog.js';
import href from './sound.css?url';
import { type ITrack, TRACKS } from './tracks.js';

type TEngine = typeof Engine;
type TPlayer = typeof Player;
type TState = 'idle' | 'loading' | 'playing' | 'paused' | 'tap' | 'error';
type TFocus = ISettings['focusSound'];
export type TSoundAction = 'open' | 'play' | 'end' | 'mount';

const ART: MediaImage[] = [
  { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
];
const BUZZ = [180, 90, 180];

const trackOf = (k: string): ITrack | undefined =>
  k.startsWith('track:') ? TRACKS.find((tr) => `track:${tr.id}` === k) : undefined;

const put = (n: Element | null | undefined, text: string) => {
  if (n && n.textContent !== text) n.textContent = text;
};

function create(ctx: IToolCtx) {
  const { root, store } = ctx;
  const dlg = root.querySelector<HTMLDialogElement>('[data-dialog="sound"]');
  const box = dlg?.querySelector<HTMLElement>('.at-snd') ?? null;
  const css = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  });
  // Chrome and Firefox tie media keys to a playing media element; iOS keeps Web Audio on the speaker path instead.
  const ios =
    /iP(?:hone|ad|od)/u.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/u.test(navigator.userAgent));
  const media = 'mediaSession' in navigator && !ios;
  let state: TState = 'idle';
  let own: AudioContext | undefined;
  let eng: Promise<TEngine> | undefined;
  let ply: Promise<TPlayer> | undefined;
  let ticking = false;
  let asked = false;
  let turn = 0;
  // A five-minute Pro preview keeps its mix and track in memory only; nothing of it reaches storage.
  let pv: Partial<TFocus> | null = null;

  const settings = () => store.get().settings;
  const focus = (): TFocus => ({ ...readFocus(settings()), ...pv });
  const owned = () => hasFeature(ctx, 'sounds.custom');
  const pro = () => !!pv || owned();
  const raw = () => ctx.audio() ?? own;
  const live = () => state === 'playing' || state === 'loading';
  const mixing = (f: TFocus) => pro() && Object.keys(f.mix).length > 0;
  const list = (): TFocusSound[] => ['lofi', ...(pro() ? TRACKS.map((tr) => `track:${tr.id}` as const) : [])];
  const want = (f: TFocus): Partial<Record<TGen, number>> =>
    mixing(f)
      ? Object.fromEntries(GENS.filter((g) => (f.mix[g] ?? 0) > 0).map((g) => [g, f.mix[g] ?? 0]))
      : isGen(f.kind)
        ? { [f.kind]: 1 }
        : {};
  const name = (k: string) => {
    const tr = trackOf(k);
    return tr ? `${tr.title} · ${tr.artist}` : isGen(k) ? t(`tool.sound.kind.${k}`) : t('tool.sound.pick');
  };
  const title = (f: TFocus) =>
    mixing(f) ? t('tool.sound.mixTitle', { n: Object.keys(want(f)).length }) : name(f.kind);

  const save = (patch: Partial<TFocus>) => {
    const cur = settings();
    if (pv) {
      const rest: Partial<TFocus> = { ...patch };
      if (patch.mix) {
        pv.mix = patch.mix;
        delete rest.mix;
      }
      if (patch.kind && trackOf(patch.kind)) {
        pv.kind = patch.kind;
        delete rest.kind;
      } else if (patch.kind) delete pv.kind;
      patch = rest;
    }
    const next: ISettings = { ...cur, focusSound: { ...readFocus(cur), ...patch } };
    ctx.storage.writeSettings(next);
    store.set({ settings: next });
  };

  const engine = async (): Promise<TEngine | null> => {
    const ac = raw();
    if (!ac) return null;
    const e = await (eng ??= import('./engine.js'));
    e.init(ac, media);
    return e;
  };

  // iOS only lets audio start inside the gesture itself, so every tap or key unlocks synchronously.
  const unlock = () => {
    asked = false;
    if (!raw() && 'AudioContext' in window) own = new AudioContext();
    for (const ac of [ctx.audio(), own]) if (ac && ac.state !== 'running') void ac.resume();
  };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  const sub = (f: TFocus): string => {
    if (state === 'playing')
      return mixing(f) && !Object.keys(want(f)).length
        ? t('tool.sound.state.mixEmpty')
        : t(f.stopAtEnd ? 'tool.sound.state.playingEnd' : 'tool.sound.state.playing');
    if (state === 'idle')
      return t(f.kind === 'none' && !mixing(f) ? 'tool.sound.state.idle' : 'tool.sound.state.ready');
    return t(`tool.sound.state.${state}`);
  };

  const paint = () => {
    const f = focus();
    root.dataset.snd = state;
    root.toggleAttribute('data-snd-still', settings().reduceMotion === 'on');
    if (!dlg || !box) return;
    const q = (sel: string) => box.querySelector<HTMLElement>(sel);
    box.dataset.state = state;
    box.toggleAttribute('data-pro', pro());
    box.toggleAttribute('data-pv', !!pv);
    const see = q('[data-snd-see]');
    if (see) see.hidden = !!liveSession(store.get());
    put(q('[data-snd-title]'), title(f));
    put(q('[data-snd-sub]'), sub(f));
    const tg = q('[data-snd="toggle"]');
    tg?.setAttribute(
      'aria-label',
      t(live() ? 'tool.sound.pause' : state === 'tap' ? 'tool.sound.tap' : 'tool.sound.play'),
    );
    const multi = (f.kind === 'lofi' || !!trackOf(f.kind)) && !mixing(f) && list().length > 1;
    for (const n of box.querySelectorAll<HTMLElement>('[data-snd="prev"],[data-snd="next"]')) n.hidden = !multi;
    for (const n of box.querySelectorAll<HTMLElement>('[data-snd-kind],[data-snd-track]'))
      n.setAttribute('aria-pressed', String(!mixing(f) && (n.dataset.sndKind ?? n.dataset.sndTrack) === f.kind));
    const pct = String(Math.round(f.volume * 100));
    const vol = q('[data-snd-vol]');
    if (vol instanceof HTMLInputElement && document.activeElement !== vol) vol.value = pct;
    put(q('[data-snd-vol-out]'), t('settings.battery.value', { percent: pct }));
    const stop = q('[data-snd-stop]');
    if (stop instanceof HTMLInputElement) stop.checked = f.stopAtEnd;
    for (const n of box.querySelectorAll<HTMLInputElement>('input[data-snd-mix]')) {
      const g = n.dataset.sndMix ?? '';
      const v = mixing(f) ? (f.mix[g as TGen] ?? 0) : g === f.kind ? 1 : 0;
      if (document.activeElement !== n) n.value = String(Math.round(v * 100));
    }
  };

  const session = () => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const f = focus();
    const on = state === 'playing' || state === 'paused' || state === 'loading';
    ms.playbackState = state === 'playing' ? 'playing' : on ? 'paused' : 'none';
    ms.metadata = on
      ? new MediaMetadata({ title: title(f), artist: 'AwakeTab', album: t('tool.sound.title'), artwork: ART })
      : null;
    const multi = on && (f.kind === 'lofi' || !!trackOf(f.kind)) && !mixing(f) && list().length > 1;
    const handle = (a: MediaSessionAction, fn: (() => void) | null) => {
      try {
        ms.setActionHandler(a, fn);
      } catch {
        // Older browsers throw for actions they do not know.
      }
    };
    handle('play', on ? () => void play() : null);
    handle('pause', on ? () => void pause() : null);
    handle(
      'stop',
      on
        ? () => {
            const mine = turn + 1;
            void pause().then(() => {
              if (mine === turn) set('idle');
            });
          }
        : null,
    );
    handle(
      'nexttrack',
      multi
        ? () => {
            step(1);
          }
        : null,
    );
    handle(
      'previoustrack',
      multi
        ? () => {
            step(-1);
          }
        : null,
    );
  };

  const set = (next: TState) => {
    state = next;
    paint();
    session();
  };

  const needTap = () => {
    if (asked || dlg?.open) return;
    asked = true;
    toast(store, {
      kind: 'info',
      id: 'sound',
      text: t('tool.sound.tapNote'),
      action: {
        label: t('tool.sound.tap'),
        onClick: () => {
          unlock();
          syncTick();
          if (state === 'tap') void play();
        },
      },
    });
  };

  async function play(): Promise<void> {
    const mine = ++turn;
    let f = focus();
    if (!mixing(f) && ((!isGen(f.kind) && !trackOf(f.kind)) || (trackOf(f.kind) && !pro()))) {
      save({ kind: trackOf(f.kind) ? 'lofi' : 'brown' });
      f = focus();
    }
    set('loading');
    // Safari 17 plays Web Audio through the silent switch only as a playback session.
    const as = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (as) as.type = 'playback';
    const tr = mixing(f) ? undefined : trackOf(f.kind);
    if (tr) {
      void eng?.then((e) => e.fadeOut());
      const p = await (ply ??= import('./player.js'));
      const ok = await p.playTrack(tr.url, f.volume ** 2, () => {
        step(1);
      });
      if (mine === turn) set(ok ? 'playing' : 'error');
      return;
    }
    const e = await engine();
    if (mine !== turn) return;
    if (!e) {
      set('AudioContext' in window ? 'tap' : 'error');
      needTap();
      return;
    }
    if (!(await e.resume())) {
      if (mine === turn) set('tap');
      needTap();
      return;
    }
    if (mine !== turn) return;
    void ply?.then((p) => p.pauseTrack());
    e.levels(want(f), f.volume);
    dismiss(store, 'sound');
    set('playing');
  }

  async function pause(quick = false): Promise<void> {
    turn += 1;
    if (state === 'idle') return;
    set('paused');
    await Promise.all([eng?.then((e) => e.fadeOut(quick)), ply?.then((p) => p.pauseTrack(quick))]);
  }

  function step(dir: 1 | -1): void {
    const l = list();
    const i = l.indexOf(focus().kind);
    save({ kind: l[(i + dir + l.length) % l.length] ?? 'lofi', mix: {} });
    void play();
  }

  const choose = (k: string) => {
    const f = focus();
    if (trackOf(k) && !pro()) return;
    if (k === f.kind && !mixing(f) && live()) {
      void pause();
      return;
    }
    save({ kind: k as TFocusSound, mix: {} });
    void play();
  };

  const remix = (g: TGen, v: number) => {
    if (!pro()) return;
    const f = focus();
    const base: TFocus['mix'] = mixing(f) ? f.mix : isGen(f.kind) ? { [f.kind]: 1 } : {};
    save({ mix: { ...base, [g]: v } });
    if (live())
      void eng?.then((e) => {
        e.levels(want(focus()), f.volume);
      });
    else if (v > 0) void play();
    paint();
  };

  function tryPro(): void {
    void import('../themes/preview.js').then((m) => {
      m.startPreview(ctx, {
        kind: 'sound',
        id: 'mixer',
        label: t('tool.sound.mix.proName'),
        back: t('tool.sound.mix.proBack'),
        apply: () => {
          pv = {};
          paint();
          box?.querySelector<HTMLElement>('input[data-snd-mix]')?.focus();
        },
        revert: () => {
          pv = null;
          if (live()) void (isGen(focus().kind) ? play() : pause());
          paint();
        },
      });
      if (stopPv) return;
      stopPv = m.onPreview(() => {
        put(box?.querySelector('[data-snd-pv]'), pv ? m.previewLine() : '');
        if (!pv) {
          stopPv?.();
          stopPv = undefined;
        }
      });
    });
  }
  let stopPv: (() => void) | undefined;

  function syncTick(): void {
    const s = store.get();
    const on = s.settings.tick && liveSession(s)?.status === 'active' && document.visibilityState === 'visible';
    if (on === ticking) return;
    ticking = on;
    void engine().then(async (e) => {
      if (on && !(e && (await e.resume()))) {
        ticking = false;
        needTap();
        return;
      }
      e?.tick(ticking, s.settings.sound.volume);
    });
  }

  box?.addEventListener('click', (e) => {
    const b =
      e.target instanceof Element ? e.target.closest<HTMLElement>('[data-snd],[data-snd-kind],[data-snd-track]') : null;
    if (!b) return;
    const { snd, sndKind, sndTrack } = b.dataset;
    if (sndKind ?? sndTrack) choose(sndKind ?? sndTrack ?? '');
    else if (snd === 'toggle') void (live() ? pause() : play());
    else if (snd === 'next' || snd === 'prev') step(snd === 'next' ? 1 : -1);
    else if (snd === 'try') tryPro();
  });
  dlg?.querySelector('[data-snd="settings"]')?.addEventListener('click', () => {
    openSettings(ctx, undefined, 'timer');
  });
  box?.addEventListener('input', (e) => {
    const n = e.target;
    if (!(n instanceof HTMLInputElement) || n.type !== 'range') return;
    const v = Number(n.value) / 100;
    if (n.dataset.sndMix) {
      remix(n.dataset.sndMix as TGen, v);
      return;
    }
    put(box.querySelector('[data-snd-vol-out]'), t('settings.battery.value', { percent: n.value }));
    void eng?.then((x) => {
      x.volume(v);
    });
    void ply?.then((p) => {
      p.trackVolume(v ** 2);
    });
  });
  box?.addEventListener('change', (e) => {
    const n = e.target;
    if (!(n instanceof HTMLInputElement)) return;
    if ('sndVol' in n.dataset) save({ volume: Number(n.value) / 100 });
    if ('sndStop' in n.dataset) save({ stopAtEnd: n.checked });
  });

  // The session ending pauses the sound when asked to; the pill and the wake lock never hear about any of this.
  ctx.engine.on('ended', () => {
    if (focus().stopAtEnd && live()) void pause();
  });
  document.addEventListener('visibilitychange', syncTick);
  store.subscribe(() => {
    syncTick();
    if (dlg?.open) paint();
  });
  syncTick();

  return {
    open(el?: Element | null) {
      void css.then(() => {
        paint();
        if (dlg) openDialog(dlg, el);
      });
    },
    preview() {
      const s = settings();
      if (s.vibrate && 'vibrate' in navigator) navigator.vibrate(BUZZ);
      this.end();
    },
    end() {
      const { id, volume } = settings().sound;
      if (!isChime(id)) {
        chime(ctx, 'end');
        return;
      }
      void engine().then(async (e) => {
        if (e && (await e.resume())) e.chime(id, volume);
        else chime(ctx, 'end');
      });
    },
  };
}

let api: ReturnType<typeof create> | null = null;

export function run(ctx: IToolCtx, what: TSoundAction, el?: Element | null): void {
  api ??= create(ctx);
  if (what === 'open') api.open(el);
  else if (what === 'play') api.preview();
  else if (what === 'end') api.end();
}
