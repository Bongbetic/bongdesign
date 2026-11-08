#!/bin/bash
# mirrors.sh — T29: Gitea pull mirrors of the Carbon repos under the bongbetic owner (insurance copy).
#
#   bash scripts/mirrors.sh --dry-run    print the planned requests; no network, no token needed
#   read -rs GITEA_TOKEN                 token typed at the prompt: not on the command line, not in history
#   export GITEA_TOKEN
#   bash scripts/mirrors.sh              create the missing mirrors; existing repos are skipped
#
# Env: GITEA_TOKEN (required without --dry-run; needs rights to create repos as bongbetic),
#      GITEA_BASE (default https://git.bongbetic.com).
set -euo pipefail

GITEA_BASE="${GITEA_BASE:-https://git.bongbetic.com}"
SOURCES=(
  "carbon-design-system/carbon"
  "carbon-design-system/carbon-website"
)

dry_run=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    *) echo "mirrors.sh: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

hdr=""
cleanup() {
  if [ -n "$hdr" ]; then rm -f "$hdr"; fi
}
trap cleanup EXIT

if [ "$dry_run" -eq 0 ]; then
  if [ -z "${GITEA_TOKEN:-}" ]; then
    echo "mirrors.sh: GITEA_TOKEN is not set; export it, or run with --dry-run" >&2
    exit 1
  fi
  # Auth goes through a 0600 header file, so the token never reaches argv or output.
  hdr="$(mktemp)"
  printf 'Authorization: token %s\n' "$GITEA_TOKEN" > "$hdr"
fi

mirror_body() {  # $1 = source repo (owner/name), $2 = target repo name
  cat <<JSON
{
  "clone_addr": "https://github.com/$1.git",
  "repo_owner": "bongbetic",
  "repo_name": "$2",
  "service": "github",
  "mirror": true,
  "mirror_interval": "24h0m0s",
  "private": false,
  "description": "Pull mirror of $1 (insurance copy)"
}
JSON
}

for src in "${SOURCES[@]}"; do
  name="${src##*/}"
  target="bongbetic/$name"

  if [ "$dry_run" -eq 1 ]; then
    echo "[dry-run] $target: GET $GITEA_BASE/api/v1/repos/bongbetic/$name (skip if it exists)"
    echo "[dry-run] $target: POST $GITEA_BASE/api/v1/repos/migrate with:"
    mirror_body "$src" "$name"
    echo "[dry-run] $target: would create a pull mirror of $src"
    continue
  fi

  code="$(curl -sS -o /dev/null -w '%{http_code}' -H "@$hdr" "$GITEA_BASE/api/v1/repos/bongbetic/$name")"
  case "$code" in
    200)
      echo "$target exists, skipping"
      ;;
    404)
      resp="$(curl -sS -X POST -H "@$hdr" -H 'Content-Type: application/json' \
        --data-binary "$(mirror_body "$src" "$name")" -w '\n%{http_code}' \
        "$GITEA_BASE/api/v1/repos/migrate")"
      code="${resp##*$'\n'}"
      if [ "$code" != "201" ]; then
        echo "mirrors.sh: creating $target returned HTTP $code: ${resp%$'\n'*}" >&2
        exit 1
      fi
      echo "$target created as a pull mirror of $src (every 24h0m0s)"
      ;;
    *)
      echo "mirrors.sh: looking up $target returned HTTP $code" >&2
      exit 1
      ;;
  esac
done
