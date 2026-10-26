#!/usr/bin/env python3
"""End-to-end HTTP smoke: boot the real server and assert the public seams.

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
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': {}})
    status, _, raw = request(port, 'POST', '/mcp', payload, headers)
    return status, json.loads(raw) if raw else None


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

    status, _ = mcp(port, 'ping')
    check('POST /mcp without token answers 401', status == 401, f'got {status}')

    status, body = mcp(port, 'ping', TOKEN)
    check('POST /mcp ping with bearer token answers 200', status == 200, f'got {status}')

    status, body = mcp(port, 'tools/list', TOKEN)
    names = [t['name'] for t in body['result']['tools']] if status == 200 else []
    check('POST /mcp tools/list names server_info', 'server_info' in names, f'got {status} {names}')

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
        status, resp, _ = request(port, 'GET', '/', headers=cookie)
        check('GET / with session serves the built site',
              status == 200 and 'text/html' in (resp.getheader('Content-Type') or ''), f'got {status}')
    else:
        print('skip GET / with session (site/dist not built)')


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
