# 0004. Auth wall hardened on the stdlib server; single shared credential + MCP token

Date: 2026-10-26
Status: Accepted
Decided by: user accepted recommendation (G1 + G2 lock, 2026-10-26)

## Context
US-01/SC-1: everything except /health and /login requires a browser session (env-var credential) or the MCP bearer token. G1 rejected multi-user/SSO. server.py already uses constant-time compares and HttpOnly SameSite=Lax cookies with a 12 h TTL.

## Decision
Keep the model; harden it: add the Secure cookie flag, login attempt throttling, explicit session expiry handling, and HTTP-seam tests for signed-out redirect/401, signed-in access, MCP 401 without token and 200 with it.

## Options considered
- **Harden in place** (chosen): no new dependency or identity provider / shared credential remains a single point of trust (accepted at G1)
- **OIDC/SSO or multi-user accounts**: per-user accountability / new dependency and scope — rejected at G1

## Consequences
- Secure cookies require HTTPS in deployment (Coolify already terminates HTTPS at design.bongbetic.com); local dev keeps BONGDESIGN_OPEN=1.
- Credential rotation stays a Coolify env-var change (names only: BONGDESIGN_USER, BONGDESIGN_PASS, BONGDESIGN_TOKEN).

## Sources
- .heimdall/research/architecture-decisions.md; server.py (recon, 2026-10-26)
