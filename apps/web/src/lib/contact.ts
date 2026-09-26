/**
 * The one public contact address (docs/00 §13.13): support, refunds and "delete my licence data" requests
 * (docs/09 §1 organization support email, docs/14 §10). `/about` and `/privacy` read it from here.
 * Needs Soubhik: Cloudflare Email Routing must forward it before launch (LAUNCH-AUDIT N-01 step 7).
 */
export const CONTACT_EMAIL = 'support@awaketab.com';

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
