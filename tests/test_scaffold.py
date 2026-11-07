"""T26: `create-design` scaffolder, run for real with node into a temp dir (no network)."""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "packages" / "create-design" / "bin" / "create-design.js"
REG = "https://git.bongbetic.com/api/packages/bongbetic/npm/"


def run(*args, cwd):
    return subprocess.run(["node", str(BIN), *args], cwd=cwd, capture_output=True, text=True)


class ScaffoldTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.cwd = Path(self.tmp.name)

    def test_scaffolds_buildable_app_files(self):
        r = run("my-app", cwd=self.cwd)
        self.assertEqual(r.returncode, 0, r.stderr)
        app = self.cwd / "my-app"
        pkg = json.loads((app / "package.json").read_text())
        self.assertEqual(pkg["name"], "my-app")
        self.assertIn("@bongbetic/design", pkg["dependencies"])
        for dep in ("react", "react-dom"):
            self.assertIn(dep, pkg["dependencies"])
        for dep in ("vite", "@vitejs/plugin-react", "sass"):
            self.assertIn(dep, pkg["devDependencies"])
        self.assertFalse(any(k.startswith(("@carbon", "@ibm")) for k in {**pkg["dependencies"], **pkg["devDependencies"]}))
        for f in ("index.html", "vite.config.js", "src/main.jsx", "src/App.jsx", "src/styles.scss",
                  "public/favicon.ico", "public/site.webmanifest", ".npmrc", ".gitignore"):
            self.assertTrue((app / f).is_file(), f)
        app_src = (app / "src" / "App.jsx").read_text()
        self.assertIn("BongbeticHeader", app_src)
        self.assertIn("@bongbetic/design", app_src)
        self.assertIn("@bongbetic/design/styles", (app / "src" / "styles.scss").read_text())
        self.assertIn("my-app", (app / "index.html").read_text())

    def test_npmrc_normal_mode_has_scope_registry_and_no_token(self):
        run("a", cwd=self.cwd)
        rc = (self.cwd / "a" / ".npmrc").read_text()
        self.assertIn(f"@bongbetic:registry={REG}", rc)
        self.assertNotRegex(rc, r"^registry=", )
        self.assertNotIn("_authToken", rc)

    def test_sovereign_mode_routes_everything_through_gitea(self):
        run("a", "--sovereign", cwd=self.cwd)
        rc = (self.cwd / "a" / ".npmrc").read_text()
        self.assertIn(f"registry={REG}", rc)

    def test_refuses_non_empty_directory_and_bad_name(self):
        (self.cwd / "x").mkdir()
        (self.cwd / "x" / "f").write_text("1")
        self.assertNotEqual(run("x", cwd=self.cwd).returncode, 0)
        self.assertEqual((self.cwd / "x" / "f").read_text(), "1")
        self.assertNotEqual(run("../evil", cwd=self.cwd).returncode, 0)
        self.assertNotEqual(run(cwd=self.cwd).returncode, 0)

    def test_package_manifest(self):
        p = json.loads((ROOT / "packages" / "create-design" / "package.json").read_text())
        self.assertEqual(p["name"], "@bongbetic/create-design")
        self.assertEqual(p["bin"], {"create-design": "bin/create-design.js"})
        self.assertFalse(p.get("dependencies"))
        self.assertIn("template", p["files"])


if __name__ == "__main__":
    unittest.main()
