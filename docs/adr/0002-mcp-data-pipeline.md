# 0002. MCP depth from a build-time data pipeline over the tracked Carbon source

Date: 2026-10-26
Status: Accepted
Decided by: user accepted recommendation (G1 + G2 lock, 2026-10-26)

## Context
Today's MCP has 4 tools and generic examples, while carbon-src/ holds per-component MDX with prop ('Component API') sections and stories for all 147 components (US-08). server.py is deliberately Python-stdlib-only and must stay deployable in the slim Containerfile.

## Decision
Node scripts (dev/build tooling only) mine carbon-src MDX + TS prop types and the @carbon token/icon/pictogram packages into committed data/*.json. server.py serves MCP tools from that JSON: component detail with real props/examples, guidance/specs/accessibility, token lookup, icon/pictogram search, branding and server info. Data files are generated, never hand-edited.

## Options considered
- **Build-time generation** (chosen): no runtime deps, data provably matches the pin / pipeline must be re-run on a pin bump (already in the README update steps)
- **Runtime parsing in the server**: always fresh / puts source parsing into the Python runtime and the slim image — rejected
- **Hand-written tool data**: simple / drifts from the pin — rejected by US-06/US-08

## Consequences
- The pin-bump checklist gains one regenerate-and-commit step; validators fail CI when generated data is stale or incomplete.
- MCP answers cite the pinned tag in every payload.

## Sources
- .heimdall/research/architecture-decisions.md; carbon-src/react/components/Button/Button.mdx (inspected 2026-10-26)
