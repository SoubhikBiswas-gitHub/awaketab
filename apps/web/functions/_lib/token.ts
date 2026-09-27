import type { IEnv } from './env';
import { parseSigningKey, signES256 } from './jwt';
import { PLAN_FEATURES, type ILicenseRecord, type TPlanId } from './license';

const DAY_S = 86_400;

export function tokenExp(plan: TPlanId, periodEnd: number | null, nowSec: number): number {
  if (plan === 'pro_yearly' || plan === 'biz_embed_site_yearly') {
    return (periodEnd ?? nowSec + 30 * DAY_S) + 7 * DAY_S;
  }
  if (plan === 'pro_lifetime') return nowSec + 90 * DAY_S;
  return nowSec + 365 * DAY_S;
}

export function currentExp(record: ILicenseRecord, nowSec: number): number {
  if (record.plan === 'pro_yearly' || record.plan === 'biz_embed_site_yearly') return record.exp;
  return tokenExp(record.plan, null, nowSec);
}

export async function mintToken(
  env: IEnv,
  record: ILicenseRecord,
  keyHash: string,
  devHash: string,
  nowSec: number,
): Promise<{ token: string; exp: number }> {
  const exp = currentExp(record, nowSec);
  const token = await signES256(
    {
      sub: keyHash,
      plan: record.plan,
      features: PLAN_FEATURES[record.plan],
      dev: devHash,
      iat: nowSec,
      exp,
      ver: Number(env.LICENSE_SIGNING_VER ?? '1'),
    },
    parseSigningKey(env.LICENSE_SIGNING_KEY),
  );
  return { token, exp };
}
