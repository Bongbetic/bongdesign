# Deploy BongDesign on fatboy

Coolify is no longer used for this site. BongDesign runs on fatboy, the Bongbetic server (Debian 13, rootless Podman with Quadlet, Caddy), and is managed with the `fatboy` CLI. Decision: [ADR 0008](adr/0008-fatboy-hosting-gitea-primary.md).

- Source: Gitea repo `git.bongbetic.com/bongbetic/bongdesign`, branch `main`, public, built from `Containerfile`.
- App: name `bongdesign`, type `git`, container port 8000, health path `/health` (open, no auth).
- URL: `https://design.bongbetic.com`.
- Backups on fatboy are currently off (owner decision). The app is stateless: it has no database and no volume, so a rebuild from git is the recovery path.

Rules that hold for every step:

- Each step that creates an app, adds a hostname or touches secrets needs the owner's yes.
- Never restart or `podman rm` Caddy, and never delete its data volume. Hostnames go through `fatboy domain` only.
- No `:latest` tags. Secrets live only in `/srv/bongdesign/.env` (0600), never in git, chat or command lines.

## Prerequisites

Check that the repo is public and reachable. Expect `200`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://git.bongbetic.com/api/v1/repos/bongbetic/bongdesign
```

Check the DNS A record. Expect `88.99.26.15`. The AAAA record should be `2a01:4f8:10a:251::2`.

```bash
dig +short design.bongbetic.com A
```

Check that SSH to fatboy works as `xavier` (key only).

```bash
ssh fatboy 'fatboy status'
```

## First deploy

Create the app. Owner yes first. The CLI polls `/health` for up to 240 seconds. The app exits at start without credentials, so expect that wait to time out. It is not the final result. Continue to the owner secret step.

```bash
ssh fatboy 'fatboy app new bongdesign --type git --repo https://git.bongbetic.com/bongbetic/bongdesign.git --branch main --port 8000 --health-path /health'
```

Look at the state the timeout left behind.

```bash
ssh fatboy 'fatboy app status bongdesign'
```

Do not delete and recreate the app to clear a timeout. Deleting needs the owner's yes.

## Owner-only secret step

The owner runs this in their own terminal. The agent never sees the values.

```bash
ssh -t fatboy 'fatboy app env bongdesign edit'
```

Enter `BONGDESIGN_USER`, `BONGDESIGN_PASS` and `BONGDESIGN_TOKEN`. Use a long random value for the password and for the token. The token is the MCP bearer token. Saving restarts the app.

Generate a random value in the owner's terminal if needed, then paste it only into the editor.

```bash
openssl rand -base64 32
```

## Domain and TLS

Run this only after the DNS check above returns `88.99.26.15`.

```bash
ssh fatboy 'fatboy domain add design.bongbetic.com bongdesign'
```

The CLI checks that the name resolves to fatboy, writes the Caddy site file, validates and reloads Caddy, then waits for a valid certificate. Certificates come from Let's Encrypt, with ZeroSSL as fallback. If the DNS check fails, the CLI stops and prints the record to add.

## Verify

The CLI's own success message is not proof. Run each check. Use GET, not HEAD: `server.py` has no HEAD handler, so `curl -I` on `/health` returns 404, not 200.

Container up. Expect every container `Up`.

```bash
ssh fatboy 'fatboy app status bongdesign'
```

Startup log. Expect no crash loop, no `OOM` and no missing variable.

```bash
ssh fatboy 'fatboy app logs bongdesign --since 10m'
```

Find the host port. It is the `hostport` line in the app's `app.conf`.

```bash
ssh fatboy "grep '^hostport=' /srv/bongdesign/app.conf"
```

App answers on the server. Replace `<hostport>` with the number from the step above. Expect `200`.

```bash
ssh fatboy 'curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:<hostport>/health'
```

Public health. Expect `200`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://design.bongbetic.com/health
```

HTTP redirects to HTTPS. Expect `301` or `308` with a `Location: https://design.bongbetic.com/` header.

```bash
curl -sI http://design.bongbetic.com/
```

Sign-in gate. Expect `302` to `https://design.bongbetic.com/login`.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://design.bongbetic.com/
```

MCP needs the bearer token. Expect `401`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://design.bongbetic.com/mcp
```

Certificate. Expect a valid certificate, a Let's Encrypt or ZeroSSL issuer, and at least 30 days left.

```bash
echo | openssl s_client -servername design.bongbetic.com -connect design.bongbetic.com:443 2>/dev/null | openssl x509 -noout -issuer -enddate
```

Health timer. Wait up to 5 minutes after the deploy. The bongdesign HTTPS line must say OK, with no FAIL.

```bash
ssh fatboy 'fatboy status'
```

## Update and rollback

Merging to `main` is the ship step. The orchestrator does it with the user's go-ahead. Auto-deploy polls `main` every 2 minutes, builds the new commit, and rolls back on its own if the health check fails.

To deploy now, without waiting for the poll:

```bash
ssh fatboy 'fatboy app deploy bongdesign'
```

Then run the verify checks again, at least the public health check.

To go back one version:

```bash
ssh fatboy 'fatboy app rollback bongdesign'
```

To pause auto-deploy while debugging, and turn it back on afterwards:

```bash
ssh fatboy 'fatboy app autodeploy bongdesign off'
```

```bash
ssh fatboy 'fatboy app autodeploy bongdesign on'
```

## If the build cannot reach git.bongbetic.com

fatboy clones the repo from `git.bongbetic.com` over public HTTPS. That is a hairpin to fatboy's own public IP. A failed build never touches the running app, so the last good version keeps serving. Read the build error first.

```bash
ssh fatboy 'fatboy app logs bongdesign --since 30m'
```

Test the reach from fatboy. Expect `200`.

```bash
ssh fatboy 'curl -sS -o /dev/null -w "%{http_code}\n" https://git.bongbetic.com/api/v1/version'
```

The image build also pulls base images from `docker.io` and npm packages from `registry.npmjs.org` (see `site/package-lock.json`). Those need outbound access from fatboy, not git.bongbetic.com. Test one of them. Expect `200`.

```bash
ssh fatboy 'curl -sS -o /dev/null -w "%{http_code}\n" https://registry.npmjs.org/'
```

ADR 0008 names a fallback: a host-gateway mapping for `git.bongbetic.com` in the build. That is not a documented `fatboy` CLI option. It is a server change, so it needs the owner's yes. Do not edit hosts files, Podman config or the `Containerfile` to work around it without that yes. Do not point the app at GitHub either.

## Mirrors script

`scripts/mirrors.sh` creates Gitea pull mirrors of the Carbon repos under the `bongbetic` owner, every 24 hours. It is an insurance copy. Existing mirrors are skipped, so a re-run is safe.

Print the planned requests. This needs no token and no network.

```bash
bash scripts/mirrors.sh --dry-run
```

For a real run, enter a token with rights to create repos as `bongbetic` at the prompt. It stays out of the command line and the shell history.

```bash
read -rs GITEA_TOKEN
```

```bash
export GITEA_TOKEN
```

```bash
bash scripts/mirrors.sh
```

```bash
unset GITEA_TOKEN
```

## Open items

- The `Containerfile` pins base images by tag (`node:24-slim`, `python:3.12-slim`), not by digest as ADR 0008 and the fatboy rules ask. Fix it before relying on reproducible builds. The `Containerfile` is a shared config file, so the change needs its own review.
- The site still installs `@carbon/*` from npmjs.org. The Bongbetic registry is not in the build yet.
