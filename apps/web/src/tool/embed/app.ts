import { textDirection } from '../../i18n/locales';
import {
  createSession,
  createStorage,
  DEFAULT_SETTINGS,
  memoryAdapter,
  planFromPreset,
  planUntil,
  type ISession,
  type ISettings,
  type TPlan,
  type TPresetId,
} from '@awaketab/core';
import { createWakeLock, type TAdviceCode } from '@awaketab/wake';
import { activeElapsed } from '../ambient/logic.js';
import { everySecond } from '../ambient/tick.js';
import type { IToolCtx } from '../ctx.js';
import { remainingOf } from '../format.js';
import { setCatalog, t } from '../i18n.js';
import { chime } from '../signal.js';
import type { IStore } from '../store.js';
import { applyTheme } from '../theme.js';
import { createBridge, type IBridge } from './bridge.js';
import { formatClock } from './clock.js';
import { applyBranding, fetchEmbedConfig } from './config.js';
import { embedAdvice, inIframe, wakeLockPolicy } from './policy.js';
import {
  EMBED_NARROW,
  EMBED_PATH,
  EMBED_VERSION,
  parseEmbedQuery,
  type IEmbedParams,
  type IEmbedState,
  type TEmbedTheme,
  type TPageMessage,
} from './protocol.js';
import { readEmbedSettings, safeLocalStorage, writeEmbedSettings } from './settings.js';

export const EMBED_FIX_URL = 'https://awaketab.com/embed#allow';

const RUNNING = new Set(['held', 'fallback']);
const HTML_LANG: Record<string, string> = { 'pt-br': 'pt-BR', zh: 'zh-Hans' };

const DOT = 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z';
export const PILL_GLYPH: Record<string, string> = {
  lost: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z',
  denied: 'M6 1L11.2 10.5H.8z',
  fallback: 'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
};

// One widget per embedding page: cross-tab lock election (BroadcastChannel('awaketab')) belongs to the app, not
// to widgets on unrelated sites that happen to share the iframe origin's partition.
const QUIET_CHANNEL = {
  postMessage() {},
  addEventListener() {},
  removeEventListener() {},
  close() {},
} as unknown as BroadcastChannel;

function isLive(s: ISession | null): s is ISession {
  return !!s && (s.status === 'active' || s.status === 'paused');
}

export function planFor(params: Pick<IEmbedParams, 'preset' | 'until'>, cmd?: Extract<TPageMessage, { type: 'awaketab:start' }>): {
  plan: TPlan;
  presetId: TPresetId;
} {
  if (cmd?.ms !== undefined) return { plan: { type: 'duration', ms: cmd.ms }, presetId: 'custom' };
  if (cmd?.until) return { plan: planUntil(cmd.until), presetId: 'until' };
  const preset = cmd?.preset ?? params.preset;
  if (preset === 'until') return params.until ? { plan: planUntil(params.until), presetId: 'until' } : { plan: { type: 'indefinite' }, presetId: 'pinf' };
  return { plan: planFromPreset(preset), presetId: preset };
}

const wallTime = (locale: string, at: number) =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(at);

export function digitsFor(input: {
  mode: IEmbedParams['mode'];
  lock: string;
  session: ISession | null;
  params: Pick<IEmbedParams, 'preset' | 'until'>;
  now: number;
  locale: string;
}): { text: string; muted: boolean } {
  const { session, now } = input;
  if (input.mode === 'clock') return { text: wallTime(input.locale, now), muted: !RUNNING.has(input.lock) };
  if (!isLive(session)) {
    const { plan } = planFor(input.params);
    return { text: formatClock(plan.type === 'duration' ? plan.ms : 0), muted: true };
  }
  const running = RUNNING.has(input.lock) && session.status === 'active';
  const ms = session.plan.type === 'indefinite' ? activeElapsed(session, now) : (remainingOf(session, now) ?? 0);
  return { text: formatClock(ms), muted: !running };
}

export interface IEmbedApp {
  readonly bridge: IBridge;
  state(): IEmbedState;
  destroy(): void;
}

export function bootEmbed(root: HTMLElement, win: Window = window): IEmbedApp {
  const doc = root.ownerDocument;
  const params = parseEmbedQuery(win.location.search);
  const catalogs = JSON.parse(root.querySelector('[data-embed-catalogs]')?.textContent ?? '{}') as Record<string, Record<string, string>>;
  setCatalog(catalogs.en ?? {});
  setCatalog(catalogs[params.lang] ?? {});
  const locale = HTML_LANG[params.lang] ?? params.lang;
  doc.documentElement.lang = locale;
  doc.documentElement.dir = textDirection(locale);
  doc.title = t('embed.frame.title');
  root.dataset.size = params.size;
  root.dataset.mode = params.mode;
  for (const node of root.querySelectorAll<HTMLElement>('[data-t]')) node.textContent = t(node.dataset.t ?? '');

  // Theme: `auto` follows the reader's system live (DESIGN.md §9); a command or a licensed scheme can pin it.
  let theme: TEmbedTheme = params.theme;
  const dark = win.matchMedia('(prefers-color-scheme: dark)');
  const onScheme = () => {
    if (theme === 'auto') applyTheme('auto');
  };
  const setTheme = (next: TEmbedTheme) => {
    theme = next;
    applyTheme(next);
  };
  setTheme(theme);
  dark.addEventListener('change', onScheme);

  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const pill = q('[data-pill]');
  const pillText = q('[data-pill-text]');
  const glyph = root.querySelector('[data-pill-glyph]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-embed-toggle]');
  const toggleText = q('[data-embed-toggle-text]');
  const clock = root.querySelector<HTMLButtonElement>('[data-embed-clock]');
  const digits = q('[data-embed-digits]');
  const note = q('[data-embed-note]');
  const hint = q('[data-embed-hint]');
  const foot = q('[data-embed-foot]');
  const notice = q('[data-embed-notice]');
  const noticeText = q('[data-embed-notice-text]');
  const noticeLink = root.querySelector<HTMLAnchorElement>('[data-embed-notice-link]');
  const live = q('[data-embed-live]');

  const storage = safeLocalStorage(win);
  let telemetry = true;
  try {
    const app = JSON.parse(storage?.getItem('at.v1.settings') ?? 'null') as { telemetry?: unknown } | null;
    telemetry = app?.telemetry !== false;
  } catch {
    // unreadable settings: keep the default
  }
  const track = (event: string, p: Record<string, string | number | boolean> = {}) => {
    if (!telemetry) return;
    void import('../../lib/analytics.js').then((m) => {
      m.track(event, p, { telemetry: true, source: 'embed', locale: params.lang, path: EMBED_PATH });
    });
  };

  const settings: ISettings = { ...DEFAULT_SETTINGS, endBehaviour: 'stop' };
  const lock = createWakeLock();
  const engine = createSession({
    lock,
    storage: createStorage(memoryAdapter()),
    channel: QUIET_CHANNEL,
    settings: () => settings,
    track,
  });

  // The end/kitchen-timer chime reuses signal.ts; it needs only the sound setting and the primed AudioContext.
  let audio: AudioContext | undefined;
  const prime = () => {
    if (!audio && 'AudioContext' in win) audio = new AudioContext();
    void audio?.resume();
  };
  const soundCtx = {
    store: { get: () => ({ settings }) } as unknown as IStore,
    audio: () => audio,
  } satisfies Pick<IToolCtx, 'store' | 'audio'>;

  const framed = inIframe(win);
  const policy = wakeLockPolicy(doc);
  let tapNeeded = false;

  const adviceNow = (): TAdviceCode | 'tap' | null => {
    if (framed && policy === false) return 'iframe_no_allow';
    if (lock.state === 'denied') return embedAdvice(lock.advice, policy, win.navigator.userAgent) ?? 'battery_saver';
    if (lock.state === 'unsupported') return tapNeeded ? 'tap' : (lock.advice ?? 'unsupported_browser');
    return null;
  };

  let lastState = '';
  let lastHeight = 0;
  let lastPill = '';
  const bridge = createBridge(win, params.host, (cmd) => {
    if (cmd.type === 'awaketab:stop') stop();
    else if (cmd.type === 'awaketab:theme') setTheme(cmd.theme);
    else void start(cmd);
  });
  // Analytics may use the loader-declared host; licensing only ever uses the verified one (bridge.host).
  const host = bridge.host ?? params.host;

  const state = (): IEmbedState => ({
    lock: lock.state,
    status: engine.session?.status ?? 'inactive',
    endsAt: engine.session?.endsAt ?? null,
    mode: params.mode,
  });

  const fitPill = () => {
    if (params.size !== 'compact' || !pill || !toggle) return;
    const width = root.clientWidth;
    const room = width - 2 * parseFloat(win.getComputedStyle(root).paddingInlineStart || '0') - toggle.offsetWidth - 12;
    root.toggleAttribute('data-long', (width > 0 && width < EMBED_NARROW.compact[0]) || pill.scrollWidth > room);
  };

  const render = () => {
    const now = Date.now();
    const s = engine.session;
    const lockState = lock.state;
    const running = isLive(s);
    const busy = running || lockState === 'requesting';
    const cook = params.mode === 'cook';
    root.dataset.lock = lockState;
    root.toggleAttribute('data-live', lockState === 'held' || lockState === 'requesting' || lockState === 'fallback');
    if (pill) pill.dataset.lock = lockState;
    const label = t(`tool.pill.${lockState}`);
    if (pillText) pillText.textContent = label;
    glyph?.setAttribute('d', PILL_GLYPH[lockState] ?? DOT);
    if (label !== lastPill) {
      lastPill = label;
      fitPill();
    }
    if (toggle && toggleText) {
      const kind = busy ? 'stop' : lockState === 'denied' ? 'retry' : 'start';
      toggle.dataset.kind = kind;
      toggleText.textContent = kind === 'stop' ? t('tool.ring.stop') : kind === 'retry' ? t('tool.advice.retry') : t('embed.start');
    }
    const view = digitsFor({ mode: params.mode, lock: lockState, session: s, params, now, locale });
    if (digits) {
      digits.textContent = view.text;
      digits.classList.toggle('is-muted', view.muted);
    }
    const paused = s?.status === 'paused';
    if (clock) {
      clock.setAttribute('aria-pressed', String(paused));
      const key =
        params.mode === 'clock' ? 'embed.digits.clock' : cook && running ? (paused ? 'embed.digits.resume' : 'embed.digits.pause') : 'embed.digits.start';
      clock.setAttribute('aria-label', t(key, { time: view.text }));
    }
    if (note) {
      note.hidden = params.mode !== 'minimal';
      note.textContent = t(busy ? (params.size === 'compact' ? 'embed.minimal.liveShort' : 'embed.minimal.live') : 'embed.minimal.idle');
    }
    if (hint) {
      // Full size: the line under the digits. Compact keeps it for screen readers only (the digits' label says it).
      // After a denial the notice below carries the fix and the button says Retry, so the line stays empty.
      hint.textContent =
        lockState === 'requesting'
          ? t('embed.meta.requesting')
          : lockState === 'denied' && !busy
            ? ''
            : !busy
            ? t(params.mode === 'clock' ? 'embed.meta.clock' : 'embed.advice.tapToStart')
            : cook
              ? t(paused ? 'embed.cook.resume' : 'embed.cook.pause')
              : t('embed.meta.since', { time: wallTime(locale, s?.startedAt ?? now) });
    }
    if (foot) {
      foot.textContent =
        params.mode === 'clock'
          ? new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
          : t('embed.foot');
    }
    const advice = adviceNow();
    if (notice && noticeText && noticeLink) {
      notice.hidden = advice === null;
      notice.dataset.tone = advice === 'iframe_no_allow' || lockState === 'denied' ? 'bad' : 'lamp';
      noticeText.textContent =
        advice === 'iframe_no_allow'
          ? t('embed.advice.iframe_no_allow')
          : advice === 'tap'
            ? t('embed.advice.tapToStart')
            : advice
              ? t(`tool.advice.${advice}`)
              : '';
      noticeLink.hidden = advice !== 'iframe_no_allow';
    }
    const snapshot = state();
    const key = `${snapshot.lock}|${snapshot.status}|${String(snapshot.endsAt)}`;
    if (key !== lastState) {
      lastState = key;
      bridge.post({ type: 'awaketab:state', ...snapshot });
    }
  };

  async function start(cmd?: Extract<TPageMessage, { type: 'awaketab:start' }>): Promise<void> {
    const { plan, presetId } = planFor(params, cmd);
    const result = await engine.start(plan, { presetId, mode: params.mode, source: 'embed' });
    // A programmatic start (postMessage) cannot play the fallback video without a gesture (docs/11 §3).
    tapNeeded = cmd !== undefined && result === 'unsupported';
    render();
  }
  function stop(): void {
    engine.stop();
    tapNeeded = false;
    render();
  }

  toggle?.addEventListener('click', () => {
    prime();
    if (isLive(engine.session)) stop();
    else void start();
  });
  clock?.addEventListener('click', () => {
    prime();
    const st = engine.session?.status;
    if (params.mode !== 'cook') {
      if (!isLive(engine.session)) void start();
      return;
    }
    if (st === 'active') engine.pause({ keepLock: true });
    else if (st === 'paused') void engine.resume().then(render);
    else void start();
    render();
  });

  const offs: Array<() => void> = [
    engine.on('lock', render),
    engine.on('status', render),
    engine.on('ended', ({ reason }) => {
      if (reason === 'completed') chime(soundCtx, 'end');
      render();
    }),
    everySecond(render),
    () => {
      dark.removeEventListener('change', onScheme);
    },
  ];

  const section = q('[data-embed-timers]');
  if (section && params.mode === 'cook' && params.size === 'full') {
    void import('./timers.js').then((m) => {
      offs.push(
        m.mountTimers(section, {
          read: () => readEmbedSettings(storage).cookTimers,
          write: (list) => {
            writeEmbedSettings(storage, { v: 1, cookTimers: list });
          },
          ensureSession: async () => {
            if (!isLive(engine.session)) await start();
          },
          onFinished: () => {
            chime(soundCtx, 'timer');
          },
          announce: (text) => {
            if (live) live.textContent = text;
          },
        }),
      );
    });
  }

  // The iframe never grows on its own: it asks, and the loader applies (docs/11 §2).
  if ('ResizeObserver' in win) {
    const ro = new ResizeObserver(() => {
      fitPill();
      const height = Math.ceil(root.getBoundingClientRect().height);
      if (height > 0 && height !== lastHeight) {
        lastHeight = height;
        bridge.post({ type: 'awaketab:resize', height });
      }
    });
    ro.observe(root);
    offs.push(() => {
      ro.disconnect();
    });
  }

  void fetchEmbedConfig(bridge.host).then((cfg) => {
    applyBranding(root, cfg);
    if (params.theme === 'auto' && cfg.scheme && cfg.scheme !== 'auto') setTheme(cfg.scheme);
  });

  track('page_view', host ? { host } : {});
  render();
  bridge.post({ type: 'awaketab:ready', version: EMBED_VERSION });

  return {
    bridge,
    state,
    destroy() {
      for (const off of offs) off();
      bridge.dispose();
      engine.destroy();
      lock.destroy();
    },
  };
}

const root = typeof document !== 'undefined' ? document.querySelector<HTMLElement>('#awaketab-embed') : null;
if (root) bootEmbed(root);
