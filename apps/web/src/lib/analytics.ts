const MAX_BATCH = 20;
const MAX_BYTES = 8 * 1024;
const ALLOWED = new Set(
  'page_view session_start session_end lock_state lock_denied fallback_used resume_shown resume_accepted pwa_install pip_open share_click pro_view pro_checkout_click pro_activated rating_prompt extension_click ad_slot_loaded sponsor_view sponsor_click client_error session_extend affiliate_click rating_submitted'.split(
    ' ',
  ),
);

export interface IAnalyticsEvent {
  event: string;
  path: string;
  locale: string;
  ua: string;
  source: string;
  sid: string;
  viewport: string;
  ver: string;
  ts: number;
  [key: string]: string | number;
}

export interface ITrackOptions {
  telemetry: boolean;
  source: string;
  locale: string;
  path?: string;
}

let sid: string | null = null;
let queue: IAnalyticsEvent[] = [];
let flushTimer = 0;
let hooksBound = false;

export function resetAnalyticsForTests(): void {
  sid = null;
  queue = [];
  flushTimer = 0;
  hooksBound = false;
}

export function queuedEvents(): IAnalyticsEvent[] {
  return queue;
}

export function sampleClientError(id: string): boolean {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n + id.charCodeAt(i) * (i + 1)) % 10;
  return n === 0;
}

export function tabSid(): string {
  sid ??= crypto.randomUUID();
  return sid;
}

export function uaClass(ua = navigator.userAgent): string {
  const os = /iPhone|iPad|iPod/u.test(ua)
    ? 'ios'
    : /Android/u.test(ua)
      ? 'android'
      : /Mac/u.test(ua)
        ? 'mac'
        : /Windows/u.test(ua)
          ? 'win'
          : 'other';
  const c = !/Edg\//u.test(ua) && /Chrome\/(\d+)/u.exec(ua);
  const f = /Firefox\/(\d+)/u.exec(ua);
  const s = /Version\/(\d+).*Safari/u.exec(ua);
  return `${c ? `chrome-${String(c[1])}` : f ? `firefox-${String(f[1])}` : s ? `safari-${String(s[1])}` : 'other'}/${os}`;
}

export function viewportClass(width = innerWidth): string {
  return width < 640 ? 'sm' : width < 1024 ? 'md' : 'lg';
}

function bindFlush(): void {
  if (hooksBound) return;
  hooksBound = true;
  const send = () => {
    void flush(true);
  };
  addEventListener('pagehide', send);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send();
  });
}

export function track(
  event: string,
  params: Record<string, string | number | boolean> = {},
  opts: ITrackOptions,
): void {
  if (!opts.telemetry) return;
  if (!ALLOWED.has(event)) return;
  if (event === 'client_error' && !sampleClientError(tabSid())) return;
  bindFlush();
  const row: IAnalyticsEvent = {
    event,
    path: (opts.path ?? location.pathname).split('?')[0] ?? '/',
    locale: opts.locale,
    ua: uaClass(),
    source: opts.source,
    sid: tabSid(),
    viewport: viewportClass(),
    ver: document.documentElement.dataset.ver ?? 'dev',
    ts: Date.now(),
  };
  for (const [key, value] of Object.entries(params)) row[key] = typeof value === 'boolean' ? +value : value;
  queue.push(row);
  const encoded = new TextEncoder().encode(JSON.stringify({ events: queue })).length;
  if (queue.length >= MAX_BATCH || encoded >= MAX_BYTES) void flush(true);
  else if (!flushTimer) {
    flushTimer = window.setTimeout(() => {
      flushTimer = 0;
      void flush(false);
    }, 2000);
  }
}

export function bindClientErrors(opts: ITrackOptions): void {
  const report = () => {
    track('client_error', { code: 'state_mismatch' }, opts);
  };
  addEventListener('error', report);
  addEventListener('unhandledrejection', report);
}

export async function flush(useBeacon: boolean): Promise<void> {
  if (!queue.length) return;
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ events });
  if (useBeacon && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/e', new Blob([body], { type: 'application/json' }));
    return;
  }
  // Offline or blocked: drop the batch quietly. An unhandled rejection here would be reported as a
  // client_error, queue another flush and fail again.
  await fetch('/api/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export const analyticsLimits = { MAX_BATCH, MAX_BYTES };
