"""Rewrite a Carbon npm tarball into a @bongbetic/* tarball (ADR 0006).

Pure function: rebrand_tarball(bytes) -> bytes. Deterministic output.
Standard library only.
"""
import gzip
import io
import json
import re
import tarfile

REGISTRY = "https://git.bongbetic.com/api/packages/bongbetic/npm/"
HOMEPAGE = "https://design.bongbetic.com"
REPO_URL = "https://git.bongbetic.com/bongbetic/bongdesign.git"
FONT_CDN = "https://1.www.s81c.com/common/carbon/plex/fonts/"
FONT_SELF = "https://design.bongbetic.com/fonts/plex/"
TEXT_EXT = (".js", ".mjs", ".cjs", ".ts", ".d.ts", ".scss", ".css", ".map", ".json", ".md", ".vue", ".yml")
DROP_DEPS = ("@ibm/telemetry-js",)
DEP_KEYS = ("dependencies", "peerDependencies", "optionalDependencies", "devDependencies",
            "peerDependenciesMeta")
NOTICE = (
    "This package is derived from IBM Carbon (https://github.com/carbon-design-system/carbon),\n"
    "Copyright IBM Corp., licensed under the Apache License 2.0 (Apache-2.0).\n"
    "Modified by Bongbetic: npm scope renamed (@carbon -> @bongbetic, @ibm/plex -> @bongbetic/plex),\n"
    "IBM telemetry removed, IBM font CDN replaced by self-hosted files.\n"
    "IBM Plex font files are unmodified (SIL OFL 1.1, Reserved Font Name 'Plex').\n"
)

SPECIFIER_LEFTOVER = re.compile(r"""['"`]~?@(carbon|ibm)/""")
IBM_URL = re.compile(r"""(?:url\(|fetch\(|src=|href=)\s*['"]?https?://[^'")\s]*(?:ibm\.com|s81c\.com)""")


class RebrandError(Exception):
    pass


def _rename(name):
    if name.startswith("@carbon/"):
        return "@bongbetic/" + name[len("@carbon/"):]
    if name.startswith("@ibm/plex"):
        return "@bongbetic/" + name[len("@ibm/"):]
    return name


def _text(s):
    s = s.replace("@carbon/", "@bongbetic/").replace("@ibm/plex", "@bongbetic/plex")
    return s.replace(FONT_CDN, FONT_SELF)


def _rebrand_package_json(raw):
    p = json.loads(raw)
    p["name"] = _rename(p["name"])
    for key in DEP_KEYS:
        if key in p:
            p[key] = {_rename(k): v for k, v in p[key].items() if k not in DROP_DEPS}
    scripts = p.get("scripts", {})
    if "ibmtelemetry" in scripts.get("postinstall", ""):
        del scripts["postinstall"]
    if "files" in p:
        p["files"] = [f for f in p["files"] if f != "telemetry.yml"]
    p["publishConfig"] = {"registry": REGISTRY, "access": "public"}
    p["homepage"] = HOMEPAGE
    p["repository"] = {"type": "git", "url": REPO_URL}
    return _text(json.dumps(p, indent=2, ensure_ascii=False) + "\n").encode()


def _postcheck(name, data):
    s = data.decode("utf-8", "replace")
    if SPECIFIER_LEFTOVER.search(s):
        raise RebrandError(f"{name}: leftover @carbon/@ibm specifier")
    if "ibmtelemetry" in s:
        raise RebrandError(f"{name}: leftover ibmtelemetry")
    if "s81c.com" in s or IBM_URL.search(s):
        raise RebrandError(f"{name}: leftover IBM host in URL")


def rebrand_tarball(blob, only_scoped=False):
    src = tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz")
    entries = {}
    for m in src.getmembers():
        if not m.isfile():
            continue
        entries[m.name.removeprefix("package/")] = (src.extractfile(m).read(), m.mode)
    name = json.loads(entries["package.json"][0])["name"]
    if only_scoped and not name.startswith(("@carbon/", "@ibm/")):
        return blob
    entries.pop("telemetry.yml", None)
    out = {}
    for path, (data, mode) in entries.items():
        if path == "package.json":
            data = _rebrand_package_json(data)
        elif path.endswith(TEXT_EXT):
            try:
                data = _text(data.decode("utf-8")).encode("utf-8")
            except UnicodeDecodeError:
                pass
        if path.endswith(TEXT_EXT) or path == "package.json":
            _postcheck(path, data)
        out[path] = (data, mode)
    out["NOTICE"] = (NOTICE.encode(), 0o644)

    raw = io.BytesIO()
    with tarfile.open(fileobj=raw, mode="w", format=tarfile.USTAR_FORMAT) as tf:
        for path in sorted(out):
            data, mode = out[path]
            ti = tarfile.TarInfo("package/" + path)
            ti.size = len(data)
            ti.mtime = 0
            ti.uid = ti.gid = 0
            ti.uname = ti.gname = ""
            ti.mode = 0o755 if mode & 0o100 else 0o644
            tf.addfile(ti, io.BytesIO(data))
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0, compresslevel=9) as gz:
        gz.write(raw.getvalue())
    return buf.getvalue()
