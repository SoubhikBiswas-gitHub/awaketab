import { uaClass } from '../../web/src/lib/analytics';
import { API_ORIGIN } from './license';

export const EXT_EVENTS = ['session_start', 'session_end', 'pro_activated', 'client_error'] as const; // docs/10 §8

const PARAMS: Record<(typeof EXT_EVENTS)[number], readonly string[]> = {
  session_start: ['planType', 'presetId', 'mode'],
  session_end: ['reason', 'durationMin'],
  pro_activated: ['plan'],
  client_error: ['code'],
};

type TFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface ITelemetry {
  track(event: string, params?: Record<string, string | number | boolean>): void;
}

export function createTelemetry(opts: {
  enabled: () => boolean;
  locale: () => string;
  version: string;
  path: string;
  fetchFn?: TFetch;
  now?: () => number;
  ua?: string;
}): ITelemetry {
  const fetchFn = opts.fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const now = opts.now ?? Date.now;
  // Per worker/page lifetime, memory only (docs/00 §10: sid is never persisted).
  const sid = crypto.randomUUID();
  const ua = uaClass(opts.ua ?? (typeof navigator === 'undefined' ? '' : navigator.userAgent));
  return {
    track(event, params = {}) {
      if (!opts.enabled()) return;
      if (!(EXT_EVENTS as readonly string[]).includes(event)) return;
      const allowed = PARAMS[event as (typeof EXT_EVENTS)[number]];
      const row: Record<string, string | number> = {
        event,
        path: opts.path,
        locale: opts.locale(),
        ua,
        source: 'ext',
        sid,
        viewport: 'ext',
        ver: opts.version,
        ts: now(),
      };
      for (const key of allowed) {
        const value = params[key];
        if (typeof value === 'boolean') row[key] = value ? 1 : 0;
        else if (value !== undefined) row[key] = value;
      }
      void fetchFn(`${API_ORIGIN}/api/e`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events: [row] }),
        keepalive: true,
      }).catch(() => undefined);
    },
  };
}
