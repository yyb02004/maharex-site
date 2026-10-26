CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guestbook (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS photos (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    caption TEXT NOT NULL,
    stored_name TEXT NOT NULL UNIQUE,
    thumbnail_name TEXT NOT NULL UNIQUE,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    stored_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS rate_limits (
    scope TEXT NOT NULL,
    client TEXT NOT NULL,
    window INTEGER NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (scope, client, window)
);
CREATE TABLE IF NOT EXISTS rsvps (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    request_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    side TEXT NOT NULL CHECK(side IN ('groom', 'bride')),
    attendance TEXT NOT NULL CHECK(attendance IN ('yes', 'no', 'undecided')),
    party_count INTEGER NOT NULL CHECK(party_count BETWEEN 0 AND 10),
    meal TEXT NOT NULL CHECK(meal IN ('yes', 'no', 'undecided')),
    created_at TEXT NOT NULL
);
PRAGMA user_version = 1;
