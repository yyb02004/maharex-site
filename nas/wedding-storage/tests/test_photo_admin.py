import hashlib
import base64
import io
import json
import re
from pathlib import Path
import sqlite3
import tempfile
import unittest
import zipfile
from contextlib import closing
from unittest.mock import patch

from PIL import Image

from app import PHOTO_COOKIE, create_app


ORIGIN = "https://wedding-api.maharex.com"
PUBLIC_ORIGIN = "https://www.maharex.com"
KEY = "photo-manager-" + "p" * 40
VIEW_KEY = "rsvp-view-" + "r" * 40
ADMIN_KEY = "old-admin-" + "a" * 40
AUTH = {"Authorization": "Bearer " + KEY}
WRITE = {**AUTH, "Origin": ORIGIN}


def image_bytes(fmt="JPEG"):
    stream = io.BytesIO()
    exif = Image.Exif()
    exif[270] = "Private original metadata"
    exif[274] = 6
    Image.new("RGB", (120, 80), "#e8d8c0").save(stream, fmt, exif=exif)
    return stream.getvalue()


class PhotoAdminTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wedding-photo-test-")
        self.data = Path(self.temp.name)
        self.config = {
            "TESTING": True, "DATA_DIR": self.temp.name,
            "ALLOWED_ORIGINS": ",".join([ORIGIN, PUBLIC_ORIGIN]),
            "PHOTO_ADMIN_TOKEN": KEY, "RSVP_VIEW_TOKEN": VIEW_KEY, "ADMIN_TOKEN": ADMIN_KEY,
            "PHOTO_RATE_PER_HOUR": 100, "MIN_FREE_DISK_BYTES": 0,
        }
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def upload(self, raw=None, filename="원본 사진.jpg", **fields):
        return self.client.post("/api/photos", headers={"Origin": PUBLIC_ORIGIN}, data={
            "name": "테스트 하객", "caption": "함께한 봄날", "consent": "true", "originalConsent": "true",
            "file": (io.BytesIO(raw if raw is not None else image_bytes()), filename), **fields,
        })

    def rows(self):
        with closing(sqlite3.connect(self.data / "wedding.sqlite3")) as conn:
            conn.row_factory = sqlite3.Row
            return [dict(row) for row in conn.execute("SELECT * FROM photos")]

    def test_originals_are_byte_identical_and_previews_remain_public_without_metadata(self):
        for fmt, ext in (("JPEG", "jpg"), ("PNG", "png"), ("WEBP", "webp")):
            raw = image_bytes(fmt)
            response = self.upload(raw, "원본 사진." + ext)
            self.assertEqual(response.status_code, 201)
            item = response.get_json()["item"]
            row = self.rows()[-1]
            self.assertEqual((self.data / "originals" / row["original_name"]).read_bytes(), raw)
            self.assertEqual(row["original_bytes"], len(raw))
            self.assertEqual(row["original_sha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual(row["stored_bytes"], len(raw) + sum((self.data / "media" / row[key]).stat().st_size for key in ("stored_name", "thumbnail_name")))
            self.assertNotIn("original_name", item)
            self.assertNotIn("originalFilename", item)
            for path in ("/originals/" + row["original_name"], "/media/../originals/" + row["original_name"], "/media/%2e%2e%2foriginals%2f" + row["original_name"]):
                self.assertEqual(self.client.get(path).status_code, 404)
            for path in (item["url"], item["thumbnailUrl"]):
                preview = self.client.get(path)
                with Image.open(io.BytesIO(preview.data)) as image:
                    self.assertEqual(image.format, "JPEG")
                    self.assertEqual(len(image.getexif()), 0)
                preview.close()
            saved = self.client.get(f"/api/photo-admin/photos/{item['id']}/download", headers=AUTH)
            self.assertEqual(saved.status_code, 200)
            self.assertEqual(saved.data, raw)
            self.assertIn("attachment", saved.headers["Content-Disposition"])
            self.assertEqual(saved.headers["Cache-Control"], "no-store")
            saved.close()

    def test_old_upload_ui_must_get_new_original_consent(self):
        response = self.upload(originalConsent="")
        self.assertEqual(response.status_code, 400)
        self.assertIn("원본 보관", response.get_json()["error"])
        self.assertEqual(self.rows(), [])
        self.assertEqual(list((self.data / "originals").iterdir()), [])

    def test_scope_auth_origin_cookie_expiry_and_logout(self):
        item = self.upload().get_json()["item"]
        routes = ("/api/photo-admin/photos", "/api/photo-admin/download", f"/api/photo-admin/photos/{item['id']}/download")
        for token in (None, VIEW_KEY, ADMIN_KEY, "wrong", "비밀번호"):
            headers = {} if token is None else {"Authorization": "Bearer " + token}
            for path in routes:
                self.assertEqual(self.client.get(path, headers=headers).status_code, 401)
        self.assertEqual(self.client.get("/api/photo-admin/photos?token=" + KEY).status_code, 401)
        self.assertEqual(self.client.post("/api/photo-admin/session", headers=AUTH).status_code, 403)
        self.assertEqual(self.client.post("/api/photo-admin/session", headers={**AUTH, "Origin": "https://elsewhere.test"}).status_code, 403)
        login = self.client.post("/api/photo-admin/session", headers=WRITE, base_url=ORIGIN)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.get_json(), {"ok": True})
        for expected in ("HttpOnly", "Secure", "SameSite=Strict", "Path=/api/photo-admin", "Max-Age=3600"):
            self.assertIn(expected, login.headers["Set-Cookie"])
        self.assertNotIn(KEY, login.headers["Set-Cookie"])
        cookie = self.client.get_cookie(PHOTO_COOKIE, domain="wedding-api.maharex.com", path="/api/photo-admin")
        self.assertEqual(self.client.get(routes[0], base_url=ORIGIN).status_code, 200)
        self.assertEqual(self.client.get(routes[0], headers={"Authorization": "Bearer wrong"}, base_url=ORIGIN).status_code, 401)
        self.assertEqual(self.client.delete(f"/api/photo-admin/photos/{item['id']}", base_url=ORIGIN).status_code, 403)
        self.assertEqual(self.client.delete("/api/photo-admin/session", headers={"Origin": ORIGIN}, base_url=ORIGIN).status_code, 200)
        self.assertEqual(self.client.get(routes[0], base_url=ORIGIN).status_code, 401)
        self.client.set_cookie(PHOTO_COOKIE, cookie.value, domain="wedding-api.maharex.com", path="/api/photo-admin")
        self.assertEqual(self.client.get(routes[0], base_url=ORIGIN).status_code, 401, "A copied session must also be revoked at logout")
        self.client.post("/api/photo-admin/session", headers=WRITE, base_url=ORIGIN)
        with closing(sqlite3.connect(self.data / "wedding.sqlite3")) as conn:
            conn.execute("UPDATE photo_admin_sessions SET expires_at=0")
            conn.commit()
        self.assertEqual(self.client.get(routes[0], base_url=ORIGIN).status_code, 401)

    def test_admin_key_disabled_short_and_reused_are_rejected(self):
        disabled = create_app({**self.config, "PHOTO_ADMIN_TOKEN": ""}).test_client()
        self.assertFalse(disabled.get("/api/health").get_json()["features"]["photoAdmin"])
        self.assertTrue(disabled.get("/api/health").get_json()["features"]["originalPhotos"])
        self.assertEqual(disabled.get("/api/photo-admin/photos", headers=AUTH).status_code, 401)
        for token in ("short", VIEW_KEY, ADMIN_KEY):
            with self.assertRaises(ValueError):
                create_app({**self.config, "PHOTO_ADMIN_TOKEN": token})
        for _ in range(30):
            self.assertEqual(self.client.post("/api/photo-admin/session", headers={"Origin": ORIGIN, "Authorization": "Bearer wrong"}).status_code, 401)
        self.assertEqual(self.client.post("/api/photo-admin/session", headers=WRITE).status_code, 429)

    def test_quota_includes_original_and_failure_leaves_no_files(self):
        raw = image_bytes()
        item = self.upload(raw).get_json()["item"]
        row = self.rows()[0]
        derivative_bytes = row["stored_bytes"] - row["original_bytes"]
        self.client.delete(f"/api/photo-admin/photos/{item['id']}", headers=WRITE)
        self.app.config["MAX_STORAGE_BYTES"] = derivative_bytes + len(raw) - 1
        self.assertEqual(self.upload(raw).status_code, 507)
        self.assertEqual(self.rows(), [])
        self.assertEqual(list((self.data / "media").iterdir()), [])
        self.assertEqual(list((self.data / "originals").iterdir()), [])
        self.app.config["MAX_STORAGE_BYTES"] = 10 * 1024**3
        real_open = Path.open
        def fail_original(path, *args, **kwargs):
            if path.parent.name == "originals" and args and args[0] == "xb":
                raise OSError("simulated full disk")
            return real_open(path, *args, **kwargs)
        with patch.object(Path, "open", fail_original):
            self.assertEqual(self.upload(raw).status_code, 503)
        self.assertEqual(self.rows(), [])
        self.assertEqual(list((self.data / "media").iterdir()), [])

    def test_list_pagination_delete_and_restart_recovery(self):
        for i in range(3):
            self.assertEqual(self.upload(filename=f"../folder/사진 {i}.jpg").status_code, 201)
        first = self.client.get("/api/photo-admin/photos?limit=2", headers=AUTH).get_json()
        self.assertEqual(first["total"], 3)
        self.assertEqual(first["originalCount"], 3)
        self.assertEqual(first["legacyCount"], 0)
        self.assertEqual(first["totalBytes"], sum(row["stored_bytes"] for row in self.rows()))
        self.assertEqual(first["items"][0]["originalFilename"], "사진 2.jpg")
        second = self.client.get("/api/photo-admin/photos?before=" + first["nextCursor"], headers=AUTH).get_json()
        self.assertEqual(len(second["items"]), 1)
        item = first["items"][0]
        self.assertEqual(self.client.delete(f"/api/photo-admin/photos/{item['id']}", headers=WRITE).get_json(), {"ok": True})
        self.assertEqual(self.client.get(item["url"]).status_code, 404)
        self.assertEqual(len(list((self.data / "originals").iterdir())), 2)
        with closing(sqlite3.connect(self.data / "wedding.sqlite3")) as conn:
            conn.execute("UPDATE photos SET deleted=1")
            conn.commit()
        create_app(self.config)
        self.assertEqual(self.rows(), [])
        self.assertEqual(list((self.data / "media").iterdir()), [])
        self.assertEqual(list((self.data / "originals").iterdir()), [])

    def test_streamed_zip_integrity_missing_files_and_disconnect_release(self):
        raw = image_bytes("PNG")
        first = self.upload(raw, "one.png").get_json()["item"]
        second = self.upload(filename="two.jpg").get_json()["item"]
        (self.data / "originals" / self.rows()[1]["original_name"]).unlink()
        response = self.client.get("/api/photo-admin/download", headers=AUTH, buffered=False)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/photo-admin/download", headers=AUTH).status_code, 429)
        chunks = list(response.response)
        response.close()
        self.assertLessEqual(max(map(len, chunks)), 64 * 1024)
        with zipfile.ZipFile(io.BytesIO(b"".join(chunks))) as bundle:
            self.assertIsNone(bundle.testzip())
            manifest = json.loads(bundle.read("manifest.json"))
            self.assertEqual([row["status"] for row in manifest], ["included", "missing"])
            self.assertEqual(manifest[0]["id"], first["id"])
            self.assertEqual(manifest[1]["id"], second["id"])
            self.assertEqual(bundle.read(manifest[0]["archivePath"]), raw)
        interrupted = self.client.get("/api/photo-admin/download", headers=AUTH, buffered=False)
        interrupted.close()
        retry = self.client.get("/api/photo-admin/download", headers=AUTH, buffered=False)
        self.assertEqual(retry.status_code, 200)
        retry.close()

    def test_old_database_migrates_and_legacy_download_is_labelled(self):
        with tempfile.TemporaryDirectory(prefix="wedding-old-photos-") as directory:
            data = Path(directory)
            (data / "media").mkdir()
            photo_id = "a" * 32
            raw = image_bytes()
            (data / "media" / (photo_id + ".jpg")).write_bytes(raw)
            (data / "media" / (photo_id + "-thumb.jpg")).write_bytes(raw)
            with closing(sqlite3.connect(data / "wedding.sqlite3")) as conn:
                conn.executescript("""
                    CREATE TABLE photos (seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE,name TEXT,caption TEXT,
                    stored_name TEXT UNIQUE,thumbnail_name TEXT UNIQUE,width INTEGER,height INTEGER,stored_bytes INTEGER,
                    created_at TEXT,deleted INTEGER NOT NULL DEFAULT 0);
                    PRAGMA user_version=1;
                """)
                conn.execute("INSERT INTO photos(id,name,caption,stored_name,thumbnail_name,width,height,stored_bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                             (photo_id, "이전 하객", "기존 사진", photo_id + ".jpg", photo_id + "-thumb.jpg", 120, 80, len(raw) * 2, "2026-10-26T00:00:00Z"))
                conn.commit()
            client = create_app({**self.config, "DATA_DIR": directory}).test_client()
            body = client.get("/api/photo-admin/photos", headers=AUTH).get_json()
            self.assertEqual((body["originalCount"], body["legacyCount"]), (0, 1))
            self.assertFalse(body["items"][0]["originalAvailable"])
            file = client.get(body["items"][0]["downloadUrl"], headers=AUTH)
            self.assertEqual(file.data, raw)
            self.assertIn("legacy-preview-", file.headers["Content-Disposition"])
            file.close()
            archive = client.get("/api/photo-admin/download", headers=AUTH)
            with zipfile.ZipFile(io.BytesIO(archive.data)) as bundle:
                item = json.loads(bundle.read("manifest.json"))[0]
                self.assertEqual(item["kind"], "legacy-preview")
                self.assertTrue(item["archivePath"].startswith("legacy-previews/"))
            archive.close()
            create_app({**self.config, "DATA_DIR": directory})
            self.assertEqual((data / "media" / (photo_id + ".jpg")).read_bytes(), raw)
            with closing(sqlite3.connect(data / "wedding.sqlite3")) as conn:
                self.assertEqual(conn.execute("PRAGMA user_version").fetchone()[0], 2)

    def test_retained_original_without_database_is_not_deleted(self):
        with tempfile.TemporaryDirectory(prefix="wedding-original-recovery-") as directory:
            data = Path(directory)
            (data / "originals").mkdir()
            original = data / "originals" / ("b" * 32 + ".png")
            raw = image_bytes("PNG")
            original.write_bytes(raw)
            with self.assertRaisesRegex(RuntimeError, "Restore the matching database backup"):
                create_app({**self.config, "DATA_DIR": directory})
            self.assertEqual(original.read_bytes(), raw)

    def test_admin_page_is_generic_and_inline_code_has_hashed_csp(self):
        self.upload()
        response = self.client.get("/api/photo-admin")
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertNotIn(KEY, html)
        self.assertNotIn("테스트 하객", html)
        self.assertNotIn("localStorage", html)
        self.assertNotIn("sessionStorage", html)
        csp = response.headers["Content-Security-Policy"]
        self.assertIn("frame-ancestors 'none'", csp)
        self.assertIn("img-src 'self'", csp)
        self.assertNotIn("unsafe-inline", csp)
        for tag in ("script", "style"):
            source = re.search(f"<{tag}>(.*?)</{tag}>", html, re.S).group(1)
            self.assertIn(base64.b64encode(hashlib.sha256(source.encode()).digest()).decode(), csp)

    def test_schema_migration_failure_rolls_back_and_retains_photo_files(self):
        item = self.upload().get_json()["item"]
        existing = self.rows()
        real_read_text = Path.read_text
        def broken_schema(path, *args, **kwargs):
            if path.name == "schema.sql":
                return "CREATE TABLE migration_failure_test (id TEXT); INVALID SQL;"
            return real_read_text(path, *args, **kwargs)
        with patch.object(Path, "read_text", broken_schema):
            with self.assertRaises(sqlite3.OperationalError):
                create_app(self.config)
        with closing(sqlite3.connect(self.data / "wedding.sqlite3")) as conn:
            self.assertIsNone(conn.execute("SELECT name FROM sqlite_master WHERE name='migration_failure_test'").fetchone())
        self.assertEqual(self.rows(), existing)
        self.assertEqual((self.data / "originals" / existing[0]["original_name"]).read_bytes(), image_bytes())
        preview = self.client.get(item["url"])
        self.assertEqual(preview.status_code, 200)
        preview.close()


if __name__ == "__main__":
    unittest.main()
