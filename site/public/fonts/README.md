# Self-hosted IBM Plex fonts (OFFLINE-first)

Latin1-split woff2 files copied from the `@ibm/plex-sans` and
`@ibm/plex-mono` transitive dependencies (already in the npm tree, no new
runtime dependency, no CDN). Served at `/fonts/...` and wired via local
`@font-face` rules in `site/src/index.scss` using Carbon’s exact family
names (`IBM Plex Sans` 300/400/600, `IBM Plex Mono` 400) so the local
faces win over the suppressed Carbon bundle faces.

IBM Plex is Copyright © IBM Corp., licensed under the SIL Open Font
License 1.1 (see `LICENSE.txt` in the source npm packages).
