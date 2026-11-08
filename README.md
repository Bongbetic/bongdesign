# BongDesign — self-hosted Carbon design system

Own-repo snapshot of IBM Carbon, pinned to upstream
[carbon `v1.119.0`](https://github.com/carbon-design-system/carbon).
No fork metadata. Manual updates on each new release.

BongDesign gives the Bongbetic team three things:

- Gallery: `https://design.bongbetic.com`, the Carbon components, tokens and icons.
- MCP server: `https://design.bongbetic.com/mcp` (server `bongdesign`), for coding agents.
- npm packages `@bongbetic/*` on the Bongbetic registry, including the `@bongbetic/create-design` scaffolder.

Health: `https://design.bongbetic.com/health`.

- Deploy on fatboy: [docs/deploy-fatboy.md](docs/deploy-fatboy.md)
- Operator runbook: [docs/runbook.md](docs/runbook.md)

## Install the packages

The registry is `https://git.bongbetic.com/api/packages/bongbetic/npm/`. Reading needs no token.

Normal mode: only the `@bongbetic` scope comes from the registry. Add this line to the project's `.npmrc`:

```
@bongbetic:registry=https://git.bongbetic.com/api/packages/bongbetic/npm/
```

Sovereign mode: every package comes from the registry, so npmjs.org is not used. Add this line to `.npmrc` instead:

```
registry=https://git.bongbetic.com/api/packages/bongbetic/npm/
```

Start a new app from the scaffolder:

```bash
npx @bongbetic/create-design my-app
```

## Gallery and MCP

- Browsers sign in at `https://design.bongbetic.com/login`.
- MCP clients send `Authorization: Bearer <BONGDESIGN_TOKEN>`. See [mcp.json](mcp.json).

## Local development

Build the gallery first. The server serves `site/dist`. The offline install
installs only from the local npm cache and fails if anything is missing, so a
green build needs no npmjs.org or IBM reachability. On a machine with an empty
cache, run `npm ci` once online to seed it. The full procedure is in
[docs/runbook.md](docs/runbook.md).

```bash
cd site
npm ci --offline --no-audit --no-fund
npm run build
```

Run the server from the repo root, without sign-in. Local use only.

```bash
BONGDESIGN_OPEN=1 PORT=8000 python3 server.py
```

## Update to a new Carbon release

Follow the pin-bump procedure in [docs/runbook.md](docs/runbook.md) (`VERSION`, `site/package.json`, `data/components.json` meta, refreshed `vendor/`, rebuilt index). Commit `Bump to <tag>`, push, and deploy as in [docs/deploy-fatboy.md](docs/deploy-fatboy.md).

## Contents

- `site/` — gallery app, pinned `@carbon/react 1.119.0`.
- `server.py` — one process serves gallery plus MCP. Standard library only.
- `data/` — generated indexes; `components.json` lists 147 components.
- `packages/` — Bongbetic-owned npm packages: `brand`, `design`, `create-design`.
- `registry/closure/` — locked dependency closure for the `@bongbetic/*` registry.
- `scripts/` — data extraction, validators, registry tools, and `mirrors.sh` (Gitea pull mirrors of the Carbon repos).
- `docs/` — architecture decisions (`docs/adr/`), the runbook, and the fatboy deploy guide.
- `upstream-carbon/` — tracked Carbon source snapshot.
- `vendor/` — npm tarballs of the pinned Carbon packages, offline insurance.
- `Containerfile` — the image build used by fatboy.
- `mcp.json` — MCP client config.
- `VERSION` — exact pins.

## License

Carbon code © IBM, Apache-2.0. See [LICENSE](LICENSE).
BongDesign glue in this repo (`server.py`, `packages/`, `scripts/`, docs): Apache-2.0.
