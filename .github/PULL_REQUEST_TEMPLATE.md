## What changes and why

Describe the user problem, the change and any tradeoffs.

## Linked work

Closes #ISSUE_NUMBER

Link owner-approved issues. Production promotion PRs must list every issue delivered by the changes on `play`.

## How to verify

Give reproducible steps, actual results and any checks not run.

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:seo`
- [ ] `pnpm size`
- [ ] `pnpm test:e2e --project=chromium` when browser behavior changes
- [ ] Tests cover the changed behavior; failures and limitations are explained.
- [ ] Screenshots or a recording show visible changes on desktop and mobile.
- [ ] Keyboard access, light/dark themes and reduced motion were checked where relevant.

## Release notes and risk

What should users know? Describe configuration, migrations and rollback steps, or write “Not applicable”.

## Contribution checklist

- [ ] My change targets `play`, or this is the owner’s promotion from `play` to `main`.
- [ ] The issue was approved by `SoubhikBiswas-gitHub` before implementation.
- [ ] Documentation and tests match the change; no credentials or personal data are included.
- [ ] I understand that merge and deployment are tracked separately.
