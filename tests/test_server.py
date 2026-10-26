"""Integration tests for the BongDesign server, through its public HTTP routes.

Each test class boots the real server (tests/support.py) and talks plain HTTP.
Run: python3 -m unittest tests.test_server
"""
import json
import unittest
import urllib.parse

from tests.support import TEST_PASS, TEST_TOKEN, TEST_USER, ServerProcess


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


class LoginTest(ServerTestCase):
    def _login(self, username, password):
        form = urllib.parse.urlencode({'username': username, 'password': password})
        return self.server.request(
            'POST', '/login', form,
            {'Content-Type': 'application/x-www-form-urlencoded'})

    def test_api_without_session_redirects_to_login(self):
        status, resp, _ = self.server.request('GET', '/api/components')
        self.assertEqual(status, 302)
        self.assertEqual(resp.getheader('Location'), '/login')

    def test_login_with_test_credential_sets_cookie_that_authorizes_api(self):
        status, resp, _ = self._login(TEST_USER, TEST_PASS)
        self.assertEqual(status, 302)
        cookie = resp.getheader('Set-Cookie').split(';')[0]
        self.assertTrue(cookie.startswith('bongdesign_session='))

        status, _, body = self.server.request('GET', '/api/components', headers={'Cookie': cookie})
        self.assertEqual(status, 200)
        components = json.loads(body)['components']
        self.assertGreater(len(components), 0)
        self.assertIn('name', components[0])

    def test_login_with_wrong_password_answers_401_and_sets_no_cookie(self):
        status, resp, _ = self._login(TEST_USER, 'wrong-pass')
        self.assertEqual(status, 401)
        self.assertIsNone(resp.getheader('Set-Cookie'))


class McpTest(ServerTestCase):
    def test_post_without_token_answers_401(self):
        status, body = self.server.mcp('ping')
        self.assertEqual(status, 401)
        self.assertEqual(body['error']['message'], 'Unauthorized')

    def test_post_with_wrong_token_answers_401(self):
        status, _ = self.server.mcp('ping', token='not-the-token')
        self.assertEqual(status, 401)

    def test_ping_with_bearer_token_answers_200(self):
        status, body = self.server.mcp('ping', token=TEST_TOKEN)
        self.assertEqual(status, 200)
        self.assertEqual(body['result'], {})

    def test_tools_list_with_bearer_token_names_server_info(self):
        status, body = self.server.mcp('tools/list', token=TEST_TOKEN)
        self.assertEqual(status, 200)
        names = [t['name'] for t in body['result']['tools']]
        self.assertIn('server_info', names)

    def test_server_info_tool_reports_bongdesign(self):
        status, body = self.server.mcp(
            'tools/call', {'name': 'server_info', 'arguments': {}}, token=TEST_TOKEN)
        self.assertEqual(status, 200)
        info = json.loads(body['result']['content'][0]['text'])
        self.assertEqual(info['server'], 'bongdesign')


if __name__ == '__main__':
    unittest.main()
