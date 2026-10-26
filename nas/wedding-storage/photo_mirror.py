"""Retryable, private NAS copies of guest photos; the primary volume stays authoritative.

The journal deliberately has no foreign key to photos. A primary photo can be hard
deleted before this worker runs, and its journal entry still schedules mirror removal.
Only journaled files are ever removed. This module never modifies the photos table.
"""

from __future__ import annotations

from contextlib import closing, contextmanager
from datetime import datetime, timezone
import errno
import hashlib
import os
from pathlib import Path
import re
import shutil
import sqlite3
import stat
import threading
import unicodedata
import uuid


MIRROR_SCHEMA = """
CREATE TABLE IF NOT EXISTS photo_mirror (
    photo_id TEXT PRIMARY KEY,
    relative_path TEXT NOT NULL UNIQUE,
    source_kind TEXT NOT NULL,
    source_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    sha256 TEXT,
    copied_bytes INTEGER NOT NULL DEFAULT 0,
    destination_mtime_ns INTEGER,
    temp_name TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    updated_at TEXT NOT NULL
);
"""

_ID = re.compile(r"[a-f0-9]{32}\Z")
_SHA = re.compile(r"[a-f0-9]{64}\Z")
_TEMP = re.compile(r"\.wedding-mirror-[a-f0-9]{32}-[a-f0-9]{32}\.part\Z")
_CHUNK = 1024 * 1024
_LEGACY = "기존사진"
_DIR_FD = os.name == "posix" and hasattr(os, "O_NOFOLLOW")


class MirrorError(RuntimeError):
    """A safe error code suitable for the private administration status."""


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _basename(value):
    if not isinstance(value, str) or not value or value in {".", ".."}:
        raise MirrorError("unsafe_path")
    if any(c in value for c in ("/", "\\", "\x00")):
        raise MirrorError("unsafe_path")
    return value


def _filename(value, extension):
    # These files also appear through SMB in Windows File Explorer.
    value = unicodedata.normalize("NFC", str(value or "사진").replace("\\", "/").rsplit("/", 1)[-1])
    value = "".join("_" if c in '<>:"/\\|?*' else c for c in value if unicodedata.category(c)[0] != "C")
    value = value.strip(" .") or "사진"
    stem = value.rsplit(".", 1)[0] if "." in value else value
    stem = stem.strip(" .") or "사진"
    while len(stem.encode("utf-8")) > 160:
        stem = stem[:-1]
    return stem + "." + extension


def _error_code(error):
    if isinstance(error, MirrorError):
        return str(error)
    if isinstance(error, PermissionError):
        return "permission_denied"
    if isinstance(error, FileNotFoundError):
        return "file_or_directory_missing"
    if isinstance(error, OSError) and error.errno == errno.ENOSPC:
        return "disk_full"
    if isinstance(error, sqlite3.Error):
        return "database_unavailable"
    # Do not expose source paths, upload names or an exception's arbitrary text.
    return "filesystem_error"


class _Directory:
    """Directory-anchored operations prevent symlink traversal on the Linux NAS."""

    def __init__(self, path, fd=None):
        self.path, self.fd = Path(path), fd

    @classmethod
    def open(cls, path):
        path = Path(path).absolute()
        if ".." in path.parts:
            raise MirrorError("unsafe_path")
        if _DIR_FD:
            fd = os.open(path.anchor, os.O_RDONLY | os.O_DIRECTORY)
            try:
                for component in path.parts[1:]:
                    next_fd = os.open(component, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
                    os.close(fd)
                    fd = next_fd
                return cls(path, fd)
            except BaseException:
                os.close(fd)
                raise
        # Local Windows development: refuse all symlinks/junctions/reparse points.
        for parent in [*reversed(path.parents), path]:
            info = parent.lstat()
            if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
                raise MirrorError("symlink_not_allowed")
            if not stat.S_ISDIR(info.st_mode):
                raise MirrorError("not_a_directory")
        return cls(path)

    def close(self):
        if self.fd is not None:
            os.close(self.fd)
            self.fd = None

    def child(self, name, create=False):
        _basename(name)
        if create:
            try:
                if self.fd is not None:
                    os.mkdir(name, 0o755, dir_fd=self.fd)
                else:
                    (self.path / name).mkdir(mode=0o755)
                self.sync()
            except FileExistsError:
                pass
        if self.fd is not None:
            return _Directory(self.path / name, os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=self.fd))
        return _Directory.open(self.path / name)

    def info(self, name):
        _basename(name)
        try:
            info = os.stat(name, dir_fd=self.fd, follow_symlinks=False) if self.fd is not None else (self.path / name).lstat()
        except FileNotFoundError:
            return None
        if not stat.S_ISREG(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
            raise MirrorError("non_regular_file")
        return info

    def file(self, name, write=False):
        _basename(name)
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL if write else os.O_RDONLY
        flags |= getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
        if self.fd is not None:
            fd = os.open(name, flags, 0o644, dir_fd=self.fd)
        else:
            self.info(name)
            fd = os.open(self.path / name, flags, 0o644)
        try:
            if not stat.S_ISREG(os.fstat(fd).st_mode):
                raise MirrorError("non_regular_file")
            if write and hasattr(os, "fchmod"):
                os.fchmod(fd, 0o644)
            return os.fdopen(fd, "wb" if write else "rb")
        except BaseException:
            os.close(fd)
            raise

    def remove(self, name):
        if self.info(name) is not None:
            if self.fd is not None:
                os.unlink(name, dir_fd=self.fd)
            else:
                (self.path / name).unlink()
            self.sync()

    def publish(self, temporary, destination):
        # link() atomically publishes a complete fsynced inode without overwriting
        # any concurrently-created unrelated file. Both names are on this share.
        if self.fd is not None:
            os.link(temporary, destination, src_dir_fd=self.fd, dst_dir_fd=self.fd, follow_symlinks=False)
        else:
            os.link(self.path / temporary, self.path / destination, follow_symlinks=False)
        self.sync()
        self.remove(temporary)

    def sync(self):
        if self.fd is not None:
            try:
                os.fsync(self.fd)
            except OSError as error:
                if error.errno not in {errno.EINVAL, errno.ENOTSUP, errno.EBADF}:
                    raise

    def free_bytes(self):
        if self.fd is not None:
            info = os.fstatvfs(self.fd)
            return info.f_bavail * info.f_frsize
        return shutil.disk_usage(self.path).free


class PhotoMirror:
    """One bounded background worker; all long file I/O happens outside DB locks.

    ``start`` returns immediately. ``wake`` is optional after an upload/deletion;
    startup and periodic full reconciliation also recover missed notifications.
    The export mount must already exist. This never creates a missing mount root.
    """

    def __init__(self, database_path, media_dir, originals_dir, export_dir, interval=30,
                 min_free_bytes=512 * 1024**2):
        self.database_path = Path(database_path).absolute()
        self.media_dir = Path(media_dir).absolute()
        self.originals_dir = Path(originals_dir).absolute()
        self.export_dir = Path(export_dir).absolute()
        self.interval = max(1, float(interval))
        self.min_free_bytes = max(0, int(min_free_bytes))
        self._run_lock = threading.Lock()
        self._state_lock = threading.Lock()
        self._wake = threading.Event()
        self._stop = threading.Event()
        self._thread = None
        self._state = {"enabled": True, "running": False, "pending": 0, "copied": 0,
                       "failed": 0, "lastRun": None, "lastError": None, "writable": None}

    def start(self):
        with self._state_lock:
            if self._thread and self._thread.is_alive():
                return
            self._stop.clear()
            self._thread = threading.Thread(target=self._work, name="wedding-photo-mirror", daemon=True)
            self._thread.start()

    def wake(self):
        self._wake.set()

    def stop(self, timeout=2):
        self._stop.set()
        self._wake.set()
        thread = self._thread
        if thread and thread is not threading.current_thread():
            thread.join(timeout=timeout)

    def status(self):
        with self._state_lock:
            return dict(self._state)

    def _state_update(self, **values):
        with self._state_lock:
            self._state.update(values)

    def _work(self):
        while not self._stop.is_set():
            self._wake.clear()
            self.reconcile_once()
            self._wake.wait(self.interval)

    def _connect(self):
        # mode=rw refuses accidental recreation of a lost primary database.
        conn = sqlite3.connect(self.database_path.as_uri() + "?mode=rw", uri=True, timeout=2, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA busy_timeout=2000")
        return conn

    @contextmanager
    def _process_guard(self):
        # Gunicorn is configured for one worker, but this also serializes a
        # temporary overlap during a graceful restart or accidental extra worker.
        path = self.database_path.with_name(".photo-mirror.lock")
        if path.is_symlink():
            raise MirrorError("symlink_not_allowed")
        fd = os.open(path, os.O_RDWR | os.O_CREAT | getattr(os, "O_NOFOLLOW", 0), 0o600)
        locked = False
        try:
            if not stat.S_ISREG(os.fstat(fd).st_mode):
                raise MirrorError("non_regular_file")
            try:
                if os.name == "posix":
                    import fcntl
                    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                else:
                    import msvcrt
                    if os.fstat(fd).st_size == 0:
                        os.write(fd, b"\0")
                    os.lseek(fd, 0, os.SEEK_SET)
                    msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
                locked = True
            except OSError as error:
                if error.errno not in {errno.EACCES, errno.EAGAIN}:
                    raise
            yield locked
        finally:
            if locked:
                if os.name == "posix":
                    import fcntl
                    fcntl.flock(fd, fcntl.LOCK_UN)
                else:
                    import msvcrt
                    os.lseek(fd, 0, os.SEEK_SET)
                    msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            os.close(fd)

    @contextmanager
    def _target(self, root, relative):
        parts = relative.split("/")
        if len(parts) == 1:
            directory = root
        elif len(parts) == 2 and parts[0] == _LEGACY:
            directory = root.child(_LEGACY, create=True)
        else:
            raise MirrorError("unsafe_path")
        try:
            yield directory, _basename(parts[-1])
        finally:
            if directory is not root:
                directory.close()

    def _source(self, row):
        if not _ID.fullmatch(str(row["id"])):
            raise MirrorError("invalid_photo_id")
        if row["original_name"]:
            name = str(row["original_name"])
            if not re.fullmatch(re.escape(row["id"]) + r"\.(jpg|png|webp)", name):
                raise MirrorError("invalid_original_name")
            if not _SHA.fullmatch(str(row["original_sha256"])) or row["original_bytes"] <= 0:
                raise MirrorError("invalid_original_metadata")
            return "original", name, self.originals_dir, row["original_sha256"], row["original_bytes"]
        if row["stored_name"] != row["id"] + ".jpg":
            raise MirrorError("invalid_preview_name")
        return "legacy", row["stored_name"], self.media_dir, None, None

    def _new_entry(self, conn, root, row):
        kind, source, _, _, _ = self._source(row)
        human = row["original_filename"] if kind == "original" else row["name"]
        filename = row["id"] + "_" + _filename(human, source.rsplit(".", 1)[-1])
        relative = (_LEGACY + "/" if kind == "legacy" else "") + filename
        # Pre-existing files have no ownership journal and must never be adopted.
        with self._target(root, relative) as (directory, _):
            try:
                collision = directory.info(filename) is not None
            except MirrorError:
                collision = True
            if collision:
                stem, extension = filename.rsplit(".", 1)
                filename = stem + "_" + uuid.uuid4().hex[:12] + "." + extension
                relative = (_LEGACY + "/" if kind == "legacy" else "") + filename
        conn.execute("INSERT OR IGNORE INTO photo_mirror(photo_id,relative_path,source_kind,source_name,updated_at) VALUES (?,?,?,?,?)",
                     (row["id"], relative, kind, source, _now()))

    def _digest(self, directory, name):
        digest, size = hashlib.sha256(), 0
        with directory.file(name) as stream:
            while chunk := stream.read(_CHUNK):
                if self._stop.is_set():
                    raise MirrorError("interrupted")
                digest.update(chunk)
                size += len(chunk)
        return digest.hexdigest(), size

    def _cleanup_temp(self, conn, directory, entry):
        if entry["temp_name"]:
            if not _TEMP.fullmatch(entry["temp_name"]) or not entry["temp_name"].startswith(".wedding-mirror-" + entry["photo_id"] + "-"):
                raise MirrorError("invalid_temp_name")
            directory.remove(entry["temp_name"])
            conn.execute("UPDATE photo_mirror SET temp_name=NULL WHERE photo_id=?", (entry["photo_id"],))

    def _delete(self, conn, root, entry):
        with self._target(root, entry["relative_path"]) as (directory, filename):
            self._cleanup_temp(conn, directory, entry)
            if directory.info(filename) is not None:
                digest, size = self._digest(directory, filename)
                if not entry["sha256"] or digest != entry["sha256"] or size != entry["copied_bytes"]:
                    raise MirrorError("destination_changed_not_deleted")
                directory.remove(filename)
            conn.execute("DELETE FROM photo_mirror WHERE photo_id=?", (entry["photo_id"],))

    def _copy(self, conn, root, entry, row):
        kind, source_name, source_path, expected_digest, expected_bytes = self._source(row)
        if (kind, source_name) != (entry["source_kind"], entry["source_name"]):
            raise MirrorError("source_changed")
        with self._target(root, entry["relative_path"]) as (directory, filename):
            self._cleanup_temp(conn, directory, entry)
            info = directory.info(filename)
            if info is not None:
                if not entry["sha256"]:
                    raise MirrorError("destination_conflict")
                if (entry["status"] == "copied" and info.st_size == entry["copied_bytes"] and
                        info.st_mtime_ns == entry["destination_mtime_ns"]):
                    return
                if (entry["status"] != "copied" or info.st_size != entry["copied_bytes"] or
                        info.st_mtime_ns != entry["destination_mtime_ns"]):
                    digest, size = self._digest(directory, filename)
                    if digest != entry["sha256"] or size != entry["copied_bytes"]:
                        raise MirrorError("destination_changed")
                conn.execute("UPDATE photo_mirror SET status='copied',last_error=NULL,destination_mtime_ns=?,updated_at=? WHERE photo_id=?",
                             (info.st_mtime_ns, _now(), entry["photo_id"]))
                return
            temporary = ".wedding-mirror-" + row["id"] + "-" + uuid.uuid4().hex + ".part"
            conn.execute("UPDATE photo_mirror SET temp_name=?,status='pending',attempts=attempts+1,updated_at=? WHERE photo_id=?",
                         (temporary, _now(), row["id"]))
            digest, size = hashlib.sha256(), 0
            with closing(_Directory.open(source_path)) as source_dir:
                with source_dir.file(source_name) as incoming, directory.file(temporary, write=True) as outgoing:
                    source_bytes = os.fstat(incoming.fileno()).st_size
                    if expected_bytes is not None and source_bytes != expected_bytes:
                        raise MirrorError("original_integrity_mismatch")
                    while chunk := incoming.read(_CHUNK):
                        if self._stop.is_set():
                            raise MirrorError("interrupted")
                        if directory.free_bytes() < self.min_free_bytes + source_bytes - size:
                            raise MirrorError("insufficient_disk_space")
                        outgoing.write(chunk)
                        digest.update(chunk)
                        size += len(chunk)
                    outgoing.flush()
                    os.fsync(outgoing.fileno())
                    if directory.free_bytes() < self.min_free_bytes:
                        raise MirrorError("insufficient_disk_space")
            digest = digest.hexdigest()
            if expected_digest is not None and (digest != expected_digest or size != expected_bytes):
                raise MirrorError("original_integrity_mismatch")
            # Persist ownership before publishing so a crash cannot leave an
            # untracked final file. Source deletion is serialized only here.
            conn.execute("BEGIN IMMEDIATE")
            try:
                current = conn.execute("SELECT deleted,original_name,stored_name FROM photos WHERE id=?", (row["id"],)).fetchone()
                if current is None or current["deleted"] or (current["original_name"] or current["stored_name"]) != source_name:
                    raise MirrorError("photo_deleted_during_copy")
                conn.execute("UPDATE photo_mirror SET sha256=?,copied_bytes=?,updated_at=? WHERE photo_id=?",
                             (digest, size, _now(), row["id"]))
                conn.commit()
            except BaseException:
                conn.rollback()
                raise
            directory.publish(temporary, filename)
            info = directory.info(filename)
            conn.execute("UPDATE photo_mirror SET status='copied',temp_name=NULL,last_error=NULL,destination_mtime_ns=?,updated_at=? WHERE photo_id=?",
                         (info.st_mtime_ns, _now(), row["id"]))

    def _counts(self, conn):
        counts = {row["status"]: row["n"] for row in conn.execute("SELECT status,COUNT(*) n FROM photo_mirror GROUP BY status")}
        return {name: counts.get(name, 0) for name in ("pending", "copied", "failed")}

    def _reconcile(self):
        with closing(self._connect()) as conn:
            conn.executescript(MIRROR_SCHEMA)
            with closing(_Directory.open(self.export_dir)) as root:
                probe = ".wedding-mirror-" + "0" * 32 + "-" + uuid.uuid4().hex + ".part"
                probe_created = False
                try:
                    with root.file(probe, write=True) as stream:
                        probe_created = True
                        stream.flush()
                        os.fsync(stream.fileno())
                finally:
                    if probe_created:
                        root.remove(probe)
                self._state_update(writable=True, lastError=None)
                for row in conn.execute("SELECT * FROM photos WHERE deleted=0 ORDER BY seq").fetchall():
                    if self._stop.is_set():
                        break
                    if conn.execute("SELECT 1 FROM photo_mirror WHERE photo_id=?", (row["id"],)).fetchone() is None:
                        self._new_entry(conn, root, row)
                for entry in conn.execute("SELECT * FROM photo_mirror ORDER BY updated_at,photo_id").fetchall():
                    if self._stop.is_set():
                        break
                    try:
                        row = conn.execute("SELECT * FROM photos WHERE id=?", (entry["photo_id"],)).fetchone()
                        if row is None or row["deleted"]:
                            self._delete(conn, root, entry)
                        else:
                            self._copy(conn, root, entry, row)
                    except (OSError, MirrorError, sqlite3.Error) as error:
                        conn.execute("UPDATE photo_mirror SET status='failed',last_error=?,updated_at=? WHERE photo_id=?",
                                     (_error_code(error), _now(), entry["photo_id"]))
                        self._state_update(lastError=_error_code(error))
                self._state_update(**self._counts(conn))

    def reconcile_once(self):
        """Reconcile a snapshot, returning a secret-free status; failures retry later."""
        if not self._run_lock.acquire(blocking=False):
            return self.status()
        self._state_update(running=True)
        try:
            with self._process_guard() as acquired:
                if acquired:
                    self._reconcile()
        except (OSError, MirrorError, sqlite3.Error) as error:
            self._state_update(writable=False, lastError=_error_code(error))
        finally:
            self._state_update(running=False, lastRun=_now())
            self._run_lock.release()
        return self.status()
