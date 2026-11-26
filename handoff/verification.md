# 验收记录

代码基线为作者公开仓库的 [`0716467`](https://github.com/CharlesGuooo/ai-pulse/tree/0716467)，人物配置与我们仓库 [10 月 2 日的版本](https://github.com/HaoooLee/ai-pulse/blob/6203331/scripts/influencers.json) 一致。

## 真实抓取

```bash
python scripts/fetch_data.py --handle jietang --limit 1 --output handoff/output/jietang.json
```

灵算的 Grok 4.7 返回唐杰 2026 年 11 月 4 日 23:23（北京时间）的帖子和中文解读。用 X 的公开嵌入接口核对了账号与帖子链接。帖子正文为 “GLM-5.3 is on T-Systems now....”。[X 原帖](https://x.com/jietang/status/2118001280048345450)

## 模拟全量更新

8 项 Python 测试通过。测试按 75 条配置走完原生分批流程，验证 `tweets.json`、`trending.json` 和 `academic.json` 的兼容格式。另测试了仅补查批次漏掉的账号、用站点地址配置中转站，以及最后一步请求失败时保留三份旧文件。

## 最近一轮复验

75 人实网核验尝试了名单里的每个账号。6 人返回可核验的原帖，69 人所在的请求因连接或超时失败。该轮使用 40 秒请求上限，结果用于记录实网覆盖。脚本默认全量运行的真实验收仍待通过。

更新后的单账号命令使用 `https://api.lingsuan.si` 作为地址，复验时搜索接口返回 HTTP 403。独立的模型列表请求也返回 HTTP 403。单账号成功样例记录于上方。

已有的登录、Cookie 和 Vercel 修复已恢复。TypeScript 检查、12 项网站测试、网站构建和 Vercel 入口编译均通过。
