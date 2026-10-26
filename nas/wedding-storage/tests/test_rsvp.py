import base64
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
import csv
import hashlib
import io
from pathlib import Path
import re
import sqlite3
import tempfile
import unittest
import uuid

from app import create_app


ORIGIN = "https://www.maharex.com"
HEADERS = {"Origin": ORIGIN}
VIEW_TOKEN = "test-rsvp-view-key-" + "v" * 32
ADMIN_TOKEN = "test-other-admin-key-" + "a" * 32
VIEW = {"Authorization": "Bearer " + VIEW_TOKEN}


class RsvpTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wedding-rsvp-test-")
        self.config = {
            "TESTING": True, "DATA_DIR": self.temp.name, "ALLOWED_ORIGINS": ORIGIN,
            "RSVP_VIEW_TOKEN": VIEW_TOKEN, "ADMIN_TOKEN": ADMIN_TOKEN,
            "RSVP_RATE_PER_HOUR": 100,
        }
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def payload(self, **fields):
        return {"requestId": uuid.uuid4().hex, "name": "봄날 손님", "side": "bride", "attendance": "yes", "partyCount": 2, "meal": "yes", "consent": True, **fields}

    def post(self, data=None, client=None):
        return (client or self.client).post("/api/rsvp", json=self.payload() if data is None else data, headers=HEADERS)

    def count(self):
        with closing(sqlite3.connect(Path(self.temp.name) / "wedding.sqlite3")) as db:
            return db.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0]

    def test_not_collected_until_private_view_is_configured(self):
        disabled = create_app({**self.config, "RSVP_VIEW_TOKEN": ""}).test_client()
        self.assertFalse(disabled.get("/api/health").get_json()["features"]["rsvp"])
        self.assertEqual(self.post(client=disabled).status_code, 503)
        self.assertEqual(disabled.get("/api/rsvp", headers=VIEW).status_code, 401)
        self.assertEqual(self.count(), 0)
        with self.assertRaises(ValueError):
            create_app({**self.config, "RSVP_VIEW_TOKEN": "too-short"})

    def test_private_list_and_export_require_dedicated_header_key(self):
        result = self.post()
        self.assertEqual(result.status_code, 201)
        self.assertEqual(set(result.get_json()), {"ok", "id", "createdAt"})
        for headers in ({}, {"Authorization": "Bearer " + ADMIN_TOKEN}, {"Authorization": "Bearer wrong"}):
            for route in ("/api/rsvp", "/api/rsvp/export"):
                response = self.client.get(route, headers=headers)
                self.assertEqual(response.status_code, 401)
                self.assertNotIn("봄날 손님", response.get_data(as_text=True))
        self.assertEqual(self.client.get("/api/rsvp?token=" + VIEW_TOKEN).status_code, 401)
        visible = self.client.get("/api/rsvp", headers=VIEW)
        self.assertEqual(visible.status_code, 200)
        body = visible.get_json()
        self.assertEqual(body["summary"], {"responses": 1, "guests": 2, "meals": 2, "undecided": 0})
        self.assertEqual(body["items"][0]["name"], "봄날 손님")
        self.assertNotIn("request_hash", body["items"][0])
        self.assertEqual(visible.headers["Cache-Control"], "no-store")
        self.assertEqual(self.client.get("/api/guestbook").get_json()["items"], [])
        self.assertEqual(self.client.get("/api/photos").get_json()["items"], [])

    def test_idempotent_retries_conflicts_and_quota(self):
        data = self.payload()
        first = self.post(data)
        repeat = self.post({**data, "name": "  봄날 손님  "})
        self.assertEqual(repeat.status_code, 200)
        self.assertEqual(first.get_json(), repeat.get_json())
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.post({**data, "partyCount": 3}).status_code, 409)
        self.assertEqual(self.count(), 1)
        self.app.config["MAX_RSVP_COUNT"] = 1
        self.assertEqual(self.post(data).status_code, 200)
        self.assertEqual(self.post().status_code, 507)

    def test_same_request_cannot_be_saved_twice_concurrently(self):
        data = self.payload()
        def submit(_):
            with self.app.test_client() as client:
                return self.post(data, client).status_code
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(submit, range(4)))
        self.assertEqual(sorted(statuses), [200, 200, 200, 201])
        self.assertEqual(self.count(), 1)

    def test_validation_and_origin_are_enforced(self):
        invalid = [
            {"requestId": "bad"}, {"requestId": None}, {"name": ""}, {"name": "a" * 41},
            {"side": "other"}, {"side": []}, {"attendance": "maybe"}, {"partyCount": True},
            {"partyCount": "2"}, {"partyCount": 0}, {"partyCount": 11}, {"meal": "other"},
            {"consent": "true"}, {"consent": False}, {"phone": "01000000000"},
            {"attendance": "no", "partyCount": 2}, {"attendance": "undecided", "partyCount": 0, "meal": "yes"},
        ]
        for fields in invalid:
            with self.subTest(fields=fields):
                self.assertEqual(self.post(self.payload(**fields)).status_code, 400)
        for origin in (None, "https://unrelated.example"):
            response = self.client.post("/api/rsvp", json=self.payload(), headers={"Origin": origin} if origin else {})
            self.assertEqual(response.status_code, 403)
        self.assertEqual(self.count(), 0)
        for attendance in ("no", "undecided"):
            self.assertEqual(self.post(self.payload(attendance=attendance, partyCount=0, meal="undecided")).status_code, 201)

    def test_additive_upgrade_restart_and_rate_limit_preserve_records(self):
        self.client.post("/api/guestbook", json={"name": "기존 하객", "message": "기존 축하", "password": "1234"}, headers=HEADERS)
        with closing(sqlite3.connect(Path(self.temp.name) / "wedding.sqlite3")) as db:
            db.execute("DROP TABLE rsvps")
            db.commit()
        upgraded = create_app({**self.config, "RSVP_RATE_PER_HOUR": 1}).test_client()
        self.assertEqual(upgraded.get("/api/guestbook").get_json()["items"][0]["message"], "기존 축하")
        first = self.post(client=upgraded)
        self.assertEqual(first.status_code, 201)
        restarted = create_app({**self.config, "RSVP_RATE_PER_HOUR": 1}).test_client()
        self.assertEqual(restarted.get("/api/rsvp", headers=VIEW).get_json()["items"][0]["id"], first.get_json()["id"])
        self.assertEqual(self.post(client=restarted).status_code, 429)

    def test_admin_pagination_and_csv_formula_escaping(self):
        names = ['=HYPERLINK("bad")', "+SUM(1,2)", "@name", "-1", "김,봄", "줄\n바꿈"]
        for name in names:
            self.assertEqual(self.post(self.payload(name=name)).status_code, 201)
        page = self.client.get("/api/rsvp?limit=2", headers=VIEW).get_json()
        self.assertEqual(len(page["items"]), 2)
        self.assertEqual(page["summary"]["responses"], 6)
        second = self.client.get("/api/rsvp?limit=2&before=" + page["nextCursor"], headers=VIEW).get_json()
        self.assertNotEqual(page["items"][0]["id"], second["items"][0]["id"])
        export = self.client.get("/api/rsvp/export", headers=VIEW)
        self.assertEqual(export.status_code, 200)
        self.assertIn("attachment", export.headers["Content-Disposition"])
        rows = list(csv.reader(io.StringIO(export.data.decode("utf-8-sig"))))
        self.assertEqual([row[1] for row in rows[1:]], ["'줄\n바꿈", "김,봄", "'-1", "'@name", "'+SUM(1,2)", "'=HYPERLINK(\"bad\")"])

    def test_admin_page_contains_no_data_and_has_strict_csp(self):
        self.post()
        response = self.client.get("/api/rsvp-admin")
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertNotIn("봄날 손님", html)
        self.assertNotIn(VIEW_TOKEN, html)
        self.assertNotIn("localStorage", html)
        self.assertNotIn("sessionStorage", html)
        csp = response.headers["Content-Security-Policy"]
        self.assertIn("frame-ancestors 'none'", csp)
        self.assertNotIn("unsafe-inline", csp)
        script = re.search(r"<script>(.*?)</script>", html, re.S).group(1)
        self.assertIn(base64.b64encode(hashlib.sha256(script.encode()).digest()).decode(), csp)


if __name__ == "__main__":
    unittest.main()
