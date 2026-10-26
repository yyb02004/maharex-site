import io
import tempfile
import unittest
import uuid
import zipfile
from pathlib import Path

from PIL import Image
from werkzeug.security import generate_password_hash
from app import ADMIN_COOKIE, PHOTO_COOKIE, create_app

ORIGIN = 'https://wedding-api.maharex.com'
PUBLIC = 'https://www.maharex.com'
PASSWORD = 'Unified-local-QA-only!2026'


class UnifiedAdminTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = generate_password_hash(PASSWORD, method='scrypt:32768:8:1')

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.config = {'TESTING': True, 'DATA_DIR': self.temp.name,
                       'ALLOWED_ORIGINS': ORIGIN + ',' + PUBLIC,
                       'MANAGEMENT_PASSWORD_HASH': self.password_hash,
                       'RSVP_VIEW_TOKEN': '', 'PHOTO_ADMIN_TOKEN': '', 'ADMIN_TOKEN': '',
                       'MIN_FREE_DISK_BYTES': 0}
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def request(self, path, method='GET', **kwargs):
        headers = {'Origin': ORIGIN, **kwargs.pop('headers', {})}
        return self.client.open(path, method=method, base_url=ORIGIN, headers=headers, **kwargs)

    def login(self):
        response = self.request('/api/admin/session', 'POST', headers={'Authorization': 'Bearer ' + PASSWORD})
        self.assertEqual(response.status_code, 200)
        self.assertIn('Secure', response.headers['Set-Cookie'])
        self.assertIn('HttpOnly', response.headers['Set-Cookie'])
        self.assertIn('SameSite=Strict', response.headers['Set-Cookie'])
        self.assertNotIn(PASSWORD, response.headers['Set-Cookie'])
        return self.client.get_cookie(ADMIN_COOKIE, domain='wedding-api.maharex.com', path='/api/admin').value

    def rsvp(self, name='하객', count=2):
        response = self.request('/api/rsvp', 'POST', json={
            'requestId': uuid.uuid4().hex, 'name': name, 'side': 'groom',
            'attendance': 'yes', 'partyCount': count, 'meal': 'yes', 'consent': True})
        self.assertEqual(response.status_code, 201)
        return response.json['id']

    def guest(self, name='축하 손님'):
        response = self.request('/api/guestbook', 'POST', json={
            'name': name, 'message': '축하해요!', 'password': 'local-post-only'})
        self.assertEqual(response.status_code, 201)
        return response.json['item']['id']

    def photo(self):
        image = io.BytesIO()
        Image.new('RGB', (32, 24), '#aabbcc').save(image, 'PNG')
        raw = image.getvalue()
        response = self.request('/api/photos', 'POST', data={
            'name': '사진 손님', 'caption': '로컬 확인', 'consent': 'true', 'originalConsent': 'true',
            'file': (io.BytesIO(raw), 'original.png')})
        self.assertEqual(response.status_code, 201)
        return response.json['item']['id'], raw

    def test_one_login_gives_all_tabs_and_cookie_is_revoked_at_logout(self):
        for path in ('/api/admin/photos', '/api/admin/rsvps', '/api/admin/guestbook', '/api/admin/storage'):
            self.assertEqual(self.request(path).status_code, 401)
        cookie = self.login()
        for path in ('/api/admin/photos', '/api/admin/rsvps', '/api/admin/guestbook', '/api/admin/storage'):
            response = self.request(path)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers['Cache-Control'], 'no-store')
        self.assertEqual(self.request('/api/rsvp').status_code, 401)
        self.assertEqual(self.request('/api/photo-admin/photos').status_code, 401)
        self.assertEqual(self.request('/api/admin/session', 'DELETE').status_code, 200)
        self.client.set_cookie(ADMIN_COOKIE, cookie, domain='wedding-api.maharex.com', path='/api/admin')
        self.assertEqual(self.request('/api/admin/rsvps').status_code, 401)

    def test_session_and_moderation_reject_cross_origin_and_invalid_password(self):
        entry_id = self.rsvp()
        self.assertEqual(self.request('/api/admin/session', 'POST', headers={'Authorization': 'Bearer wrong'}).status_code, 401)
        self.assertEqual(self.request('/api/admin/rsvps/' + entry_id, 'DELETE').status_code, 401)
        self.login()
        self.assertEqual(self.request('/api/admin/rsvps/' + entry_id, 'DELETE', headers={'Origin': PUBLIC}).status_code, 403)
        self.assertEqual(self.client.delete('/api/admin/rsvps/' + entry_id, base_url=ORIGIN).status_code, 403)
        self.assertEqual(self.request('/api/admin/rsvps/' + entry_id, 'DELETE', headers={'Authorization': 'Bearer wrong'}).status_code, 401)
        self.assertEqual(self.request('/api/admin/rsvps').json['summary']['responses'], 1)

    def test_unified_login_and_logout_revoke_legacy_photo_sessions(self):
        def legacy_session():
            response = self.request('/api/photo-admin/session', 'POST', headers={'Authorization':'Bearer ' + PASSWORD})
            self.assertEqual(response.status_code, 200)
            return self.client.get_cookie(PHOTO_COOKIE, domain='wedding-api.maharex.com', path='/api/photo-admin').value
        def replay(value):
            other = self.app.test_client()
            other.set_cookie(PHOTO_COOKIE, value, domain='wedding-api.maharex.com', path='/api/photo-admin')
            return other.get('/api/photo-admin/photos', base_url=ORIGIN).status_code
        old = legacy_session()
        self.assertEqual(replay(old), 200)
        self.login()
        self.assertEqual(replay(old), 401)
        another = legacy_session()
        self.assertEqual(replay(another), 200)
        self.request('/api/admin/session', 'DELETE')
        self.assertEqual(replay(another), 401)

    def test_rsvp_delete_updates_summary_and_csv_only_requested_row(self):
        first, second = self.rsvp('삭제할 테스트', 3), self.rsvp('남겨둘 손님', 2)
        self.login()
        self.assertEqual(self.request('/api/admin/rsvps/' + first, 'DELETE').json, {'ok': True})
        result = self.request('/api/admin/rsvps').json
        self.assertEqual([row['id'] for row in result['items']], [second])
        self.assertEqual(result['summary'], {'responses': 1, 'guests': 2, 'meals': 2, 'undecided': 0})
        with self.request('/api/admin/rsvps/export') as response:
            self.assertIn('남겨둘 손님', response.get_data(as_text=True))
            self.assertNotIn('삭제할 테스트', response.get_data(as_text=True))
        self.assertEqual(self.request('/api/admin/rsvps/' + first, 'DELETE').status_code, 404)

    def test_guestbook_delete_needs_no_guest_password_and_removes_public_item(self):
        first, second = self.guest('삭제할 글'), self.guest('남길 글')
        self.login()
        private = self.request('/api/admin/guestbook?limit=1').json
        self.assertEqual(private['total'], 2)
        self.assertNotIn('password', str(private))
        before = private['nextCursor']
        self.assertEqual(self.request('/api/admin/guestbook?limit=1&before=' + before).json['items'][0]['id'], first)
        self.assertEqual(self.request('/api/admin/guestbook/' + first, 'DELETE').status_code, 200)
        public = self.request('/api/guestbook').json['items']
        self.assertEqual([row['id'] for row in public], [second])
        self.assertEqual(self.request('/api/admin/guestbook').json['total'], 1)

    def test_unified_photo_download_and_delete_preserve_existing_original_flow(self):
        entry_id, original = self.photo()
        self.login()
        with self.request('/api/admin/photos/' + entry_id + '/download') as response:
            self.assertEqual(response.data, original)
        with self.request('/api/admin/photos/download') as response:
            with zipfile.ZipFile(io.BytesIO(response.data)) as archive:
                member = next(name for name in archive.namelist() if name.startswith('originals/'))
                self.assertEqual(archive.read(member), original)
        self.assertEqual(self.request('/api/admin/photos/' + entry_id, 'DELETE').status_code, 200)
        self.assertEqual(self.request('/api/admin/photos').json['total'], 0)
        self.assertEqual(self.request('/api/photos').json['items'], [])
        self.assertEqual(list((Path(self.temp.name) / 'originals').iterdir()), [])

    def test_legacy_entry_links_redirect_to_correct_tab_and_new_page_has_csp(self):
        self.assertEqual(self.request('/api/photo-admin').headers['Location'], '/api/admin#photos')
        self.assertEqual(self.request('/api/rsvp-admin').headers['Location'], '/api/admin#rsvps')
        response = self.request('/api/admin')
        self.assertEqual(response.status_code, 200)
        self.assertIn("default-src 'none'", response.headers['Content-Security-Policy'])
        self.assertNotIn(PASSWORD, response.get_data(as_text=True))
        self.assertEqual(response.headers['X-Frame-Options'], 'DENY')


if __name__ == '__main__':
    unittest.main()
