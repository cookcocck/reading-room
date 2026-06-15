# 数据架构与同步流程分析

> 2026-06-15 梳理

---

## 一、数据全景图

### 两类数据源

| 类型 | 来源 | 包含的表 | 能否从零重建 |
|------|------|---------|-------------|
| **API 数据** | 微信读书 API Gateway | books, highlights, reviews, notebooks, sync_log | ✅ 能，sync.py 全覆盖 |
| **计算/静态数据** | 本地 JSON 文件 (src/data/*.json) | reading_sessions, reading_trends, summary, kv_store, tags, note_tags, highlights_fts | ❌ 不能，JSON 文件不在 git 中 |

### 全部 12 张表及其数据来源

| 表 | 来源 | 创建者 | 风险等级 |
|----|------|--------|---------|
| `books` | API (书架同步) | sync.py | 🟢 可重建 |
| `highlights` | API (划线) | sync.py | 🟢 可重建 |
| `reviews` | API (想法) | sync.py | 🟢 可重建 |
| `notebooks` | API (笔记本统计) | sync.py | 🟢 可重建 |
| `sync_log` | 本地 (运行记录) | sync.py | 🟡 丢了无所谓 |
| `reading_sessions` | 本地 JSON | create_db.py | 🔴 不可重建 |
| `reading_trends` | 本地 JSON | create_db.py | 🔴 不可重建 |
| `summary` | 本地 JSON | create_db.py | 🔴 不可重建 |
| `kv_store` | 本地 JSON | create_db.py | 🔴 不可重建 |
| `tags` | 用户手动创建 | create_db.py / db.js | 🟡 可手动重建 |
| `note_tags` | 用户手动关联 | create_db.py / db.js | 🟡 可手动重建 |
| `highlights_fts` | FTS5 索引 | create_db.py | 🟢 可从 highlights 重建 |

---

## 二、已发生的问题时间线

```
1. 服务器 rm -f db/reading-room.db  ← 删库
2. python3 scripts/sync.py --restart  ← 只建了 5 张表 (旧版 sync.py)
3. PM2 重启 → 500 错误: "no such table: summary"  ← 缺表
4. 修复: sync.py 补充建表语句(本次会话)  ← 表有了，但数据为空
5. 首页热力图/统计全空  ← reading_sessions 等表是空的
6. 从本地 SCP 上传完整 DB  ← 恢复
```

**根因**: 
- 删库后只用 sync.py 重建，缺失 7 张表及其数据
- 数据源 JSON 文件不在 git 仓库中，服务器上根本不存在

---

## 三、当前架构的 5 个致命缺陷

### 缺陷 1：建表逻辑三处分散，无单一真相源

| 文件 | 建的表 | 是否完整 |
|------|--------|---------|
| `create_db.py` | 全部 12 张表 + FTS5 | ✅ 完整 |
| `sync.py` ensure_tables() | 9 张表 (缺 tags, note_tags, highlights_fts) | ❌ 不完整 |
| `db.js` initDb() | 6 张表 (缺 notebooks, sync_log, highlights_fts) | ❌ 不完整 |

**风险**: 改表结构时要同步改三处，必有遗漏。

### 缺陷 2：`.gitignore` 排除了数据源和数据库

```gitignore
src/data/     ← create_db.py 的输入 JSON 文件，不在版本控制
db/           ← SQLite 数据库不在版本控制
```

但 `DEPLOY.md` 却写着「数据库（db/reading-room.db）在 git 中，pull 会自动更新」—— 与实际矛盾。

### 缺陷 3：删库无备份

`rm -f db/reading-room.db` 是永久性操作，没有自动备份。sync.py 也没有在运行前备份。

### 缺陷 4：计算数据无法从 API 重建

`reading_sessions`、`reading_trends`、`summary`、`kv_store` 的数据来自本地 JSON 文件，而这些 JSON 文件的来源不可追溯——它们很可能是一次性手动导出或通过某个已丢弃的脚本生成的。

### 缺陷 5：sync.py 假定了数据库一定存在

旧版 sync.py 在数据库不存在时直接 exit，新版虽然能自动创建目录和空表，但建出的表是空的。

---

## 四、推荐修复方案

### 修复 1：统一 Schema 文件（单一真相源）

创建 `scripts/schema.sql`，包含所有表的完整 DDL：

```sql
-- 所有表定义集中在此文件
-- create_db.py、sync.py、db.js 均从此文件读取或引用
```

所有脚本的建表逻辑改为读取这个文件。

### 修复 2：sync.py 运行前自动备份

```python
# 在 ensure_tables() 之前
backup_path = DB_PATH.with_suffix('.db.bak')
shutil.copy2(DB_PATH, backup_path)
```

### 修复 3：确保核心数据不丢失

**关键原则**: sync.py 永远不删除数据库文件，只在已有数据库上做 UPSERT。  
如果需要重建，必须明确指定 `--fresh` 参数且有二次确认。

### 修复 4：把 src/data/ JSON 纳入版本控制

或者更好：写一个 `scripts/rebuild_computed.py` 脚本，从 API 数据 + books 表重新计算 reading_sessions、trends、summary 等。

这样即使丢了全部计算数据，也能从 API 数据重建。

### 修复 5：修正 .gitignore 与 DEPLOY.md 的矛盾

- 要么把 `db/` 从 .gitignore 中移除（数据库随代码版本控制）
- 要么更新 DEPLOY.md 明确说明数据库需要单独备份/传输

---

## 五、安全运维 Checklist

部署/更新时应该遵循的顺序：

```
□ 1. git pull (更新代码)
□ 2. 数据库自动备份 (sync.py 内置)
□ 3. python3 scripts/sync.py (增量同步)
□ 4. pm2 restart reading-room
```

**永远不要**在服务器上执行 `rm -f db/reading-room.db` 除非：
- 你有一个确认可用的完整备份
- 你确认 `src/data/` 目录下的 JSON 文件完整存在
- 或者你已经从本地上传了完整数据库文件
