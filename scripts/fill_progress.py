#!/usr/bin/env python3
"""
One-time batch script: fetch reading progress for ALL books via /book/getprogress.
Run once to backfill read_time for the entire library.

Usage:
  python scripts/fill_progress.py
  (WEREAD_API_KEY is loaded from .env automatically)
"""

import os
import sys
import time
import sqlite3
import requests
from pathlib import Path

# Load .env file if present
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

DB_PATH = os.environ.get("DB_PATH", "db/reading-room.db")
API_BASE = "https://i.weread.qq.com/api/agent/gateway"
API_KEY = os.environ.get("WEREAD_API_KEY", "")
BATCH_DELAY = 0.6  # seconds between API calls

if not API_KEY or not API_KEY.startswith("wrk-"):
    print("ERROR: WEREAD_API_KEY not set or invalid.")
    print("  Make sure .env contains: WEREAD_API_KEY=wrk-xxx")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


def call_api(endpoint: str, payload: dict = None) -> dict:
    body = {"api_name": endpoint, "skill_version": "1.0.5"}
    if payload:
        body.update(payload)
    resp = requests.post(API_BASE, json=body, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("errcode", 0) != 0:
        raise RuntimeError(f"{data.get('errcode')}: {data.get('errmsg', 'unknown')}")
    return data.get("data", data)


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    books = conn.execute(
        "SELECT id, title FROM books ORDER BY title"
    ).fetchall()

    total = len(books)
    updated = 0
    skipped = 0
    errors = 0
    total_sec = 0

    print(f"[*] {total} books to fetch progress for...")
    print(f"    (approx {total * BATCH_DELAY:.0f}s total, delay={BATCH_DELAY}s)\n")

    for i, (book_id, title) in enumerate(books):
        label = title[:40] if title else book_id
        print(f"[{i+1}/{total}] {label}")

        try:
            resp = call_api("/book/getprogress", {"bookId": book_id})
            book = resp.get("book", {})
            read_time = int(book.get("readingTime", 0))
            progress = int(book.get("progress", 0))
            last_read = int(book.get("updateTime", 0))

            conn.execute(
                "UPDATE books SET read_time=?, progress=?, last_read_time=? WHERE id=?",
                (read_time, progress, last_read, book_id),
            )
            conn.commit()

            if read_time > 0:
                h = read_time // 3600
                m = (read_time % 3600) // 60
                print(f"    OK: {h}h {m}m | progress: {progress}%")
                updated += 1
                total_sec += read_time
            else:
                print(f"    SKIP: no reading time")
                skipped += 1

        except Exception as e:
            print(f"    ERR: {e}")
            errors += 1

        time.sleep(BATCH_DELAY)

    conn.close()

    print(f"\n{'=' * 50}")
    print(f"Done! updated={updated} skipped={skipped} errors={errors}")
    print(f"Total reading time: {total_sec // 3600}h {(total_sec % 3600) // 60}m ({total_sec}s)")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
