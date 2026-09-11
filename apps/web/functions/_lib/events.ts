import { EVENT_NAME_SET, MAX_BATCH, MAX_BODY_BYTES, type IEnv, type TEventName } from './env';

export interface IIncomingEvent {
  event?: unknown;
  path?: unknown;
  locale?: unknown;
  ua?: unknown;
  source?: unknown;
  sid?: unknown;
  viewport?: unknown;
  ver?: unknown;
  ts?: unknown;
  planType?: unknown;
  presetId?: unknown;
  mode?: unknown;
  reason?: unknown;
  from?: unknown;
  to?: unknown;
  plan?: unknown;
  action?: unknown;
  code?: unknown;
  page?: unknown;
  sku?: unknown;
  sponsorId?: unknown;
  durationMin?: unknown;
  addedMin?: unknown;
  stars?: unknown;
  count?: unknown;
}

export interface IAePoint {
  indexes: string[];
  blobs: string[];
  doubles: number[];
}

function str(value: unknown, max = 120): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function attr1(event: TEventName, row: IIncomingEvent): string {
  if (event === 'session_start') return str(row.planType);
  if (event === 'session_end' || event === 'lock_denied') return str(row.reason);
  if (event === 'lock_state') return str(row.from);
  if (event === 'pro_checkout_click' || event === 'pro_activated') return str(row.plan);
  if (event === 'rating_prompt') return str(row.action);
  if (event === 'client_error') return str(row.code);
  if (event === 'ad_slot_loaded') return str(row.page);
  return '';
}

function attr2(event: TEventName, row: IIncomingEvent): string {
  if (event === 'session_start') return str(row.presetId);
  if (event === 'lock_state') return str(row.to);
  if (event === 'pro_checkout_click') return str(row.sku);
  if (event === 'sponsor_view' || event === 'sponsor_click') return str(row.sponsorId);
  return '';
}

function numeric(event: TEventName, row: IIncomingEvent): number {
  if (event === 'session_end') return num(row.durationMin);
  if (event === 'rating_prompt') return num(row.stars);
  return num(row.addedMin) || num(row.count);
}

export function mapEvent(row: IIncomingEvent, serverTs: number): IAePoint | null {
  const event = str(row.event, 40);
  if (!EVENT_NAME_SET.has(event)) return null;
  const name = event as TEventName;
  const clientTs = num(row.ts);
  return {
    indexes: [name],
    blobs: [
      str(row.path, 200).split('?')[0] ?? '',
      str(row.locale, 16),
      str(row.ua, 40),
      str(row.source, 16),
      str(row.sid, 64),
      attr1(name, row),
      attr2(name, row),
      str(row.viewport, 8),
      str(row.ver, 24),
    ],
    doubles: [numeric(name, row), clientTs ? clientTs - serverTs : 0],
  };
}

export async function parseBatch(request: Request): Promise<{ ok: true; events: IIncomingEvent[] } | { ok: false; status: number }> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    const parsed = JSON.parse(raw) as { events?: unknown };
    if (!Array.isArray(parsed.events)) return { ok: false, status: 400 };
    if (parsed.events.length > MAX_BATCH) return { ok: false, status: 413 };
    return { ok: true, events: parsed.events as IIncomingEvent[] };
  } catch {
    return { ok: false, status: 400 };
  }
}

export function writePoints(env: IEnv, points: IAePoint[]): void {
  const ae = env.EVENTS;
  if (!ae) return;
  for (const point of points) ae.writeDataPoint(point);
}
