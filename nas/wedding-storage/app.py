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
from contextlib import closing

from flask import Flask, g, jsonify, request, send_file
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash


ID_PATTERN = re.compile(r"^[a-f0-9]{32}$")
MEDIA_PATTERN = re.compile(r"^[a-f0-9]{32}(?:-thumb)?\.jpg$")
IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


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
    app.config["MAX_CONTENT_LENGTH"] = app.config["MAX_UPLOAD_BYTES"] + 64 * 1024
    proxy_hops = app.config["TRUST_PROXY_HOPS"]
    if proxy_hops:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=proxy_hops, x_proto=proxy_hops, x_host=0, x_port=0, x_prefix=0)

    data_dir = Path(app.config["DATA_DIR"]).resolve()
    media_dir = data_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    db_path = data_dir / "wedding.sqlite3"
    existing_media = any(MEDIA_PATTERN.fullmatch(path.name) for path in media_dir.iterdir())
    missing_database_message = (
        "Guest photo files exist without an initialized matching database. "
        "Restore the matching database backup or use a new empty data folder."
    )
    # Never interpret retained guest photos as abandoned uploads after database loss.
    if existing_media and not db_path.exists():
        raise RuntimeError(missing_database_message)
    app.config["DATABASE"] = str(db_path)
    app.config["MEDIA_DIR"] = str(media_dir)

    def remove_media(row):
        for filename in (row["stored_name"], row["thumbnail_name"]):
            if not MEDIA_PATTERN.fullmatch(filename):
                raise RuntimeError("Invalid stored media filename")
            path = media_dir / filename
            if path.is_symlink():
                raise RuntimeError("Media symlinks are not supported")
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
        if version not in (0, 1):
            raise RuntimeError("Unsupported database schema version; restore the matching application version")
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript((Path(__file__).parent / "schema.sql").read_text(encoding="utf-8"))
        conn.execute("INSERT OR IGNORE INTO settings (key,value) VALUES ('rate_secret',?)", (secrets.token_hex(32),))
        rate_secret = conn.execute("SELECT value FROM settings WHERE key='rate_secret'").fetchone()[0].encode()
        # Uploads create files inside the same write lock. Recovery cannot race another writer.
        conn.execute("BEGIN IMMEDIATE")
        try:
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
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    image_slot = threading.BoundedSemaphore(1)

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
        return jsonify(ok=True, features={"rsvp": bool(app.config["RSVP_VIEW_TOKEN"])}, limits={
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
            return full.getvalue(), thumbnail.getvalue(), width, height
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
        name = text_field(request.form, "name", 40, 1)
        caption = text_field(request.form, "caption", 200)
        raw = files[0].stream.read(app.config["MAX_UPLOAD_BYTES"] + 1)
        if not raw or len(raw) > app.config["MAX_UPLOAD_BYTES"]:
            raise ApiError("사진 파일이 비어 있거나 허용 크기를 초과했습니다.", 413)
        if not image_slot.acquire(blocking=False):
            raise ApiError("다른 사진을 처리하고 있어요. 잠시 후 다시 올려 주세요.", 429, 3)
        try:
            full, thumb, width, height = normalized_images(raw)
        finally:
            image_slot.release()
        entry_id, created = uuid.uuid4().hex, timestamp()
        full_name, thumb_name = f"{entry_id}.jpg", f"{entry_id}-thumb.jpg"
        total_bytes = len(full) + len(thumb)
        conn = db()
        written = []
        conn.execute("BEGIN IMMEDIATE")
        try:
            quota = conn.execute("SELECT COUNT(*),COALESCE(SUM(stored_bytes),0) FROM photos").fetchone()
            if quota[0] >= app.config["MAX_PHOTO_COUNT"] or quota[1] + total_bytes > app.config["MAX_STORAGE_BYTES"]:
                raise ApiError("사진 보관함이 가득 찼습니다. 신랑 신부에게 알려 주세요.", 507)
            if shutil.disk_usage(data_dir).free < total_bytes + app.config["MIN_FREE_DISK_BYTES"]:
                raise ApiError("저장 공간이 부족합니다. 신랑 신부에게 알려 주세요.", 507)
            for filename, content in ((full_name, full), (thumb_name, thumb)):
                path = media_dir / filename
                with path.open("xb") as file:
                    written.append(path)
                    file.write(content)
                    file.flush()
                    os.fsync(file.fileno())
            conn.execute(
                "INSERT INTO photos(id,name,caption,stored_name,thumbnail_name,width,height,stored_bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                (entry_id, name, caption, full_name, thumb_name, width, height, total_bytes, created),
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

    @app.delete("/api/photos/<entry_id>")
    def delete_photo(entry_id):
        rate_limit("delete", app.config["DELETE_RATE_PER_TEN_MINUTES"], 600)
        if not is_admin():
            raise ApiError("사진 삭제는 관리자만 할 수 있습니다.", 403)
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
        # Keep the hidden record and its quota until both files are removed successfully.
        remove_media(row)
        conn.execute("DELETE FROM photos WHERE id=?", (entry_id,))
        return "", 204

    return app
