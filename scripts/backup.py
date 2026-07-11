#!/usr/bin/env python3
"""
backup.py — SQLite 数据库一致性备份 + gzip 压缩 + 轮转

使用 SQLite Online Backup API 确保备份一致性（即使在 Python sync.py 写入时也能安全备份）。
支持自动轮转：本地保留最近 N 份备份，可选上传到阿里云 OSS。

用法:
  python scripts/backup.py                  # 立即备份
  python scripts/backup.py --rotate 7       # 保留最近 7 份（默认）
  python scripts/backup.py --list           # 列出所有备份
  python scripts/backup.py --cron           # cron 模式（静默，仅错误输出）

环境变量（可选）:
  OSS_BUCKET     阿里云 OSS bucket 名 — 设置后自动上传备份
  OSS_ENDPOINT   OSS endpoint（如 oss-cn-hangzhou.aliyuncs.com）
  OSS_ACCESS_KEY / OSS_SECRET_KEY  OSS 凭证
"""

import gzip
import os
import shutil
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "db" / "reading-room.db"
BACKUP_DIR = Path(__file__).parent.parent / "backups"
DEFAULT_ROTATE = 7


def log(msg: str):
    """Timestamped log to stdout."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


def create_backup() -> Path | None:
    """Create a consistent backup using SQLite Online Backup API, then gzip compress."""
    if not DB_PATH.exists():
        log(f"ERROR: Database not found at {DB_PATH}")
        return None

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_path = BACKUP_DIR / f"reading-room_{timestamp}.db"
    gz_path = BACKUP_DIR / f"reading-room_{timestamp}.db.gz"

    # Step 1: SQLite Online Backup (consistent snapshot, safe during writes)
    try:
        src = sqlite3.connect(str(DB_PATH))
        dst = sqlite3.connect(str(raw_path))
        src.backup(dst)
        dst.close()
        src.close()
    except Exception as e:
        log(f"ERROR: SQLite backup failed: {e}")
        return None

    # Step 2: Gzip compress
    try:
        with open(raw_path, 'rb') as f_in:
            with gzip.open(gz_path, 'wb', compresslevel=6) as f_out:
                shutil.copyfileobj(f_in, f_out)
        raw_path.unlink()  # remove uncompressed
    except Exception as e:
        log(f"ERROR: Gzip compression failed: {e}")
        if raw_path.exists():
            raw_path.unlink()
        return None

    size_mb = gz_path.stat().st_size / 1024 / 1024
    db_size_mb = DB_PATH.stat().st_size / 1024 / 1024
    log(f"Backup created: {gz_path.name} ({size_mb:.1f} MB compressed, {db_size_mb:.1f} MB original)")
    return gz_path


def rotate_backups(keep: int = DEFAULT_ROTATE):
    """Keep only the N most recent backups, delete older ones."""
    if not BACKUP_DIR.exists():
        return

    backups = sorted(
        [f for f in BACKUP_DIR.iterdir() if f.name.startswith("reading-room_") and f.suffix == ".gz"],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )

    deleted = 0
    for old_file in backups[keep:]:
        try:
            old_file.unlink()
            deleted += 1
        except Exception as e:
            log(f"  WARN: Could not delete {old_file.name}: {e}")

    if deleted > 0:
        log(f"Rotated: deleted {deleted} old backup(s), keeping {min(len(backups), keep)}")


def list_backups():
    """List all available backups with sizes and dates."""
    if not BACKUP_DIR.exists():
        print("No backups directory found.")
        return

    backups = sorted(
        [f for f in BACKUP_DIR.iterdir() if f.name.startswith("reading-room_") and f.suffix == ".gz"],
        key=lambda f: f.stat().st_mtime,
        reverse=True,
    )

    if not backups:
        print("No backups found.")
        return

    print(f"{'File':<45} {'Size':>10}  {'Date':<20}")
    print("-" * 80)
    for f in backups:
        size = f.stat().st_size
        if size > 1024 * 1024:
            size_str = f"{size / 1024 / 1024:.1f} MB"
        else:
            size_str = f"{size / 1024:.0f} KB"
        mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"{f.name:<45} {size_str:>10}  {mtime:<20}")
    print(f"\nTotal: {len(backups)} backup(s)")


def upload_to_oss(gz_path: Path):
    """Optionally upload backup to Alibaba Cloud OSS."""
    bucket = os.environ.get("OSS_BUCKET")
    endpoint = os.environ.get("OSS_ENDPOINT")
    access_key = os.environ.get("OSS_ACCESS_KEY")
    secret_key = os.environ.get("OSS_SECRET_KEY")

    if not all([bucket, endpoint, access_key, secret_key]):
        return False  # OSS not configured — skip silently

    try:
        import oss2
        auth = oss2.Auth(access_key, secret_key)
        bucket_obj = oss2.Bucket(auth, endpoint, bucket)
        object_name = f"reading-room-backups/{gz_path.name}"
        bucket_obj.put_object_from_file(object_name, str(gz_path))
        log(f"  [+] Uploaded to OSS: {object_name}")
        return True
    except ImportError:
        log("  [WARN] oss2 not installed — skipping OSS upload")
        return False
    except Exception as e:
        log(f"  [WARN] OSS upload failed: {e}")
        return False


def main():
    if "--list" in sys.argv:
        list_backups()
        return 0

    keep = DEFAULT_ROTATE
    for arg in sys.argv:
        if arg.startswith("--rotate="):
            keep = int(arg.split("=")[1])
        elif arg == "--rotate":
            idx = sys.argv.index(arg)
            if idx + 1 < len(sys.argv):
                keep = int(sys.argv[idx + 1])

    cron_mode = "--cron" in sys.argv

    gz_path = create_backup()
    if gz_path is None:
        return 1

    rotate_backups(keep)
    upload_to_oss(gz_path)

    if not cron_mode:
        log("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
