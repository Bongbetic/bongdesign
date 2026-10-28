#!/bin/bash
# check-offline.sh — T02 validator: the repo alone must rebuild BongDesign.
# Fails at base (nested git metadata, missing tarballs, hotlinked brand assets).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
say(){ if [ "$2" = 0 ]; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }
# 1. no nested git metadata under upstream-carbon/
if [ -e "$ROOT/upstream-carbon/.git" ]; then say "no nested .git under upstream-carbon/" 1; else say "no nested .git under upstream-carbon/" 0; fi
# 2. vendor/ holds a tarball for every package/version line in VERSION (lines like @scope/name=x.y.z)
missing=""
while IFS= read -r line; do
  case "$line" in @*"="*) pkg="${line%%=*}"; ver="${line##*=}";; *) continue;; esac
  scope_less="${pkg#@}"; scope="${pkg%%/*}"; scope="${scope#@}"; name="${pkg##*/}"
  if [ "$scope" = "$scope_less" ]; then tgz="$ROOT/vendor/${name}-${ver}.tgz"; else tgz="$ROOT/vendor/${scope}-${name}-${ver}.tgz"; fi
  if [ ! -f "$tgz" ]; then missing="$missing $pkg@$ver"; fi
done < "$ROOT/VERSION"
if [ -z "$missing" ]; then say "vendor tarballs complete per VERSION" 0; else say "vendor tarballs complete per VERSION (missing:$missing)" 1; fi
# 3. no bongbetic.com asset URLs in site sources; every local /branding/* ref resolves
if grep -rq "bongbetic\.com/branding/" "$ROOT/site/index.html" "$ROOT/site/src" 2>/dev/null; then say "no bongbetic.com/branding refs in site sources" 1; else say "no bongbetic.com/branding refs in site sources" 0; fi
unresolved=""
for ref in $(grep -rhoE "/branding/[^\"') ]*" "$ROOT/site/index.html" "$ROOT/site/src" 2>/dev/null | sort -u); do
  if [ ! -f "$ROOT/site/public$ref" ]; then unresolved="$unresolved $ref"; fi
done
if grep -rq "/branding/" "$ROOT/site/index.html" "$ROOT/site/src" 2>/dev/null; then
  if [ -z "$unresolved" ]; then say "all /branding/* refs resolve locally" 0; else say "all /branding/* refs resolve locally (missing:$unresolved)" 1; fi
else
  say "brand assets vendored and referenced" 1
fi
# 4. upstream snapshot is tracked (spot-check a known deep file)
if git -C "$ROOT" ls-files --error-unmatch "upstream-carbon/package.json" >/dev/null 2>&1; then say "upstream snapshot tracked in git" 0; else say "upstream snapshot tracked in git" 1; fi
exit $fail
