# BongDesign operator runbook

Build, run, Carbon pin-bump, credential rotation, and rollback.
Every command below was executed literally during the T12 offline proof
(clean clone of this branch to /tmp, no IBM or npm reachability);
the evidence log is quoted in the T12 ticket report.
No step here needs a browser or an external link, except the registry
in section 1 when the npm cache is cold.

## 1. Offline build (repeatable update path)

Prerequisites: git, Node 24, npm 11, Python 3.12.

Installs come from the Bongbetic Gitea registry,
`https://git.bongbetic.com/api/packages/bongbetic/npm/` (ADR 0006).
`site/.npmrc` sets `registry=` to that URL: sovereign mode, so every
package, third-party ones included, comes from Gitea. The lockfile records
only Gitea URLs; npmjs.org and IBM hosts are never reached. Consumers can
scope the registry to `@bongbetic` instead (normal mode, see the Install page).

The npm cache must hold the locked dependency set once (any single online
`npm ci` seeds it; CI persists it via the `setup-node` npm cache). After
that everything below works with no network.

```bash
git clone --branch <branch> <repo-url> bongdesign
cd bongdesign
git log --oneline -1          # record the exact commit you are building
git status --porcelain        # must be empty: a clean checkout
```

```bash
cd site
npm ci --offline --no-audit --no-fund
```

`--offline` forbids network: npm exits non-zero (and the run stops) if
any locked tarball is missing from the cache instead of reaching out.
Do not drop the flag to "fix" a failure; a failure means the cache or
the vendor insurance below needs attention, not the network.

```bash
bash ../scripts/check-offline.sh   # all six lines must say ok
npm run build                       # writes site/dist/
cd ..
```

What the validator covers: no nested `.git` under `upstream-carbon/`
(the Carbon snapshot travels with the clone), a tarball in `vendor/`
for every pin in `VERSION`, brand assets vendored under
`site/public/branding/` with no remote fetches, the upstream snapshot
tracked in git, and the site lockfile resolving only from
git.bongbetic.com.

Cold-cache fallback (documented, not the normal path): `vendor/` is the
second copy of the original upstream tarballs for the 11 Carbon pins in
`VERSION` (file names follow `<scope>-<name>-<version>.tgz`, e.g.
`carbon-react-1.119.0.tgz`). It is a fallback, not an install source: the
registry is the install source. `upstream-carbon/` holds the full Carbon
source snapshot, so the pinned Carbon layer can always be re-installed
from `vendor/` and cross-checked by hand even if npm and the registry are
both unreachable. Everything else in the lock comes from the npm cache
seeded as above.

### Republishing the registry closure

The registry is filled from `registry/closure/package-lock.json`, the full
install and build closure (ADR 0006):

```bash
python3 scripts/registry/registry.py registry/closure/package-lock.json
```

This needs `GITEA_PUBLISH_TOKEN` set in the environment (publisher's
machine or a CI secret; never in the repository). Add `--dry-run` to list
what would be published without a token. Versions already present are
skipped.

Known non-fetch: `site/src/pages/components.jsx` contains one hyperlink
to this repository. It is a plain anchor, never fetched at build or
server runtime.

## 2. Run

```bash
BONGDESIGN_USER=<user> BONGDESIGN_PASS=<pass> BONGDESIGN_TOKEN=<token> \
PORT=8000 python3 server.py
```

Everything except `/health` and `/login` is locked. Browsers sign in at
`/login`; MCP clients send `Authorization: Bearer <token>` (see
`mcp.json`). Local dev without auth:

```bash
BONGDESIGN_OPEN=1 PORT=8000 python3 server.py
```

Verify a fresh boot:

```bash
python3 scripts/e2e-smoke.py   # boots its own server, checks auth wall +
                               # browsing + full MCP session; exit 0 = green
```

Deploy: see docs/deploy-fatboy.md

## 3. Carbon pin-bump procedure (pin bump)

Follow these steps precisely. Do not change the pin as part of any
other ticket; a bump is its own commit and deploy.

1. Pick the new Carbon tag, e.g. `v1.120.0`.
2. In `VERSION`: set `CARBON_TAG` and `PINNED_AT`, and update every
   `@carbon/*=x.y.z` line to the versions the new tag requires. VERSION
   keeps the upstream names; the registry carries them as `@bongbetic/*`.
3. In `site/package.json`: update the pinned `@bongbetic/react`,
   `@bongbetic/styles`, `@bongbetic/icons-react` entries to match
   `VERSION`. Pins are exact, with no caret.
4. Bump `registry/closure/package.json` to the same versions and republish
   the closure (section 1, "Republishing the registry closure") before
   step 5, so the registry holds every new version the lock will ask for.
5. Regenerate the site lockfile against the registry: `rm site/package-lock.json`,
   then `cd site && npm install --package-lock-only --ignore-scripts --no-audit --no-fund`,
   then `npm ci --no-audit --no-fund`.
6. Refresh `vendor/`: for each `@carbon/*` line in `VERSION` run
   `npm pack <package>@<version>` (the upstream npmjs tarball, not the
   rebranded one) and store it as `<scope>-<name>-<version>.tgz` (scope
   without the `@`).
7. Regenerate the index (`npm run generate` in `site/`) and confirm
   `data/components.json` `meta` (`carbonTag`, `count`, `packages`,
   `pinnedAt`) and `data/packages.json` match the new tag.
8. Run the gates: `bash scripts/check-offline.sh`,
   `cd site && npm run build`, `npm run check:coverage`,
   `python3 -m unittest discover tests`, `python3 scripts/e2e-smoke.py`.
9. Commit as `Bump to <tag>`, push. Deploy: see docs/deploy-fatboy.md.
   Then re-run the healthcheck and one MCP `tools/list` call against the
   live domain.

## 4. Credential rotation

Only these environment variable names carry secrets: `BONGDESIGN_USER`,
`BONGDESIGN_PASS`, `BONGDESIGN_TOKEN`. (`BONGDESIGN_OPEN` and `PORT`
are not secret.) Secrets never enter the repository.

Executed for real in the T12 proof (throwaway values, scratch clone):
boot with `old-token`, confirm MCP `ping` answers 200, restart with
`new-token`, confirm the old token answers 401 and the new one 200.

```bash
# 1. pick new values (example names only; choose strong random strings)
NEW_USER=<new-user> NEW_PASS=<new-pass> NEW_TOKEN=<new-token>
# 2a. Deployed app: set the three variables, then Deploy: see docs/deploy-fatboy.md
# 2b. Local/process: restart with the new values:
BONGDESIGN_USER="$NEW_USER" BONGDESIGN_PASS="$NEW_PASS" \
BONGDESIGN_TOKEN="$NEW_TOKEN" PORT=8000 python3 server.py
# 3. verify: old token -> 401, new token -> 200 on POST /mcp ping;
#    sign in once at /login with the new user/pass (sessions live in
#    server memory, so a restart signs every browser out: expected).
```

## 5. Rollback

Releases are single commits, so rollback is redeploying (or checking
out) the previous good commit, then rebuilding. Walked for real on the
scratch clone with read-only git commands (`git log`, `git status`,
`git rev-parse`, `git show <sha>:VERSION`).

```bash
git log --oneline -5            # find the last good commit <good-sha>
# Deploy: see docs/deploy-fatboy.md (redeploy from <good-sha>), then
# re-run the /health + /mcp checks from section 2.
# Local/scratch equivalent:
git status --porcelain         # must be empty before touching history
git reset --hard <good-sha>
cd site && npm ci --offline --no-audit --no-fund && npm run build && cd ..
python3 scripts/e2e-smoke.py
```

If the bad commit is already merged, prefer a forward fix (`git revert
<bad-sha>`) over rewriting history; never force-push shared branches.
