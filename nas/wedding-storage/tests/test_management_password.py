import io
from pathlib import Path
import sqlite3
import tempfile
import unittest
import uuid
from unittest.mock import patch
from contextlib import closing

from PIL import Image
from werkzeug.security import check_password_hash, generate_password_hash

from app import PHOTO_COOKIE, create_app


ORIGIN = "https://wedding-api.maharex.com"
# These credentials are test fixtures only. Production credentials are never committed.
PASSWORD = "Local-QA-Secret!42"
OLD_PHOTO_KEY = "previous-photo-" + "p" * 36
OLD_VIEW_KEY = "previous-rsvp-" + "r" * 36
OLD_ADMIN_KEY = "previous-admin-" + "a" * 36


def auth(password=PASSWORD):
    return {"Authorization": "Bearer " + password}


class ManagementPasswordTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = generate_password_hash(PASSWORD, method="scrypt:32768:8:1")
        cls.other_hash = generate_password_hash("Different-QA-Password!43", method="scrypt:32768:8:1")

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wedding-common-password-test-")
        self.config = {
            "TESTING": True, "DATA_DIR": self.temp.name, "ALLOWED_ORIGINS": ORIGIN,
            "MANAGEMENT_PASSWORD_HASH": self.password_hash,
            "PHOTO_ADMIN_TOKEN": "", "RSVP_VIEW_TOKEN": "", "ADMIN_TOKEN": "",
            "MIN_FREE_DISK_BYTES": 0,
        }
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def photo(self, client=None):
        data = io.BytesIO()
        Image.new("RGB", (24, 24), "#ccbbaa").save(data, "JPEG")
        return (client or self.client).post("/api/photos", headers={"Origin": ORIGIN}, data={
            "name": "로컬 테스트 하객", "caption": "비공개 원본 테스트", "consent": "true", "originalConsent": "true",
            "file": (io.BytesIO(data.getvalue()), "fixture.jpg"),
        }).get_json()["item"]

    def test_common_password_enables_both_admin_screens_and_rsvp_collection(self):
        features = self.client.get("/api/health").get_json()["features"]
        self.assertTrue(features["managementPassword"])
        self.assertTrue(features["photoAdmin"])
        self.assertTrue(features["rsvp"])
        self.assertNotIn(self.password_hash, str(features))
        response = self.client.post("/api/rsvp", headers={"Origin": ORIGIN}, json={
            "requestId": uuid.uuid4().hex, "name": "참석 테스트", "side": "groom", "attendance": "yes",
            "partyCount": 1, "meal": "yes", "consent": True,
        })
        self.assertEqual(response.status_code, 201)
        for route in ("/api/rsvp", "/api/rsvp/export", "/api/photo-admin/photos"):
            self.assertEqual(self.client.get(route).status_code, 401)
            success = self.client.get(route, headers=auth())
            self.assertEqual(success.status_code, 200)
            success.close()
        photo = self.photo()
        login = self.client.post("/api/photo-admin/session", headers={**auth(), "Origin": ORIGIN}, base_url=ORIGIN)
        self.assertEqual(login.status_code, 200)
        self.assertNotIn(PASSWORD, login.headers["Set-Cookie"])
        listing = self.client.get("/api/photo-admin/photos", base_url=ORIGIN)
        self.assertEqual(listing.status_code, 200)
        original = self.client.get(f"/api/photo-admin/photos/{photo['id']}/download", base_url=ORIGIN)
        self.assertEqual(original.status_code, 200)
        original.close()
        # Cookie remains photo-scoped. RSVP uses the same password, not a broader cookie.
        self.assertEqual(self.client.get("/api/rsvp", base_url=ORIGIN).status_code, 401)

    def test_password_mode_rejects_all_previous_keys_including_broad_photo_delete(self):
        client = create_app({**self.config, "PHOTO_ADMIN_TOKEN": OLD_PHOTO_KEY,
                             "RSVP_VIEW_TOKEN": OLD_VIEW_KEY, "ADMIN_TOKEN": OLD_ADMIN_KEY}).test_client()
        photo = self.photo(client)
        for old in (OLD_PHOTO_KEY, OLD_VIEW_KEY, OLD_ADMIN_KEY):
            for route in ("/api/rsvp", "/api/rsvp/export", "/api/photo-admin/photos"):
                self.assertEqual(client.get(route, headers=auth(old)).status_code, 401)
            self.assertEqual(client.post("/api/photo-admin/session", headers={**auth(old), "Origin": ORIGIN}).status_code, 401)
            self.assertEqual(client.delete(f"/api/photos/{photo['id']}", headers={**auth(old), "Origin": ORIGIN}).status_code, 403)
        self.assertEqual(client.get("/api/rsvp", headers=auth()).status_code, 200)
        self.assertEqual(client.get("/api/photo-admin/photos", headers=auth()).status_code, 200)
        self.assertEqual(client.delete(f"/api/photo-admin/photos/{photo['id']}", headers={**auth(), "Origin": ORIGIN}).status_code, 200)

    def test_password_change_and_switch_from_tokens_invalidate_photo_cookies(self):
        def cookie_from(client, credential):
            self.assertEqual(client.post("/api/photo-admin/session", headers={**auth(credential), "Origin": ORIGIN}, base_url=ORIGIN).status_code, 200)
            return client.get_cookie(PHOTO_COOKIE, domain="wedding-api.maharex.com", path="/api/photo-admin").value
        token_client = create_app({**self.config, "MANAGEMENT_PASSWORD_HASH": "", "PHOTO_ADMIN_TOKEN": OLD_PHOTO_KEY}).test_client()
        old_token_cookie = cookie_from(token_client, OLD_PHOTO_KEY)
        self.client.set_cookie(PHOTO_COOKIE, old_token_cookie, domain="wedding-api.maharex.com", path="/api/photo-admin")
        self.assertEqual(self.client.get("/api/photo-admin/photos", base_url=ORIGIN).status_code, 401)
        password_cookie = cookie_from(self.client, PASSWORD)
        changed = create_app({**self.config, "MANAGEMENT_PASSWORD_HASH": self.other_hash}).test_client()
        changed.set_cookie(PHOTO_COOKIE, password_cookie, domain="wedding-api.maharex.com", path="/api/photo-admin")
        self.assertEqual(changed.get("/api/photo-admin/photos", base_url=ORIGIN).status_code, 401)
        self.assertEqual(changed.get("/api/rsvp", headers=auth()).status_code, 401)
        self.assertEqual(changed.get("/api/rsvp", headers=auth("Different-QA-Password!43")).status_code, 200)

    def test_invalid_hash_fails_closed_and_bounded_password_is_not_hashed(self):
        for invalid in (
            "not-a-hash", " " + self.password_hash, self.password_hash + " ", None,
            self.password_hash.replace("32768", "1073741824"),
            self.password_hash.replace("scrypt:32768:8:1", "pbkdf2:sha256:1"),
            self.password_hash[:-1], self.password_hash[:-1] + "Z",
        ):
            with self.subTest(invalid=type(invalid).__name__):
                with self.assertRaisesRegex(ValueError, "MANAGEMENT_PASSWORD_HASH"):
                    create_app({**self.config, "MANAGEMENT_PASSWORD_HASH": invalid})
        with patch("app.check_password_hash", wraps=check_password_hash) as checker:
            for value in ("", "a" * 129, "x\x7fy"):
                self.assertEqual(self.client.get("/api/rsvp", headers=auth(value)).status_code, 401)
            self.assertEqual(checker.call_count, 0)

    def test_rate_limit_precedes_scrypt_and_is_shared_across_admin_screens(self):
        with patch("app.check_password_hash", wraps=check_password_hash) as checker:
            for index in range(30):
                route = "/api/rsvp" if index % 2 == 0 else "/api/photo-admin/photos"
                self.assertEqual(self.client.get(route, headers=auth("Wrong-test-password")).status_code, 401)
            self.assertEqual(checker.call_count, 30)
            limited = self.client.get("/api/rsvp/export", headers=auth())
            self.assertEqual(limited.status_code, 429)
            self.assertIn("Retry-After", limited.headers)
            self.assertEqual(checker.call_count, 30)
        restarted = create_app(self.config).test_client()
        self.assertEqual(restarted.post("/api/photo-admin/session", headers={**auth(), "Origin": ORIGIN}).status_code, 429)

    def test_valid_pagination_cache_never_accepts_wrong_password_or_stores_cleartext(self):
        with patch("app.check_password_hash", wraps=check_password_hash) as checker:
            for _ in range(35):
                self.assertEqual(self.client.get("/api/rsvp", headers=auth()).status_code, 200)
            self.assertEqual(checker.call_count, 1)
            self.assertEqual(self.client.get("/api/photo-admin/photos", headers=auth("Incorrect-test-password")).status_code, 401)
            self.assertEqual(checker.call_count, 2)
            with closing(sqlite3.connect(Path(self.temp.name) / "wedding.sqlite3")) as connection:
                connection.execute("UPDATE rate_limits SET count=30 WHERE scope='management_auth'")
                connection.commit()
            self.assertEqual(self.client.get("/api/rsvp", headers=auth("Incorrect-test-password")).status_code, 429)
            self.assertEqual(self.client.get("/api/rsvp", headers=auth()).status_code, 200)
            self.assertEqual(checker.call_count, 2)
        self.assertNotIn(PASSWORD.encode(), (Path(self.temp.name) / "wedding.sqlite3").read_bytes())


if __name__ == "__main__":
    unittest.main()
