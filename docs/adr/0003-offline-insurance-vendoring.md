# 0003. Offline insurance: upstream tracked as plain files, complete tarballs, vendored brand assets

Date: 2026-10-26
Status: Accepted
Decided by: user (G1 + G2 lock, 2026-10-26)

## Context
US-09/SC-4: the repo alone must rebuild BongDesign if IBM or npm vanish. Measured 2026-10-26: upstream-carbon is 78 MB / 10,833 files excluding its nested .git (largest file 5.6 MB, inside GitHub's 100 MB limit); vendor/ holds only 3 of the pinned tarballs; brand assets (~410 KB across 7 files) are hotlinked from bongbetic.com.

## Decision
Track upstream-carbon as plain files (the scaffold ticket removes the nested .git), complete vendor/ with tarballs for every package pinned in VERSION, and vendor the brand assets into site/public/branding with the site referencing only local copies.

## Options considered
- **Plain tracked files** (chosen): clone = complete insurance, no extra service / heavier clones (~78 MB)
- **Git submodule**: small repo / a pointer — a deleted upstream breaks the clone, defeating US-09
- **Git LFS**: lighter clones / extra service and public-repo bandwidth limits — not chosen for two master .ai files' sake

## Consequences
- .gitignore no longer excludes upstream-carbon/ (done at G1 lock, 2026-10-26).
- The G6 QA gate includes an offline-build proof; pin bumps refresh tarballs and the snapshot together.

## Sources
- .heimdall/research/architecture-decisions.md (measurements, 2026-10-26)
