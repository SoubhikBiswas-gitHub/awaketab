import type { ILicenseRecord, TLicenseStatus, TPlanId } from './license';

export const LINK_TTL_S = 3 * 365 * 86_400;
export const ORDER_TTL_S = 2 * 365 * 86_400;

export const SUBSCRIPTION_PLANS: ReadonlySet<TPlanId> = new Set<TPlanId>(['pro_yearly', 'biz_embed_site_yearly']);

export interface IPolarIds {
  licenseKeyId?: string | undefined;
  grantId?: string | undefined;
  orderId?: string | undefined;
  subscriptionId?: string | undefined;
  customerId?: string | undefined;
  benefitId?: string | undefined;
}

export interface ILicenseLink {
  keyHashes: string[];
  grantId?: string;
  orderId?: string;
  subscriptionId?: string;
  customerId?: string;
  benefitId?: string;
  pending?: TLicenseStatus;
  at: number;
}

export interface IOrderRecord {
  plan?: TPlanId;
  amountCents?: number;
  currency?: string;
  customerId?: string;
  at?: number;
  lks?: string[];
}

const TERMINAL: ReadonlySet<TLicenseStatus> = new Set<TLicenseStatus>(['revoked', 'refunded']);

export function transition(
  current: TLicenseStatus,
  next: TLicenseStatus,
  onlyFrom?: TLicenseStatus,
): TLicenseStatus | null {
  if (onlyFrom && current !== onlyFrom) return null;
  if (TERMINAL.has(current) && (next === 'active' || next === 'canceled')) return null;
  return current === next ? null : next;
}

function ids(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

async function addToList(kv: KVNamespace, key: string, item: string): Promise<void> {
  let list: string[];
  try {
    list = ids(JSON.parse((await kv.get(key)) ?? '[]'));
  } catch {
    list = [];
  }
  if (list.includes(item)) return;
  list.push(item);
  await kv.put(key, JSON.stringify(list), { expirationTtl: LINK_TTL_S });
}

export async function readLink(kv: KVNamespace, licenseKeyId: string): Promise<ILicenseLink | null> {
  const raw = await kv.get(`lk:${licenseKeyId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ILicenseLink>;
    return { ...parsed, keyHashes: ids(parsed.keyHashes), at: parsed.at ?? 0 };
  } catch {
    return null;
  }
}

export async function readOrder(kv: KVNamespace, orderId: string): Promise<IOrderRecord | null> {
  const raw = await kv.get(`ord:${orderId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IOrderRecord;
  } catch {
    return null;
  }
}

export async function mergeOrder(kv: KVNamespace, orderId: string, patch: IOrderRecord): Promise<void> {
  const existing = (await readOrder(kv, orderId)) ?? {};
  const lks = [...new Set([...ids(existing.lks), ...ids(patch.lks)])];
  const next: IOrderRecord = { ...existing, ...patch };
  if (lks.length > 0) next.lks = lks;
  else delete next.lks;
  await kv.put(`ord:${orderId}`, JSON.stringify(next), { expirationTtl: ORDER_TTL_S });
}

export async function linkLicenseKey(
  kv: KVNamespace,
  licenseKeyId: string,
  found: IPolarIds & { keyHash?: string | undefined; pending?: TLicenseStatus | undefined; clearPending?: boolean },
  now = Date.now(),
): Promise<ILicenseLink> {
  const existing = await readLink(kv, licenseKeyId);
  const link: ILicenseLink = existing ?? { keyHashes: [], at: now };
  if (found.keyHash && !link.keyHashes.includes(found.keyHash)) link.keyHashes.push(found.keyHash);
  for (const field of ['grantId', 'orderId', 'subscriptionId', 'customerId', 'benefitId'] as const) {
    const value = found[field];
    if (value) link[field] = value;
  }
  if (found.pending) {
    const next = transition(link.pending ?? 'active', found.pending);
    if (next) link.pending = next;
    if (link.pending === 'active') delete link.pending;
  }
  // Activation copies `pending` onto the licence record, which is authoritative from then on.
  if (found.clearPending) delete link.pending;
  link.at = now;
  // Always rewritten: each write restarts the TTL.
  await kv.put(`lk:${licenseKeyId}`, JSON.stringify(link), { expirationTtl: LINK_TTL_S });
  if (link.grantId && (await kv.get(`grant:${link.grantId}`)) !== licenseKeyId) {
    await kv.put(`grant:${link.grantId}`, licenseKeyId, { expirationTtl: LINK_TTL_S });
  }
  if (link.subscriptionId) await addToList(kv, `sub:${link.subscriptionId}`, licenseKeyId);
  if (link.orderId) {
    const order = await readOrder(kv, link.orderId);
    if (!order || !ids(order.lks).includes(licenseKeyId)) await mergeOrder(kv, link.orderId, { lks: [licenseKeyId] });
  }
  return link;
}

export function applyIds(record: ILicenseRecord, found: IPolarIds): boolean {
  let changed = false;
  const set = <
    K extends
      'polarLicenseKeyId' | 'polarGrantId' | 'polarOrderId' | 'polarSubscriptionId' | 'customerId' | 'benefitId',
  >(
    field: K,
    value: string | undefined,
  ): void => {
    if (value && record[field] !== value) {
      record[field] = value;
      changed = true;
    }
  };
  set('polarLicenseKeyId', found.licenseKeyId);
  set('polarGrantId', found.grantId);
  set('polarOrderId', found.orderId);
  set('polarSubscriptionId', found.subscriptionId);
  // The customer never changes for a licence; fill it only when missing.
  if (!record.customerId) set('customerId', found.customerId);
  set('benefitId', found.benefitId);
  return changed;
}

export async function licenseKeyIdsFor(kv: KVNamespace, kind: 'grant' | 'sub' | 'ord', id: string): Promise<string[]> {
  if (kind === 'grant') {
    const lk = await kv.get(`grant:${id}`);
    return lk ? [lk] : [];
  }
  if (kind === 'ord') return ids((await readOrder(kv, id))?.lks);
  try {
    return ids(JSON.parse((await kv.get(`sub:${id}`)) ?? '[]'));
  } catch {
    return [];
  }
}
