# 关注人物名单维护

配置文件：`scripts/influencers.json`。当前为 84 人、11 个分类。

该名单用于保留和扩展人物配置，不代表系统已经能够自动获取这些人的 X 内容。

## 添加人物

```json
{
  "name": "人物姓名",
  "handle": "X用户名，不带@",
  "role": "身份和关注方向",
  "category": "llm_research",
  "highlight": false
}
```

要求：

- `handle` 与 X 用户名一致且不能重复。
- `category` 必须存在于 `categories`。
- `highlight` 默认使用 `false`。

## 添加分类

```json
"ai_agents": {
  "name": "AI Agent",
  "icon": "🧩",
  "color": "#2563EB",
  "group": "学术信息源"
}
```

前端动态读取分类，无需修改页面代码。

## 校验

```bash
jq empty scripts/influencers.json
jq -r '.influencers[].handle | ascii_downcase' scripts/influencers.json | sort | uniq -d
jq -e 'all(.influencers[]; .category as $c | .categories[$c] != null)' scripts/influencers.json
```

第二条无输出表示没有重复；第三条返回 `true` 表示分类有效。

自动获取 X 需要独立的官方或授权数据源。PackyAPI 只能分析已有内容。
