import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { vi } from 'vitest';

import type { IEnv } from '../../functions/_lib/env';

export const DAY_MS = 86_400_000;
export const TEST_IP = '203.0.113.77';
export const SITE = 'https://awaketab.com';

export const BENEFITS = {
  yearly: 'benefit_pro_yearly',
  lifetime: 'benefit_pro_lifetime',
  kiosk: 'benefit_kiosk_site',
  unmapped: 'benefit_not_in_map',
} as const;

// ---------------------------------------------------------------------------
// .dev.vars.example
// ---------------------------------------------------------------------------

let cachedVars: Record<string, string> | null = null;

export function devVars(): Record<string, string> {
  if (cachedVars) return cachedVars;
  const file = fileURLToPath(new URL('../../.dev.vars.example', import.meta.url));
  const vars: Record<string, string> = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  cachedVars = vars;
  return vars;
}

// ---------------------------------------------------------------------------
// KV
// ---------------------------------------------------------------------------

export interface IKvWrite {
  op: 'put' | 'delete';
  key: string;
  value?: string;
  expirationTtl?: number;
}

const encoder = new TextEncoder();

function assertKvKey(key: string): void {
  if (typeof key !== 'string' || key.length === 0) throw new TypeError('KV key must be a non-empty string');
  if (key === '.' || key === '..') throw new TypeError(`Illegal KV key "${key}"`);
  if (encoder.encode(key).byteLength > 512) throw new TypeError('KV key exceeds 512 bytes');
}

export class MemoryKv {
  readonly writes: IKvWrite[] = [];
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();
  private readonly failures: Array<(key: string) => boolean> = [];

  failNextPut(match: (key: string) => boolean): void {
    this.failures.push(match);
  }

  private live(key: string): { value: string; expiresAt: number | null } | null {
    const row = this.store.get(key);
    if (!row) return null;
    if (row.expiresAt !== null && row.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return row;
  }

  async get(key: string, type?: string | { type?: string }): Promise<unknown> {
    assertKvKey(key);
    const row = this.live(key);
    if (!row) return null;
    const kind = typeof type === 'string' ? type : (type?.type ?? 'text');
    if (kind === 'json') return JSON.parse(row.value) as unknown;
    if (kind !== 'text') throw new TypeError(`MemoryKv supports text/json reads only (got ${kind})`);
    return row.value;
  }

  async put(key: string, value: unknown, options?: { expirationTtl?: number; expiration?: number }): Promise<void> {
    assertKvKey(key);
    if (typeof value !== 'string') throw new TypeError('MemoryKv: the functions only write string values');
    let expiresAt: number | null = null;
    if (options?.expirationTtl !== undefined) {
      const ttl = options.expirationTtl;
      if (!Number.isFinite(ttl) || ttl < 60) {
        throw new Error(
          `KV PUT failed: 400 Invalid expiration_ttl of ${String(ttl)}. Expiration TTL must be at least 60.`,
        );
      }
      expiresAt = Date.now() + ttl * 1000;
    } else if (options?.expiration !== undefined) {
      if (options.expiration * 1000 < Date.now() + 60_000)
        throw new Error('KV PUT failed: 400 expiration must be >= 60 s ahead');
      expiresAt = options.expiration * 1000;
    }
    const failure = this.failures.findIndex((match) => match(key));
    if (failure >= 0) {
      this.failures.splice(failure, 1);
      throw new Error('KV PUT failed: 500 Internal Server Error (injected)');
    }
    this.writes.push({
      op: 'put',
      key,
      value,
      ...(options?.expirationTtl !== undefined ? { expirationTtl: options.expirationTtl } : {}),
    });
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    assertKvKey(key);
    this.writes.push({ op: 'delete', key });
    this.store.delete(key);
  }

  async list(opts: { prefix?: string } = {}): Promise<{ keys: Array<{ name: string }>; list_complete: true }> {
    return { keys: this.keys(opts.prefix).map((name) => ({ name })), list_complete: true };
  }

  // -- test helpers (bypass the write log) --

  keys(prefix = ''): string[] {
    return [...this.store.keys()].filter((key) => key.startsWith(prefix) && this.live(key)).sort();
  }

  peek(key: string): string | null {
    return this.live(key)?.value ?? null;
  }

  json<T>(key: string): T | null {
    const raw = this.peek(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  seed(key: string, value: unknown): void {
    this.store.set(key, { value: typeof value === 'string' ? value : JSON.stringify(value), expiresAt: null });
  }

  writesTo(prefix: string): IKvWrite[] {
    return this.writes.filter((row) => row.key.startsWith(prefix));
  }
}

// ---------------------------------------------------------------------------
// Analytics Engine
// ---------------------------------------------------------------------------

export interface IAeWrite {
  indexes: string[];
  blobs: string[];
  doubles: number[];
}

export class MemoryAnalytics {
  readonly points: IAeWrite[] = [];

  writeDataPoint(point?: { indexes?: string[]; blobs?: Array<string | null>; doubles?: number[] }): void {
    const indexes = point?.indexes ?? [];
    const blobs = (point?.blobs ?? []).map((blob) => blob ?? '');
    const doubles = point?.doubles ?? [];
    if (indexes.length > 1) throw new Error('Analytics Engine: at most 1 index');
    if (indexes[0] !== undefined && encoder.encode(indexes[0]).byteLength > 96)
      throw new Error('Analytics Engine: index > 96 bytes');
    if (blobs.length > 20) throw new Error('Analytics Engine: at most 20 blobs');
    if (doubles.length > 20) throw new Error('Analytics Engine: at most 20 doubles');
    if (blobs.reduce((sum, blob) => sum + encoder.encode(blob).byteLength, 0) > 16_384) {
      throw new Error('Analytics Engine: blobs exceed 16 KB');
    }
    if (doubles.some((value) => typeof value !== 'number' || Number.isNaN(value)))
      throw new Error('Analytics Engine: doubles must be numbers');
    this.points.push({ indexes: [...indexes], blobs, doubles: [...doubles] });
  }
}

// ---------------------------------------------------------------------------
// Polar sandbox fake
// ---------------------------------------------------------------------------

export interface IPolarKey {
  id: string;
  key: string;
  status: 'granted' | 'revoked' | 'disabled';
  benefitId: string;
  customerId: string;
  orderId: string;
  subscriptionId: string | null;
  grantId: string;
  limit: number;
  expiresAt: string | null;
  activations: Map<string, { label: string; deviceId: string }>;
  grant: 'ready' | 'missing' | 'keyless';
  grantedAt: string;
}

export interface IPolarCheckout {
  status: 'open' | 'expired' | 'confirmed' | 'succeeded' | 'failed';
  customer_id: string | null;
  subscription_id: string | null;
  product_id: string | null;
}

export interface IPolarOrder {
  id: string;
  checkout_id: string | null;
  customer_id: string;
  subscription_id: string | null;
  billing_reason: 'purchase' | 'subscription_create';
  status: 'paid' | 'refunded';
}

export interface IPolarCall {
  method: string;
  path: string;
  query: Record<string, string>;
  body: Record<string, unknown> | null;
  auth: string | null;
}

let polarSeq = 0;

export class FakePolar {
  readonly calls: IPolarCall[] = [];
  readonly keys = new Map<string, IPolarKey>();
  readonly checkouts = new Map<string, IPolarCheckout>();
  readonly orders = new Map<string, IPolarOrder>();
  outage: 'none' | 'http' | 'network' = 'none';
  failPath: string | null = null;

  constructor(
    private readonly token: string,
    private readonly organizationId: string,
  ) {}

  addKey(key: string, init: Partial<Omit<IPolarKey, 'key' | 'activations'>> = {}): IPolarKey {
    polarSeq += 1;
    const n = String(polarSeq);
    const row: IPolarKey = {
      id: `lk_${n}`,
      key,
      status: 'granted',
      benefitId: BENEFITS.yearly,
      customerId: 'cus_test_1',
      orderId: `ord_${n}`,
      subscriptionId: init.benefitId === undefined || init.benefitId === BENEFITS.yearly ? `sub_${n}` : null,
      grantId: `grant_${n}`,
      limit: 5,
      expiresAt: new Date(Date.now() + 200 * DAY_MS).toISOString(),
      activations: new Map(),
      grant: 'ready',
      grantedAt: new Date(Date.now() + polarSeq).toISOString(),
      ...init,
    };
    this.keys.set(key, row);
    return row;
  }

  addCheckout(row: IPolarKey, opts: { id?: string; status?: IPolarCheckout['status']; order?: boolean } = {}): string {
    polarSeq += 1;
    const id = opts.id ?? `chk_${String(polarSeq)}`;
    this.checkouts.set(id, {
      status: opts.status ?? 'succeeded',
      customer_id: row.customerId,
      subscription_id: row.subscriptionId,
      product_id: 'prod_1',
    });
    if (opts.order !== false) {
      this.orders.set(row.orderId, {
        id: row.orderId,
        checkout_id: id,
        customer_id: row.customerId,
        subscription_id: row.subscriptionId,
        billing_reason: row.subscriptionId ? 'subscription_create' : 'purchase',
        status: 'paid',
      });
    }
    return id;
  }

  callsTo(suffix: string): IPolarCall[] {
    return this.calls.filter((call) => call.path.endsWith(suffix));
  }

  private licenseJson(row: IPolarKey): Record<string, unknown> {
    return {
      id: row.id,
      organization_id: this.organizationId,
      customer_id: row.customerId,
      benefit_id: row.benefitId,
      key: row.key,
      display_key: `****-${row.key.slice(-6)}`,
      status: row.status,
      limit_activations: row.limit,
      usage: row.activations.size,
      expires_at: row.expiresAt,
    };
  }

  private grantJson(row: IPolarKey): Record<string, unknown> {
    const granted = row.status === 'granted';
    return {
      id: row.grantId,
      created_at: row.grantedAt,
      modified_at: null,
      granted_at: row.grantedAt,
      is_granted: granted,
      revoked_at: granted ? null : row.grantedAt,
      is_revoked: !granted,
      subscription_id: row.subscriptionId,
      order_id: row.subscriptionId ? null : row.orderId,
      customer_id: row.customerId,
      member_id: null,
      benefit_id: row.benefitId,
      error: null,
      customer: { id: row.customerId },
      member: null,
      benefit: { id: row.benefitId, type: 'license_keys' },
      properties: row.grant === 'keyless' ? {} : { license_key_id: row.id, display_key: `****-${row.key.slice(-6)}` },
    };
  }

  private static list(items: unknown[]): Response {
    return Response.json({ items, pagination: { total_count: items.length, max_page: 1 } });
  }

  private orgMatches(url: URL): boolean {
    const org = url.searchParams.get('organization_id');
    return org === null || org === this.organizationId;
  }

  private get(url: URL): Response {
    const checkout = /^\/v1\/checkouts\/([^/]+)$/u.exec(url.pathname);
    if (checkout) {
      const id = decodeURIComponent(checkout[1] ?? '');
      const row = this.checkouts.get(id);
      return row
        ? Response.json({ id, organization_id: this.organizationId, ...row })
        : Response.json({ error: 'ResourceNotFound' }, { status: 404 });
    }
    if (url.pathname === '/v1/orders/') {
      if (!this.orgMatches(url)) return FakePolar.list([]);
      const checkoutId = url.searchParams.get('checkout_id');
      const customerId = url.searchParams.get('customer_id');
      return FakePolar.list(
        [...this.orders.values()].filter(
          (order) =>
            (checkoutId === null || order.checkout_id === checkoutId) &&
            (customerId === null || order.customer_id === customerId),
        ),
      );
    }
    if (url.pathname === '/v1/benefit-grants/') {
      if (!this.orgMatches(url)) return FakePolar.list([]);
      const customerId = url.searchParams.get('customer_id');
      const isGranted = url.searchParams.get('is_granted');
      const rows = [...this.keys.values()]
        .filter((row) => row.grant !== 'missing' && (customerId === null || row.customerId === customerId))
        .filter((row) => isGranted === null || (row.status === 'granted') === (isGranted === 'true'))
        .sort((a, b) =>
          url.searchParams.get('sorting') === '-created_at'
            ? b.grantedAt.localeCompare(a.grantedAt)
            : a.grantedAt.localeCompare(b.grantedAt),
        );
      return FakePolar.list(rows.map((row) => this.grantJson(row)));
    }
    const licenseKey = /^\/v1\/license-keys\/([^/]+)$/u.exec(url.pathname);
    if (licenseKey) {
      const row = [...this.keys.values()].find((candidate) => candidate.id === decodeURIComponent(licenseKey[1] ?? ''));
      if (!row) return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
      const activations = [...row.activations].map(([id, activation]) => ({
        id,
        license_key_id: row.id,
        label: activation.label,
        meta: { deviceId: activation.deviceId },
      }));
      return Response.json({ ...this.licenseJson(row), activations });
    }
    return new Response('not found', { status: 404 });
  }

  readonly fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    this.calls.push({
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
      auth: headers.get('authorization'),
    });
    if (this.outage === 'network') throw new TypeError('fetch failed');
    if (this.outage === 'http' || this.failPath === url.pathname)
      return new Response('upstream error', { status: 500 });
    if (headers.get('authorization') !== `Bearer ${this.token}`)
      return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (method === 'GET') return this.get(url);
    if (method !== 'POST' || !body) return new Response('not found', { status: 404 });
    if (body.organization_id !== this.organizationId)
      return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
    const row = this.keys.get(String(body.key));
    if (!row) return Response.json({ error: 'ResourceNotFound' }, { status: 404 });

    if (url.pathname === '/v1/customer-portal/license-keys/validate') {
      return Response.json(this.licenseJson(row));
    }
    if (url.pathname === '/v1/customer-portal/license-keys/activate') {
      if (row.status !== 'granted') return Response.json({ error: 'NotPermitted' }, { status: 403 });
      if (row.activations.size >= row.limit)
        return Response.json(
          { error: 'NotPermitted', detail: 'License key activation limit already reached' },
          { status: 403 },
        );
      polarSeq += 1;
      const id = `act_${String(polarSeq)}`;
      const meta = (body.meta ?? {}) as { deviceId?: string };
      row.activations.set(id, { label: String(body.label), deviceId: meta.deviceId ?? '' });
      return Response.json({ id, license_key_id: row.id, label: body.label, meta, license_key: this.licenseJson(row) });
    }
    if (url.pathname === '/v1/customer-portal/license-keys/deactivate') {
      const activationId = String(body.activation_id);
      if (!row.activations.delete(activationId)) return Response.json({ error: 'ResourceNotFound' }, { status: 404 });
      return new Response(null, { status: 204 });
    }
    return new Response('not found', { status: 404 });
  };
}

// ---------------------------------------------------------------------------
// Environment + invocation
// ---------------------------------------------------------------------------

export interface IHarness {
  env: IEnv;
  kv: MemoryKv;
  ae: MemoryAnalytics;
  polar: FakePolar;
}

export function harness(overrides: Partial<Record<keyof IEnv, unknown>> = {}): IHarness {
  const vars = devVars();
  const kv = new MemoryKv();
  const ae = new MemoryAnalytics();
  const token = vars.POLAR_ACCESS_TOKEN ?? '';
  const organizationId = vars.POLAR_ORGANIZATION_ID ?? '';
  const polar = new FakePolar(token, organizationId);
  const env = {
    LICENSES: kv,
    EVENTS: ae,
    CF_PAGES_COMMIT_SHA: '0f5d2d4c0ffee0123456789',
    RATE_LIMIT_SALT: vars.RATE_LIMIT_SALT,
    LICENSE_SIGNING_KEY: vars.LICENSE_SIGNING_KEY,
    LICENSE_SIGNING_VER: vars.LICENSE_SIGNING_VER,
    LICENSE_KEY_ENC_KEY: vars.LICENSE_KEY_ENC_KEY,
    POLAR_ACCESS_TOKEN: token,
    POLAR_WEBHOOK_SECRET: vars.POLAR_WEBHOOK_SECRET,
    POLAR_ORGANIZATION_ID: organizationId,
    PUBLIC_POLAR_SERVER: vars.PUBLIC_POLAR_SERVER,
    POLAR_BENEFIT_MAP: JSON.stringify({
      [BENEFITS.yearly]: 'pro_yearly',
      [BENEFITS.lifetime]: 'pro_lifetime',
      [BENEFITS.kiosk]: 'biz_kiosk_site',
    }),
    PUBLIC_SITE_URL: vars.PUBLIC_SITE_URL,
    ...overrides,
  } as unknown as IEnv;
  vi.stubGlobal('fetch', polar.fetch);
  return { env, kv, ae, polar };
}

type THandler = (context: never) => Response | Promise<Response>;

export async function invoke(handler: THandler, env: IEnv, request: Request): Promise<Response> {
  const pending: Array<Promise<unknown>> = [];
  const context = {
    request,
    env,
    params: {},
    data: {},
    functionPath: new URL(request.url).pathname,
    waitUntil: (promise: Promise<unknown>) => {
      pending.push(promise);
    },
    passThroughOnException: () => undefined,
    next: () => Promise.resolve(new Response('next', { status: 404 })),
  };
  const response = await handler(context as never);
  await Promise.all(pending);
  return response;
}

export function jsonRequest(
  path: string,
  body: unknown,
  opts: { ip?: string | null; headers?: Record<string, string>; method?: string } = {},
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json', ...opts.headers };
  const ip = opts.ip === undefined ? TEST_IP : opts.ip;
  if (ip !== null) headers['cf-connecting-ip'] = ip;
  return new Request(`${SITE}${path}`, {
    method: opts.method ?? 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64uDecode(part: string): string {
  const pad = part.replace(/-/g, '+').replace(/_/g, '/');
  return atob(pad.padEnd(pad.length + ((4 - (pad.length % 4)) % 4), '='));
}

function b64uEncode(text: string): string {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function decodeJwt(token: string): { header: Record<string, unknown>; claims: Record<string, unknown> } {
  const [h = '', p = ''] = token.split('.');
  return {
    header: JSON.parse(b64uDecode(h)) as Record<string, unknown>,
    claims: JSON.parse(b64uDecode(p)) as Record<string, unknown>,
  };
}

export function tamperJwt(token: string, patch: Record<string, unknown>): string {
  const [h = '', , s = ''] = token.split('.');
  const { claims } = decodeJwt(token);
  return `${h}.${b64uEncode(JSON.stringify({ ...claims, ...patch }))}.${s}`;
}

export async function signWebhook(raw: string, id: string, ts: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}.${ts}.${raw}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

export async function webhookRequest(
  payload: unknown,
  opts: { id?: string; ts?: number; secret?: string; signature?: string; omit?: string[]; raw?: string } = {},
): Promise<{ request: Request; id: string }> {
  const id = opts.id ?? `evt_${crypto.randomUUID()}`;
  const ts = String(opts.ts ?? Math.floor(Date.now() / 1000));
  const raw = opts.raw ?? JSON.stringify(payload);
  const signature =
    opts.signature ?? (await signWebhook(raw, id, ts, opts.secret ?? devVars().POLAR_WEBHOOK_SECRET ?? ''));
  const omit = new Set(opts.omit ?? []);
  const headers = new Headers(
    Object.entries({
      'content-type': 'application/json',
      'user-agent': 'polar.sh webhooks',
      'webhook-id': id,
      'webhook-timestamp': ts,
      'webhook-signature': signature,
    }).filter(([name]) => !omit.has(name)),
  );
  return { request: new Request(`${SITE}/api/webhooks/polar`, { method: 'POST', headers, body: raw }), id };
}

// ---------------------------------------------------------------------------
// Polar webhook payloads (D-06)
// ---------------------------------------------------------------------------

export const polarEvents = {
  order(
    type: 'order.created' | 'order.paid' | 'order.updated' | 'order.refunded',
    row: IPolarKey,
    over: Record<string, unknown> = {},
  ) {
    const refunded = type === 'order.refunded';
    return {
      type,
      timestamp: new Date().toISOString(),
      data: {
        id: row.orderId,
        created_at: new Date().toISOString(),
        status: refunded ? 'refunded' : 'paid',
        paid: true,
        net_amount: 1200,
        total_amount: 1200,
        refunded_amount: refunded ? 1200 : 0,
        currency: 'usd',
        billing_reason: row.subscriptionId ? 'subscription_create' : 'purchase',
        customer_id: row.customerId,
        product_id: 'prod_1',
        discount_id: null,
        subscription_id: row.subscriptionId,
        checkout_id: 'chk_1',
        metadata: {},
        customer: { id: row.customerId, email: 'buyer@example.com' },
        product: {
          id: 'prod_1',
          name: 'AwakeTab Pro',
          metadata: { plan: 'pro_yearly' },
          is_recurring: Boolean(row.subscriptionId),
        },
        subscription: null,
        items: [],
        ...over,
      },
    };
  },
  subscription(
    type:
      | 'subscription.created'
      | 'subscription.active'
      | 'subscription.updated'
      | 'subscription.canceled'
      | 'subscription.uncanceled'
      | 'subscription.revoked',
    row: IPolarKey,
    over: Record<string, unknown> = {},
  ) {
    const ended = type === 'subscription.revoked';
    return {
      type,
      timestamp: new Date().toISOString(),
      data: {
        id: row.subscriptionId,
        created_at: new Date().toISOString(),
        amount: 1200,
        currency: 'usd',
        recurring_interval: 'year',
        status: ended ? 'canceled' : 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * DAY_MS).toISOString(),
        cancel_at_period_end: type === 'subscription.canceled',
        canceled_at: type === 'subscription.canceled' || ended ? new Date().toISOString() : null,
        ended_at: ended ? new Date().toISOString() : null,
        customer_id: row.customerId,
        product_id: 'prod_1',
        discount_id: null,
        checkout_id: 'chk_1',
        metadata: {},
        customer: { id: row.customerId, email: 'buyer@example.com' },
        product: {
          id: 'prod_1',
          name: 'AwakeTab Pro',
          metadata: { plan: 'pro_yearly' },
          benefits: [{ id: row.benefitId, type: 'license_keys' }],
        },
        prices: [],
        meters: [],
        ...over,
      },
    };
  },
  refund(type: 'refund.created' | 'refund.updated', row: IPolarKey, over: Record<string, unknown> = {}) {
    return {
      type,
      timestamp: new Date().toISOString(),
      data: {
        id: `refund_${row.orderId}`,
        created_at: new Date().toISOString(),
        metadata: {},
        status: 'succeeded',
        reason: 'customer_request',
        amount: 1200,
        tax_amount: 0,
        currency: 'usd',
        organization_id: 'org_1',
        order_id: row.orderId,
        subscription_id: row.subscriptionId,
        customer_id: row.customerId,
        revoke_benefits: true,
        dispute: null,
        ...over,
      },
    };
  },
  benefitGrant(
    type: 'benefit_grant.created' | 'benefit_grant.updated' | 'benefit_grant.revoked',
    row: IPolarKey,
    over: Record<string, unknown> = {},
  ) {
    const revoked = type === 'benefit_grant.revoked';
    return {
      type,
      timestamp: new Date().toISOString(),
      data: {
        id: row.grantId,
        created_at: new Date().toISOString(),
        granted_at: new Date().toISOString(),
        is_granted: !revoked,
        revoked_at: revoked ? new Date().toISOString() : null,
        is_revoked: revoked,
        subscription_id: row.subscriptionId,
        order_id: row.subscriptionId ? null : row.orderId,
        customer_id: row.customerId,
        benefit_id: row.benefitId,
        customer: { id: row.customerId, email: 'buyer@example.com' },
        benefit: { id: row.benefitId, type: 'license_keys', description: 'AwakeTab Pro licence' },
        properties: { license_key_id: row.id, display_key: `****-${row.key.slice(-6)}` },
        ...over,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Privacy scan
// ---------------------------------------------------------------------------

export async function ipTraces(ip: string, kv: MemoryKv, ae: MemoryAnalytics): Promise<string[]> {
  const needles = [ip, await sha256Hex(ip)];
  const haystacks = [
    ...kv.writes.map((row) => `kv ${row.op} ${row.key} = ${row.value ?? ''}`),
    ...kv.keys().map((key) => `kv key ${key}`),
    ...ae.points.map((point) => `ae ${JSON.stringify(point)}`),
  ];
  return haystacks.filter((text) => needles.some((needle) => text.includes(needle)));
}
