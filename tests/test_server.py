"""Integration tests for the BongDesign server, through its public HTTP routes.

Each test class boots the real server (tests/support.py) and talks plain HTTP.
Run: python3 -m unittest tests.test_server
"""
import json
import unittest

from tests.support import ServerProcess


class ServerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ServerProcess()
        cls.addClassCleanup(cls.server.stop)
        cls.server.wait_ready()


class HealthTest(ServerTestCase):
    def test_health_answers_200_without_auth(self):
        status, _, body = self.server.request('GET', '/health')
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['status'], 'ok')


class AuthWallTest(ServerTestCase):
    def test_root_without_session_redirects_to_login(self):
        status, resp, _ = self.server.request('GET', '/')
        self.assertEqual(status, 302)
        self.assertEqual(resp.getheader('Location'), '/login')


if __name__ == '__main__':
    unittest.main()
