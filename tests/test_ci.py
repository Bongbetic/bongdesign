"""CI wiring is present: GitHub and Gitea build workflows run the server test suite and the e2e smoke.

Workflows are checked as text (stdlib only, no YAML parser).
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOW = ROOT / ".github" / "workflows" / "build.yml"
GITEA_BUILD = ROOT / ".gitea" / "workflows" / "build.yml"
GITEA_PUBLISH = ROOT / ".gitea" / "workflows" / "publish.yml"
RUNNER = "bongbetic-ci"
REGISTRY_SYNC = "python3 scripts/registry/registry.py registry/closure/package-lock.json"
NAMED_BUILD_COMMANDS = [
    "python3 -m unittest discover tests",
    "python3 scripts/e2e-smoke.py",
    "npm run check:coverage",
    "npm run build",
    "npm ci",
]
TEST_LITERALS = {
    "BONGDESIGN_USER": "citest",
    "BONGDESIGN_PASS": "citest-secret",
    "BONGDESIGN_TOKEN": "citest-token",
}


def _read(path):
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _on_block(text):
    """Lines under the top-level `on:` key, up to the next top-level key."""
    block, inside = [], False
    for line in text.splitlines():
        if line.startswith("on:"):
            inside = True
            continue
        if inside and line and not line[0].isspace():
            break
        if inside:
            block.append(line)
    return "\n".join(block)


def _events(text):
    return set(re.findall(r"^  ([A-Za-z_]+):", _on_block(text), re.M))


def _run_steps(text):
    """Shell text of every `run:` step: single-line values and `run: |` block lines."""
    lines = text.splitlines()
    out = []
    for i, line in enumerate(lines):
        m = re.match(r"^(\s*)(?:- )?run:\s*(.*)$", line)
        if not m:
            continue
        base, rest = len(m.group(1)), m.group(2).strip()
        if rest in ("|", "|-", ">"):
            for nxt in lines[i + 1:]:
                if not nxt.strip():
                    continue
                if len(nxt) - len(nxt.lstrip()) <= base:
                    break
                out.append(nxt.strip())
        else:
            out.append(rest)
    return out


class CiWiringTest(unittest.TestCase):
    def test_build_workflow_runs_server_tests(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("python3 -m unittest discover tests", text)

    def test_build_workflow_runs_e2e_smoke(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/e2e-smoke.py", text)


class GiteaBuildWorkflowTest(unittest.TestCase):
    def test_gitea_build_workflow_exists(self):
        self.assertTrue(GITEA_BUILD.is_file(), GITEA_BUILD)

    def test_gitea_build_runs_on_bongbetic_ci(self):
        self.assertRegex(_read(GITEA_BUILD), rf"(?m)^\s*runs-on:\s*{RUNNER}\s*$")

    def test_gitea_build_triggers_on_push_to_main_and_pull_request(self):
        text = _read(GITEA_BUILD)
        self.assertEqual({"push", "pull_request"}, _events(text))
        self.assertIn("branches: [main]", _on_block(text))

    def test_gitea_build_runs_every_run_step_of_github_build(self):
        gitea_steps = _run_steps(_read(GITEA_BUILD))
        for step in _run_steps(_read(WORKFLOW)):
            with self.subTest(step=step):
                self.assertIn(step, gitea_steps)

    def test_gitea_build_runs_named_commands(self):
        gitea_steps = _run_steps(_read(GITEA_BUILD))
        for cmd in NAMED_BUILD_COMMANDS:
            with self.subTest(cmd=cmd):
                self.assertIn(cmd, gitea_steps)

    def test_gitea_build_runs_in_node_container_with_checkout_v4(self):
        text = _read(GITEA_BUILD)
        self.assertIn("image: docker.io/library/node:24-bookworm", text)
        self.assertIn("actions/checkout@v4", text)

    def test_gitea_build_does_not_use_setup_node(self):
        self.assertNotIn("actions/setup-node", _read(GITEA_BUILD))

    def test_gitea_build_keeps_test_literals_from_github(self):
        text = _read(GITEA_BUILD)
        for key, value in TEST_LITERALS.items():
            with self.subTest(key=key):
                self.assertRegex(text, rf"(?m)^\s*{key}: {re.escape(value)}\s*$")


class GiteaPublishWorkflowTest(unittest.TestCase):
    def test_gitea_publish_workflow_exists(self):
        self.assertTrue(GITEA_PUBLISH.is_file(), GITEA_PUBLISH)

    def test_gitea_publish_is_manual_only(self):
        self.assertEqual({"workflow_dispatch"}, _events(_read(GITEA_PUBLISH)))

    def test_gitea_publish_runs_on_bongbetic_ci(self):
        self.assertRegex(_read(GITEA_PUBLISH), rf"(?m)^\s*runs-on:\s*{RUNNER}\s*$")

    def test_gitea_publish_runs_in_python_container(self):
        self.assertIn("image: docker.io/library/node:24-bookworm", _read(GITEA_PUBLISH))

    def test_gitea_publish_runs_registry_sync(self):
        self.assertIn(REGISTRY_SYNC, _run_steps(_read(GITEA_PUBLISH)))

    def test_gitea_publish_reads_token_only_from_secret(self):
        text = _read(GITEA_PUBLISH)
        self.assertRegex(
            text,
            r"(?m)^\s*GITEA_PUBLISH_TOKEN:\s*\$\{\{\s*secrets\.REGISTRY_PUBLISH_TOKEN\s*\}\}\s*$",
        )
        self.assertEqual({"REGISTRY_PUBLISH_TOKEN"}, set(re.findall(r"secrets\.([A-Za-z_]\w*)", text)))


class GiteaNoLiteralTokenTest(unittest.TestCase):
    def test_no_workflow_contains_a_literal_token(self):
        for path in (GITEA_BUILD, GITEA_PUBLISH):
            text = _read(path)
            with self.subTest(path=path.name):
                self.assertTrue(text, path)
                for line in text.splitlines():
                    if "sha256:" in line:
                        continue
                    self.assertNotRegex(line, r"[0-9a-fA-F]{32,}")
                    self.assertNotRegex(line, r"\b(?:gitea|ghp|gho|glpat)_[A-Za-z0-9_]{8,}")
                for key, value in re.findall(r"(?m)^\s*([A-Za-z_]*TOKEN)\s*:\s*(.+?)\s*$", text):
                    allowed = (
                        re.fullmatch(r"\$\{\{\s*secrets\.[A-Z_]+\s*\}\}", value)
                        or value == TEST_LITERALS.get(key)
                    )
                    self.assertTrue(allowed, f"{key} has a literal value")


if __name__ == "__main__":
    unittest.main()
