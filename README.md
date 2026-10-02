# AI Pulse

聚焦大模型与 AI Infra 的官方公开资讯，提供 Grok 中文摘要、分析及人物信源目录。

## 本地运行

需要 Node.js 22+、pnpm 10、Python 3.11+。

```bash
pnpm install --frozen-lockfile
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install requests
cp .env.example .env
pnpm dev
```

填写 `.env`：`DATABASE_URL`、`JWT_SECRET` 和 `ADMIN_PASSWORD_HASH` 用于登录；admin 密码由 bcrypt 哈希配置，不默认使用 `123`。`PACKY_API_BASE`、`PACKY_API_KEY`、`PACKY_MODEL` 用于资讯分析。密钥不提交 Git。

## 更新资讯

```bash
pnpm news:update -- --dry-run
pnpm news:update
```

`官方 RSS → Python 采集 → PackyAPI 调用 Grok → client/public/data/news.json → 首页及人物页`。

- `scripts/public_sources.json`：公开 RSS/Atom 来源。
- `scripts/influencers.json`：人物目录；仅关联原文明确出现的作者、姓名或账号，不将机构公告冒充个人发言。
- 每批最多 3 条。模型结果校验 ID、数量及字段；来源或任一分析批次失败时，保留整份旧资讯。
- HTTP 429、暂时性服务错误和网络超时有限重试；鉴权错误不重试。
- 无个人公开来源不意味着该人物没有动态。当前流程不搜索 X。

## 自动更新与部署

GitHub Actions 每日北京时间 07:00 更新资讯，成功后提交正式数据并显式调用 Vercel 部署工作流。
GitHub Secrets：`PACKY_API_BASE`、`PACKY_API_KEY`、`PACKY_MODEL`、`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`。
Vercel 生产环境另需配置 `DATABASE_URL`、`JWT_SECRET`、`ADMIN_PASSWORD_HASH`。必须使用强密码及随机 JWT 密钥。
Vercel 构建会重新生成后端入口，登录 API 与静态前端一起部署。
旧 `scripts/fetch_data.py`、`retry_failed.py` 为历史 xAI 入口，不再用于定时更新。

## 验证

```bash
pnpm test:news
pnpm check
pnpm test
pnpm build
pnpm build:vercel
```
