#!/usr/bin/env python3
"""BongDesign server: self-hosted Carbon component library + MCP endpoint.

Serves the gallery (site/dist) and a minimal Streamable-HTTP MCP endpoint at
/mcp backed by data/components.json. Standard library only.

Auth: everything except /health and /login requires a session cookie
(browser login) or an Authorization header (Basic user:pass, or Bearer API
token for MCP clients). Credentials come from env:
  BONGDESIGN_USER, BONGDESIGN_PASS (required)
  BONGDESIGN_TOKEN (optional API token; defaults to unset)
  BONGDESIGN_OPEN=1 (local dev only: disable auth)
"""
import hashlib
import hmac
import json
import os
import posixpath
import secrets
import time
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'site', 'dist')
DATA = os.path.join(ROOT, 'data', 'components.json')
MCP_VERSION = '2025-03-26'
SERVER_NAME = 'bongdesign'
SERVER_VERSION = '1.119.0'

USER = os.environ.get('BONGDESIGN_USER', '')
PASS = os.environ.get('BONGDESIGN_PASS', '')
TOKEN = os.environ.get('BONGDESIGN_TOKEN', '')
OPEN = os.environ.get('BONGDESIGN_OPEN', '') == '1'
SESSION_TTL = 12 * 3600
SESSIONS = {}

if not OPEN and (not USER or not PASS):
    raise SystemExit('Set BONGDESIGN_USER and BONGDESIGN_PASS, or BONGDESIGN_OPEN=1 for local dev.')

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
    return f'{SITE_BASE}/#components'


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


def new_session():
    tok = secrets.token_urlsafe(32)
    SESSIONS[tok] = time.time() + SESSION_TTL
    return tok


def valid_session(headers):
    cookie = headers.get('Cookie', '')
    for part in cookie.split(';'):
        part = part.strip()
        if part.startswith('bongdesign_session='):
            tok = part.split('=', 1)[1]
            if SESSIONS.get(tok, 0) > time.time():
                return True
            SESSIONS.pop(tok, None)
    auth = headers.get('Authorization', '')
    if auth.startswith('Basic '):
        try:
            import base64
            userpass = base64.b64decode(auth[6:]).decode()
            u, _, p = userpass.partition(':')
            if hmac.compare_digest(u, USER) and hmac.compare_digest(p, PASS):
                return True
        except (ValueError, UnicodeDecodeError):
            pass
    if auth.startswith('Bearer ') and TOKEN:
        if hmac.compare_digest(auth[7:], TOKEN):
            return True
    return False


LOGIN_PAGE = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sign in — BongDesign</title>
<style>body{{font-family:sans-serif;background:#fff;color:#000;max-width:28rem;margin:4rem auto;padding:0 1rem}}
img{{display:block}}input{{display:block;width:100%;margin:.5rem 0;padding:.5rem;font-size:1rem}}
button{{background:#000;color:#fff;border:0;padding:.6rem 1.2rem;font-size:1rem;cursor:pointer}}
.err{{color:#e11d2a}}.rule{{height:3px;background:#e11d2a;margin:1rem 0}}</style>
</head><body>
<img src="https://bongbetic.com/branding/bongbetic-wordmark@2x.png" alt="Bongbetic" width="188" height="42" />
<div class="rule"></div>
<h1>BongDesign sign in</h1>
{err}
<form method="post" action="/login">
<input name="username" placeholder="Username" autocomplete="username" />
<input name="password" type="password" placeholder="Password" autocomplete="current-password" />
<button type="submit">Sign in</button>
</form></body></html>'''


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def log_message(self, *args):
        pass

    def end_headers(self):
        if self.path == '/index.html':
            self.send_header('Cache-Control', 'no-cache')
        elif self.path.startswith('/assets/'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        super().end_headers()

    def _json(self, code, obj, extra=None):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _html(self, code, text, cookie=None):
        body = text.encode()
        self.send_response(code)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        if cookie:
            self.send_header('Set-Cookie', f'bongdesign_session={cookie}; HttpOnly; Path=/; SameSite=Lax')
        self.end_headers()
        self.wfile.write(body)

    def _deny(self, mcp=False):
        if mcp:
            return self._json(401, {'jsonrpc': '2.0', 'id': None,
                                    'error': {'code': -32000, 'message': 'Unauthorized'}},
                              {'WWW-Authenticate': 'Basic realm="bongdesign"'})
        self.send_response(302)
        self.send_header('Location', '/login')
        self.end_headers()

    def authed(self):
        return OPEN or valid_session(self.headers)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/health':
            return self._json(200, {'status': 'ok', 'server': SERVER_NAME,
                                    'carbonTag': INDEX['meta']['carbonTag'],
                                    'components': len(COMPONENTS)})
        if path == '/login':
            return self._html(200, LOGIN_PAGE.format(err=''))
        if path == '/logout':
            for part in self.headers.get('Cookie', '').split(';'):
                if 'bongdesign_session=' in part:
                    SESSIONS.pop(part.strip().split('=', 1)[1], None)
            self.send_response(302)
            self.send_header('Location', '/login')
            self.end_headers()
            return
        if not self.authed():
            return self._deny(mcp=(path == '/mcp'))
        if path == '/api/components':
            return self._json(200, INDEX)
        if path == '/mcp':
            return self._json(405, {'error': 'Use POST with JSON-RPC for MCP.'})
        if path == '/' or not path.startswith(('/mcp', '/health', '/api/', '/login', '/logout')):
            rel = posixpath.normpath(urllib.parse.unquote(path).lstrip('/'))
            full = os.path.realpath(os.path.join(DIST, rel))
            if path != '/' and rel and full.startswith(os.path.realpath(DIST) + os.sep) \
                    and os.path.isfile(full):
                self.path = '/' + rel
            else:
                self.path = '/index.html'
            return super().do_GET()
        return self._json(404, {'error': 'not found'})

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path == '/login':
            try:
                length = int(self.headers.get('Content-Length', 0))
                form = urllib.parse.parse_qs(self.rfile.read(length).decode())
            except (ValueError, UnicodeDecodeError):
                form = {}
            u = form.get('username', [''])[0]
            p = form.get('password', [''])[0]
            if hmac.compare_digest(u, USER) and hmac.compare_digest(p, PASS):
                self.send_response(302)
                self.send_header('Set-Cookie',
                                 f'bongdesign_session={new_session()}; HttpOnly; Path=/; SameSite=Lax')
                self.send_header('Location', '/')
                self.end_headers()
            else:
                self._html(401, LOGIN_PAGE.format(err='<p class="err">Wrong username or password.</p>'))
            return
        if path != '/mcp':
            return self._json(404, {'error': 'not found'})
        if not self.authed():
            return self._deny(mcp=True)
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
    mode = 'OPEN (dev)' if OPEN else f'locked as {USER}'
    httpd = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    print(f'bongdesign serving {DIST} + /mcp on {port}, {mode}', flush=True)
    httpd.serve_forever()


if __name__ == '__main__':
    main()
