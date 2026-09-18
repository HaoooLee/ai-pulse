# AI Pulse：安装、运行与扩展

AI Pulse 当前采用两段式流程：

```text
官方公开数据源 → 原始 JSON → PackyAPI 分析 → 预览 JSON
```

采集与分析分开：来源失败时不调用模型，模型失败时不覆盖旧文件。

## 完成范围

已完成：

- 项目安装、构建和测试。
- Neon 数据库迁移。
- `admin / 123` 登录与状态保持。
- 收藏新增、查询和删除。
- 关注名单由 71 人扩展至 84 人。
- 5 个官方来源采集 15 条资讯。
- PackyAPI 分析 3 条资讯并生成合格 JSON。

未完成：

- 分析结果尚未转换为前端正式数据。
- 未实现 X 自动采集；PackyAPI 不提供 `x_search`。

## 安装

需要 Git、Node.js 22+、pnpm 10 和 Python 3.11+。

```bash
git clone https://github.com/HaoooLee/ai-pulse.git
cd ai-pulse
pnpm install --frozen-lockfile
python3 -m venv .venv
source .venv/bin/activate
pip install requests
```

## 配置

创建 `.env`：

```dotenv
PORT=3000
JWT_SECRET=<openssl rand -hex 32 的输出>
DATABASE_URL=<Neon PostgreSQL 连接地址>

PACKY_API_BASE=https://cf.api.fan/v1
PACKY_API_KEY=<PackyAPI 令牌>
PACKY_MODEL=grok-4.6
```

数据库使用新加坡区域，并执行：

```bash
pnpm db:push
```

本地测试账号：

```text
用户名：admin
密码：123
```

该弱密码仅限本机，禁止公网使用。

## 启动与验证

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

访问 `http://localhost:3000`，确认登录、刷新保持状态和收藏增删查。

## 独立采集

```bash
.venv/bin/python scripts/fetch_public_sources.py
```

脚本读取 OpenAI、Google DeepMind、Google AI、Hugging Face 和 arXiv 的官方 RSS/Atom，输出：

```text
tmp/public-sources.json
```

它不访问 X、不使用 Cookie、不调用模型。

## 使用 PackyAPI

### 1. 明确职责

PackyAPI 只接收已有文本并生成摘要、分析和主题。它不负责搜索或抓取 X。

### 2. 配置令牌

在 PackyAPI 控制台创建低额度令牌，将 Base URL、Key 和模型写入 `.env`。Key 只保存在服务端，不写入代码或文档。

### 3. 离线检查

```bash
.venv/bin/python scripts/analyze_with_packy.py \
  --input tmp/public-sources.json \
  --limit 3 \
  --dry-run
```

该步骤只检查输入和环境变量，不产生费用。

### 4. 发起最小调用

```bash
.venv/bin/python scripts/analyze_with_packy.py \
  --input tmp/public-sources.json \
  --output tmp/public-sources-preview.json \
  --limit 3
```

内部使用 OpenAI 兼容接口：

```text
POST https://cf.api.fan/v1/chat/completions
Authorization: Bearer <PACKY_API_KEY>
```

### 5. 检查结果

```bash
jq . tmp/public-sources-preview.json
```

确认数量、摘要、分析、主题和原始 ID 正确后，才能进入下一步。当前脚本不会覆盖前端正式数据。

## 扩展

- 数据源：编辑 `scripts/public_sources.json`。
- 关注人物：编辑 `scripts/influencers.json`。
- 每次修改后验证 JSON、重复账号和分类引用。
- 新数据先写入 `tmp/`，人工检查后再进入正式数据。

## 风险边界

- 不使用登录 Cookie 或非授权 X 爬虫。
- 只向模型发送公开内容。
- 数据库地址、Cookie 和其他密钥不得进入模型请求。
- PackyAPI 支持兼容接口，但不支持 Grok 后端搜索。
- 模型请求会产生费用，先用 3 条和低额度令牌验证。
- `.env`、`.venv/`、`node_modules/`、`dist/`、`tmp/` 不提交 Git。

## 文档

- `docs/LOCAL_INSTALL.md`：本地安装。
- `docs/INFLUENCERS_GUIDE.md`：关注名单维护。
- `docs/PACKYAPI_RESEARCH.md`：PackyAPI 能力边界。
- `docs/PUBLIC_SOURCES_GUIDE.md`：官方来源采集。
