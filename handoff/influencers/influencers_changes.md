# AI Pulse 人物信源补充与修正说明

核验日期：2026-10-02。基于 HaoooLee/ai-pulse 的 scripts/influencers.json，原文件 SHA：8cf77bdb2ec0663aa4a7493c773f7656266ab9fb。

## 可复制的任务说明

审查并扩充 HaoooLee/ai-pulse 的 scripts/influencers.json，将人物信源聚焦“大模型与 AI Infra”。

优先覆盖国内外头部模型公司和基础设施公司的科技领袖、创始人、技术及研究负责人，以及持续输出高质量内容的大模型研究者和技术自媒体。师兄已列出的人物都要纳入审查，补齐唐杰、黄仁勋等关键人物；在此前建议名单中再选 4—5 位关键研究或 Infra 人物补充。

逐条核验人物身份、X 账号、当前任职和分类，修正错号、过期职务和错误描述，去除重复条目。无法核实的账号列为待确认，避免误采同名账号。

按最小化原则，仅修改该 JSON 的必要条目，沿用现有字段和分类结构。交付完整配置及新增、修改、待确认清单，附核验来源；确认 JSON 可解析、账号无重复、分类引用有效。

## 最终运行配置

- 原配置 71 条；新增 8 条、修改 29 条、暂移除 4 条，最终 75 条。
- 师兄最初列出的 25 位人物在修改版中均有对应条目。
- 原名单缺少唐杰、George Hotz；另补黄仁勋。额外选取的 5 位为 Jakub Pachocki、Tom Brown、Tianqi Chen、Woosuk Kwon、Lianmin Zheng。
- categories 和 academic_categories 原样保留；新增条目均使用已有分类。Infra 人物暂归入现有 llm_research。
- 本目录完整 JSON 与 `scripts/influencers.json` 一致；保留原字段、分类及存量顺序。未修改条目不代表其每项职务均已独立核实。
- 正式更新使用官方 RSS + PackyAPI，不依赖 X 搜索；人物关联仅依据原文作者、明确姓名或账号提及。

## 新增人物

| 人物 | X handle | 收录理由 / 身份 | 分类 | 核验来源 |
|---|---|---|---|---|
| Jakub Pachocki | `merettm` | OpenAI 首席科学家 | `openai` | [OpenAI 官方首席科学家访谈](https://openai.com/index/an-alien-mind/)；[X 账号身份参考](https://x.com/merettm) |
| Tom Brown | `NotTomBrown` | Anthropic 联合创始人兼首席算力官 | `anthropic` | [Anthropic 官方领导团队页](https://www.anthropic.com/company/leadership)；[本人 GitHub（含 X 链接）](https://gist.github.com/nottombrown) |
| George Hotz | `realGeorgeHotz` | tinygrad 创始人（深度学习框架 / 编译） | `researchers` | [tinygrad 项目](https://github.com/tinygrad)；[本人 X 简介](https://x.com/realGeorgeHotz) |
| Jie Tang (唐杰) | `jietang` | 清华大学教授 / 智谱创始人（GLM） | `leaders` | [本人 X](https://x.com/jietang)；[本人 GLM 相关发布](https://x.com/jietang/status/2089941544581403107) |
| Jensen Huang (黄仁勋) | `JensenHuang` | NVIDIA 创始人兼 CEO（GPU / AI Infra） | `leaders` | [NVIDIA 官方人物介绍](https://nvidianews.nvidia.com/bios/jensen-huang)；[NVIDIA 官方 X 对 CEO 账号的引用](https://x.com/nvidia/status/2100593782911582578) |
| Tianqi Chen | `tqchenml` | CMU 副教授 / NVIDIA 杰出工程师（TVM / MLC） | `llm_research` | [本人主页（含 X 链接）](https://tqchen.com/) |
| Woosuk Kwon | `woosuk_k` | vLLM 联合负责人 / Inferact CTO | `llm_research` | [本人主页（含 X 链接）](https://woosuk.me/) |
| Lianmin Zheng | `lm_zheng` | Meta 推理团队 / SGLang 核心发起者 / LMSYS 联合创始人 | `llm_research` | [本人主页（含 X 链接及项目经历）](https://lmzheng.net/) |

## 修改现有条目

| 人物 | 原配置 | 修改后 | 依据 |
|---|---|---|---|
| Shunyu Yao | OpenAI 研究员 (ReAct/Agent)；`openai` | 腾讯首席 AI 科学家（大模型 / AI Infra）；`leaders` | [腾讯云官方活动介绍](https://developer.cloud.tencent.com/article/2684035) |
| Demis Hassabis | DeepMind CEO & 诺贝尔奖得主；`deepmind` | Google DeepMind 主席 / Alphabet 首席科学家（诺贝尔奖）；`deepmind` | [Google 官方人事公告](https://blog.google/company-news/inside-google/message-ceo/next-chapter-ai-momentum/) |
| Jeff Dean | Google 首席科学家；`deepmind` | Discovery Loop 联合创始人兼 CEO（前 Google 首席科学家）；`leaders` | [Google 官方人事公告](https://blog.google/company-news/inside-google/message-ceo/next-chapter-ai-momentum/) |
| Oriol Vinyals | DeepMind 研究副总裁；`deepmind` | Discovery Loop 联合创始人兼 CTO（前 Google DeepMind 研究副总裁）；`leaders` | [Reuters 关于离职及创办公司的报道](https://www.reuters.com/business/google-shakes-up-ai-leadership-deepmind-chief-shifts-role-2026-08-05/) |
| Koray Kavukcuoglu | DeepMind CTO；`deepmind` | Google DeepMind 高级副总裁 / Google 首席 AI 架构师；`deepmind` | [Google 官方人事公告](https://blog.google/company-news/inside-google/message-ceo/next-chapter-ai-momentum/) |
| Saining Xie | DeepMind/NYU 研究员 (DiT)；`deepmind` | AMI Labs 联合创始人兼首席科学官 / NYU 教授；`researchers` | [本人主页](https://www.sainingxie.com/) |
| Jack Clark | Anthropic 联合创始人；`anthropic` | Anthropic 联合创始人 / 公共利益负责人；`anthropic` | [Anthropic 官方领导团队页](https://www.anthropic.com/company/leadership) |
| Chris Olah | Anthropic 可解释性研究；`anthropic` | Anthropic 联合创始人 / 可解释性研究负责人；`anthropic` | [Anthropic 官方领导团队页](https://www.anthropic.com/company/leadership) |
| Yao Fu | xAI Scaling工程师；`xai` | 大模型预训练与 Scaling 研究者（前 xAI / Google DeepMind）；`llm_research` | [本人 X 公开资料](https://x.com/Francis_YAO_) |
| Jim Fan | NVIDIA 高级研究科学家；`researchers` | NVIDIA 机器人总监 / 杰出科学家（GEAR）；`researchers` | [本人 X 公开资料](https://x.com/DrJimFan) |
| Yann LeCun | Meta 首席AI科学家 (图灵奖)；`researchers` | AMI Labs 执行主席 / NYU 教授（图灵奖）；`researchers` | [本人主页及 AMI Labs 官网](https://yann.lecun.com/) |
| François Chollet | Keras 创始人 (ARC-AGI)；`researchers` | Ndea / ARC Prize 联合创始人，Keras / ARC-AGI 作者；`researchers` | [本人 X 公开资料](https://x.com/fchollet) |
| Soumith Chintala | PyTorch 联合创始人；`researchers` | Thinking Machines Lab 技术团队 / PyTorch 联合创始人；`researchers` | [本人 X 公开资料](https://x.com/soumithchintala) |
| Andrew Ng | DeepLearning.AI 创始人 (图灵奖)；`researchers` | DeepLearning.AI 创始人 / Stanford 兼职教授；`researchers` | [本人主页；纠正错误的图灵奖标注](https://www.andrewng.org/) |
| Clément Delangue | Hugging Face CEO；`leaders` | Hugging Face 联合创始人兼 CEO；`leaders` | [本人 X 公开资料](https://x.com/ClemDelangue) |
| Rohan Paul | AI论文每日解读 (135K关注)；`academic` | AI 论文每日解读；`academic` | 删除易过时的粉丝数；其余描述沿用原配置 |
| Nathan Lambert | Allen AI 研究员 (RLHF/开源LLM)；`llm_research` | Trillium Labs 创始人 / 开源大模型研究者（前 Allen AI）；`llm_research` | [本人 X 公开资料](https://x.com/natolambert) |
| Maxime Labonne | LLM 微调与量化专家；`llm_research` | Liquid AI 后训练负责人（微调 / 量化）；`llm_research` | [本人 X 公开资料](https://x.com/maximelabonne) |
| Tri Dao | FlashAttention & Mamba 作者；`llm_research` | Together AI 联合创始人兼首席科学家 / FlashAttention 作者；`llm_research` | [本人主页](https://tridao.me/) |
| Denny Zhou | Google DeepMind 推理团队负责人 (CoT)；`llm_research` | Meta 超级智能团队 / 前 Google DeepMind 推理团队负责人（CoT）；`llm_research` | [本人 X 公开资料](https://x.com/denny_zhou) |
| Hyung Won Chung | OpenAI 研究员 (指令微调/Scaling)；`llm_research` | Meta 超级智能实验室研究科学家（前 OpenAI / Google Brain）；`llm_research` | [本人 X 公开资料](https://x.com/hwchung27) |
| Lilian Weng | Thinking Machines Lab 联合创始人 (前OpenAI)；`llm_research` | OpenAI 技术团队 / Lil’Log 作者；`llm_research` | [本人 X 公开资料](https://x.com/lilianweng) |
| Sayak Paul | Hugging Face 研究员 (扩散模型)；`llm_research` | Hugging Face 研究员 (扩散模型)；`vision_gen` | [本人 X 公开资料](https://x.com/RisingSayak) |
| Yuchen Jin | Hyperbolic Labs CTO (AI基础设施)；`llm_research` | Databricks AI 系统与产品（前 Hyperbolic 联合创始人兼 CTO）；`llm_research` | [本人 X 公开资料](https://x.com/Yuchenj_UW) |
| Lucas Beyer | Google DeepMind 研究员 (ViT/多模态)；`vision_gen` | Meta 研究员（前 OpenAI / Google DeepMind）；`llm_research` | [本人 X 简介及加入 Meta 的公告](https://x.com/giffmana/status/1938299990922674352) |
| Pieter Abbeel | UC Berkeley 教授 & Covariant CEO；`robotics` | UC Berkeley 教授 / Covariant 联合创始人；`robotics` | [学术机构人物简介；删除错误的 CEO 职务](https://simons.berkeley.edu/people/pieter-abbeel) |
| Deepak Pathak | CMU 教授 & Skild AI CEO (好奇心驱动RL)；`robotics` | CMU 副教授 / Skild AI 联合创始人兼 CEO（机器人基础模型）；`robotics` | [CMU 本人主页（含 X 链接）](https://www.cs.cmu.edu/~dpathak/) |
| Lerrel Pinto | NYU 教授 (家用机器人)；`robotics` | Meta 超级智能实验室机器人联合负责人；`robotics` | [本人 X 公开资料](https://x.com/LerrelPinto) |
| Paul Christiano | 美国AI安全研究所负责人 (RLHF创始人)；`ai_safety` | ARC 创始人 / OpenAI Foundation 董事（对齐 / RLHF）；`ai_safety` | [OpenAI 官方任命公告](https://openai.com/index/paul-christiano-joins-openai-foundation-board/) |

## 暂移除及待确认

Jared Kaplan 是 Anthropic 联合创始人兼首席科学官，人物本身值得追踪，见 [Anthropic 官方领导团队页](https://www.anthropic.com/company/leadership)。但原配置的 `JaredKaplan` 有同名误配证据：[Soap Opera Digest 对电视节目制作人的报道](https://www.soapoperadigest.com/content/oltl-associate-producer-addresses-hiatus/)明确将该账号关联到电视节目制作人，近期搜索到的内容也以电视节目为主。因此暂移除这条采集配置，待找到研究者本人确认的 X 账号再恢复。此前提到的 `kaplanja` 也尚未找到可靠的本人确认，未采用为替换账号。

其余暂移除条目：

- 何恺明：原 `KaimingHe` 页面为“Shanghai University”及中文昵称，与 [MIT 本人主页](https://people.csail.mit.edu/kaiming/)资料不符；正确账号待确认。
- Stuart Russell：原 `StuartJRussell` 页面为英国 Devon 用户的家庭信息，[Berkeley 本人主页](https://people.eecs.berkeley.edu/~russell/)未关联该账号；正确账号待确认。
- Arxiv Sanity：原 `arxiv_sanity` 页面无可核验身份，[官方项目仓库](https://github.com/karpathy/arxiv-sanity-lite)未关联该账号；继续待确认。

Deepak Pathak 的 `pathak2206` 已由 [CMU 本人主页](https://www.cs.cmu.edu/~dpathak/)确认归属，恢复到最终 JSON。公开 X 页面仍返回 404，因此身份已确认、可访问性待恢复，不能认定为错号。

## 验证

最终 JSON 共 75 条，可解析、字段类型正常、账号大小写不敏感去重、分类引用有效。师兄提供的原名单 25 人及补充 5 人全部覆盖，另包含黄仁勋。分类结构未改动。本目录 JSON 与实际运行配置逐字一致。
这些检查不保证每位人物都有个人 RSS 或当前可采集的 X 内容；运行链路及限制见 `../LOCAL_REPRODUCTION.md`。
