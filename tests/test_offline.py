"""T12 acceptance (SC-4): the repo alone rebuilds BongDesign offline.

Static, CI-safe proof prerequisites: no privileges, no network. The live
clean-clone offline build (npm ci --offline, vite build, server boot +
smoke) is recorded as the T12 evidence log; this suite locks in everything
that can be asserted without a network namespace:
- vendor/ holds a tarball for every VERSION pin (offline insurance)
- upstream-carbon/ is tracked plain files, no nested .git
- brand assets are vendored locally, no remote fetches at build time
- the lockfile resolves only from registry.npmjs.org (one registry to seal)
- the operator runbook exists and covers build/run/pin-bump/rotation/rollback
- the README documents the offline install command
"""
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = ROOT / "VERSION"
VENDOR = ROOT / "vendor"
RUNBOOK = ROOT / "docs" / "runbook.md"
README = ROOT / "README.md"


def vendor_name(pkg, ver):
    if pkg.startswith("@"):
        scope, name = pkg[1:].split("/", 1)
        return f"{scope}-{name}-{ver}.tgz"
    return f"{pkg}-{ver}.tgz"


def version_pins():
    pins = []
    for line in VERSION.read_text(encoding="utf-8").splitlines():
        if line.startswith("@") and "=" in line:
            pkg, ver = line.split("=", 1)
            pins.append((pkg.strip(), ver.strip()))
    return pins


class OfflineInsuranceTest(unittest.TestCase):
    def test_vendor_tarball_for_every_version_pin(self):
        pins = version_pins()
        self.assertGreater(len(pins), 0, "VERSION has no pins")
        missing = [f"{p}@{v}" for p, v in pins
                   if not (VENDOR / vendor_name(p, v)).is_file()]
        self.assertEqual(missing, [], f"missing vendored tarballs: {missing}")

    def test_no_nested_git_under_upstream_snapshot(self):
        self.assertFalse((ROOT / "upstream-carbon" / ".git").exists(),
                         "nested .git would break clean-clone insurance")

    def test_upstream_snapshot_tracked_in_git(self):
        out = subprocess.run(["git", "ls-files", "--error-unmatch",
                              "upstream-carbon/package.json"],
                             cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(out.returncode, 0,
                         "upstream-carbon/ must be tracked plain files")

    def test_no_remote_branding_fetches_in_site_sources(self):
        hits = []
        roots = list((ROOT / "site" / "src").rglob("*.jsx")) + \
            list((ROOT / "site" / "src").rglob("*.js")) + \
            [ROOT / "site" / "index.html"]
        for path in roots:
            if path.is_file() and "node_modules" not in path.parts \
                    and "dist" not in path.parts:
                text = path.read_text(encoding="utf-8", errors="replace")
                if "bongbetic.com/branding/" in text:
                    hits.append(str(path.relative_to(ROOT)))
        self.assertEqual(hits, [], f"remote branding fetches: {hits}")

    def test_branding_refs_resolve_locally(self):
        refs = set()
        for path in list((ROOT / "site" / "src").rglob("*")) + \
                [ROOT / "site" / "index.html"]:
            if path.is_file():
                refs.update(re.findall(r"/branding/[^\"' )]*",
                                        path.read_text(encoding="utf-8",
                                                       errors="replace")))
        self.assertGreater(len(refs), 0, "no /branding/* refs found at all")
        missing = [r for r in refs
                   if not (ROOT / "site" / "public" / r.lstrip("/")).is_file()]
        self.assertEqual(missing, [], f"unresolved brand refs: {missing}")

    def test_lockfile_resolves_only_from_npmjs_registry(self):
        lock = ROOT / "site" / "package-lock.json"
        urls = set(re.findall(r'"resolved":\s*"([^"]+)"',
                              lock.read_text(encoding="utf-8")))
        self.assertGreater(len(urls), 0, "no resolved URLs in lockfile")
        foreign = sorted(u for u in urls
                         if not u.startswith("https://registry.npmjs.org/"))
        self.assertEqual(foreign, [],
                         f"lockfile reaches past npmjs: {foreign[:5]}")


class RunbookTest(unittest.TestCase):
    def test_runbook_exists(self):
        self.assertTrue(RUNBOOK.is_file(), "docs/runbook.md is missing")

    def test_runbook_covers_required_sections(self):
        text = RUNBOOK.read_text(encoding="utf-8").lower()
        for section in ("offline build", "run", "pin-bump", "pin bump",
                        "rotation", "rollback",
                        "bongdesign_user", "bongdesign_pass",
                        "bongdesign_token"):
            self.assertIn(section, text, f"runbook never mentions {section!r}")

    def test_readme_documents_offline_install(self):
        text = README.read_text(encoding="utf-8")
        self.assertIn("npm ci --offline", text,
                      "README must document the offline install command")
        self.assertIn("docs/runbook.md", text,
                      "README must point at the operator runbook")


if __name__ == "__main__":
    unittest.main()
