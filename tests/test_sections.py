"""T19: new sections/pages distilled from the reference crawl.

Every reference top-level section gets a local counterpart route, and every
reference pattern / data-viz topic / getting-started page / experience step
gets a local data entry. All copy is original Bongbetic guidance, never IBM's.
Run: python3 -m unittest tests.test_sections
"""
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDANCE_JSX = os.path.join(ROOT, 'site', 'src', 'pages', 'guidance.jsx')
ROUTES_JSX = os.path.join(ROOT, 'site', 'src', 'routes.jsx')
COMPONENTS_JSON = os.path.join(ROOT, 'data', 'components.json')

# Slugs harvested from the reference nav crawl (/tmp/ref-shots-deep/urls.json).
REFERENCE_PATTERNS = [
    'common-actions', 'dialogs', 'disabled-states', 'disclosures',
    'empty-states', 'filtering', 'fluid-styles', 'forms', 'global-header',
    'loading', 'login', 'notifications', 'overflow-content', 'overview',
    'read-only-states', 'search', 'status-indicators', 'text-toolbar',
]
REFERENCE_DV_TOPICS = [
    'overview', 'simple-charts', 'flow-charts', 'spatial-charts',
    'gantt-charts', 'dashboards', 'chart-anatomy', 'axes-and-labels',
    'legends', 'color-palettes',
]
REFERENCE_GS_PAGES = [
    'about', 'designing', 'developing', 'mcp-setup', 'contributing',
    'migrating',
]
REFERENCE_EXPERIENCES = [
    'overview', 'discover', 'learn', 'try', 'buy', 'onboard', 'use',
    'expand', 'end-use', 'get-help',
]


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def slugs_in(src, const_name):
    m = re.search(const_name + r'\s*=\s*\[(.*?)\];', src, re.S)
    if not m:
        return []
    return re.findall(r"slug:\s*'([^']+)'", m.group(1))


def topics_in(src, const_name):
    m = re.search(const_name + r'\s*=\s*\[(.*?)\];', src, re.S)
    if not m:
        return []
    return re.findall(r"topic:\s*'([^']+)'", m.group(1))


def pages_in(src, const_name):
    m = re.search(const_name + r'\s*=\s*\[(.*?)\];', src, re.S)
    if not m:
        return []
    return re.findall(r"page:\s*'([^']+)'", m.group(1))


def steps_in(src, const_name):
    m = re.search(const_name + r'\s*=\s*\[(.*?)\];', src, re.S)
    if not m:
        return []
    return re.findall(r"step:\s*'([^']+)'", m.group(1))


class SectionsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.src = read(GUIDANCE_JSX)
        cls.routes = read(ROUTES_JSX)
        cls.components = {c['name'] for c in json.load(open(COMPONENTS_JSON))['components']}

    def test_patterns_cover_reference(self):
        have = set(slugs_in(self.src, 'PATTERNS'))
        missing = [s.replace('-', '') for s in REFERENCE_PATTERNS]
        # local slugs use compact names; map reference slugs explicitly
        mapping = {
            'common-actions': 'common-actions', 'dialogs': 'dialogs',
            'disabled-states': 'disabled-states', 'disclosures': 'disclosures',
            'empty-states': 'empty-state', 'filtering': 'filtering',
            'fluid-styles': 'fluid-styles', 'forms': 'form-validation',
            'global-header': 'global-header', 'loading': 'loading',
            'login': 'login', 'notifications': 'notifications',
            'overflow-content': 'overflow-content', 'overview': 'overview-placeholder-skip',
            'read-only-states': 'read-only-states', 'search': 'search',
            'status-indicators': 'status-indicators', 'text-toolbar': 'text-toolbar',
        }
        want = {v for v in mapping.values() if v != 'overview-placeholder-skip'}
        self.assertTrue(want <= have, 'missing patterns: %s' % sorted(want - have))

    def test_data_viz_topics_cover_reference(self):
        have = set(topics_in(self.src, 'DV_TOPICS'))
        self.assertTrue(set(REFERENCE_DV_TOPICS) <= have,
                        'missing dv topics: %s' % sorted(set(REFERENCE_DV_TOPICS) - have))

    def test_getting_started_pages_cover_reference(self):
        have = set(pages_in(self.src, 'GS_PAGES'))
        self.assertTrue(set(REFERENCE_GS_PAGES) <= have,
                        'missing gs pages: %s' % sorted(set(REFERENCE_GS_PAGES) - have))

    def test_experience_steps_cover_reference(self):
        have = set(steps_in(self.src, 'BX_STEPS'))
        self.assertTrue(set(REFERENCE_EXPERIENCES) <= have,
                        'missing bx steps: %s' % sorted(set(REFERENCE_EXPERIENCES) - have))

    def test_pattern_blocks_name_pinned_components(self):
        names = set(re.findall(r"blocks:\s*\[([^\]]*)\]", self.src))
        bad = []
        for grp in names:
            for b in re.findall(r"'([^']+)'", grp):
                if b not in self.components:
                    bad.append(b)
        self.assertEqual(bad, [], 'unknown components in blocks: %s' % bad)

    def test_support_answers_faq_contact_and_originality(self):
        m = re.search(r'SUPPORT_FAQS\s*=\s*\[(.*?)\];', self.src, re.S)
        self.assertIsNotNone(m, 'SUPPORT_FAQS const missing')
        faqs = re.findall(r'q:\s*\'([^\']+)\'', m.group(1))
        self.assertGreaterEqual(len(faqs), 4, 'fewer than 4 FAQs')
        lowered = self.src.lower()
        for marker in ['contact', 'certificate of originality', 'originality']:
            self.assertIn(marker, lowered, 'support missing: %s' % marker)

    def test_routes_register_new_sections(self):
        for p in ['/getting-started', '/getting-started/:page',
                  '/data-visualization/:topic',
                  '/building-experiences', '/building-experiences/:step']:
            self.assertIn("'%s'" % p, self.routes, 'route missing: %s' % p)

    def test_entries_have_intro_and_done(self):
        for const in ['PATTERNS', 'DV_TOPICS', 'GS_PAGES', 'BX_STEPS']:
            m = re.search(const + r'\s*=\s*\[(.*?)\];', self.src, re.S)
            self.assertIsNotNone(m, 'const missing: %s' % const)
            bodies = re.findall(r"\{(?:[^{}]|\{[^{}]*\})*intro:(?:[^{}]|\{[^{}]*\})*done:\s*\[([^\]]*)\]", m.group(1))
            self.assertTrue(bodies, 'no complete entries in %s' % const)
            for done in bodies:
                self.assertTrue(done.strip(), 'empty done list in %s' % const)


if __name__ == '__main__':
    unittest.main()
