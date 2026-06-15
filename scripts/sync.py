#!/usr/bin/env python3
"""
sync.py — 服务器端 WeRead 增量数据同步脚本

通过 WeRead Agent API Gateway 拉取书架、笔记本、划线和想法数据，
增量更新到 SQLite 数据库。设计为每 4 小时由 cron 触发运行。

用法:
  python scripts/sync.py           # 完整同步（首次运行）
  python scripts/sync.py --quick    # 增量同步（仅笔记数变化的书）
  python scripts/sync.py --restart  # 同步完成后重启 PM2

环境变量:
  WEREAD_API_KEY  微信读书 API Key（必需）
  PM2_APP_NAME    PM2 应用名（默认 reading-room，用于 --restart）
"""

import json
import os
import sqlite3
import subprocess
import sys
import time
import re
import requests
from datetime import datetime
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
DB_PATH = ROOT_DIR / "db" / "reading-room.db"
LOG_DIR = ROOT_DIR / "logs"

API_KEY = os.environ.get("WEREAD_API_KEY", "")
if not API_KEY:
    print("ERROR: Set WEREAD_API_KEY environment variable")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    sys.exit(1)

GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"
DELAY = 1.0  # seconds between API calls
BATCH_DELAY = 0.5  # seconds between books for highlight/review fetch

PM2_APP_NAME = os.environ.get("PM2_APP_NAME", "reading-room")


# ─── API Client ──────────────────────────────────────────────────────────────

session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
})


def call_api(api_name: str, params: dict = None) -> dict:
    """Call WeRead Agent API Gateway."""
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    if params:
        body.update(params)
    resp = session.post(GATEWAY, json=body, timeout=60)
    resp.raise_for_status()
    result = resp.json()
    if result.get("errcode", 0) != 0:
        raise RuntimeError(
            f"API error {result.get('errcode')}: {result.get('errmsg', '')}"
        )
    return result


# ─── Cover URL upgrade ────────────────────────────────────────────────────────

def upgrade_cover_url(url: str) -> str:
    """Replace WeRead t<N>_ or s_ thumbnail with t7_ (~400px) for sharp rendering."""
    if not url:
        return url
    return re.sub(r"/[st]\d*_", "/t7_", url)


# ─── Logging ─────────────────────────────────────────────────────────────────

def log(msg: str):
    """Timestamped log to stdout."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


# ─── Database ────────────────────────────────────────────────────────────────

def get_conn():
    """Get a writable SQLite connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=10000")
    return conn


def ensure_tables(conn):
    """Ensure all required tables exist."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT DEFAULT '',
            cover TEXT DEFAULT '',
            category TEXT DEFAULT '',
            finished INTEGER NOT NULL DEFAULT 0,
            update_time INTEGER DEFAULT 0,
            read_time INTEGER DEFAULT 0,
            progress INTEGER DEFAULT 0,
            last_read_time INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS highlights (
            bookmark_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            chapter_uid TEXT DEFAULT '',
            chapter_title TEXT DEFAULT '',
            mark_text TEXT DEFAULT '',
            color_style TEXT DEFAULT '0',
            type INTEGER DEFAULT 1,
            create_time INTEGER NOT NULL,
            range_text TEXT DEFAULT ''
        );
        CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);

        CREATE TABLE IF NOT EXISTS reviews (
            review_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            content TEXT DEFAULT '',
            chapter_name TEXT DEFAULT '',
            star INTEGER DEFAULT -1,
            create_time INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id);

        CREATE TABLE IF NOT EXISTS notebooks (
            book_id TEXT PRIMARY KEY,
            review_count INTEGER DEFAULT 0,
            note_count INTEGER DEFAULT 0,
            bookmark_count INTEGER DEFAULT 0,
            total_notes INTEGER DEFAULT 0,
            sort INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            status TEXT DEFAULT 'running',
            books_updated INTEGER DEFAULT 0,
            highlights_updated INTEGER DEFAULT 0,
            reviews_updated INTEGER DEFAULT 0,
            errors TEXT
        );
    """)
    # ── Schema migration: add missing columns to existing sync_log table ──
    # Older sync_log tables may be missing columns added in later versions.
    # Check PRAGMA table_info and ALTER TABLE ADD COLUMN for any gaps.
    expected = {
        "id":                None,
        "started_at":        None,
        "finished_at":       None,
        "status":            None,
        "books_updated":     "INTEGER DEFAULT 0",
        "highlights_updated":"INTEGER DEFAULT 0",
        "reviews_updated":   "INTEGER DEFAULT 0",
        "errors":            "TEXT",
    }
    existing_cols = {r[1] for r in conn.execute("PRAGMA table_info(sync_log)")}
    for col, col_type in expected.items():
        if col_type is not None and col not in existing_cols:
            try:
                conn.execute(f"ALTER TABLE sync_log ADD COLUMN {col} {col_type}")
                log(f"  [migration] Added missing column sync_log.{col}")
            except sqlite3.OperationalError:
                pass
    conn.commit()

    # ── Schema migration: add missing columns to existing books table ──
    book_migrations = {
        "read_time":      "INTEGER DEFAULT 0",
        "progress":       "INTEGER DEFAULT 0",
        "last_read_time": "INTEGER DEFAULT 0",
    }
    existing_book_cols = {r[1] for r in conn.execute("PRAGMA table_info(books)")}
    for col, col_type in book_migrations.items():
        if col not in existing_book_cols:
            try:
                conn.execute(f"ALTER TABLE books ADD COLUMN {col} {col_type}")
                log(f"  [migration] Added missing column books.{col}")
            except sqlite3.OperationalError:
                pass
    conn.commit()


def get_existing_notebook_counts(conn) -> dict:
    """Get current notebook stats from DB for change detection."""
    rows = conn.execute(
        "SELECT book_id, review_count, note_count, bookmark_count FROM notebooks"
    ).fetchall()
    return {r["book_id"]: dict(r) for r in rows}


# ─── Phase 1: Bookshelf Sync ─────────────────────────────────────────────────

def sync_shelf(conn) -> int:
    """Fetch /shelf/sync and upsert books."""
    log("[Phase 1] Syncing bookshelf...")
    result = call_api("/shelf/sync")
    books = result.get("books", [])
    count = 0

    for b in books:
        book_id = b.get("bookId", "")
        if not book_id:
            continue
        conn.execute(
            """INSERT INTO books (id, title, author, cover, category, finished, update_time)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
               title=excluded.title, author=excluded.author, cover=excluded.cover,
               category=excluded.category, finished=excluded.finished,
               update_time=excluded.update_time""",
            (
                book_id,
                b.get("title", "") or "",
                b.get("author", "") or "",
                upgrade_cover_url(b.get("cover", "") or ""),
                b.get("category", "") or "",
                1 if b.get("finishReading") else 0,
                int(b.get("updateTime", 0)),
            ),
        )
        count += 1

    conn.commit()
    log(f"  [+] {count} books upserted from shelf ({len(books)} total)")
    return count


# ─── Phase 2: Notebooks Sync ─────────────────────────────────────────────────

def sync_notebooks(conn) -> dict:
    """Fetch /user/notebooks (paginated) and upsert notebook stats.
    Returns dict of {book_id: {review_count, note_count, bookmark_count, sort}}.
    """
    log("[Phase 2] Syncing notebooks...")
    all_books = []
    last_sort = None

    while True:
        params = {"count": 100}
        if last_sort is not None:
            params["lastSort"] = last_sort
        result = call_api("/user/notebooks", params)
        batch = result.get("books", [])
        all_books.extend(batch)

        if result.get("hasMore") != 1 or not batch:
            break
        last_sort = batch[-1].get("sort", 0)
        time.sleep(DELAY)

    new_counts = {}
    count = 0
    for nb in all_books:
        book_id = nb.get("bookId", "")
        if not book_id:
            continue
        rc = int(nb.get("reviewCount", 0))
        nc = int(nb.get("noteCount", 0))
        bc = int(nb.get("bookmarkCount", 0))
        sort_val = int(nb.get("sort", 0))

        conn.execute(
            """INSERT INTO notebooks (book_id, review_count, note_count,
               bookmark_count, total_notes, sort)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(book_id) DO UPDATE SET
               review_count=excluded.review_count,
               note_count=excluded.note_count,
               bookmark_count=excluded.bookmark_count,
               total_notes=excluded.total_notes,
               sort=excluded.sort""",
            (book_id, rc, nc, bc, rc + nc + bc, sort_val),
        )
        new_counts[book_id] = {"review_count": rc, "note_count": nc, "bookmark_count": bc}
        count += 1

    conn.commit()
    log(f"  [+] {count} notebook records upserted")
    return new_counts


# ─── Phase 3: Highlights & Reviews Sync ──────────────────────────────────────

def fetch_highlights(book_id: str) -> list:
    """Fetch highlights for a single book."""
    try:
        result = call_api("/book/bookmarklist", {"bookId": book_id})
        highlights = result.get("updated", [])
        chapters = result.get("chapters", [])
        chap_map = {c["chapterUid"]: c["title"] for c in chapters}
        data = []
        for h in highlights:
            uid = h.get("chapterUid")
            data.append({
                "bookmark_id": h.get("bookmarkId", ""),
                "chapter_uid": str(uid or ""),
                "chapter_title": chap_map.get(uid, "") if uid else "",
                "mark_text": h.get("markText", "") or "",
                "color_style": str(h.get("colorStyle", "0") or "0"),
                "type": int(h.get("type", 1)),
                "create_time": int(h.get("createTime", 0)),
                "range_text": h.get("range", "") or "",
            })
        return data
    except Exception as e:
        log(f"    [!] Highlights fetch failed: {e}")
        return None


def fetch_reviews(book_id: str) -> list:
    """Fetch all reviews for a single book (paginated)."""
    all_reviews = []
    synckey = 0
    try:
        while True:
            result = call_api("/review/list/mine", {
                "bookid": book_id, "synckey": synckey, "count": 20
            })
            reviews = result.get("reviews", [])
            if not reviews:
                break
            for r in reviews:
                rv = r.get("review", {})
                all_reviews.append({
                    "review_id": rv.get("reviewId", ""),
                    "content": rv.get("content", ""),
                    "chapter_name": rv.get("chapterName", ""),
                    "star": int(rv.get("star", -1)),
                    "create_time": int(rv.get("createTime", 0)),
                })
            if result.get("hasMore") != 1:
                break
            synckey = result.get("synckey", 0)
            if synckey == 0:
                break
            time.sleep(DELAY)
        return all_reviews
    except Exception as e:
        log(f"    [!] Reviews fetch failed: {e}")
        return None


# ─── Phase 3.5: Book Progress Sync ────────────────────────────────────────────

def fetch_book_progress(book_id: str) -> dict:
    """Fetch per-book reading progress from /book/getprogress.
    Returns dict with read_time, progress, last_read_time, or None on error.
    """
    try:
        result = call_api("/book/getprogress", {"bookId": book_id})
        book = result.get("book", {})
        return {
            "read_time": int(book.get("recordReadingTime", 0)),
            "progress": int(book.get("progress", 0)),
            "last_read_time": int(book.get("updateTime", 0)),
        }
    except Exception as e:
        log(f"    [!] Progress fetch failed: {e}")
        return None


def save_book_progress(conn, book_id: str, progress: dict) -> bool:
    """Save book progress to the books table. Returns True on success."""
    if not progress:
        return False
    conn.execute(
        """UPDATE books SET read_time=?, progress=?, last_read_time=?
           WHERE id=?""",
        (progress["read_time"], progress["progress"],
         progress["last_read_time"], book_id),
    )
    return True


def sync_book_notes(conn, book_id: str, book_title: str) -> tuple:
    """Sync highlights, reviews, and progress for one book.
    Returns (h_count, r_count, progress_sec)."""
    h_count = 0
    r_count = 0
    p_sec = 0

    # Highlights
    highlights = fetch_highlights(book_id)
    if highlights is not None:
        conn.execute("DELETE FROM highlights WHERE book_id = ?", (book_id,))
        for h in highlights:
            if h["bookmark_id"] and h["mark_text"]:
                conn.execute(
                    """INSERT OR REPLACE INTO highlights
                       (bookmark_id, book_id, chapter_uid, chapter_title,
                        mark_text, color_style, type, create_time, range_text)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        h["bookmark_id"], book_id, h["chapter_uid"],
                        h["chapter_title"], h["mark_text"], h["color_style"],
                        h["type"], h["create_time"], h["range_text"],
                    ),
                )
                h_count += 1
        conn.commit()
        log(f"    highlights: {h_count}")

    # Reviews
    reviews = fetch_reviews(book_id)
    if reviews is not None:
        conn.execute("DELETE FROM reviews WHERE book_id = ?", (book_id,))
        for r in reviews:
            if r["review_id"] and r["content"]:
                conn.execute(
                    """INSERT OR REPLACE INTO reviews
                       (review_id, book_id, content, chapter_name, star, create_time)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (
                        r["review_id"], book_id, r["content"],
                        r["chapter_name"], r["star"], r["create_time"],
                    ),
                )
                r_count += 1
        conn.commit()
        log(f"    reviews: {r_count}")

    # Progress (per-book reading time from /book/getprogress)
    p = fetch_book_progress(book_id)
    if p is not None:
        save_book_progress(conn, book_id, p)
        p_sec = p["read_time"]
        if p_sec > 0:
            log(f"    read_time: {p_sec}s ({p_sec // 3600}h {p_sec % 3600 // 60}m), progress: {p['progress']}%")

    return h_count, r_count, p_sec


def detect_changed_books(
    conn, new_notebooks: dict, quick_mode: bool
) -> list:
    """Detect which books need highlights/reviews refresh.
    Returns list of (book_id, title) tuples.
    """
    if not quick_mode:
        # Full sync: all books with notebooks
        rows = conn.execute(
            """SELECT n.book_id, b.title
               FROM notebooks n
               LEFT JOIN books b ON n.book_id = b.id
               ORDER BY n.sort DESC"""
        ).fetchall()
        log(f"[Phase 3] Full sync: {len(rows)} books to refresh")
        return [(r["book_id"], r["title"] or r["book_id"]) for r in rows]

    # Quick mode: only books with changed note counts
    existing = get_existing_notebook_counts(conn)
    changed = []
    for book_id, new in new_notebooks.items():
        old = existing.get(book_id, {})
        if (
            old.get("review_count") != new["review_count"]
            or old.get("note_count") != new["note_count"]
            or old.get("bookmark_count") != new["bookmark_count"]
        ):
            row = conn.execute(
                "SELECT title FROM books WHERE id = ?", (book_id,)
            ).fetchone()
            title = row["title"] if row else book_id
            changed.append((book_id, title))
        elif book_id not in existing:
            # New notebook entry
            row = conn.execute(
                "SELECT title FROM books WHERE id = ?", (book_id,)
            ).fetchone()
            title = row["title"] if row else book_id
            changed.append((book_id, title))

    log(f"[Phase 3] Quick sync: {len(changed)} books with changed notes")
    return changed


# ─── Sync Log ────────────────────────────────────────────────────────────────

def write_sync_log(conn, sync_id: int, status: str, stats: dict, errors: str = None):
    """Update sync_log entry."""
    conn.execute(
        """UPDATE sync_log
           SET finished_at=?, status=?, books_updated=?, highlights_updated=?,
               reviews_updated=?, errors=?
           WHERE id=?""",
        (
            datetime.now().isoformat(),
            status,
            stats.get("books", 0),
            stats.get("highlights", 0),
            stats.get("reviews", 0),
            errors or "",
            sync_id,
        ),
    )
    conn.commit()


# ─── PM2 Restart ─────────────────────────────────────────────────────────────

def restart_pm2():
    """Restart the Node.js server via PM2."""
    log(f"[Restart] Restarting PM2 app: {PM2_APP_NAME}")
    try:
        result = subprocess.run(
            ["pm2", "restart", PM2_APP_NAME],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            universal_newlines=True, timeout=30,
        )
        if result.returncode == 0:
            log(f"  [+] PM2 restart OK: {result.stdout.strip()}")
        else:
            log(f"  [!] PM2 restart failed (rc={result.returncode}): {result.stderr.strip()}")
    except FileNotFoundError:
        log("  [!] pm2 command not found — is PM2 installed?")
    except Exception as e:
        log(f"  [!] PM2 restart error: {e}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    quick_mode = "--quick" in sys.argv
    do_restart = "--restart" in sys.argv

    log("=" * 60)
    log(f"WeRead Sync started (mode={'quick' if quick_mode else 'full'})")
    log("=" * 60)

    if not DB_PATH.exists():
        log(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = get_conn()
    ensure_tables(conn)

    # Create sync log entry
    cur = conn.execute(
        "INSERT INTO sync_log (started_at, status) VALUES (?, 'running')",
        (datetime.now().isoformat(),),
    )
    sync_id = cur.lastrowid
    conn.commit()

    stats = {"books": 0, "highlights": 0, "reviews": 0, "progress_books": 0, "progress_sec": 0}
    errors = []

    try:
        # Phase 1: Bookshelf
        stats["books"] = sync_shelf(conn)

        # Phase 2: Notebooks
        new_notebooks = sync_notebooks(conn)

        # Phase 3: Highlights, Reviews & Progress
        changed_books = detect_changed_books(conn, new_notebooks, quick_mode)

        total = len(changed_books)
        for i, (book_id, title) in enumerate(changed_books):
            log(f"  [{i + 1}/{total}] {title}")
            try:
                hc, rc, psec = sync_book_notes(conn, book_id, title)
                stats["highlights"] += hc
                stats["reviews"] += rc
                if psec > 0:
                    stats["progress_books"] += 1
                    stats["progress_sec"] += psec
            except Exception as e:
                msg = f"{title}: {e}"
                log(f"    [!] {msg}")
                errors.append(msg)
                conn.rollback()

            time.sleep(BATCH_DELAY)

        # Done
        error_str = "; ".join(errors[:5]) if errors else None
        write_sync_log(conn, sync_id, "success" if not errors else "partial", stats, error_str)
        log("-" * 60)
        log(f"Sync complete: {stats['books']} books, {stats['highlights']} highlights, "
            f"{stats['reviews']} reviews, "
            f"{stats['progress_books']} books with progress ({stats['progress_sec'] // 3600}h {(stats['progress_sec'] % 3600) // 60}m total), "
            f"{len(errors)} errors")
        log("-" * 60)

    except Exception as e:
        log(f"FATAL: {e}")
        write_sync_log(conn, sync_id, "failed", stats, str(e))
        conn.close()
        sys.exit(1)

    conn.close()

    # Restart PM2 if requested
    if do_restart:
        restart_pm2()

    return 0


if __name__ == "__main__":
    sys.exit(main())
