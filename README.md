# BongDesign — self-hosted Carbon component library

Own-repo snapshot of IBM Carbon, pinned to upstream
[carbon `v1.119.0`](https://github.com/carbon-design-system/carbon).
No fork metadata. Manual updates on each new release.

- Gallery: `https://design.bongbetic.com`
- MCP: `https://design.bongbetic.com/mcp` (server `bongdesign`)
- Health: `https://design.bongbetic.com/health`
- Client config: [mcp.json](mcp.json)

## Contents

- `site/` — gallery app, pinned `@carbon/react 1.119.0`.
- `server.py` — one process serves gallery plus MCP. Standard library only.
- `data/components.json` — 147 components indexed from pinned release.
- `vendor/` — npm tarballs of pinned packages, offline insurance.
- `VERSION` — exact pins.

## Coolify deploy

1. New service from this repo, build pack `Containerfile`.
2. Port `8000`, healthcheck path `/health`.
3. Domain `design.bongbetic.com` with HTTPS.
4. Redeploy to update.

## Local run

```bash
cd site && npm ci && npm run build && cd ..
PORT=8000 python3 server.py
```

## Update to a new Carbon release

1. Set versions in `VERSION`, `site/package.json`, `data/components.json` meta.
2. Re-run `npm run build`, refresh `vendor/`, rebuild index count.
3. Commit `Bump to <tag>`, push, redeploy Coolify.

## License

Carbon code © IBM, Apache-2.0. See [LICENSE](LICENSE).
BongDesign glue in this repo: Apache-2.0.
