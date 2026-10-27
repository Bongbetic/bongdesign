"""T11 acceptance crawl: every routed page serves the SPA shell when signed in.

Boots the real server in locked mode against the real build (site/dist) and
walks the route registry from site/src/routes.jsx: every registry route must
answer GET with 200 text/html containing the shell marker when signed in.
GET /mcp with a browser Accept header is a routed page (McpPage) and must
serve the shell; with a non-HTML Accept it stays a 405 JSON transport hint
so POST /mcp JSON-RPC keeps working exactly as-is.

Standard library only, localhost only. Skips gracefully when site/dist is
absent (offline / unbuilt checkout).
Run: python3 -m unittest tests.test_crawl
"""
import json
import os
import re
import unittest
import urllib.parse

from tests.support import TEST_PASS, TEST_USER, ServerProcess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_INDEX = os.path.join(ROOT, 'site', 'dist', 'index.html')
ROUTES_JSX = os.path.join(ROOT, 'site', 'src', 'routes.jsx')
FOUNDATIONS_JSX = os.path.join(ROOT, 'site', 'src', 'foundations.jsx')
GUIDANCE_JSX = os.path.join(ROOT, 'site', 'src', 'pages', 'guidance.jsx')
COMPONENTS_JSON = os.path.join(ROOT, 'data', 'components.json')

SHELL_MARKER = 'id="root"'
HTML_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'


def registry_routes():
    """Expand the ROUTES table in site/src/routes.jsx into concrete GET paths."""
    with open(ROUTES_JSX, encoding='utf-8') as f:
        routes_src = f.read()
    table_paths = re.findall(r"path:\s*'([^']+)'", routes_src)
    with open(COMPONENTS_JSON, encoding='utf-8') as f:
        names = [c['name'] for c in json.load(f)['components']]
    with open(FOUNDATIONS_JSX, encoding='utf-8') as f:
        slugs = [m.group(1) for m in
                 re.finditer(r"id:\s*'foundations-([^']+)'", f.read())]
    with open(GUIDANCE_JSX, encoding='utf-8') as f:
        patterns = [m.group(1) for m in
                    re.finditer(r"slug:\s*'([^']+)'", f.read())]
    paths = []
    for p in table_paths:
        if p == '/components/:name':
            paths.extend('/components/' + n.lower() for n in names)
        elif p == '/foundations/:slug':
            paths.append('/foundations')
            paths.extend('/foundations/' + s for s in slugs)
        elif p == '/patterns/:name':
            paths.extend('/patterns/' + s for s in patterns)
        else:
            paths.append(p)
    return table_paths, paths


class CrawlTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.isfile(DIST_INDEX):
            raise unittest.SkipTest('site/dist not built')
        with open(DIST_INDEX, encoding='utf-8') as f:
            assert SHELL_MARKER in f.read(), 'built shell has no root marker'
        cls.server = ServerProcess()
        cls.addClassCleanup(cls.server.stop)
        cls.server.wait_ready()
        form = urllib.parse.urlencode({'username': TEST_USER, 'password': TEST_PASS})
        status, resp, _ = cls.server.request(
            'POST', '/login', form,
            {'Content-Type': 'application/x-www-form-urlencoded'})
        assert status == 302, f'login failed: {status}'
        cls.cookie = {'Cookie': resp.getheader('Set-Cookie').split(';')[0],
                      'Accept': HTML_ACCEPT}

    def assert_shell(self, path, headers=None):
        status, resp, body = self.server.request(
            'GET', path, headers=headers or self.cookie)
        self.assertEqual(status, 200, f'GET {path} -> {status}')
        self.assertIn('text/html', resp.getheader('Content-Type') or '',
                      f'GET {path} is not text/html')
        self.assertIn(SHELL_MARKER, body.decode(errors='replace'),
                      f'GET {path} has no shell marker')

    def test_registry_table_covers_every_section(self):
        table_paths, _ = registry_routes()
        for expected in ('/', '/components', '/components/:name',
                         '/foundations/:slug', '/patterns', '/patterns/:name',
                         '/data-visualization', '/support', '/mcp'):
            self.assertIn(expected, table_paths, f'ROUTES table lost {expected}')

    def test_every_registry_route_serves_shell_when_signed_in(self):
        _, paths = registry_routes()
        self.assertGreater(len(paths), 170, f'registry crawl too small: {len(paths)}')
        for path in paths:
            with self.subTest(path=path):
                self.assert_shell(path)

    def test_all_component_urls_serve_shell(self):
        with open(COMPONENTS_JSON, encoding='utf-8') as f:
            names = [c['name'] for c in json.load(f)['components']]
        self.assertEqual(len(names), 147, f'component index is not 147: {len(names)}')
        served = 0
        for name in names:
            with self.subTest(name=name):
                self.assert_shell('/components/' + name.lower())
                served += 1
        self.assertEqual(served, 147)

    def test_mcp_html_get_serves_shell_when_signed_in(self):
        self.assert_shell('/mcp')

    def test_mcp_non_html_get_stays_405_when_signed_in(self):
        for accept in ('application/json', '*/*', ''):
            with self.subTest(accept=accept):
                headers = dict(self.cookie, Accept=accept)
                status, resp, body = self.server.request('GET', '/mcp', headers=headers)
                self.assertEqual(status, 405, f'GET /mcp Accept={accept!r} -> {status}')
                self.assertIn('application/json',
                              resp.getheader('Content-Type') or '')
                self.assertIn('POST', body.decode(errors='replace'))

    def test_signed_out_routed_get_redirects_to_login(self):
        for path in ('/', '/components', '/support', '/data-visualization'):
            with self.subTest(path=path):
                status, resp, _ = self.server.request(
                    'GET', path, headers={'Accept': HTML_ACCEPT})
                self.assertEqual(status, 302, f'signed-out GET {path} -> {status}')
                self.assertEqual(resp.getheader('Location'), '/login')
        status, resp, _ = self.server.request(
            'GET', '/mcp', headers={'Accept': HTML_ACCEPT})
        self.assertEqual(status, 302, f'signed-out HTML GET /mcp -> {status}')
        self.assertEqual(resp.getheader('Location'), '/login')

    def test_signed_out_mcp_non_html_get_stays_401(self):
        status, _, _ = self.server.request(
            'GET', '/mcp', headers={'Accept': 'application/json'})
        self.assertEqual(status, 401)

    def test_post_mcp_still_json_rpc_when_signed_in(self):
        status, body = self.server.mcp('ping', token=None)
        self.assertEqual(status, 401)
        from tests.support import TEST_TOKEN
        status, body = self.server.mcp('ping', token=TEST_TOKEN)
        self.assertEqual(status, 200)
        self.assertEqual(body['result'], {})


if __name__ == '__main__':
    unittest.main()
