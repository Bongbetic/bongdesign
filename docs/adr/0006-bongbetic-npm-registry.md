# 0006. Self-hosted `@bongbetic/*` npm registry on Gitea, built by rewriting Carbon tarballs

Date: 2026-11-07
Status: Accepted
Decided by: user (change request, 2026-11-07)
Supersedes: 0003 (vendoring of tarballs in `vendor/` as the only package insurance)

## Context
BongDesign documents Carbon but nothing in it can be installed: apps still pull `@carbon/*` from npmjs.org. That makes every Bongbetic app depend on IBM keeping Carbon published under the same name and licence, and on npmjs.org being reachable. Two IBM runtime touch points ship inside the packages: `@carbon/react` depends on `@ibm/telemetry-js` and runs `ibmtelemetry --config=telemetry.yml` on `postinstall` (reports to `www-api.ibm.com`), and `@carbon/styles` carries an opt-in font CDN path at `https://1.www.s81c.com/common/carbon/plex/fonts/` (`packages/styles/scss/fonts/_src.scss`).

Gitea 1.27.1 already runs at git.bongbetic.com on fatboy (backed up nightly to R2) and has a built-in npm registry. The user asked for the packages to be renamed to Bongbetic, for public read access, and for the full dependency closure to be hosted, so that install and build work with npmjs.org and IBM both unreachable.

## Decision
1. **Registry:** Gitea's npm registry, owner `bongbetic`: `https://git.bongbetic.com/api/packages/bongbetic/npm/`. Public read. Publishing needs a token held only by the publisher (laptop env or a Gitea Actions secret).
2. **Package set:** every non-private package under `upstream-carbon/packages/*` at the pinned snapshot, at the snapshot's exact versions. The set is computed, never hand-listed.
3. **Rename by tarball rewrite:** the original npm tarballs are rewritten deterministically by `scripts/registry/rebrand.mjs`:
   - `@carbon/<x>` becomes `@bongbetic/<x>` and `@ibm/plex*` becomes `@bongbetic/plex*`, in `package.json` names and dependency keys and in every module specifier in JS, type declarations, SCSS and CSS.
   - `@ibm/telemetry-js`, the `postinstall` script and `telemetry.yml` are removed.
   - The s81c font CDN URL points at `https://design.bongbetic.com/fonts/plex/`.
   - A `NOTICE` records IBM's copyright and the modifications (Apache-2.0 §4).
   - Versions are unchanged, so `@bongbetic/react@1.119.0` is Carbon `1.119.0`.
   - Not changed: the `cds--` class prefix, `--cds-` custom properties, font-family names and font files. IBM Plex is OFL with Reserved Font Name "Plex", so the files ship unmodified.
4. **Full closure:** a closure project (`registry/closure/`) locks every package needed to install and build a Bongbetic app, including build tooling (vite, `@vitejs/plugin-react`, sass) and every optional platform binary listed in the lockfile. Third-party packages are published unchanged under their own names.
5. **What git holds:** `registry/closure.lock.json` records name, version, upstream integrity and rebranded integrity. Tarballs are not committed: the closure is too large for git, and Gitea's package store is the copy of record, inside fatboy's nightly backup. `vendor/` keeps its 11 original tarballs as a second copy of the pinned Carbon layer.
6. **Bongbetic-owned packages:** `@bongbetic/brand` (logos, header, accent token), `@bongbetic/design` (umbrella) and `@bongbetic/create-design` (npx scaffolder) live in `packages/` and publish to the same registry.

## Options considered
- **Tarball rewrite, Gitea registry** (chosen): exact upstream compiled code, fast and reproducible, no new service / renamed packages need the rewrite re-run on every pin bump
- **Build the Carbon monorepo from source**: true fork / yarn 4 + lerna + nx with thousands of deps per bump — not chosen; `upstream-carbon/` stays as source insurance should a real fork ever be needed
- **Mirror `@carbon/*` unchanged**: zero rewrite / not Bongbetic-branded and keeps IBM's telemetry — not chosen by the user
- **Verdaccio**: proxies npmjs automatically / one more service to run and back up — not chosen because Gitea already runs and is backed up
- **Commit all tarballs**: repo-only insurance / hundreds of MB in git — not chosen; Gitea + R2 backup hold them

## Consequences
- Consumers add one line: `@bongbetic:registry=https://git.bongbetic.com/api/packages/bongbetic/npm/` (normal mode). They can set `registry=` to the same URL (sovereign mode) to cut npmjs out entirely.
- A pin bump re-runs closure → fetch → rebrand → publish. Publishing skips versions already present.
- Because versions match upstream, a faulty rebranded version can only be replaced by deleting it in Gitea and republishing (runbook).
- The rebrand post-check fails the run on any surviving `@carbon/`/`@ibm/` specifier, `ibmtelemetry`, or IBM host in a URL.
- The offline proof (SC-4) moves from "npm cache seeded from npmjs" to "sovereign install from Gitea".

## Sources
- `upstream-carbon/packages/react/package.json` (`postinstall`, `@ibm/telemetry-js`)
- `upstream-carbon/packages/styles/scss/fonts/_src.scss`, `scss/_config.scss` (`$font-path`, `$use-akamai-cdn`)
- Gitea npm package registry documentation (owner-scoped endpoint `/api/packages/{owner}/npm/`)
