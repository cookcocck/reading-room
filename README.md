# 黄氏书房

> 基于微信读书 API 的个人阅读数据站——书架、划线、想法、阅读统计，一站式呈现。

---

## 功能

| 页面 | 路径 | 说明 |
|------|------|------|
| **书架** | `/` | 书籍列表，支持搜索、分类筛选 |
| **书籍详情** | `/book/:id` | 划线高亮 + 想法评论，双栏并排 |
| **笔记** | `/notebooks` | 有笔记的书籍卡片网格 + 最近笔记时间线 |
| **统计** | `/stats` | 阅读概览、月度时长、分类雷达图、深度思考榜、强度趋势、时间线、里程碑 |
| **关于** | `/about` | 项目说明 |

其他特性：
- 亮色/暗色主题切换（跟随系统偏好，可手动切换）
- 响应式布局，手机/平板/桌面适配
- 零外部图表依赖——雷达图、散点时间线均用纯 SVG 渲染

---

## 技术栈

| 层 | 技术 |
|----|------|
| 服务端 | Node.js + Express |
| 模板 | EJS + express-ejs-layouts |
| 数据库 | SQLite（通过 sql.js WASM 在 Node 端读取） |
| 样式 | 原生 CSS（CSS 变量 + Grid/Flexbox） |
| 部署 | PM2 |
| 数据源 | 微信读书 Agent API Gateway |

---

## 项目结构

```
reading-site/
├── server.js              # Express 主入口
├── src/
│   └── db.js              # 数据库层（sql.js）
├── views/
│   ├── layout.ejs         # 全局布局
│   ├── index.ejs          # 书架首页
│   ├── book.ejs           # 书籍详情
│   ├── notebooks.ejs      # 笔记页
│   ├── stats.ejs          # 统计页
│   ├── bookshelf.ejs      # 书架列表
│   └── about.ejs          # 关于页
├── public/
│   ├── css/main.css        # 全局样式
│   └── js/
│       ├── main.js         # 前端交互
│       └── heatmap.js      # 热力图渲染
├── scripts/
│   ├── sync.py             # 定时增量同步（cron）
│   ├── migrate_reviews.py  # 想法数据迁移
│   ├── fetch_notes.py      # 批量获取笔记正文
│   └── create_db.py        # 从 JSON 初始化数据库
├── db/
│   └── reading-room.db     # SQLite 数据库（纳入版本控制）
├── logs/                   # 同步日志
├── package.json
├── ecosystem.config.json   # PM2 配置
├── DEPLOY.md               # 部署说明
└── README.md
```

---

## 快速开始

### 前置条件

- Node.js >= 18
- Python >= 3.9（用于数据同步脚本）
- 微信读书 API Key（`WEREAD_API_KEY`）

### 本地开发

```bash
# 克隆仓库
git clone <repo-url> reading-site
cd reading-site

# 安装 Node 依赖
npm install

# 设置 API Key
export WEREAD_API_KEY=wrk-xxxxxxxx

# 启动开发服务器
npm start
# → http://localhost:3000
```

数据库文件 `db/reading-room.db` 已随仓库分发，无需额外初始化。

### 生产部署

详见 [DEPLOY.md](./DEPLOY.md)。

```bash
# PM2 启动
pm2 start ecosystem.config.json
pm2 save
```

---

## 数据同步

### 定时同步（推荐）

通过 cron 每 4 小时增量同步微信读书数据：

```bash
crontab -e
# 添加：
0 */4 * * * . $HOME/.bashrc; cd $HOME/reading-site && python3 scripts/sync.py --quick --restart >> logs/sync.log 2>&1
```

### 手动同步

```bash
# 增量同步（仅笔记数变化的书）
python3 scripts/sync.py --quick --restart

# 全量同步
python3 scripts/sync.py --restart
```

### 数据迁移

首次从 API 拉取想法/评论数据：

```bash
python3 scripts/migrate_reviews.py
```

首次从 JSON 构建数据库：

```bash
python3 scripts/create_db.py
```

---

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `WEREAD_API_KEY` | 是 | 微信读书 Agent API 密钥 |
| `NODE_ENV` | 否 | `production` 时启用缓存等优化 |
| `PORT` | 否 | 服务端口，默认 3000 |

---

## 配色方案

| 用途 | 亮色 | 暗色 |
|------|------|------|
| 主色调（accent） | `#1a2744` | `#8db4f0` |
| 辅色调（warm） | `#c47453` | `#e0a48a` |
| 背景 | `#faf9f6` | `#121418` |
| 纸张色 | `#ffffff` | `#1b1d24` |

---

## License

个人项目，自用为主。
