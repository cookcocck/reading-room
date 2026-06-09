# 服务器部署说明

## 数据库说明

`db/reading-room.db` **不在 git 里**（已加入 .gitignore）。

这意味着：
- `git pull` 不会覆盖服务器上的数据库 ✅
- 每次 `pm2 restart` 后 reviews 数据不会丢失 ✅
- 首次部署或数据库丢失时，需要手动恢复 ↓

---

## 首次部署（或数据库丢失时）

### 方法 A：从备份恢复（推荐）

如果有旧的 `reading-room.db` 备份，直接放回 `db/` 目录：

```bash
cp /path/to/backup/reading-room.db ~/reading-room/db/reading-room.db
pm2 restart reading-room
```

### 方法 B：用本地数据库覆盖服务器

在**本机**（有 `src/data/` JSON 源文件的机器）运行：

```bash
# 1. 生成最新数据库
python scripts/create_db.py

# 2. 上传到服务器
scp db/reading-room.db user@server:~/reading-room/db/reading-room.db
```

然后在服务器上迁移 reviews：

```bash
cd ~/reading-room
export WEREAD_API_KEY=wrk-xxxxxxxx
python scripts/migrate_reviews.py
pm2 restart reading-room
```

---

## 日常更新流程

```bash
cd ~/reading-room
git pull origin main       # 只更新代码，不影响数据库
pm2 restart reading-room   # 重启服务
```

如需补充最新 reviews 数据：

```bash
export WEREAD_API_KEY=wrk-xxxxxxxx
python scripts/migrate_reviews.py   # 支持断点续跑，已有数据不会重复
```

---

## 备份数据库（建议定期执行）

```bash
cp ~/reading-room/db/reading-room.db ~/reading-room/db/reading-room.db.bak.$(date +%Y%m%d)
```
