#!/usr/bin/env python3
"""End-to-end HTTP smoke: boot the real server and assert the public seams.

T10 acceptance (SC-1 auth wall, SC-3 MCP end-to-end): signed-out rejection
everywhere except /health and /login, signed-in browsing of / + a component
page + a foundation page, and a harness-style MCP session (initialize,
tools/list, get_component, lookup_token) against the pinned data.
Standalone and standard library only (does not use the tests package).
Exit code 0 when every check passes, 1 otherwise.
Run: python3 scripts/e2e-smoke.py
"""
import http.client
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER, PASSWORD, TOKEN = 'smoke-user', 'smoke-pass', 'smoke-token'

failures = []


def check(label, ok, detail=''):
    print(f"{'ok  ' if ok else 'FAIL'} {label}{'' if ok else ' ' + detail}", flush=True)
    if not ok:
        failures.append(label)


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def request(port, method, path, body=None, headers=None):
    conn = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
    try:
        conn.request(method, path, body=body, headers=headers or {})
        resp = conn.getresponse()
        return resp.status, resp, resp.read()
    finally:
        conn.close()


def mcp(port, method, token=None):
    return rpc(port, method, {}, token)


def rpc(port, method, params, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params})
    status, _, raw = request(port, 'POST', '/mcp', payload, headers)
    return status, json.loads(raw) if raw else None


def tool_text(port, name, args, token):
    """Call one MCP tool like a harness would; return (status, parsed text payload)."""
    status, body = rpc(port, 'tools/call', {'name': name, 'arguments': args}, token)
    if status != 200 or 'result' not in (body or {}):
        return status, None
    return status, json.loads(body['result']['content'][0]['text'])


def wait_ready(port, proc, log, timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            break
        try:
            if request(port, 'GET', '/health')[0] == 200:
                return True
        except OSError:
            time.sleep(0.1)
    log.seek(0)
    print('server did not become ready:', log.read().decode(errors='replace'), file=sys.stderr)
    return False


def run_checks(port):
    status, _, body = request(port, 'GET', '/health')
    check('GET /health answers 200 without auth', status == 200 and json.loads(body).get('status') == 'ok')

    status, resp, _ = request(port, 'GET', '/')
    check('GET / without session redirects to /login',
          status == 302 and resp.getheader('Location') == '/login', f'got {status}')

    status, _, body = request(port, 'GET', '/login')
    check('GET /login answers 200 without auth',
          status == 200 and b'BongDesign' in body, f'got {status}')

    for path in ('/components/button', '/foundations/color', '/api/components'):
        status, resp, _ = request(port, 'GET', path)
        check(f'GET {path} without session redirects to /login',
              status == 302 and resp.getheader('Location') == '/login', f'got {status}')

    status, _ = mcp(port, 'ping')
    check('POST /mcp without token answers 401', status == 401, f'got {status}')

    status, _ = mcp(port, 'ping', 'wrong-token')
    check('POST /mcp with wrong token answers 401', status == 401, f'got {status}')

    status, body = mcp(port, 'ping', TOKEN)
    check('POST /mcp ping with bearer token answers 200', status == 200, f'got {status}')

    status, body = rpc(port, 'initialize',
                       {'protocolVersion': '2025-03-26', 'capabilities': {},
                        'clientInfo': {'name': 'e2e-smoke', 'version': '0'}}, TOKEN)
    info = (body.get('result') or {}).get('serverInfo', {}) if status == 200 else {}
    check('MCP initialize names the bongdesign server',
          status == 200 and info.get('name') == 'bongdesign', f'got {status} {info}')

    status, body = mcp(port, 'tools/list', TOKEN)
    names = [t['name'] for t in body['result']['tools']] if status == 200 else []
    check('POST /mcp tools/list names server_info', 'server_info' in names, f'got {status} {names}')
    check('POST /mcp tools/list names get_component + lookup_token',
          'get_component' in names and 'lookup_token' in names, f'got {status} {names}')

    form = urllib.parse.urlencode({'username': USER, 'password': PASSWORD})
    status, resp, _ = request(port, 'POST', '/login', form,
                              {'Content-Type': 'application/x-www-form-urlencoded'})
    set_cookie = resp.getheader('Set-Cookie') or ''
    check('POST /login with test credential sets a session cookie',
          status == 302 and set_cookie.startswith('bongdesign_session='), f'got {status}')
    cookie = {'Cookie': set_cookie.split(';')[0]}

    status, _, body = request(port, 'GET', '/api/components', headers=cookie)
    ok = status == 200 and len(json.loads(body).get('components', [])) > 0
    check('GET /api/components with session answers 200 with components', ok, f'got {status}')

    if os.path.isfile(os.path.join(ROOT, 'site', 'dist', 'index.html')):
        for path in ('/', '/components/button', '/foundations/color'):
            status, resp, _ = request(port, 'GET', path, headers=cookie)
            check(f'GET {path} with session serves the built site',
                  status == 200 and 'text/html' in (resp.getheader('Content-Type') or ''),
                  f'got {status}')
    else:
        print('skip GET / + component + foundation with session (site/dist not built)')

    status, info = tool_text(port, 'get_component', {'name': 'Button'}, TOKEN)
    props = [p['name'] for p in (info.get('props') or [])] if info else []
    check('MCP get_component Button carries kind/size props',
          status == 200 and 'kind' in props and 'size' in props, f'got {status} {props[:8]}')

    status, info = tool_text(port, 'lookup_token', {'name': 'blue60'}, TOKEN)
    values = [m['value'] for m in (info.get('matches') or [])] if info else []
    check('MCP lookup_token blue60 answers the pinned #0f62fe',
          status == 200 and '#0f62fe' in values, f'got {status} {values[:4]}')

    status, _ = tool_text(port, 'get_component', {'name': 'Button'}, 'wrong-token')
    check('MCP tools/call with wrong token answers 401', status == 401, f'got {status}')


def main():
    port = free_port()
    env = {k: v for k, v in os.environ.items() if not k.startswith('BONGDESIGN_')}
    env.update(BONGDESIGN_USER=USER, BONGDESIGN_PASS=PASSWORD, BONGDESIGN_TOKEN=TOKEN, PORT=str(port))
    with tempfile.TemporaryFile() as log:
        proc = subprocess.Popen([sys.executable, os.path.join(ROOT, 'server.py')], cwd=ROOT, env=env,
                                stdout=subprocess.DEVNULL, stderr=log)
        try:
            if not wait_ready(port, proc, log):
                return 1
            run_checks(port)
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
    if failures:
        print(f'{len(failures)} check(s) failed', file=sys.stderr)
        return 1
    print('all checks passed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
