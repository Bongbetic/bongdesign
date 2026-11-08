"""T27: the site installs @bongbetic/* from the Gitea registry, never @carbon/* from npmjs.

Static checks over the committed files: package.json pins, site/.npmrc, module
specifiers in site/src, the lockfile's resolved URLs, the committed data/*.json,
the generator script, the Containerfile, and the Install page wiring.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
SRC = SITE / "src"
DATA = ROOT / "data"
REG = "https://git.bongbetic.com/api/packages/bongbetic/npm/"
RUNBOOK = ROOT / "docs" / "runbook.md"

PINS = {
    "@bongbetic/react": "1.119.0",
    "@bongbetic/styles": "1.118.0",
    "@bongbetic/icons": "11.91.0",
    "@bongbetic/icons-react": "11.91.0",
    "@bongbetic/pictograms": "12.87.0",
    "@bongbetic/pictograms-react": "11.113.0",
}


class PackageJsonTest(unittest.TestCase):
    def setUp(self):
        self.pkg = json.loads((SITE / "package.json").read_text(encoding="utf-8"))

    def test_no_carbon_or_ibm_dependency(self):
        keys = {**self.pkg.get("dependencies", {}), **self.pkg.get("devDependencies", {})}
        self.assertEqual(sorted(k for k in keys if k.startswith(("@carbon/", "@ibm/"))), [])

    def test_bongbetic_packages_pinned_exactly(self):
        deps = self.pkg["dependencies"]
        for name, ver in PINS.items():
            self.assertEqual(deps.get(name), ver, name)

    def test_react_and_build_tooling_pins_kept(self):
        deps, dev = self.pkg["dependencies"], self.pkg["devDependencies"]
        self.assertEqual(deps.get("react"), "18.3.1")
        self.assertEqual(deps.get("react-dom"), "18.3.1")
        self.assertEqual(dev.get("vite"), "5.4.11")
        self.assertEqual(dev.get("@vitejs/plugin-react"), "4.3.4")
        self.assertEqual(dev.get("sass"), "1.83.0")


class NpmrcTest(unittest.TestCase):
    def test_site_npmrc_routes_installs_to_gitea(self):
        path = SITE / ".npmrc"
        self.assertTrue(path.is_file(), "site/.npmrc is missing")
        lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
        self.assertIn(f"registry={REG}", lines)


class SpecifierTest(unittest.TestCase):
    def test_no_carbon_or_ibm_module_specifier_in_site_src(self):
        quoted = re.compile(r"""['"]@(?:carbon|ibm)/""")
        hits = []
        for path in sorted(SRC.rglob("*")):
            if path.is_file() and path.suffix in {".jsx", ".js", ".scss", ".css"}:
                if quoted.search(path.read_text(encoding="utf-8")):
                    hits.append(str(path.relative_to(ROOT)))
        self.assertEqual(hits, [], f"old scope still imported in: {hits}")


class LockfileTest(unittest.TestCase):
    def setUp(self):
        self.text = (SITE / "package-lock.json").read_text(encoding="utf-8")
        self.lock = json.loads(self.text)

    def test_no_npmjs_resolved_url(self):
        self.assertNotIn("registry.npmjs.org", self.text)

    def test_every_resolved_url_on_gitea(self):
        urls = re.findall(r'"resolved":\s*"([^"]+)"', self.text)
        self.assertGreater(len(urls), 0, "no resolved URLs in lockfile")
        foreign = sorted(u for u in urls if not u.startswith(REG))
        self.assertEqual(foreign, [], f"resolved outside Gitea: {foreign[:5]}")

    def test_no_carbon_or_ibm_entries(self):
        keys = [k for k in self.lock["packages"]
                if k.startswith(("node_modules/@carbon/", "node_modules/@ibm/"))]
        self.assertEqual(keys, [])

    def test_bongbetic_react_locked_at_pin(self):
        self.assertEqual(self.lock["packages"]["node_modules/@bongbetic/react"]["version"], "1.119.0")


class DataTest(unittest.TestCase):
    def test_committed_data_has_no_carbon_package_name(self):
        for path in sorted(DATA.glob("*.json")):
            self.assertNotIn("@carbon/", path.read_text(encoding="utf-8"), path.name)

    def test_packages_index_lists_the_22_public_packages(self):
        doc = json.loads((DATA / "packages.json").read_text(encoding="utf-8"))
        pairs = {p["name"]: p["version"] for p in doc["packages"]}
        self.assertEqual(pairs.get("@bongbetic/react"), "1.119.0")
        self.assertEqual(len(doc["packages"]), 22)
        self.assertTrue(all(n.startswith("@bongbetic/") for n in pairs), sorted(pairs))


class GeneratorTest(unittest.TestCase):
    def test_extract_script_has_no_carbon_reference(self):
        text = (ROOT / "scripts" / "extract-data.mjs").read_text(encoding="utf-8")
        self.assertNotIn("@carbon", text)


class ContainerfileTest(unittest.TestCase):
    def setUp(self):
        self.text = (ROOT / "Containerfile").read_text(encoding="utf-8")

    def test_no_npmjs_in_containerfile(self):
        self.assertNotIn("npmjs", self.text)

    def test_npmrc_copied_before_npm_ci(self):
        npmrc_at = self.text.find("site/.npmrc")
        self.assertNotEqual(npmrc_at, -1, "stage 1 must copy site/.npmrc")
        self.assertLess(npmrc_at, self.text.find("npm ci"))


class InstallPageTest(unittest.TestCase):
    def test_install_is_a_getting_started_guide(self):
        text = (SRC / "pages" / "guidance.jsx").read_text(encoding="utf-8")
        self.assertIn("page: 'install'", text)

    def test_getting_started_guide_route_serves_install(self):
        routes = (SRC / "routes.jsx").read_text(encoding="utf-8")
        self.assertIn("path: '/getting-started/:page'", routes)

    def test_install_page_shows_both_npmrc_modes_and_scaffolder(self):
        text = (SRC / "pages" / "guidance.jsx").read_text(encoding="utf-8")
        self.assertIn("@bongbetic:registry=", text)
        self.assertIn("npx @bongbetic/create-design my-app", text)
        self.assertIn("--sovereign", text)
        self.assertIn("npm install @bongbetic/design", text)


class RunbookTest(unittest.TestCase):
    def setUp(self):
        self.text = RUNBOOK.read_text(encoding="utf-8")

    def test_no_coolify_instructions_left(self):
        self.assertNotIn("Coolify", self.text)

    def test_deploy_pointer_line(self):
        self.assertIn("Deploy: see docs/deploy-fatboy.md", self.text)

    def test_registry_installs_and_republish_documented(self):
        for needle in ("git.bongbetic.com", "sovereign", "GITEA_PUBLISH_TOKEN",
                       "python3 scripts/registry/registry.py registry/closure/package-lock.json",
                       "vendor/"):
            self.assertIn(needle, self.text, needle)


if __name__ == "__main__":
    unittest.main()
