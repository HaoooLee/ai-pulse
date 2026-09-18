# 独立资讯采集

该采集器只读取官方 RSS/Atom，不访问 X、不使用 Cookie，也不调用模型。

## 数据源

- OpenAI News
- Google DeepMind
- Google AI
- Hugging Face Blog
- arXiv `cs.AI`

数据源配置位于 `scripts/public_sources.json`，新增来源时填写名称、RSS/Atom URL 和分类。

## 采集

```bash
.venv/bin/python scripts/fetch_public_sources.py
```

默认每个来源获取 3 条，结果写入 `tmp/public-sources.json`。部分来源失败时记录错误并保留其他结果；全部失败时不覆盖旧文件。

## PackyAPI 分析

以下命令会产生模型费用，只分析 3 条：

```bash
.venv/bin/python scripts/analyze_with_packy.py \
  --input tmp/public-sources.json \
  --output tmp/public-sources-preview.json \
  --limit 3
```

确认预览内容和 JSON 结构后，再设计正式数据转换；当前流程不会覆盖前端数据。

## 验证结果

- 5 个来源全部成功。
- 每个来源采集 3 条，共 15 条。
- JSON 结构与链接校验通过。
- PackyAPI 输入 Dry Run 通过。
- 使用 `grok-4.6` 分析 3 条 OpenAI 官方资讯成功，摘要、分析和主题字段校验通过。
- 分析结果写入 `tmp/public-sources-preview.json`，未覆盖正式数据。
