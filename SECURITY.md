# Security policy

AwakeTab is maintained by one person. Reports are welcome and read carefully, and this page says honestly what to expect.

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

- **Email:** [support@awaketab.com](mailto:support@awaketab.com) with "Security" in the subject.
- **Optional:** if it is enabled for this repository, you can also use GitHub's private vulnerability reporting ("Report a vulnerability" under the Security tab).

Useful things to include:

- what is affected (a URL, an endpoint, a file in this repository, or an extension version);
- the steps to reproduce it, and what an attacker gains;
- the browser and operating system, if it matters;
- whether you would like to be credited, and under which name.

Please do not access other people's data, run denial-of-service tests, or use automated scanners at a volume that could affect the live site.

## What to expect

These are aims, not guarantees:

- a reply confirming the report within about a week;
- an assessment and a plan once the problem is reproduced;
- a fix released as soon as is reasonable for its severity, with a note in the changelog;
- credit for your report in the changelog if you want it.

There is no paid bug bounty.

## In scope

| Area | Where it lives |
| --- | --- |
| The website and the tool at awaketab.pages.dev (and awaketab.com once that domain is attached) | `apps/web` |
| Pages Functions: the licence API (`/api/license/activate`, `/validate`, `/deactivate`), the checkout webhook, embed configuration (`/api/embed/config`), and the event, rating and CSP report endpoints | `apps/web/functions` |
| The AwakeTab for Chrome extension | `apps/extension` |
| The `@awaketab/wake` library and the `@awaketab/core` session engine, including licence token verification | `packages/wake`, `packages/core` |
| The embeddable Cook Mode widget (`/embed.js` and `/embed/cook`) | `apps/web/src/tool/embed` |

Examples of what matters most: a way to unlock Pro features without a valid licence token, reading or changing another person's licence activations, script injection through URL parameters or the embed, the extension gaining access it did not ask for, or the status pill claiming the screen is awake when it is not.

## Out of scope

- Services AwakeTab relies on but does not run, such as Cloudflare, Polar (checkout) and the Chrome Web Store. Please report those to their owners.
- The development licence signing key in `apps/web/.dev.vars.example`. It is public on purpose and is only trusted by sandbox builds.
- Purchases in the Polar sandbox. Checkout currently runs in test mode.
- Missing security headers or best-practice findings without a way to exploit them.
- Self-XSS, clickjacking on pages without sensitive actions, and attacks that need a compromised device or browser.
- Denial-of-service and volumetric attacks.
- Operating system or browser limits that AwakeTab already reports, for example a wake lock refused by a site setting.

## Supported versions

Only the current `main` branch, the live website and the latest extension build receive security fixes.
