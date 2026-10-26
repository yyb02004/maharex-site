import hashlib
from contextlib import closing
import os
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from unittest.mock import patch

from photo_mirror import PhotoMirror, _Directory


class PhotoMirrorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="wedding-mirror-test-")
        self.root = Path(self.temp.name)
        self.media = self.root / "media"
        self.originals = self.root / "originals"
        self.export = self.root / "하객사진"
        for directory in (self.media, self.originals, self.export):
            directory.mkdir()
        self.db = self.root / "wedding.sqlite3"
        with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
            conn.executescript((Path(__file__).parents[1] / "schema.sql").read_text(encoding="utf-8"))
        self.manager = self.new_manager()

    def tearDown(self):
        self.manager.stop()
        self.temp.cleanup()

    def new_manager(self, **kwargs):
        return PhotoMirror(self.db, self.media, self.originals, self.export, **kwargs)

    def add_photo(self, index=1, original=True, extension="jpg", filename="원본 사진.jpg", raw=None):
        photo_id = f"{index:032x}"
        raw = raw if raw is not None else b"Original bytes\x00EXIF GPS private metadata\xff\xd9" * 7000
        (self.media / (photo_id + ".jpg")).write_bytes(b"public JPEG preview")
        (self.media / (photo_id + "-thumb.jpg")).write_bytes(b"thumbnail")
        original_name = photo_id + "." + extension if original else None
        if original:
            (self.originals / original_name).write_bytes(raw)
        with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
            conn.execute("INSERT INTO photos(id,name,caption,stored_name,thumbnail_name,width,height,stored_bytes,created_at,"
                         "original_name,original_filename,original_bytes,original_sha256) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                         (photo_id, "김하객", "함께한 날", photo_id + ".jpg", photo_id + "-thumb.jpg", 10, 10, len(raw),
                          "2027-03-06T00:00:00Z", original_name, filename if original else None,
                          len(raw) if original else 0, hashlib.sha256(raw).hexdigest() if original else None))
        return photo_id, raw

    def journal(self):
        with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
            conn.row_factory = sqlite3.Row
            return [dict(row) for row in conn.execute("SELECT * FROM photo_mirror ORDER BY photo_id")]

    def remove_primary(self, photo_id, soft=False):
        with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
            conn.execute("UPDATE photos SET deleted=1 WHERE id=?" if soft else "DELETE FROM photos WHERE id=?", (photo_id,))
        for path in list(self.originals.iterdir()) + list(self.media.iterdir()):
            if path.name.startswith(photo_id):
                path.unlink()

    def test_original_bytes_and_metadata_preserved_with_smb_safe_names(self):
        raws = []
        for index, extension in enumerate(("jpg", "png", "webp"), 1):
            _, raw = self.add_photo(index, extension=extension, filename="../../가족:사진?\x00 ." + extension)
            raws.append(raw)
        result = self.manager.reconcile_once()
        self.assertEqual((result["copied"], result["failed"], result["writable"]), (3, 0, True))
        for entry, raw in zip(self.journal(), raws):
            relative = entry["relative_path"]
            self.assertNotIn("/", relative)
            self.assertNotIn("?", relative)
            self.assertNotIn(":", relative)
            self.assertIn("가족_사진_", relative)
            self.assertEqual((self.export / relative).read_bytes(), raw)
            self.assertEqual(entry["sha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual(entry["copied_bytes"], len(raw))
            if os.name == "posix":
                self.assertEqual((self.export / relative).stat().st_mode & 0o777, 0o644)
        self.assertEqual(len(list(self.originals.iterdir())), 3)
        self.assertFalse(any(path.suffix == ".part" for path in self.export.rglob("*")))

    def test_legacy_photos_are_clearly_separate_and_reconciliation_is_idempotent(self):
        photo_id, _ = self.add_photo(original=False)
        self.manager.reconcile_once()
        entry = self.journal()[0]
        self.assertTrue(entry["relative_path"].startswith("기존사진/"))
        destination = self.export / entry["relative_path"]
        self.assertEqual(destination.read_bytes(), (self.media / (photo_id + ".jpg")).read_bytes())
        before = destination.stat().st_mtime_ns
        self.new_manager().reconcile_once()
        self.assertEqual(destination.stat().st_mtime_ns, before)
        self.assertEqual(self.journal()[0]["attempts"], 1)

    def test_unavailable_export_retries_without_creating_a_missing_mount(self):
        self.add_photo()
        self.export.rmdir()
        result = self.manager.reconcile_once()
        self.assertFalse(result["writable"])
        self.assertEqual(result["lastError"], "file_or_directory_missing")
        self.assertFalse(self.export.exists())
        self.export.mkdir()
        self.assertEqual(self.manager.reconcile_once()["copied"], 1)
        self.assertIsNone(self.manager.status()["lastError"])

    def test_permission_failure_is_reported_and_later_retried(self):
        self.add_photo()
        real_open = _Directory.open

        def unavailable(path):
            if Path(path) == self.export:
                raise PermissionError("A private path must not appear in status")
            return real_open(path)

        with patch.object(_Directory, "open", side_effect=unavailable):
            result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "permission_denied")
        self.assertFalse(result["writable"])
        self.assertEqual(self.manager.reconcile_once()["copied"], 1)

    def test_soft_and_hard_deletion_remove_only_journaled_files_after_restart(self):
        first, _ = self.add_photo(1)
        second, _ = self.add_photo(2, original=False)
        unrelated = self.export / "회사 사진.jpg"
        unrelated.write_bytes(b"not managed")
        self.manager.reconcile_once()
        paths = [self.export / entry["relative_path"] for entry in self.journal()]
        self.remove_primary(first)
        self.remove_primary(second, soft=True)
        restarted = self.new_manager()
        result = restarted.reconcile_once()
        self.assertEqual(result["failed"], 0)
        self.assertEqual(self.journal(), [])
        self.assertTrue(all(not path.exists() for path in paths))
        self.assertEqual(unrelated.read_bytes(), b"not managed")

    def test_preexisting_filename_is_not_adopted_or_overwritten(self):
        photo_id, raw = self.add_photo()
        collision = self.export / (photo_id + "_원본 사진.jpg")
        collision.write_bytes(b"unrelated original filename")
        self.manager.reconcile_once()
        entry = self.journal()[0]
        self.assertNotEqual(entry["relative_path"], collision.name)
        self.assertEqual((self.export / entry["relative_path"]).read_bytes(), raw)
        self.remove_primary(photo_id)
        self.manager.reconcile_once()
        self.assertEqual(collision.read_bytes(), b"unrelated original filename")

    def test_late_filename_collision_cannot_overwrite_unrelated_file(self):
        self.add_photo()
        publish = _Directory.publish

        def collide_at_publication(directory, temporary, destination):
            (directory.path / destination).write_bytes(b"another user created this")
            publish(directory, temporary, destination)

        with patch.object(_Directory, "publish", collide_at_publication):
            self.assertEqual(self.manager.reconcile_once()["failed"], 1)
        destination = self.export / self.journal()[0]["relative_path"]
        self.assertEqual(destination.read_bytes(), b"another user created this")
        self.assertEqual(self.manager.reconcile_once()["lastError"], "destination_changed")

    def test_mirror_respects_free_space_reserve_and_retries_when_space_returns(self):
        _, raw = self.add_photo()
        with patch.object(_Directory, "free_bytes", return_value=512 * 1024**2 + len(raw) - 1):
            result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "insufficient_disk_space")
        self.assertEqual(result["failed"], 1)
        self.assertFalse((self.export / self.journal()[0]["relative_path"]).exists())
        self.assertEqual(len(list(self.originals.iterdir())), 1)
        with patch.object(_Directory, "free_bytes", return_value=1024**3):
            self.assertEqual(self.new_manager().reconcile_once()["copied"], 1)

    def test_overlapping_worker_does_not_touch_an_active_copy(self):
        self.add_photo()
        second = self.new_manager()
        with self.manager._process_guard() as acquired:
            self.assertTrue(acquired)
            second.reconcile_once()
            self.assertEqual(list(self.export.iterdir()), [])
        self.assertEqual(second.reconcile_once()["copied"], 1)

    def test_manually_changed_destination_is_not_overwritten_or_deleted(self):
        photo_id, _ = self.add_photo()
        self.manager.reconcile_once()
        destination = self.export / self.journal()[0]["relative_path"]
        destination.write_bytes(b"someone replaced this file")
        result = self.manager.reconcile_once()
        self.assertEqual(result["failed"], 1)
        self.assertEqual(result["lastError"], "destination_changed")
        self.remove_primary(photo_id)
        result = self.new_manager().reconcile_once()
        self.assertEqual(result["lastError"], "destination_changed_not_deleted")
        self.assertEqual(destination.read_bytes(), b"someone replaced this file")
        self.assertEqual(len(self.journal()), 1)

    def test_original_integrity_failure_and_missing_file_retry(self):
        photo_id, raw = self.add_photo()
        source = self.originals / (photo_id + ".jpg")
        source.write_bytes(b"truncated original")
        result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "original_integrity_mismatch")
        self.assertFalse((self.export / self.journal()[0]["relative_path"]).exists())
        source.unlink()
        result = self.manager.reconcile_once()
        self.assertEqual(result["failed"], 1)
        source.write_bytes(raw)
        self.assertEqual(self.new_manager().reconcile_once()["copied"], 1)
        self.assertFalse(any(path.suffix == ".part" for path in self.export.rglob("*")))

    def test_restart_after_atomic_publication_recovers_without_duplicate_or_data_loss(self):
        _, raw = self.add_photo()
        publish = _Directory.publish

        def crash_after_publish(directory, temporary, destination):
            publish(directory, temporary, destination)
            raise OSError("simulated process failure after publication")

        with patch.object(_Directory, "publish", crash_after_publish):
            self.manager.reconcile_once()
        self.assertEqual(self.journal()[0]["status"], "failed")
        self.assertEqual(self.new_manager().reconcile_once()["copied"], 1)
        files = [path for path in self.export.rglob("*") if path.is_file()]
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].read_bytes(), raw)

    def test_deletion_during_copy_does_not_publish_and_pending_temp_is_recovered(self):
        photo_id, _ = self.add_photo()
        real_fsync = os.fsync
        deleted = False

        def delete_during_copy(fd):
            nonlocal deleted
            # Probe is empty; the completed private temporary has image bytes.
            if os.fstat(fd).st_size > 0 and not deleted:
                deleted = True
                with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
                    conn.execute("DELETE FROM photos WHERE id=?", (photo_id,))
            return real_fsync(fd)

        with patch("photo_mirror.os.fsync", side_effect=delete_during_copy):
            result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "photo_deleted_during_copy")
        self.assertFalse((self.export / self.journal()[0]["relative_path"]).exists())
        self.new_manager().reconcile_once()
        self.assertEqual(self.journal(), [])
        self.assertEqual(list(self.export.iterdir()), [])

    def test_deleted_mirror_is_recreated_from_retained_primary_original(self):
        _, raw = self.add_photo()
        self.manager.reconcile_once()
        destination = self.export / self.journal()[0]["relative_path"]
        destination.unlink()
        self.assertEqual(self.new_manager().reconcile_once()["copied"], 1)
        self.assertEqual(destination.read_bytes(), raw)

    def test_database_loss_is_not_silently_recreated(self):
        self.db.unlink()
        result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "database_unavailable")
        self.assertFalse(self.db.exists())

    def test_unsafe_database_path_cannot_read_outside_original_directory(self):
        photo_id, _ = self.add_photo()
        outside = self.root / "private.jpg"
        outside.write_bytes(b"company private file")
        with closing(sqlite3.connect(self.db, isolation_level=None)) as conn:
            conn.execute("UPDATE photos SET original_name='../private.jpg' WHERE id=?", (photo_id,))
        result = self.manager.reconcile_once()
        self.assertEqual(result["lastError"], "invalid_original_name")
        self.assertEqual(list(self.export.iterdir()), [])
        self.assertEqual(outside.read_bytes(), b"company private file")

    def test_symlinked_source_and_export_are_rejected(self):
        photo_id, _ = self.add_photo()
        source = self.originals / (photo_id + ".jpg")
        outside = self.root / "outside.jpg"
        outside.write_bytes(b"outside")
        source.unlink()
        try:
            source.symlink_to(outside)
        except OSError:
            self.skipTest("Creating Windows symlinks requires local privilege")
        self.assertEqual(self.manager.reconcile_once()["failed"], 1)
        self.assertFalse(any(not path.name.endswith(".part") for path in self.export.iterdir()))
        second_export = self.root / "outside-folder"
        second_export.mkdir()
        alias = self.root / "export-link"
        alias.symlink_to(second_export, target_is_directory=True)
        manager = PhotoMirror(self.db, self.media, self.originals, alias)
        self.assertFalse(manager.reconcile_once()["writable"])
        self.assertEqual(list(second_export.iterdir()), [])

    def test_background_start_returns_and_wake_reconciles(self):
        self.add_photo()
        done = threading.Event()
        reconcile = self.manager.reconcile_once

        def observed_reconcile():
            result = reconcile()
            done.set()
            return result

        with patch.object(self.manager, "reconcile_once", side_effect=observed_reconcile):
            self.manager.start()
            self.assertTrue(done.wait(5))
            self.assertEqual(self.manager.status()["copied"], 1)
            done.clear()
            self.add_photo(2)
            self.manager.wake()
            self.assertTrue(done.wait(5))
            self.assertEqual(self.manager.status()["copied"], 2)
            self.manager.stop()

    def test_api_upload_private_status_and_admin_delete_integrate_with_mirror(self):
        import io
        from PIL import Image
        from werkzeug.security import generate_password_hash
        from app import create_app

        origin = "https://wedding-api.maharex.com"
        password = "example-test-password"
        auth = {"Authorization": "Bearer " + password}
        config = {
            "TESTING": True, "DATA_DIR": str(self.root), "ALLOWED_ORIGINS": origin,
            "PHOTO_EXPORT_DIR": str(self.export), "PHOTO_EXPORT_DISPLAY_PATH": "main/wedding/하객사진",
            "MIN_FREE_DISK_BYTES": 0,
            "MANAGEMENT_PASSWORD_HASH": generate_password_hash(password, method="scrypt:32768:8:1"),
        }
        app = create_app(config)
        client = app.test_client()
        mirror = app.extensions["photo_mirror"]
        self.assertIsNotNone(mirror)
        self.assertIsNone(mirror._thread)
        self.assertEqual(client.get("/api/admin/storage").status_code, 401)
        raw_stream = io.BytesIO()
        Image.new("RGB", (30, 20), "#ead6dc").save(raw_stream, "JPEG")
        raw = raw_stream.getvalue()
        response = client.post("/api/photos", headers={"Origin": origin}, data={
            "name": "하객", "caption": "축하해요", "consent": "true", "originalConsent": "true",
            "file": (io.BytesIO(raw), "함께 찍은 사진.jpg"),
        })
        self.assertEqual(response.status_code, 201)
        photo_id = response.get_json()["item"]["id"]
        self.assertEqual(mirror.reconcile_once()["copied"], 1)
        destination = self.export / self.journal()[0]["relative_path"]
        self.assertEqual(destination.read_bytes(), raw)
        self.assertEqual((self.originals / (photo_id + ".jpg")).read_bytes(), raw)
        state = client.get("/api/admin/storage", headers=auth).get_json()
        self.assertEqual(state["copied"], 1)
        self.assertEqual(state["displayPath"], "main/wedding/하객사진")
        self.assertIsNone(state["lastError"])
        unrelated = self.export / "직접 넣은 사진.jpg"
        unrelated.write_bytes(b"keep this")
        deleted = client.delete("/api/admin/photos/" + photo_id, base_url=origin, headers={**auth, "Origin": origin})
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse((self.originals / (photo_id + ".jpg")).exists())
        mirror.reconcile_once()
        self.assertFalse(destination.exists())
        self.assertEqual(unrelated.read_bytes(), b"keep this")
        self.assertEqual(self.journal(), [])
        mirror.stop()


if __name__ == "__main__":
    unittest.main()
