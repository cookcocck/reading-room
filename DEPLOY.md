# 服务器部署说明

## 日常更新

```bash
cd ~/reading-site
git pull origin main
pm2 restart reading-room
```

数据库（`db/reading-room.db`）在 git 中，pull 会自动更新。

---

## 首次部署

```bash
# 1. 克隆仓库
cd ~
git clone <repo-url> reading-site
cd reading-site

# 2. 安装依赖
npm install

# 3. 设置环境变量
export WEREAD_API_KEY=wrk-xxxxxxxx

# 4. 初始化数据库（首次需要从 JSON 构建）
python scripts/create_db.py

# 5. 启动服务
pm2 start ecosystem.config.json
pm2 save
```

---

## 自动同步微信读书数据（每 2 小时）

使用 `scripts/sync.py` 通过 API 增量拉取书架、划线和想法，更新到数据库。
包装脚本 `scripts/cron-sync.sh` 负责加载环境变量、日志轮转和 PM2 重启。

```bash
# 设置环境变量（写入 ~/.bashrc 使其持久化）
echo 'export WEREAD_API_KEY=wrk-xxxxxxxx' >> ~/.bashrc
source ~/.bashrc
```

### 设置 crontab（每 2 小时执行）

```bash
# 编辑 crontab
crontab -e

# 添加以下行：
0 */2 * * * bash ~/reading-site/scripts/cron-sync.sh
```

> **注意**：cron 脚本内部已将输出重定向到 `logs/sync.log`，crontab 行不需要再重定向。

### 测试 cron 脚本

```bash
# 在设置 crontab 之前，先手动运行确认脚本正常工作：
bash ~/reading-site/scripts/cron-sync.sh
```

### 手动运行

```bash
# 完整同步（首次或强制刷新所有数据）
cd ~/reading-site
python3 scripts/sync.py --restart

# 增量同步（仅同步笔记数变化的书，日常用）
python3 scripts/sync.py --quick --restart
```

参数说明：
- `--quick`：增量模式，只刷新笔记计数有变化的书籍（日常推荐）
- `--restart`：同步完成后自动 `pm2 restart reading-room` 使服务加载新数据

### 查看同步日志

```bash
tail -f ~/reading-site/logs/sync.log

# 查看数据库中的同步历史
sqlite3 ~/reading-site/db/reading-room.db "SELECT * FROM sync_log ORDER BY id DESC LIMIT 5;"
```

---

## 备份数据库（建议每天执行）

```bash
cp ~/reading-site/db/reading-room.db ~/reading-site/db/reading-room.db.bak.$(date +%Y%m%d)
```
