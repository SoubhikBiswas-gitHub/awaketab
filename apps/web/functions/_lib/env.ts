export interface IEnv {
  LICENSES?: KVNamespace;
  EVENTS?: AnalyticsEngineDataset;
  CF_PAGES_COMMIT_SHA?: string;
  RATE_LIMIT_SALT?: string;
  LICENSE_SIGNING_KEY?: string;
  LICENSE_SIGNING_VER?: string;
  LICENSE_KEY_ENC_KEY?: string;
  POLAR_ACCESS_TOKEN?: string;
  POLAR_WEBHOOK_SECRET?: string;
  POLAR_API_BASE?: string;
  POLAR_ORGANIZATION_ID?: string;
  POLAR_BENEFIT_MAP?: string;
  PUBLIC_SITE_URL?: string;
}

export const EVENT_NAMES = [
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
] as const;

export type TEventName = (typeof EVENT_NAMES)[number];
export const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);

export const MAX_BATCH = 20;
export const MAX_BODY_BYTES = 8 * 1024;
export const RATE_WINDOW_S = 120;
export const RATE_MAX = 30;
