# AI Pulse - AI前沿资讯聚合 

<p align="center">
  <strong>追踪AI领域最前沿的声音</strong>
</p>

聚合40+位AI领域顶尖人物的推特动态，通过Grok AI深度解读，每12小时自动更新，为你呈现高信噪比的AI资讯。

## 功能特性

- **大V动态追踪**：覆盖OpenAI、Google DeepMind、Anthropic、xAI四大实验室及顶尖独立研究者
- **AI深度解读**：每条推文都经过Grok AI分析，提供技术背景和行业影响解读
- **学术前沿**：聚合最新AI论文、开源项目和技术突破
- **每12小时自动更新**：通过GitHub Actions定时获取最新数据
- **收藏功能**：支持本地收藏推文和学术项目
- **响应式设计**：适配桌面和移动端

## 技术架构

- **前端**：React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **数据获取**：Python脚本 + xAI Grok API（Responses API with X Search）
- **自动化**：GitHub Actions 每12小时定时运行
- **部署**：GitHub Pages 静态托管

## 配色方案

采用 **Editorial Warmth** 设计风格：
- 主色调：Claude橘色 `#E8734A`
- 背景色：米白 `#FAF7F2`
- 字体：Playfair Display（标题）+ Source Sans 3（正文）+ JetBrains Mono（标签）

## 快速开始

### 本地开发

```bash
pnpm install
pnpm dev
```

### 手动获取数据

```bash
export XAI_API_KEY="your-xai-api-key"
python scripts/fetch_data.py
```

## GitHub Actions 配置

在仓库 Settings > Secrets and variables > Actions 中添加：

| Secret 名称 | 说明 |
|---|---|
| `XAI_API_KEY` | xAI API Key，用于调用Grok API获取推特数据 |

配置完成后，GitHub Actions 会：
1. 每12小时（UTC 00:00 和 12:00）自动运行数据获取脚本
2. 将获取的数据提交到仓库
3. 触发GitHub Pages自动部署

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
│   └── deploy.yml          # GitHub Pages部署
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
