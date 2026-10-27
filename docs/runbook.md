# BongDesign operator runbook

Build, run, Carbon pin-bump, credential rotation, and rollback.
Every command below was executed literally during the T12 offline proof
(clean clone of this branch to /tmp, no IBM or npm reachability);
the evidence log is quoted in the T12 ticket report.
No step here needs a browser, a network namespace, or any external link.

## 1. Offline build (repeatable update path)

Prerequisites: git, Node 24, npm 11, Python 3.12. The npm cache must hold
the locked dependency set once (any single online `npm ci` seeds it;
Coolify and CI persist it via the `setup-node` npm cache). After that
everything below works with no network.

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
bash ../scripts/check-offline.sh   # all five lines must say ok
npm run build                       # writes site/dist/
cd ..
```

What the validator covers: no nested `.git` under `upstream-carbon/`
(the Carbon snapshot travels with the clone), a tarball in `vendor/`
for every pin in `VERSION`, brand assets vendored under
`site/public/branding/` with no remote fetches, and the upstream
snapshot tracked in git.

Cold-cache fallback (documented, not the normal path): `vendor/` holds
the tarballs for the 11 Carbon pins in `VERSION` (file names follow
`<scope>-<name>-<version>.tgz`, e.g. `carbon-react-1.119.0.tgz`), and
`upstream-carbon/` holds the full Carbon source snapshot, so the pinned
Carbon layer can always be re-installed and cross-checked by hand even
if npm and IBM are both unreachable. The remaining locked packages come
from the npm cache seeded as above.

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

Deploy (Coolify): build pack `Containerfile`, port `8000`, healthcheck
path `/health`, domain `design.bongbetic.com`, environment
`BONGDESIGN_USER`, `BONGDESIGN_PASS`, `BONGDESIGN_TOKEN`. Redeploy to
update.

## 3. Carbon pin-bump procedure (pin bump)

Follow these steps precisely. Do not change the pin as part of any
other ticket; a bump is its own commit and redeploy.

1. Pick the new Carbon tag, e.g. `v1.120.0`.
2. In `VERSION`: set `CARBON_TAG` and `PINNED_AT`, and update every
   `@carbon/*=x.y.z` line to the versions the new tag requires.
3. In `site/package.json`: update the pinned `@carbon/react`,
   `@carbon/styles`, `@carbon/icons-react` entries to match `VERSION`.
   Leave the caret (`^`) entries to resolve under the lockfile.
4. Refresh `vendor/`: for each `@carbon/*` line in `VERSION` run
   `npm pack <package>@<version>` and store it as
   `<scope>-<name>-<version>.tgz` (scope without the `@`).
5. Regenerate the index (`npm run generate` in `site/`) and confirm
   `data/components.json` `meta` (`carbonTag`, `count`, `packages`,
   `pinnedAt`) matches the new tag.
6. Run the gates: `bash scripts/check-offline.sh`,
   `cd site && npm run build`, `npm run check:coverage`,
   `python3 -m unittest discover tests`, `python3 scripts/e2e-smoke.py`.
7. Commit as `Bump to <tag>`, push, redeploy Coolify, re-run the
   healthcheck and one MCP `tools/list` call against the live domain.

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
# 2a. Coolify: update the three environment variables, redeploy.
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
# Coolify: redeploy from <good-sha>, then re-run the /health +
# /mcp checks from section 2.
# Local/scratch equivalent:
git status --porcelain         # must be empty before touching history
git reset --hard <good-sha>
cd site && npm ci --offline --no-audit --no-fund && npm run build && cd ..
python3 scripts/e2e-smoke.py
```

If the bad commit is already merged, prefer a forward fix (`git revert
<bad-sha>`) over rewriting history; never force-push shared branches.
