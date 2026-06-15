#!/usr/bin/env python3
"""
rebuild_computed.py — 从 API + 现有数据重建计算/统计表

当数据库被重建（sync.py --restart）后，以下表的数据为空：
  - reading_sessions (每日阅读秒数)
  - reading_trends   (月度阅读趋势)
  - summary          (汇总统计)
  - kv_store         (键值聚合)

此脚本尝试通过 /readdata/detail API 获取原始数据，并能从现有
books/highlights/reviews 表计算 summary 等派生数据。

用法:
  python scripts/rebuild_computed.py           # 从 API 获取 + 计算
  python scripts/rebuild_computed.py --local   # 仅从数据库本地计算(不调API)
  python scripts/rebuild_computed.py --dry-run # 仅打印将要做什么，不写入

依赖:
  - WEREAD_API_KEY 环境变量 (除非 --local 模式)
  - 数据库文件 db/reading-room.db 必须存在
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
SKILL_VERSION = "1.0.3"


# ─── API Client ──────────────────────────────────────────────────────────────

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


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


# ─── Rebuild: Summary (computed locally) ─────────────────────────────────────

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


# ─── Rebuild: reading_sessions & trends (from API) ───────────────────────────

def rebuild_from_readdata(conn, dry_run=False):
    """Try to fetch reading sessions/trends from /readdata/detail API."""
    if not API_KEY:
        log("[API] WEREAD_API_KEY not set — skipping API data fetch")
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

    # ── Reading sessions (daily heatmap) ──
    sessions_added = _extract_sessions(conn, overall, "overall")
    sessions_added += _extract_sessions(conn, annually, "annually")

    if sessions_added > 0:
        log(f"  [reading_sessions] Added {sessions_added} days")
    else:
        log("  [reading_sessions] No daily data from API — table stays empty")

    # ── Reading trends (monthly aggregation from sessions) ──
    if sessions_added > 0:
        trends_added = _compute_trends(conn)
        log(f"  [reading_trends] Computed {trends_added} months from sessions")

    # ── KV Store (overall / annual stats) ──
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


# ─── Main ────────────────────────────────────────────────────────────────────

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

    # 1. Summary — always from local data (no API needed)
    if dry_run:
        log("[dry-run] Would rebuild summary from local data")
    else:
        rebuild_summary(conn)

    # 2. Reading sessions, trends, kv_store — try API first
    if local_only:
        log("[local] Skipping API — will only compute from existing data")
    else:
        rebuild_from_readdata(conn, dry_run=dry_run)

    # 3. Verify
    log("-" * 60)
    for table in ("reading_sessions", "reading_trends", "summary", "kv_store"):
        cnt = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        label = f"  [{table}]"
        if cnt == 0:
            label += " ⚠️  EMPTY"
        log(f"{label} {cnt} rows")

    conn.close()
    log("Done.")


if __name__ == "__main__":
    main()
