"""Package set, lock reading, integrity and idempotent publish for the Gitea npm registry (ADR 0006).

Standard library only. The publish token is passed in by the caller (never read from disk here).
"""
import base64
import hashlib
import importlib.util
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

_spec = importlib.util.spec_from_file_location("rebrand", Path(__file__).with_name("rebrand.py"))
rebrand = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rebrand)

DROPPED = ("@ibm/telemetry-js",)
CARBON_SCOPES = ("@carbon/", "@ibm/")


class IntegrityError(Exception):
    pass


def public_packages(packages_dir):
    """(name, version) of every non-private package under a Carbon `packages/` dir."""
    out = []
    for pj in sorted(Path(packages_dir).glob("*/package.json")):
        p = json.loads(pj.read_text(encoding="utf-8"))
        if not p.get("private") and p.get("name") and p.get("version"):
            out.append((p["name"], p["version"]))
    return out


def lock_entries(lock):
    """Every installable package in an npm lockfile, nested copies and optional platform binaries included."""
    out = []
    for path, e in lock.get("packages", {}).items():
        if not path or e.get("link") or "version" not in e or "resolved" not in e:
            continue
        out.append({"name": path.rsplit("node_modules/", 1)[1], "version": e["version"],
                    "resolved": e["resolved"], "integrity": e.get("integrity"),
                    "os": e.get("os"), "cpu": e.get("cpu")})
    return out


def sri(blob, algo="sha512"):
    return f"{algo}-" + base64.b64encode(hashlib.new(algo, blob).digest()).decode()


def verify_integrity(blob, integrity):
    if not integrity:
        raise IntegrityError("no integrity in lock entry")
    for part in integrity.split():
        algo = part.split("-", 1)[0]
        if algo in ("sha512", "sha384", "sha256", "sha1") and sri(blob, algo) == part:
            return
    raise IntegrityError(f"integrity mismatch for {integrity[:24]}")


def _url(base, name):
    return base.rstrip("/") + "/" + quote(name, safe="@").replace("/", "%2f")


def _request(method, url, token=None, body=None):
    req = urllib.request.Request(url, method=method, data=body)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    last = None
    for _ in range(4):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            try:
                return e.code, e.read()
            finally:
                e.close()
        except OSError as e:  # timeout / reset: caller's existence check makes a retry safe
            last = e
    raise RuntimeError(f"{method} {url}: {last}")


def _tarball_meta(blob):
    import io
    import tarfile
    with tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz") as tf:
        for m in tf.getmembers():
            if m.isfile() and m.name.split("/", 1)[-1] == "package.json":
                return json.loads(tf.extractfile(m).read())
    raise RuntimeError("tarball has no package.json")


def _packument_meta(meta):
    """Coerce loose package.json fields into the shapes Gitea's npm parser accepts.
    Only the registry document is changed; the tarball's own package.json is untouched."""
    m = dict(meta)
    kw = m.get("keywords")
    if isinstance(kw, str):
        m["keywords"] = [k for k in re.split(r"[\s,]+", kw) if k]
    elif kw is not None and not isinstance(kw, list):
        del m["keywords"]
    a = m.get("author")
    if isinstance(a, str):
        m["author"] = {"name": a}
    elif a is not None and not isinstance(a, dict):
        del m["author"]
    r = m.get("repository")
    if isinstance(r, str):
        m["repository"] = {"type": "git", "url": r}
    elif r is not None and not isinstance(r, dict):
        del m["repository"]
    lic = m.get("license")
    if isinstance(lic, dict):
        m["license"] = lic.get("type", "")
    elif lic is not None and not isinstance(lic, str):
        del m["license"]
    b = m.get("bin")
    if isinstance(b, str):
        m["bin"] = {m["name"].rsplit("/", 1)[-1]: b}
    if not isinstance(m.get("contributors", []), list) or any(not isinstance(c, dict) for c in m.get("contributors", [])):
        m.pop("contributors", None)
    for k in ("maintainers",):
        if k in m and (not isinstance(m[k], list) or any(not isinstance(c, dict) for c in m[k])):
            del m[k]
    return m


def publish_tarball(base, token, blob, tag="latest"):
    """Publish one tarball. Returns 'published' or 'exists'; raises on any other failure."""
    meta = _tarball_meta(blob)
    name, version = meta["name"], meta["version"]
    status, body = _request("GET", _url(base, name), token)
    if status == 200 and version in json.loads(body).get("versions", {}):
        return "exists"
    fname = f"{name}-{version}.tgz"
    version_doc = dict(_packument_meta(meta), _id=f"{name}@{version}",
                       dist={"integrity": sri(blob), "shasum": hashlib.sha1(blob).hexdigest()})
    doc = {"_id": name, "name": name, "dist-tags": {tag: version},
           "versions": {version: version_doc},
           "_attachments": {fname: {"content_type": "application/octet-stream",
                                    "data": base64.b64encode(blob).decode(), "length": len(blob)}}}
    status, body = _request("PUT", _url(base, name), token, json.dumps(doc).encode())
    if status == 409:
        return "exists"
    if status not in (200, 201):
        raise RuntimeError(f"publish {name}@{version}: HTTP {status} {body[:200]!r}")
    return "published"


def _vkey(v):
    return [int(x) if x.isdigit() else x for x in re.split(r"[.\-+]", v)]


def default_fetch(url):
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        except OSError as e:
            last = e
    raise RuntimeError(f"fetch {url}: {last}")


def sync(lock, fetch, base, token, dry_run=False):
    """Fetch every lock entry, verify, rebrand Carbon/IBM ones, publish what is missing."""
    report = {"published": 0, "exists": 0, "skipped_dropped": 0, "rebranded": 0}
    entries = sorted(lock_entries(lock), key=lambda e: (e["name"], _vkey(e["version"])))
    for e in entries:
        if e["name"] in DROPPED:
            report["skipped_dropped"] += 1
            continue
        blob = fetch(e["resolved"])
        verify_integrity(blob, e["integrity"])
        if e["name"].startswith(CARBON_SCOPES):
            blob = rebrand.rebrand_tarball(blob)
            report["rebranded"] += 1
        if dry_run:
            continue
        report[publish_tarball(base, token, blob)] += 1
    return report


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Sync a closure lockfile into the Gitea npm registry")
    ap.add_argument("lock")
    ap.add_argument("--base", default="https://git.bongbetic.com/api/packages/bongbetic/npm/")
    ap.add_argument("--token-env", default="GITEA_PUBLISH_TOKEN")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    tok = os.environ.get(a.token_env)
    if not tok and not a.dry_run:
        raise SystemExit(f"set {a.token_env}")
    print(json.dumps(sync(json.load(open(a.lock)), default_fetch, a.base, tok, a.dry_run)))
