# 服务器部署说明

## 日常更新

```bash
cd ~/reading-room
git pull origin main
pm2 restart reading-room
```

数据库（`db/reading-room.db`）在 git 中，pull 会自动更新。

---

## 补充最新想法数据

当微信读书有新的想法（点评）需要同步到网站时：

```bash
cd ~/reading-room
export WEREAD_API_KEY=wrk-xxxxxxxx
python scripts/migrate_reviews.py
```

脚本支持断点续跑，已有数据不会重复。

---

## 备份数据库（建议定期执行）

```bash
cp ~/reading-room/db/reading-room.db ~/reading-room/db/reading-room.db.bak.$(date +%Y%m%d)
```
