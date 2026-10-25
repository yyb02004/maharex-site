import io
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from contextlib import closing
from collections import namedtuple

from PIL import Image
from werkzeug.datastructures import MultiDict

from app import create_app


ORIGIN = "https://maharex.com"
HEADERS = {"Origin": ORIGIN}


def picture(fmt="JPEG", size=(120, 80), exif=False, animated=False):
    file = io.BytesIO()
    image = Image.new("RGB", size, "#a5b397")
    options = {}
    if exif:
        metadata = Image.Exif()
        metadata[274] = 6
        metadata[270] = "private test metadata"
        options["exif"] = metadata
    if animated:
        options.update(save_all=True, append_images=[Image.new("RGB", size, "red")], duration=100, loop=0)
    image.save(file, fmt, **options)
    return file.getvalue()


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wedding-test-")
        self.config = {
            "TESTING": True, "DATA_DIR": self.temp.name, "ALLOWED_ORIGINS": ORIGIN,
            "ADMIN_TOKEN": "test-admin-token-" + "a" * 32,
            "GUESTBOOK_RATE_PER_HOUR": 100, "PHOTO_RATE_PER_HOUR": 100,
            "DELETE_RATE_PER_TEN_MINUTES": 100,
        }
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp.cleanup()

    def post_guest(self, client=None, **fields):
        return (client or self.client).post("/api/guestbook", json={"name": "손님", "message": "축하합니다!", "password": "1234", **fields}, headers=HEADERS)

    def post_photo(self, client=None, raw=None, **fields):
        return (client or self.client).post("/api/photos", headers=HEADERS, data={
            "name": "하객", "caption": "함께한 날", "consent": "true",
            "file": (io.BytesIO(raw if raw is not None else picture()), "untrusted-name.png"), **fields,
        })

    def count(self, table):
        with closing(sqlite3.connect(Path(self.temp.name) / "wedding.sqlite3")) as conn:
            return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]

    def test_origin_and_preflight(self):
        for origin in (None, "https://evil.example", "https://maharex.com.evil.example"):
            headers = {"Origin": origin} if origin else {}
            response = self.client.post("/api/guestbook", json={}, headers=headers)
            self.assertEqual(response.status_code, 403)
            self.assertNotIn("Access-Control-Allow-Origin", response.headers)
        response = self.client.options("/api/guestbook", headers={**HEADERS, "Access-Control-Request-Method": "DELETE", "Access-Control-Request-Headers": "Content-Type"})
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], ORIGIN)
        self.assertIn("DELETE", response.headers["Access-Control-Allow-Methods"])
        self.assertNotIn("Access-Control-Allow-Credentials", response.headers)
        self.assertEqual(self.client.get("/api/health").status_code, 200)

    def test_guestbook_validation_password_and_pagination(self):
        for invalid in ({"name": ""}, {"name": "x" * 41}, {"message": "x" * 501}, {"password": "123"}, {"message": 42}):
            self.assertEqual(self.post_guest(**invalid).status_code, 400)
        first = self.post_guest().get_json()["item"]
        second = self.post_guest(name="두 번째").get_json()["item"]
        page = self.client.get("/api/guestbook?limit=1").get_json()
        self.assertEqual(page["items"][0]["id"], second["id"])
        next_page = self.client.get(f"/api/guestbook?limit=1&before={page['nextCursor']}").get_json()
        self.assertEqual(next_page["items"][0]["id"], first["id"])
        self.assertIsNone(next_page["nextCursor"])
        self.assertEqual(set(first), {"id", "name", "message", "createdAt"})
        with closing(sqlite3.connect(Path(self.temp.name) / "wedding.sqlite3")) as conn:
            password_hash = conn.execute("SELECT password_hash FROM guestbook LIMIT 1").fetchone()[0]
        self.assertNotEqual(password_hash, "1234")
        self.assertTrue(password_hash.startswith("scrypt:"))
        url = f"/api/guestbook/{first['id']}"
        self.assertEqual(self.client.delete(url, json={"password": "wrong"}, headers=HEADERS).status_code, 403)
        self.assertEqual(self.client.delete(url, json={"password": "1234"}, headers=HEADERS).status_code, 204)
        self.assertEqual(self.client.delete(url, json={"password": "1234"}, headers=HEADERS).status_code, 404)
        for query in ("limit=0", "limit=51", "before=bad", "before=0", "before=99999999999999999999999"):
            self.assertEqual(self.client.get(f"/api/guestbook?{query}").status_code, 400)

    def test_restart_retains_data_and_rate_limit(self):
        self.app.config["GUESTBOOK_RATE_PER_HOUR"] = 1
        self.assertEqual(self.post_guest().status_code, 201)
        photo = self.post_photo().get_json()["item"]
        restarted = create_app({**self.config, "GUESTBOOK_RATE_PER_HOUR": 1}).test_client()
        self.assertEqual(len(restarted.get("/api/guestbook").get_json()["items"]), 1)
        self.assertEqual(self.post_guest(client=restarted).status_code, 429)
        self.assertEqual(restarted.get("/api/photos").get_json()["items"][0]["id"], photo["id"])
        response = restarted.get(photo["url"])
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)
        response.close()

    def test_image_normalization_metadata_and_supported_formats(self):
        response = self.post_photo(raw=picture(size=(120, 80), exif=True))
        self.assertEqual(response.status_code, 201)
        item = response.get_json()["item"]
        self.assertEqual((item["width"], item["height"]), (80, 120))
        for url in (item["url"], item["thumbnailUrl"]):
            response = self.client.get(url)
            image = Image.open(io.BytesIO(response.data))
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(len(image.getexif()), 0)
            self.assertNotIn("private test metadata", str(image.info))
            response.close()
        for fmt in ("PNG", "WEBP"):
            self.assertEqual(self.post_photo(raw=picture(fmt)).status_code, 201)
        large = self.post_photo(raw=picture(size=(3000, 1000))).get_json()["item"]
        self.assertEqual(large["width"], 2560)

    def test_invalid_images_and_consent(self):
        self.assertEqual(self.post_photo(consent="false").status_code, 400)
        self.assertEqual(self.post_photo(raw=b"<svg><script>bad</script></svg>").status_code, 415)
        self.assertEqual(self.post_photo(raw=picture("GIF")).status_code, 415)
        self.assertEqual(self.post_photo(raw=picture("WEBP", animated=True)).status_code, 415)
        self.assertEqual(self.post_photo(raw=picture()[:100]).status_code, 415)
        self.app.config["MAX_IMAGE_PIXELS"] = 100
        self.assertEqual(self.post_photo().status_code, 413)
        self.app.config["MAX_IMAGE_PIXELS"] = 40_000_000
        self.app.config["MAX_UPLOAD_BYTES"] = 100
        self.assertEqual(self.post_photo().status_code, 413)
        self.assertEqual(self.count("photos"), 0)
        self.assertFalse(list((Path(self.temp.name) / "media").iterdir()))
        data = MultiDict([("name", "손님"), ("consent", "true"), ("file", (io.BytesIO(picture()), "a.jpg")), ("file", (io.BytesIO(picture()), "b.jpg"))])
        self.assertEqual(self.client.post("/api/photos", headers=HEADERS, data=data).status_code, 400)

    def test_large_multipart_and_disk_reserve(self):
        raw = io.BytesIO()
        Image.frombytes("RGB", (1000, 1000), os.urandom(3_000_000)).save(raw, "JPEG", quality=90)
        self.assertGreater(len(raw.getvalue()), 500_000)
        self.assertEqual(self.post_photo(raw=raw.getvalue()).status_code, 201)
        usage = namedtuple("usage", "total used free")
        with patch("app.shutil.disk_usage", return_value=usage(1000, 999, 1)):
            self.assertEqual(self.post_photo().status_code, 507)
        self.assertEqual(self.count("photos"), 1)

    def test_file_failure_rolls_back_and_startup_removes_orphan(self):
        real_open = Path.open

        def fail_thumb(path, *args, **kwargs):
            if path.name.endswith("-thumb.jpg") and args and args[0] == "xb":
                raise OSError("simulated full disk")
            return real_open(path, *args, **kwargs)

        with patch.object(Path, "open", fail_thumb):
            self.assertEqual(self.post_photo().status_code, 503)
        self.assertEqual(self.count("photos"), 0)
        self.assertFalse(list((Path(self.temp.name) / "media").iterdir()))
        orphan = Path(self.temp.name) / "media" / ("a" * 32 + ".jpg")
        orphan.write_bytes(picture())
        create_app(self.config)
        self.assertFalse(orphan.exists())

    def test_startup_refuses_missing_or_empty_database_without_deleting_photos(self):
        for empty_database in (False, True):
            with self.subTest(empty_database=empty_database), tempfile.TemporaryDirectory(prefix="wedding-recovery-test-") as directory:
                data = Path(directory)
                media = data / "media"
                media.mkdir()
                photo = media / ("b" * 32 + ".jpg")
                original = picture()
                photo.write_bytes(original)
                database = data / "wedding.sqlite3"
                if empty_database:
                    database.touch()
                with self.assertRaisesRegex(RuntimeError, "Restore the matching database backup"):
                    create_app({**self.config, "DATA_DIR": directory})
                self.assertEqual(photo.read_bytes(), original)
                self.assertEqual(database.exists(), empty_database)
                if empty_database:
                    self.assertEqual(database.stat().st_size, 0)

    def test_photo_admin_delete_and_path_access(self):
        item = self.post_photo().get_json()["item"]
        route = f"/api/photos/{item['id']}"
        self.assertEqual(self.client.delete(route, headers=HEADERS).status_code, 403)
        self.assertEqual(self.client.delete(route, headers={**HEADERS, "Authorization": "Bearer wrong"}).status_code, 403)
        self.assertEqual(self.client.delete(route, headers={**HEADERS, "Authorization": "Bearer 비밀번호"}).status_code, 403)
        self.assertEqual(self.client.delete(route, headers={**HEADERS, "Authorization": "Bearer " + self.config["ADMIN_TOKEN"]}).status_code, 204)
        self.assertEqual(self.client.get(item["url"]).status_code, 404)
        self.assertEqual(self.count("photos"), 0)
        self.assertFalse(list((Path(self.temp.name) / "media").iterdir()))
        for path in ("/media/../wedding.sqlite3", "/media/%2e%2e%2fwedding.sqlite3", "/media/wedding.sqlite3", "/media/" + "a" * 32 + ".jpg"):
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_concurrent_guestbook_and_photo_quota(self):
        clients = [create_app(self.config).test_client() for _ in range(2)]
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda index: self.post_guest(client=clients[index]), range(2)))
        self.assertEqual([response.status_code for response in responses], [201, 201])
        self.assertEqual(self.count("guestbook"), 2)
        quota_clients = [create_app({**self.config, "MAX_PHOTO_COUNT": 1}).test_client() for _ in range(2)]
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda index: self.post_photo(client=quota_clients[index]), range(2)))
        self.assertEqual(sorted(response.status_code for response in responses), [201, 507])
        self.assertEqual(self.count("photos"), 1)
        self.assertEqual(len(list((Path(self.temp.name) / "media").iterdir())), 2)

    def test_byte_quota_and_proxy_default(self):
        self.app.config["MAX_STORAGE_BYTES"] = 1
        self.assertEqual(self.post_photo().status_code, 507)
        self.assertEqual(self.count("photos"), 0)
        self.assertFalse(list((Path(self.temp.name) / "media").iterdir()))
        self.app.config["GUESTBOOK_RATE_PER_HOUR"] = 1
        first = self.client.post("/api/guestbook", json={"name": "a", "message": "b", "password": "1234"}, headers={**HEADERS, "X-Forwarded-For": "1.2.3.4"})
        second = self.client.post("/api/guestbook", json={"name": "a", "message": "b", "password": "1234"}, headers={**HEADERS, "X-Forwarded-For": "5.6.7.8"})
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)


if __name__ == "__main__":
    unittest.main()
