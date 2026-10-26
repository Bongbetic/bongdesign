"""CI wiring is present: build.yml runs the server test suite and the e2e smoke."""
import unittest
from pathlib import Path

WORKFLOW = Path(__file__).resolve().parent.parent / ".github" / "workflows" / "build.yml"


class CiWiringTest(unittest.TestCase):
    def test_build_workflow_runs_server_tests(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("python3 -m unittest discover tests", text)

    def test_build_workflow_runs_e2e_smoke(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/e2e-smoke.py", text)


if __name__ == "__main__":
    unittest.main()
