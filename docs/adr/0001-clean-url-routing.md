# 0001. Clean-URL routing with a tiny in-repo History router

Date: 2026-10-26
Status: Accepted
Decided by: user accepted recommendation (G2 lock, 2026-10-26)

## Context
The gallery is one stacked page with hash anchors; the spec (US-02..US-05) needs Carbon-like clean URLs and one page per component. server.py already falls back to index.html for unknown paths. Every new runtime dependency is a permanent vendoring obligation (US-09).

## Decision
A small in-repo router on the History API (route table in one module, the registry:routes hotspot). No routing dependency.

## Options considered
- **In-repo History router** (chosen): clean URLs, zero deps / hand-rolled, kept small and seam-tested
- **react-router**: proven / a dependency tree to vendor and update forever — not chosen because the route shapes here are static and few
- **Hash routing**: zero server needs / fragment URLs that break the Carbon feel and deep-linking — not chosen because US-05 requires shareable component URLs

## Consequences
- Route changes are single-module edits; the SPA must render sensible pages for every route at the render-check seam.
- Browser back/forward and direct loads are the router's test surface.

## Sources
- .heimdall/research/architecture-decisions.md
