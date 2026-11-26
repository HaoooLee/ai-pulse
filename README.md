# AI Pulse - AI前沿资讯聚合 

<p align="center">
  <strong>追踪AI领域最前沿的声音</strong>
</p>

我们的运行说明见[交接文档](handoff/README.md)，包含 Grok 配置、一行抓取和人物名单维护。

聚合大模型与 AI Infra 人物的 X 动态，提供 Grok 中文解读和学术前沿。

## 功能特性

- **大V动态追踪**：覆盖OpenAI、Google DeepMind、Anthropic、xAI四大实验室及顶尖独立研究者
- **AI深度解读**：每条推文都经过Grok AI分析，提供技术背景和行业影响解读
- **学术前沿**：聚合最新AI论文、开源项目和技术突破
- **定时更新**：通过 GitHub Actions 每天获取最新数据
- **收藏功能**：支持本地收藏推文和学术项目
- **响应式设计**：适配桌面和移动端

## 技术架构

- **前端**：React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **数据获取**：Python脚本 + xAI Grok API（Responses API with X Search）
- **自动化**：GitHub Actions 每天定时运行
- **部署**：Vercel

## 配色方案

采用 **Editorial Warmth** 设计风格：
- 主色调：Claude橘色 `#E8734A`
- 背景色：米白 `#FAF7F2`
- 字体：Playfair Display（标题）+ Source Sans 3（正文）+ JetBrains Mono（标签）

## 快速开始

### 本地开发

使用 Node.js 22+ 和 pnpm。网页登录配置见 [`.env.example`](.env.example)。

```bash
pnpm install
pnpm dev
```

### 手动获取数据

Grok 中转站配置、一行运行和验收结果见[交接说明](handoff/README.md)。

## GitHub Actions 配置

在仓库 Settings > Secrets and variables > Actions 中添加：

| Secret 名称 | 说明 |
|---|---|
| `XAI_API_KEY` | 支持 X Search 的 Grok Key |

使用中转站时，在 Actions Variables 配置 `XAI_API_BASE` 和 `XAI_MODEL`。

## 项目结构

```
ai-pulse/
├── client/                 # 前端代码
│   ├── public/data/        # JSON数据文件（自动生成）
│   ├── src/
│   │   ├── components/     # UI组件
│   │   ├── contexts/       # React Context
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── pages/          # 页面组件
│   │   └── lib/            # 工具函数
│   └── index.html
├── scripts/
│   ├── fetch_data.py       # 数据获取脚本
│   └── influencers.json    # 追踪人物配置
├── .github/workflows/
│   ├── fetch-data.yml      # 定时数据获取
│   └── deploy.yml          # Vercel 部署
└── README.md
```

## 追踪人物

覆盖以下类别的AI领域关键人物：

| 类别 | 代表人物 |
|---|---|
| OpenAI | Sam Altman, Greg Brockman, Mark Chen, Wojciech Zaremba |
| Google DeepMind | Demis Hassabis, Jeff Dean, Oriol Vinyals |
| Anthropic | Dario Amodei, Jack Clark, Chris Olah, Amanda Askell |
| xAI | Elon Musk, Greg Yang |
| 顶尖研究者 | Andrej Karpathy, Jim Fan, Yann LeCun, George Hotz |
| 行业领袖 | Clément Delangue, Arthur Mensch, Ilya Sutskever |
| 学术博主 | AK, Sebastian Raschka, François Chollet, Soumith Chintala |

## 许可证

MIT License
