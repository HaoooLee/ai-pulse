# 本地复现

前半部分记录提交 `eba3a04` 的修复前复现；本 PR 最终实现及验收见文末。当前运行说明以根目录 `README.md` 为准。

验证目录：`/home/lihao/worktrees/ai-pulse`。验证日期：2026-10-02。
代码提交：`eba3a04295b6487141efa5f0cf3e88f76019165d`。
环境：Node.js 24.14.1、pnpm 10.4.1、Python 3.11.7。

## 实际结果

- 类型检查通过，现有 9 个测试通过。
- 5 个官方公开来源各采集 1 条资讯。
- 当前项目的分析脚本加载旧配置后，调用 PackyAPI 的 `grok-4.6` 成功，生成 1 条摘要、分析和主题，原始 ID 保持一致。
- 当前登录源码加载同一份旧配置后，`admin / 123` 连续两次返回 HTTP 401。
- 密码比较：当前代码的 admin 哈希不匹配 `123`，旧目录的哈希匹配。
- 当前 HTTP Cookie 配置为 `SameSite=None; Secure=false`；旧目录已修改为 HTTP 使用 `Lax`。

## 复现资讯分析

在项目根目录运行。依赖已安装；首次使用需执行 `pnpm install --frozen-lockfile` 和 `python3 -m pip install requests`。

```bash
cd /home/lihao/worktrees/ai-pulse
pnpm check
pnpm test
python3 handoff/scripts/fetch_public_sources.py \
  --output tmp/reproduction-public-sources.json --per-source 1
```

加载旧目录的配置，使用**当前目录的脚本**分析已保存的输入：

```bash
node --env-file=/home/lihao/worktrees/old/ai-pulse/.env <<'JS'
const { execFileSync } = require('node:child_process');
const args = ['handoff/scripts/analyze_with_packy.py',
  '--input', 'tmp/reproduction-public-sources.json',
  '--output', 'tmp/reproduction-preview.json', '--limit', '1'];
execFileSync('python3', [...args, '--dry-run'], { stdio: 'inherit' });
execFileSync('python3', args, { stdio: 'inherit' });
JS
```

预期输出：`Dry run OK`，随后 `Wrote 1 items to tmp/reproduction-preview.json`。
正式调用会产生少量费用；dry-run 不调用模型。

结果：`tmp/reproduction-preview.json`。检查 items 数量为 1、ID 与输入第一条一致、summary 和 analysis 非空、topics 为数组。
重复验证时直接使用已保存的输入，不重新采集；模型文字可能变化，以这些字段条件判断成功。
此流程分析公开资讯，不负责获取 X 推文，也未接入前端正式数据。

## 复现登录差异

终端一启动当前源码，加载同一份旧配置：

```bash
NODE_ENV=development PORT=3189 pnpm exec tsx \
  --env-file=/home/lihao/worktrees/old/ai-pulse/.env server/_core/index.ts
```

终端二请求登录；若启动日志提示端口变化，使用实际端口：

```bash
curl -sS -o /dev/null -w '%{http_code}\n' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123"}' \
  http://localhost:3189/api/auth/login
```

当前版本预期返回 `401`。仅补齐配置不会改变源码中的密码哈希，也不会修复 Cookie。

## 待修复

- 登录：`admin / 123` 与当前密码哈希不匹配，稳定返回 `401`，非偶发；需统一账号配置与文档。验收：约定账号登录返回 `200`。
- Cookie：HTTP 下 `SameSite=None; Secure=false` 会被现代浏览器拒收，非偶发；需修正 HTTP Cookie 配置。验收：浏览器保存 Cookie，刷新后仍保持登录。当前因登录失败，尚未完成浏览器验收。

## 为什么两份项目结果不同

运行结果取决于代码内容、配置、依赖和外部服务，不取决于文件名是否相同。
旧目录有 `.env`，且账号与 Cookie 存在未提交的修改；新克隆不会获得这些内容。
本次只读取旧配置，未修改主程序、复制密钥或覆盖正式资讯；生成文件均在忽略提交的 `tmp/` 中。

## 本 PR 最终实现与验收

- 实际人物配置及 `handoff/influencers/influencers.json` 均为 75 条；原名单 25 人、补充 5 人全部覆盖。
- 正式链路：`scripts/update_news.py` → 官方 RSS → PackyAPI / Grok → `client/public/data/news.json` → 首页和人物页。当前正式数据为此前真实生成并校验的 3 条分析。
- 人物只关联原文明确作者、姓名或账号；机构公告不代表个人发言。未找到个人来源不等于人物没有动态。
- 任一来源或分析批次失败时，整份旧资讯保持不变；鉴权错误不重试，暂时性错误有限重试。
- 管理员密码通过 `ADMIN_PASSWORD_HASH` 配置；浏览器使用临时强密码完成真实登录，HTTP Cookie 为 Lax，刷新保持登录。密码和密钥未写入仓库。
- 10 项资讯流程测试、12 项后端测试、类型检查、本地与 Vercel 构建、actionlint 均通过。
- Chromium 实测：首页 3 条资讯、75 人目录、姓名/账号搜索通过；页面异常及站内失败请求均为 0。
- 真实 RSS 五个来源全部成功；本轮 PackyAPI 分析返回 HTTP 400，正式数据已确认未被覆盖。完整实时更新仍需修复服务商鉴权问题。
- 定时任务已切换至 RSS + PackyAPI，并显式调用 Vercel 部署；线上部署未执行，需配置 README 列出的 GitHub Secrets 与 Vercel 环境变量。

复核命令：`pnpm test:news`、`pnpm check`、`pnpm test`、`pnpm build`、`pnpm build:vercel`。真实刷新使用 `pnpm news:update`，会产生模型调用费用；`pnpm news:update -- --dry-run` 不调用模型或发布数据。
