export interface ILicenseActivation {
  devHash: string;
  label: string;
  at: number;
  polarActivationId?: string;
}

export type TLicenseStatus = 'active' | 'revoked' | 'refunded' | 'expired';

export type TPlanId = 'pro_yearly' | 'pro_lifetime' | 'biz_embed_site_yearly' | 'biz_kiosk_site' | 'biz_kiosk_5';

export type TFeatureId =
  | 'ambient.packs'
  | 'ambient.message'
  | 'ambient.logo'
  | 'schedules'
  | 'sounds.custom'
  | 'stats.history'
  | 'stats.export'
  | 'pip.pro'
  | 'ext.autostart'
  | 'ext.schedules'
  | 'ads.free'
  | 'embed.noattrib'
  | 'kiosk.branding';

export interface ILicenseRecord {
  plan: TPlanId;
  status: TLicenseStatus;
  keyEnc: string;
  polarOrderId: string;
  customerId: string;
  activations: ILicenseActivation[];
  limit: number;
  exp: number;
  createdAt: number;
  updatedAt: number;
}

export const PRO_GATES: TFeatureId[] = [
  'ambient.packs',
  'ambient.message',
  'ambient.logo',
  'schedules',
  'sounds.custom',
  'stats.history',
  'stats.export',
  'pip.pro',
  'ext.autostart',
  'ext.schedules',
  'ads.free',
];

export const PLAN_FEATURES: Record<TPlanId, TFeatureId[]> = {
  pro_yearly: PRO_GATES,
  pro_lifetime: PRO_GATES,
  biz_embed_site_yearly: ['embed.noattrib', 'ads.free'],
  biz_kiosk_site: ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
  biz_kiosk_5: ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
};

const TE = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', TE.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function unb64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export async function encryptUtf8(plain: string, keyB64: string): Promise<string> {
  const raw = unb64(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, TE.encode(plain)));
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv);
  packed.set(ct, iv.length);
  return b64(packed);
}

export async function decryptUtf8(packedB64: string, keyB64: string): Promise<string> {
  const packed = unb64(packedB64);
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const key = await crypto.subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export async function readLicense(kv: KVNamespace, keyHash: string): Promise<ILicenseRecord | null> {
  const raw = await kv.get(`lic:${keyHash}`);
  if (!raw) return null;
  return JSON.parse(raw) as ILicenseRecord;
}

export async function writeLicense(kv: KVNamespace, keyHash: string, record: ILicenseRecord, ttlSec?: number): Promise<void> {
  await kv.put(`lic:${keyHash}`, JSON.stringify(record), ttlSec ? { expirationTtl: ttlSec } : undefined);
}

export function publicActivations(record: ILicenseRecord): Array<{ label: string; at: number; devHash: string }> {
  return record.activations.map((row) => ({ label: row.label, at: row.at, devHash: row.devHash }));
}
