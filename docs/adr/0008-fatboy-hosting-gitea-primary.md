# 0008. Host on fatboy, Gitea as primary repo, CI and tracker

Date: 2026-11-07
Status: Accepted
Decided by: user (change request, 2026-11-07)
Supersedes: the Coolify deploy path in README/AGENTS.md and the GitHub tracker lock from G2

## Context
BongDesign was deployed on Coolify. That server is gone and `design.bongbetic.com` no longer resolves. Bongbetic's services are moving to fatboy (Debian 13, rootless Podman + Quadlet + Caddy, managed with the `fatboy` CLI, nightly restic backups to Cloudflare R2), where Gitea with Actions already runs at git.bongbetic.com. The goal of the project is independence from outside vendors, and GitHub is one too.

## Decision
- **Primary repo:** `git.bongbetic.com/bongbetic/bongdesign`. It is migrated from GitHub with Gitea's migrate API, bringing issues, PRs, labels, milestones and releases. Afterwards GitHub is a push mirror or archived.
- **CI:** `.gitea/workflows/` on the runner labelled `bongbetic-ci`, running the same jobs as the GitHub workflow.
- **Tracker:** Gitea issues on the same repo (Heimdall tracker line updated in `.heimdall/STATE.md`).
- **Deploy:** `fatboy app new bongdesign --type git` from the Gitea repo's `main`, built from the existing `Containerfile` (base images pinned by digest), port 8000, health check `/health`, domain `design.bongbetic.com`. Credentials live in `/srv/bongdesign/.env`, never in git. Auto-deploy polls `main` and rolls back automatically on a failed health check.
- **Ship step unchanged:** merging to `main` is the ship step, done only by the orchestrator with the user's go-ahead.

## Options considered
- **fatboy + Gitea primary** (chosen): everything on Bongbetic hardware, already backed up / migration effort, CI rewritten for Gitea Actions
- **fatboy, GitHub primary**: no repo move / still depends on GitHub for code, CI and tracker — not chosen by the user
- **Rebuild a Coolify host**: familiar / Coolify is being retired across Bongbetic — not chosen

## Consequences
- The fatboy image build must reach git.bongbetic.com (hairpin to its own IP) for the registry. If that fails, the build gets the runner's `host-gateway` mapping.
- DNS for `design.bongbetic.com` (A 88.99.26.15, AAAA 2a01:4f8:10a:251::2) is an owner action and must exist before `fatboy domain add`.
- README, AGENTS.md and the runbook drop Coolify instructions.

## Sources
- `bongbetic-infra/FATBOY.md`, `bongbetic-infra/fatboy-manual.md` (sections 5 and 8)
- Live check 2026-11-07: `fatboy app list` shows `gitea` on git.bongbetic.com; `design.bongbetic.com` has no DNS record
