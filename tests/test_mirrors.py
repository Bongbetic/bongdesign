"""T29: scripts/mirrors.sh creates Gitea pull mirrors of the Carbon repos, idempotently.

Real runs go to a stdlib HTTP double of the Gitea repo API (system boundary). No network.
"""
import json
import os
import re
import socket
import subprocess
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "mirrors.sh"
SENTINEL = "sentinel-not-a-real-token"
PROXY_VARS = {"HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy",
              "NO_PROXY", "no_proxy"}
TOKEN_REF = re.compile(r"\$\{?GITEA_TOKEN")


def closed_base():
    """A base URL nothing listens on: any network call fails."""
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return f"http://127.0.0.1:{s.getsockname()[1]}"


def run_script(*args, base=None, token=None):
    env = {k: v for k, v in os.environ.items() if k not in PROXY_VARS | {"GITEA_TOKEN", "GITEA_BASE"}}
    if base is not None:
        env["GITEA_BASE"] = base
    if token is not None:
        env["GITEA_TOKEN"] = token
    return subprocess.run(["bash", str(SCRIPT), *args], capture_output=True, text=True,
                          env=env, timeout=60)


class GiteaDouble:
    """Gitea repo API stand-in. Records (method, path, authorization, body) per request."""

    def __init__(self, existing=(), lookup_status=None):
        self.existing = set(existing)
        self.lookup_status = lookup_status
        self.requests = []
        outer = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _reply(self, code):
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b"{}")

            def do_GET(self):
                outer.requests.append(("GET", self.path, self.headers.get("Authorization"), ""))
                name = self.path.rsplit("/", 1)[-1]
                if outer.lookup_status is not None:
                    self._reply(outer.lookup_status)
                elif self.path.startswith("/api/v1/repos/bongbetic/") and name in outer.existing:
                    self._reply(200)
                else:
                    self._reply(404)

            def do_POST(self):
                body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode()
                outer.requests.append(("POST", self.path, self.headers.get("Authorization"), body))
                self._reply(201 if self.path == "/api/v1/repos/migrate" else 404)

        self.srv = HTTPServer(("127.0.0.1", 0), H)
        self.base = f"http://127.0.0.1:{self.srv.server_port}"
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def close(self):
        self.srv.shutdown()
        self.srv.server_close()

    def posts(self):
        return [r for r in self.requests if r[0] == "POST"]


class MirrorsScriptTest(unittest.TestCase):
    def setUp(self):
        self.text = SCRIPT.read_text(encoding="utf-8")

    def test_bash_syntax_is_valid(self):
        r = subprocess.run(["bash", "-n", str(SCRIPT)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_strict_mode_set(self):
        self.assertIn("set -euo pipefail", self.text)

    def test_token_is_never_echoed(self):
        self.assertNotRegex(self.text, r"(?m)^\s*set -[a-z]*x", "xtrace would print the token")
        for line in self.text.splitlines():
            if TOKEN_REF.search(line):
                self.assertNotRegex(line, r"\becho\b", line)
                if re.search(r"\bprintf\b", line):
                    self.assertIn(">", line, "printf of the token must redirect to the header file")

    def test_checks_target_repo_before_posting(self):
        self.assertIn("/api/v1/repos/bongbetic/", self.text)
        self.assertIn("/api/v1/repos/migrate", self.text)

    def test_dry_run_plans_both_mirrors_without_token_or_network(self):
        r = run_script("--dry-run", base=closed_base())
        self.assertEqual(r.returncode, 0, r.stderr)
        for needle in (
            "https://github.com/carbon-design-system/carbon.git",
            "https://github.com/carbon-design-system/carbon-website.git",
            '"mirror": true',
            '"mirror_interval": "24h0m0s"',
            '"repo_owner": "bongbetic"',
            '"repo_name": "carbon-website"',
            "/api/v1/repos/migrate",
            "/api/v1/repos/bongbetic/carbon",
        ):
            self.assertIn(needle, r.stdout)

    def test_real_run_without_token_fails_naming_variable(self):
        r = run_script(base=closed_base())
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("GITEA_TOKEN", r.stdout + r.stderr)

    def test_real_run_creates_missing_mirror_and_skips_existing(self):
        gitea = GiteaDouble(existing={"carbon"})
        self.addCleanup(gitea.close)
        r = run_script(base=gitea.base, token=SENTINEL)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("carbon exists, skipping", r.stdout)
        self.assertNotIn(SENTINEL, r.stdout + r.stderr)
        self.assertTrue(all(q[2] == f"token {SENTINEL}" for q in gitea.requests))
        posts = gitea.posts()
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0][1], "/api/v1/repos/migrate")
        body = json.loads(posts[0][3])
        self.assertEqual(body["repo_name"], "carbon-website")
        self.assertEqual(body["repo_owner"], "bongbetic")
        self.assertEqual(body["clone_addr"], "https://github.com/carbon-design-system/carbon-website.git")
        self.assertEqual(body["service"], "github")
        self.assertIs(body["mirror"], True)
        self.assertEqual(body["mirror_interval"], "24h0m0s")
        self.assertIs(body["private"], False)

    def test_unexpected_lookup_status_fails_without_posting(self):
        gitea = GiteaDouble(lookup_status=500)
        self.addCleanup(gitea.close)
        r = run_script(base=gitea.base, token=SENTINEL)
        self.assertNotEqual(r.returncode, 0)
        self.assertEqual(gitea.posts(), [])
        self.assertNotIn(SENTINEL, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
