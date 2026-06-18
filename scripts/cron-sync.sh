#!/usr/bin/env bash
# ─── WeRead 自动同步脚本（cron 调用） ───────────────────────────────────────
# 用法：由 crontab 自动调用，或手动执行 bash scripts/cron-sync.sh
#
# 功能：
#   - 增量拉取微信读书数据（书架 + 笔记本 + 划线 + 想法）
#   - 更新 SQLite 数据库
#   - 同步完成后自动重启 PM2 Node.js 服务加载新数据
#   - 日志写入 logs/sync.log（自动轮转，保留最近 7 天）
#
# 日志查看：
#   tail -f ~/reading-site/logs/sync.log
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── 路径配置 ───────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$ROOT_DIR/logs/sync.log"
LOG_MAX_DAYS=7

# ─── 环境变量加载 ─────────────────────────────────────────────────────────
# 尝试从 ~/.bashrc、~/.bash_profile 或 .env 加载环境变量
# （cron 环境不会自动加载 shell 配置）
for env_file in "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile" "$ROOT_DIR/.env"; do
    if [ -f "$env_file" ]; then
        # 只提取 WEREAD_API_KEY 和 PM2_APP_NAME，避免 source 整个 shell 配置的副作用
        set +u
        eval "$(grep -E '^export (WEREAD_API_KEY|PM2_APP_NAME)=' "$env_file" 2>/dev/null || true)"
        set -u
    fi
done

# ─── 前置检查 ───────────────────────────────────────────────────────────────
if [ -z "${WEREAD_API_KEY:-}" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: WEREAD_API_KEY not set. Aborting." | tee -a "$LOG_FILE"
    exit 1
fi

# ─── 日志轮转（删除 7 天前的旧日志条目，保留文件） ─────────────────────
# 简单方案：超过 50MB 则备份并清空
LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt $((50 * 1024 * 1024)) ]; then
    mv "$LOG_FILE" "${LOG_FILE}.$(date +%Y%m%d-%H%M%S).bak"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Log rotated." > "$LOG_FILE"
    # 删除 7 天前的备份
    find "$(dirname "$LOG_FILE")" -name "sync.log.*.bak" -mtime +$LOG_MAX_DAYS -delete 2>/dev/null || true
fi

# ─── 执行同步 ───────────────────────────────────────────────────────────────
echo "" >> "$LOG_FILE"
echo "════════════════════════════════════════════════════════════" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cron sync triggered" >> "$LOG_FILE"

# 切换到项目根目录
cd "$ROOT_DIR"

# ─── TypeScript 编译（dist/ 不进 git，每次同步前重编译） ──────────
if [ -f "$ROOT_DIR/node_modules/.bin/tsc" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compiling TypeScript..." >> "$LOG_FILE"
    "$ROOT_DIR/node_modules/.bin/tsc" 2>&1 | tee -a "$LOG_FILE" || true
fi

# 使用 Python3，优先用虚拟环境
PYTHON="python3"
if [ -f "$ROOT_DIR/venv/bin/python3" ]; then
    PYTHON="$ROOT_DIR/venv/bin/python3"
elif [ -f "$ROOT_DIR/.venv/bin/python3" ]; then
    PYTHON="$ROOT_DIR/.venv/bin/python3"
fi

# 执行增量同步 + 同步完成后重启 PM2
export WEREAD_API_KEY
export PM2_APP_NAME="${PM2_APP_NAME:-reading-room}"

"$PYTHON" scripts/sync.py --quick --restart 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cron sync finished (exit code: $EXIT_CODE)" >> "$LOG_FILE"
echo "────────────────────────────────────────────────────────────" >> "$LOG_FILE"

exit $EXIT_CODE
