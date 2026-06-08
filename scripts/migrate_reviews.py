#!/usr/bin/env python3
"""
Migrate reviews (想法/点评) from WeRead API into the SQLite database.
Fetches reviews for all books that have reviewCount > 0 in notebooks table.
Supports resume on interruption.
"""
import json
import os
import sqlite3
import time
import requests
from pathlib import Path

# ─── Config ───
API_KEY = os.environ.get("WEREAD_API_KEY", "")
if not API_KEY:
    print("ERROR: Set WEREAD_API_KEY environment variable first")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    exit(1)

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
DB_PATH = ROOT_DIR / "db" / "reading-room.db"
PROGRESS_FILE = SCRIPT_DIR / "migrate_reviews_progress.json"

GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"
DELAY = 1.0  # seconds between API calls

session = requests.Session()
session.headers.update({
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
})


def call_api(api_name: str, params: dict) -> dict:
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    resp = session.post(GATEWAY, json=body, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("errcode", 0) != 0:
        raise RuntimeError(f"API error {result.get('errcode')}: {result.get('errmsg', '')}")
    return result


def fetch_reviews(book_id: str) -> list:
    """Fetch all reviews for a single book (paginated)."""
    all_reviews = []
    synckey = 0
    while True:
        result = call_api("/review/list/mine", {"bookid": book_id, "synckey": synckey, "count": 20})
        reviews = result.get("reviews", [])
        if not reviews:
            break
        for r in reviews:
            rv = r.get("review", {})
            all_reviews.append({
                "reviewId": rv.get("reviewId", ""),
                "content": rv.get("content", ""),
                "createTime": rv.get("createTime", 0),
                "chapterName": rv.get("chapterName", ""),
                "star": rv.get("star", -1),
            })
        if result.get("hasMore", 0) == 0:
            break
        synckey = result.get("synckey", 0)
        if synckey == 0:
            break
        time.sleep(DELAY)
    return all_reviews


def create_reviews_table(conn):
    conn.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            review_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            content TEXT DEFAULT '',
            chapter_name TEXT DEFAULT '',
            star INTEGER DEFAULT -1,
            create_time INTEGER NOT NULL
        )
    ''')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_id)')
    conn.commit()


def load_progress() -> set:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    return set()


def save_progress(done_ids: set):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(list(done_ids), f, ensure_ascii=False)


def main():
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    create_reviews_table(conn)

    # Try notebooks first; if empty, fallback to all books with highlights
    rows = conn.execute('''
        SELECT n.book_id, b.title, n.review_count
        FROM notebooks n
        LEFT JOIN books b ON n.book_id = b.id
        WHERE n.review_count > 0
        ORDER BY n.sort DESC
    ''').fetchall()

    if not rows:
        print("[!] notebooks table is empty — falling back to books with highlights")
        rows = conn.execute('''
            SELECT DISTINCT h.book_id, b.title, 0 AS review_count
            FROM highlights h
            LEFT JOIN books b ON h.book_id = b.id
            ORDER BY b.title
        ''').fetchall()

    if not rows:
        print("[*] No books found to query for reviews.")
        conn.close()
        return

    done_ids = load_progress()
    total = len(rows)
    remaining = [r for r in rows if r["book_id"] not in done_ids]
    print(f"[*] {total} books with reviews, {len(done_ids)} done, {len(remaining)} remaining")

    for i, row in enumerate(remaining):
        book_id = row["book_id"]
        title = row["title"] or book_id
        expected = row["review_count"]
        expected_hint = f" (expected ~{expected})" if expected > 0 else ""
        print(f"    [{i+1}/{len(remaining)}] {title}{expected_hint}")

        try:
            reviews = fetch_reviews(book_id)

            # Delete old reviews for this book (idempotent re-run)
            conn.execute("DELETE FROM reviews WHERE book_id = ?", (book_id,))

            # Insert new reviews
            count = 0
            for rv in reviews:
                if rv.get("reviewId") and rv.get("content"):
                    conn.execute(
                        "INSERT OR REPLACE INTO reviews (review_id, book_id, content, chapter_name, star, create_time) VALUES (?, ?, ?, ?, ?, ?)",
                        (rv["reviewId"], book_id, rv["content"], rv["chapterName"], rv["star"], rv["createTime"])
                    )
                    count += 1
            conn.commit()

            done_ids.add(book_id)
            save_progress(done_ids)
            print(f"    [+] Stored {count} reviews (expected {expected})")

        except Exception as e:
            print(f"    [!] FAIL: {e}")
            conn.rollback()
            time.sleep(DELAY * 2)

        time.sleep(DELAY)

    conn.close()
    print(f"\n[*] Done! {len(done_ids)} books migrated.")


if __name__ == "__main__":
    main()
