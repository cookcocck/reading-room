#!/usr/bin/env python3
"""sync_read_times.py — Fetch per-book reading time from WeRead API.

Calls /book/getprogress for every book in the database and stores
recordReadingTime (seconds) as books.read_time.

Usage:
    python scripts/sync_read_times.py          # sync all books
    python scripts/sync_read_times.py --book BOOK_ID  # sync single book

Requires:
    - WEREAD_API_KEY environment variable (format: wrk-xxxxxxxx)
    - sqlite3 (stdlib)
"""

import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.error
from pathlib import Path

# ─── Config ───

API_URL = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"
DELAY_SEC = 1.0  # rate limit: delay between API calls
BATCH_SIZE = 10  # log progress every N books

DB_PATH = Path(__file__).resolve().parent.parent / "db" / "reading-room.db"


def get_api_key():
    key = os.environ.get("WEREAD_API_KEY", "")
    if not key:
        print("[ERROR] WEREAD_API_KEY environment variable not set.")
        print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
        sys.exit(1)
    if not key.startswith("wrk-"):
        print("[WARN] WEREAD_API_KEY should start with 'wrk-', got:", key[:8] + "...")
    return key


def call_api(api_name, **params):
    """Call the WeRead Agent API Gateway."""
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {get_api_key()}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {"errcode": e.code, "errmsg": body}
    except Exception as e:
        return {"errcode": -1, "errmsg": str(e)}


def get_book_progress(book_id, debug=False):
    """Fetch reading progress for a single book."""
    result = call_api("/book/getprogress", bookId=book_id)
    if debug:
        print(f"    [DEBUG] Raw response keys: {sorted(result.keys())}")
        for k in result:
            v = result[k]
            if isinstance(v, dict):
                print(f"    [DEBUG]   {k}: dict with keys {sorted(v.keys())}")
                for sk in v:
                    print(f"    [DEBUG]     {k}.{sk} = {json.dumps(v[sk], ensure_ascii=False)[:120]}")
            elif isinstance(v, list):
                print(f"    [DEBUG]   {k}: list of {len(v)} items")
            else:
                print(f"    [DEBUG]   {k} = {json.dumps(v, ensure_ascii=False)[:120]}")
    if result.get("errcode") and result["errcode"] != 0:
        return None, result.get("errmsg", f"errcode={result['errcode']}")
    # Try multiple possible nesting paths
    book = result.get("book")
    if book is None and isinstance(result.get("data"), dict):
        book = result["data"].get("book")
    if not isinstance(book, dict):
        if debug:
            print(f"    [DEBUG] WARNING: 'book' not found as dict in response! book={type(book).__name__}")
        return 0, None
    record_time = book.get("recordReadingTime", 0)
    if debug:
        print(f"    [DEBUG] book.recordReadingTime = {record_time}")
    return record_time, None


def main():
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Check column exists
    col_check = cur.execute("PRAGMA table_info(books)").fetchall()
    has_read_time = any(c[1] == "read_time" for c in col_check)
    if not has_read_time:
        print("[INFO] Adding read_time column to books table...")
        cur.execute("ALTER TABLE books ADD COLUMN read_time INTEGER DEFAULT 0")
        conn.commit()

    # Get book IDs to sync
    if "--book" in sys.argv:
        idx = sys.argv.index("--book")
        if idx + 1 < len(sys.argv):
            book_ids = [sys.argv[idx + 1]]
        else:
            print("[ERROR] --book requires a BOOK_ID argument")
            sys.exit(1)
    else:
        rows = cur.execute("SELECT id, title FROM books ORDER BY update_time DESC").fetchall()
        book_ids = [r["id"] for r in rows]
        print(f"[INFO] Found {len(book_ids)} books to sync")

    debug = "--debug" in sys.argv
    synced = 0
    skipped = 0
    errors = 0

    for i, book_id in enumerate(book_ids):
        # Get title for logging
        title_row = cur.execute("SELECT title FROM books WHERE id = ?", (book_id,)).fetchone()
        title = title_row["title"] if title_row else book_id

        record_time, err = get_book_progress(book_id, debug=(debug and i < 3))

        if err:
            print(f"  [{i+1}/{len(book_ids)}] {title}: ERROR — {err}")
            errors += 1
        elif record_time > 0:
            cur.execute(
                "UPDATE books SET read_time = ? WHERE id = ?",
                (record_time, book_id),
            )
            h = record_time // 3600
            m = (record_time % 3600) // 60
            print(f"  [{i+1}/{len(book_ids)}] {title}: {h}h {m}m")
            synced += 1
        else:
            print(f"  [{i+1}/{len(book_ids)}] {title}: 0m (no reading time)")
            skipped += 1

        # Commit periodically
        if (i + 1) % BATCH_SIZE == 0:
            conn.commit()
            print(f"  ── committed {i+1}/{len(book_ids)} ──")

        time.sleep(DELAY_SEC)

    conn.commit()
    conn.close()

    print(f"\n[DONE] Synced: {synced}, Skipped (0m): {skipped}, Errors: {errors}")


if __name__ == "__main__":
    main()
