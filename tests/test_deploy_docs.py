"""T29: the fatboy deploy guide and README describe the fatboy path. Coolify is not used any more."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEPLOY = ROOT / "docs" / "deploy-fatboy.md"
README = ROOT / "README.md"
REGISTRY = "https://git.bongbetic.com/api/packages/bongbetic/npm/"


def coolify_lines_without_retirement(text):
    return [line for line in text.splitlines() if "Coolify" in line and "no longer used" not in line]


class DeployGuideTest(unittest.TestCase):
    def setUp(self):
        self.text = DEPLOY.read_text(encoding="utf-8")

    def test_guide_exists(self):
        self.assertTrue(DEPLOY.is_file())

    def test_create_command_is_one_line(self):
        self.assertIn(
            "fatboy app new bongdesign --type git --repo https://git.bongbetic.com/bongbetic/bongdesign.git "
            "--branch main --port 8000 --health-path /health",
            self.text,
        )

    def test_owner_secret_step(self):
        self.assertIn("fatboy app env bongdesign edit", self.text)

    def test_domain_step(self):
        self.assertIn("fatboy domain add design.bongbetic.com", self.text)

    def test_health_path_documented(self):
        self.assertIn("/health", self.text)

    def test_rollback_documented(self):
        self.assertIn("fatboy app rollback bongdesign", self.text)

    def test_backups_off_and_stateless_stated(self):
        self.assertIn("Backups on fatboy are currently off", self.text)
        self.assertIn("The app is stateless", self.text)

    def test_coolify_only_in_retirement_sentence(self):
        self.assertEqual(coolify_lines_without_retirement(self.text), [])

    def test_verification_checks_are_covered(self):
        for needle in ("fatboy app status bongdesign", "fatboy app logs bongdesign", "127.0.0.1",
                       "https://design.bongbetic.com/health", "/login", "/mcp", "401", "fatboy status"):
            self.assertIn(needle, self.text)

    def test_health_check_uses_get_not_head(self):
        # server.py has no HEAD handler: `curl -I` on /health does not return 200.
        self.assertNotIn("curl -sI https://design.bongbetic.com/health", self.text)

    def test_links_to_mirrors_script(self):
        self.assertIn("scripts/mirrors.sh", self.text)


class ReadmeTest(unittest.TestCase):
    def setUp(self):
        self.text = README.read_text(encoding="utf-8")

    def test_no_coolify_deploy_heading(self):
        self.assertIsNone(re.search(r"^#+\s*Coolify deploy", self.text, re.M | re.I))

    def test_coolify_only_in_retirement_sentence(self):
        self.assertEqual(coolify_lines_without_retirement(self.text), [])

    def test_scaffolder_and_registry_documented(self):
        self.assertIn("npx @bongbetic/create-design", self.text)
        self.assertIn(REGISTRY, self.text)

    def test_npmrc_modes_documented(self):
        self.assertIn(f"@bongbetic:registry={REGISTRY}", self.text)
        self.assertIn(f"\nregistry={REGISTRY}", self.text)

    def test_site_urls_documented(self):
        for needle in ("https://design.bongbetic.com", "/mcp", "/health"):
            self.assertIn(needle, self.text)

    def test_links_deploy_guide_and_runbook(self):
        self.assertIn("docs/deploy-fatboy.md", self.text)
        self.assertIn("docs/runbook.md", self.text)


if __name__ == "__main__":
    unittest.main()
