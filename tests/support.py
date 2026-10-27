"""Boot the real BongDesign server as a subprocess for integration tests.

The server exits at import without credentials, so it is never imported here.
Credentials are throwaway literals passed through environment variables.
"""
import http.client
import json
import os
import socket
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TEST_USER = 'test-user'
TEST_PASS = 'test-pass'
TEST_TOKEN = 'test-token'


def free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class ServerProcess:
    """A real server on an ephemeral port, locked with the test credentials."""

    def __init__(self, extra_env=None):
        self.port = free_port()
        self._log = tempfile.TemporaryFile()
        env = {k: v for k, v in os.environ.items() if not k.startswith('BONGDESIGN_')}
        env.update(BONGDESIGN_USER=TEST_USER, BONGDESIGN_PASS=TEST_PASS,
                   BONGDESIGN_TOKEN=TEST_TOKEN, PORT=str(self.port))
        if extra_env:
            env.update(extra_env)
        self._proc = subprocess.Popen([sys.executable, os.path.join(ROOT, 'server.py')],
                                      cwd=ROOT, env=env,
                                      stdout=subprocess.DEVNULL, stderr=self._log)

    def wait_ready(self, timeout=15):
        deadline = time.time() + timeout
        while time.time() < deadline:
            if self._proc.poll() is not None:
                raise RuntimeError(f'server exited early: {self._stderr()}')
            try:
                if self.request('GET', '/health')[0] == 200:
                    return
            except OSError:
                time.sleep(0.1)
        raise RuntimeError(f'server not ready after {timeout}s: {self._stderr()}')

    def _stderr(self):
        self._log.seek(0)
        return self._log.read().decode(errors='replace')

    def request(self, method, path, body=None, headers=None):
        """Return (status, headers, body bytes). Never follows redirects."""
        conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=10)
        try:
            conn.request(method, path, body=body, headers=headers or {})
            resp = conn.getresponse()
            return resp.status, resp, resp.read()
        finally:
            conn.close()

    def mcp(self, method, params=None, token=None):
        """POST a JSON-RPC call to /mcp. Return (status, parsed JSON or None)."""
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method,
                              'params': params or {}})
        status, _, raw = self.request('POST', '/mcp', payload, headers)
        return status, json.loads(raw) if raw else None

    def stop(self):
        self._proc.terminate()
        try:
            self._proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self._proc.kill()
            self._proc.wait()
        self._log.close()
