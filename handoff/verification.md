# 验收记录

代码基线为作者公开仓库的 [`0716467`](https://github.com/CharlesGuooo/ai-pulse/tree/0716467)，人物配置与我们仓库 [10 月 2 日的版本](https://github.com/HaoooLee/ai-pulse/blob/6203331/scripts/influencers.json) 一致。

## 真实抓取

```bash
python scripts/fetch_data.py --handle jietang --limit 1 --output handoff/output/jietang.json
```

灵算的 Grok 4.7 返回唐杰 2026 年 11 月 4 日 23:23（北京时间）的帖子和中文解读。用 X 的公开嵌入接口核对了账号与帖子链接。帖子正文为 “GLM-5.3 is on T-Systems now....”。[X 原帖](https://x.com/jietang/status/2118001280048345450)

## 模拟全量更新

测试按 75 条配置走完原生分批流程，验证 `tweets.json`、`trending.json` 和 `academic.json` 的兼容格式。另模拟最后一步请求失败，确认三份旧文件内容均保留。
