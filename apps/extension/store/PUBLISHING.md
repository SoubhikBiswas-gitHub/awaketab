# AwakeTab extension release guide

AwakeTab: Keep Screen Awake is preparing the **1.0.1** artwork update for its first Chrome Web Store release. Version 1.0.0 was submitted on 2026-10-23; it must not be uploaded again. The existing item ID is `kphiinpjmodhjfojkleoigcgiakahfpk`. This guide records the packaging workflow; the publisher dashboard determines submission, review and publication status.

## Release scope

The first release is free: Screen and System keep-awake, timers, until-time sessions, extensions of running timers, toolbar status, keyboard controls, settings and optional end notifications. Pro purchases are disabled. Weekly schedules and auto-start remain licence-gated; do not describe them as free or upload the Pro screenshot for this release.

## Packaging and recovery

Use Node.js 22 and the repository's pnpm 9.15.9. Complete the root README's setup first. From the repository root:

Packaging includes the current working tree, including pending edits. Inspect `git status` and `git diff` before running it, and record the source revision and any pending changes with the release evidence.

```bash
# First release only, while this exact version has never been uploaded:
pnpm -F extension publish:package --current

# Later releases: interactive patch / minor / major selection:
pnpm -F extension publish:package

# Explicit noninteractive choice, or a custom destination:
pnpm -F extension publish:package patch
pnpm -F extension publish:package --current --output-dir /path/to/output
```

The command follows the local packaging convention used by DOM Scanner Pro and Prismwink:

1. Lock against overlapping package runs and refuse to overwrite an existing ZIP.
2. Use `apps/extension/package.json` as the version source; WXT derives the manifest version from it. pnpm's workspace lockfile contains no extension version metadata to change.
3. For a version bump, update the package metadata; `--current` preserves the original bytes.
4. Run extension type checks, extension/core/wake unit and build tests, and the installed-extension browser suite.
5. Build with `PUBLIC_POLAR_SERVER=production`, `PUBLIC_PAYMENTS_ENABLED=0`, no test hooks and no missing-key waiver. The build checks production licence keys and scans the bundle for the development key.
6. Rebuild twice in production mode and compare ZIP hashes. Compare the packaged ZIP with the production build byte for byte, including the root manifest and the product/version identity.
7. Install the ZIP atomically as `~/Desktop/AwakeTab-v<version>.zip` and print its size and SHA-256.

This command creates a local package. It does not upload, submit, publish to npm, commit, push or tag. Review the version change after a successful bump. Before an upload, confirm the version is greater than every version already uploaded to the existing store item, including unpublished drafts. Never reuse `--current` for a version the store has seen.

On validation failure or Ctrl+C, subprocesses stop before version metadata is restored, and temporary archive files are removed. A concurrent metadata edit is preserved and reported rather than overwritten. If the process is forcibly killed or the computer loses power, inspect `git diff` and `.publish-package.lock` before retrying; automatic crash recovery is not implemented. A failed attempt can leave build outputs for its attempted version: use only the final ZIP printed after a successful run.

## Submission kit

- Compiled extension ZIP only: manifest at the root, bundled scripts, locales, fonts, icons and dependency licence notices. Do not upload the repository or the outer handoff bundle as the extension package.
- [Listing copy](listing.md), with a summary that matches the manifest.
- [Reviewer instructions](reviewer-instructions.md) and [privacy form preparation](privacy-disclosures.md).
- `store/images/screenshot-1-popup.png` through `screenshot-4-lengths.png`: 1280×800 PNG screenshots.
- `store/images/promo-440x280.png`: optional small promotional tile.
- `public/icon-128.png`: store icon.

The editable icon source is `public/icon.svg`. It supplies the toolbar PNGs, extension-page marks and store artwork. Regenerate all images with `pnpm -F extension store:assets`; the store canvas uses flat paper backgrounds and keeps the popup controls in their dark product theme. The four free-launch images cover the popup, Screen/System modes, toolbar states and timer lengths.

The fifth screenshot describes Pro auto-start and is excluded from the first free submission. The existing website walkthrough demonstrates the web tool, so do not submit it as an extension demo video.

## Verification and remaining submission work

Keep a verification record with the exact source revision, package version, SHA-256, build flags and test results. Run the free flow against the final production package in a fresh profile: Screen session, System session, toolbar badge, Stop, popup reopen, settings, telemetry off and no optional site permissions by default.

Automated tests establish browser API behavior and accessibility checks. They do not establish that a real display stayed lit through a full idle interval on every operating system. Before submission, record a physical idle/timer check on a target machine, optional notification grant/revocation and the global shortcut. Chrome must remain running; a deliberate lock or closed laptop lid can still sleep.

In the publisher dashboard, verify the signed-in email against the owner's authorized publisher account, developer registration, contact verification, 2-Step Verification and existing item/draft status. Confirm the public homepage, privacy policy and support address work. Upload the correct ZIP, select the current matching productivity/tools category, complete disclosures from the actual implementation, choose distribution and inspect every dashboard warning. Do not infer registration, mailbox delivery, trader status, submission or approval from repository files.

After store approval and publication, put the exact item ID in `apps/web/src/lib/extension.ts` and enable the real store link. Prepare Edge submission separately against its current dashboard requirements.

## Official requirements

- [Prepare the extension and ZIP](https://developer.chrome.com/docs/webstore/prepare)
- [Listing images](https://developer.chrome.com/docs/webstore/images)
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Submission and review](https://developer.chrome.com/docs/webstore/publish)
