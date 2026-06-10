#!/bin/bash
# cron-sync.sh — 服务器端定时增量同步微信读书数据
# 前提: ~/.bashrc 中已设置 export WEREAD_API_KEY=wrk-xxxxxxxx
# crontab 范例:
#   0 */4 * * * bash ~/reading-site/scripts/cron-sync.sh >> ~/reading-site/logs/cron.log 2>&1

set -e

cd "$(dirname "$0")/.."

# 从 ~/.bashrc 加载环境变量（含 WEREAD_API_KEY）
if [ -f "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi

echo "=== $(date '+%Y-%m-%d %H:%M:%S') cron-sync start ==="
exec python3 scripts/sync.py --quick --restart
