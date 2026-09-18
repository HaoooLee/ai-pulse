# PackyAPI 能力边界

核对来源为 PackyAPI 官方页面和文档。

## 结论

PackyAPI 可以处理摘要、分类和 JSON 生成，但不能获取 X 推文。

```text
公开或授权数据源 → 原始内容 → PackyAPI 分析 → 预览 JSON
```

## 可用能力

- Base URL：`https://cf.api.fan/v1`
- 鉴权：`Authorization: Bearer <sk-...>`
- OpenAI 兼容端点：`/v1/chat/completions`、`/v1/responses`
- 模型和令牌分组以控制台当前列表为准。

## 不支持的能力

官方 Grok Build 文档要求：

```toml
supports_backend_search = false
```

因此不能把原脚本的 `x_search` 请求直接改发 PackyAPI。Responses API 协议兼容也不等于支持 xAI 的服务端搜索工具。

来源：[Grok Build 配置](https://docs.packyapi.ai/docs/cli/6-grok-build.html)

## 使用风险

- 请求会转发给第三方上游模型。
- 只发送公开内容，不发送 Cookie、用户资料、数据库地址或其他密钥。
- Key 仅保存在服务端环境变量。
- 为测试令牌设置低额度和有效期。
- 模型可能返回无效 JSON 或补充输入外事实，必须本地校验。
- 请求失败时保留旧数据，不覆盖正式文件。

## 官方参考

- [创建 API 令牌](https://docs.packyapi.ai/docs/register/4-token.html)
- [Grok Build 配置](https://docs.packyapi.ai/docs/cli/6-grok-build.html)
- [服务条款](https://docs.packyapi.ai/docs/tos/TOS.html)
- [服务特定条款](https://docs.packyapi.ai/docs/tos/service-specific-terms.html)
