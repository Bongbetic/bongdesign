"""T24: package set, lock reading, integrity, idempotent publish to a Gitea-style npm registry.

The registry is an in-process stdlib HTTP double (system boundary). No network.
"""
import base64
import gzip
import hashlib
import importlib.util
import io
import json
import tarfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("registry", ROOT / "scripts" / "registry" / "registry.py")
reg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reg)


def tgz(name, version, extra=None):
    files = {"package.json": json.dumps({"name": name, "version": version, **(extra or {})}).encode()}
    raw = io.BytesIO()
    with tarfile.open(fileobj=raw, mode="w") as tf:
        for n, d in files.items():
            ti = tarfile.TarInfo("package/" + n)
            ti.size = len(d)
            tf.addfile(ti, io.BytesIO(d))
    return gzip.compress(raw.getvalue(), mtime=0)


def sri(blob):
    return "sha512-" + base64.b64encode(hashlib.sha512(blob).digest()).decode()


class FakeRegistry:
    def __init__(self):
        self.store = {}   # name -> {version: body}
        self.puts = []
        self.auth = []
        outer = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _name(self):
                return unquote(self.path.split("/npm/", 1)[1])

            def do_GET(self):
                n = self._name()
                if n in outer.store:
                    body = json.dumps({"name": n, "versions": {v: {} for v in outer.store[n]}}).encode()
                    self.send_response(200)
                else:
                    body = b"{}"
                    self.send_response(404)
                self.end_headers()
                self.wfile.write(body)

            def do_PUT(self):
                n = self._name()
                outer.auth.append(self.headers.get("Authorization"))
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                (ver,) = body["versions"].keys()
                if ver in outer.store.get(n, {}):
                    self.send_response(409)
                else:
                    outer.store.setdefault(n, {})[ver] = body
                    outer.puts.append((n, ver))
                    self.send_response(201)
                self.end_headers()
                self.wfile.write(b"{}")

        self.srv = HTTPServer(("127.0.0.1", 0), H)
        self.url = f"http://127.0.0.1:{self.srv.server_port}/api/packages/bongbetic/npm/"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def close(self):
        self.srv.shutdown()


class PackageSetTest(unittest.TestCase):
    def test_real_snapshot_public_packages_only(self):
        pkgs = dict(reg.public_packages(ROOT / "upstream-carbon" / "packages"))
        self.assertEqual(pkgs["@carbon/react"], "1.119.0")
        self.assertEqual(pkgs["@carbon/icons-react"], "11.91.0")
        self.assertNotIn("@carbon/test-utils", pkgs)      # private
        self.assertNotIn("@carbon/scss-generator", pkgs)  # private
        self.assertNotIn("carbon-components", pkgs)       # private, unscoped


class LockTest(unittest.TestCase):
    LOCK = {"packages": {
        "": {"name": "root"},
        "node_modules/react": {"version": "18.3.1", "resolved": "https://registry.npmjs.org/react/-/react-18.3.1.tgz", "integrity": "sha512-a"},
        "node_modules/@carbon/react": {"version": "1.119.0", "resolved": "https://r/x.tgz", "integrity": "sha512-b"},
        "node_modules/a/node_modules/react": {"version": "17.0.0", "resolved": "https://r/y.tgz", "integrity": "sha512-c"},
        "node_modules/@esbuild/linux-arm64": {"version": "0.21.5", "resolved": "https://r/e.tgz", "integrity": "sha512-d", "os": ["linux"], "cpu": ["arm64"], "optional": True},
        "node_modules/loc": {"link": True, "resolved": "../loc"},
    }}

    def test_entries_include_nested_and_optional_platform_skip_root_and_links(self):
        got = {(e["name"], e["version"]) for e in reg.lock_entries(self.LOCK)}
        self.assertEqual(got, {("react", "18.3.1"), ("@carbon/react", "1.119.0"),
                               ("react", "17.0.0"), ("@esbuild/linux-arm64", "0.21.5")})

    def test_integrity_check(self):
        blob = b"abc"
        reg.verify_integrity(blob, sri(blob))
        with self.assertRaises(reg.IntegrityError):
            reg.verify_integrity(blob, sri(b"xyz"))


class PublishTest(unittest.TestCase):
    def setUp(self):
        self.r = FakeRegistry()
        self.addCleanup(self.r.close)

    def test_publish_then_skip_existing(self):
        blob = tgz("classnames", "2.5.1")
        self.assertEqual(reg.publish_tarball(self.r.url, "tok", blob), "published")
        self.assertEqual(reg.publish_tarball(self.r.url, "tok", blob), "exists")
        self.assertEqual(self.r.puts, [("classnames", "2.5.1")])
        self.assertEqual(self.r.auth, ["Bearer tok"])
        body = self.r.store["classnames"]["2.5.1"]
        att = body["_attachments"]["classnames-2.5.1.tgz"]
        self.assertEqual(base64.b64decode(att["data"]), blob)
        self.assertEqual(body["versions"]["2.5.1"]["dist"]["integrity"], sri(blob))

    def test_scoped_name_encoded(self):
        reg.publish_tarball(self.r.url, "tok", tgz("@bongbetic/react", "1.119.0"))
        self.assertIn("@bongbetic/react", self.r.store)

    def test_sync_rebrands_carbon_drops_telemetry_orders_versions(self):
        blobs = {
            "https://u/c.tgz": tgz("@carbon/styles", "1.118.0"),
            "https://u/t.tgz": tgz("@ibm/telemetry-js", "1.5.0"),
            "https://u/r1.tgz": tgz("react", "18.3.1"),
            "https://u/r0.tgz": tgz("react", "17.0.0"),
        }
        lock = {"packages": {"": {}, **{
            "node_modules/" + n: {"version": v, "resolved": u, "integrity": sri(blobs[u])}
            for n, v, u in [("@carbon/styles", "1.118.0", "https://u/c.tgz"),
                            ("@ibm/telemetry-js", "1.5.0", "https://u/t.tgz"),
                            ("react", "18.3.1", "https://u/r1.tgz")]},
            "node_modules/a/node_modules/react": {"version": "17.0.0", "resolved": "https://u/r0.tgz", "integrity": sri(blobs["https://u/r0.tgz"])}}}
        report = reg.sync(lock, lambda u: blobs[u], self.r.url, "tok")
        names = {n for n, _ in self.r.puts}
        self.assertEqual(names, {"@bongbetic/styles", "react"})
        self.assertEqual([v for n, v in self.r.puts if n == "react"], ["17.0.0", "18.3.1"])
        self.assertEqual(report["published"], 3)
        self.assertEqual(report["skipped_dropped"], 1)
        again = reg.sync(lock, lambda u: blobs[u], self.r.url, "tok")
        self.assertEqual(again["published"], 0)
        self.assertEqual(again["exists"], 3)

    def test_sync_rejects_bad_integrity_before_publishing(self):
        lock = {"packages": {"": {}, "node_modules/react": {"version": "18.3.1", "resolved": "https://u/r.tgz", "integrity": sri(b"other")}}}
        with self.assertRaises(reg.IntegrityError):
            reg.sync(lock, lambda u: tgz("react", "18.3.1"), self.r.url, "tok")
        self.assertEqual(self.r.puts, [])


if __name__ == "__main__":
    unittest.main()
