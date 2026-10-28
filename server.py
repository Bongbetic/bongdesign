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
SESSION_TTL = int(os.environ.get('BONGDESIGN_SESSION_TTL', str(12 * 3600)))
SESSIONS = {}
LOGIN_MAX_FAILS = 10
LOGIN_WINDOW = 5 * 60
LOGIN_COOLDOWN = 60
_LOGIN_FAILS = {}
_LOGIN_BLOCKED_UNTIL = {}


def login_allowed(ip):
    now = time.time()
    if _LOGIN_BLOCKED_UNTIL.get(ip, 0) > now:
        return False
    recent = [t for t in _LOGIN_FAILS.get(ip, []) if now - t < LOGIN_WINDOW]
    _LOGIN_FAILS[ip] = recent
    return True


def record_login_fail(ip):
    now = time.time()
    fails = _LOGIN_FAILS.get(ip, [])
    fails.append(now)
    _LOGIN_FAILS[ip] = fails
    if len(fails) >= LOGIN_MAX_FAILS:
        _LOGIN_BLOCKED_UNTIL[ip] = now + LOGIN_COOLDOWN


def record_login_ok(ip):
    _LOGIN_FAILS.pop(ip, None)
    _LOGIN_BLOCKED_UNTIL.pop(ip, None)


def session_cookie_value(tok):
    return f'bongdesign_session={tok}; HttpOnly; Path=/; SameSite=Lax; Secure'

if not OPEN and (not USER or not PASS):
    raise SystemExit('Set BONGDESIGN_USER and BONGDESIGN_PASS, or BONGDESIGN_OPEN=1 for local dev.')

with open(DATA, encoding='utf-8') as f:
    INDEX = json.load(f)
COMPONENTS = INDEX['components']
BY_NAME = {c['name'].lower(): c for c in COMPONENTS}


def _load_data(name):
    with open(os.path.join(ROOT, 'data', name), encoding='utf-8') as f:
        return json.load(f)


CARBON_TAG = INDEX['meta']['carbonTag']
PROPS = _load_data('props.json')['components']
TOKENS = _load_data('tokens.json')
ICONS = _load_data('icons.json')
GUIDELINES = _load_data('guidelines.json')
BRANDING_DIR = os.path.join(ROOT, 'site', 'public', 'branding')


def _flatten(prefix, obj, out):
    if isinstance(obj, dict):
        for key, val in obj.items():
            _flatten(f'{prefix}.{key}' if prefix else key, val, out)
    else:
        out.append((prefix, obj))


TOKEN_INDEX = []
for _section in ('colors', 'layout', 'motion', 'type', 'themes'):
    _flat = []
    _flatten('', TOKENS.get(_section, {}), _flat)
    for _path, _val in _flat:
        TOKEN_INDEX.append((_section, _path, _path.split('.')[-1], _val))


def branding_assets():
    try:
        return sorted(os.listdir(BRANDING_DIR))
    except OSError:
        return []
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
    {'name': 'lookup_token', 'description': 'Look up a Carbon design token (color, layout, motion, type, theme) by name; pinned values.',
     'inputSchema': {'type': 'object', 'properties': {'name': {'type': 'string'}}, 'required': ['name']}},
    {'name': 'search_icons', 'description': 'Substring search over pinned Carbon icon names.',
     'inputSchema': {'type': 'object', 'properties': {'query': {'type': 'string'}, 'limit': {'type': 'integer'}}, 'required': ['query']}},
    {'name': 'search_pictograms', 'description': 'Substring search over pinned Carbon pictogram names.',
     'inputSchema': {'type': 'object', 'properties': {'query': {'type': 'string'}, 'limit': {'type': 'integer'}}, 'required': ['query']}},
    {'name': 'get_branding', 'description': 'Bongbetic brand summary: accent colour and vendored local assets.',
     'inputSchema': {'type': 'object', 'properties': {}}},
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
        return tool_result({'carbonTag': CARBON_TAG, 'count': len(names), 'components': names})
    if name == 'get_component':
        c = BY_NAME.get((args.get('name') or '').lower())
        if not c:
            return {'content': [{'type': 'text', 'text': f"Unknown component '{args.get('name')}'."}],
                    'isError': True}
        entry = PROPS.get(c['name'], {})
        mined = entry.get('example', '')
        if mined and 'import' not in mined:
            example = f"import {{ {c['name']} }} from '@carbon/react';\n{mined}"
        else:
            example = mined or example_for(c['name'])
        guide = GUIDELINES.get(c['name'].lower(), {})
        return tool_result({'name': c['name'], 'carbonTag': CARBON_TAG,
                            'docs': doc_url(c['doc']),
                            'example': example,
                            'props': entry.get('props', []),
                            'guidelines': guide.get('guidelines', []),
                            'specs': guide.get('specs', {}),
                            'a11y': guide.get('a11y', []),
                            'gallery': f'{SITE_BASE}/#index'})
    if name == 'search_components':
        q = (args.get('query') or '').lower()
        hits = [c['name'] for c in COMPONENTS if q in c['name'].lower()]
        return tool_result({'query': args.get('query'), 'carbonTag': CARBON_TAG,
                            'count': len(hits), 'hits': hits})
    if name == 'lookup_token':
        q = (args.get('name') or '').strip().lower()
        exact = [m for m in TOKEN_INDEX if m[2].lower() == q or m[1].lower() == q]
        found = exact if exact else [m for m in TOKEN_INDEX
                                     if q and (q in m[2].lower() or q in m[1].lower())][:20]
        return tool_result({'query': args.get('name'), 'carbonTag': CARBON_TAG,
                            'count': len(found),
                            'matches': [{'section': s, 'token': p, 'value': v}
                                        for s, p, _, v in found]})
    if name in ('search_icons', 'search_pictograms'):
        group = ICONS['icons'] if name == 'search_icons' else ICONS['pictograms']
        q = (args.get('query') or '').lower()
        try:
            limit = int(args.get('limit') or 20)
        except (TypeError, ValueError):
            limit = 20
        hits = [n for n in group['names'] if q in n.lower()]
        return tool_result({'query': args.get('query'), 'carbonTag': CARBON_TAG,
                            'count': len(hits), 'total': group['total'],
                            'hits': hits[:max(limit, 0)]})
    if name == 'get_branding':
        return tool_result({'carbonTag': CARBON_TAG, 'accent': '#e11d2a',
                            'assets': branding_assets(),
                            'note': 'Brand assets are vendored locally, never hotlinked.'})
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
<style>body{{font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;background:#fff;color:#161616;margin:0}}
.bar{{height:3rem;display:flex;align-items:center;gap:.75rem;padding:0 1rem;border-bottom:1px solid #e0e0e0}}
.rule{{height:3px;background:#e11d2a}}
.card{{max-width:26rem;margin:4rem auto;padding:0 1rem}}
.cds--label{{display:block;font-size:.75rem;margin:1rem 0 .5rem}}
.cds--text-input{{display:block;width:100%;box-sizing:border-box;padding:.6875rem 1rem;font-size:.875rem;border:0;border-bottom:1px solid #8d8d8d;background:#f4f4f4}}
.cds--btn{{margin-top:1.5rem;background:#0f62fe;color:#fff;border:0;padding:.9375rem 1rem;font-size:.875rem;cursor:pointer;width:100%}}
.err{{color:#da1e28}}</style>
</head><body>
<div class="bar"><img src="/branding/bongbetic-wordmark@2x.png" alt="Bongbetic" style="height:2rem;width:auto" />
<strong>BongDesign</strong></div>
<div class="rule"></div>
<div class="card">
<img src="/branding/bongbetic-wordmark@2x.png" alt="Bongbetic" width="188" height="42" />
<h1>BongDesign sign in</h1>
{err}
<form method="post" action="/login">
<input name="username" placeholder="Username" autocomplete="username" />
<input name="password" type="password" placeholder="Password" autocomplete="current-password" />
<button class="cds--btn cds--btn--primary" type="submit">Sign in</button>
</form></div></body></html>'''


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
        if path == '/mcp' and 'text/html' in self.headers.get('Accept', ''):
            if not self.authed():
                return self._deny()
            self.path = '/index.html'
            return super().do_GET()
        # Brand assets are public marketing files (also hosted on
        # bongbetic.com/branding), so the sign-in page can show the
        # wordmark and the tab icon before authentication. Everything
        # else stays behind the wall.
        if path == '/favicon.ico':
            self.send_response(302)
            self.send_header('Location', '/branding/bongbetic-glyph.svg')
            self.end_headers()
            return
        if path.startswith('/branding/'):
            rel = posixpath.normpath(urllib.parse.unquote(path).lstrip('/'))
            full = os.path.realpath(os.path.join(DIST, rel))
            if rel and full.startswith(os.path.realpath(DIST) + os.sep) \
                    and os.path.isfile(full):
                self.path = '/' + rel
                return super().do_GET()
            if not self.authed():
                return self._deny()
            self.path = '/index.html'
            return super().do_GET()
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
            ip = self.client_address[0]
            if not login_allowed(ip):
                self.send_response(429)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Retry-After', str(LOGIN_COOLDOWN))
                self.send_header('Content-Length', '19')
                self.end_headers()
                self.wfile.write(b'Too many attempts.\n')
                return
            if hmac.compare_digest(u, USER) and hmac.compare_digest(p, PASS):
                record_login_ok(ip)
                self.send_response(302)
                self.send_header('Set-Cookie', session_cookie_value(new_session()))
                self.send_header('Location', '/')
                self.end_headers()
            else:
                record_login_fail(ip)
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
