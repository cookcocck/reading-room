#!/usr/bin/env python3
"""
migrate_covers.py — 一次性迁移脚本：将 DB 中所有封面 URL 升级为 t7_ 高清版

将 books.cover 和 kv_store.value 中的微信读书缩略图 URL（t0_-t6_, s_）
统一替换为 t7_（~400px），使运行时不再需要 upgradeCovers() 递归处理。

用法:
  python scripts/migrate_covers.py          # 执行迁移
  python scripts/migrate_covers.py --dry-run # 预览，不写入

迁移完成后，Node 端的 upgradeCovers() 调用可以安全移除。
"""

import json
import re
import sqlite3
import sys
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "db" / "reading-room.db"
COVER_PATTERN = re.compile(r"/[st]\d*_")


def upgrade_url(url: str) -> str:
    """Replace WeRead t<N>_ or s_ thumbnail with t7_."""
    if not url:
        return url
    return COVER_PATTERN.sub("/t7_", url)


def upgrade_json_covers(json_str: str) -> str:
    """Recursively upgrade all cover-like URL fields in a JSON string."""
    if not json_str:
        return json_str
    try:
        data = json.loads(json_str)
        changed = _upgrade_obj(data)
        if changed:
            return json.dumps(data, ensure_ascii=False)
    except (json.JSONDecodeError, TypeError):
        pass
    return json_str


def _upgrade_obj(obj):
    """Recursively upgrade cover URLs in objects/arrays. Returns True if any change made."""
    changed = False
    if isinstance(obj, list):
        for item in obj:
            if _upgrade_obj(item):
                changed = True
    elif isinstance(obj, dict):
        for key, val in list(obj.items()):
            if key in ('cover', 'bookCover', 'book_cover') and isinstance(val, str):
                new_val = upgrade_url(val)
                if new_val != val:
                    obj[key] = new_val
                    changed = True
            elif isinstance(val, (dict, list)):
                if _upgrade_obj(val):
                    changed = True
    return changed


def main():
    dry_run = "--dry-run" in sys.argv

    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Cover URL Migration")
    print(f"  Database: {DB_PATH}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'EXECUTE'}")
    print()

    # ── 1. Migrate books.cover ──
    rows = conn.execute("SELECT id, title, cover FROM books WHERE cover != ''").fetchall()
    books_updated = 0
    for row in rows:
        old_cover = row["cover"]
        new_cover = upgrade_url(old_cover)
        if new_cover != old_cover:
            books_updated += 1
            if dry_run:
                print(f"  [book] {row['title'][:30]}")
                print(f"    old: {old_cover[:80]}")
                print(f"    new: {new_cover[:80]}")
            else:
                conn.execute("UPDATE books SET cover = ? WHERE id = ?", (new_cover, row["id"]))

    print(f"  Books: {books_updated} covers upgraded ({len(rows)} total)")
    print()

    # ── 2. Migrate kv_store.value (JSON with embedded cover URLs) ──
    kv_rows = conn.execute("SELECT name, value FROM kv_store WHERE value != ''").fetchall()
    kv_updated = 0
    for row in kv_rows:
        old_value = row["value"]
        new_value = upgrade_json_covers(old_value)
        if new_value != old_value:
            kv_updated += 1
            if dry_run:
                print(f"  [kv_store] {row['name']}: covers found and upgraded")
            else:
                conn.execute("UPDATE kv_store SET value = ? WHERE name = ?", (new_value, row["name"]))

    print(f"  KV Store: {kv_updated} entries upgraded ({len(kv_rows)} total)")
    print()

    if not dry_run:
        conn.commit()
        print("  Committed to database.")

    conn.close()
    print()
    print("Migration complete." if not dry_run else "Dry run complete. No changes written.")
    print()
    print("Next steps:")
    print("  1. Deploy the updated Node.js code (upgradeCovers calls removed)")
    print("  2. Restart PM2: pm2 restart reading-room")


if __name__ == "__main__":
    main()
