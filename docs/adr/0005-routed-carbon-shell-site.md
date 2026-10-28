# 0005. Routed SPA in Carbon's UIShell: data-driven pages for all 147 components

Date: 2026-10-26
Status: Accepted
Decided by: user accepted recommendation (G1 + G2 lock, 2026-10-26)

## Context
US-02..US-07/SC-5: the site must look and navigate like carbondesignsystem.com. Carbon's UIShell (Header, SideNav) ships in the pinned @carbon/react. Writing 147 hand-built pages would be unmaintainable; the explorer already renders components data-driven.

## Decision
One routed application shell (Carbon Header + SideNav + Content) with page templates — home, components overview card grid, one component-page template driven by data/*.json (live demo, Guidelines/Specifications/Code/Accessibility tabs, props table), foundations pages, patterns/data-viz guidance pages, and a support/MCP page documenting the connection. The Design Contract (G2.5 pick) fixes the masthead treatment.

## Options considered
- **Data-driven templates in UIShell** (chosen): Carbon look by construction, new components appear from data / templates must handle demo-less utility components gracefully (the SKIP/code-only pattern already exists)
- **Per-component hand-written pages**: bespoke / 147 files of drift — rejected
- **Keep the single stacked page, restyle**: cheapest / fails US-02..US-05 — rejected

## Consequences
- routes registry and index.scss become managed hotspots (HANDOFF hotspot plan).
- Visual acceptance compares built pages to the G2.5 prototype screens at review.

## Sources
- .heimdall/research/carbon-site-study.md; .heimdall/REPO_REPORT.md
