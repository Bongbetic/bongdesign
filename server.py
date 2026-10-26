#!/usr/bin/env python3
"""BongDesign server: self-hosted Carbon component library + MCP endpoint.

Serves the static gallery (site/dist) and a minimal Streamable-HTTP MCP
endpoint at /mcp backed by data/components.json. Standard library only.
"""
import json
import os
import posixpath
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'site', 'dist')
DATA = os.path.join(ROOT, 'data', 'components.json')
MCP_VERSION = '2025-03-26'
SERVER_NAME = 'bongdesign'
SERVER_VERSION = '1.119.0'

with open(DATA, encoding='utf-8') as f:
    INDEX = json.load(f)
COMPONENTS = INDEX['components']
BY_NAME = {c['name'].lower(): c for c in COMPONENTS}
SITE_BASE = os.environ.get('BONGDESIGN_PUBLIC_BASE', 'https://design.bongbetic.com')

EXAMPLES = {
    'Button': "import { Button } from '@carbon/react';\n<Button kind=\"primary\">Save</Button>",
    'TextInput': "import { TextInput } from '@carbon/react';\n<TextInput id=\"name\" labelText=\"Name\" placeholder=\"Ada\" />",
    'Dropdown': "import { Dropdown } from '@carbon/react';\n<Dropdown id=\"d\" titleText=\"Pick\" label=\"Choose\" items={['A', 'B']} />",
    'Modal': "import { Modal } from '@carbon/react';\n<Modal open modalHeading=\"Title\" primaryButtonText=\"OK\" />",
    'DataTable': "import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';",
    'Accordion': "import { Accordion, AccordionItem } from '@carbon/react';\n<Accordion><AccordionItem title=\"One\">Body</AccordionItem></Accordion>",
    'Notification': "import { InlineNotification } from '@carbon/react';\n<InlineNotification kind=\"info\" title=\"Hi\" subtitle=\"Self-hosted.\" />",
    'Tabs': "import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';",
}


def example_for(name):
    if name in EXAMPLES:
        return EXAMPLES[name]
    return f"import {{ {name} }} from '@carbon/react';\n<{name} />"


def doc_url(doc):
    if not doc:
        return None
    return f'{SITE_BASE}/components/{doc}'


TOOLS = [
    {'name': 'server_info', 'description': 'BongDesign server identity, pinned Carbon version and counts.',
     'inputSchema': {'type': 'object', 'properties': {}}},
    {'name': 'list_components', 'description': 'List all indexed components, optional substring filter.',
     'inputSchema': {'type': 'object', 'properties': {'filter': {'type': 'string'}}}},
    {'name': 'get_component', 'description': 'Details, docs URL and React example for one component.',
     'inputSchema': {'type': 'object', 'properties': {'name': {'type': 'string'}}, 'required': ['name']}},
    {'name': 'search_components', 'description': 'Substring search over component names.',
     'inputSchema': {'type': 'object', 'properties': {'query': {'type': 'string'}}, 'required': ['query']}},
]


def tool_result(value):
    return {'content': [{'type': 'text', 'text': json.dumps(value, indent=2)}]}


def call_tool(name, args):
    if name == 'server_info':
        return tool_result({'server': SERVER_NAME, 'version': SERVER_VERSION,
                            'carbonTag': INDEX['meta']['carbonTag'],
                            'components': len(COMPONENTS), 'site': SITE_BASE,
                            'upstream': INDEX['meta']['upstream']})
    if name == 'list_components':
        filt = (args.get('filter') or '').lower()
        names = [c['name'] for c in COMPONENTS if filt in c['name'].lower()]
        return tool_result({'count': len(names), 'components': names})
    if name == 'get_component':
        c = BY_NAME.get((args.get('name') or '').lower())
        if not c:
            return {'content': [{'type': 'text', 'text': f"Unknown component '{args.get('name')}'."}],
                    'isError': True}
        return tool_result({'name': c['name'], 'docs': doc_url(c['doc']),
                            'example': example_for(c['name']),
                            'gallery': f'{SITE_BASE}/#index'})
    if name == 'search_components':
        q = (args.get('query') or '').lower()
        hits = [c['name'] for c in COMPONENTS if q in c['name'].lower()]
        return tool_result({'query': args.get('query'), 'count': len(hits), 'hits': hits})
    return {'content': [{'type': 'text', 'text': f'Unknown tool {name}.'}], 'isError': True}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def log_message(self, *args):
        pass

    def _json(self, code, obj, extra=None):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/health':
            return self._json(200, {'status': 'ok', 'server': SERVER_NAME,
                                    'carbonTag': INDEX['meta']['carbonTag'],
                                    'components': len(COMPONENTS)})
        if path == '/api/components':
            return self._json(200, INDEX)
        if path == '/mcp':
            return self._json(405, {'error': 'Use POST with JSON-RPC for MCP.'})
        if path == '/' or not path.startswith(('/mcp', '/health', '/api/')):
            if path == '/':
                self.path = '/index.html'
            else:
                cand = os.path.join(DIST, posixpath.basename(path))
                if not os.path.isfile(cand):
                    self.path = '/index.html'
            return super().do_GET()
        return self._json(404, {'error': 'not found'})

    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != '/mcp':
            return self._json(404, {'error': 'not found'})
        try:
            length = int(self.headers.get('Content-Length', 0))
            req = json.loads(self.rfile.read(length) or b'{}')
        except (ValueError, OSError):
            return self._json(400, {'jsonrpc': '2.0', 'id': None,
                                    'error': {'code': -32700, 'message': 'Parse error'}})
        rid, method, params = req.get('id'), req.get('method'), req.get('params') or {}
        if method == 'initialize':
            result = {'protocolVersion': MCP_VERSION,
                      'capabilities': {'tools': {}},
                      'serverInfo': {'name': SERVER_NAME, 'version': SERVER_VERSION}}
        elif method in ('notifications/initialized', 'notifications/cancelled'):
            if 'id' not in req or rid is None:
                self.send_response(202)
                self.end_headers()
                return
            result = {}
        elif method == 'ping':
            result = {}
        elif method == 'tools/list':
            result = {'tools': TOOLS}
        elif method == 'tools/call':
            result = call_tool(params.get('name'), params.get('arguments') or {})
        else:
            return self._json(200, {'jsonrpc': '2.0', 'id': rid,
                                    'error': {'code': -32601, 'message': f'Unknown method {method}'}})
        self._json(200, {'jsonrpc': '2.0', 'id': rid, 'result': result},
                   {'MCP-Protocol-Version': MCP_VERSION})


def main():
    port = int(os.environ.get('PORT', '8000'))
    httpd = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    print(f'bongdesign serving {DIST} + /mcp on {port}', flush=True)
    httpd.serve_forever()


if __name__ == '__main__':
    main()
