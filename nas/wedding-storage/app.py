"""A separate, persistent wedding guestbook and public photo API for a NAS."""

from __future__ import annotations

import hashlib
import hmac
import io
import base64
import csv
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import sqlite3
import threading
import time
from datetime import datetime, timezone
from urllib.parse import urlsplit
import uuid
import warnings
import zipfile
from collections import deque
from contextlib import closing

from flask import Flask, Response, g, jsonify, request, send_file
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash


ID_PATTERN = re.compile(r"^[a-f0-9]{32}$")
MEDIA_PATTERN = re.compile(r"^[a-f0-9]{32}(?:-thumb)?\.jpg$")
ORIGINAL_PATTERN = re.compile(r"^[a-f0-9]{32}\.(?:jpg|png|webp)$")
IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
PHOTO_COOKIE = "wedding_photo_admin"
PHOTO_SESSION_SECONDS = 3600


class StreamingZipSink:
    """An unseekable ZIP output drained after each small input chunk."""
    def __init__(self):
        self.chunks = deque()
        self.offset = 0

    def write(self, data):
        if data:
            self.chunks.append(bytes(data))
            self.offset += len(data)
        return len(data)

    def tell(self):
        return self.offset

    def seek(self, *_args):
        raise io.UnsupportedOperation("ZIP streaming is not seekable")

    def flush(self):
        pass

    def drain(self):
        while self.chunks:
            yield self.chunks.popleft()


class ApiError(Exception):
    def __init__(self, message: str, status: int = 400, retry_after: int | None = None):
        super().__init__(message)
        self.message, self.status, self.retry_after = message, status, retry_after


def positive_int(name: str, default: int, minimum: int = 1) -> int:
    value = int(os.getenv(name, str(default)))
    if value < minimum:
        raise ValueError(f"{name} must be >= {minimum}")
    return value


def origin_is_valid(origin: str) -> bool:
    try:
        parsed = urlsplit(origin)
        # A port is validated by accessing parsed.port; paths and credentials are forbidden.
        _ = parsed.port
        return bool(
            parsed.hostname
            and parsed.username is None
            and parsed.password is None
            and not parsed.path
            and not parsed.query
            and not parsed.fragment
            and (parsed.scheme == "https" or (
                parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
            ))
        )
    except ValueError:
        return False


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.update(
        DATA_DIR=os.getenv("DATA_DIR", str(Path(__file__).parent / "data")),
        ALLOWED_ORIGINS=os.getenv("ALLOWED_ORIGINS", "https://maharex.com,https://www.maharex.com"),
        ADMIN_TOKEN=os.getenv("ADMIN_TOKEN", ""),
        RSVP_VIEW_TOKEN=os.getenv("RSVP_VIEW_TOKEN", ""),
        PHOTO_ADMIN_TOKEN=os.getenv("PHOTO_ADMIN_TOKEN", ""),
        TRUST_PROXY_HOPS=positive_int("TRUST_PROXY_HOPS", 0, 0),
        MAX_UPLOAD_BYTES=positive_int("MAX_UPLOAD_BYTES", 15 * 1024 * 1024),
        MAX_IMAGE_PIXELS=positive_int("MAX_IMAGE_PIXELS", 40_000_000),
        MAX_PHOTO_COUNT=positive_int("MAX_PHOTO_COUNT", 5000),
        MAX_STORAGE_BYTES=positive_int("MAX_STORAGE_BYTES", 10 * 1024**3),
        MIN_FREE_DISK_BYTES=positive_int("MIN_FREE_DISK_BYTES", 512 * 1024**2, 0),
        MAX_GUESTBOOK_COUNT=positive_int("MAX_GUESTBOOK_COUNT", 5000),
        GUESTBOOK_RATE_PER_HOUR=positive_int("GUESTBOOK_RATE_PER_HOUR", 20),
        RSVP_RATE_PER_HOUR=positive_int("RSVP_RATE_PER_HOUR", 20),
        MAX_RSVP_COUNT=positive_int("MAX_RSVP_COUNT", 5000),
        PHOTO_RATE_PER_HOUR=positive_int("PHOTO_RATE_PER_HOUR", 60),
        DELETE_RATE_PER_TEN_MINUTES=positive_int("DELETE_RATE_PER_TEN_MINUTES", 10),
        MAX_FORM_MEMORY_SIZE=512 * 1024,
        MAX_FORM_PARTS=8,
    )
    if test_config:
        app.config.update(test_config)
    origins = app.config["ALLOWED_ORIGINS"]
    origins = {value.strip() for value in origins.split(",") if value.strip()} if isinstance(origins, str) else set(origins)
    if not origins or not all(origin_is_valid(origin) for origin in origins):
        raise ValueError("ALLOWED_ORIGINS must contain exact HTTPS origins (HTTP loopback is allowed for development)")
    app.config["ALLOWED_ORIGINS"] = origins
    if app.config["ADMIN_TOKEN"] and len(app.config["ADMIN_TOKEN"]) < 32:
        raise ValueError("ADMIN_TOKEN must be empty or at least 32 characters")
    if app.config["RSVP_VIEW_TOKEN"] and len(app.config["RSVP_VIEW_TOKEN"]) < 32:
        raise ValueError("RSVP_VIEW_TOKEN must be empty or at least 32 characters")
    photo_token = app.config["PHOTO_ADMIN_TOKEN"]
    if photo_token and (len(photo_token) < 32 or photo_token in {app.config["RSVP_VIEW_TOKEN"], app.config["ADMIN_TOKEN"]}):
        raise ValueError("PHOTO_ADMIN_TOKEN must be empty or a separate key of at least 32 characters")
    photo_signer = URLSafeTimedSerializer(hashlib.sha256(photo_token.encode()).digest(), salt="photo-admin-session-v1")
    app.config["MAX_CONTENT_LENGTH"] = app.config["MAX_UPLOAD_BYTES"] + 64 * 1024
    proxy_hops = app.config["TRUST_PROXY_HOPS"]
    if proxy_hops:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=proxy_hops, x_proto=proxy_hops, x_host=0, x_port=0, x_prefix=0)

    data_dir = Path(app.config["DATA_DIR"]).resolve()
    media_dir = data_dir / "media"
    originals_dir = data_dir / "originals"
    media_dir.mkdir(parents=True, exist_ok=True)
    originals_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    db_path = data_dir / "wedding.sqlite3"
    existing_media = any(MEDIA_PATTERN.fullmatch(path.name) for path in media_dir.iterdir()) or any(
        ORIGINAL_PATTERN.fullmatch(path.name) for path in originals_dir.iterdir()
    )
    missing_database_message = (
        "Guest photo files exist without an initialized matching database. "
        "Restore the matching database backup or use a new empty data folder."
    )
    # Never interpret retained guest photos as abandoned uploads after database loss.
    if existing_media and not db_path.exists():
        raise RuntimeError(missing_database_message)
    app.config["DATABASE"] = str(db_path)
    app.config["MEDIA_DIR"] = str(media_dir)
    app.config["ORIGINALS_DIR"] = str(originals_dir)

    def remove_media(row):
        for filename in (row["stored_name"], row["thumbnail_name"]):
            if not MEDIA_PATTERN.fullmatch(filename):
                raise RuntimeError("Invalid stored media filename")
            path = media_dir / filename
            if path.is_symlink():
                raise RuntimeError("Media symlinks are not supported")
            path.unlink(missing_ok=True)
        if row["original_name"]:
            if not ORIGINAL_PATTERN.fullmatch(row["original_name"]):
                raise RuntimeError("Invalid original filename")
            path = originals_dir / row["original_name"]
            if path.is_symlink():
                raise RuntimeError("Original symlinks are not supported")
            path.unlink(missing_ok=True)

    def connect() -> sqlite3.Connection:
        conn = sqlite3.connect(db_path, timeout=30, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA busy_timeout = 30000")
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    with closing(connect()) as conn:
        version = conn.execute("PRAGMA user_version").fetchone()[0]
        photo_table_exists = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='photos'").fetchone() is not None
        if existing_media and (version == 0 or not photo_table_exists):
            raise RuntimeError(missing_database_message)
        if version not in (0, 1, 2):
            raise RuntimeError("Unsupported database schema version; restore the matching application version")
        conn.execute("PRAGMA journal_mode = WAL")
        # Uploads create files inside the same write lock. Recovery cannot race another writer.
        try:
            conn.executescript("BEGIN IMMEDIATE;\n" + (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8"))
            columns = {row[1] for row in conn.execute("PRAGMA table_info(photos)")}
            for name, definition in (
                ("original_name", "TEXT"), ("original_filename", "TEXT"),
                ("original_bytes", "INTEGER NOT NULL DEFAULT 0"), ("original_sha256", "TEXT"),
            ):
                if name not in columns:
                    conn.execute(f"ALTER TABLE photos ADD COLUMN {name} {definition}")
            conn.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('rate_secret',?)", (secrets.token_hex(32),))
            rate_secret = conn.execute("SELECT value FROM settings WHERE key='rate_secret'").fetchone()[0].encode()
            for row in conn.execute("SELECT * FROM photos WHERE deleted=1").fetchall():
                remove_media(row)
                conn.execute("DELETE FROM photos WHERE id=?", (row["id"],))
            referenced = {
                name for row in conn.execute("SELECT stored_name,thumbnail_name FROM photos")
                for name in (row["stored_name"], row["thumbnail_name"])
            }
            for path in media_dir.iterdir():
                if MEDIA_PATTERN.fullmatch(path.name) and path.name not in referenced and not path.is_symlink():
                    path.unlink(missing_ok=True)
            original_references = {row[0] for row in conn.execute("SELECT original_name FROM photos WHERE original_name IS NOT NULL")}
            for path in originals_dir.iterdir():
                if ORIGINAL_PATTERN.fullmatch(path.name) and path.name not in original_references and not path.is_symlink():
                    path.unlink(missing_ok=True)
            conn.execute("PRAGMA user_version = 2")
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    image_slot = threading.BoundedSemaphore(1)
    archive_slot = threading.BoundedSemaphore(1)

    def db() -> sqlite3.Connection:
        if "db" not in g:
            g.db = connect()
        return g.db

    @app.teardown_appcontext
    def close_db(_error=None):
        conn = g.pop("db", None)
        if conn is not None:
            conn.close()

    def timestamp() -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    def public_guest(row) -> dict:
        return {"id": row["id"], "name": row["name"], "message": row["message"], "createdAt": row["created_at"]}

    def public_photo(row) -> dict:
        return {
            "id": row["id"], "name": row["name"], "caption": row["caption"],
            "url": f"/media/{row['stored_name']}", "thumbnailUrl": f"/media/{row['thumbnail_name']}",
            "width": row["width"], "height": row["height"], "createdAt": row["created_at"],
        }

    def text_field(data, key, maximum, minimum=0):
        value = data.get(key, "")
        if not isinstance(value, str):
            raise ApiError("입력 내용을 확인해 주세요.")
        value = value.strip()
        if not minimum <= len(value) <= maximum or any(ord(c) < 32 and c not in "\n\t" for c in value):
            labels = {"name": "이름", "message": "메시지", "caption": "사진 설명", "password": "비밀번호"}
            raise ApiError(f"{labels.get(key, key)}은(는) {minimum}~{maximum}자로 입력해 주세요.")
        return value

    def json_body() -> dict:
        if request.content_length and request.content_length > 16 * 1024:
            raise ApiError("입력 내용이 너무 깁니다.", 413)
        if not request.is_json:
            raise ApiError("JSON 형식으로 보내 주세요.", 415)
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            raise ApiError("입력 내용을 확인해 주세요.")
        return data

    def is_admin() -> bool:
        token = app.config["ADMIN_TOKEN"]
        provided = request.headers.get("Authorization", "")
        return bool(token and hmac.compare_digest(provided.encode(), f"Bearer {token}".encode()))

    def photo_bearer_valid() -> bool:
        provided = request.headers.get("Authorization", "")
        return bool(photo_token and hmac.compare_digest(provided.encode(), f"Bearer {photo_token}".encode()))

    def photo_session_id() -> str | None:
        if not photo_token:
            return None
        try:
            value = photo_signer.loads(request.cookies.get(PHOTO_COOKIE, ""), max_age=PHOTO_SESSION_SECONDS)
        except (BadSignature, SignatureExpired):
            return None
        if not isinstance(value, str) or not re.fullmatch(r"[a-f0-9]{64}", value):
            return None
        session_hash = hashlib.sha256(value.encode()).hexdigest()
        row = db().execute("SELECT expires_at FROM photo_admin_sessions WHERE id_hash=?", (session_hash,)).fetchone()
        return session_hash if row and row[0] > time.time() else None

    def require_photo_admin():
        # A supplied but incorrect header must not silently fall back to a cookie.
        if (photo_bearer_valid() if "Authorization" in request.headers else bool(photo_session_id())):
            return
        raise ApiError("사진 관리 키로 로그인해 주세요.", 401)

    def secure_photo_cookie() -> bool:
        return request.is_secure or urlsplit(request.host_url).hostname not in {"localhost", "127.0.0.1", "::1"}

    def private_photo(row) -> dict:
        return {
            **public_photo(row), "originalAvailable": bool(row["original_name"]),
            "originalFilename": row["original_filename"], "originalBytes": row["original_bytes"],
            "storedBytes": row["stored_bytes"],
            "downloadUrl": f"/api/photo-admin/photos/{row['id']}/download",
        }

    def photo_row(entry_id):
        if not ID_PATTERN.fullmatch(entry_id):
            raise ApiError("사진을 찾을 수 없습니다.", 404)
        row = db().execute("SELECT * FROM photos WHERE id=? AND deleted=0", (entry_id,)).fetchone()
        if row is None:
            raise ApiError("사진을 찾을 수 없습니다.", 404)
        return row

    def original_download(row):
        if row["original_name"]:
            if not ORIGINAL_PATTERN.fullmatch(row["original_name"]):
                raise ApiError("보관 파일을 확인할 수 없습니다.", 503)
            path = originals_dir / row["original_name"]
            download_name = row["original_filename"] or row["original_name"]
            legacy = False
        else:
            if not MEDIA_PATTERN.fullmatch(row["stored_name"]):
                raise ApiError("보관 파일을 확인할 수 없습니다.", 503)
            path = media_dir / row["stored_name"]
            download_name = f"legacy-preview-{row['id']}.jpg"
            legacy = True
        if path.is_symlink() or not path.is_file():
            raise ApiError("보관 파일을 찾지 못했어요. NAS 저장소를 확인해 주세요.", 503)
        return path, download_name, legacy

    def require_rsvp_viewer():
        token = app.config["RSVP_VIEW_TOKEN"]
        provided = request.headers.get("Authorization", "")
        if not token or not hmac.compare_digest(provided.encode(), f"Bearer {token}".encode()):
            raise ApiError("참석 명단을 확인할 수 있는 열람 키가 필요합니다.", 401)

    def private_rsvp(row) -> dict:
        return {
            "id": row["id"], "name": row["name"], "side": row["side"],
            "attendance": row["attendance"], "partyCount": row["party_count"],
            "meal": row["meal"], "createdAt": row["created_at"],
        }

    def rate_limit(scope: str, maximum: int, seconds: int = 3600):
        now = int(time.time())
        window = now // seconds
        client = hmac.new(rate_secret, (request.remote_addr or "unknown").encode(), hashlib.sha256).hexdigest()
        conn = db()
        conn.execute("BEGIN IMMEDIATE")
        try:
            conn.execute("DELETE FROM rate_limits WHERE window * CASE WHEN scope='delete' THEN 600 ELSE 3600 END < ?", (now - 7200,))
            row = conn.execute("SELECT count FROM rate_limits WHERE scope=? AND client=? AND window=?", (scope, client, window)).fetchone()
            if row and row[0] >= maximum:
                raise ApiError("잠시 후 다시 시도해 주세요. 요청이 너무 많습니다.", 429, seconds - now % seconds)
            conn.execute(
                "INSERT INTO rate_limits(scope,client,window,count) VALUES (?,?,?,1) "
                "ON CONFLICT(scope,client,window) DO UPDATE SET count=count+1", (scope, client, window)
            )
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    def page_rows(table: str, default_limit: int, visible: str = "1=1"):
        try:
            raw_limit = request.args.get("limit", str(default_limit))
            raw_before = request.args.get("before")
            if not raw_limit.isdigit() or (raw_before is not None and not raw_before.isdigit()):
                raise ValueError
            limit = int(raw_limit)
            before = int(raw_before) if raw_before is not None else 2**63 - 1
            if not 1 <= limit <= 50 or not 1 <= before <= 2**63 - 1:
                raise ValueError
        except (ValueError, OverflowError):
            raise ApiError("목록 요청 값을 확인해 주세요.")
        rows = db().execute(f"SELECT * FROM {table} WHERE {visible} AND seq < ? ORDER BY seq DESC LIMIT ?", (before, limit + 1)).fetchall()
        return rows[:limit], str(rows[limit - 1]["seq"]) if len(rows) > limit else None

    @app.before_request
    def enforce_origin():
        if request.method in {"POST", "DELETE", "PUT", "PATCH", "OPTIONS"}:
            if request.headers.get("Origin") not in origins:
                raise ApiError("허용된 청첩장 페이지에서 다시 시도해 주세요.", 403)
        if request.method == "OPTIONS":
            return "", 204

    @app.after_request
    def response_headers(response):
        origin = request.headers.get("Origin")
        response.vary.add("Origin")
        if origin in origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Max-Age"] = "600"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(ApiError)
    def api_error(error):
        response = jsonify(error=error.message)
        response.status_code = error.status
        if error.retry_after:
            response.headers["Retry-After"] = str(error.retry_after)
        return response

    @app.errorhandler(RequestEntityTooLarge)
    def too_large(_error):
        return jsonify(error="사진 파일이 너무 큽니다. 크기를 줄여 다시 올려 주세요."), 413

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error="요청한 내용을 찾을 수 없거나 요청 형식이 올바르지 않습니다."), error.code

    @app.errorhandler(sqlite3.Error)
    @app.errorhandler(OSError)
    def storage_error(error):
        app.logger.error("Storage operation failed (%s)", type(error).__name__)
        return jsonify(error="저장소에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."), 503

    @app.get("/api/health")
    def health():
        db().execute("SELECT 1").fetchone()
        return jsonify(ok=True, features={
            "rsvp": bool(app.config["RSVP_VIEW_TOKEN"]), "originalPhotos": True, "photoAdmin": bool(photo_token),
        }, limits={
            "maxUploadBytes": app.config["MAX_UPLOAD_BYTES"], "maxFilesPerBatch": 10,
            "maxPhotoCount": app.config["MAX_PHOTO_COUNT"], "maxStorageBytes": app.config["MAX_STORAGE_BYTES"],
            "maxImagePixels": app.config["MAX_IMAGE_PIXELS"], "maxNameLength": 40,
            "maxMessageLength": 500, "maxCaptionLength": 200,
        })

    @app.post("/api/rsvp")
    def add_rsvp():
        # Do not collect responses until the couple has a private retrieval key.
        if not app.config["RSVP_VIEW_TOKEN"]:
            raise ApiError("참석 여부 전달을 준비하고 있어요. 잠시 후 다시 찾아와 주세요.", 503)
        rate_limit("rsvp", app.config["RSVP_RATE_PER_HOUR"])
        data = json_body()
        if set(data) - {"requestId", "name", "side", "attendance", "partyCount", "meal", "consent"}:
            raise ApiError("참석 여부에 필요한 항목만 보내 주세요.")
        entry_id = data.get("requestId")
        if not isinstance(entry_id, str) or not ID_PATTERN.fullmatch(entry_id):
            raise ApiError("전달 요청을 새로 만들어 다시 시도해 주세요.")
        name = text_field(data, "name", 40, 1)
        side, attendance, meal = data.get("side"), data.get("attendance"), data.get("meal", "undecided")
        count = data.get("partyCount")
        if side not in ("groom", "bride") or attendance not in ("yes", "no", "undecided"):
            raise ApiError("신랑·신부측과 참석 여부를 선택해 주세요.")
        if not isinstance(count, int) or isinstance(count, bool):
            raise ApiError("참석 인원을 확인해 주세요.")
        if attendance == "yes":
            if not 1 <= count <= 10 or meal not in ("yes", "no", "undecided"):
                raise ApiError("참석 인원은 본인을 포함해 1~10명으로, 식사 여부는 선택 항목에서 골라 주세요.")
        elif count != 0 or meal != "undecided":
            raise ApiError("불참 또는 미정인 경우 참석 인원과 식사 항목을 비워 주세요.")
        if data.get("consent") is not True:
            raise ApiError("이름과 참석 정보를 두 사람에게 전달하는 데 동의해 주세요.")
        request_hash = hashlib.sha256(json.dumps({
            "name": name, "side": side, "attendance": attendance, "partyCount": count, "meal": meal,
        }, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        conn = db()
        created, repeated = timestamp(), False
        conn.execute("BEGIN IMMEDIATE")
        try:
            previous = conn.execute("SELECT request_hash,created_at FROM rsvps WHERE id=?", (entry_id,)).fetchone()
            if previous:
                if not hmac.compare_digest(previous["request_hash"], request_hash):
                    raise ApiError("이미 전달된 요청과 내용이 달라요. 새 요청으로 다시 알려 주세요.", 409)
                created, repeated = previous["created_at"], True
            else:
                if conn.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0] >= app.config["MAX_RSVP_COUNT"]:
                    raise ApiError("참석 명단이 가득 찼어요. 두 사람에게 직접 알려 주세요.", 507)
                conn.execute(
                    "INSERT INTO rsvps(id,request_hash,name,side,attendance,party_count,meal,created_at) VALUES (?,?,?,?,?,?,?,?)",
                    (entry_id, request_hash, name, side, attendance, count, meal, created),
                )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        return jsonify(ok=True, id=entry_id, createdAt=created), 200 if repeated else 201

    @app.get("/api/rsvp")
    def list_rsvps():
        require_rsvp_viewer()
        rows, cursor = page_rows("rsvps", 50)
        totals = db().execute(
            "SELECT COUNT(*) AS responses, COALESCE(SUM(party_count),0) AS guests, "
            "COALESCE(SUM(CASE WHEN attendance='yes' AND meal='yes' THEN party_count ELSE 0 END),0) AS meals, "
            "COALESCE(SUM(CASE WHEN attendance='undecided' THEN 1 ELSE 0 END),0) AS undecided FROM rsvps"
        ).fetchone()
        return jsonify(items=[private_rsvp(row) for row in rows], nextCursor=cursor, summary=dict(totals))

    @app.get("/api/rsvp/export")
    def export_rsvps():
        require_rsvp_viewer()
        stream = io.StringIO(newline="")
        writer = csv.writer(stream)
        writer.writerow(["접수일", "이름", "구분", "참석 여부", "참석 인원(본인 포함)", "일행 식사 여부"])
        labels = {"groom": "신랑측", "bride": "신부측", "yes": "예", "no": "아니요", "undecided": "미정"}
        for row in db().execute("SELECT * FROM rsvps ORDER BY seq DESC"):
            # Quote alone does not prevent spreadsheet formulas; prefix suspicious cells.
            name = row["name"]
            if name.lstrip().startswith(("=", "+", "-", "@")) or any(c in name for c in "\t\r\n"):
                name = "'" + name
            writer.writerow([row["created_at"], name, labels[row["side"]], labels[row["attendance"]], row["party_count"], labels[row["meal"]]])
        return send_file(io.BytesIO(stream.getvalue().encode("utf-8-sig")), mimetype="text/csv; charset=utf-8", as_attachment=True, download_name="wedding-rsvp.csv")

    @app.get("/api/rsvp-admin")
    def rsvp_admin():
        html = (Path(__file__).parent / "rsvp-admin.html").read_text(encoding="utf-8")
        # The page holds the view key only in this tab's memory and makes same-origin requests.
        sources = {}
        for tag in ("script", "style"):
            sources[tag] = " ".join("'sha256-" + base64.b64encode(hashlib.sha256(value.encode()).digest()).decode() + "'" for value in re.findall(f"<{tag}>(.*?)</{tag}>", html, re.S))
        response = app.make_response(html)
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; "
            f"script-src {sources['script']}; style-src {sources['style']}"
        )
        response.headers["X-Frame-Options"] = "DENY"
        return response

    @app.get("/api/guestbook")
    def list_guestbook():
        rows, cursor = page_rows("guestbook", 6)
        return jsonify(items=[public_guest(row) for row in rows], nextCursor=cursor)

    @app.post("/api/guestbook")
    def add_guestbook():
        rate_limit("guestbook", app.config["GUESTBOOK_RATE_PER_HOUR"])
        data = json_body()
        name = text_field(data, "name", 40, 1)
        message = text_field(data, "message", 500, 1)
        password = text_field(data, "password", 64, 4)
        password_hash = generate_password_hash(password, method="scrypt")
        entry_id, created = uuid.uuid4().hex, timestamp()
        conn = db()
        conn.execute("BEGIN IMMEDIATE")
        try:
            if conn.execute("SELECT COUNT(*) FROM guestbook").fetchone()[0] >= app.config["MAX_GUESTBOOK_COUNT"]:
                raise ApiError("방명록이 가득 찼습니다. 신랑 신부에게 알려 주세요.", 507)
            conn.execute("INSERT INTO guestbook(id,name,message,password_hash,created_at) VALUES (?,?,?,?,?)", (entry_id, name, message, password_hash, created))
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        return jsonify(item={"id": entry_id, "name": name, "message": message, "createdAt": created}), 201

    @app.delete("/api/guestbook/<entry_id>")
    def delete_guestbook(entry_id):
        if not ID_PATTERN.fullmatch(entry_id):
            raise ApiError("방명록을 찾을 수 없습니다.", 404)
        rate_limit("delete", app.config["DELETE_RATE_PER_TEN_MINUTES"], 600)
        row = db().execute("SELECT * FROM guestbook WHERE id=?", (entry_id,)).fetchone()
        if row is None:
            raise ApiError("방명록을 찾을 수 없습니다.", 404)
        if not is_admin():
            password = text_field(json_body(), "password", 64, 4)
            if not check_password_hash(row["password_hash"], password):
                raise ApiError("삭제 비밀번호가 일치하지 않습니다.", 403)
        db().execute("DELETE FROM guestbook WHERE id=?", (entry_id,))
        return "", 204

    def normalized_images(raw: bytes):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(raw), formats=list(IMAGE_FORMATS)) as probe:
                    if probe.format not in IMAGE_FORMATS:
                        raise ApiError("JPEG, PNG, WebP 사진만 올릴 수 있습니다.", 415)
                    original_format = probe.format
                    if probe.width * probe.height > app.config["MAX_IMAGE_PIXELS"]:
                        raise ApiError("사진 해상도가 너무 큽니다. 크기를 줄여 주세요.", 413)
                    if getattr(probe, "n_frames", 1) != 1:
                        raise ApiError("움직이는 사진은 지원하지 않습니다. 정지 사진을 올려 주세요.", 415)
                    probe.verify()
                with Image.open(io.BytesIO(raw), formats=list(IMAGE_FORMATS)) as original:
                    original.load()
                    oriented = ImageOps.exif_transpose(original)
                    oriented.thumbnail((2560, 2560), Image.Resampling.LANCZOS)
                    # A new RGB image discards EXIF, GPS, XMP, comments and embedded profiles.
                    photo = Image.new("RGB", oriented.size, "white")
                    if oriented.mode in {"RGBA", "LA"} or "transparency" in oriented.info:
                        rgba = oriented.convert("RGBA")
                        photo.paste(rgba, mask=rgba.getchannel("A"))
                    else:
                        photo.paste(oriented.convert("RGB"))
            full = io.BytesIO()
            photo.save(full, "JPEG", quality=88, optimize=True)
            width, height = photo.size
            photo.thumbnail((600, 600), Image.Resampling.LANCZOS)
            thumbnail = io.BytesIO()
            photo.save(thumbnail, "JPEG", quality=82, optimize=True)
            return full.getvalue(), thumbnail.getvalue(), width, height, original_format
        except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as error:
            raise ApiError("사진을 읽을 수 없습니다. 정상적인 JPEG, PNG, WebP 파일을 선택해 주세요.", 415) from error
        except (Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
            raise ApiError("사진 해상도가 너무 큽니다. 크기를 줄여 주세요.", 413) from error

    @app.get("/api/photos")
    def list_photos():
        rows, cursor = page_rows("photos", 12, "deleted=0")
        return jsonify(items=[public_photo(row) for row in rows], nextCursor=cursor)

    @app.post("/api/photos")
    def add_photo():
        rate_limit("photo", app.config["PHOTO_RATE_PER_HOUR"])
        if request.mimetype != "multipart/form-data":
            raise ApiError("사진 파일을 선택해 주세요.", 415)
        files = request.files.getlist("file")
        if len(files) != 1 or sum(len(request.files.getlist(key)) for key in request.files) != 1:
            raise ApiError("사진은 한 번에 한 장씩 전송해 주세요.")
        if request.form.get("consent") != "true":
            raise ApiError("사진이 방문자에게 공개되는 데 동의해 주세요.")
        if request.form.get("originalConsent") != "true":
            raise ApiError("원본 보관 안내가 바뀌었어요. 청첩장을 새로고침한 뒤 원본 보관에 동의해 주세요.")
        name = text_field(request.form, "name", 40, 1)
        caption = text_field(request.form, "caption", 200)
        raw = files[0].stream.read(app.config["MAX_UPLOAD_BYTES"] + 1)
        if not raw or len(raw) > app.config["MAX_UPLOAD_BYTES"]:
            raise ApiError("사진 파일이 비어 있거나 허용 크기를 초과했습니다.", 413)
        if not image_slot.acquire(blocking=False):
            raise ApiError("다른 사진을 처리하고 있어요. 잠시 후 다시 올려 주세요.", 429, 3)
        try:
            full, thumb, width, height, original_format = normalized_images(raw)
        finally:
            image_slot.release()
        entry_id, created = uuid.uuid4().hex, timestamp()
        full_name, thumb_name = f"{entry_id}.jpg", f"{entry_id}-thumb.jpg"
        extension = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}[original_format]
        original_name = f"{entry_id}.{extension}"
        # Retain a human filename without accepting paths, control characters or Windows-reserved names.
        filename = (files[0].filename or "photo").replace("\\", "/").split("/")[-1]
        filename = "".join(c for c in filename if ord(c) >= 32 and ord(c) != 127 and c not in '<>:"|?*').strip(" .")[:160]
        filename = filename or "photo"
        if filename.split(".")[0].upper() in {"CON", "PRN", "AUX", "NUL", *(f"{prefix}{i}" for prefix in ("COM", "LPT") for i in range(1, 10))}:
            filename = "photo-" + filename
        if not filename.lower().endswith((".jpg", ".jpeg") if original_format == "JPEG" else ("." + extension,)):
            filename += "." + extension
        total_bytes = len(raw) + len(full) + len(thumb)
        conn = db()
        written = []
        conn.execute("BEGIN IMMEDIATE")
        try:
            quota = conn.execute("SELECT COUNT(*),COALESCE(SUM(stored_bytes),0) FROM photos").fetchone()
            if quota[0] >= app.config["MAX_PHOTO_COUNT"] or quota[1] + total_bytes > app.config["MAX_STORAGE_BYTES"]:
                raise ApiError("사진 보관함이 가득 찼습니다. 신랑 신부에게 알려 주세요.", 507)
            if shutil.disk_usage(data_dir).free < total_bytes + app.config["MIN_FREE_DISK_BYTES"]:
                raise ApiError("저장 공간이 부족합니다. 신랑 신부에게 알려 주세요.", 507)
            for path, content in ((media_dir / full_name, full), (media_dir / thumb_name, thumb), (originals_dir / original_name, raw)):
                with path.open("xb") as file:
                    written.append(path)
                    file.write(content)
                    file.flush()
                    os.fsync(file.fileno())
            conn.execute(
                "INSERT INTO photos(id,name,caption,stored_name,thumbnail_name,width,height,stored_bytes,created_at,"
                "original_name,original_filename,original_bytes,original_sha256) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (entry_id, name, caption, full_name, thumb_name, width, height, total_bytes, created,
                 original_name, filename, len(raw), hashlib.sha256(raw).hexdigest()),
            )
            conn.commit()
        except Exception:
            conn.rollback()
            for path in written:
                path.unlink(missing_ok=True)
            raise
        row = conn.execute("SELECT * FROM photos WHERE id=?", (entry_id,)).fetchone()
        return jsonify(item=public_photo(row)), 201

    @app.get("/media/<filename>")
    def media(filename):
        if not MEDIA_PATTERN.fullmatch(filename):
            raise ApiError("사진을 찾을 수 없습니다.", 404)
        row = db().execute("SELECT id FROM photos WHERE deleted=0 AND (stored_name=? OR thumbnail_name=?)", (filename, filename)).fetchone()
        path = media_dir / filename
        if row is None or path.is_symlink() or not path.is_file():
            raise ApiError("사진을 찾을 수 없습니다.", 404)
        return send_file(path, mimetype="image/jpeg", conditional=True, max_age=3600)

    def remove_photo(entry_id):
        if not ID_PATTERN.fullmatch(entry_id):
            raise ApiError("사진을 찾을 수 없습니다.", 404)
        conn = db()
        conn.execute("BEGIN IMMEDIATE")
        try:
            row = conn.execute("SELECT * FROM photos WHERE id=?", (entry_id,)).fetchone()
            if row is None:
                raise ApiError("사진을 찾을 수 없습니다.", 404)
            conn.execute("UPDATE photos SET deleted=1 WHERE id=?", (entry_id,))
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        # Keep the hidden record and its quota until originals and previews are removed successfully.
        remove_media(row)
        conn.execute("DELETE FROM photos WHERE id=?", (entry_id,))

    @app.delete("/api/photos/<entry_id>")
    def delete_photo(entry_id):
        rate_limit("delete", app.config["DELETE_RATE_PER_TEN_MINUTES"], 600)
        if not is_admin():
            raise ApiError("사진 삭제는 관리자만 할 수 있습니다.", 403)
        remove_photo(entry_id)
        return "", 204

    @app.get("/api/photo-admin")
    def photo_admin_page():
        html = (Path(__file__).parent / "photo-admin.html").read_text(encoding="utf-8")
        sources = {}
        for tag in ("script", "style"):
            sources[tag] = " ".join("'sha256-" + base64.b64encode(hashlib.sha256(value.encode()).digest()).decode() + "'" for value in re.findall(f"<{tag}>(.*?)</{tag}>", html, re.S))
        response = app.make_response(html)
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; connect-src 'self'; img-src 'self'; base-uri 'none'; "
            "form-action 'none'; frame-ancestors 'none'; "
            f"script-src {sources['script']}; style-src {sources['style']}"
        )
        response.headers["X-Frame-Options"] = "DENY"
        return response

    @app.post("/api/photo-admin/session")
    def photo_admin_login():
        rate_limit("photo_admin_login", 30)
        if not photo_bearer_valid():
            raise ApiError("사진 관리 키를 확인해 주세요.", 401)
        nonce = secrets.token_hex(32)
        conn = db()
        conn.execute("DELETE FROM photo_admin_sessions WHERE expires_at <= ?", (int(time.time()),))
        previous = photo_session_id()
        if previous:
            conn.execute("DELETE FROM photo_admin_sessions WHERE id_hash=?", (previous,))
        conn.execute("INSERT INTO photo_admin_sessions(id_hash,expires_at) VALUES (?,?)", (
            hashlib.sha256(nonce.encode()).hexdigest(), int(time.time()) + PHOTO_SESSION_SECONDS,
        ))
        response = jsonify(ok=True)
        response.set_cookie(PHOTO_COOKIE, photo_signer.dumps(nonce), max_age=PHOTO_SESSION_SECONDS,
                            httponly=True, secure=secure_photo_cookie(), samesite="Strict", path="/api/photo-admin")
        return response

    @app.delete("/api/photo-admin/session")
    def photo_admin_logout():
        session_hash = photo_session_id()
        if session_hash:
            db().execute("DELETE FROM photo_admin_sessions WHERE id_hash=?", (session_hash,))
        response = jsonify(ok=True)
        response.delete_cookie(PHOTO_COOKIE, path="/api/photo-admin", secure=secure_photo_cookie(), httponly=True, samesite="Strict")
        return response

    @app.get("/api/photo-admin/photos")
    def photo_admin_list():
        require_photo_admin()
        rows, cursor = page_rows("photos", 24, "deleted=0")
        totals = db().execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(stored_bytes),0) AS totalBytes, "
            "COALESCE(SUM(original_name IS NOT NULL),0) AS originalCount, "
            "COALESCE(SUM(original_name IS NULL),0) AS legacyCount FROM photos WHERE deleted=0"
        ).fetchone()
        return jsonify(items=[private_photo(row) for row in rows], nextCursor=cursor, **dict(totals))

    @app.get("/api/photo-admin/photos/<entry_id>/download")
    def photo_admin_download(entry_id):
        require_photo_admin()
        path, filename, _legacy = original_download(photo_row(entry_id))
        return send_file(path, mimetype="application/octet-stream", as_attachment=True, download_name=filename,
                         conditional=True, etag=False, max_age=0)

    @app.delete("/api/photo-admin/photos/<entry_id>")
    def photo_admin_delete(entry_id):
        require_photo_admin()
        rate_limit("photo_admin_delete", 600)
        remove_photo(entry_id)
        return jsonify(ok=True)

    @app.get("/api/photo-admin/download")
    def photo_admin_download_all():
        require_photo_admin()
        rows = db().execute("SELECT * FROM photos WHERE deleted=0 ORDER BY seq").fetchall()
        if not rows:
            raise ApiError("아직 내려받을 사진이 없어요.", 404)
        if not archive_slot.acquire(blocking=False):
            raise ApiError("전체 사진을 내려받고 있어요. 다운로드가 끝난 뒤 다시 시도해 주세요.", 429, 10)
        released = False
        release_lock = threading.Lock()

        def release_slot():
            nonlocal released
            with release_lock:
                if not released:
                    released = True
                    archive_slot.release()

        def archive():
            sink = StreamingZipSink()
            manifest = []
            try:
                with zipfile.ZipFile(sink, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as bundle:
                    bundle.writestr("README.txt", (
                        "하객 사진 보관함\n\noriginals/ : 업로드한 원본 파일입니다. 메타데이터가 포함될 수 있습니다.\n"
                        "legacy-previews/ : 원본 보관 기능 추가 전에 올라온 사진입니다. 축소 JPG만 남아 있습니다.\n"
                        "manifest.json : 사진 설명, 원래 파일명, 보관 상태를 담은 목록입니다.\n"
                        "다운로드 중 새로 올라온 사진은 다음 다운로드에 포함됩니다.\n"
                        "다운로드 도중 삭제되거나 없어진 파일은 목록에 missing으로 표시됩니다.\n"
                    ).encode("utf-8-sig"))
                    yield from sink.drain()
                    for row in rows:
                        record = {
                            "id": row["id"], "name": row["name"], "caption": row["caption"],
                            "createdAt": row["created_at"], "originalFilename": row["original_filename"],
                            "originalSha256": row["original_sha256"], "originalBytes": row["original_bytes"],
                            "kind": "original" if row["original_name"] else "legacy-preview",
                        }
                        # Open before writing the member header: a concurrent deletion can then be
                        # reported without leaving a misleading empty image in the archive.
                        try:
                            path, filename, legacy = original_download(row)
                            source = path.open("rb")
                        except (ApiError, FileNotFoundError):
                            record["status"] = "missing"
                            manifest.append(record)
                            continue
                        member = ("legacy-previews/" if legacy else "originals/") + row["id"] + "-" + filename
                        with source, bundle.open(member, "w", force_zip64=True) as destination:
                            yield from sink.drain()
                            while chunk := source.read(64 * 1024):
                                destination.write(chunk)
                                yield from sink.drain()
                        yield from sink.drain()
                        record.update(status="included", archivePath=member)
                        manifest.append(record)
                    bundle.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"))
                    yield from sink.drain()
                yield from sink.drain()
            finally:
                release_slot()

        response = Response(archive(), mimetype="application/zip")
        response.headers["Content-Disposition"] = 'attachment; filename="wedding-guest-photos.zip"'
        response.call_on_close(release_slot)
        return response

    return app
