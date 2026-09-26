const MAX_BATCH = 20;
const MAX_BYTES = 8 * 1024;
const ALLOWED = new Set([
  'page_view',
  'session_start',
  'session_end',
  'lock_state',
  'lock_denied',
  'fallback_used',
  'resume_shown',
  'resume_accepted',
  'pwa_install',
  'pip_open',
  'share_click',
  'pro_view',
  'pro_checkout_click',
  'pro_activated',
  'rating_prompt',
  'extension_click',
  'ad_slot_loaded',
  'sponsor_view',
  'sponsor_click',
  'client_error',
  'session_extend',
  'affiliate_click',
  'rating_submitted',
]);

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

export function uaClass(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent): string {
  const chrome = /Chrome\/(\d+)/u.exec(ua);
  const firefox = /Firefox\/(\d+)/u.exec(ua);
  const safari = /Version\/(\d+).*Safari/u.exec(ua);
  const ios = /iPhone|iPad|iPod/u.test(ua);
  const android = /Android/u.test(ua);
  const mac = /Mac/u.test(ua);
  const win = /Windows/u.test(ua);
  const os = ios ? 'ios' : android ? 'android' : mac ? 'mac' : win ? 'win' : 'other';
  const chromeVer = chrome?.[1] ?? '0';
  const firefoxVer = firefox?.[1] ?? '0';
  const safariVer = safari?.[1] ?? '0';
  if (chrome && !/Edg\//u.test(ua)) return `chrome-${chromeVer}/${os}`;
  if (firefox) return `firefox-${firefoxVer}/${os}`;
  if (safari) return `safari-${safariVer}/${os}`;
  return `other/${os}`;
}

export function viewportClass(width = typeof innerWidth === 'undefined' ? 1024 : innerWidth): string {
  if (width < 640) return 'sm';
  if (width < 1024) return 'md';
  return 'lg';
}

function bindFlush(): void {
  if (hooksBound || typeof document === 'undefined') return;
  hooksBound = true;
  const send = () => {
    void flush(true);
  };
  addEventListener('pagehide', send);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send();
  });
}

export function track(event: string, params: Record<string, string | number | boolean> = {}, opts: ITrackOptions): void {
  if (!opts.telemetry) return;
  if (!ALLOWED.has(event)) return;
  if (event === 'client_error' && !sampleClientError(tabSid())) return;
  bindFlush();
  const row: IAnalyticsEvent = {
    event,
    path: (opts.path ?? (typeof location === 'undefined' ? '/' : location.pathname)).split('?')[0] ?? '/',
    locale: opts.locale,
    ua: uaClass(),
    source: opts.source,
    sid: tabSid(),
    viewport: viewportClass(),
    ver: typeof document === 'undefined' ? 'dev' : (document.documentElement.dataset.ver ?? 'dev'),
    ts: Date.now(),
  };
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'boolean') row[key] = value ? 1 : 0;
    else row[key] = value;
  }
  queue.push(row);
  const encoded = new TextEncoder().encode(JSON.stringify({ events: queue })).length;
  if (queue.length >= MAX_BATCH || encoded >= MAX_BYTES) void flush(true);
  else if (!flushTimer && typeof window !== 'undefined') {
    flushTimer = window.setTimeout(() => {
      flushTimer = 0;
      void flush(false);
    }, 2000);
  }
}

export function bindClientErrors(opts: ITrackOptions): void {
  if (typeof window === 'undefined') return;
  addEventListener('error', () => {
    track('client_error', { code: 'state_mismatch' }, opts);
  });
  addEventListener('unhandledrejection', () => {
    track('client_error', { code: 'state_mismatch' }, opts);
  });
}

export async function flush(useBeacon: boolean): Promise<void> {
  if (!queue.length) return;
  const events = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ events });
  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/e', new Blob([body], { type: 'application/json' }));
    return;
  }
  // Offline or blocked: drop the batch quietly. An unhandled rejection here would be reported as a
  // client_error, queue another flush and fail again.
  await fetch('/api/e', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(
    () => undefined,
  );
}

export const analyticsLimits = { MAX_BATCH, MAX_BYTES };
