"""T09: deep MCP tools from the generated data — pinned design-system knowledge.

Through the public /mcp JSON-RPC seam with a bearer token.
Run: python3 -m unittest tests.test_mcp
"""
import json
import unittest

from tests.support import TEST_TOKEN, ServerProcess

CARBON_TAG = 'v1.119.0'
NEW_TOOLS = ['lookup_token', 'search_icons', 'search_pictograms', 'get_branding']
CALL_ARGS = {
    'get_component': {'name': 'Button'},
    'lookup_token': {'name': 'blue60'},
    'search_icons': {'query': 'Accessibility'},
    'search_pictograms': {'query': 'AiEthics'},
    'get_branding': {},
}


class McpToolsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ServerProcess()
        cls.addClassCleanup(cls.server.stop)
        cls.server.wait_ready()

    def call(self, name, args=None, token=TEST_TOKEN):
        return self.server.mcp(
            'tools/call', {'name': name, 'arguments': args if args is not None else {}},
            token=token)

    def payload(self, name, args=None):
        status, body = self.call(name, args)
        self.assertEqual(status, 200, name)
        self.assertNotIn('isError', body['result'], name)
        return json.loads(body['result']['content'][0]['text'])


class ToolListTest(McpToolsTestCase):
    def test_tools_list_exposes_the_deep_data_tools(self):
        status, body = self.server.mcp('tools/list', token=TEST_TOKEN)
        self.assertEqual(status, 200)
        names = [t['name'] for t in body['result']['tools']]
        for tool in NEW_TOOLS:
            self.assertIn(tool, names)


class GetComponentTest(McpToolsTestCase):
    def test_get_component_button_returns_real_props_and_runnable_example(self):
        info = self.payload('get_component', {'name': 'Button'})
        self.assertEqual(info['carbonTag'], CARBON_TAG)
        prop_names = [p['name'] for p in info['props']]
        self.assertIn('kind', prop_names)
        self.assertIn('size', prop_names)
        self.assertIn('<Button', info['example'])
        self.assertIn('import', info['example'])

    def test_get_component_button_carries_guidance_specs_and_a11y(self):
        info = self.payload('get_component', {'name': 'Button'})
        self.assertGreater(len(info['guidelines']), 0)
        self.assertIn('variants', info['specs'])
        self.assertGreater(len(info['a11y']), 0)


class TokenLookupTest(McpToolsTestCase):
    def test_lookup_token_blue60_returns_the_pinned_hex(self):
        info = self.payload('lookup_token', {'name': 'blue60'})
        self.assertEqual(info['carbonTag'], CARBON_TAG)
        values = [m['value'] for m in info['matches']]
        self.assertIn('#0f62fe', values)


class IconSearchTest(McpToolsTestCase):
    def test_search_icons_by_name_fragment_returns_pinned_names(self):
        info = self.payload('search_icons', {'query': 'Accessibility'})
        self.assertEqual(info['carbonTag'], CARBON_TAG)
        self.assertGreater(len(info['hits']), 0)
        self.assertIn('Accessibility16', info['hits'])

    def test_search_pictograms_by_name_fragment_returns_pinned_names(self):
        info = self.payload('search_pictograms', {'query': 'AiEthics'})
        self.assertEqual(info['carbonTag'], CARBON_TAG)
        self.assertGreater(len(info['hits']), 0)
        self.assertIn('AiEthics', info['hits'])


class BrandingTest(McpToolsTestCase):
    def test_get_branding_summarises_the_vendored_assets(self):
        info = self.payload('get_branding', {})
        self.assertEqual(info['carbonTag'], CARBON_TAG)
        self.assertIn('bongbetic-glyph.svg', info['assets'])


class ToolAuthTest(McpToolsTestCase):
    def test_every_tool_call_without_token_is_401(self):
        for name in list(CALL_ARGS):
            status, body = self.call(name, CALL_ARGS[name], token=None)
            self.assertEqual(status, 401, name)
            self.assertEqual(body['error']['message'], 'Unauthorized')

    def test_every_tool_call_with_token_is_200(self):
        for name in list(CALL_ARGS):
            status, _ = self.call(name, CALL_ARGS[name], token=TEST_TOKEN)
            self.assertEqual(status, 200, name)


if __name__ == '__main__':
    unittest.main()
