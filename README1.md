# 🧠 灵愈AI · MindCareAI

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?style=flat-square&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.11-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Radix UI](https://img.shields.io/badge/Radix%20UI-latest-161618?style=flat-square&logo=radixui&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-2.76.1-3ECF8E?style=flat-square&logo=supabase&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![Deno](https://img.shields.io/badge/Deno-Edge%20Functions-70FFAF?style=flat-square&logo=deno&logoColor=black) ![Volc Engine](https://img.shields.io/badge/Volc%20Doubao-LLM-FF0000?style=flat-square) ![ModelScope](https://img.shields.io/badge/ModelScope-Multimodal-6B4FBB?style=flat-square) ![SiliconFlow](https://img.shields.io/badge/SiliconFlow-ASR-FF6F00?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**🌟 基于多模态 AI 的"评估 → 疗愈 → 干预"全链路心理健康平台**

[在线体验](https://k.playe.top/) · [核心功能](#-核心功能模块与工作流程) · [部署指南](#️-部署指南) · [API 接口](#-api-接口) · [总结与展望](#-总结与展望)

</div>

---

## 📋 项目简介

**MindCareAI（灵愈AI）** 是一款面向普通用户与心理医生的多端心理健康平台（Web / H5 / Android / iOS / Windows），通过整合**智能手环生理数据**、**多模态 AI 情绪识别**（文本、语音、面部表情、HTP 绘画）、**主动式 AI 对话评估**与**个性化疗愈方案**，为用户提供一站式心理健康管理服务。

- 🎯 **产品定位**：低门槛、高精准、人性化、无压力的抑郁检测与疗愈平台
- 💡 **核心价值**：解决用户「不敢看医生、看不起医生、看了没后续」和医生「看不准、管不了」的双端痛点
- 🔗 **上线地址**：https://k.playe.top/
- 🧩 **核心模块**：AI 评估、智能疗愈、健康监测、医生后台四大模块，28 个子功能

### ✨ 核心亮点

| 能力 | 描述 |
|------|------|
| 🤖 多模态 AI 评估 | 文本 + 语音 + 微表情 + HTP 绘画四模态融合分析 |
| 📋 AI 量表对话 | PHQ-9、HAMD-17、GAD-7 等专业量表的智能对话式评估，支持中断恢复 |
| 🧘 沉浸式冥想 | 3D 呼吸动画、专业音频、冥想视频指导、练习统计 |
| 👥 匿名树洞社区 | 隐私保护下的情感支持与康复经验分享 |
| 📝 多模态情绪日记 | 文本 / 语音 / 图片多模态记录，情绪趋势分析 |
| ⌚ 智能手环集成 | 实时同步心率、血氧、体温、压力、睡眠数据，AI 健康评估 |
| 📚 RAG 知识库 | 文档上传 + RAG 检索 + 视频播放的专业心理健康知识库 |
| 👨‍⚕️ 医生后台 | 患者管理、风险预警、知识库管理、验证码注册系统 |

---

## 🛠️ 技术栈

### 🎨 前端技术

| 技术 | 版本 | 用途 | 特性 |
|------|------|------|------|
| **React** | 18.3.1 | UI 框架 | Hooks、Concurrent Features |
| **TypeScript** | 5.9.3 | 类型安全 | 严格类型检查、智能提示 |
| **Vite** | 5.1.4 | 构建工具 | HMR、ESM、插件生态 |
| **Tailwind CSS** | 3.4.11 | 原子化 CSS | JIT 编译、响应式 |
| **Radix UI** | latest | 无障碍组件库 | WAI-ARIA、键盘导航 |
| **Lucide React** | 0.553.0 | 图标库 | 1000+ 现代图标 |
| **React Router** | 6.28.0 | 客户端路由 | HashRouter、嵌套路由 |
| **React Hook Form** + **Zod** | 7.66 / 3.25 | 表单与校验 | 最小重渲染、Schema 校验 |
| **Framer Motion** + **Motion** | 12.x | 动画 | 手势、布局动画、页面过渡 |
| **Recharts** | 2.15.4 | 数据可视化 | 趋势图、健康评分图表 |
| **date-fns** | 3.6.0 | 日期处理 | 函数式、国际化 |
| **Embla Carousel** | 8.6.0 | 轮播组件 | 轻量、可拖拽 |
| **html2canvas** + **jsPDF** | 1.4 / 4.0 | 报告导出 | 截图、PDF 生成 |
| **react-dropzone** | 14.3.8 | 文件上传 | 拖拽、图片压缩 |
| **streamdown** + **eventsource-parser** | 1.4 / 3.0 | 流式渲染 | SSE、AI 对话流式输出 |
| **sonner** + **@radix-ui/react-toast** | 2.0 / 1.2 | 消息提示 | 全局通知 |
| **miaoda-auth-react** + **miaoda-sc-plugin** | 2.0 / 1.0 | 平台 SDK | 用户认证、魔搭创空间集成 |

### 🗄️ 后端服务

| 技术 | 版本 | 用途 | 特性 |
|------|------|------|------|
| **Supabase** | 2.76.1 | 后端即服务（BaaS） | 实时数据库、认证、存储一体化 |
| **PostgreSQL** | 15+ | 关系型数据库 | ACID 事务、JSONB、行级安全（RLS） |
| **Supabase Edge Functions** | latest | 无服务器函数 | Deno 运行时、全球边缘部署 |
| **Supabase Auth** | latest | 用户认证 | JWT、OAuth、MFA、用户名注册 |
| **Supabase Storage** | latest | 文件存储 | CDN、图片 / 文档桶、公开 / 私有策略 |
| **Row Level Security (RLS)** | latest | 数据安全 | 细粒度行级权限控制 |
| **Vercel Serverless API** | latest | 前端代理 | 隐藏 AI 密钥、转发第三方接口 |
| **Nginx** | latest | 静态服务 | Gzip、SPA fallback、安全头（魔搭创空间部署） |

### 🤖 AI 服务

| 服务 | 模型 / 能力 | 用途 | 特性 |
|------|------------|------|------|
| **火山引擎豆包大模型** | Doubao LLM | AI 主动式量表对话、共情洞察、报告生成 | 中文优化、流式输出、上下文记忆 |
| **魔搭 ModelScope** | 多模态大模型 | 图片情绪识别、视频表情分析、HTP 绘画分析 | 表情识别、场景理解 |
| **硅基流动 SiliconFlow** | ASR 语音识别 | 语音转文字、语音情绪识别 | 实时识别、高准确率、中文优化 |
| **RAG 检索增强** | 自研 Pipeline | 医疗知识库问答、文档语义检索 | 文档解析、向量匹配、上下文注入 |
| **多模态融合算法** | 加权融合（文本 40% / 图 20% / 语音 20% / 视频 20%） | 综合情绪评分 | 动态权重调整、缺失模态自适应 |

---

## 📁 目录结构

```text
MindCareAI/
├── 📄 README.md / README1.md           # 项目说明文档
├── 📄 package.json                     # 依赖配置（pnpm 10.0.0）
├── 📄 vite.config.ts / vite.config.dev.ts  # Vite 构建配置
├── 📄 tailwind.config.js / postcss.config.js  # 样式配置
├── 📄 tsconfig.json / tsconfig.check.json    # TypeScript 配置
├── 📄 components.json                  # Radix UI / shadcn 组件配置
├── 📄 biome.json / sgconfig.yml        # 代码检查与 AST 配置
├── 📄 vercel.json                      # Vercel 部署与路由重写
├── 📄 nginx.conf                       # 魔搭创空间 Nginx 配置
├── 📄 .env.example                     # 环境变量模板
├── 📁 .rules/                          # 代码检查规则与脚本
├── 📁 public/                          # 静态资源
│   ├── 📁 images/                      # Logo、错误页、网格背景
│   ├── 📁 srcs/
│   │   ├── 📁 enjoy/                   # 情绪插画（喜悦/悲伤/害怕…）
│   │   ├── 📁 img/                     # 演示图与医生头像
│   │   ├── 📁 music/                   # 冥想音频（5首）
│   │   └── 📁 video/                   # 心理健康科普视频（3个）
│   └── 📄 mindcareai_pitch.html        # 项目路演 Pitch 页
├── 📁 api/                             # Vercel Serverless 代理（隐藏密钥）
│   ├── 📁 volc/responses.ts            # 火山引擎豆包代理
│   ├── 📁 siliconflow/audio/transcriptions.ts  # 硅基流动 ASR 代理
│   └── 📁 modelscope/chat/completions.ts       # 魔搭多模态代理
├── 📁 src/
│   ├── 📄 App.tsx                      # 应用根组件（Router + Layout）
│   ├── 📄 main.tsx                     # 入口文件
│   ├── 📄 routes.tsx                   # 路由配置（用户端 + 医生端）
│   ├── 📄 index.css                    # 全局样式
│   ├── 📁 components/
│   │   ├── 📁 ui/                      # 40+ Radix 基础组件（shadcn/ui）
│   │   ├── 📁 common/                  # ErrorBoundary / RouteGuard / PageMeta
│   │   ├── 📁 layouts/                 # UserLayout / DoctorLayout
│   │   ├── 📁 assessment/              # 评估：表情/语音/量表/融合报告
│   │   ├── 📁 healing/                 # 疗愈：冥想播放器/视频/知识/HTP/日记
│   │   ├── 📁 home/                    # 首页情绪头像
│   │   ├── 📁 record/                  # 日记：情绪反馈/快速笔记/详情
│   │   ├── 📁 profile/                 # 个人：手环卡/健康报告/体征图表
│   │   ├── 📁 doctor/                  # 医生验证码管理
│   │   ├── 📁 knowledge/               # 量表管理
│   │   └── 📁 test/                    # 开发测试组件
│   ├── 📁 pages/
│   │   ├── 📄 HomePage.tsx             # 首页
│   │   ├── 📄 RecordPageNew.tsx        # 情绪日记
│   │   ├── 📄 EnhancedAssessmentPage.tsx  # AI 多模态评估
│   │   ├── 📄 HTPEvaluationPage.tsx    # 房树人绘画评估
│   │   ├── 📄 HealingPageNew.tsx       # 疗愈中心
│   │   ├── 📄 ProfilePageRedesigned.tsx  # 个人中心
│   │   ├── 📄 SmartBandPage.tsx        # 智能手环
│   │   ├── 📄 LoginPage.tsx            # 登录
│   │   └── 📁 doctor/                  # 医生后台（看板/患者/知识/预警）
│   ├── 📁 contexts/AuthContext.tsx     # 认证上下文
│   ├── 📁 hooks/                       # use-smart-band / use-assessment-persistence / use-toast …
│   ├── 📁 db/                          # supabase.ts / api.ts / modelscope.ts / siliconflow.ts / volc.ts
│   ├── 📁 types/                       # TypeScript 类型定义
│   ├── 📁 lib/utils.ts                 # 通用工具
│   ├── 📁 utils/                       # audio / sse / validation / mockData
│   └── 📁 services/                    # 业务服务占位
├── 📁 supabase/
│   ├── 📄 config.toml                  # Supabase 项目配置
│   ├── 📁 functions/                   # 9 个 Edge Functions
│   │   ├── 📁 text-chat/               # 文本对话
│   │   ├── 📁 chat-completion/         # 聊天补全
│   │   ├── 📁 multimodal-chat/         # 多模态对话
│   │   ├── 📁 multimodal-analysis/     # 多模态分析
│   │   ├── 📁 multimodal-fusion/       # 多模态融合
│   │   ├── 📁 speech-recognition/      # 语音识别
│   │   ├── 📁 parse-document/          # 文档解析
│   │   ├── 📁 rag-retrieval/           # RAG 检索
│   │   └── 📁 auth-username-signup/    # 用户名注册
│   └── 📁 migrations/                  # 27 个 SQL 迁移文件
├── 📁 scripts/                         # 数据迁移、种子、运维脚本
└── 📁 docs/                            # 产品文档（v2/v3/v4/v5/agent/rag/cools）
```

---

## ⚡ 核心功能模块与工作流程

### 🔄 系统总工作流

```text
┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│  数据采集  │ →  │  AI 多模态评估 │ →  │  个性化疗愈方案 │ →  │  医生专业干预  │
│ ─────────│    ─────────────│    ─────────────│    ──────────────│
│ 智能手环  │    文本 NLP     │    冥想音频/视频 │    风险预警推送  │
│ 情绪日记  │    语音情绪识别  │    树洞匿名社区  │    患者病历查看  │
│ 用户对话  │    面部表情识别  │    知识库 RAG   │    远程对接咨询  │
│ HTP 绘画  │    多模态融合   │    健康追踪     │    康复进度管理  │
└──────────┘    └─────────────┘    └─────────────┘    └──────────────┘
                       ↓
              📊 风险等级评估 + 📥 PDF 报告导出
```

### 🏠 1. 首页模块（HomePage）
- 智能问候系统（时间 / 天气感知）
- SVG 圆形健康评分仪表盘 + 连续打卡统计
- 2×2 快捷功能入口 + 个性化每日建议
- 最近评估结果与趋势展示

### 🧠 2. AI 多模态评估模块（EnhancedAssessmentPage + HTPEvaluationPage）
**工作流程**：用户进入 → 选择量表 → AI 流式对话 → 多模态数据采集（文本 / 语音 / 表情 / 绘画）→ 多模态融合算法 → 风险等级评估 → 报告生成与导出

| 子能力 | 说明 |
|--------|------|
| 📝 文本情绪分析 | NLP 识别情绪倾向与风险因子 |
| 🎤 语音情感识别 | 声纹分析、语调变化检测 |
| 📷 面部表情识别 | 实时微表情检测、支持重试 |
| 🎨 HTP 房树人绘画 | 投射心理学绘画分析 |
| 🤖 流式 AI 对话 | 豆包大模型驱动、上下文记忆 |
| 📋 标准化量表 | PHQ-9 / GAD-7 / HAMD-17 |
| 💾 评估持久化 | 未完成自动保存、支持恢复 |
| 📊 风险等级评估 | 低 / 中 / 高三级分级 + 自动预警 |
| 📥 报告导出 | html2canvas + jsPDF 生成 PDF |

### 🧘 3. 智能疗愈模块（HealingPageNew）
| Tab | 功能 |
|-----|------|
| 🎵 冥想 | 高品质音频播放器、3D 同心圆呼吸动画、分类冥想库、练习时长统计 |
| 🌳 树洞 | 匿名昵称、加密存储、AI+人工审核、康复故事精选、点赞评论 |
| 📝 日记 | 多模态输入（语音 / 图片）、农历日历、情绪色彩标记、趋势分析 |
| 📚 知识 | 全文搜索、文档上传（PDF/Word）、RAG 检索、视频教学、点赞收藏 |
| 🎮 游戏 | 趣味心理小游戏辅助疗愈 |
| 🎬 视频 | 专业冥想 / 睡眠 / 运动心理视频指导 |

### ⌚ 4. 智能手环模块（SmartBandPage）
**工作流程**：设备扫描 → 蓝牙连接（或模拟模式）→ 实时数据同步 → Recharts 可视化 → AI 健康评估 → 异常预警

- ❤️ 心率 / 🫁 血氧 / 🌡️ 体温 / 😰 压力 / 👟 步数 / 😴 睡眠 六大指标
- 日 / 周 / 月时间范围切换 + 渐变卡片设计
- AI 综合健康评估与个性化建议

### 👤 5. 个人中心模块（ProfilePageRedesigned）
- 头像背景自定义、中文用户名、微信号绑定
- 健康评分趋势 + 评估历史 + 成就系统
- 设备连接、医生对接、隐私设置、会员订阅入口

### 👨‍⚕️ 6. 医生后台模块（DoctorLayout）
| 页面 | 功能 |
|------|------|
| 📊 数据看板（DashboardPage） | 患者统计、风险预警、整体康复趋势 |
| 👥 患者管理（PatientsPage） | 患者列表、病历查看、沟通记录、康复进度 |
| 📚 知识库（KnowledgePage） | 医学知识管理、文档上传、RAG 检索、诊疗指南 |
| 🚨 预警消息（AlertsPage） | 高风险患者自动识别、处理记录、效果评估 |
| 🔐 验证码注册 | 医生身份验证码注册系统（VerificationCodeManager） |

---

## ⚙️ 部署指南

### 📋 环境要求
- **Node.js** ≥ 20.0.0（推荐 LTS）
- **pnpm** ≥ 8.0.0（项目使用 pnpm 10.0.0）
- **现代浏览器**：Chrome 88+ / Edge 88+ / Safari 14+ / Firefox 78+（需 WebRTC、Web Audio API、Canvas）

### 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/your-org/MindCareAI.git
cd MindCareAI

# 2. 安装依赖（推荐 pnpm）
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 与 AI 服务密钥

# 4. 启动开发服务器
pnpm run dev
# ➜  Local:   http://localhost:5173/
```

### 🔑 环境变量配置

```env
# ============ Supabase ============
VITE_APP_ID=your-app-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_OFFLINE=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============ AI 服务 ============
VOLC_ARK_API_KEY=your-volc-ark-key         # 火山引擎豆包
VITE_VOLC_ARK_API_KEY=your-volc-ark-key
SILICONFLOW_API_KEY=your-siliconflow-key    # 硅基流动 ASR
VITE_SILICONFLOW_API_KEY=your-siliconflow-key
MODELSCOPE_API_KEY=your-modelscope-key      # 魔搭多模态
VITE_MODELSCOPE_API_KEY=your-modelscope-key

# ============ 数据迁移（可选） ============
MIGRATE_TARGET_SUPABASE_URL=https://your-project.supabase.co
MIGRATE_TARGET_SERVICE_ROLE_KEY=your-service-role-key
```

### 🏗️ 构建与数据库管理

```bash
# 构建
pnpm run build          # 产物输出至 dist/
pnpm run preview        # 本地预览构建结果

# 代码检查
pnpm run lint           # tsc + biome + 自定义规则 + tailwind 检查

# 数据库与种子
pnpm run migrate:supabase    # 数据库迁移
pnpm run sync:realtime       # 实时数据同步
pnpm run verify:migration    # 迁移验证
pnpm run seed:treehole       # 树洞示例数据
pnpm run seed:knowledge      # 知识库示例数据
pnpm run seed:video          # 视频知识库数据
pnpm run promote:user        # 用户权限提升
```

### ☁️ 部署方案

#### 方案 A：Vercel 部署（推荐，已配置）
项目已内置 `vercel.json`，自动处理 API 代理路由重写：

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/innerapi/v1/volc/responses", "destination": "/api/volc/responses" },
    { "source": "/innerapi/v1/siliconflow/audio/transcriptions", "destination": "/api/siliconflow/audio/transcriptions" },
    { "source": "/innerapi/v1/modelscope/chat/completions", "destination": "/api/modelscope/chat/completions" }
  ]
}
```

```bash
npm i -g vercel
vercel --prod
# 在 Vercel 后台配置所有必需环境变量
```

#### 方案 B：魔搭创空间 Nginx 部署
项目已内置 `nginx.conf`，监听 7860 端口、SPA fallback、Gzip、安全头、CORS：

```bash
# 构建后将 dist/ 内容复制到 /usr/share/nginx/html
pnpm run build
# 启动 nginx（魔搭创空间会自动监听 7860 端口）
```

#### 方案 C：Supabase 后端配置
1. 创建 Supabase 项目，获取 URL 与 API Key
2. 执行 27 个迁移文件（位于 `supabase/migrations/`）创建表结构
3. 创建存储桶：`diary-images`、`knowledge-documents`
4. 部署 9 个 Edge Functions：

```bash
npm install -g supabase
supabase login
supabase functions deploy text-chat
supabase functions deploy chat-completion
supabase functions deploy multimodal-chat
supabase functions deploy multimodal-analysis
supabase functions deploy multimodal-fusion
supabase functions deploy speech-recognition
supabase functions deploy parse-document
supabase functions deploy rag-retrieval
supabase functions deploy auth-username-signup
```

---

## 📦 API 接口

### 🤖 AI 评估接口（Supabase Edge Functions）

| 接口 | 方法 | 路径 | 功能 | 响应类型 |
|------|------|------|------|---------|
| 文本对话 | POST | `/functions/v1/text-chat` | AI 流式文本对话 | Stream |
| 聊天补全 | POST | `/functions/v1/chat-completion` | 通用聊天补全 | Stream / JSON |
| 多模态对话 | POST | `/functions/v1/multimodal-chat` | 图文多模态对话 | Stream |
| 多模态分析 | POST | `/functions/v1/multimodal-analysis` | 单模态情绪分析 | JSON |
| 多模态融合 | POST | `/functions/v1/multimodal-fusion` | 文本/图/语音/视频加权融合评分 | JSON |
| 语音识别 | POST | `/functions/v1/speech-recognition` | 语音转文字 | JSON |
| 文档解析 | POST | `/functions/v1/parse-document` | PDF/Word 文档解析 | JSON |
| RAG 检索 | POST | `/functions/v1/rag-retrieval` | 知识库语义检索 | JSON |
| 用户名注册 | POST | `/functions/v1/auth-username-signup` | 用户名 + 密码注册 | JSON |

### 🔌 AI 服务代理接口（Vercel Serverless API）

| 接口 | 方法 | 内部路径 | 上游服务 | 用途 |
|------|------|---------|---------|------|
| 豆包代理 | POST | `/innerapi/v1/volc/responses` → `/api/volc/responses` | 火山引擎 Ark | 隐藏 API Key 转发 |
| ASR 代理 | POST | `/innerapi/v1/siliconflow/audio/transcriptions` → `/api/siliconflow/audio/transcriptions` | 硅基流动 | 语音识别转发 |
| 多模态代理 | POST | `/innerapi/v1/modelscope/chat/completions` → `/api/modelscope/chat/completions` | 魔搭 ModelScope | 多模态聊天转发 |

### 🗄️ 数据库接口（src/db/api.ts 封装）

| 模块 | 主要函数 | 数据表 |
|------|---------|--------|
| 用户档案 | `getProfile` / `updateProfile` / `getAllProfiles` | `profiles` |
| 情绪日记 | `getEmotionDiaries` / `getEmotionDiaryByDate` / `createEmotionDiary` / `updateEmotionDiary` / `deleteEmotionDiary` | `emotion_diaries` |
| 评估记录 | `getAssessments` / `getAssessmentById` / `createAssessment` / `updateAssessment` | `assessments` |
| 手环数据 | `getWearableData` / `getWearableDataByDateRange` | `wearable_data` |
| 社区树洞 | 帖子 / 评论 CRUD | `community_posts` / `community_comments` |
| 疗愈内容 | 冥想 / 视频 / 文章 / 游戏管理 | `healing_contents` |
| 知识库 | 文章 / 文档管理 | `knowledge_base` |
| 医患关系 | 医生患者绑定 | `doctor_patients` |
| 风险预警 | 预警记录管理 | `risk_alerts` |
| 疗愈记录 | 用户练习记录 | `user_healing_records` |

### 📡 接口请求示例

```typescript
// 文本对话（流式）
POST /functions/v1/text-chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "我最近总是失眠",
  "conversation_history": [{ "role": "user", "content": "..." }]
}

// Response: Stream<{ "content": "string", "done": boolean }>

// 多模态融合
POST /functions/v1/multimodal-fusion
Content-Type: application/json

{
  "text_analysis": { "emotion_score": 6 },
  "image_analysis": { "emotion_score": 5 },
  "voice_analysis": { "emotion_score": 7 },
  "video_analysis": { "emotion_score": 0 },
  "user_id": "uuid",
  "assessment_id": "uuid"
}

// Response: { "fused_score": 6.2, "risk_level": "moderate", ... }
```

---

## 💡 总结与展望

### 🎯 项目总结

MindCareAI 是**国内首个基于多模态大模型的全链路心理健康服务平台**，已交付 1.0 复赛版本，达成以下成果：

| 维度 | 成果 |
|------|------|
| 🧩 功能覆盖 | 4 大核心模块、28 个子功能、100% 参赛要求功能点 |
| ⚡ 性能 | 首屏加载 1.5s、页面切换 < 100ms、AI 响应 < 2s |
| 🛡️ 稳定性 | 生产环境级 99.9%、全链路压测通过、接口超时兜底机制 |
| 📦 资源 | 50+ 心理疗愈资源、100+ 示例数据、27 个数据库迁移 |
| 🎬 交付物 | 演示视频、12 页 PPT、1 万字文档、部署说明齐备 |

### 🌟 核心创新

1. **多模态融合评估算法** — 文本 40% / 图 20% / 语音 20% / 视频 20% 的动态权重融合，缺失模态自动重分配
2. **AI 主动式量表对话** — 豆包大模型驱动 PHQ-9 等专业量表对话化评估，支持中断恢复
3. **RAG 知识库增强** — 文档上传 + 语义检索 + 上下文注入，专业医疗知识问答
4. **智能手环 + AI 联动** — 生理数据与情绪数据联合分析，预测心理健康状态
5. **双端协同闭环** — 用户端评估疗愈 + 医生端预警干预，形成完整服务链路

### 🚀 未来规划

#### 📅 近期计划（2026 Q3）
- [ ] **PWA 支持** — 离线使用与桌面安装
- [ ] **国际化** — 英文 / 日文多语言
- [ ] **真机手环 SDK 对接** — 替换模拟数据为真实蓝牙协议
- [ ] **HTP 绘画深度分析** — 强化房树人投射心理学算法

#### 📅 中期计划（2026 Q4 - 2027 Q1）
- [ ] **视频通话咨询** — 在线心理医生一对一咨询
- [ ] **群组疗愈** — 多人冥想与互助小组
- [ ] **开放 API** — 第三方医疗机构集成
- [ ] **深度数据分析** — 长期健康趋势洞察报告

#### 📅 长期愿景（2027+）
- [ ] **VR/AR 沉浸式疗愈** — 虚拟现实冥想场景
- [ ] **AI 医生诊断助手** — 专业级辅助诊断
- [ ] **科研合作** — 与医疗机构联合临床研究
- [ ] **生态平台** — 完整的心理健康服务生态

---

<div align="center">

**🌟 如果这个项目对你有帮助，请给我们一个 Star！**

**让我们一起为心理健康事业贡献力量** 💪

Made with ❤️ by [灵愈AI 团队](https://github.com/wyxpro/MindCareAI) · [在线体验](https://k.playe.top/)

</div>
