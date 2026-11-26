# AI Pulse 运行与交接

在仓库根目录使用 Python 3.11+。首次使用按第 1 节配置，然后复制第 2 节的一行命令。

## 1. 安装和配置

```bash
python -m pip install requests
```

现在使用支持 Grok X Search 的灵算中转站，配置读取 `XAI_*` 环境变量。旧 RSS／PackyAPI 流程原来用的 `PACKY_*` 随旧脚本移除。

| 变量 | 用途 | 灵算示例 |
|---|---|---|
| `XAI_API_KEY` | 支持 Grok X Search 的 Key | 你的 Key |
| `XAI_API_BASE` | HTTPS 基础地址，末尾的 `/v1` 可省略 | `https://api.lingsuan.si` |
| `XAI_MODEL` | 搜索和解读用的模型 | `grok-4.7` |

PowerShell

```powershell
$env:XAI_API_BASE = 'https://api.lingsuan.si'
$env:XAI_MODEL = 'grok-4.7'
$env:XAI_API_KEY = '填入你的 Key'
```

Bash

```bash
export XAI_API_BASE=https://api.lingsuan.si
export XAI_MODEL=grok-4.7
export XAI_API_KEY='填入你的 Key'
```

接口地址填写站点地址或以 `/v1` 结尾的基础地址。脚本会分别请求 `/v1/responses` 和 `/v1/chat/completions`。Key 放在当前终端或 Actions Secrets。网页登录单独使用根目录的 [`.env.example`](../.env.example) 配置。

## 2. 一行抓取并验收

```bash
python scripts/fetch_data.py --handle jietang --limit 1 --output handoff/output/jietang.json
```

成功时终端打印 `Wrote 1 recent posts for @jietang`。打开输出的 `recent_posts[0]`，用 `tweet_url` 核对作者和原帖。`posted_at` 是 UTC 时间，`content_summary` 和 `ai_analysis` 是中文摘要和解读。打印 `Wrote 0` 表示本次搜索未核实到帖子。已验证的样例见[验收记录](verification.md)。

`--handle` 从 [人物配置](../scripts/influencers.json) 选，`--limit` 可设为 1 至 10。省略预览路径时输出到 `handoff/output/<账号>.json`。抓取或校验失败会报错退出，旧文件保留。遇到 HTTP 401 或 403 时先核对地址、Key 和模型是否属于同一个中转站。

## 3. 运行原版全量流程

```bash
python scripts/fetch_data.py --output handoff/output/full
```

该命令按名单分批抓取，输出原版的 `tweets.json`、`trending.json`、`academic.json` 到验收目录。直接运行 `python scripts/fetch_data.py` 时，三份数据写入原版网页读取的 `client/public/data/`。

现有 GitHub Actions 读取同名配置。Key 放在 Actions Secrets，接口地址和模型放在 Actions Variables。

## 4. 扩展人物

编辑 [`scripts/influencers.json`](../scripts/influencers.json) 的 `influencers` 数组。按同类条目填写 `name`、`handle`、`role`、`category` 和 `highlight`。`handle` 用本人确认的 X 用户名，`category` 选已有分类。保存后，用第 2 节的命令替换为该账号试跑。现有 75 条来自 [10 月 2 日核验记录](influencers-review.md)。

## 检查

```bash
python -B -m unittest discover -s handoff/tests
```

测试使用模拟响应，覆盖名单、参数、原帖校验、全量输出和失败保留旧数据。
