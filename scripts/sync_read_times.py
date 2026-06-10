#!/usr/bin/env python3
"""sync_read_times.py — Fetch per-book reading time from WeRead API.

Uses /readdata/detail?mode=overall to get readLongest[] which contains
accurate per-book readTime (NOT the broken recordReadingTime from
/book/getprogress which always returns 0 via the Gateway).

Limitation: readLongest only returns top ~10 books (minimum 5 min each).
Books not in this list will keep read_time=0; the web UI falls back to
the legacy getBookReadTimes() title-matching from overall.json.

Usage:
    python scripts/sync_read_times.py          # sync from API
    python scripts/sync_read_times.py --debug  # show raw API response

Requires:
    - WEREAD_API_KEY environment variable (format: wrk-xxxxxxxx)
    - sqlite3 (stdlib)
"""

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.error
from pathlib import Path

# ─── Config ───

API_URL = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"

DB_PATH = Path(__file__).resolve().parent.parent / "db" / "reading-room.db"
API_KEY = os.environ.get("WEREAD_API_KEY", "")

if not API_KEY:
    print("[ERROR] WEREAD_API_KEY environment variable not set.")
    print("  export WEREAD_API_KEY=wrk-xxxxxxxx")
    sys.exit(1)
if not API_KEY.startswith("wrk-"):
    print("[WARN] WEREAD_API_KEY should start with 'wrk-', got:", API_KEY[:8] + "...")


def call_api(api_name, **params):
    """Call the WeRead Agent API Gateway."""
    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
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


def fetch_read_longest(mode="overall", debug=False):
    """Fetch readLongest[] from /readdata/detail for a given mode.

    Returns list of {bookId, title, readTime_sec}.
    """
    result = call_api("/readdata/detail", mode=mode)
    if debug:
        print(f"\n  [DEBUG] /readdata/detail?mode={mode} response:")
        top_keys = sorted(result.keys())
        print(f"    Top-level keys: {top_keys}")
    if result.get("errcode") and result["errcode"] != 0:
        print(f"  [ERROR] API error for mode={mode}: errcode={result.get('errcode')}, msg={result.get('errmsg')}")
        return []
    items = result.get("readLongest", [])
    if debug:
        print(f"    readLongest: {len(items)} items")
        for i, item in enumerate(items):
            book = item.get("book", item.get("albumInfo", {}))
            rt = item.get("readTime", 0)
            tags = item.get("tags", [])
            print(f"      [{i+1}] {book.get('title', '?')} | bookId={book.get('bookId', '?')} | readTime={rt}s ({rt//3600}h{(rt%3600)//60}m) | tags={tags}")
    books = []
    for item in items:
        rt = item.get("readTime", 0)
        if rt < 300:  # skip under 5 min (API already filters, but be safe)
            continue
        book_info = item.get("book") or item.get("albumInfo") or {}
        book_id = book_info.get("bookId", "")
        title = book_info.get("title", "?")
        if book_id:
            books.append({"bookId": book_id, "title": title, "readTime": rt})
    return books


def main():
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found: {DB_PATH}")
        sys.exit(1)

    debug = "--debug" in sys.argv

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Ensure read_time column exists
    col_check = cur.execute("PRAGMA table_info(books)").fetchall()
    has_read_time = any(c[1] == "read_time" for c in col_check)
    if not has_read_time:
        print("[INFO] Adding read_time column to books table...")
        cur.execute("ALTER TABLE books ADD COLUMN read_time INTEGER DEFAULT 0")
        conn.commit()

    # ─── Fetch from API ───

    all_read_times = {}  # bookId -> {title, readTime}

    # overall (all-time top reads)
    print("[INFO] Fetching /readdata/detail?mode=overall ...")
    for entry in fetch_read_longest("overall", debug=debug):
        if entry["readTime"] > all_read_times.get(entry["bookId"], {}).get("readTime", 0):
            all_read_times[entry["bookId"]] = entry

    # annually (current year top reads, may include different books)
    print("[INFO] Fetching /readdata/detail?mode=annually ...")
    for entry in fetch_read_longest("annually", debug=debug):
        if entry["readTime"] > all_read_times.get(entry["bookId"], {}).get("readTime", 0):
            all_read_times[entry["bookId"]] = entry

    print(f"\n[INFO] Got {len(all_read_times)} unique books with reading time from API")

    if not all_read_times:
        print("[WARN] No reading time data from API — books.read_time will not be updated.")
        conn.close()
        return

    # ─── Update database ───

    # Build a title→readTime map as fallback for books not matched by bookId
    title_map = {}
    for entry in all_read_times.values():
        title_map[entry["title"]] = entry["readTime"]

    updated = 0
    for book_id, entry in all_read_times.items():
        cur.execute(
            "UPDATE books SET read_time = ? WHERE id = ?",
            (entry["readTime"], book_id),
        )
        if cur.rowcount > 0:
            h = entry["readTime"] // 3600
            m = (entry["readTime"] % 3600) // 60
            print(f"  [✓] {entry['title']}: {h}h {m}m (bookId match)")
            updated += 1
        else:
            # book not in our DB by bookId — try title match
            cur.execute(
                "UPDATE books SET read_time = ? WHERE title = ? AND read_time = 0",
                (entry["readTime"], entry["title"]),
            )
            if cur.rowcount > 0:
                h = entry["readTime"] // 3600
                m = (entry["readTime"] % 3600) // 60
                print(f"  [✓] {entry['title']}: {h}h {m}m (title match)")
                updated += 1
            else:
                print(f"  [?] {entry['title']}: not found in DB or already has read_time")

    conn.commit()
    conn.close()

    print(f"\n[DONE] Updated {updated} books. Total unique from API: {len(all_read_times)}")


if __name__ == "__main__":
    main()
