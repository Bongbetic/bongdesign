# 0007. Self-hosted Carbon Storybook, built per pin and served behind the auth wall

Date: 2026-11-07
Status: Accepted
Decided by: user (change request, 2026-11-07)

## Context
Carbon's interactive component playground (react.carbondesignsystem.com) is IBM-hosted. The user wants it self-hosted alongside the docs site, without depending on IBM at runtime.

## Decision
- Build the React Storybook from a scratch copy of `upstream-carbon/packages/react` once per pin, with `IBM_TELEMETRY_DISABLED=true`.
- On that copy, rewrite `@carbon/` import snippets in MDX and docs to `@bongbetic/`, and give the Storybook manager a Bongbetic theme (`brandTitle`, `brandImage` from the glyph). IBM marks are removed from the manager chrome.
- Publish `storybook-static` as a Gitea generic package `bongdesign-storybook/<carbon version>` (public).
- The `Containerfile` downloads it into `storybook/`, and `server.py` serves `/storybook/*` behind the existing session/basic auth wall.

## Options considered
- **Prebuilt static, published to Gitea** (chosen): image builds stay fast and need no yarn monorepo install / one manual build per pin bump
- **Build inside the Containerfile**: always in sync / a full yarn 4 monorepo install on every deploy, needs npmjs/GitHub reachability at build time — not chosen
- **Commit `storybook-static`**: repo-only / tens of MB per pin in git — not chosen

## Consequences
- Pin bumps add a Storybook build-and-publish step (runbook).
- `/storybook/` is a new auth-walled route in `server.py`; its test asserts 401 without a session and 200 with one.

## Sources
- `upstream-carbon/packages/react/package.json` (`storybook:build`)
- `upstream-carbon/packages/react/.storybook/`
