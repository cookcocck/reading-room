#!/usr/bin/env python3
"""
restore.py — 从备份恢复 SQLite 数据库

交互式选择备份文件，解压并替换当前数据库，然后重启 PM2。

用法:
  python scripts/restore.py              # 交互式选择备份
  python scripts/restore.py --latest     # 直接使用最新备份
  python scripts/restore.py --file <name> # 指定备份文件名
"""

import gzip
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "db" / "reading-room.db"
BACKUP_DIR = Path(__file__).parent.parent / "backups"
PM2_APP_NAME = os.environ.get("PM2_APP_NAME", "reading-room")


def log(msg: str):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


def list_backups():
    """Return sorted list of backup files (newest first)."""
    if not BACKUP_DIR.exists():
        return []
    return sorted(
        [f for f in BACKUP_DIR.iterdir() if f.name.startswith("reading-room_") and f.suffix == ".gz"],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )


def restore(backup_path: Path):
    """Restore a gzipped backup to the database path."""
    if not backup_path.exists():
        log(f"ERROR: Backup file not found: {backup_path}")
        return False

    # Step 1: Backup current DB (safety net)
    if DB_PATH.exists():
        safety = DB_PATH.parent / f"reading-room.db.pre-restore.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(DB_PATH, safety)
        log(f"  [+] Current DB saved as: {safety.name}")

    # Step 2: Decompress backup
    temp_path = DB_PATH.parent / "reading-room.db.restoring"
    try:
        with gzip.open(backup_path, 'rb') as f_in:
            with open(temp_path, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
    except Exception as e:
        log(f"ERROR: Decompression failed: {e}")
        if temp_path.exists():
            temp_path.unlink()
        return False

    # Step 3: Verify the decompressed file is a valid SQLite database
    try:
        import sqlite3
        conn = sqlite3.connect(str(temp_path))
        tables = conn.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
        conn.close()
        if tables == 0:
            log("ERROR: Backup contains no tables — aborting")
            temp_path.unlink()
            return False
        log(f"  [+] Verified: {tables} tables in backup")
    except Exception as e:
        log(f"ERROR: Backup verification failed: {e}")
        if temp_path.exists():
            temp_path.unlink()
        return False

    # Step 4: Replace current DB
    try:
        if DB_PATH.exists():
            DB_PATH.unlink()
        temp_path.rename(DB_PATH)
    except Exception as e:
        log(f"ERROR: Failed to replace database: {e}")
        if temp_path.exists():
            temp_path.unlink()
        return False

    size_mb = DB_PATH.stat().st_size / 1024 / 1024
    log(f"  [+] Database restored ({size_mb:.1f} MB)")

    # Step 5: Restart PM2
    try:
        result = subprocess.run(
            ["pm2", "restart", PM2_APP_NAME],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            universal_newlines=True, timeout=30,
        )
        if result.returncode == 0:
            log(f"  [+] PM2 restart OK: {PM2_APP_NAME}")
        else:
            log(f"  [!] PM2 restart failed: {result.stderr.strip()}")
    except FileNotFoundError:
        log("  [!] pm2 not found — manual restart needed")
    except Exception as e:
        log(f"  [!] PM2 restart error: {e}")

    return True


def main():
    backups = list_backups()

    if not backups:
        log("No backups found. Run 'python scripts/backup.py' first.")
        return 1

    # Determine which backup to use
    backup_path = None

    if "--latest" in sys.argv:
        backup_path = backups[0]
    elif "--file" in sys.argv:
        idx = sys.argv.index("--file")
        if idx + 1 < len(sys.argv):
            name = sys.argv[idx + 1]
            # Match by full name or partial
            for b in backups:
                if name in b.name:
                    backup_path = b
                    break
            if not backup_path:
                log(f"ERROR: No backup matching '{name}'")
                return 1
    else:
        # Interactive selection
        print("\nAvailable backups:\n")
        for i, b in enumerate(backups):
            size = b.stat().st_size
            size_str = f"{size / 1024 / 1024:.1f} MB" if size > 1024 * 1024 else f"{size / 1024:.0f} KB"
            mtime = datetime.fromtimestamp(b.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            print(f"  [{i + 1}] {b.name}  ({size_str}, {mtime})")

        print()
        try:
            choice = input(f"Select backup to restore [1-{len(backups)}] (or 'q' to quit): ").strip()
            if choice.lower() == 'q':
                print("Aborted.")
                return 0
            idx = int(choice) - 1
            if 0 <= idx < len(backups):
                backup_path = backups[idx]
            else:
                print("Invalid selection.")
                return 1
        except (ValueError, EOFError, KeyboardInterrupt):
            print("\nAborted.")
            return 1

    # Confirm
    print(f"\n  WARNING: This will replace the current database!")
    print(f"  Backup:  {backup_path.name}")
    print(f"  Target:  {DB_PATH}")
    print(f"  A safety copy of the current DB will be created before restoring.")
    try:
        confirm = input("\n  Proceed? [y/N]: ").strip().lower()
        if confirm != 'y':
            print("Aborted.")
            return 0
    except (EOFError, KeyboardInterrupt):
        print("\nAborted.")
        return 0

    log(f"Restoring from: {backup_path.name}")
    success = restore(backup_path)
    if success:
        log("Restore complete.")
        return 0
    else:
        log("Restore FAILED.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
