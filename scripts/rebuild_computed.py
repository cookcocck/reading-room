#!/usr/bin/env python3
"""
rebuild_computed.py 鈥?浠?API + 鐜版湁鏁版嵁閲嶅缓璁＄畻/缁熻琛?

褰撴暟鎹簱琚噸寤猴紙sync.py --restart锛夊悗锛屼互涓嬭〃鐨勬暟鎹负绌猴細
  - reading_sessions (姣忔棩闃呰绉掓暟)
  - reading_trends   (鏈堝害闃呰瓒嬪娍)
  - summary          (姹囨€荤粺璁?
  - kv_store         (閿€艰仛鍚?

姝よ剼鏈皾璇曢€氳繃 /readdata/detail API 鑾峰彇鍘熷鏁版嵁锛屽苟鑳戒粠鐜版湁
books/highlights/reviews 琛ㄨ绠?summary 绛夋淳鐢熸暟鎹€?

鐢ㄦ硶:
  python scripts/rebuild_computed.py           # 浠?API 鑾峰彇 + 璁＄畻
  python scripts/rebuild_computed.py --local   # 浠呬粠鏁版嵁搴撴湰鍦拌绠?涓嶈皟API)
  python scripts/rebuild_computed.py --dry-run # 浠呮墦鍗板皢瑕佸仛浠€涔堬紝涓嶅啓鍏?

渚濊禆:
  - WEREAD_API_KEY 鐜鍙橀噺 (闄ら潪 --local 妯″紡)
  - 鏁版嵁搴撴枃浠?db/reading-room.db 蹇呴』瀛樺湪
"""

import json
import os
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
DB_PATH = ROOT_DIR / "db" / "reading-room.db"

API_KEY = os.environ.get("WEREAD_API_KEY", "")
GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.4"


# 鈹€鈹€鈹€ API Client 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def call_api(api_name: str, **params) -> dict:
    """Call WeRead Agent API Gateway."""
    import urllib.request
    import urllib.error

    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        GATEWAY,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  [API ERROR] HTTP {e.code}: {body[:200]}")
        return {}
    except Exception as e:
        print(f"  [API ERROR] {e}")
        return {}


# 鈹€鈹€鈹€ Helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


# 鈹€鈹€鈹€ Rebuild: Summary (computed locally) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def rebuild_summary(conn):
    """Compute summary row from existing books/highlights/reviews data."""
    log("[summary] Computing from local data...")

    total_books = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    finished_count = conn.execute(
        "SELECT COUNT(*) FROM books WHERE finished = 1"
    ).fetchone()[0]
    total_note_count = (
        conn.execute("SELECT COUNT(*) FROM highlights").fetchone()[0]
        + conn.execute("SELECT COUNT(*) FROM reviews").fetchone()[0]
    )
    notebook_books_count = conn.execute(
        "SELECT COUNT(*) FROM notebooks WHERE total_notes > 0"
    ).fetchone()[0]

    # Categories
    cats = conn.execute(
        "SELECT DISTINCT category FROM books WHERE category != ''"
    ).fetchall()
    categories = json.dumps(
        sorted([c[0] for c in cats]),
        ensure_ascii=False,
    )

    # Top authors
    authors = conn.execute("""
        SELECT author, COUNT(*) as cnt
        FROM books
        WHERE author != ''
        GROUP BY author
        ORDER BY cnt DESC
        LIMIT 10
    """).fetchall()
    top_authors = json.dumps(
        [{"name": a[0], "count": a[1]} for a in authors],
        ensure_ascii=False,
    )

    # Archives (each book-id -> first_highlight_time)
    archives = []
    rows = conn.execute("""
        SELECT b.id, b.title, b.author, b.cover, b.category,
               MIN(h.create_time) as first_time, COUNT(*) as note_cnt
        FROM books b
        LEFT JOIN highlights h ON b.id = h.book_id
        WHERE b.finished = 1
        GROUP BY b.id
        ORDER BY first_time ASC
    """).fetchall()
    for r in rows:
        archives.append({
            "id": r["id"],
            "title": r["title"],
            "author": r["author"],
            "cover": r["cover"],
            "category": r["category"],
            "date": r["first_time"] or 0,
            "notes": r["note_cnt"],
        })
    archives_json = json.dumps(archives, ensure_ascii=False)

    conn.execute("DELETE FROM summary")
    conn.execute(
        "INSERT INTO summary (id, total_books, finished_count, total_note_count, "
        "notebook_books_count, categories, top_authors, archives) "
        "VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
        (total_books, finished_count, total_note_count,
         notebook_books_count, categories, top_authors, archives_json),
    )
    conn.commit()
    log(f"  [summary] {total_books} books, {finished_count} finished, "
        f"{total_note_count} notes, {notebook_books_count} notebooks")


# 鈹€鈹€鈹€ Rebuild: reading_sessions & trends (from API) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def rebuild_from_readdata(conn, dry_run=False):
    """Try to fetch reading sessions/trends from /readdata/detail API."""
    if not API_KEY:
        log("[API] WEREAD_API_KEY not set 鈥?skipping API data fetch")
        return

    log("[API] Fetching /readdata/detail?mode=overall ...")
    overall = call_api("/readdata/detail", mode="overall")
    time.sleep(1)
    log("[API] Fetching /readdata/detail?mode=annually ...")
    annually = call_api("/readdata/detail", mode="annually")

    if dry_run:
        log("[dry-run] Would rebuild reading_sessions and reading_trends from API data")
        if overall:
            keys = sorted(overall.keys())
            log(f"  overall top-level keys: {keys}")
        return

    # 鈹€鈹€ Reading sessions (daily heatmap) 鈹€鈹€
    sessions_added = _extract_sessions(conn, overall, "overall")
    sessions_added += _extract_sessions(conn, annually, "annually")

    if sessions_added > 0:
        log(f"  [reading_sessions] Added {sessions_added} days")
    else:
        log("  [reading_sessions] No daily data from API 鈥?table stays empty")

    # 鈹€鈹€ Reading trends (monthly aggregation from sessions) 鈹€鈹€
    if sessions_added > 0:
        trends_added = _compute_trends(conn)
        log(f"  [reading_trends] Computed {trends_added} months from sessions")

    # 鈹€鈹€ KV Store (overall / annual stats) 鈹€鈹€
    if overall:
        conn.execute(
            "INSERT OR REPLACE INTO kv_store (name, value, updated_at) VALUES (?, ?, datetime('now'))",
            ("overall", json.dumps(overall, ensure_ascii=False)),
        )
        log("  [kv_store] Saved 'overall'")
    if annually:
        conn.execute(
            "INSERT OR REPLACE INTO kv_store (name, value, updated_at) VALUES (?, ?, datetime('now'))",
            ("annual", json.dumps(annually, ensure_ascii=False)),
        )
        log("  [kv_store] Saved 'annual'")

    conn.commit()


def _extract_sessions(conn, data: dict, source: str) -> int:
    """Extract daily reading seconds from API response.

    The API may return 'heatmap' or 'readDuration' fields in various formats.
    We try multiple common keys.
    """
    if not data:
        return 0

    added = 0

    # Try known field names for daily reading data
    for key in ("heatmap", "dailyReadTimes", "readSessions", "dailyDuration"):
        records = data.get(key)
        if isinstance(records, list) and len(records) > 0:
            for item in records:
                if isinstance(item, dict):
                    date_str = item.get("date") or item.get("day") or ""
                    secs = item.get("seconds") or item.get("readTime") or item.get("duration") or 0
                elif isinstance(item, list) and len(item) >= 2:
                    date_str, secs = str(item[0]), int(item[1])
                else:
                    continue
                if date_str and secs:
                    conn.execute(
                        "INSERT OR REPLACE INTO reading_sessions (date, seconds) VALUES (?, ?)",
                        (date_str, int(secs)),
                    )
                    added += 1
            if added > 0:
                return added

    # Try nested structure like {"data": {"daily": [...]}}
    nested = data.get("data", {})
    if isinstance(nested, dict):
        for key in ("heatmap", "dailyReadTimes", "readSessions", "dailyDuration"):
            records = nested.get(key)
            if isinstance(records, list):
                for item in records:
                    if isinstance(item, dict):
                        date_str = item.get("date") or item.get("day") or ""
                        secs = item.get("seconds") or item.get("readTime") or item.get("duration") or 0
                    elif isinstance(item, list) and len(item) >= 2:
                        date_str, secs = str(item[0]), int(item[1])
                    else:
                        continue
                    if date_str and secs:
                        conn.execute(
                            "INSERT OR REPLACE INTO reading_sessions (date, seconds) VALUES (?, ?)",
                            (date_str, int(secs)),
                        )
                        added += 1
                if added > 0:
                    return added

    return added


def _compute_trends(conn) -> int:
    """Compute monthly reading trends from reading_sessions."""
    rows = conn.execute("""
        SELECT
            CAST(substr(date, 1, 4) AS INTEGER) AS year,
            CAST(substr(date, 6, 2) AS INTEGER) AS month,
            SUM(seconds) AS total_seconds,
            COUNT(*) AS read_days
        FROM reading_sessions
        GROUP BY year, month
        ORDER BY year, month
    """).fetchall()

    conn.execute("DELETE FROM reading_trends")
    for r in rows:
        conn.execute(
            "INSERT INTO reading_trends (year, month, total_seconds, read_days) "
            "VALUES (?, ?, ?, ?)",
            (r["year"], r["month"], r["total_seconds"], r["read_days"]),
        )
    conn.commit()
    return len(rows)


# 鈹€鈹€鈹€ Main 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def main():
    local_only = "--local" in sys.argv
    dry_run = "--dry-run" in sys.argv

    if not DB_PATH.exists():
        log(f"ERROR: Database not found: {DB_PATH}")
        log("Run 'python scripts/sync.py' first to create the database.")
        sys.exit(1)

    log("=" * 60)
    mode = "local" if local_only else "dry-run" if dry_run else "full"
    log(f"Rebuild computed tables started (mode={mode})")
    log("=" * 60)

    conn = get_conn()

    # 1. Summary 鈥?always from local data (no API needed)
    if dry_run:
        log("[dry-run] Would rebuild summary from local data")
    else:
        rebuild_summary(conn)

    # 2. Reading sessions, trends, kv_store 鈥?try API first
    if local_only:
        log("[local] Skipping API 鈥?will only compute from existing data")
    else:
        rebuild_from_readdata(conn, dry_run=dry_run)

    # 3. Verify
    log("-" * 60)
    for table in ("reading_sessions", "reading_trends", "summary", "kv_store"):
        cnt = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        label = f"  [{table}]"
        if cnt == 0:
            label += " 鈿狅笍  EMPTY"
        log(f"{label} {cnt} rows")

    conn.close()
    log("Done.")


if __name__ == "__main__":
    main()
