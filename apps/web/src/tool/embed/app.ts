/**
 * `/embed/cook` — the AwakeTab Embed iframe app (docs/11 §2–§3, E12-T01). A trimmed island: the real
 * @awaketab/wake lock and @awaketab/core session engine, the seven-state pill, a big timer, Start/Stop, cook
 * mode's tap-to-pause (clock paused, lock kept) and — in the `full` size — up to three kitchen timers. The pill
 * is a projection of the lock state only; a running timer shows only while the lock is `held` or `fallback`.
 */
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
import { formatHms, remainingOf } from '../format.js';
import { setCatalog, t } from '../i18n.js';
import { chime } from '../signal.js';
import type { IStore } from '../store.js';
import { applyTheme } from '../theme.js';
import { createBridge, type IBridge } from './bridge.js';
import { applyBranding, fetchEmbedConfig } from './config.js';
import { embedAdvice, inIframe, wakeLockPolicy } from './policy.js';
import {
  EMBED_PATH,
  EMBED_VERSION,
  parseEmbedQuery,
  type IEmbedParams,
  type IEmbedState,
  type TPageMessage,
} from './protocol.js';
import { readEmbedSettings, safeLocalStorage, writeEmbedSettings } from './settings.js';

/** Where "How to fix" points when the host page dropped `allow="screen-wake-lock"`. */
export const EMBED_FIX_URL = 'https://awaketab.com/embed#allow';

const RUNNING = new Set(['held', 'fallback']);
const HTML_LANG: Record<string, string> = { 'pt-br': 'pt-BR', zh: 'zh-Hans' };

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

/** Plan for a start: explicit command fields win over the widget's configured preset. */
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

/** What the big digits show. Only `held`/`fallback` may show a *running* session timer (docs/00 §5.1). */
export function digitsFor(input: {
  mode: IEmbedParams['mode'];
  lock: string;
  session: ISession | null;
  params: Pick<IEmbedParams, 'preset' | 'until'>;
  now: number;
  locale: string;
}): { text: string; muted: boolean } {
  const { session, now } = input;
  if (input.mode === 'clock') {
    const text = new Intl.DateTimeFormat(input.locale, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(now);
    return { text, muted: !RUNNING.has(input.lock) };
  }
  if (!isLive(session)) {
    const { plan } = planFor(input.params);
    return { text: plan.type === 'duration' ? formatHms(plan.ms) : formatHms(0), muted: true };
  }
  const running = RUNNING.has(input.lock) && session.status === 'active';
  const ms = session.plan.type === 'indefinite' ? activeElapsed(session, now) : (remainingOf(session, now) ?? 0);
  return { text: formatHms(ms), muted: !running };
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
  doc.documentElement.lang = HTML_LANG[params.lang] ?? params.lang;
  doc.documentElement.dir = textDirection(doc.documentElement.lang);
  doc.title = t('embed.frame.title');
  root.dataset.size = params.size;
  root.dataset.mode = params.mode;
  for (const node of root.querySelectorAll<HTMLElement>('[data-t]')) node.textContent = t(node.dataset.t ?? '');
  applyTheme(params.theme);

  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const pill = q('[data-pill]');
  const pillText = q('[data-pill-text]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-embed-toggle]');
  const clock = root.querySelector<HTMLButtonElement>('[data-embed-clock]');
  const digits = q('[data-embed-digits]');
  const hint = q('[data-embed-hint]');
  const notice = q('[data-embed-notice]');
  const noticeText = q('[data-embed-notice-text]');
  const noticeLink = root.querySelector<HTMLAnchorElement>('[data-embed-notice-link]');
  const live = q('[data-embed-live]');
  const attribution = q('[data-embed-attrib]');

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
  const bridge = createBridge(win, params.host, (cmd) => {
    if (cmd.type === 'awaketab:stop') stop();
    else if (cmd.type === 'awaketab:theme') applyTheme(cmd.theme);
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

  const render = () => {
    const now = Date.now();
    const s = engine.session;
    const lockState = lock.state;
    if (pill) pill.dataset.lock = lockState;
    if (pillText) pillText.textContent = t(`tool.pill.${lockState}`);
    const running = isLive(s);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(running));
      toggle.textContent = running ? t('tool.ring.stop') : t('embed.start');
    }
    if (digits) {
      const view = digitsFor({ mode: params.mode, lock: lockState, session: s, params, now, locale: doc.documentElement.lang });
      digits.textContent = view.text;
      digits.classList.toggle('is-muted', view.muted);
    }
    if (clock) clock.setAttribute('aria-pressed', String(s?.status === 'paused'));
    if (hint) {
      hint.hidden = params.mode !== 'cook' || !running;
      hint.textContent = s?.status === 'paused' ? t('ambient.cook.resume') : t('embed.cook.pause');
    }
    const advice = adviceNow();
    if (notice && noticeText && noticeLink) {
      notice.hidden = advice === null;
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
  attribution?.querySelector('a')?.addEventListener('click', () => {
    track('share_click', { target: 'attribution' });
  });

  const offs: Array<() => void> = [
    engine.on('lock', render),
    engine.on('status', render),
    engine.on('ended', ({ reason }) => {
      if (reason === 'completed') chime(soundCtx, 'end');
      render();
    }),
    everySecond(render),
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
    applyBranding(root, attribution, cfg);
    if (params.theme === 'auto' && cfg.scheme && cfg.scheme !== 'auto') applyTheme(cfg.scheme);
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
