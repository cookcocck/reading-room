# 阅读书房 — 部署指南

支持阿里云、腾讯云多种部署方式。项目基于 Node.js + Express + EJS，数据来自微信读书 API。

## 项目结构

```
reading-site/
├── server.js          # Express 服务入口
├── package.json       # 仅 2 个依赖（express + ejs）
├── Dockerfile         # Alpine + Node 20
├── ecosystem.config.json  # PM2 部署配置
├── public/
│   ├── css/main.css   # CSS 设计系统
│   └── js/main.js     # 客户端脚本
├── views/             # EJS 模板（5 页）
└── src/data/          # 静态数据（5 个 JSON）
```

---

# 阿里云部署

## 方式一：轻量应用服务器（推荐，最省事）

最适合个人项目，预装应用镜像或系统镜像，开通即用。

### 1. 购买服务器

控制台 → 轻量应用服务器 → 创建实例：
- 地域：就近选择（如 华东1 杭州）
- 镜像：选择「应用镜像」→ Node.js，或「系统镜像」→ Ubuntu 22.04
- 套餐：最低配 2核1G 即可（约 34 元/月）
- 购买时长：月付或年付

### 2. 上传项目

在轻量服务器控制台 → 远程连接 → 文件管理，拖拽上传整个 `reading-site/` 目录到 `/home/admin/`。

或本机 SCP 上传（先重置密码或绑定密钥对）：

```bash
scp -r reading-site/ root@<服务器公网IP>:/home/admin/
```

### 3. 安装 Node.js（若选系统镜像）

SSH 登录服务器：

```bash
ssh root@<服务器公网IP>

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 验证
node -v   # 应输出 v20.x
npm -v
```

### 4. 安装 PM2 并启动

```bash
cd /home/admin/reading-site
npm install --production
npm install -g pm2
pm2 start server.js --name reading-room
pm2 save
pm2 startup   # 设置开机自启，按提示执行输出的命令
```

### 5. 配置防火墙

轻量服务器控制台 → 防火墙 → 添加规则：
- 端口 80（HTTP）
- 端口 443（HTTPS）
- 来源：0.0.0.0/0

### 6. 配置 Nginx 反向代理 + 域名 + SSL

```bash
apt-get install -y nginx certbot python3-certbot-nginx
```

创建 Nginx 配置：

```bash
vim /etc/nginx/sites-available/reading-room
```

```nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/reading-room /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

启用 SSL（证书免费）：

```bash
certbot --nginx -d 你的域名
# 按提示输入邮箱，选自动重定向 HTTP→HTTPS
```

完成后通过 `https://你的域名` 访问。

---

## 方式二：ECS 云服务器

与轻量服务器步骤几乎一致。额外注意：

1. **安全组**：控制台 → ECS 实例 → 安全组 → 配置规则 → 入方向放行 22、80、443 端口
2. **系统盘**：建议 40GB 起步
3. **公网 IP**：分配弹性公网 IP（EIP），避免重启 IP 变化

其余步骤（上传、安装 Node/PM2/Nginx/Certbot）同上。

---

## 方式三：SAE（Serverless 应用引擎，零运维）

适合不想管服务器的场景，自动扩缩容。

### 1. 准备工作

```bash
# 安装阿里云 CLI
# https://help.aliyun.com/document_detail/121541.html

# 安装 SAE 组件
aliyun sae
```

### 2. 创建应用

控制台 → SAE → 创建应用：
- 技术栈：Node.js
- 运行环境：Node.js 20
- 部署方式：上传 ZIP 包
- 启动命令：`node server.js`
- 监听端口：`3000`（SAE 会自动注入 PORT 环境变量，`server.js` 已支持）

### 3. 打包上传

```bash
cd reading-site/
# 只打包需要的文件
zip -r reading-room.zip . -x "node_modules/*" ".git/*"

# 在 SAE 控制台上传，或 CLI：
aliyun sae DeployApplication --AppId <应用ID> --PackageUrl "https://..."
```

### 4. 绑定域名

SAE 控制台 → 应用详情 → 域名绑定 → 添加自定义域名 → 按提示配置 CNAME + SSL 证书（阿里云免费证书）。

---

## 方式四：容器服务 ACK / ACR（Docker 部署）

### 1. 构建并推送镜像到阿里云容器镜像服务

```bash
# 登录阿里云 Docker Registry
docker login --username=<阿里云账号> registry.cn-hangzhou.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/<命名空间>/reading-room:latest .

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/<命名空间>/reading-room:latest
```

### 2. 在轻量服务器或 ECS 上拉取运行

```bash
docker login --username=<阿里云账号> registry.cn-hangzhou.aliyuncs.com
docker pull registry.cn-hangzhou.aliyuncs.com/<命名空间>/reading-room:latest
docker run -d -p 3000:3000 --name reading-room --restart always registry.cn-hangzhou.aliyuncs.com/<命名空间>/reading-room:latest
```

---

# 腾讯云部署

## CloudBase 云托管

```bash
npm i -g @cloudbase/cli
tcb login
tcb hosting deploy ./ -e <环境ID>
```

## 轻量应用服务器（Lighthouse）

流程与阿里云轻量服务器一致，防火墙在控制台「防火墙」tab 配置。

---

# 数据更新

当前数据为微信读书 API 快照。更新流程：

1. 在本地重新运行 `parse_data.py` 拉取最新数据
2. 将 `src/data/*.json` 上传覆盖：
   ```bash
   scp src/data/*.json root@<IP>:/home/admin/reading-site/src/data/
   ```
3. 重启服务：
   ```bash
   ssh root@<IP> "pm2 restart reading-room"
   ```

---

# 成本预估

| 服务 | 最低配置 | 月费 |
|------|---------|------|
| 阿里云轻量服务器 | 2核1G | ~34 元 |
| 阿里云 ECS（共享型） | 2核2G | ~68 元 |
| 阿里云 SAE | 按量 | ~50-100 元 |
| 域名（.com） | — | ~60 元/年 |

个人网站推荐：**阿里云轻量服务器 2核1G + .com 域名**，总成本约 40 元/月。
