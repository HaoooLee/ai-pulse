# AI Pulse 本地安装

验证环境：Ubuntu、Node.js 24、pnpm 10.4.1、Python 3.11。

## 安装

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
DATABASE_URL=<Neon PostgreSQL 地址>

PACKY_API_BASE=https://cf.api.fan/v1
PACKY_API_KEY=<PackyAPI 令牌>
PACKY_MODEL=grok-4.6
```

执行数据库迁移：

```bash
pnpm db:push
```

本地测试账号为 `admin / 123`。密码以 bcrypt 哈希保存在 `server/_core/oauth.ts`；公网部署前必须替换。

## 启动

开发模式：

```bash
pnpm dev
```

生产模式：

```bash
pnpm build
pnpm start
```

访问 `http://localhost:3000`。端口被占用时，程序自动尝试 3001–3019。

## 验证

```bash
pnpm check
pnpm test
pnpm build
```

确认：

1. 首页正常打开。
2. `admin / 123` 登录成功。
3. 刷新后保持登录。
4. 收藏可以新增、查询和删除。

## 已知边界

- Neon 建议选择新加坡区域；美国节点在当前网络出现过超时。
- PackyAPI 不支持 `x_search`，不能替代 X 数据源。
- PackyAPI 调用会产生费用。
- `.env` 包含密钥，禁止提交 Git。
