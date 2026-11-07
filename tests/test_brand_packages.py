"""T25: @bongbetic/brand and @bongbetic/design package contracts (no network, no build)."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "packages" / "brand"
DESIGN = ROOT / "packages" / "design"
SOURCE = Path("/media/Toto/Documents/bongbetic/Logo/bongbetic-brand")
ASSETS = ["b_glyph.svg", "wordmark-light.png", "wordmark-light@2x.png", "wordmark-dark.png",
          "wordmark-dark@2x.png", "icon-light-192.png", "icon-light-512.png", "icon-dark-192.png",
          "icon-dark-512.png", "favicon.ico", "favicon-16.png", "favicon-32.png", "favicon-48.png",
          "apple-touch-icon.png", "site.webmanifest"]


def pj(d):
    return json.loads((d / "package.json").read_text())


class BrandTest(unittest.TestCase):
    def test_manifest(self):
        p = pj(BRAND)
        self.assertEqual(p["name"], "@bongbetic/brand")
        self.assertEqual(p["license"], "Apache-2.0")
        self.assertEqual(p["type"], "module")
        self.assertIn("react", p["peerDependencies"])
        self.assertIn("@bongbetic/react", p["peerDependencies"])
        self.assertEqual(p["publishConfig"]["registry"],
                         "https://git.bongbetic.com/api/packages/bongbetic/npm/")
        for f in ("src", "assets", "styles.scss", "styles.css"):
            self.assertIn(f, p["files"])
        self.assertFalse(any("@carbon" in k or "@ibm" in k for k in p.get("dependencies", {})))

    def test_assets_vendored_and_identical_to_brand_folder(self):
        for a in ASSETS:
            f = BRAND / "assets" / a
            self.assertTrue(f.is_file(), a)
            if SOURCE.is_dir():
                self.assertEqual(hashlib.sha256(f.read_bytes()).digest(),
                                 hashlib.sha256((SOURCE / a).read_bytes()).digest(), a)

    def test_exports_components(self):
        src = (BRAND / "src" / "index.js").read_text()
        for name in ("BongbeticLogo", "BongbeticHeader", "brandAssets"):
            self.assertIn(f"export {{", src) if False else self.assertIn(name, src)
        self.assertIn("@bongbetic/react", src)
        self.assertNotIn("@carbon", src)
        self.assertTrue((BRAND / "src" / "index.d.ts").is_file())

    def test_accent_token_is_accent_only(self):
        css = (BRAND / "styles.css").read_text()
        self.assertIn("--bb-accent: #e11d2a", css)
        self.assertNotRegex(css, r"\.cds--btn[^{]*\{[^}]*#e11d2a")
        self.assertIn("bb-red-rule", css)

    def test_no_remote_urls_in_sources(self):
        for f in list((BRAND / "src").glob("*")) + [BRAND / "styles.css", BRAND / "styles.scss"]:
            self.assertNotIn("http://", f.read_text(), f.name)
            self.assertNotRegex(f.read_text(), r"https://(?!git\.bongbetic\.com)", f.name)


class DesignTest(unittest.TestCase):
    def test_manifest_and_reexports(self):
        p = pj(DESIGN)
        self.assertEqual(p["name"], "@bongbetic/design")
        for dep in ("@bongbetic/react", "@bongbetic/brand", "@bongbetic/styles"):
            self.assertIn(dep, {**p.get("dependencies", {}), **p.get("peerDependencies", {})})
        idx = (DESIGN / "src" / "index.js").read_text()
        self.assertIn("export * from '@bongbetic/react'", idx)
        self.assertIn("export * from '@bongbetic/brand'", idx)
        scss = (DESIGN / "styles.scss").read_text()
        self.assertIn("@use '@bongbetic/styles'", scss)
        self.assertIn("@bongbetic/brand/styles", scss)


if __name__ == "__main__":
    unittest.main()
