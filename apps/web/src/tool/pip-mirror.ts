import type { TLockState, TTabMessage } from '@awaketab/core';

// Self-contained on purpose: /pip is a second page entry, and any runtime module it shared with the tool
// island (format.ts, i18n.ts, @awaketab/core constants) would be split into a common chunk that the island
// then loads on its critical path (docs/00 §11: ≤ 15 KB). Only types cross the boundary.
const CHANNEL = 'awaketab'; // = CHANNEL_NAME in @awaketab/core
export const PIP_ADD_MS = 15 * 60_000; // = PIP_ADD_MS in tool/pip.ts

let catalog: Record<string, string> = {};
const t = (key: string): string => catalog[key] ?? key;

function hms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(total / 86400);
  const clock = `${p(Math.floor((total % 86400) / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
  return days > 0 ? `${String(days)}d ${clock}` : clock;
}

type TState = Extract<TTabMessage, { type: 'state' }>;

/** Without a state message for this long the popup says so instead of showing a stale timer. */
export const MIRROR_STALE_MS = 4000;
const LIVE = new Set(['active', 'paused']);

/** Picks the tab to mirror: the newest live session, else the newest snapshot of any tab. */
export function pickOwner(states: Iterable<TState>): TState | null {
  let best: TState | null = null;
  for (const s of states) {
    const better =
      !best ||
      (LIVE.has(s.status) && !LIVE.has(best.status)) ||
      (LIVE.has(s.status) === LIVE.has(best.status) && s.ts > best.ts);
    if (better) best = s;
  }
  return best;
}

/**
 * Timer text for a snapshot, computed locally so a throttled owner tab never freezes the popup. Same maths
 * as format.ts remainingOf(): duration plans add paused time back, until plans count to the wall target.
 */
export function mirrorTime(s: TState, now: number): string {
  if (!LIVE.has(s.status) || s.startedAt === null) return t('tool.timer.indefiniteIdle');
  const pausedMs = s.pausedMs ?? 0;
  const pausing = s.status === 'paused' && s.pausedAt ? now - s.pausedAt : 0;
  if (s.planType === 'indefinite' || s.endsAt === null || s.endsAt === undefined) {
    return hms(now - s.startedAt - pausedMs - pausing);
  }
  if (s.planType === 'until') return hms(s.endsAt - now);
  return hms(s.endsAt - now + pausedMs + pausing);
}

/**
 * The /pip popup (docs/05 §9 fallback for browsers without Document Picture-in-Picture). It owns no wake
 * lock and no session: it mirrors the owning tab's snapshots and posts `intent` messages back. The pill
 * shows the owner's real lock state, so a popup can never claim the screen is awake when it isn't.
 */
export function mountMirror(root: HTMLElement, channel: BroadcastChannel | null = null): () => void {
  const raw = root.querySelector('[data-i18n-catalog]')?.textContent;
  if (raw) catalog = JSON.parse(raw) as Record<string, string>;
  const ch = channel ?? new BroadcastChannel(CHANNEL);
  const tabId = crypto.randomUUID();
  const pill = root.querySelector<HTMLElement>('[data-pill]');
  const pillText = root.querySelector<HTMLElement>('[data-pill-text]');
  const digits = root.querySelector<HTMLElement>('[data-timer-digits]');
  const add = root.querySelector<HTMLButtonElement>('[data-pip-add]');
  const stop = root.querySelector<HTMLButtonElement>('[data-pip-stop]');
  const empty = root.querySelector<HTMLElement>('[data-pip-empty]');
  const states = new Map<string, TState>();
  let lastHeard = 0;

  const paint = () => {
    const now = Date.now();
    const owner = pickOwner(states.values());
    const fresh = owner !== null && now - lastHeard < MIRROR_STALE_MS;
    const lock: TLockState = fresh ? owner.lock : 'idle';
    const live = fresh && LIVE.has(owner.status);
    if (pill) pill.dataset.lock = lock;
    if (pillText) pillText.textContent = t(`tool.pill.${lock}`);
    if (digits) {
      digits.textContent = fresh ? mirrorTime(owner, now) : t('tool.timer.indefiniteIdle');
      digits.classList.toggle('is-muted', !(live && (lock === 'held' || lock === 'fallback')));
    }
    if (stop) stop.hidden = !live;
    if (add) add.hidden = !live || owner.endsAt === null || owner.endsAt === undefined;
    if (empty) empty.hidden = fresh;
  };

  const post = (msg: TTabMessage) => {
    ch.postMessage(msg);
  };
  const intent = (action: 'stop' | 'add') => {
    const owner = pickOwner(states.values());
    if (!owner) return;
    post({ type: 'intent', tabId, ts: Date.now(), target: owner.tabId, action, ...(action === 'add' ? { ms: PIP_ADD_MS } : {}) });
  };

  const onMessage = (ev: MessageEvent<unknown>) => {
    if (!ev.data || typeof ev.data !== 'object') return;
    const msg = ev.data as TTabMessage;
    if (msg.tabId === tabId) return;
    if (msg.type === 'state') {
      states.set(msg.tabId, msg);
      lastHeard = Date.now();
    } else if (msg.type === 'bye') {
      states.delete(msg.tabId);
    } else if (msg.type === 'lock') {
      const known = states.get(msg.tabId);
      if (known) states.set(msg.tabId, { ...known, lock: msg.state, ts: msg.ts });
    }
    paint();
  };
  ch.addEventListener('message', onMessage);
  post({ type: 'hello', tabId, ts: Date.now() });

  const onStop = () => {
    intent('stop');
  };
  const onAdd = () => {
    intent('add');
  };
  stop?.addEventListener('click', onStop);
  add?.addEventListener('click', onAdd);
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') window.close();
    else if (e.key === 'Escape' || (e.key === ' ' && !(e.target instanceof HTMLButtonElement))) {
      e.preventDefault();
      intent('stop');
    }
  };
  window.addEventListener('keydown', onKey);
  const id = window.setInterval(paint, 1000);
  paint();

  return () => {
    window.clearInterval(id);
    window.removeEventListener('keydown', onKey);
    ch.removeEventListener('message', onMessage);
    post({ type: 'bye', tabId, ts: Date.now() });
    if (!channel) ch.close();
  };
}

function start(): void {
  const root = document.querySelector<HTMLElement>('#awaketab-pip');
  if (root) mountMirror(root);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
