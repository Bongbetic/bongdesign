"""T23: rebrand rewrites Carbon npm tarballs into @bongbetic/* tarballs.

Public interface: scripts/registry/rebrand.py `rebrand_tarball(src_bytes) -> bytes`.
Fixtures are built in memory; no network.
"""
import gzip
import hashlib
import importlib.util
import io
import json
import tarfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("rebrand", ROOT / "scripts" / "registry" / "rebrand.py")
rebrand = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rebrand)

FONT = b"\x00\x01wOF2\xff\xfe binary \x80"


def make_tgz(files):
    raw = io.BytesIO()
    with tarfile.open(fileobj=raw, mode="w") as tf:
        for name, data in files.items():
            ti = tarfile.TarInfo("package/" + name)
            ti.size = len(data)
            ti.mtime = 1700000000
            tf.addfile(ti, io.BytesIO(data))
    return gzip.compress(raw.getvalue(), mtime=12345)


def read_tgz(blob):
    out = {}
    with tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz") as tf:
        for m in tf.getmembers():
            out[m.name.removeprefix("package/")] = tf.extractfile(m).read()
    return out


PKG = {
    "name": "@carbon/react",
    "version": "1.119.0",
    "license": "Apache-2.0",
    "scripts": {"postinstall": "ibmtelemetry --config=telemetry.yml", "build": "x"},
    "files": ["lib", "telemetry.yml"],
    "dependencies": {"@carbon/styles": "^1.118.0", "@ibm/telemetry-js": "^1.5.0", "classnames": "2.5.1"},
    "peerDependencies": {"@ibm/plex": "^6.0.0"},
}

FIXTURE = {
    "package.json": json.dumps(PKG).encode(),
    "telemetry.yml": b"version: 1\n",
    "lib/index.js": b"import { x } from '@carbon/styles';\nconst y = require('@carbon/icons-react');\nimport('@carbon/grid');\nconst c = 'cds--btn';\n",
    "lib/index.d.ts": b"export * from '@carbon/layout';\n",
    "scss/a.scss": b"@use '@carbon/styles/scss/config';\n@forward '~@ibm/plex/css/ibm-plex.css';\n.cds--x { --cds-a: 1; }\n",
    "scss/fonts.scss": b"src: url('https://1.www.s81c.com/common/carbon/plex/fonts/IBM-Plex-Sans/a.woff2');\n",
    "fonts/a.woff2": FONT,
}


class RebrandTest(unittest.TestCase):
    def setUp(self):
        self.out = read_tgz(rebrand.rebrand_tarball(make_tgz(FIXTURE)))

    def test_package_json_renamed_and_telemetry_removed(self):
        p = json.loads(self.out["package.json"])
        self.assertEqual(p["name"], "@bongbetic/react")
        self.assertEqual(p["version"], "1.119.0")
        self.assertEqual(p["license"], "Apache-2.0")
        self.assertIn("@bongbetic/styles", p["dependencies"])
        self.assertNotIn("@carbon/styles", p["dependencies"])
        self.assertNotIn("@ibm/telemetry-js", p["dependencies"])
        self.assertEqual(p["dependencies"]["classnames"], "2.5.1")
        self.assertIn("@bongbetic/plex", p["peerDependencies"])
        self.assertNotIn("postinstall", p["scripts"])
        self.assertIn("build", p["scripts"])
        self.assertNotIn("telemetry.yml", p["files"])
        self.assertNotIn("telemetry.yml", self.out)
        self.assertEqual(p["publishConfig"]["registry"],
                         "https://git.bongbetic.com/api/packages/bongbetic/npm/")

    def test_specifiers_rewritten_in_js_dts_scss(self):
        js = self.out["lib/index.js"].decode()
        self.assertIn("from '@bongbetic/styles'", js)
        self.assertIn("require('@bongbetic/icons-react')", js)
        self.assertIn("import('@bongbetic/grid')", js)
        self.assertIn("@bongbetic/layout", self.out["lib/index.d.ts"].decode())
        scss = self.out["scss/a.scss"].decode()
        self.assertIn("@use '@bongbetic/styles/scss/config'", scss)
        self.assertIn("~@bongbetic/plex/css", scss)

    def test_carbon_prefixes_untouched(self):
        self.assertIn("cds--btn", self.out["lib/index.js"].decode())
        scss = self.out["scss/a.scss"].decode()
        self.assertIn(".cds--x { --cds-a: 1; }", scss)

    def test_font_cdn_selfhosted(self):
        s = self.out["scss/fonts.scss"].decode()
        self.assertNotIn("s81c.com", s)
        self.assertIn("https://design.bongbetic.com/fonts/plex/IBM-Plex-Sans/a.woff2", s)

    def test_binary_bytes_identical(self):
        self.assertEqual(self.out["fonts/a.woff2"], FONT)

    def test_notice_added(self):
        n = self.out["NOTICE"].decode()
        self.assertIn("IBM", n)
        self.assertIn("Apache-2.0", n)

    def test_deterministic(self):
        a = rebrand.rebrand_tarball(make_tgz(FIXTURE))
        b = rebrand.rebrand_tarball(make_tgz(FIXTURE))
        self.assertEqual(hashlib.sha512(a).hexdigest(), hashlib.sha512(b).hexdigest())

    def test_postcheck_rejects_leftovers(self):
        bad = dict(FIXTURE)
        bad["lib/x.js"] = b"var u = 'https://www.ibm.com/x'; fetch('https://1.www.s81c.com/a');"
        with self.assertRaises(rebrand.RebrandError):
            rebrand.rebrand_tarball(make_tgz(bad))

    def test_non_carbon_package_untouched_name(self):
        pkg = {"name": "classnames", "version": "2.5.1"}
        out = read_tgz(rebrand.rebrand_tarball(make_tgz({"package.json": json.dumps(pkg).encode()}), only_scoped=True))
        self.assertEqual(json.loads(out["package.json"])["name"], "classnames")


if __name__ == "__main__":
    unittest.main()
