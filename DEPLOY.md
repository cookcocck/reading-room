# 服务器部署说明

## ⚠️ 重要说明

**数据库文件 (`db/reading-room.db`) 不在 git 中。** 这是有意为之——SQLite 二进制文件不能合并，应该通过以下方式管理：

- **日常更新**：代码 push/pull 即可，数据库文件不需要动
- **首次部署**：需要从本地传输数据库文件到服务器
- **灾难恢复**：使用 `rebuild_computed.py` 从 API 重建

---

## 日常更新

```bash
cd ~/reading-site
git pull origin main
npm install                # 依赖有变更时才需要
npx tsc                    # TypeScript 编译 → dist/
pm2 restart reading-room
```

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
echo 'export WEREAD_API_KEY=wrk-xxxxxxxx' >> ~/.bashrc
source ~/.bashrc

# 4. 传输数据库文件（从本地）
# 在本地执行:
#   scp C:\path\to\reading-room\db\reading-room.db root@服务器IP:/home/admin/reading-site/db/
#
# 或者通过阿里云控制台 → 远程连接 → 发送文件上传

# 5. 同步最新数据 + 重建计算表
python3 scripts/sync.py
python3 scripts/rebuild_computed.py

# 6. 启动服务
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

# 重建计算表（热力图、趋势、汇总——sync.py 只能建表不能填数据）
python3 scripts/rebuild_computed.py
```

参数说明：
- `--quick`：增量模式，只刷新笔记计数有变化的书籍（日常推荐）
- `--restart`：同步完成后自动 `pm2 restart reading-room` 使服务加载新数据
- `rebuild_computed.py --local`：仅从数据库本地计算 summary（不调 API）
- `rebuild_computed.py --dry-run`：仅打印将要做什么，不写入

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

> sync.py 每次运行前会自动创建带时间戳的备份文件（`*.db.bak.*`），建议定期清理旧备份：`find ~/reading-site/db/ -name "*.db.bak.*" -mtime +7 -delete`

---

## 灾难恢复：数据库损坏或丢失

**🚨 不要直接 `rm -f db/reading-room.db`！**

如果数据库确实需要重建：

```bash
cd ~/reading-site

# 1. 从本地传输完整备份（首选方案）
#    在本地: scp reading-room.db root@服务器IP:/home/admin/reading-site/db/

# 2. 如果没有备份，从 API 重建（会丢失热力图等历史数据）
python3 scripts/sync.py                    # 拉取书架/笔记
python3 scripts/rebuild_computed.py        # 重建计算表

# 3. 重启
pm2 restart reading-room
```

> **注意**: `sync.py` 能从 API 重建 books/highlights/reviews/notebooks，  
> 但 `reading_sessions`（每日热力图）和 `kv_store`（聚合数据）  
> 需要 `rebuild_computed.py` 从 `/readdata/detail` API 提取，  
> 如果 API 不返回这些字段，则无法完全恢复。  
> **所以务必备份数据库文件。**
