## Summary

What changes, and why. Link the issue if there is one.

## How I checked it

- [ ] `pnpm format`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm -w test:seo`
- [ ] `pnpm size`
- [ ] If the extension changed: `pnpm -F extension build` and `pnpm test:e2e:ext`
- [ ] If UI behaviour changed: `pnpm test:e2e --project=chromium`

## Design check (for anything people can see)

- [ ] Uses the Clear Night `--at-*` tokens and the shell components only: no new colours, fonts, sizes, spacing or radii
- [ ] Works in light and dark, on a phone and on a desktop, and animations stop with reduced motion
- [ ] Screenshots in light and dark are attached below
- [ ] The seven status pill texts are unchanged, or the docs are updated in this pull request

## Housekeeping

- [ ] Docs updated if a contract changed (`docs/00-conventions.md` first for identifiers)
- [ ] Changelog fragment in `changelog/` if users will notice the change
- [ ] Commit messages and this description are plain English: no internal codes, no AI attribution lines

## Screenshots
