"""T03: hardened auth wall — Secure cookies, throttling, expiry, sign-in page."""
import time
import unittest
import urllib.parse

from .support import ServerProcess, TEST_USER, TEST_PASS


def login(srv, user=TEST_USER, password=TEST_PASS):
    body = urllib.parse.urlencode({'username': user, 'password': password})
    return srv.request('POST', '/login', body=body,
                       headers={'Content-Type': 'application/x-www-form-urlencoded'})


def cookie_of(resp):
    raw = resp.getheader('Set-Cookie') or ''
    return raw.split(';', 1)[0]


class AuthTestCase(unittest.TestCase):
    extra_env = None

    def setUp(self):
        self.srv = ServerProcess(extra_env=self.extra_env)
        self.srv.wait_ready()

    def tearDown(self):
        self.srv.stop()


class SecureCookieTest(AuthTestCase):
    def test_login_sets_secure_http_only_same_site_cookie(self):
        status, resp, _ = login(self.srv)
        self.assertEqual(status, 302)
        jar = resp.getheader('Set-Cookie') or ''
        self.assertIn('Secure', jar)
        self.assertIn('HttpOnly', jar)
        self.assertIn('SameSite=Lax', jar)

    def test_session_cookie_round_trips_manually(self):
        _, resp, _ = login(self.srv)
        status, _, body = self.srv.request(
            'GET', '/api/components', headers={'Cookie': cookie_of(resp)})
        self.assertEqual(status, 200)
        self.assertIn(b'components', body)


class ThrottleTest(AuthTestCase):
    def test_repeated_failed_logins_are_throttled_with_retry_after(self):
        for _ in range(10):
            status, _, _ = login(self.srv, password='wrong')
            self.assertEqual(status, 401)
        status, resp, _ = login(self.srv, password='wrong')
        self.assertEqual(status, 429)
        self.assertTrue((resp.getheader('Retry-After') or '').strip())

    def test_successful_login_resets_the_failure_counter(self):
        for _ in range(5):
            login(self.srv, password='wrong')
        status, _, _ = login(self.srv)
        self.assertEqual(status, 302)
        for _ in range(10):
            status, _, _ = login(self.srv, password='wrong')
            self.assertEqual(status, 401)


class ExpiryTest(AuthTestCase):
    extra_env = {'BONGDESIGN_SESSION_TTL': '2'}

    def test_expired_session_redirects_to_login(self):
        _, resp, _ = login(self.srv)
        cookie = {'Cookie': cookie_of(resp)}
        status, _, _ = self.srv.request('GET', '/api/components', headers=cookie)
        self.assertEqual(status, 200)
        time.sleep(3)
        status, _, _ = self.srv.request('GET', '/api/components', headers=cookie)
        self.assertEqual(status, 302)


class LogoutTest(AuthTestCase):
    def test_logout_invalidates_the_session_token(self):
        _, resp, _ = login(self.srv)
        cookie = {'Cookie': cookie_of(resp)}
        status, _, _ = self.srv.request('GET', '/logout', headers=cookie)
        self.assertEqual(status, 302)
        status, _, _ = self.srv.request('GET', '/api/components', headers=cookie)
        self.assertEqual(status, 302)


class LoginPageTest(AuthTestCase):
    def test_sign_in_page_is_bongdesign_branded_carbon_styled(self):
        status, _, body = self.srv.request('GET', '/login')
        self.assertEqual(status, 200)
        text = body.decode()
        self.assertIn('BongDesign', text)
        self.assertIn('/branding/bongbetic-wordmark', text)
        self.assertIn('cds--btn', text)


if __name__ == '__main__':
    unittest.main()
