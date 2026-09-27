import type { IEnv } from './env';
import { KEY_RE } from './http';
import { planFromBenefit, type createPolar, type IPolarBenefitGrant } from './polar';

export type TCheckoutKey =
  | { kind: 'key'; key: string; subscriptionId: string | null; orderId: string | null; grantId: string; licenseKeyId: string }
  | { kind: 'syncing' }
  | { kind: 'invalid' };

type TPolarClient = ReturnType<typeof createPolar>;

const PENDING_STATUSES: ReadonlySet<string> = new Set(['open', 'confirmed']);

const SYNCING: TCheckoutKey = { kind: 'syncing' };
const INVALID: TCheckoutKey = { kind: 'invalid' };

export async function resolveCheckoutKey(env: IEnv, polar: TPolarClient, checkoutId: string): Promise<TCheckoutKey> {
  const checkout = await polar.checkout(checkoutId);
  if (checkout.status !== 'succeeded') return PENDING_STATUSES.has(checkout.status) ? SYNCING : INVALID;
  const customerId = checkout.customer_id;
  if (!customerId) return SYNCING;

  const subscriptionId = checkout.subscription_id;
  let orderIds = new Set<string>();
  if (!subscriptionId) {
    const orders = await polar.ordersForCheckout(checkout.id);
    orderIds = new Set(orders.filter((row) => row.checkout_id === checkout.id && row.customer_id === customerId).map((row) => row.id));
    if (orderIds.size === 0) return SYNCING;
  }

  // Licence-key grants of THIS purchase: same customer, and the checkout's subscription or one of its orders.
  const ours = (await polar.benefitGrants(customerId)).filter(
    (grant) =>
      grant.customer_id === customerId &&
      !!grant.properties?.license_key_id &&
      (subscriptionId ? grant.subscription_id === subscriptionId : grant.order_id !== null && orderIds.has(grant.order_id)),
  );
  if (ours.length === 0) return SYNCING;
  // A licence key for a benefit POLAR_BENEFIT_MAP does not know unlocks no plan (same answer as the key path).
  const grant = pickGrant(ours.filter((row) => planFromBenefit(env, row.benefit_id) !== null));
  const licenseKeyId = grant?.properties?.license_key_id;
  if (!grant || !licenseKeyId) return INVALID;

  const licenseKey = await polar.licenseKey(licenseKeyId);
  if (!licenseKey) return SYNCING;
  // The key must be the grant's: same customer, same benefit. Anything else is not this checkout's key.
  if (licenseKey.id !== licenseKeyId || licenseKey.customer_id !== customerId || licenseKey.benefit_id !== grant.benefit_id) {
    return INVALID;
  }
  const key = licenseKey.key.trim().toUpperCase();
  if (!KEY_RE.test(key)) return INVALID;
  return {
    kind: 'key',
    key,
    subscriptionId,
    orderId: grant.order_id ?? (orderIds.size === 1 ? ([...orderIds][0] ?? null) : null),
    grantId: grant.id,
    licenseKeyId,
  };
}

function pickGrant(grants: IPolarBenefitGrant[]): IPolarBenefitGrant | null {
  const live = (grant: IPolarBenefitGrant): number => (grant.is_granted && !grant.is_revoked ? 1 : 0);
  const at = (grant: IPolarBenefitGrant): number => Date.parse(grant.granted_at ?? grant.created_at) || 0;
  return [...grants].sort((a, b) => live(b) - live(a) || at(b) - at(a))[0] ?? null;
}
